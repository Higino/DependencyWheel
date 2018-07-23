var buildDummydependency = function () {
  var data = {
    packageNames: ['Pricing', 
    'China Backend', 
    'DataIO', 
    'Product', 
    'BI-Opo', 
    'DataIO-Internal', 
    'Order Management', 
    'P&I Platform', 
    'Shanghai WeChat', 
    'China Mobile App', 
    'Finance', 
    'Integration Projects', 
    'Supply Chain', 
    'Checkout'],
    matrix: [[0, 1, 1], // Main depends on A and B
             [0, 0, 1], // A depends on B
             [0, 0, 0]] // B doesn't depend on A or Main
  };

  var dummyMatrix = [];
  for( var i=0; i < data.packageNames.length; i++){
    var componentDependencies = [];
    for( var ii=0; ii < data.packageNames.length; ii++){
      var value = Math.floor(Math.random() * Math.floor(16));;
      if( value < i )
        value = 0;

      componentDependencies.push(value);
    } 
    dummyMatrix.push(componentDependencies);
  }
  
  data.matrix = dummyMatrix;

  return data;
};

var buildMatrixFromComposerJson = function(composerjson) {
  var n = Object.keys(composerjson.require).length;
  var matrix = [];
  matrix[0] = [0];
  var increment = 0;
  // only the first element depends on others
  for (var i=1; i < n; i++) {
    matrix[0][i] = 1 + increment;
    increment += 0.001;
    matrix[i] = Array.apply(null, new Array(n)).map(Number.prototype.valueOf,0);
    matrix[i][0] = 1;
  }
  var packageNames = Object.keys(composerjson.require);
  packageNames.unshift(composerjson.name);
  
  return {
    matrix: matrix,
    packageNames: packageNames
  }
};

var buildMatrixFromComposerJsonAndLock = function(composerjson, composerlock) {

  var packages = composerlock.packages;
  composerjson.isMain = true;
  packages.unshift(composerjson);

  var indexByName = {};
  var packageNames = {};
  var matrix = [];
  var n = 0;
  var replaces = {};

  // List the replacements
  packages.forEach(function(p) {
    if (!p.replace) return;
    for (replaced in p.replace) {
      replaces[replaced] = p.name;
    }
  });
  
  // update required packages with replacements
  packages.forEach(function(p) {
    for (packageName in p.require) {
      if (packageName in replaces) {
        p.require[replaces[packageName]] = p.require[packageName];
        delete p.require[packageName];
      }
    }
  });

  // Compute a unique index for each package name.
  packages.forEach(function(p) {
    packageName = p.name;
    if (!(packageName in indexByName)) {
      packageNames[n] = packageName;
      indexByName[packageName] = n++;
    }
  });

  // Construct a square matrix counting package requires.
  packages.forEach(function(p) {
    var source = indexByName[p.name];
    var row = matrix[source];
    if (!row) {
     row = matrix[source] = [];
     for (var i = -1; ++i < n;) row[i] = 0;
    }
    for (packageName in p.require) {
      row[indexByName[packageName]]++; 
    }
  });

  // add small increment to equally weighted dependencies to force order
  matrix.forEach(function(row, index) {
    var increment = 0.001;
    for (var i = -1; ++i < n;) {
      var ii = (i + index) % n;
      if (row[ii] == 1) {
        row[ii] += increment;
        increment += 0.001;
      }
    }
  });

  return {
    matrix: matrix,
    packageNames: packageNames
  }
};

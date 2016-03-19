var test = require('tap').test;
var exec = require('child_process').exec;
var path = require('path');
var through = require('through2');
var fs = require('fs');

var basedir = path.resolve(__dirname, '../');
var outputdir = path.join(basedir, 'example', 'output', 'test', 'build');
var dynamicModule = path.join(outputdir, 'dynamic.js');
var requiresDynamicModule = path.join(outputdir, 'requires-dynamic.js');

test('make sure it builds and builds again', function(t) {
  var iterations = 3;

  t.plan(11); // 1 assertion at setup + (3 builds * 3 assertions) + 1 post assertion

  if (!(outputdir.charAt(0) == '/' && outputdir.length > 1)) {
    throw new Error('unsafe outputdir for rm -rf');
  }
  exec('rm -rfv ' + outputdir, function() {
    exec('mkdir -p ' + outputdir, function(err) {
      t.notOk(err, 'dir created');
      fs.writeFileSync(requiresDynamicModule, 'require("./dynamic")');
      build(1, iterations);
    });
  });

  function build(n, nmax) {
    fs.writeFileSync(dynamicModule, 'console.log("' + n + '")');

    var b = make();

    var numChanged = 0;
    var cacheSize = Object.keys(b._options.cache).length;

    b.on('changedDeps', function(invalidated) {
      if (invalidated) numChanged = invalidated.length;
    });

    var outputFile = path.join(outputdir, 'build' + n + '.js');
    b.bundle()
      .pipe(through())
      .on('finish', function() {
        t.ok(true, 'built ' + n + ' times');

        t.ok(
          n == 1 ? numChanged == 0 : numChanged > 0,
          numChanged + ' items invalidated before build ' + n
        );

        // TODO: fix cache load race condition
        t.ok(
          n == 1 ? cacheSize == 0 : cacheSize > 0,
          'cache size ' + cacheSize + ' at start of build ' + n
        );
      })
      .pipe(fs.createWriteStream(outputFile))
      .on('close', function() {
        if (n == nmax) {
          var output = fs.readFileSync(outputFile, {encoding: 'utf8'});
          t.notMatch(output, 'module.exports=module.exports={', "doesn't append json prelude twice");
          t.end();
        } else {
          setTimeout(function() {
            build(n + 1, nmax);
          }, 2000); // mtime resolution can be 1-2s depending on OS
        }
      });
  }
});

function make() {
  var browserifyIncremental = require('../');

  var opts = {cacheFile: path.join(outputdir, 'cache.json')};

  var b = browserifyIncremental(opts);
  b.add(path.join(basedir, 'example/test-module'));
  b.add(requiresDynamicModule);

  return b;
}

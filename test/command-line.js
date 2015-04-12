var test = require("tap").test
var exec = require('child_process').exec
var spawn = require('child_process').spawn
var path = require('path')
var through = require('through2')
var fs = require('fs')
var xtend = require('xtend')

var basedir = path.resolve(__dirname, '../')
var exampledir = path.join(basedir, 'example','command-line')
var outputdir = path.join(basedir, 'example','output','command-line','build')
var dynamicModule = path.join(outputdir, 'dynamic.js')
var requiresDynamicModule = path.join(outputdir, 'requires-dynamic.js')

// also allows building with a custom NODE_PATH eg.
// NODE_PATH=$PWD/lib/ browserifyinc --require foo in.js > out.js

test("make sure it builds via command line", function (t) {
  var iterations = 3

  t.plan(1 + iterations * 2)

  if (!(outputdir.charAt(0) == '/' && outputdir.length > 1)) {
    throw new Error('unsafe outputdir for rm -rf')
  }
  exec('rm -rfv '+outputdir, function (err) {
    exec('mkdir -p '+outputdir, function (err) {
      t.notOk(err, 'dir created')
      fs.writeFileSync(requiresDynamicModule, 'require("./dynamic")')
      build(1, iterations)
    })
  })

  function build(n, nmax) {
    // setup
    fs.writeFileSync(dynamicModule, 'console.log("build '+n+'")')

    var processExited = false
    var outputFileClosed = false
    
    var buildProc = makeBuildProc()

    function maybeDone() {
      if (!(processExited && outputFileClosed)) return

      if (n == nmax) {
        t.end()
      } else {
        setTimeout(function () {
          build(n+1, nmax)
        }, 2000) // mtime resolution can be 1-2s depending on OS
      }
    }

    buildProc
      .on('exit', function (code) {
        processExited = true
        t.ok(code == 0, 'built '+n+' times')
        maybeDone()
      })

    buildProc.stdout
      .pipe(fs.createWriteStream(path.join(outputdir,'build'+n+'.js')))
      .on('close', function () {
        outputFileClosed = true
        t.ok(true, 'got output '+n)
        maybeDone()
      })
  }
})

function makeBuildProc() {
  var browserifyIncBin = require.resolve('../bin/cmd.js')

  var proc = spawn(browserifyIncBin, [
    '--cachefile', path.join(outputdir,'cache.json'),
    '--require', 'foo',
    dynamicModule,
  ], {
    env: xtend(process.env, {
      // allows require('foo') from lib/ dir
      NODE_PATH: path.join(exampledir, 'lib'),
    })
  })

  proc.stderr.pipe(process.stderr)

  return proc
}
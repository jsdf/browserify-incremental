var test = require("tap").test
var exec = require('child_process').exec
var path = require('path')
var through = require('through2')
var fs = require('fs')

var basedir = path.resolve(__dirname, '../')
var outputdir = path.join(basedir, 'example','output','test','build')
var dynamicModule = path.join(outputdir, 'dynamic.js')
var requiresDynamicModule = path.join(outputdir, 'requires-dynamic.js')

test("make sure it builds and builds again", function (t) {
  // t.plan(5)
  exec('mkdir -p '+outputdir, function (err) {
    t.notOk(err, 'dir created')
    fs.writeFileSync(requiresDynamicModule, 'require("./dynamic")')
    build1()
  })

  function build1 () {
    fs.writeFileSync(dynamicModule, 'console.log("a")')

    var b1 = make()

    b1.bundle()
      .pipe(through())
      .on('finish', function () {
        t.ok(true, 'built once')
      })
      .pipe(fs.createWriteStream(path.join(outputdir,'build1.js')))
      .on('finish', function () {

        setTimeout(function () {
          build2()
        }, 2000) // mtime resolution can be 1-2s depending on OS
      })
  }

  function build2 () {
    fs.writeFileSync(dynamicModule, 'console.log("b")')

    var b2 = make()

    b2.on('changedDeps', function (invalidated, deleted) {
      t.ok(invalidated && invalidated.length == 1, 'one file changed')
    })

    b2.bundle()
      .pipe(through())
      .on('finish', function () {
        t.ok(true, 'built twice')
        t.ok(Object.keys(b2._options.cache).length > 0, 'cache is populated')
        t.end()
      })
      .pipe(fs.createWriteStream(path.join(outputdir,'build2.js')))
      
   }
})

function make () {
  var browserifyIncremental = require('../')

  var opts = {cacheFile: path.join(outputdir,'cache.json')}

  var b = browserifyIncremental(opts)
  // b.add(path.join(basedir,'example','test-module'))
  b.add(requiresDynamicModule)

  return b
}
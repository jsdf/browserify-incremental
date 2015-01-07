console.time('total')
console.time('startup')
var browserifyIncremental = require('../');
var fs = require('fs');

console.timeEnd('startup')
var counter = 10;
var testTimeout = 1000;
var cache = true;

console.time('cache fill')
if (cache) {
  var opts = {cacheFile: __dirname+'/output/cache.json'}
} else {
  var opts = {}
}
var b = browserifyIncremental([__dirname + '/test-module'], opts)
console.timeEnd('cache fill')
b.on('log', function(msg){ console.log(msg) })
b.on('update', function(updated) { console.log('changed files\n'+updated.join('\n')) })

process.on('exit', function () { console.timeEnd('total') })

run() // start test

function run() {
  console.time('bundle')
  b.bundle()
    .on('end', function(){ console.timeEnd('bundle') })
    .pipe(fs.createWriteStream(__dirname+'/output/bundle.js'))
}


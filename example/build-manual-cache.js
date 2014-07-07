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
  var incrementalCache = JSON.parse(fs.readFileSync(__dirname+'/output/cache.json', {encoding: 'utf8'}))
  var opts = {cache:incrementalCache.cache, mtimes: incrementalCache.mtimes}
} else {
  var opts = {}
}
console.timeEnd('cache fill')
var b = browserifyIncremental(opts)
b.on('log', function(msg){ console.log(msg) })
b.on('cache', function(incrementalCache) { fs.writeFile(__dirname+'/output/cache.json', JSON.stringify(incrementalCache)) })
b.on('update', function(updated) { console.log('changed files', updated) })
b.add(__dirname + '/test-module')

process.on('exit', function () { console.timeEnd('total') })

run() // start test

function run() {
  console.time('bundle')
  b.bundle()
    .on('end', function(){ console.timeEnd('bundle') })
    .pipe(fs.createWriteStream(__dirname+'/output/bundle.js'))
}


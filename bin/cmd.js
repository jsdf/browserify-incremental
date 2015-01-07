#!/usr/bin/env node

var browserifyIncremental = require('../');
var fs = require('fs');
var path = require('path');
var fromArgs = require('browserify/bin/args');
var xtend = require('xtend');

var b, outfile, verbose, cachefile;

var b_ = fromArgs(process.argv.slice(2), browserifyIncremental.args)
cachefile = b_.argv.cachefile || './browserify-cache.json'
outfile = b_.argv.o || b_.argv.outfile;
verbose = (b_.argv.v || b_.argv.verbose) && outfile;
b = browserifyIncremental(b_, {cacheFile: cachefile});

b.on('update', function(changes) { 
    if (verbose && changes.length) console.error('changed files:\n'+changes.join('\n'));
});
b.on('error', function (err) {
    console.error(err);
});
bundle();

function bundle () {
    var bb = b.bundle();
    var caught = false;
    bb.on('error', function (err) {
        console.error(err);
        caught = true;
    });
    bb.pipe(outfile ? fs.createWriteStream(outfile) : process.stdout);
    var bytes, time;
    b.on('bytes', function (b) { bytes = b });
    b.on('time', function (t) { time = t });
    
    bb.on('end', function () {
        if (caught) return;
        if (verbose) {
            console.error(bytes + ' bytes written to ' + outfile
                + ' (' + (time / 1000).toFixed(2) + ' seconds)'
            );
        }
    });
}
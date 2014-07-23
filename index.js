var fs = require('fs');
var path = require('path');
var util = require('util');
var assert = require('assert');

var through = require('through');
var async = require('async');
var browserify = require('browserify');
var browserifyCache = require('browserify-cache-api');

module.exports = browserifyIncremental;
browserifyIncremental.browserify = browserify;

function browserifyIncremental(files, opts) {
  // browserify plugin boilerplate
  // normalises variable arguments
  var b;
  if (!opts) {
    opts = files || {};
    files = undefined;
    b = typeof opts.bundle === 'function' ? opts : browserify(opts);
  } else {
    b = typeof files.bundle === 'function' ? files : browserify(files, opts);
  }

  browserifyCache(b, opts);

  // override browserify bundle() method
  var bundle = b.bundle.bind(b);
  b.bundle = function (opts_, cb) {
    // more browserify plugin boilerplate
    if (b._pending) return bundle(opts_, cb);

    if (typeof opts_ === 'function') {
      cb = opts_;
      opts_ = {};
    }
    if (!opts_) opts_ = {};

    var outStream = bundle(opts_, cb);

    var start = Date.now();
    var bytes = 0;
    outStream.pipe(through(function (buf) { bytes += buf.length }));
    outStream.on('end', end);

    function end () {
      // no more packages to be required

      var delta = ((Date.now() - start) / 1000).toFixed(2);
      b.emit('log', bytes + ' bytes written (' + delta + ' seconds)');
      b.emit('time', Date.now() - start);
      b.emit('bytes', bytes);

    }
    return outStream;
  };

  return b;
}

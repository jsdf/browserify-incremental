var fs = require('fs');
var through = require('through');
var async = require('async');
var browserify = require('browserify');

module.exports = browserifyIncremental;
browserifyIncremental.browserify = browserify;

function browserifyIncremental(files, opts) {
    var b;
    if (!opts) {
        opts = files || {};
        files = undefined;
        b = typeof opts.bundle === 'function' ? opts : browserify(opts);
    } else {
        b = typeof files.bundle === 'function' ? files : browserify(files, opts);
    }
    var cache = {};
    var pkgcache = {};
    var mtimes = {};
    var first = true;
    
    if (opts.cache) {
        cache = opts.cache;
        delete opts.cache;
        first = false;
    }
    
    if (opts.pkgcache) {
        pkgcache = opts.pkgcache;
        delete opts.pkgcache;
    }
    
    b.on('package', function (file, pkg) {
        pkgcache[file] = pkg;
    });
    
    b.on('dep', function (dep) {
        cache[dep.id] = dep;
        updateMtime(mtimes, dep.id)
    });
    
    b.on('file', function (file) {
    });

    b.on('bundle', function (bundle) {
        bundle.on('transform', function (tr, mfile) {
            tr.on('file', function (file) {
                // updateMtimeDep(mfile, file);
            });
        });
    });
    
    var bundle = b.bundle.bind(b);
    
    b.bundle = function (opts_, cb) {
        if (b._pending) return bundle(opts_, cb);
        
        if (typeof opts_ === 'function') {
            cb = opts_;
            opts_ = {};
        }
        if (!opts_) opts_ = {};
        if (!first) opts_.cache = cache;
        opts_.includePackage = true;
        opts_.packageCache = pkgcache;

        opts_.deps = function(depsOpts) {
          var d = through()
          invalidateModifiedFiles(mtimes, cache, function() {
            b.deps(depsOpts).pipe(d);
          })
          return d;
        }
        var outStream = bundle(opts_, cb);
        
        var start = Date.now();
        var bytes = 0;
        outStream.pipe(through(function (buf) { bytes += buf.length }));
        outStream.on('end', end);
        
        function end () {
            first = false;
            
            var delta = ((Date.now() - start) / 1000).toFixed(2);
            b.emit('log', bytes + ' bytes written (' + delta + ' seconds)');
            b.emit('time', Date.now() - start);
            b.emit('bytes', bytes);
        }
        return outStream;
    };
    
    return b;
}

function updateMtime(mtimes, file) {
  fs.stat(file, function (err, stat) {
    if (!err) mtimes[file] = stat.mtime.getTime();
  });
}

function invalidateModifiedFiles(mtimes, cache, done) {
  async.each(Object.keys(cache), function(file, fileDone) {
    fs.stat(file, function (err, stat) {
      if (err) {
        console.error(err.message || err);
        return fileDone();
      }
      var mtimeNew = stat.mtime.getTime();
      if(!(mtimes[file] && mtimeNew && mtimeNew <= mtimes[file])) {
        console.warn('invalidating', cache[file].name || file)
        delete cache[file];
      }
      mtimes[file] = mtimeNew;
      fileDone();
    });
  }, done);
}
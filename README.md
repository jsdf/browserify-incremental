# browserify-incremental

Incremental rebuild for browserify

Update any source file and re-bundle, and it will build super fast, as only 
changed files will be parsed.

# example

Use `browserifyinc` with all the same arguments as `browserify` except that
`-o` is mandatory, and `--cachefile` specifies the file to use for caching deps:

```
$ browserifyinc test-module/ -o output/bundle.js
```

If you don't specify `--cachefile`, a `browserify-cache.json` file will be 
created in the current working directory.

Now if you change some files and rebuild, only the changed files will be parsed
and the rest will reuse the previous build's cache.

You can use `-v` to get more verbose output to show which files have changed and 
how long the bundling took (in seconds):

```
$ browserifyinc test-module/ -o output/bundle.js -v
changed files:
/Users/jfriend/code/browserify-incremental/example/test-module/index.js
1000303 bytes written to output/bundle.js (0.22 seconds)
```

# usage

All the bundle options are the same as the browserify command except for `-v` 
and `--cachefile`.

# API

``` js
var browserifyIncremental = require('browserify-incremental')
```

## var b = browserifyIncremental(opts)

Create a browserify bundle `b` from `opts`.

`b` is exactly like a browserify bundle except that it caches file contents and
calling `b.bundle()` extra times past the first time will be much faster 
due to that caching.

By default, when used via API, browserify-incremental will only use in-memory 
caching, however you can pass a `cacheFile` option which will use an on disk
cache instead (useful for build scripts which run once and exit).

You can also pass in a browserify instance of your own, and that will be used
instead of creating a new one.

# events

## b.on('bytes', function (bytes) {})

When a bundle is generated, this event fires with the number of bytes.

## b.on('time', function (time) {})

When a bundle is generated, this event fires with the time it took to create the
bundle in milliseconds.

## b.on('log', function (msg) {})

This event fires to with messages of the form:

```
X bytes written (Y seconds)
```

with the number of bytes in the bundle X and the time in seconds Y.

# install

With [npm](https://npmjs.org) do:

```
$ npm install browserify-incremental
```

# license

MIT

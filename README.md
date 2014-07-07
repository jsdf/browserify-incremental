# browserify-incremental

Incremental rebuild for browserify

Update any source file and re-bundle, and only changed files will be parsed, 
so it will build super fast (even with big dependencies like React!).

# example

Use `browserifyinc` with all the same arguments as `browserify` except that
`-o` is mandatory, and the added `--cachefile` argument specifies where to 
put the cache file:

```
$ browserifyinc -r react -o output/bundle.js  -v
556200 bytes written to output/bundle.js (1.38 seconds)
$ browserifyinc -r react -o output/bundle.js  -v
556200 bytes written to output/bundle.js (0.13 seconds)
```

Now if you change some files and rebuild, only the changed files will be parsed
and the rest will reuse the previous build's cached output.

You can use `-v` to get more verbose output to show which files have changed and 
how long the bundling took (in seconds):

```
$ browserifyinc test-module/ -o output/bundle.js -v
changed files:
/Users/jfriend/code/browserify-incremental/example/test-module/index.js
1000423 bytes written to output/bundle.js (0.18 seconds)
```

If you don't specify `--cachefile`, a `browserify-cache.json` file will be 
created in the current working directory.

# usage

All the bundle options are the same as the browserify command except for `-v` 
and `--cachefile`.

# API

``` js
var browserifyInc = require('browserify-incremental')
```

## var b = browserifyInc(opts)

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
$ npm install -g browserify-incremental
```

to get the browserifyinc command and:

```
$ npm install browserify-incremental
```

to get just the library.


# license

MIT

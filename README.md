# browserify-incremental

Incremental rebuild for browserify

Update any source file and re-bundle, and it will build super fast, as only 
changed files will be read from disk.

# API

``` js
var browserifyIncremental = require('browserify-incremental')
```

## var b = browserifyIncremental(opts)

Create a browserify bundle `b` from `opts`.

`b` is exactly like a browserify bundle except that it caches file contents and
calling `b.bundle()` extra times past the first time will be much faster 
due to that caching.

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

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.testModule = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Browser bundle of nunjucks 1.3.3 (slim, only works with precompiled templates)

(function() {
var modules = {};
(function() {
'use strict';

// A simple class system, more documentation to come

function extend(cls, name, props) {
    // This does that same thing as Object.create, but with support for IE8
    var F = function() {};
    F.prototype = cls.prototype;
    var prototype = new F();

    var fnTest = /xyz/.test(function(){ xyz; }) ? /\bparent\b/ : /.*/;
    props = props || {};

    for(var k in props) {
        var src = props[k];
        var parent = prototype[k];

        if(typeof parent === 'function' &&
           typeof src === 'function' &&
           fnTest.test(src)) {
            prototype[k] = (function (src, parent) {
                return function() {
                    // Save the current parent method
                    var tmp = this.parent;

                    // Set parent to the previous method, call, and restore
                    this.parent = parent;
                    var res = src.apply(this, arguments);
                    this.parent = tmp;

                    return res;
                };
            })(src, parent);
        }
        else {
            prototype[k] = src;
        }
    }

    prototype.typename = name;

    var new_cls = function() {
        if(prototype.init) {
            prototype.init.apply(this, arguments);
        }
    };

    new_cls.prototype = prototype;
    new_cls.prototype.constructor = new_cls;

    new_cls.extend = function(name, props) {
        if(typeof name === 'object') {
            props = name;
            name = 'anonymous';
        }
        return extend(new_cls, name, props);
    };

    return new_cls;
}

modules['object'] = extend(Object, 'Object', {});
})();
(function() {
'use strict';

var ArrayProto = Array.prototype;
var ObjProto = Object.prototype;

var escapeMap = {
    '&': '&amp;',
    '"': '&quot;',
    '\'': '&#39;',
    '<': '&lt;',
    '>': '&gt;'
};

var escapeRegex = /[&"'<>]/g;

var lookupEscape = function(ch) {
    return escapeMap[ch];
};

var exports = modules['lib'] = {};

exports.withPrettyErrors = function(path, withInternals, func) {
    try {
        return func();
    } catch (e) {
        if (!e.Update) {
            // not one of ours, cast it
            e = new exports.TemplateError(e);
        }
        e.Update(path);

        // Unless they marked the dev flag, show them a trace from here
        if (!withInternals) {
            var old = e;
            e = new Error(old.message);
            e.name = old.name;
        }

        throw e;
    }
};

exports.TemplateError = function(message, lineno, colno) {
    var err = this;

    if (message instanceof Error) { // for casting regular js errors
        err = message;
        message = message.name + ': ' + message.message;
    } else {
        if(Error.captureStackTrace) {
            Error.captureStackTrace(err);
        }
    }

    err.name = 'Template render error';
    err.message = message;
    err.lineno = lineno;
    err.colno = colno;
    err.firstUpdate = true;

    err.Update = function(path) {
        var message = '(' + (path || 'unknown path') + ')';

        // only show lineno + colno next to path of template
        // where error occurred
        if (this.firstUpdate) {
            if(this.lineno && this.colno) {
                message += ' [Line ' + this.lineno + ', Column ' + this.colno + ']';
            }
            else if(this.lineno) {
                message += ' [Line ' + this.lineno + ']';
            }
        }

        message += '\n ';
        if (this.firstUpdate) {
            message += ' ';
        }

        this.message = message + (this.message || '');
        this.firstUpdate = false;
        return this;
    };

    return err;
};

exports.TemplateError.prototype = Error.prototype;

exports.escape = function(val) {
  return val.replace(escapeRegex, lookupEscape);
};

exports.isFunction = function(obj) {
    return ObjProto.toString.call(obj) === '[object Function]';
};

exports.isArray = Array.isArray || function(obj) {
    return ObjProto.toString.call(obj) === '[object Array]';
};

exports.isString = function(obj) {
    return ObjProto.toString.call(obj) === '[object String]';
};

exports.isObject = function(obj) {
    return ObjProto.toString.call(obj) === '[object Object]';
};

exports.groupBy = function(obj, val) {
    var result = {};
    var iterator = exports.isFunction(val) ? val : function(obj) { return obj[val]; };
    for(var i=0; i<obj.length; i++) {
        var value = obj[i];
        var key = iterator(value, i);
        (result[key] || (result[key] = [])).push(value);
    }
    return result;
};

exports.toArray = function(obj) {
    return Array.prototype.slice.call(obj);
};

exports.without = function(array) {
    var result = [];
    if (!array) {
        return result;
    }
    var index = -1,
    length = array.length,
    contains = exports.toArray(arguments).slice(1);

    while(++index < length) {
        if(exports.indexOf(contains, array[index]) === -1) {
            result.push(array[index]);
        }
    }
    return result;
};

exports.extend = function(obj, obj2) {
    for(var k in obj2) {
        obj[k] = obj2[k];
    }
    return obj;
};

exports.repeat = function(char_, n) {
    var str = '';
    for(var i=0; i<n; i++) {
        str += char_;
    }
    return str;
};

exports.each = function(obj, func, context) {
    if(obj == null) {
        return;
    }

    if(ArrayProto.each && obj.each === ArrayProto.each) {
        obj.forEach(func, context);
    }
    else if(obj.length === +obj.length) {
        for(var i=0, l=obj.length; i<l; i++) {
            func.call(context, obj[i], i, obj);
        }
    }
};

exports.map = function(obj, func) {
    var results = [];
    if(obj == null) {
        return results;
    }

    if(ArrayProto.map && obj.map === ArrayProto.map) {
        return obj.map(func);
    }

    for(var i=0; i<obj.length; i++) {
        results[results.length] = func(obj[i], i);
    }

    if(obj.length === +obj.length) {
        results.length = obj.length;
    }

    return results;
};

exports.asyncIter = function(arr, iter, cb) {
    var i = -1;

    function next() {
        i++;

        if(i < arr.length) {
            iter(arr[i], i, next, cb);
        }
        else {
            cb();
        }
    }

    next();
};

exports.asyncFor = function(obj, iter, cb) {
    var keys = exports.keys(obj);
    var len = keys.length;
    var i = -1;

    function next() {
        i++;
        var k = keys[i];

        if(i < len) {
            iter(k, obj[k], i, len, next);
        }
        else {
            cb();
        }
    }

    next();
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf#Polyfill
exports.indexOf = Array.prototype.indexOf ?
    function (arr, searchElement, fromIndex) {
        return Array.prototype.indexOf.call(arr, searchElement, fromIndex);
    } :
    function (arr, searchElement, fromIndex) {
        var length = this.length >>> 0; // Hack to convert object.length to a UInt32

        fromIndex = +fromIndex || 0;

        if(Math.abs(fromIndex) === Infinity) {
            fromIndex = 0;
        }

        if(fromIndex < 0) {
            fromIndex += length;
            if (fromIndex < 0) {
                fromIndex = 0;
            }
        }

        for(;fromIndex < length; fromIndex++) {
            if (arr[fromIndex] === searchElement) {
                return fromIndex;
            }
        }

        return -1;
    };

if(!Array.prototype.map) {
    Array.prototype.map = function() {
        throw new Error('map is unimplemented for this js engine');
    };
}

exports.keys = function(obj) {
    if(Object.prototype.keys) {
        return obj.keys();
    }
    else {
        var keys = [];
        for(var k in obj) {
            if(obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    }
}
})();
(function() {
'use strict';

var lib = modules["lib"];
var Obj = modules["object"];

// Frames keep track of scoping both at compile-time and run-time so
// we know how to access variables. Block tags can introduce special
// variables, for example.
var Frame = Obj.extend({
    init: function(parent) {
        this.variables = {};
        this.parent = parent;
    },

    set: function(name, val, resolveUp) {
        // Allow variables with dots by automatically creating the
        // nested structure
        var parts = name.split('.');
        var obj = this.variables;
        var frame = this;

        if(resolveUp) {
            if((frame = this.resolve(parts[0]))) {
                frame.set(name, val);
                return;
            }
            frame = this;
        }

        for(var i=0; i<parts.length - 1; i++) {
            var id = parts[i];

            if(!obj[id]) {
                obj[id] = {};
            }
            obj = obj[id];
        }

        obj[parts[parts.length - 1]] = val;
    },

    get: function(name) {
        var val = this.variables[name];
        if(val !== undefined && val !== null) {
            return val;
        }
        return null;
    },

    lookup: function(name) {
        var p = this.parent;
        var val = this.variables[name];
        if(val !== undefined && val !== null) {
            return val;
        }
        return p && p.lookup(name);
    },

    resolve: function(name) {
        var p = this.parent;
        var val = this.variables[name];
        if(val !== undefined && val !== null) {
            return this;
        }
        return p && p.resolve(name);
    },

    push: function() {
        return new Frame(this);
    },

    pop: function() {
        return this.parent;
    }
});

function makeMacro(argNames, kwargNames, func) {
    return function() {
        var argCount = numArgs(arguments);
        var args;
        var kwargs = getKeywordArgs(arguments);

        if(argCount > argNames.length) {
            args = Array.prototype.slice.call(arguments, 0, argNames.length);

            // Positional arguments that should be passed in as
            // keyword arguments (essentially default values)
            var vals = Array.prototype.slice.call(arguments, args.length, argCount);
            for(var i=0; i<vals.length; i++) {
                if(i < kwargNames.length) {
                    kwargs[kwargNames[i]] = vals[i];
                }
            }

            args.push(kwargs);
        }
        else if(argCount < argNames.length) {
            args = Array.prototype.slice.call(arguments, 0, argCount);

            for(var i=argCount; i<argNames.length; i++) {
                var arg = argNames[i];

                // Keyword arguments that should be passed as
                // positional arguments, i.e. the caller explicitly
                // used the name of a positional arg
                args.push(kwargs[arg]);
                delete kwargs[arg];
            }

            args.push(kwargs);
        }
        else {
            args = arguments;
        }

        return func.apply(this, args);
    };
}

function makeKeywordArgs(obj) {
    obj.__keywords = true;
    return obj;
}

function getKeywordArgs(args) {
    var len = args.length;
    if(len) {
        var lastArg = args[len - 1];
        if(lastArg && lastArg.hasOwnProperty('__keywords')) {
            return lastArg;
        }
    }
    return {};
}

function numArgs(args) {
    var len = args.length;
    if(len === 0) {
        return 0;
    }

    var lastArg = args[len - 1];
    if(lastArg && lastArg.hasOwnProperty('__keywords')) {
        return len - 1;
    }
    else {
        return len;
    }
}

// A SafeString object indicates that the string should not be
// autoescaped. This happens magically because autoescaping only
// occurs on primitive string objects.
function SafeString(val) {
    if(typeof val !== 'string') {
        return val;
    }

    this.val = val;
}

SafeString.prototype = Object.create(String.prototype);
SafeString.prototype.valueOf = function() {
    return this.val;
};
SafeString.prototype.toString = function() {
    return this.val;
};

function copySafeness(dest, target) {
    if(dest instanceof SafeString) {
        return new SafeString(target);
    }
    return target.toString();
}

function markSafe(val) {
    var type = typeof val;

    if(type === 'string') {
        return new SafeString(val);
    }
    else if(type !== 'function') {
        return val;
    }
    else {
        return function() {
            var ret = val.apply(this, arguments);

            if(typeof ret === 'string') {
                return new SafeString(ret);
            }

            return ret;
        };
    }
}

function suppressValue(val, autoescape) {
    val = (val !== undefined && val !== null) ? val : '';

    if(autoescape && typeof val === 'string') {
        val = lib.escape(val);
    }

    return val;
}

function memberLookup(obj, val) {
    obj = obj || {};

    if(typeof obj[val] === 'function') {
        return function() {
            return obj[val].apply(obj, arguments);
        };
    }

    return obj[val];
}

function callWrap(obj, name, args) {
    if(!obj) {
        throw new Error('Unable to call `' + name + '`, which is undefined or falsey');
    }
    else if(typeof obj !== 'function') {
        throw new Error('Unable to call `' + name + '`, which is not a function');
    }

    return obj.apply(this, args);
}

function contextOrFrameLookup(context, frame, name) {
    var val = frame.lookup(name);
    return (val !== undefined && val !== null) ?
        val :
        context.lookup(name);
}

function handleError(error, lineno, colno) {
    if(error.lineno) {
        return error;
    }
    else {
        return new lib.TemplateError(error, lineno, colno);
    }
}

function asyncEach(arr, dimen, iter, cb) {
    if(lib.isArray(arr)) {
        var len = arr.length;

        lib.asyncIter(arr, function(item, i, next) {
            switch(dimen) {
            case 1: iter(item, i, len, next); break;
            case 2: iter(item[0], item[1], i, len, next); break;
            case 3: iter(item[0], item[1], item[2], i, len, next); break;
            default:
                item.push(i, next);
                iter.apply(this, item);
            }
        }, cb);
    }
    else {
        lib.asyncFor(arr, function(key, val, i, len, next) {
            iter(key, val, i, len, next);
        }, cb);
    }
}

function asyncAll(arr, dimen, func, cb) {
    var finished = 0;
    var len;
    var outputArr;

    function done(i, output) {
        finished++;
        outputArr[i] = output;

        if(finished === len) {
            cb(null, outputArr.join(''));
        }
    }

    if(lib.isArray(arr)) {
        len = arr.length;
        outputArr = new Array(len);

        if(len === 0) {
            cb(null, '');
        }
        else {
            for(var i=0; i<arr.length; i++) {
                var item = arr[i];

                switch(dimen) {
                case 1: func(item, i, len, done); break;
                case 2: func(item[0], item[1], i, len, done); break;
                case 3: func(item[0], item[1], item[2], i, len, done); break;
                default:
                    item.push(i, done);
                    func.apply(this, item);
                }
            }
        }
    }
    else {
        var keys = lib.keys(arr);
        len = keys.length;
        outputArr = new Array(len);

        if(len === 0) {
            cb(null, '');
        }
        else {
            for(var i=0; i<keys.length; i++) {
                var k = keys[i];
                func(k, arr[k], i, len, done);
            }
        }
    }
}

modules['runtime'] = {
    Frame: Frame,
    makeMacro: makeMacro,
    makeKeywordArgs: makeKeywordArgs,
    numArgs: numArgs,
    suppressValue: suppressValue,
    memberLookup: memberLookup,
    contextOrFrameLookup: contextOrFrameLookup,
    callWrap: callWrap,
    handleError: handleError,
    isArray: lib.isArray,
    keys: lib.keys,
    SafeString: SafeString,
    copySafeness: copySafeness,
    markSafe: markSafe,
    asyncEach: asyncEach,
    asyncAll: asyncAll
};
})();
(function() {
'use strict';

var path = modules["path"];
var Obj = modules["object"];
var lib = modules["lib"];

var Loader = Obj.extend({
    on: function(name, func) {
        this.listeners = this.listeners || {};
        this.listeners[name] = this.listeners[name] || [];
        this.listeners[name].push(func);
    },

    emit: function(name /*, arg1, arg2, ...*/) {
        var args = Array.prototype.slice.call(arguments, 1);

        if(this.listeners && this.listeners[name]) {
            lib.each(this.listeners[name], function(listener) {
                listener.apply(null, args);
            });
        }
    },

    resolve: function(from, to) {
        return path.resolve(path.dirname(from), to);
    },

    isRelative: function(filename) {
        return (filename.indexOf('./') === 0 || filename.indexOf('../') === 0);
    }
});

modules['loader'] = Loader;
})();
(function() {
'use strict';

var Loader = modules["loader"];

var WebLoader = Loader.extend({
    init: function(baseURL, neverUpdate) {
        // It's easy to use precompiled templates: just include them
        // before you configure nunjucks and this will automatically
        // pick it up and use it
        this.precompiled = window.nunjucksPrecompiled || {};

        this.baseURL = baseURL || '';
        this.neverUpdate = neverUpdate;
    },

    getSource: function(name) {
        if(this.precompiled[name]) {
            return {
                src: { type: 'code',
                       obj: this.precompiled[name] },
                path: name
            };
        }
        else {
            var src = this.fetch(this.baseURL + '/' + name);
            if(!src) {
                return null;
            }

            return { src: src,
                     path: name,
                     noCache: !this.neverUpdate };
        }
    },

    fetch: function(url, callback) {
        // Only in the browser please
        var ajax;
        var loading = true;
        var src;

        if(window.XMLHttpRequest) { // Mozilla, Safari, ...
            ajax = new XMLHttpRequest();
        }
        else if(window.ActiveXObject) { // IE 8 and older
            ajax = new ActiveXObject('Microsoft.XMLHTTP');
        }

        ajax.onreadystatechange = function() {
            if(ajax.readyState === 4 && (ajax.status === 0 || ajax.status === 200) && loading) {
                loading = false;
                src = ajax.responseText;
            }
        };

        url += (url.indexOf('?') === -1 ? '?' : '&') + 's=' +
               (new Date().getTime());

        // Synchronous because this API shouldn't be used in
        // production (pre-load compiled templates instead)
        ajax.open('GET', url, false);
        ajax.send();

        return src;
    }
});

modules['web-loaders'] = {
    WebLoader: WebLoader
};
})();
(function() {
if(typeof window === 'undefined' || window !== this) {
    modules['loaders'] = modules["node-loaders"];
}
else {
    modules['loaders'] = modules["web-loaders"];
}
})();
(function() {
'use strict';

var lib = modules["lib"];
var r = modules["runtime"];

var filters = {
    abs: function(n) {
        return Math.abs(n);
    },

    batch: function(arr, linecount, fill_with) {
        var res = [];
        var tmp = [];

        for(var i=0; i<arr.length; i++) {
            if(i % linecount === 0 && tmp.length) {
                res.push(tmp);
                tmp = [];
            }

            tmp.push(arr[i]);
        }

        if(tmp.length) {
            if(fill_with) {
                for(var i=tmp.length; i<linecount; i++) {
                    tmp.push(fill_with);
                }
            }

            res.push(tmp);
        }

        return res;
    },

    capitalize: function(str) {
        var ret = str.toLowerCase();
        return r.copySafeness(str, ret.charAt(0).toUpperCase() + ret.slice(1));
    },

    center: function(str, width) {
        width = width || 80;

        if(str.length >= width) {
            return str;
        }

        var spaces = width - str.length;
        var pre = lib.repeat(' ', spaces/2 - spaces % 2);
        var post = lib.repeat(' ', spaces/2);
        return r.copySafeness(str, pre + str + post);
    },

    'default': function(val, def) {
        return val ? val : def;
    },

    dictsort: function(val, case_sensitive, by) {
        if (!lib.isObject(val)) {
            throw new lib.TemplateError('dictsort filter: val must be an object');
        }

        var array = [];
        for (var k in val) {
            // deliberately include properties from the object's prototype
            array.push([k,val[k]]);
        }

        var si;
        if (by === undefined || by === 'key') {
            si = 0;
        } else if (by === 'value') {
            si = 1;
        } else {
            throw new lib.TemplateError(
                'dictsort filter: You can only sort by either key or value');
        }

        array.sort(function(t1, t2) {
            var a = t1[si];
            var b = t2[si];

            if (!case_sensitive) {
                if (lib.isString(a)) {
                    a = a.toUpperCase();
                }
                if (lib.isString(b)) {
                    b = b.toUpperCase();
                }
            }

            return a > b ? 1 : (a === b ? 0 : -1);
        });

        return array;
    },

    escape: function(str) {
        if(typeof str === 'string' ||
           str instanceof r.SafeString) {
            return lib.escape(str);
        }
        return str;
    },

    safe: function(str) {
        return r.markSafe(str);
    },

    first: function(arr) {
        return arr[0];
    },

    groupby: function(arr, attr) {
        return lib.groupBy(arr, attr);
    },

    indent: function(str, width, indentfirst) {
        width = width || 4;
        var res = '';
        var lines = str.split('\n');
        var sp = lib.repeat(' ', width);

        for(var i=0; i<lines.length; i++) {
            if(i === 0 && !indentfirst) {
                res += lines[i] + '\n';
            }
            else {
                res += sp + lines[i] + '\n';
            }
        }

        return r.copySafeness(str, res);
    },

    join: function(arr, del, attr) {
        del = del || '';

        if(attr) {
            arr = lib.map(arr, function(v) {
                return v[attr];
            });
        }

        return arr.join(del);
    },

    last: function(arr) {
        return arr[arr.length-1];
    },

    length: function(arr) {
        return arr !== undefined ? arr.length : 0;
    },

    list: function(val) {
        if(lib.isString(val)) {
            return val.split('');
        }
        else if(lib.isObject(val)) {
            var keys = [];

            if(Object.keys) {
                keys = Object.keys(val);
            }
            else {
                for(var k in val) {
                    keys.push(k);
                }
            }

            return lib.map(keys, function(k) {
                return { key: k,
                         value: val[k] };
            });
        }
        else if(lib.isArray(val)) {
          return val;
        }
        else {
            throw new lib.TemplateError('list filter: type not iterable');
        }
    },

    lower: function(str) {
        return str.toLowerCase();
    },

    random: function(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    rejectattr: function(arr, attr) {
      return arr.filter(function (item) {
        return !item[attr];
      });
    },

    selectattr: function(arr, attr) {
      return arr.filter(function (item) {
        return !!item[attr];
      });
    },

    replace: function(str, old, new_, maxCount) {
        if (old instanceof RegExp) {
            return str.replace(old, new_);
        }

        var res = str;
        var last = res;
        var count = 1;
        res = res.replace(old, new_);

        while(last !== res) {
            if(count >= maxCount) {
                break;
            }

            last = res;
            res = res.replace(old, new_);
            count++;
        }

        return r.copySafeness(str, res);
    },

    reverse: function(val) {
        var arr;
        if(lib.isString(val)) {
            arr = filters.list(val);
        }
        else {
            // Copy it
            arr = lib.map(val, function(v) { return v; });
        }

        arr.reverse();

        if(lib.isString(val)) {
            return r.copySafeness(val, arr.join(''));
        }
        return arr;
    },

    round: function(val, precision, method) {
        precision = precision || 0;
        var factor = Math.pow(10, precision);
        var rounder;

        if(method === 'ceil') {
            rounder = Math.ceil;
        }
        else if(method === 'floor') {
            rounder = Math.floor;
        }
        else {
            rounder = Math.round;
        }

        return rounder(val * factor) / factor;
    },

    slice: function(arr, slices, fillWith) {
        var sliceLength = Math.floor(arr.length / slices);
        var extra = arr.length % slices;
        var offset = 0;
        var res = [];

        for(var i=0; i<slices; i++) {
            var start = offset + i * sliceLength;
            if(i < extra) {
                offset++;
            }
            var end = offset + (i + 1) * sliceLength;

            var slice = arr.slice(start, end);
            if(fillWith && i >= extra) {
                slice.push(fillWith);
            }
            res.push(slice);
        }

        return res;
    },

    sort: function(arr, reverse, caseSens, attr) {
        // Copy it
        arr = lib.map(arr, function(v) { return v; });

        arr.sort(function(a, b) {
            var x, y;

            if(attr) {
                x = a[attr];
                y = b[attr];
            }
            else {
                x = a;
                y = b;
            }

            if(!caseSens && lib.isString(x) && lib.isString(y)) {
                x = x.toLowerCase();
                y = y.toLowerCase();
            }

            if(x < y) {
                return reverse ? 1 : -1;
            }
            else if(x > y) {
                return reverse ? -1: 1;
            }
            else {
                return 0;
            }
        });

        return arr;
    },

    string: function(obj) {
        return r.copySafeness(obj, obj);
    },

    title: function(str) {
        var words = str.split(' ');
        for(var i = 0; i < words.length; i++) {
            words[i] = filters.capitalize(words[i]);
        }
        return r.copySafeness(str, words.join(' '));
    },

    trim: function(str) {
        return r.copySafeness(str, str.replace(/^\s*|\s*$/g, ''));
    },

    truncate: function(input, length, killwords, end) {
        var orig = input;
        length = length || 255;

        if (input.length <= length)
            return input;

        if (killwords) {
            input = input.substring(0, length);
        } else {
            var idx = input.lastIndexOf(' ', length);
            if(idx === -1) {
                idx = length;
            }

            input = input.substring(0, idx);
        }

        input += (end !== undefined && end !== null) ? end : '...';
        return r.copySafeness(orig, input);
    },

    upper: function(str) {
        return str.toUpperCase();
    },

    urlencode: function(obj) {
        var enc = encodeURIComponent;
        if (lib.isString(obj)) {
            return enc(obj);
        } else {
            var parts;
            if (lib.isArray(obj)) {
                parts = obj.map(function(item) {
                    return enc(item[0]) + '=' + enc(item[1]);
                })
            } else {
                parts = [];
                for (var k in obj) {
                    if (obj.hasOwnProperty(k)) {
                        parts.push(enc(k) + '=' + enc(obj[k]));
                    }
                }
            }
            return parts.join('&');
        }
    },

    urlize: function(str, length, nofollow) {
        if (isNaN(length)) length = Infinity;

        var noFollowAttr = (nofollow === true ? ' rel="nofollow"' : '');

        // For the jinja regexp, see
        // https://github.com/mitsuhiko/jinja2/blob/f15b814dcba6aa12bc74d1f7d0c881d55f7126be/jinja2/utils.py#L20-L23
        var puncRE = /^(?:\(|<|&lt;)?(.*?)(?:\.|,|\)|\n|&gt;)?$/;
        // from http://blog.gerv.net/2011/05/html5_email_address_regexp/
        var emailRE = /^[\w.!#$%&'*+\-\/=?\^`{|}~]+@[a-z\d\-]+(\.[a-z\d\-]+)+$/i;
        var httpHttpsRE = /^https?:\/\/.*$/;
        var wwwRE = /^www\./;
        var tldRE = /\.(?:org|net|com)(?:\:|\/|$)/;

        var words = str.split(/\s+/).filter(function(word) {
          // If the word has no length, bail. This can happen for str with
          // trailing whitespace.
          return word && word.length;
        }).map(function(word) {
          var matches = word.match(puncRE);


          var possibleUrl = matches && matches[1] || word;


          // url that starts with http or https
          if (httpHttpsRE.test(possibleUrl))
            return '<a href="' + possibleUrl + '"' + noFollowAttr + '>' + possibleUrl.substr(0, length) + '</a>';

          // url that starts with www.
          if (wwwRE.test(possibleUrl))
            return '<a href="http://' + possibleUrl + '"' + noFollowAttr + '>' + possibleUrl.substr(0, length) + '</a>';

          // an email address of the form username@domain.tld
          if (emailRE.test(possibleUrl))
            return '<a href="mailto:' + possibleUrl + '">' + possibleUrl + '</a>';

          // url that ends in .com, .org or .net that is not an email address
          if (tldRE.test(possibleUrl))
            return '<a href="http://' + possibleUrl + '"' + noFollowAttr + '>' + possibleUrl.substr(0, length) + '</a>';

          return word;

        });

        return words.join(' ');
    },

    wordcount: function(str) {
        var words = (str) ? str.match(/\w+/g) : null;
        return (words) ? words.length : null;
    },

    'float': function(val, def) {
        var res = parseFloat(val);
        return isNaN(res) ? def : res;
    },

    'int': function(val, def) {
        var res = parseInt(val, 10);
        return isNaN(res) ? def : res;
    }
};

// Aliases
filters.d = filters['default'];
filters.e = filters.escape;

modules['filters'] = filters;
})();
(function() {
'use strict';

function cycler(items) {
    var index = -1;

    return {
        current: null,
        reset: function() {
            index = -1;
            this.current = null;
        },

        next: function() {
            index++;
            if(index >= items.length) {
                index = 0;
            }

            this.current = items[index];
            return this.current;
        },
    };

}

function joiner(sep) {
    sep = sep || ',';
    var first = true;

    return function() {
        var val = first ? '' : sep;
        first = false;
        return val;
    };
}

var globals = {
    range: function(start, stop, step) {
        if(!stop) {
            stop = start;
            start = 0;
            step = 1;
        }
        else if(!step) {
            step = 1;
        }

        var arr = [];
        for(var i=start; i<stop; i+=step) {
            arr.push(i);
        }
        return arr;
    },

    // lipsum: function(n, html, min, max) {
    // },

    cycler: function() {
        return cycler(Array.prototype.slice.call(arguments));
    },

    joiner: function(sep) {
        return joiner(sep);
    }
}

modules['globals'] = globals;
})();
(function() {
'use strict';

var path = modules["path"];
var lib = modules["lib"];
var Obj = modules["object"];
var lexer = modules["lexer"];
var compiler = modules["compiler"];
var builtin_filters = modules["filters"];
var builtin_loaders = modules["loaders"];
var runtime = modules["runtime"];
var globals = modules["globals"];
var Frame = runtime.Frame;

var Environment = Obj.extend({
    init: function(loaders, opts) {
        // The dev flag determines the trace that'll be shown on errors.
        // If set to true, returns the full trace from the error point,
        // otherwise will return trace starting from Template.render
        // (the full trace from within nunjucks may confuse developers using
        //  the library)
        // defaults to false
        var opts = this.opts = opts || {};
        this.opts.dev = !!opts.dev;

        // The autoescape flag sets global autoescaping. If true,
        // every string variable will be escaped by default.
        // If false, strings can be manually escaped using the `escape` filter.
        // defaults to false
        this.opts.autoescape = !!opts.autoescape;

        this.opts.trimBlocks = !!opts.trimBlocks;

        this.opts.lstripBlocks = !!opts.lstripBlocks;

        if(!loaders) {
            // The filesystem loader is only available client-side
            if(builtin_loaders.FileSystemLoader) {
                this.loaders = [new builtin_loaders.FileSystemLoader('views')];
            }
            else {
                this.loaders = [new builtin_loaders.WebLoader('/views')];
            }
        }
        else {
            this.loaders = lib.isArray(loaders) ? loaders : [loaders];
        }

        this.initCache();
        this.filters = {};
        this.asyncFilters = [];
        this.extensions = {};
        this.extensionsList = [];

        for(var name in builtin_filters) {
            this.addFilter(name, builtin_filters[name]);
        }
    },

    initCache: function() {
        // Caching and cache busting
        lib.each(this.loaders, function(loader) {
            loader.cache = {};

            if(typeof loader.on === 'function') {
                loader.on('update', function(template) {
                    loader.cache[template] = null;
                });
            }
        });
    },

    addExtension: function(name, extension) {
        extension._name = name;
        this.extensions[name] = extension;
        this.extensionsList.push(extension);
    },

    getExtension: function(name) {
        return this.extensions[name];
    },

    addGlobal: function(name, value) {
        globals[name] = value;
    },

    addFilter: function(name, func, async) {
        var wrapped = func;

        if(async) {
            this.asyncFilters.push(name);
        }
        this.filters[name] = wrapped;
    },

    getFilter: function(name) {
        if(!this.filters[name]) {
            throw new Error('filter not found: ' + name);
        }
        return this.filters[name];
    },

    resolveTemplate: function(loader, parentName, filename) {
        var isRelative = (loader.isRelative && parentName)? loader.isRelative(filename) : false;
        return (isRelative && loader.resolve)? loader.resolve(parentName, filename) : filename;
    },

    getTemplate: function(name, eagerCompile, parentName, cb) {
        var that = this;
        var tmpl = null;
        if(name && name.raw) {
            // this fixes autoescape for templates referenced in symbols
            name = name.raw;
        }

        if(lib.isFunction(parentName)) {
            cb = parentName;
            parentName = null;
            eagerCompile = eagerCompile || false;
        }

        if(lib.isFunction(eagerCompile)) {
            cb = eagerCompile;
            eagerCompile = false;
        }

        if(typeof name !== 'string') {
            throw new Error('template names must be a string: ' + name);
        }

        for (var i = 0; i < this.loaders.length; i++) {
            var _name = this.resolveTemplate(this.loaders[i], parentName, name);
            tmpl = this.loaders[i].cache[_name];
            if (tmpl) break;
        }

        if(tmpl) {
            if(eagerCompile) {
                tmpl.compile();
            }

            if(cb) {
                cb(null, tmpl);
            }
            else {
                return tmpl;
            }
        } else {
            var syncResult;

            lib.asyncIter(this.loaders, function(loader, i, next, done) {
                function handle(src) {
                    if(src) {
                        src.loader = loader;
                        done(src);
                    }
                    else {
                        next();
                    }
                }

                // Resolve name relative to parentName
                name = that.resolveTemplate(loader, parentName, name);

                if(loader.async) {
                    loader.getSource(name, function(err, src) {
                        if(err) { throw err; }
                        handle(src);
                    });
                }
                else {
                    handle(loader.getSource(name));
                }
            }, function(info) {
                if(!info) {
                    var err = new Error('template not found: ' + name);
                    if(cb) {
                        cb(err);
                    }
                    else {
                        throw err;
                    }
                }
                else {
                    var tmpl = new Template(info.src, this,
                                            info.path, eagerCompile);

                    if(!info.noCache) {
                        info.loader.cache[name] = tmpl;
                    }

                    if(cb) {
                        cb(null, tmpl);
                    }
                    else {
                        syncResult = tmpl;
                    }
                }
            }.bind(this));

            return syncResult;
        }
    },

    express: function(app) {
        var env = this;

        function NunjucksView(name, opts) {
            this.name          = name;
            this.path          = name;
            this.defaultEngine = opts.defaultEngine;
            this.ext           = path.extname(name);
            if (!this.ext && !this.defaultEngine) throw new Error('No default engine was specified and no extension was provided.');
            if (!this.ext) this.name += (this.ext = ('.' !== this.defaultEngine[0] ? '.' : '') + this.defaultEngine);
        }

        NunjucksView.prototype.render = function(opts, cb) {
          env.render(this.name, opts, cb);
        };

        app.set('view', NunjucksView);
    },

    render: function(name, ctx, cb) {
        if(lib.isFunction(ctx)) {
            cb = ctx;
            ctx = null;
        }

        // We support a synchronous API to make it easier to migrate
        // existing code to async. This works because if you don't do
        // anything async work, the whole thing is actually run
        // synchronously.
        var syncResult = null;

        this.getTemplate(name, function(err, tmpl) {
            if(err && cb) {
                cb(err);
            }
            else if(err) {
                throw err;
            }
            else {
                tmpl.render(ctx, cb || function(err, res) {
                    if(err) { throw err; }
                    syncResult = res;
                });
            }
        });

        return syncResult;
    },

    renderString: function(src, ctx, opts, cb) {
        if(lib.isFunction(opts)) {
            cb = opts;
            opts = {};
        }
        opts = opts || {};

        var tmpl = new Template(src, this, opts.path);
        return tmpl.render(ctx, cb);
    }
});

var Context = Obj.extend({
    init: function(ctx, blocks) {
        this.ctx = ctx;
        this.blocks = {};
        this.exported = [];

        for(var name in blocks) {
            this.addBlock(name, blocks[name]);
        }
    },

    lookup: function(name) {
        // This is one of the most called functions, so optimize for
        // the typical case where the name isn't in the globals
        if(name in globals && !(name in this.ctx)) {
            return globals[name];
        }
        else {
            return this.ctx[name];
        }
    },

    setVariable: function(name, val) {
        this.ctx[name] = val;
    },

    getVariables: function() {
        return this.ctx;
    },

    addBlock: function(name, block) {
        this.blocks[name] = this.blocks[name] || [];
        this.blocks[name].push(block);
    },

    getBlock: function(name) {
        if(!this.blocks[name]) {
            throw new Error('unknown block "' + name + '"');
        }

        return this.blocks[name][0];
    },

    getSuper: function(env, name, block, frame, runtime, cb) {
        var idx = lib.indexOf(this.blocks[name] || [], block);
        var blk = this.blocks[name][idx + 1];
        var context = this;

        if(idx === -1 || !blk) {
            throw new Error('no super block available for "' + name + '"');
        }

        blk(env, context, frame, runtime, cb);
    },

    addExport: function(name) {
        this.exported.push(name);
    },

    getExported: function() {
        var exported = {};
        for(var i=0; i<this.exported.length; i++) {
            var name = this.exported[i];
            exported[name] = this.ctx[name];
        }
        return exported;
    }
});

var Template = Obj.extend({
    init: function (src, env, path, eagerCompile) {
        this.env = env || new Environment();

        if(lib.isObject(src)) {
            switch(src.type) {
            case 'code': this.tmplProps = src.obj; break;
            case 'string': this.tmplStr = src.obj; break;
            }
        }
        else if(lib.isString(src)) {
            this.tmplStr = src;
        }
        else {
            throw new Error('src must be a string or an object describing ' +
                            'the source');
        }

        this.path = path;

        if(eagerCompile) {
            lib.withPrettyErrors(this.path,
                                 this.env.dev,
                                 this._compile.bind(this));
        }
        else {
            this.compiled = false;
        }
    },

    render: function(ctx, frame, cb) {
        if (typeof ctx === 'function') {
            cb = ctx;
            ctx = {};
        }
        else if (typeof frame === 'function') {
            cb = frame;
            frame = null;
        }

        return lib.withPrettyErrors(this.path, this.env.dev, function() {

            // Catch compile errors for async rendering
            try {
                this.compile();
            } catch (e) {
                if (cb) return cb(e);
                else throw e;
            }

            var context = new Context(ctx || {}, this.blocks);
            var syncResult = null;

            this.rootRenderFunc(this.env,
                                context,
                                frame || new Frame(),
                                runtime,
                                cb || function(err, res) {
                                    if(err) { throw err; }
                                    syncResult = res;
                                });

            return syncResult;
        }.bind(this));
    },


    getExported: function(ctx, frame, cb) {
        if (typeof ctx === 'function') {
            cb = ctx;
            ctx = {};
        }

        if (typeof frame === 'function') {
            cb = frame;
            frame = null;
        }

        // Catch compile errors for async rendering
        try {
            this.compile();
        } catch (e) {
            if (cb) return cb(e);
            else throw e;
        }

        // Run the rootRenderFunc to populate the context with exported vars
        var context = new Context(ctx || {}, this.blocks);
        this.rootRenderFunc(this.env,
                            context,
                            frame || new Frame(),
                            runtime,
                            function() {
                                cb(null, context.getExported());
                            });
    },

    compile: function() {
        if(!this.compiled) {
            this._compile();
        }
    },

    _compile: function() {
        var props;

        if(this.tmplProps) {
            props = this.tmplProps;
        }
        else {
            var source = compiler.compile(this.tmplStr,
                                          this.env.asyncFilters,
                                          this.env.extensionsList,
                                          this.path,
                                          this.env.opts);

            var func = new Function(source);
            props = func();
        }

        this.blocks = this._getBlocks(props);
        this.rootRenderFunc = props.root;
        this.compiled = true;
    },

    _getBlocks: function(props) {
        var blocks = {};

        for(var k in props) {
            if(k.slice(0, 2) === 'b_') {
                blocks[k.slice(2)] = props[k];
            }
        }

        return blocks;
    }
});

// test code
// var src = '{% macro foo() %}{% include "include.html" %}{% endmacro %}{{ foo() }}';
// var env = new Environment(new builtin_loaders.FileSystemLoader('../tests/templates', true), { dev: true });
// console.log(env.renderString(src, { name: 'poop' }));

modules['environment'] = {
    Environment: Environment,
    Template: Template
};
})();
var nunjucks;

var lib = modules["lib"];
var env = modules["environment"];
var compiler = modules["compiler"];
var parser = modules["parser"];
var lexer = modules["lexer"];
var runtime = modules["runtime"];
var Loader = modules["loader"];
var loaders = modules["loaders"];
var precompile = modules["precompile"];

nunjucks = {};
nunjucks.Environment = env.Environment;
nunjucks.Template = env.Template;

nunjucks.Loader = Loader;
nunjucks.FileSystemLoader = loaders.FileSystemLoader;
nunjucks.WebLoader = loaders.WebLoader;

nunjucks.compiler = compiler;
nunjucks.parser = parser;
nunjucks.lexer = lexer;
nunjucks.runtime = runtime;

// A single instance of an environment, since this is so commonly used

var e;
nunjucks.configure = function(templatesPath, opts) {
    opts = opts || {};
    if(lib.isObject(templatesPath)) {
        opts = templatesPath;
        templatesPath = null;
    }

    var noWatch = 'watch' in opts ? !opts.watch : false;
    var loader = loaders.FileSystemLoader || loaders.WebLoader;
    e = new env.Environment(new loader(templatesPath, noWatch), opts);

    if(opts && opts.express) {
        e.express(opts.express);
    }

    return e;
};

nunjucks.compile = function(src, env, path, eagerCompile) {
    if(!e) {
        nunjucks.configure();
    }
    return new nunjucks.Template(src, env, path, eagerCompile);
};

nunjucks.render = function(name, ctx, cb) {
    if(!e) {
        nunjucks.configure();
    }

    return e.render(name, ctx, cb);
};

nunjucks.renderString = function(src, ctx, cb) {
    if(!e) {
        nunjucks.configure();
    }

    return e.renderString(src, ctx, cb);
};

if(precompile) {
    nunjucks.precompile = precompile.precompile;
    nunjucks.precompileString = precompile.precompileString;
}

nunjucks.require = function(name) { return modules[name]; };

if(typeof define === 'function' && define.amd) {
    define(function() { return nunjucks; });
}
else {
    window.nunjucks = nunjucks;
    if(typeof module !== 'undefined') module.exports = nunjucks;
}

})();

},{}],2:[function(require,module,exports){
var nunjucks = require( "nunjucks" );
var env = nunjucks.env || new nunjucks.Environment();
var obj = (function () {function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
output += "<div class=\"thumbnail\">\r\n\t<img data-src=\"holder.js/100px250?text=";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "message"), env.opts.autoescape);
output += "&random=yes\" >\r\n\t";
context.getBlock("content")(env, context, frame, runtime, function(t_2,t_1) {
if(t_2) { cb(t_2); return; }
output += t_1;
output += "\r\n</div>";
cb(null, output);
});
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
function b_content(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
output += "\r\n\t<div class=\"caption\">\r\n\t\t<h3>Thumbnail label</h3>\r\n\t\t<p>...</p>\r\n\t\t<p><a href=\"#\" class=\"btn btn-primary\" role=\"button\">Button</a> <a href=\"#\" class=\"btn btn-default\" role=\"button\">Button</a></p>\r\n\t</div>\r\n\t";
cb(null, output);
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
b_content: b_content,
root: root
};
})();
var oldRoot = obj.root;
obj.root = function( env, context, frame, runtime, cb ) {
	var oldGetTemplate = env.getTemplate;
	env.getTemplate = function( name, ec, parentName, cb ) {
		if( typeof ec === "function" ) {
			cb = ec;
			ec = false;
		}
		var _require = function(name) {
			try {
				return require(name);
			} catch (e) {
				if ( frame.get( "_require" ) ) return frame.get( "_require" )( name )
			}
		};
		var tmpl = _require( name );
		frame.set( "_require", _require );
		if( ec ) tmpl.compile();
		cb( null, tmpl );
	};	oldRoot( env, context, frame, runtime, function( err, res ) {
		env.getTemplate = oldGetTemplate;
		cb( err, res );
	} );
};
var src = {
	obj: obj,
	type: "code"
};
module.exports = new nunjucks.Template( src, env );

},{"nunjucks":1}],3:[function(require,module,exports){
var nunjucks = require( "nunjucks" );
var env = nunjucks.env || new nunjucks.Environment();
var obj = (function () {function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
output += "<div class=\"caption\">\r\n\t<h3>TestModule - <small>";
output += runtime.suppressValue(env.getFilter("test").call(context, runtime.contextOrFrameLookup(context, frame, "message")), env.opts.autoescape);
output += "</small></h3>\r\n\t<p>Módulo Window</p>\r\n\t<p><span>Beatae ex quibusdam, modi sed illo consequatur et! Ex neque quasi molestiae voluptates commodi fugiat repudiandae praesentium, officiis quas quidem vel nihil saepe aperiam accusantium, dolore libero obcaecati in quaerat.</span></p>\r\n\t<p><a href=\"#\" class=\"btn btn-primary\" role=\"button\">Button</a> <a href=\"#\" class=\"btn btn-default\" role=\"button\">Button</a></p>\r\n</div>";
cb(null, output);
;
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
root: root
};
})();
var oldRoot = obj.root;
obj.root = function( env, context, frame, runtime, cb ) {
	var oldGetTemplate = env.getTemplate;
	env.getTemplate = function( name, ec, parentName, cb ) {
		if( typeof ec === "function" ) {
			cb = ec;
			ec = false;
		}
		var _require = function(name) {
			try {
				return require(name);
			} catch (e) {
				if ( frame.get( "_require" ) ) return frame.get( "_require" )( name )
			}
		};
		var tmpl = _require( name );
		frame.set( "_require", _require );
		if( ec ) tmpl.compile();
		cb( null, tmpl );
	};	oldRoot( env, context, frame, runtime, function( err, res ) {
		env.getTemplate = oldGetTemplate;
		cb( err, res );
	} );
};
var src = {
	obj: obj,
	type: "code"
};
module.exports = new nunjucks.Template( src, env );

},{"nunjucks":1}],4:[function(require,module,exports){
var nunjucks = require( "nunjucks" );
var env = nunjucks.env || new nunjucks.Environment();
require( "./layout.nunj" );
require( "./partials/content.nunj" );
var obj = (function () {function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
env.getTemplate("./layout.nunj", true, undefined, function(t_2,parentTemplate) {
if(t_2) { cb(t_2); return; }
for(var t_1 in parentTemplate.blocks) {
context.addBlock(t_1, parentTemplate.blocks[t_1]);
}
output += "\r\n";
parentTemplate.rootRenderFunc(env, context, frame, runtime, cb);
});
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
function b_content(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
output += "\r\n\t";
env.getTemplate("./partials/content.nunj", false, undefined, function(t_5,t_3) {
if(t_5) { cb(t_5); return; }
t_3.render(context.getVariables(), frame.push(), function(t_6,t_4) {
if(t_6) { cb(t_6); return; }
output += t_4
output += "\r\n";
cb(null, output);
})});
} catch (e) {
  cb(runtime.handleError(e, lineno, colno));
}
}
return {
b_content: b_content,
root: root
};
})();
var oldRoot = obj.root;
obj.root = function( env, context, frame, runtime, cb ) {
	var oldGetTemplate = env.getTemplate;
	env.getTemplate = function( name, ec, parentName, cb ) {
		if( typeof ec === "function" ) {
			cb = ec;
			ec = false;
		}
		var _require = function(name) {
			try {
				return require(name);
			} catch (e) {
				if ( frame.get( "_require" ) ) return frame.get( "_require" )( name )
			}
		};
		var tmpl = _require( name );
		frame.set( "_require", _require );
		if( ec ) tmpl.compile();
		cb( null, tmpl );
	};	oldRoot( env, context, frame, runtime, function( err, res ) {
		env.getTemplate = oldGetTemplate;
		cb( err, res );
	} );
};
var src = {
	obj: obj,
	type: "code"
};
module.exports = new nunjucks.Template( src, env );

},{"./layout.nunj":2,"./partials/content.nunj":3,"nunjucks":1}],5:[function(require,module,exports){
//var swig = require('swig');

/**
*	Añadiendo filtros a las plantillas
*/
var nunjucks = require( 'nunjucks' );
nunjucks.env = new nunjucks.Environment();
nunjucks.env.addFilter( 'test', function( test ) {
    return test+' (Nunjucks Test Filter)';
});

var MOD = Backbone.View.extend({

	template 	: require('./templates/testTemplate.nunj'),
	
	initialize 	: function(options){
		this.moduleConfig = _.extend({},options);
		Backbone.on({
			'custom:change'	: _.bind(this.onCustomChange,this),
			'custom:start'	: _.bind(this.onCustomStart,this),
			'custom:end'	: _.bind(this.onCustomEnd,this),
		});
		this.render();
	},
	render 		: function(){
		this.$el.html( this.template.render({message: this.$el.attr('id')}) );
		return this;
	},
	onCustomChange 	: function(){
		console.log("[change]",this);
	},
	onCustomStart 	: function(){
		console.log("[start]",this);
	},
	onCustomEnd 	: function(){
		console.log("[end]",this);
	},
});

module.exports = function(opts, pubsub){
	if(pubsub) opts.pubsub = pubsub;
	return new MOD(opts);
};
},{"./templates/testTemplate.nunj":4,"nunjucks":1}]},{},[5])(5)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvbnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltLmpzIiwic3JjL3RlbXBsYXRlcy9sYXlvdXQubnVuaiIsInNyYy90ZW1wbGF0ZXMvcGFydGlhbHMvY29udGVudC5udW5qIiwic3JjL3RlbXBsYXRlcy90ZXN0VGVtcGxhdGUubnVuaiIsInNyYy90ZXN0TW9kdWxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMzJEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gQnJvd3NlciBidW5kbGUgb2YgbnVuanVja3MgMS4zLjMgKHNsaW0sIG9ubHkgd29ya3Mgd2l0aCBwcmVjb21waWxlZCB0ZW1wbGF0ZXMpXG5cbihmdW5jdGlvbigpIHtcbnZhciBtb2R1bGVzID0ge307XG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbi8vIEEgc2ltcGxlIGNsYXNzIHN5c3RlbSwgbW9yZSBkb2N1bWVudGF0aW9uIHRvIGNvbWVcblxuZnVuY3Rpb24gZXh0ZW5kKGNscywgbmFtZSwgcHJvcHMpIHtcbiAgICAvLyBUaGlzIGRvZXMgdGhhdCBzYW1lIHRoaW5nIGFzIE9iamVjdC5jcmVhdGUsIGJ1dCB3aXRoIHN1cHBvcnQgZm9yIElFOFxuICAgIHZhciBGID0gZnVuY3Rpb24oKSB7fTtcbiAgICBGLnByb3RvdHlwZSA9IGNscy5wcm90b3R5cGU7XG4gICAgdmFyIHByb3RvdHlwZSA9IG5ldyBGKCk7XG5cbiAgICB2YXIgZm5UZXN0ID0gL3h5ei8udGVzdChmdW5jdGlvbigpeyB4eXo7IH0pID8gL1xcYnBhcmVudFxcYi8gOiAvLiovO1xuICAgIHByb3BzID0gcHJvcHMgfHwge307XG5cbiAgICBmb3IodmFyIGsgaW4gcHJvcHMpIHtcbiAgICAgICAgdmFyIHNyYyA9IHByb3BzW2tdO1xuICAgICAgICB2YXIgcGFyZW50ID0gcHJvdG90eXBlW2tdO1xuXG4gICAgICAgIGlmKHR5cGVvZiBwYXJlbnQgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgICAgdHlwZW9mIHNyYyA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICAgICBmblRlc3QudGVzdChzcmMpKSB7XG4gICAgICAgICAgICBwcm90b3R5cGVba10gPSAoZnVuY3Rpb24gKHNyYywgcGFyZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTYXZlIHRoZSBjdXJyZW50IHBhcmVudCBtZXRob2RcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRtcCA9IHRoaXMucGFyZW50O1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFNldCBwYXJlbnQgdG8gdGhlIHByZXZpb3VzIG1ldGhvZCwgY2FsbCwgYW5kIHJlc3RvcmVcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXMgPSBzcmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnQgPSB0bXA7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSkoc3JjLCBwYXJlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcHJvdG90eXBlW2tdID0gc3JjO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJvdG90eXBlLnR5cGVuYW1lID0gbmFtZTtcblxuICAgIHZhciBuZXdfY2xzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKHByb3RvdHlwZS5pbml0KSB7XG4gICAgICAgICAgICBwcm90b3R5cGUuaW5pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG5ld19jbHMucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIG5ld19jbHMucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gbmV3X2NscztcblxuICAgIG5ld19jbHMuZXh0ZW5kID0gZnVuY3Rpb24obmFtZSwgcHJvcHMpIHtcbiAgICAgICAgaWYodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBwcm9wcyA9IG5hbWU7XG4gICAgICAgICAgICBuYW1lID0gJ2Fub255bW91cyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV4dGVuZChuZXdfY2xzLCBuYW1lLCBwcm9wcyk7XG4gICAgfTtcblxuICAgIHJldHVybiBuZXdfY2xzO1xufVxuXG5tb2R1bGVzWydvYmplY3QnXSA9IGV4dGVuZChPYmplY3QsICdPYmplY3QnLCB7fSk7XG59KSgpO1xuKGZ1bmN0aW9uKCkge1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZTtcbnZhciBPYmpQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbnZhciBlc2NhcGVNYXAgPSB7XG4gICAgJyYnOiAnJmFtcDsnLFxuICAgICdcIic6ICcmcXVvdDsnLFxuICAgICdcXCcnOiAnJiMzOTsnLFxuICAgICc8JzogJyZsdDsnLFxuICAgICc+JzogJyZndDsnXG59O1xuXG52YXIgZXNjYXBlUmVnZXggPSAvWyZcIic8Pl0vZztcblxudmFyIGxvb2t1cEVzY2FwZSA9IGZ1bmN0aW9uKGNoKSB7XG4gICAgcmV0dXJuIGVzY2FwZU1hcFtjaF07XG59O1xuXG52YXIgZXhwb3J0cyA9IG1vZHVsZXNbJ2xpYiddID0ge307XG5cbmV4cG9ydHMud2l0aFByZXR0eUVycm9ycyA9IGZ1bmN0aW9uKHBhdGgsIHdpdGhJbnRlcm5hbHMsIGZ1bmMpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZnVuYygpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKCFlLlVwZGF0ZSkge1xuICAgICAgICAgICAgLy8gbm90IG9uZSBvZiBvdXJzLCBjYXN0IGl0XG4gICAgICAgICAgICBlID0gbmV3IGV4cG9ydHMuVGVtcGxhdGVFcnJvcihlKTtcbiAgICAgICAgfVxuICAgICAgICBlLlVwZGF0ZShwYXRoKTtcblxuICAgICAgICAvLyBVbmxlc3MgdGhleSBtYXJrZWQgdGhlIGRldiBmbGFnLCBzaG93IHRoZW0gYSB0cmFjZSBmcm9tIGhlcmVcbiAgICAgICAgaWYgKCF3aXRoSW50ZXJuYWxzKSB7XG4gICAgICAgICAgICB2YXIgb2xkID0gZTtcbiAgICAgICAgICAgIGUgPSBuZXcgRXJyb3Iob2xkLm1lc3NhZ2UpO1xuICAgICAgICAgICAgZS5uYW1lID0gb2xkLm5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICB0aHJvdyBlO1xuICAgIH1cbn07XG5cbmV4cG9ydHMuVGVtcGxhdGVFcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UsIGxpbmVubywgY29sbm8pIHtcbiAgICB2YXIgZXJyID0gdGhpcztcblxuICAgIGlmIChtZXNzYWdlIGluc3RhbmNlb2YgRXJyb3IpIHsgLy8gZm9yIGNhc3RpbmcgcmVndWxhciBqcyBlcnJvcnNcbiAgICAgICAgZXJyID0gbWVzc2FnZTtcbiAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UubmFtZSArICc6ICcgKyBtZXNzYWdlLm1lc3NhZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICAgICAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKGVycik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlcnIubmFtZSA9ICdUZW1wbGF0ZSByZW5kZXIgZXJyb3InO1xuICAgIGVyci5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICBlcnIubGluZW5vID0gbGluZW5vO1xuICAgIGVyci5jb2xubyA9IGNvbG5vO1xuICAgIGVyci5maXJzdFVwZGF0ZSA9IHRydWU7XG5cbiAgICBlcnIuVXBkYXRlID0gZnVuY3Rpb24ocGF0aCkge1xuICAgICAgICB2YXIgbWVzc2FnZSA9ICcoJyArIChwYXRoIHx8ICd1bmtub3duIHBhdGgnKSArICcpJztcblxuICAgICAgICAvLyBvbmx5IHNob3cgbGluZW5vICsgY29sbm8gbmV4dCB0byBwYXRoIG9mIHRlbXBsYXRlXG4gICAgICAgIC8vIHdoZXJlIGVycm9yIG9jY3VycmVkXG4gICAgICAgIGlmICh0aGlzLmZpcnN0VXBkYXRlKSB7XG4gICAgICAgICAgICBpZih0aGlzLmxpbmVubyAmJiB0aGlzLmNvbG5vKSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZSArPSAnIFtMaW5lICcgKyB0aGlzLmxpbmVubyArICcsIENvbHVtbiAnICsgdGhpcy5jb2xubyArICddJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYodGhpcy5saW5lbm8pIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlICs9ICcgW0xpbmUgJyArIHRoaXMubGluZW5vICsgJ10nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbWVzc2FnZSArPSAnXFxuICc7XG4gICAgICAgIGlmICh0aGlzLmZpcnN0VXBkYXRlKSB7XG4gICAgICAgICAgICBtZXNzYWdlICs9ICcgJztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2UgKyAodGhpcy5tZXNzYWdlIHx8ICcnKTtcbiAgICAgICAgdGhpcy5maXJzdFVwZGF0ZSA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgcmV0dXJuIGVycjtcbn07XG5cbmV4cG9ydHMuVGVtcGxhdGVFcnJvci5wcm90b3R5cGUgPSBFcnJvci5wcm90b3R5cGU7XG5cbmV4cG9ydHMuZXNjYXBlID0gZnVuY3Rpb24odmFsKSB7XG4gIHJldHVybiB2YWwucmVwbGFjZShlc2NhcGVSZWdleCwgbG9va3VwRXNjYXBlKTtcbn07XG5cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG59O1xuXG5leHBvcnRzLmlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuXG5leHBvcnRzLmlzU3RyaW5nID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgU3RyaW5nXSc7XG59O1xuXG5leHBvcnRzLmlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgT2JqZWN0XSc7XG59O1xuXG5leHBvcnRzLmdyb3VwQnkgPSBmdW5jdGlvbihvYmosIHZhbCkge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICB2YXIgaXRlcmF0b3IgPSBleHBvcnRzLmlzRnVuY3Rpb24odmFsKSA/IHZhbCA6IGZ1bmN0aW9uKG9iaikgeyByZXR1cm4gb2JqW3ZhbF07IH07XG4gICAgZm9yKHZhciBpPTA7IGk8b2JqLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IG9ialtpXTtcbiAgICAgICAgdmFyIGtleSA9IGl0ZXJhdG9yKHZhbHVlLCBpKTtcbiAgICAgICAgKHJlc3VsdFtrZXldIHx8IChyZXN1bHRba2V5XSA9IFtdKSkucHVzaCh2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5leHBvcnRzLnRvQXJyYXkgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwob2JqKTtcbn07XG5cbmV4cG9ydHMud2l0aG91dCA9IGZ1bmN0aW9uKGFycmF5KSB7XG4gICAgdmFyIHJlc3VsdCA9IFtdO1xuICAgIGlmICghYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgdmFyIGluZGV4ID0gLTEsXG4gICAgbGVuZ3RoID0gYXJyYXkubGVuZ3RoLFxuICAgIGNvbnRhaW5zID0gZXhwb3J0cy50b0FycmF5KGFyZ3VtZW50cykuc2xpY2UoMSk7XG5cbiAgICB3aGlsZSgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgICAgIGlmKGV4cG9ydHMuaW5kZXhPZihjb250YWlucywgYXJyYXlbaW5kZXhdKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGFycmF5W2luZGV4XSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbmV4cG9ydHMuZXh0ZW5kID0gZnVuY3Rpb24ob2JqLCBvYmoyKSB7XG4gICAgZm9yKHZhciBrIGluIG9iajIpIHtcbiAgICAgICAgb2JqW2tdID0gb2JqMltrXTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbn07XG5cbmV4cG9ydHMucmVwZWF0ID0gZnVuY3Rpb24oY2hhcl8sIG4pIHtcbiAgICB2YXIgc3RyID0gJyc7XG4gICAgZm9yKHZhciBpPTA7IGk8bjsgaSsrKSB7XG4gICAgICAgIHN0ciArPSBjaGFyXztcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbn07XG5cbmV4cG9ydHMuZWFjaCA9IGZ1bmN0aW9uKG9iaiwgZnVuYywgY29udGV4dCkge1xuICAgIGlmKG9iaiA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZihBcnJheVByb3RvLmVhY2ggJiYgb2JqLmVhY2ggPT09IEFycmF5UHJvdG8uZWFjaCkge1xuICAgICAgICBvYmouZm9yRWFjaChmdW5jLCBjb250ZXh0KTtcbiAgICB9XG4gICAgZWxzZSBpZihvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuICAgICAgICBmb3IodmFyIGk9MCwgbD1vYmoubGVuZ3RoOyBpPGw7IGkrKykge1xuICAgICAgICAgICAgZnVuYy5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmV4cG9ydHMubWFwID0gZnVuY3Rpb24ob2JqLCBmdW5jKSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBpZihvYmogPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG5cbiAgICBpZihBcnJheVByb3RvLm1hcCAmJiBvYmoubWFwID09PSBBcnJheVByb3RvLm1hcCkge1xuICAgICAgICByZXR1cm4gb2JqLm1hcChmdW5jKTtcbiAgICB9XG5cbiAgICBmb3IodmFyIGk9MDsgaTxvYmoubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVzdWx0c1tyZXN1bHRzLmxlbmd0aF0gPSBmdW5jKG9ialtpXSwgaSk7XG4gICAgfVxuXG4gICAgaWYob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgICAgcmVzdWx0cy5sZW5ndGggPSBvYmoubGVuZ3RoO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHRzO1xufTtcblxuZXhwb3J0cy5hc3luY0l0ZXIgPSBmdW5jdGlvbihhcnIsIGl0ZXIsIGNiKSB7XG4gICAgdmFyIGkgPSAtMTtcblxuICAgIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAgIGkrKztcblxuICAgICAgICBpZihpIDwgYXJyLmxlbmd0aCkge1xuICAgICAgICAgICAgaXRlcihhcnJbaV0sIGksIG5leHQsIGNiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNiKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXh0KCk7XG59O1xuXG5leHBvcnRzLmFzeW5jRm9yID0gZnVuY3Rpb24ob2JqLCBpdGVyLCBjYikge1xuICAgIHZhciBrZXlzID0gZXhwb3J0cy5rZXlzKG9iaik7XG4gICAgdmFyIGxlbiA9IGtleXMubGVuZ3RoO1xuICAgIHZhciBpID0gLTE7XG5cbiAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICBpKys7XG4gICAgICAgIHZhciBrID0ga2V5c1tpXTtcblxuICAgICAgICBpZihpIDwgbGVuKSB7XG4gICAgICAgICAgICBpdGVyKGssIG9ialtrXSwgaSwgbGVuLCBuZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNiKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXh0KCk7XG59O1xuXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9BcnJheS9pbmRleE9mI1BvbHlmaWxsXG5leHBvcnRzLmluZGV4T2YgPSBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA/XG4gICAgZnVuY3Rpb24gKGFyciwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XG4gICAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGFyciwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KTtcbiAgICB9IDpcbiAgICBmdW5jdGlvbiAoYXJyLCBzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpIHtcbiAgICAgICAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoID4+PiAwOyAvLyBIYWNrIHRvIGNvbnZlcnQgb2JqZWN0Lmxlbmd0aCB0byBhIFVJbnQzMlxuXG4gICAgICAgIGZyb21JbmRleCA9ICtmcm9tSW5kZXggfHwgMDtcblxuICAgICAgICBpZihNYXRoLmFicyhmcm9tSW5kZXgpID09PSBJbmZpbml0eSkge1xuICAgICAgICAgICAgZnJvbUluZGV4ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGZyb21JbmRleCA8IDApIHtcbiAgICAgICAgICAgIGZyb21JbmRleCArPSBsZW5ndGg7XG4gICAgICAgICAgICBpZiAoZnJvbUluZGV4IDwgMCkge1xuICAgICAgICAgICAgICAgIGZyb21JbmRleCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoO2Zyb21JbmRleCA8IGxlbmd0aDsgZnJvbUluZGV4KyspIHtcbiAgICAgICAgICAgIGlmIChhcnJbZnJvbUluZGV4XSA9PT0gc2VhcmNoRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmcm9tSW5kZXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfTtcblxuaWYoIUFycmF5LnByb3RvdHlwZS5tYXApIHtcbiAgICBBcnJheS5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbWFwIGlzIHVuaW1wbGVtZW50ZWQgZm9yIHRoaXMganMgZW5naW5lJyk7XG4gICAgfTtcbn1cblxuZXhwb3J0cy5rZXlzID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYoT2JqZWN0LnByb3RvdHlwZS5rZXlzKSB7XG4gICAgICAgIHJldHVybiBvYmoua2V5cygpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIGtleXMgPSBbXTtcbiAgICAgICAgZm9yKHZhciBrIGluIG9iaikge1xuICAgICAgICAgICAgaWYob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXlzO1xuICAgIH1cbn1cbn0pKCk7XG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBsaWIgPSBtb2R1bGVzW1wibGliXCJdO1xudmFyIE9iaiA9IG1vZHVsZXNbXCJvYmplY3RcIl07XG5cbi8vIEZyYW1lcyBrZWVwIHRyYWNrIG9mIHNjb3BpbmcgYm90aCBhdCBjb21waWxlLXRpbWUgYW5kIHJ1bi10aW1lIHNvXG4vLyB3ZSBrbm93IGhvdyB0byBhY2Nlc3MgdmFyaWFibGVzLiBCbG9jayB0YWdzIGNhbiBpbnRyb2R1Y2Ugc3BlY2lhbFxuLy8gdmFyaWFibGVzLCBmb3IgZXhhbXBsZS5cbnZhciBGcmFtZSA9IE9iai5leHRlbmQoe1xuICAgIGluaXQ6IGZ1bmN0aW9uKHBhcmVudCkge1xuICAgICAgICB0aGlzLnZhcmlhYmxlcyA9IHt9O1xuICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB9LFxuXG4gICAgc2V0OiBmdW5jdGlvbihuYW1lLCB2YWwsIHJlc29sdmVVcCkge1xuICAgICAgICAvLyBBbGxvdyB2YXJpYWJsZXMgd2l0aCBkb3RzIGJ5IGF1dG9tYXRpY2FsbHkgY3JlYXRpbmcgdGhlXG4gICAgICAgIC8vIG5lc3RlZCBzdHJ1Y3R1cmVcbiAgICAgICAgdmFyIHBhcnRzID0gbmFtZS5zcGxpdCgnLicpO1xuICAgICAgICB2YXIgb2JqID0gdGhpcy52YXJpYWJsZXM7XG4gICAgICAgIHZhciBmcmFtZSA9IHRoaXM7XG5cbiAgICAgICAgaWYocmVzb2x2ZVVwKSB7XG4gICAgICAgICAgICBpZigoZnJhbWUgPSB0aGlzLnJlc29sdmUocGFydHNbMF0pKSkge1xuICAgICAgICAgICAgICAgIGZyYW1lLnNldChuYW1lLCB2YWwpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZyYW1lID0gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHBhcnRzLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgdmFyIGlkID0gcGFydHNbaV07XG5cbiAgICAgICAgICAgIGlmKCFvYmpbaWRdKSB7XG4gICAgICAgICAgICAgICAgb2JqW2lkXSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb2JqID0gb2JqW2lkXTtcbiAgICAgICAgfVxuXG4gICAgICAgIG9ialtwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXV0gPSB2YWw7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB2YXIgdmFsID0gdGhpcy52YXJpYWJsZXNbbmFtZV07XG4gICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkICYmIHZhbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuXG4gICAgbG9va3VwOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5wYXJlbnQ7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLnZhcmlhYmxlc1tuYW1lXTtcbiAgICAgICAgaWYodmFsICE9PSB1bmRlZmluZWQgJiYgdmFsICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwICYmIHAubG9va3VwKG5hbWUpO1xuICAgIH0sXG5cbiAgICByZXNvbHZlOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5wYXJlbnQ7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLnZhcmlhYmxlc1tuYW1lXTtcbiAgICAgICAgaWYodmFsICE9PSB1bmRlZmluZWQgJiYgdmFsICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcCAmJiBwLnJlc29sdmUobmFtZSk7XG4gICAgfSxcblxuICAgIHB1c2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbmV3IEZyYW1lKHRoaXMpO1xuICAgIH0sXG5cbiAgICBwb3A6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQ7XG4gICAgfVxufSk7XG5cbmZ1bmN0aW9uIG1ha2VNYWNybyhhcmdOYW1lcywga3dhcmdOYW1lcywgZnVuYykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFyZ0NvdW50ID0gbnVtQXJncyhhcmd1bWVudHMpO1xuICAgICAgICB2YXIgYXJncztcbiAgICAgICAgdmFyIGt3YXJncyA9IGdldEtleXdvcmRBcmdzKGFyZ3VtZW50cyk7XG5cbiAgICAgICAgaWYoYXJnQ291bnQgPiBhcmdOYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsIGFyZ05hbWVzLmxlbmd0aCk7XG5cbiAgICAgICAgICAgIC8vIFBvc2l0aW9uYWwgYXJndW1lbnRzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCBpbiBhc1xuICAgICAgICAgICAgLy8ga2V5d29yZCBhcmd1bWVudHMgKGVzc2VudGlhbGx5IGRlZmF1bHQgdmFsdWVzKVxuICAgICAgICAgICAgdmFyIHZhbHMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIGFyZ3MubGVuZ3RoLCBhcmdDb3VudCk7XG4gICAgICAgICAgICBmb3IodmFyIGk9MDsgaTx2YWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYoaSA8IGt3YXJnTmFtZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGt3YXJnc1trd2FyZ05hbWVzW2ldXSA9IHZhbHNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhcmdzLnB1c2goa3dhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKGFyZ0NvdW50IDwgYXJnTmFtZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCBhcmdDb3VudCk7XG5cbiAgICAgICAgICAgIGZvcih2YXIgaT1hcmdDb3VudDsgaTxhcmdOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBhcmcgPSBhcmdOYW1lc1tpXTtcblxuICAgICAgICAgICAgICAgIC8vIEtleXdvcmQgYXJndW1lbnRzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCBhc1xuICAgICAgICAgICAgICAgIC8vIHBvc2l0aW9uYWwgYXJndW1lbnRzLCBpLmUuIHRoZSBjYWxsZXIgZXhwbGljaXRseVxuICAgICAgICAgICAgICAgIC8vIHVzZWQgdGhlIG5hbWUgb2YgYSBwb3NpdGlvbmFsIGFyZ1xuICAgICAgICAgICAgICAgIGFyZ3MucHVzaChrd2FyZ3NbYXJnXSk7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGt3YXJnc1thcmddO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhcmdzLnB1c2goa3dhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnVuYy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBtYWtlS2V5d29yZEFyZ3Mob2JqKSB7XG4gICAgb2JqLl9fa2V5d29yZHMgPSB0cnVlO1xuICAgIHJldHVybiBvYmo7XG59XG5cbmZ1bmN0aW9uIGdldEtleXdvcmRBcmdzKGFyZ3MpIHtcbiAgICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gICAgaWYobGVuKSB7XG4gICAgICAgIHZhciBsYXN0QXJnID0gYXJnc1tsZW4gLSAxXTtcbiAgICAgICAgaWYobGFzdEFyZyAmJiBsYXN0QXJnLmhhc093blByb3BlcnR5KCdfX2tleXdvcmRzJykpIHtcbiAgICAgICAgICAgIHJldHVybiBsYXN0QXJnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7fTtcbn1cblxuZnVuY3Rpb24gbnVtQXJncyhhcmdzKSB7XG4gICAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICAgIGlmKGxlbiA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICB2YXIgbGFzdEFyZyA9IGFyZ3NbbGVuIC0gMV07XG4gICAgaWYobGFzdEFyZyAmJiBsYXN0QXJnLmhhc093blByb3BlcnR5KCdfX2tleXdvcmRzJykpIHtcbiAgICAgICAgcmV0dXJuIGxlbiAtIDE7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gbGVuO1xuICAgIH1cbn1cblxuLy8gQSBTYWZlU3RyaW5nIG9iamVjdCBpbmRpY2F0ZXMgdGhhdCB0aGUgc3RyaW5nIHNob3VsZCBub3QgYmVcbi8vIGF1dG9lc2NhcGVkLiBUaGlzIGhhcHBlbnMgbWFnaWNhbGx5IGJlY2F1c2UgYXV0b2VzY2FwaW5nIG9ubHlcbi8vIG9jY3VycyBvbiBwcmltaXRpdmUgc3RyaW5nIG9iamVjdHMuXG5mdW5jdGlvbiBTYWZlU3RyaW5nKHZhbCkge1xuICAgIGlmKHR5cGVvZiB2YWwgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuXG4gICAgdGhpcy52YWwgPSB2YWw7XG59XG5cblNhZmVTdHJpbmcucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShTdHJpbmcucHJvdG90eXBlKTtcblNhZmVTdHJpbmcucHJvdG90eXBlLnZhbHVlT2YgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy52YWw7XG59O1xuU2FmZVN0cmluZy5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy52YWw7XG59O1xuXG5mdW5jdGlvbiBjb3B5U2FmZW5lc3MoZGVzdCwgdGFyZ2V0KSB7XG4gICAgaWYoZGVzdCBpbnN0YW5jZW9mIFNhZmVTdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTYWZlU3RyaW5nKHRhcmdldCk7XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXQudG9TdHJpbmcoKTtcbn1cblxuZnVuY3Rpb24gbWFya1NhZmUodmFsKSB7XG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsO1xuXG4gICAgaWYodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTYWZlU3RyaW5nKHZhbCk7XG4gICAgfVxuICAgIGVsc2UgaWYodHlwZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHJldCA9IHZhbC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICBpZih0eXBlb2YgcmV0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU2FmZVN0cmluZyhyZXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc3VwcHJlc3NWYWx1ZSh2YWwsIGF1dG9lc2NhcGUpIHtcbiAgICB2YWwgPSAodmFsICE9PSB1bmRlZmluZWQgJiYgdmFsICE9PSBudWxsKSA/IHZhbCA6ICcnO1xuXG4gICAgaWYoYXV0b2VzY2FwZSAmJiB0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgICAgICB2YWwgPSBsaWIuZXNjYXBlKHZhbCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbDtcbn1cblxuZnVuY3Rpb24gbWVtYmVyTG9va3VwKG9iaiwgdmFsKSB7XG4gICAgb2JqID0gb2JqIHx8IHt9O1xuXG4gICAgaWYodHlwZW9mIG9ialt2YWxdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmpbdmFsXS5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG9ialt2YWxdO1xufVxuXG5mdW5jdGlvbiBjYWxsV3JhcChvYmosIG5hbWUsIGFyZ3MpIHtcbiAgICBpZighb2JqKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGNhbGwgYCcgKyBuYW1lICsgJ2AsIHdoaWNoIGlzIHVuZGVmaW5lZCBvciBmYWxzZXknKTtcbiAgICB9XG4gICAgZWxzZSBpZih0eXBlb2Ygb2JqICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5hYmxlIHRvIGNhbGwgYCcgKyBuYW1lICsgJ2AsIHdoaWNoIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9iai5hcHBseSh0aGlzLCBhcmdzKTtcbn1cblxuZnVuY3Rpb24gY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIG5hbWUpIHtcbiAgICB2YXIgdmFsID0gZnJhbWUubG9va3VwKG5hbWUpO1xuICAgIHJldHVybiAodmFsICE9PSB1bmRlZmluZWQgJiYgdmFsICE9PSBudWxsKSA/XG4gICAgICAgIHZhbCA6XG4gICAgICAgIGNvbnRleHQubG9va3VwKG5hbWUpO1xufVxuXG5mdW5jdGlvbiBoYW5kbGVFcnJvcihlcnJvciwgbGluZW5vLCBjb2xubykge1xuICAgIGlmKGVycm9yLmxpbmVubykge1xuICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IGxpYi5UZW1wbGF0ZUVycm9yKGVycm9yLCBsaW5lbm8sIGNvbG5vKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFzeW5jRWFjaChhcnIsIGRpbWVuLCBpdGVyLCBjYikge1xuICAgIGlmKGxpYi5pc0FycmF5KGFycikpIHtcbiAgICAgICAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG5cbiAgICAgICAgbGliLmFzeW5jSXRlcihhcnIsIGZ1bmN0aW9uKGl0ZW0sIGksIG5leHQpIHtcbiAgICAgICAgICAgIHN3aXRjaChkaW1lbikge1xuICAgICAgICAgICAgY2FzZSAxOiBpdGVyKGl0ZW0sIGksIGxlbiwgbmV4dCk7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOiBpdGVyKGl0ZW1bMF0sIGl0ZW1bMV0sIGksIGxlbiwgbmV4dCk7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOiBpdGVyKGl0ZW1bMF0sIGl0ZW1bMV0sIGl0ZW1bMl0sIGksIGxlbiwgbmV4dCk7IGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBpdGVtLnB1c2goaSwgbmV4dCk7XG4gICAgICAgICAgICAgICAgaXRlci5hcHBseSh0aGlzLCBpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgY2IpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbGliLmFzeW5jRm9yKGFyciwgZnVuY3Rpb24oa2V5LCB2YWwsIGksIGxlbiwgbmV4dCkge1xuICAgICAgICAgICAgaXRlcihrZXksIHZhbCwgaSwgbGVuLCBuZXh0KTtcbiAgICAgICAgfSwgY2IpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYXN5bmNBbGwoYXJyLCBkaW1lbiwgZnVuYywgY2IpIHtcbiAgICB2YXIgZmluaXNoZWQgPSAwO1xuICAgIHZhciBsZW47XG4gICAgdmFyIG91dHB1dEFycjtcblxuICAgIGZ1bmN0aW9uIGRvbmUoaSwgb3V0cHV0KSB7XG4gICAgICAgIGZpbmlzaGVkKys7XG4gICAgICAgIG91dHB1dEFycltpXSA9IG91dHB1dDtcblxuICAgICAgICBpZihmaW5pc2hlZCA9PT0gbGVuKSB7XG4gICAgICAgICAgICBjYihudWxsLCBvdXRwdXRBcnIuam9pbignJykpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYobGliLmlzQXJyYXkoYXJyKSkge1xuICAgICAgICBsZW4gPSBhcnIubGVuZ3RoO1xuICAgICAgICBvdXRwdXRBcnIgPSBuZXcgQXJyYXkobGVuKTtcblxuICAgICAgICBpZihsZW4gPT09IDApIHtcbiAgICAgICAgICAgIGNiKG51bGwsICcnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvcih2YXIgaT0wOyBpPGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBpdGVtID0gYXJyW2ldO1xuXG4gICAgICAgICAgICAgICAgc3dpdGNoKGRpbWVuKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAxOiBmdW5jKGl0ZW0sIGksIGxlbiwgZG9uZSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMjogZnVuYyhpdGVtWzBdLCBpdGVtWzFdLCBpLCBsZW4sIGRvbmUpOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDM6IGZ1bmMoaXRlbVswXSwgaXRlbVsxXSwgaXRlbVsyXSwgaSwgbGVuLCBkb25lKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5wdXNoKGksIGRvbmUpO1xuICAgICAgICAgICAgICAgICAgICBmdW5jLmFwcGx5KHRoaXMsIGl0ZW0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIGtleXMgPSBsaWIua2V5cyhhcnIpO1xuICAgICAgICBsZW4gPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgb3V0cHV0QXJyID0gbmV3IEFycmF5KGxlbik7XG5cbiAgICAgICAgaWYobGVuID09PSAwKSB7XG4gICAgICAgICAgICBjYihudWxsLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IodmFyIGk9MDsgaTxrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGsgPSBrZXlzW2ldO1xuICAgICAgICAgICAgICAgIGZ1bmMoaywgYXJyW2tdLCBpLCBsZW4sIGRvbmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGVzWydydW50aW1lJ10gPSB7XG4gICAgRnJhbWU6IEZyYW1lLFxuICAgIG1ha2VNYWNybzogbWFrZU1hY3JvLFxuICAgIG1ha2VLZXl3b3JkQXJnczogbWFrZUtleXdvcmRBcmdzLFxuICAgIG51bUFyZ3M6IG51bUFyZ3MsXG4gICAgc3VwcHJlc3NWYWx1ZTogc3VwcHJlc3NWYWx1ZSxcbiAgICBtZW1iZXJMb29rdXA6IG1lbWJlckxvb2t1cCxcbiAgICBjb250ZXh0T3JGcmFtZUxvb2t1cDogY29udGV4dE9yRnJhbWVMb29rdXAsXG4gICAgY2FsbFdyYXA6IGNhbGxXcmFwLFxuICAgIGhhbmRsZUVycm9yOiBoYW5kbGVFcnJvcixcbiAgICBpc0FycmF5OiBsaWIuaXNBcnJheSxcbiAgICBrZXlzOiBsaWIua2V5cyxcbiAgICBTYWZlU3RyaW5nOiBTYWZlU3RyaW5nLFxuICAgIGNvcHlTYWZlbmVzczogY29weVNhZmVuZXNzLFxuICAgIG1hcmtTYWZlOiBtYXJrU2FmZSxcbiAgICBhc3luY0VhY2g6IGFzeW5jRWFjaCxcbiAgICBhc3luY0FsbDogYXN5bmNBbGxcbn07XG59KSgpO1xuKGZ1bmN0aW9uKCkge1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgcGF0aCA9IG1vZHVsZXNbXCJwYXRoXCJdO1xudmFyIE9iaiA9IG1vZHVsZXNbXCJvYmplY3RcIl07XG52YXIgbGliID0gbW9kdWxlc1tcImxpYlwiXTtcblxudmFyIExvYWRlciA9IE9iai5leHRlbmQoe1xuICAgIG9uOiBmdW5jdGlvbihuYW1lLCBmdW5jKSB7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMgfHwge307XG4gICAgICAgIHRoaXMubGlzdGVuZXJzW25hbWVdID0gdGhpcy5saXN0ZW5lcnNbbmFtZV0gfHwgW107XG4gICAgICAgIHRoaXMubGlzdGVuZXJzW25hbWVdLnB1c2goZnVuYyk7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKG5hbWUgLyosIGFyZzEsIGFyZzIsIC4uLiovKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgICAgICBpZih0aGlzLmxpc3RlbmVycyAmJiB0aGlzLmxpc3RlbmVyc1tuYW1lXSkge1xuICAgICAgICAgICAgbGliLmVhY2godGhpcy5saXN0ZW5lcnNbbmFtZV0sIGZ1bmN0aW9uKGxpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZXNvbHZlOiBmdW5jdGlvbihmcm9tLCB0bykge1xuICAgICAgICByZXR1cm4gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShmcm9tKSwgdG8pO1xuICAgIH0sXG5cbiAgICBpc1JlbGF0aXZlOiBmdW5jdGlvbihmaWxlbmFtZSkge1xuICAgICAgICByZXR1cm4gKGZpbGVuYW1lLmluZGV4T2YoJy4vJykgPT09IDAgfHwgZmlsZW5hbWUuaW5kZXhPZignLi4vJykgPT09IDApO1xuICAgIH1cbn0pO1xuXG5tb2R1bGVzWydsb2FkZXInXSA9IExvYWRlcjtcbn0pKCk7XG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBMb2FkZXIgPSBtb2R1bGVzW1wibG9hZGVyXCJdO1xuXG52YXIgV2ViTG9hZGVyID0gTG9hZGVyLmV4dGVuZCh7XG4gICAgaW5pdDogZnVuY3Rpb24oYmFzZVVSTCwgbmV2ZXJVcGRhdGUpIHtcbiAgICAgICAgLy8gSXQncyBlYXN5IHRvIHVzZSBwcmVjb21waWxlZCB0ZW1wbGF0ZXM6IGp1c3QgaW5jbHVkZSB0aGVtXG4gICAgICAgIC8vIGJlZm9yZSB5b3UgY29uZmlndXJlIG51bmp1Y2tzIGFuZCB0aGlzIHdpbGwgYXV0b21hdGljYWxseVxuICAgICAgICAvLyBwaWNrIGl0IHVwIGFuZCB1c2UgaXRcbiAgICAgICAgdGhpcy5wcmVjb21waWxlZCA9IHdpbmRvdy5udW5qdWNrc1ByZWNvbXBpbGVkIHx8IHt9O1xuXG4gICAgICAgIHRoaXMuYmFzZVVSTCA9IGJhc2VVUkwgfHwgJyc7XG4gICAgICAgIHRoaXMubmV2ZXJVcGRhdGUgPSBuZXZlclVwZGF0ZTtcbiAgICB9LFxuXG4gICAgZ2V0U291cmNlOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIGlmKHRoaXMucHJlY29tcGlsZWRbbmFtZV0pIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3JjOiB7IHR5cGU6ICdjb2RlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgb2JqOiB0aGlzLnByZWNvbXBpbGVkW25hbWVdIH0sXG4gICAgICAgICAgICAgICAgcGF0aDogbmFtZVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzcmMgPSB0aGlzLmZldGNoKHRoaXMuYmFzZVVSTCArICcvJyArIG5hbWUpO1xuICAgICAgICAgICAgaWYoIXNyYykge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4geyBzcmM6IHNyYyxcbiAgICAgICAgICAgICAgICAgICAgIHBhdGg6IG5hbWUsXG4gICAgICAgICAgICAgICAgICAgICBub0NhY2hlOiAhdGhpcy5uZXZlclVwZGF0ZSB9O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGZldGNoOiBmdW5jdGlvbih1cmwsIGNhbGxiYWNrKSB7XG4gICAgICAgIC8vIE9ubHkgaW4gdGhlIGJyb3dzZXIgcGxlYXNlXG4gICAgICAgIHZhciBhamF4O1xuICAgICAgICB2YXIgbG9hZGluZyA9IHRydWU7XG4gICAgICAgIHZhciBzcmM7XG5cbiAgICAgICAgaWYod2luZG93LlhNTEh0dHBSZXF1ZXN0KSB7IC8vIE1vemlsbGEsIFNhZmFyaSwgLi4uXG4gICAgICAgICAgICBhamF4ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih3aW5kb3cuQWN0aXZlWE9iamVjdCkgeyAvLyBJRSA4IGFuZCBvbGRlclxuICAgICAgICAgICAgYWpheCA9IG5ldyBBY3RpdmVYT2JqZWN0KCdNaWNyb3NvZnQuWE1MSFRUUCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgYWpheC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmKGFqYXgucmVhZHlTdGF0ZSA9PT0gNCAmJiAoYWpheC5zdGF0dXMgPT09IDAgfHwgYWpheC5zdGF0dXMgPT09IDIwMCkgJiYgbG9hZGluZykge1xuICAgICAgICAgICAgICAgIGxvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzcmMgPSBhamF4LnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB1cmwgKz0gKHVybC5pbmRleE9mKCc/JykgPT09IC0xID8gJz8nIDogJyYnKSArICdzPScgK1xuICAgICAgICAgICAgICAgKG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcblxuICAgICAgICAvLyBTeW5jaHJvbm91cyBiZWNhdXNlIHRoaXMgQVBJIHNob3VsZG4ndCBiZSB1c2VkIGluXG4gICAgICAgIC8vIHByb2R1Y3Rpb24gKHByZS1sb2FkIGNvbXBpbGVkIHRlbXBsYXRlcyBpbnN0ZWFkKVxuICAgICAgICBhamF4Lm9wZW4oJ0dFVCcsIHVybCwgZmFsc2UpO1xuICAgICAgICBhamF4LnNlbmQoKTtcblxuICAgICAgICByZXR1cm4gc3JjO1xuICAgIH1cbn0pO1xuXG5tb2R1bGVzWyd3ZWItbG9hZGVycyddID0ge1xuICAgIFdlYkxvYWRlcjogV2ViTG9hZGVyXG59O1xufSkoKTtcbihmdW5jdGlvbigpIHtcbmlmKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnIHx8IHdpbmRvdyAhPT0gdGhpcykge1xuICAgIG1vZHVsZXNbJ2xvYWRlcnMnXSA9IG1vZHVsZXNbXCJub2RlLWxvYWRlcnNcIl07XG59XG5lbHNlIHtcbiAgICBtb2R1bGVzWydsb2FkZXJzJ10gPSBtb2R1bGVzW1wid2ViLWxvYWRlcnNcIl07XG59XG59KSgpO1xuKGZ1bmN0aW9uKCkge1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgbGliID0gbW9kdWxlc1tcImxpYlwiXTtcbnZhciByID0gbW9kdWxlc1tcInJ1bnRpbWVcIl07XG5cbnZhciBmaWx0ZXJzID0ge1xuICAgIGFiczogZnVuY3Rpb24obikge1xuICAgICAgICByZXR1cm4gTWF0aC5hYnMobik7XG4gICAgfSxcblxuICAgIGJhdGNoOiBmdW5jdGlvbihhcnIsIGxpbmVjb3VudCwgZmlsbF93aXRoKSB7XG4gICAgICAgIHZhciByZXMgPSBbXTtcbiAgICAgICAgdmFyIHRtcCA9IFtdO1xuXG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoaSAlIGxpbmVjb3VudCA9PT0gMCAmJiB0bXAubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmVzLnB1c2godG1wKTtcbiAgICAgICAgICAgICAgICB0bXAgPSBbXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdG1wLnB1c2goYXJyW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHRtcC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGlmKGZpbGxfd2l0aCkge1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaT10bXAubGVuZ3RoOyBpPGxpbmVjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRtcC5wdXNoKGZpbGxfd2l0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXMucHVzaCh0bXApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgY2FwaXRhbGl6ZTogZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgIHZhciByZXQgPSBzdHIudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcmV0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcmV0LnNsaWNlKDEpKTtcbiAgICB9LFxuXG4gICAgY2VudGVyOiBmdW5jdGlvbihzdHIsIHdpZHRoKSB7XG4gICAgICAgIHdpZHRoID0gd2lkdGggfHwgODA7XG5cbiAgICAgICAgaWYoc3RyLmxlbmd0aCA+PSB3aWR0aCkge1xuICAgICAgICAgICAgcmV0dXJuIHN0cjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzcGFjZXMgPSB3aWR0aCAtIHN0ci5sZW5ndGg7XG4gICAgICAgIHZhciBwcmUgPSBsaWIucmVwZWF0KCcgJywgc3BhY2VzLzIgLSBzcGFjZXMgJSAyKTtcbiAgICAgICAgdmFyIHBvc3QgPSBsaWIucmVwZWF0KCcgJywgc3BhY2VzLzIpO1xuICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCBwcmUgKyBzdHIgKyBwb3N0KTtcbiAgICB9LFxuXG4gICAgJ2RlZmF1bHQnOiBmdW5jdGlvbih2YWwsIGRlZikge1xuICAgICAgICByZXR1cm4gdmFsID8gdmFsIDogZGVmO1xuICAgIH0sXG5cbiAgICBkaWN0c29ydDogZnVuY3Rpb24odmFsLCBjYXNlX3NlbnNpdGl2ZSwgYnkpIHtcbiAgICAgICAgaWYgKCFsaWIuaXNPYmplY3QodmFsKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKCdkaWN0c29ydCBmaWx0ZXI6IHZhbCBtdXN0IGJlIGFuIG9iamVjdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFycmF5ID0gW107XG4gICAgICAgIGZvciAodmFyIGsgaW4gdmFsKSB7XG4gICAgICAgICAgICAvLyBkZWxpYmVyYXRlbHkgaW5jbHVkZSBwcm9wZXJ0aWVzIGZyb20gdGhlIG9iamVjdCdzIHByb3RvdHlwZVxuICAgICAgICAgICAgYXJyYXkucHVzaChbayx2YWxba11dKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzaTtcbiAgICAgICAgaWYgKGJ5ID09PSB1bmRlZmluZWQgfHwgYnkgPT09ICdrZXknKSB7XG4gICAgICAgICAgICBzaSA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAoYnkgPT09ICd2YWx1ZScpIHtcbiAgICAgICAgICAgIHNpID0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcihcbiAgICAgICAgICAgICAgICAnZGljdHNvcnQgZmlsdGVyOiBZb3UgY2FuIG9ubHkgc29ydCBieSBlaXRoZXIga2V5IG9yIHZhbHVlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBhcnJheS5zb3J0KGZ1bmN0aW9uKHQxLCB0Mikge1xuICAgICAgICAgICAgdmFyIGEgPSB0MVtzaV07XG4gICAgICAgICAgICB2YXIgYiA9IHQyW3NpXTtcblxuICAgICAgICAgICAgaWYgKCFjYXNlX3NlbnNpdGl2ZSkge1xuICAgICAgICAgICAgICAgIGlmIChsaWIuaXNTdHJpbmcoYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYSA9IGEudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxpYi5pc1N0cmluZyhiKSkge1xuICAgICAgICAgICAgICAgICAgICBiID0gYi50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGEgPiBiID8gMSA6IChhID09PSBiID8gMCA6IC0xKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH0sXG5cbiAgICBlc2NhcGU6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICBpZih0eXBlb2Ygc3RyID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgICBzdHIgaW5zdGFuY2VvZiByLlNhZmVTdHJpbmcpIHtcbiAgICAgICAgICAgIHJldHVybiBsaWIuZXNjYXBlKHN0cik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9LFxuXG4gICAgc2FmZTogZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgIHJldHVybiByLm1hcmtTYWZlKHN0cik7XG4gICAgfSxcblxuICAgIGZpcnN0OiBmdW5jdGlvbihhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFyclswXTtcbiAgICB9LFxuXG4gICAgZ3JvdXBieTogZnVuY3Rpb24oYXJyLCBhdHRyKSB7XG4gICAgICAgIHJldHVybiBsaWIuZ3JvdXBCeShhcnIsIGF0dHIpO1xuICAgIH0sXG5cbiAgICBpbmRlbnQ6IGZ1bmN0aW9uKHN0ciwgd2lkdGgsIGluZGVudGZpcnN0KSB7XG4gICAgICAgIHdpZHRoID0gd2lkdGggfHwgNDtcbiAgICAgICAgdmFyIHJlcyA9ICcnO1xuICAgICAgICB2YXIgbGluZXMgPSBzdHIuc3BsaXQoJ1xcbicpO1xuICAgICAgICB2YXIgc3AgPSBsaWIucmVwZWF0KCcgJywgd2lkdGgpO1xuXG4gICAgICAgIGZvcih2YXIgaT0wOyBpPGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZihpID09PSAwICYmICFpbmRlbnRmaXJzdCkge1xuICAgICAgICAgICAgICAgIHJlcyArPSBsaW5lc1tpXSArICdcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzICs9IHNwICsgbGluZXNbaV0gKyAnXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHJlcyk7XG4gICAgfSxcblxuICAgIGpvaW46IGZ1bmN0aW9uKGFyciwgZGVsLCBhdHRyKSB7XG4gICAgICAgIGRlbCA9IGRlbCB8fCAnJztcblxuICAgICAgICBpZihhdHRyKSB7XG4gICAgICAgICAgICBhcnIgPSBsaWIubWFwKGFyciwgZnVuY3Rpb24odikge1xuICAgICAgICAgICAgICAgIHJldHVybiB2W2F0dHJdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXJyLmpvaW4oZGVsKTtcbiAgICB9LFxuXG4gICAgbGFzdDogZnVuY3Rpb24oYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbYXJyLmxlbmd0aC0xXTtcbiAgICB9LFxuXG4gICAgbGVuZ3RoOiBmdW5jdGlvbihhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFyciAhPT0gdW5kZWZpbmVkID8gYXJyLmxlbmd0aCA6IDA7XG4gICAgfSxcblxuICAgIGxpc3Q6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBpZihsaWIuaXNTdHJpbmcodmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbC5zcGxpdCgnJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihsaWIuaXNPYmplY3QodmFsKSkge1xuICAgICAgICAgICAgdmFyIGtleXMgPSBbXTtcblxuICAgICAgICAgICAgaWYoT2JqZWN0LmtleXMpIHtcbiAgICAgICAgICAgICAgICBrZXlzID0gT2JqZWN0LmtleXModmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvcih2YXIgayBpbiB2YWwpIHtcbiAgICAgICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGxpYi5tYXAoa2V5cywgZnVuY3Rpb24oaykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGtleTogayxcbiAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsW2tdIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKGxpYi5pc0FycmF5KHZhbCkpIHtcbiAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKCdsaXN0IGZpbHRlcjogdHlwZSBub3QgaXRlcmFibGUnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBsb3dlcjogZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHIudG9Mb3dlckNhc2UoKTtcbiAgICB9LFxuXG4gICAgcmFuZG9tOiBmdW5jdGlvbihhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFycltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnIubGVuZ3RoKV07XG4gICAgfSxcblxuICAgIHJlamVjdGF0dHI6IGZ1bmN0aW9uKGFyciwgYXR0cikge1xuICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuICFpdGVtW2F0dHJdO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHNlbGVjdGF0dHI6IGZ1bmN0aW9uKGFyciwgYXR0cikge1xuICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuICEhaXRlbVthdHRyXTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICByZXBsYWNlOiBmdW5jdGlvbihzdHIsIG9sZCwgbmV3XywgbWF4Q291bnQpIHtcbiAgICAgICAgaWYgKG9sZCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKG9sZCwgbmV3Xyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzID0gc3RyO1xuICAgICAgICB2YXIgbGFzdCA9IHJlcztcbiAgICAgICAgdmFyIGNvdW50ID0gMTtcbiAgICAgICAgcmVzID0gcmVzLnJlcGxhY2Uob2xkLCBuZXdfKTtcblxuICAgICAgICB3aGlsZShsYXN0ICE9PSByZXMpIHtcbiAgICAgICAgICAgIGlmKGNvdW50ID49IG1heENvdW50KSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxhc3QgPSByZXM7XG4gICAgICAgICAgICByZXMgPSByZXMucmVwbGFjZShvbGQsIG5ld18pO1xuICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHJlcyk7XG4gICAgfSxcblxuICAgIHJldmVyc2U6IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICB2YXIgYXJyO1xuICAgICAgICBpZihsaWIuaXNTdHJpbmcodmFsKSkge1xuICAgICAgICAgICAgYXJyID0gZmlsdGVycy5saXN0KHZhbCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBDb3B5IGl0XG4gICAgICAgICAgICBhcnIgPSBsaWIubWFwKHZhbCwgZnVuY3Rpb24odikgeyByZXR1cm4gdjsgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBhcnIucmV2ZXJzZSgpO1xuXG4gICAgICAgIGlmKGxpYi5pc1N0cmluZyh2YWwpKSB7XG4gICAgICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3ModmFsLCBhcnIuam9pbignJykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcblxuICAgIHJvdW5kOiBmdW5jdGlvbih2YWwsIHByZWNpc2lvbiwgbWV0aG9kKSB7XG4gICAgICAgIHByZWNpc2lvbiA9IHByZWNpc2lvbiB8fCAwO1xuICAgICAgICB2YXIgZmFjdG9yID0gTWF0aC5wb3coMTAsIHByZWNpc2lvbik7XG4gICAgICAgIHZhciByb3VuZGVyO1xuXG4gICAgICAgIGlmKG1ldGhvZCA9PT0gJ2NlaWwnKSB7XG4gICAgICAgICAgICByb3VuZGVyID0gTWF0aC5jZWlsO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYobWV0aG9kID09PSAnZmxvb3InKSB7XG4gICAgICAgICAgICByb3VuZGVyID0gTWF0aC5mbG9vcjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJvdW5kZXIgPSBNYXRoLnJvdW5kO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJvdW5kZXIodmFsICogZmFjdG9yKSAvIGZhY3RvcjtcbiAgICB9LFxuXG4gICAgc2xpY2U6IGZ1bmN0aW9uKGFyciwgc2xpY2VzLCBmaWxsV2l0aCkge1xuICAgICAgICB2YXIgc2xpY2VMZW5ndGggPSBNYXRoLmZsb29yKGFyci5sZW5ndGggLyBzbGljZXMpO1xuICAgICAgICB2YXIgZXh0cmEgPSBhcnIubGVuZ3RoICUgc2xpY2VzO1xuICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcbiAgICAgICAgdmFyIHJlcyA9IFtdO1xuXG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHNsaWNlczsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc3RhcnQgPSBvZmZzZXQgKyBpICogc2xpY2VMZW5ndGg7XG4gICAgICAgICAgICBpZihpIDwgZXh0cmEpIHtcbiAgICAgICAgICAgICAgICBvZmZzZXQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBlbmQgPSBvZmZzZXQgKyAoaSArIDEpICogc2xpY2VMZW5ndGg7XG5cbiAgICAgICAgICAgIHZhciBzbGljZSA9IGFyci5zbGljZShzdGFydCwgZW5kKTtcbiAgICAgICAgICAgIGlmKGZpbGxXaXRoICYmIGkgPj0gZXh0cmEpIHtcbiAgICAgICAgICAgICAgICBzbGljZS5wdXNoKGZpbGxXaXRoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5wdXNoKHNsaWNlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIHNvcnQ6IGZ1bmN0aW9uKGFyciwgcmV2ZXJzZSwgY2FzZVNlbnMsIGF0dHIpIHtcbiAgICAgICAgLy8gQ29weSBpdFxuICAgICAgICBhcnIgPSBsaWIubWFwKGFyciwgZnVuY3Rpb24odikgeyByZXR1cm4gdjsgfSk7XG5cbiAgICAgICAgYXJyLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgdmFyIHgsIHk7XG5cbiAgICAgICAgICAgIGlmKGF0dHIpIHtcbiAgICAgICAgICAgICAgICB4ID0gYVthdHRyXTtcbiAgICAgICAgICAgICAgICB5ID0gYlthdHRyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHggPSBhO1xuICAgICAgICAgICAgICAgIHkgPSBiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZighY2FzZVNlbnMgJiYgbGliLmlzU3RyaW5nKHgpICYmIGxpYi5pc1N0cmluZyh5KSkge1xuICAgICAgICAgICAgICAgIHggPSB4LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgeSA9IHkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoeCA8IHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV2ZXJzZSA/IDEgOiAtMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoeCA+IHkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV2ZXJzZSA/IC0xOiAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcblxuICAgIHN0cmluZzogZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhvYmosIG9iaik7XG4gICAgfSxcblxuICAgIHRpdGxlOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgdmFyIHdvcmRzID0gc3RyLnNwbGl0KCcgJyk7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB3b3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgd29yZHNbaV0gPSBmaWx0ZXJzLmNhcGl0YWxpemUod29yZHNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHdvcmRzLmpvaW4oJyAnKSk7XG4gICAgfSxcblxuICAgIHRyaW06IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCBzdHIucmVwbGFjZSgvXlxccyp8XFxzKiQvZywgJycpKTtcbiAgICB9LFxuXG4gICAgdHJ1bmNhdGU6IGZ1bmN0aW9uKGlucHV0LCBsZW5ndGgsIGtpbGx3b3JkcywgZW5kKSB7XG4gICAgICAgIHZhciBvcmlnID0gaW5wdXQ7XG4gICAgICAgIGxlbmd0aCA9IGxlbmd0aCB8fCAyNTU7XG5cbiAgICAgICAgaWYgKGlucHV0Lmxlbmd0aCA8PSBsZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG5cbiAgICAgICAgaWYgKGtpbGx3b3Jkcykge1xuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMCwgbGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBpZHggPSBpbnB1dC5sYXN0SW5kZXhPZignICcsIGxlbmd0aCk7XG4gICAgICAgICAgICBpZihpZHggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgaWR4ID0gbGVuZ3RoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cmluZygwLCBpZHgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaW5wdXQgKz0gKGVuZCAhPT0gdW5kZWZpbmVkICYmIGVuZCAhPT0gbnVsbCkgPyBlbmQgOiAnLi4uJztcbiAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKG9yaWcsIGlucHV0KTtcbiAgICB9LFxuXG4gICAgdXBwZXI6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICByZXR1cm4gc3RyLnRvVXBwZXJDYXNlKCk7XG4gICAgfSxcblxuICAgIHVybGVuY29kZTogZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHZhciBlbmMgPSBlbmNvZGVVUklDb21wb25lbnQ7XG4gICAgICAgIGlmIChsaWIuaXNTdHJpbmcob2JqKSkge1xuICAgICAgICAgICAgcmV0dXJuIGVuYyhvYmopO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHBhcnRzO1xuICAgICAgICAgICAgaWYgKGxpYi5pc0FycmF5KG9iaikpIHtcbiAgICAgICAgICAgICAgICBwYXJ0cyA9IG9iai5tYXAoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZW5jKGl0ZW1bMF0pICsgJz0nICsgZW5jKGl0ZW1bMV0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhcnRzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgayBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFydHMucHVzaChlbmMoaykgKyAnPScgKyBlbmMob2JqW2tdKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcGFydHMuam9pbignJicpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHVybGl6ZTogZnVuY3Rpb24oc3RyLCBsZW5ndGgsIG5vZm9sbG93KSB7XG4gICAgICAgIGlmIChpc05hTihsZW5ndGgpKSBsZW5ndGggPSBJbmZpbml0eTtcblxuICAgICAgICB2YXIgbm9Gb2xsb3dBdHRyID0gKG5vZm9sbG93ID09PSB0cnVlID8gJyByZWw9XCJub2ZvbGxvd1wiJyA6ICcnKTtcblxuICAgICAgICAvLyBGb3IgdGhlIGppbmphIHJlZ2V4cCwgc2VlXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9taXRzdWhpa28vamluamEyL2Jsb2IvZjE1YjgxNGRjYmE2YWExMmJjNzRkMWY3ZDBjODgxZDU1ZjcxMjZiZS9qaW5qYTIvdXRpbHMucHkjTDIwLUwyM1xuICAgICAgICB2YXIgcHVuY1JFID0gL14oPzpcXCh8PHwmbHQ7KT8oLio/KSg/OlxcLnwsfFxcKXxcXG58Jmd0Oyk/JC87XG4gICAgICAgIC8vIGZyb20gaHR0cDovL2Jsb2cuZ2Vydi5uZXQvMjAxMS8wNS9odG1sNV9lbWFpbF9hZGRyZXNzX3JlZ2V4cC9cbiAgICAgICAgdmFyIGVtYWlsUkUgPSAvXltcXHcuISMkJSYnKitcXC1cXC89P1xcXmB7fH1+XStAW2EtelxcZFxcLV0rKFxcLlthLXpcXGRcXC1dKykrJC9pO1xuICAgICAgICB2YXIgaHR0cEh0dHBzUkUgPSAvXmh0dHBzPzpcXC9cXC8uKiQvO1xuICAgICAgICB2YXIgd3d3UkUgPSAvXnd3d1xcLi87XG4gICAgICAgIHZhciB0bGRSRSA9IC9cXC4oPzpvcmd8bmV0fGNvbSkoPzpcXDp8XFwvfCQpLztcblxuICAgICAgICB2YXIgd29yZHMgPSBzdHIuc3BsaXQoL1xccysvKS5maWx0ZXIoZnVuY3Rpb24od29yZCkge1xuICAgICAgICAgIC8vIElmIHRoZSB3b3JkIGhhcyBubyBsZW5ndGgsIGJhaWwuIFRoaXMgY2FuIGhhcHBlbiBmb3Igc3RyIHdpdGhcbiAgICAgICAgICAvLyB0cmFpbGluZyB3aGl0ZXNwYWNlLlxuICAgICAgICAgIHJldHVybiB3b3JkICYmIHdvcmQubGVuZ3RoO1xuICAgICAgICB9KS5tYXAoZnVuY3Rpb24od29yZCkge1xuICAgICAgICAgIHZhciBtYXRjaGVzID0gd29yZC5tYXRjaChwdW5jUkUpO1xuXG5cbiAgICAgICAgICB2YXIgcG9zc2libGVVcmwgPSBtYXRjaGVzICYmIG1hdGNoZXNbMV0gfHwgd29yZDtcblxuXG4gICAgICAgICAgLy8gdXJsIHRoYXQgc3RhcnRzIHdpdGggaHR0cCBvciBodHRwc1xuICAgICAgICAgIGlmIChodHRwSHR0cHNSRS50ZXN0KHBvc3NpYmxlVXJsKSlcbiAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cIicgKyBwb3NzaWJsZVVybCArICdcIicgKyBub0ZvbGxvd0F0dHIgKyAnPicgKyBwb3NzaWJsZVVybC5zdWJzdHIoMCwgbGVuZ3RoKSArICc8L2E+JztcblxuICAgICAgICAgIC8vIHVybCB0aGF0IHN0YXJ0cyB3aXRoIHd3dy5cbiAgICAgICAgICBpZiAod3d3UkUudGVzdChwb3NzaWJsZVVybCkpXG4gICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCJodHRwOi8vJyArIHBvc3NpYmxlVXJsICsgJ1wiJyArIG5vRm9sbG93QXR0ciArICc+JyArIHBvc3NpYmxlVXJsLnN1YnN0cigwLCBsZW5ndGgpICsgJzwvYT4nO1xuXG4gICAgICAgICAgLy8gYW4gZW1haWwgYWRkcmVzcyBvZiB0aGUgZm9ybSB1c2VybmFtZUBkb21haW4udGxkXG4gICAgICAgICAgaWYgKGVtYWlsUkUudGVzdChwb3NzaWJsZVVybCkpXG4gICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCJtYWlsdG86JyArIHBvc3NpYmxlVXJsICsgJ1wiPicgKyBwb3NzaWJsZVVybCArICc8L2E+JztcblxuICAgICAgICAgIC8vIHVybCB0aGF0IGVuZHMgaW4gLmNvbSwgLm9yZyBvciAubmV0IHRoYXQgaXMgbm90IGFuIGVtYWlsIGFkZHJlc3NcbiAgICAgICAgICBpZiAodGxkUkUudGVzdChwb3NzaWJsZVVybCkpXG4gICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCJodHRwOi8vJyArIHBvc3NpYmxlVXJsICsgJ1wiJyArIG5vRm9sbG93QXR0ciArICc+JyArIHBvc3NpYmxlVXJsLnN1YnN0cigwLCBsZW5ndGgpICsgJzwvYT4nO1xuXG4gICAgICAgICAgcmV0dXJuIHdvcmQ7XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHdvcmRzLmpvaW4oJyAnKTtcbiAgICB9LFxuXG4gICAgd29yZGNvdW50OiBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgdmFyIHdvcmRzID0gKHN0cikgPyBzdHIubWF0Y2goL1xcdysvZykgOiBudWxsO1xuICAgICAgICByZXR1cm4gKHdvcmRzKSA/IHdvcmRzLmxlbmd0aCA6IG51bGw7XG4gICAgfSxcblxuICAgICdmbG9hdCc6IGZ1bmN0aW9uKHZhbCwgZGVmKSB7XG4gICAgICAgIHZhciByZXMgPSBwYXJzZUZsb2F0KHZhbCk7XG4gICAgICAgIHJldHVybiBpc05hTihyZXMpID8gZGVmIDogcmVzO1xuICAgIH0sXG5cbiAgICAnaW50JzogZnVuY3Rpb24odmFsLCBkZWYpIHtcbiAgICAgICAgdmFyIHJlcyA9IHBhcnNlSW50KHZhbCwgMTApO1xuICAgICAgICByZXR1cm4gaXNOYU4ocmVzKSA/IGRlZiA6IHJlcztcbiAgICB9XG59O1xuXG4vLyBBbGlhc2VzXG5maWx0ZXJzLmQgPSBmaWx0ZXJzWydkZWZhdWx0J107XG5maWx0ZXJzLmUgPSBmaWx0ZXJzLmVzY2FwZTtcblxubW9kdWxlc1snZmlsdGVycyddID0gZmlsdGVycztcbn0pKCk7XG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGN5Y2xlcihpdGVtcykge1xuICAgIHZhciBpbmRleCA9IC0xO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3VycmVudDogbnVsbCxcbiAgICAgICAgcmVzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaW5kZXggPSAtMTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgICAgaWYoaW5kZXggPj0gaXRlbXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBpdGVtc1tpbmRleF07XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdXJyZW50O1xuICAgICAgICB9LFxuICAgIH07XG5cbn1cblxuZnVuY3Rpb24gam9pbmVyKHNlcCkge1xuICAgIHNlcCA9IHNlcCB8fCAnLCc7XG4gICAgdmFyIGZpcnN0ID0gdHJ1ZTtcblxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHZhbCA9IGZpcnN0ID8gJycgOiBzZXA7XG4gICAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfTtcbn1cblxudmFyIGdsb2JhbHMgPSB7XG4gICAgcmFuZ2U6IGZ1bmN0aW9uKHN0YXJ0LCBzdG9wLCBzdGVwKSB7XG4gICAgICAgIGlmKCFzdG9wKSB7XG4gICAgICAgICAgICBzdG9wID0gc3RhcnQ7XG4gICAgICAgICAgICBzdGFydCA9IDA7XG4gICAgICAgICAgICBzdGVwID0gMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKCFzdGVwKSB7XG4gICAgICAgICAgICBzdGVwID0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhcnIgPSBbXTtcbiAgICAgICAgZm9yKHZhciBpPXN0YXJ0OyBpPHN0b3A7IGkrPXN0ZXApIHtcbiAgICAgICAgICAgIGFyci5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfSxcblxuICAgIC8vIGxpcHN1bTogZnVuY3Rpb24obiwgaHRtbCwgbWluLCBtYXgpIHtcbiAgICAvLyB9LFxuXG4gICAgY3ljbGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGN5Y2xlcihBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKTtcbiAgICB9LFxuXG4gICAgam9pbmVyOiBmdW5jdGlvbihzZXApIHtcbiAgICAgICAgcmV0dXJuIGpvaW5lcihzZXApO1xuICAgIH1cbn1cblxubW9kdWxlc1snZ2xvYmFscyddID0gZ2xvYmFscztcbn0pKCk7XG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBwYXRoID0gbW9kdWxlc1tcInBhdGhcIl07XG52YXIgbGliID0gbW9kdWxlc1tcImxpYlwiXTtcbnZhciBPYmogPSBtb2R1bGVzW1wib2JqZWN0XCJdO1xudmFyIGxleGVyID0gbW9kdWxlc1tcImxleGVyXCJdO1xudmFyIGNvbXBpbGVyID0gbW9kdWxlc1tcImNvbXBpbGVyXCJdO1xudmFyIGJ1aWx0aW5fZmlsdGVycyA9IG1vZHVsZXNbXCJmaWx0ZXJzXCJdO1xudmFyIGJ1aWx0aW5fbG9hZGVycyA9IG1vZHVsZXNbXCJsb2FkZXJzXCJdO1xudmFyIHJ1bnRpbWUgPSBtb2R1bGVzW1wicnVudGltZVwiXTtcbnZhciBnbG9iYWxzID0gbW9kdWxlc1tcImdsb2JhbHNcIl07XG52YXIgRnJhbWUgPSBydW50aW1lLkZyYW1lO1xuXG52YXIgRW52aXJvbm1lbnQgPSBPYmouZXh0ZW5kKHtcbiAgICBpbml0OiBmdW5jdGlvbihsb2FkZXJzLCBvcHRzKSB7XG4gICAgICAgIC8vIFRoZSBkZXYgZmxhZyBkZXRlcm1pbmVzIHRoZSB0cmFjZSB0aGF0J2xsIGJlIHNob3duIG9uIGVycm9ycy5cbiAgICAgICAgLy8gSWYgc2V0IHRvIHRydWUsIHJldHVybnMgdGhlIGZ1bGwgdHJhY2UgZnJvbSB0aGUgZXJyb3IgcG9pbnQsXG4gICAgICAgIC8vIG90aGVyd2lzZSB3aWxsIHJldHVybiB0cmFjZSBzdGFydGluZyBmcm9tIFRlbXBsYXRlLnJlbmRlclxuICAgICAgICAvLyAodGhlIGZ1bGwgdHJhY2UgZnJvbSB3aXRoaW4gbnVuanVja3MgbWF5IGNvbmZ1c2UgZGV2ZWxvcGVycyB1c2luZ1xuICAgICAgICAvLyAgdGhlIGxpYnJhcnkpXG4gICAgICAgIC8vIGRlZmF1bHRzIHRvIGZhbHNlXG4gICAgICAgIHZhciBvcHRzID0gdGhpcy5vcHRzID0gb3B0cyB8fCB7fTtcbiAgICAgICAgdGhpcy5vcHRzLmRldiA9ICEhb3B0cy5kZXY7XG5cbiAgICAgICAgLy8gVGhlIGF1dG9lc2NhcGUgZmxhZyBzZXRzIGdsb2JhbCBhdXRvZXNjYXBpbmcuIElmIHRydWUsXG4gICAgICAgIC8vIGV2ZXJ5IHN0cmluZyB2YXJpYWJsZSB3aWxsIGJlIGVzY2FwZWQgYnkgZGVmYXVsdC5cbiAgICAgICAgLy8gSWYgZmFsc2UsIHN0cmluZ3MgY2FuIGJlIG1hbnVhbGx5IGVzY2FwZWQgdXNpbmcgdGhlIGBlc2NhcGVgIGZpbHRlci5cbiAgICAgICAgLy8gZGVmYXVsdHMgdG8gZmFsc2VcbiAgICAgICAgdGhpcy5vcHRzLmF1dG9lc2NhcGUgPSAhIW9wdHMuYXV0b2VzY2FwZTtcblxuICAgICAgICB0aGlzLm9wdHMudHJpbUJsb2NrcyA9ICEhb3B0cy50cmltQmxvY2tzO1xuXG4gICAgICAgIHRoaXMub3B0cy5sc3RyaXBCbG9ja3MgPSAhIW9wdHMubHN0cmlwQmxvY2tzO1xuXG4gICAgICAgIGlmKCFsb2FkZXJzKSB7XG4gICAgICAgICAgICAvLyBUaGUgZmlsZXN5c3RlbSBsb2FkZXIgaXMgb25seSBhdmFpbGFibGUgY2xpZW50LXNpZGVcbiAgICAgICAgICAgIGlmKGJ1aWx0aW5fbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkZXJzID0gW25ldyBidWlsdGluX2xvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcigndmlld3MnKV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRlcnMgPSBbbmV3IGJ1aWx0aW5fbG9hZGVycy5XZWJMb2FkZXIoJy92aWV3cycpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubG9hZGVycyA9IGxpYi5pc0FycmF5KGxvYWRlcnMpID8gbG9hZGVycyA6IFtsb2FkZXJzXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaW5pdENhY2hlKCk7XG4gICAgICAgIHRoaXMuZmlsdGVycyA9IHt9O1xuICAgICAgICB0aGlzLmFzeW5jRmlsdGVycyA9IFtdO1xuICAgICAgICB0aGlzLmV4dGVuc2lvbnMgPSB7fTtcbiAgICAgICAgdGhpcy5leHRlbnNpb25zTGlzdCA9IFtdO1xuXG4gICAgICAgIGZvcih2YXIgbmFtZSBpbiBidWlsdGluX2ZpbHRlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRmlsdGVyKG5hbWUsIGJ1aWx0aW5fZmlsdGVyc1tuYW1lXSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaW5pdENhY2hlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQ2FjaGluZyBhbmQgY2FjaGUgYnVzdGluZ1xuICAgICAgICBsaWIuZWFjaCh0aGlzLmxvYWRlcnMsIGZ1bmN0aW9uKGxvYWRlcikge1xuICAgICAgICAgICAgbG9hZGVyLmNhY2hlID0ge307XG5cbiAgICAgICAgICAgIGlmKHR5cGVvZiBsb2FkZXIub24gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBsb2FkZXIub24oJ3VwZGF0ZScsIGZ1bmN0aW9uKHRlbXBsYXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRlci5jYWNoZVt0ZW1wbGF0ZV0gPSBudWxsO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYWRkRXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lLCBleHRlbnNpb24pIHtcbiAgICAgICAgZXh0ZW5zaW9uLl9uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5leHRlbnNpb25zW25hbWVdID0gZXh0ZW5zaW9uO1xuICAgICAgICB0aGlzLmV4dGVuc2lvbnNMaXN0LnB1c2goZXh0ZW5zaW9uKTtcbiAgICB9LFxuXG4gICAgZ2V0RXh0ZW5zaW9uOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4dGVuc2lvbnNbbmFtZV07XG4gICAgfSxcblxuICAgIGFkZEdsb2JhbDogZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgICAgZ2xvYmFsc1tuYW1lXSA9IHZhbHVlO1xuICAgIH0sXG5cbiAgICBhZGRGaWx0ZXI6IGZ1bmN0aW9uKG5hbWUsIGZ1bmMsIGFzeW5jKSB7XG4gICAgICAgIHZhciB3cmFwcGVkID0gZnVuYztcblxuICAgICAgICBpZihhc3luYykge1xuICAgICAgICAgICAgdGhpcy5hc3luY0ZpbHRlcnMucHVzaChuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpbHRlcnNbbmFtZV0gPSB3cmFwcGVkO1xuICAgIH0sXG5cbiAgICBnZXRGaWx0ZXI6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgaWYoIXRoaXMuZmlsdGVyc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdmaWx0ZXIgbm90IGZvdW5kOiAnICsgbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyc1tuYW1lXTtcbiAgICB9LFxuXG4gICAgcmVzb2x2ZVRlbXBsYXRlOiBmdW5jdGlvbihsb2FkZXIsIHBhcmVudE5hbWUsIGZpbGVuYW1lKSB7XG4gICAgICAgIHZhciBpc1JlbGF0aXZlID0gKGxvYWRlci5pc1JlbGF0aXZlICYmIHBhcmVudE5hbWUpPyBsb2FkZXIuaXNSZWxhdGl2ZShmaWxlbmFtZSkgOiBmYWxzZTtcbiAgICAgICAgcmV0dXJuIChpc1JlbGF0aXZlICYmIGxvYWRlci5yZXNvbHZlKT8gbG9hZGVyLnJlc29sdmUocGFyZW50TmFtZSwgZmlsZW5hbWUpIDogZmlsZW5hbWU7XG4gICAgfSxcblxuICAgIGdldFRlbXBsYXRlOiBmdW5jdGlvbihuYW1lLCBlYWdlckNvbXBpbGUsIHBhcmVudE5hbWUsIGNiKSB7XG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdmFyIHRtcGwgPSBudWxsO1xuICAgICAgICBpZihuYW1lICYmIG5hbWUucmF3KSB7XG4gICAgICAgICAgICAvLyB0aGlzIGZpeGVzIGF1dG9lc2NhcGUgZm9yIHRlbXBsYXRlcyByZWZlcmVuY2VkIGluIHN5bWJvbHNcbiAgICAgICAgICAgIG5hbWUgPSBuYW1lLnJhdztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKHBhcmVudE5hbWUpKSB7XG4gICAgICAgICAgICBjYiA9IHBhcmVudE5hbWU7XG4gICAgICAgICAgICBwYXJlbnROYW1lID0gbnVsbDtcbiAgICAgICAgICAgIGVhZ2VyQ29tcGlsZSA9IGVhZ2VyQ29tcGlsZSB8fCBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKGVhZ2VyQ29tcGlsZSkpIHtcbiAgICAgICAgICAgIGNiID0gZWFnZXJDb21waWxlO1xuICAgICAgICAgICAgZWFnZXJDb21waWxlID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZih0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndGVtcGxhdGUgbmFtZXMgbXVzdCBiZSBhIHN0cmluZzogJyArIG5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxvYWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBfbmFtZSA9IHRoaXMucmVzb2x2ZVRlbXBsYXRlKHRoaXMubG9hZGVyc1tpXSwgcGFyZW50TmFtZSwgbmFtZSk7XG4gICAgICAgICAgICB0bXBsID0gdGhpcy5sb2FkZXJzW2ldLmNhY2hlW19uYW1lXTtcbiAgICAgICAgICAgIGlmICh0bXBsKSBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHRtcGwpIHtcbiAgICAgICAgICAgIGlmKGVhZ2VyQ29tcGlsZSkge1xuICAgICAgICAgICAgICAgIHRtcGwuY29tcGlsZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihjYikge1xuICAgICAgICAgICAgICAgIGNiKG51bGwsIHRtcGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRtcGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgc3luY1Jlc3VsdDtcblxuICAgICAgICAgICAgbGliLmFzeW5jSXRlcih0aGlzLmxvYWRlcnMsIGZ1bmN0aW9uKGxvYWRlciwgaSwgbmV4dCwgZG9uZSkge1xuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIGhhbmRsZShzcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcmMubG9hZGVyID0gbG9hZGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9uZShzcmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gUmVzb2x2ZSBuYW1lIHJlbGF0aXZlIHRvIHBhcmVudE5hbWVcbiAgICAgICAgICAgICAgICBuYW1lID0gdGhhdC5yZXNvbHZlVGVtcGxhdGUobG9hZGVyLCBwYXJlbnROYW1lLCBuYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmKGxvYWRlci5hc3luYykge1xuICAgICAgICAgICAgICAgICAgICBsb2FkZXIuZ2V0U291cmNlKG5hbWUsIGZ1bmN0aW9uKGVyciwgc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihlcnIpIHsgdGhyb3cgZXJyOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGUoc3JjKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGUobG9hZGVyLmdldFNvdXJjZShuYW1lKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24oaW5mbykge1xuICAgICAgICAgICAgICAgIGlmKCFpbmZvKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ3RlbXBsYXRlIG5vdCBmb3VuZDogJyArIG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZihjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRtcGwgPSBuZXcgVGVtcGxhdGUoaW5mby5zcmMsIHRoaXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ucGF0aCwgZWFnZXJDb21waWxlKTtcblxuICAgICAgICAgICAgICAgICAgICBpZighaW5mby5ub0NhY2hlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbmZvLmxvYWRlci5jYWNoZVtuYW1lXSA9IHRtcGw7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZihjYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2IobnVsbCwgdG1wbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzeW5jUmVzdWx0ID0gdG1wbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgICAgIHJldHVybiBzeW5jUmVzdWx0O1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGV4cHJlc3M6IGZ1bmN0aW9uKGFwcCkge1xuICAgICAgICB2YXIgZW52ID0gdGhpcztcblxuICAgICAgICBmdW5jdGlvbiBOdW5qdWNrc1ZpZXcobmFtZSwgb3B0cykge1xuICAgICAgICAgICAgdGhpcy5uYW1lICAgICAgICAgID0gbmFtZTtcbiAgICAgICAgICAgIHRoaXMucGF0aCAgICAgICAgICA9IG5hbWU7XG4gICAgICAgICAgICB0aGlzLmRlZmF1bHRFbmdpbmUgPSBvcHRzLmRlZmF1bHRFbmdpbmU7XG4gICAgICAgICAgICB0aGlzLmV4dCAgICAgICAgICAgPSBwYXRoLmV4dG5hbWUobmFtZSk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZXh0ICYmICF0aGlzLmRlZmF1bHRFbmdpbmUpIHRocm93IG5ldyBFcnJvcignTm8gZGVmYXVsdCBlbmdpbmUgd2FzIHNwZWNpZmllZCBhbmQgbm8gZXh0ZW5zaW9uIHdhcyBwcm92aWRlZC4nKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5leHQpIHRoaXMubmFtZSArPSAodGhpcy5leHQgPSAoJy4nICE9PSB0aGlzLmRlZmF1bHRFbmdpbmVbMF0gPyAnLicgOiAnJykgKyB0aGlzLmRlZmF1bHRFbmdpbmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgTnVuanVja3NWaWV3LnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbihvcHRzLCBjYikge1xuICAgICAgICAgIGVudi5yZW5kZXIodGhpcy5uYW1lLCBvcHRzLCBjYik7XG4gICAgICAgIH07XG5cbiAgICAgICAgYXBwLnNldCgndmlldycsIE51bmp1Y2tzVmlldyk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24obmFtZSwgY3R4LCBjYikge1xuICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihjdHgpKSB7XG4gICAgICAgICAgICBjYiA9IGN0eDtcbiAgICAgICAgICAgIGN0eCA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBzdXBwb3J0IGEgc3luY2hyb25vdXMgQVBJIHRvIG1ha2UgaXQgZWFzaWVyIHRvIG1pZ3JhdGVcbiAgICAgICAgLy8gZXhpc3RpbmcgY29kZSB0byBhc3luYy4gVGhpcyB3b3JrcyBiZWNhdXNlIGlmIHlvdSBkb24ndCBkb1xuICAgICAgICAvLyBhbnl0aGluZyBhc3luYyB3b3JrLCB0aGUgd2hvbGUgdGhpbmcgaXMgYWN0dWFsbHkgcnVuXG4gICAgICAgIC8vIHN5bmNocm9ub3VzbHkuXG4gICAgICAgIHZhciBzeW5jUmVzdWx0ID0gbnVsbDtcblxuICAgICAgICB0aGlzLmdldFRlbXBsYXRlKG5hbWUsIGZ1bmN0aW9uKGVyciwgdG1wbCkge1xuICAgICAgICAgICAgaWYoZXJyICYmIGNiKSB7XG4gICAgICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYoZXJyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdG1wbC5yZW5kZXIoY3R4LCBjYiB8fCBmdW5jdGlvbihlcnIsIHJlcykge1xuICAgICAgICAgICAgICAgICAgICBpZihlcnIpIHsgdGhyb3cgZXJyOyB9XG4gICAgICAgICAgICAgICAgICAgIHN5bmNSZXN1bHQgPSByZXM7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBzeW5jUmVzdWx0O1xuICAgIH0sXG5cbiAgICByZW5kZXJTdHJpbmc6IGZ1bmN0aW9uKHNyYywgY3R4LCBvcHRzLCBjYikge1xuICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihvcHRzKSkge1xuICAgICAgICAgICAgY2IgPSBvcHRzO1xuICAgICAgICAgICAgb3B0cyA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuXG4gICAgICAgIHZhciB0bXBsID0gbmV3IFRlbXBsYXRlKHNyYywgdGhpcywgb3B0cy5wYXRoKTtcbiAgICAgICAgcmV0dXJuIHRtcGwucmVuZGVyKGN0eCwgY2IpO1xuICAgIH1cbn0pO1xuXG52YXIgQ29udGV4dCA9IE9iai5leHRlbmQoe1xuICAgIGluaXQ6IGZ1bmN0aW9uKGN0eCwgYmxvY2tzKSB7XG4gICAgICAgIHRoaXMuY3R4ID0gY3R4O1xuICAgICAgICB0aGlzLmJsb2NrcyA9IHt9O1xuICAgICAgICB0aGlzLmV4cG9ydGVkID0gW107XG5cbiAgICAgICAgZm9yKHZhciBuYW1lIGluIGJsb2Nrcykge1xuICAgICAgICAgICAgdGhpcy5hZGRCbG9jayhuYW1lLCBibG9ja3NbbmFtZV0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGxvb2t1cDogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAvLyBUaGlzIGlzIG9uZSBvZiB0aGUgbW9zdCBjYWxsZWQgZnVuY3Rpb25zLCBzbyBvcHRpbWl6ZSBmb3JcbiAgICAgICAgLy8gdGhlIHR5cGljYWwgY2FzZSB3aGVyZSB0aGUgbmFtZSBpc24ndCBpbiB0aGUgZ2xvYmFsc1xuICAgICAgICBpZihuYW1lIGluIGdsb2JhbHMgJiYgIShuYW1lIGluIHRoaXMuY3R4KSkge1xuICAgICAgICAgICAgcmV0dXJuIGdsb2JhbHNbbmFtZV07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jdHhbbmFtZV07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2V0VmFyaWFibGU6IGZ1bmN0aW9uKG5hbWUsIHZhbCkge1xuICAgICAgICB0aGlzLmN0eFtuYW1lXSA9IHZhbDtcbiAgICB9LFxuXG4gICAgZ2V0VmFyaWFibGVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3R4O1xuICAgIH0sXG5cbiAgICBhZGRCbG9jazogZnVuY3Rpb24obmFtZSwgYmxvY2spIHtcbiAgICAgICAgdGhpcy5ibG9ja3NbbmFtZV0gPSB0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXTtcbiAgICAgICAgdGhpcy5ibG9ja3NbbmFtZV0ucHVzaChibG9jayk7XG4gICAgfSxcblxuICAgIGdldEJsb2NrOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIGlmKCF0aGlzLmJsb2Nrc1tuYW1lXSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIGJsb2NrIFwiJyArIG5hbWUgKyAnXCInKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmJsb2Nrc1tuYW1lXVswXTtcbiAgICB9LFxuXG4gICAgZ2V0U3VwZXI6IGZ1bmN0aW9uKGVudiwgbmFtZSwgYmxvY2ssIGZyYW1lLCBydW50aW1lLCBjYikge1xuICAgICAgICB2YXIgaWR4ID0gbGliLmluZGV4T2YodGhpcy5ibG9ja3NbbmFtZV0gfHwgW10sIGJsb2NrKTtcbiAgICAgICAgdmFyIGJsayA9IHRoaXMuYmxvY2tzW25hbWVdW2lkeCArIDFdO1xuICAgICAgICB2YXIgY29udGV4dCA9IHRoaXM7XG5cbiAgICAgICAgaWYoaWR4ID09PSAtMSB8fCAhYmxrKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ25vIHN1cGVyIGJsb2NrIGF2YWlsYWJsZSBmb3IgXCInICsgbmFtZSArICdcIicpO1xuICAgICAgICB9XG5cbiAgICAgICAgYmxrKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbiAgICB9LFxuXG4gICAgYWRkRXhwb3J0OiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHRoaXMuZXhwb3J0ZWQucHVzaChuYW1lKTtcbiAgICB9LFxuXG4gICAgZ2V0RXhwb3J0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXhwb3J0ZWQgPSB7fTtcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGhpcy5leHBvcnRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSB0aGlzLmV4cG9ydGVkW2ldO1xuICAgICAgICAgICAgZXhwb3J0ZWRbbmFtZV0gPSB0aGlzLmN0eFtuYW1lXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhwb3J0ZWQ7XG4gICAgfVxufSk7XG5cbnZhciBUZW1wbGF0ZSA9IE9iai5leHRlbmQoe1xuICAgIGluaXQ6IGZ1bmN0aW9uIChzcmMsIGVudiwgcGF0aCwgZWFnZXJDb21waWxlKSB7XG4gICAgICAgIHRoaXMuZW52ID0gZW52IHx8IG5ldyBFbnZpcm9ubWVudCgpO1xuXG4gICAgICAgIGlmKGxpYi5pc09iamVjdChzcmMpKSB7XG4gICAgICAgICAgICBzd2l0Y2goc3JjLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2NvZGUnOiB0aGlzLnRtcGxQcm9wcyA9IHNyYy5vYmo7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnc3RyaW5nJzogdGhpcy50bXBsU3RyID0gc3JjLm9iajsgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihsaWIuaXNTdHJpbmcoc3JjKSkge1xuICAgICAgICAgICAgdGhpcy50bXBsU3RyID0gc3JjO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzcmMgbXVzdCBiZSBhIHN0cmluZyBvciBhbiBvYmplY3QgZGVzY3JpYmluZyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAndGhlIHNvdXJjZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wYXRoID0gcGF0aDtcblxuICAgICAgICBpZihlYWdlckNvbXBpbGUpIHtcbiAgICAgICAgICAgIGxpYi53aXRoUHJldHR5RXJyb3JzKHRoaXMucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW52LmRldixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBpbGUuYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbihjdHgsIGZyYW1lLCBjYikge1xuICAgICAgICBpZiAodHlwZW9mIGN0eCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2IgPSBjdHg7XG4gICAgICAgICAgICBjdHggPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgZnJhbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNiID0gZnJhbWU7XG4gICAgICAgICAgICBmcmFtZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGliLndpdGhQcmV0dHlFcnJvcnModGhpcy5wYXRoLCB0aGlzLmVudi5kZXYsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAvLyBDYXRjaCBjb21waWxlIGVycm9ycyBmb3IgYXN5bmMgcmVuZGVyaW5nXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29tcGlsZSgpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGlmIChjYikgcmV0dXJuIGNiKGUpO1xuICAgICAgICAgICAgICAgIGVsc2UgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQ29udGV4dChjdHggfHwge30sIHRoaXMuYmxvY2tzKTtcbiAgICAgICAgICAgIHZhciBzeW5jUmVzdWx0ID0gbnVsbDtcblxuICAgICAgICAgICAgdGhpcy5yb290UmVuZGVyRnVuYyh0aGlzLmVudixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWUgfHwgbmV3IEZyYW1lKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiIHx8IGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihlcnIpIHsgdGhyb3cgZXJyOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzeW5jUmVzdWx0ID0gcmVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHN5bmNSZXN1bHQ7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuXG4gICAgZ2V0RXhwb3J0ZWQ6IGZ1bmN0aW9uKGN0eCwgZnJhbWUsIGNiKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY3R4ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYiA9IGN0eDtcbiAgICAgICAgICAgIGN0eCA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBmcmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2IgPSBmcmFtZTtcbiAgICAgICAgICAgIGZyYW1lID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhdGNoIGNvbXBpbGUgZXJyb3JzIGZvciBhc3luYyByZW5kZXJpbmdcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoY2IpIHJldHVybiBjYihlKTtcbiAgICAgICAgICAgIGVsc2UgdGhyb3cgZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJ1biB0aGUgcm9vdFJlbmRlckZ1bmMgdG8gcG9wdWxhdGUgdGhlIGNvbnRleHQgd2l0aCBleHBvcnRlZCB2YXJzXG4gICAgICAgIHZhciBjb250ZXh0ID0gbmV3IENvbnRleHQoY3R4IHx8IHt9LCB0aGlzLmJsb2Nrcyk7XG4gICAgICAgIHRoaXMucm9vdFJlbmRlckZ1bmModGhpcy5lbnYsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZSB8fCBuZXcgRnJhbWUoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYihudWxsLCBjb250ZXh0LmdldEV4cG9ydGVkKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjb21waWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYoIXRoaXMuY29tcGlsZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvbXBpbGUoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfY29tcGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBwcm9wcztcblxuICAgICAgICBpZih0aGlzLnRtcGxQcm9wcykge1xuICAgICAgICAgICAgcHJvcHMgPSB0aGlzLnRtcGxQcm9wcztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBjb21waWxlci5jb21waWxlKHRoaXMudG1wbFN0cixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW52LmFzeW5jRmlsdGVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW52LmV4dGVuc2lvbnNMaXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnYub3B0cyk7XG5cbiAgICAgICAgICAgIHZhciBmdW5jID0gbmV3IEZ1bmN0aW9uKHNvdXJjZSk7XG4gICAgICAgICAgICBwcm9wcyA9IGZ1bmMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYmxvY2tzID0gdGhpcy5fZ2V0QmxvY2tzKHByb3BzKTtcbiAgICAgICAgdGhpcy5yb290UmVuZGVyRnVuYyA9IHByb3BzLnJvb3Q7XG4gICAgICAgIHRoaXMuY29tcGlsZWQgPSB0cnVlO1xuICAgIH0sXG5cbiAgICBfZ2V0QmxvY2tzOiBmdW5jdGlvbihwcm9wcykge1xuICAgICAgICB2YXIgYmxvY2tzID0ge307XG5cbiAgICAgICAgZm9yKHZhciBrIGluIHByb3BzKSB7XG4gICAgICAgICAgICBpZihrLnNsaWNlKDAsIDIpID09PSAnYl8nKSB7XG4gICAgICAgICAgICAgICAgYmxvY2tzW2suc2xpY2UoMildID0gcHJvcHNba107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYmxvY2tzO1xuICAgIH1cbn0pO1xuXG4vLyB0ZXN0IGNvZGVcbi8vIHZhciBzcmMgPSAneyUgbWFjcm8gZm9vKCkgJX17JSBpbmNsdWRlIFwiaW5jbHVkZS5odG1sXCIgJX17JSBlbmRtYWNybyAlfXt7IGZvbygpIH19Jztcbi8vIHZhciBlbnYgPSBuZXcgRW52aXJvbm1lbnQobmV3IGJ1aWx0aW5fbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKCcuLi90ZXN0cy90ZW1wbGF0ZXMnLCB0cnVlKSwgeyBkZXY6IHRydWUgfSk7XG4vLyBjb25zb2xlLmxvZyhlbnYucmVuZGVyU3RyaW5nKHNyYywgeyBuYW1lOiAncG9vcCcgfSkpO1xuXG5tb2R1bGVzWydlbnZpcm9ubWVudCddID0ge1xuICAgIEVudmlyb25tZW50OiBFbnZpcm9ubWVudCxcbiAgICBUZW1wbGF0ZTogVGVtcGxhdGVcbn07XG59KSgpO1xudmFyIG51bmp1Y2tzO1xuXG52YXIgbGliID0gbW9kdWxlc1tcImxpYlwiXTtcbnZhciBlbnYgPSBtb2R1bGVzW1wiZW52aXJvbm1lbnRcIl07XG52YXIgY29tcGlsZXIgPSBtb2R1bGVzW1wiY29tcGlsZXJcIl07XG52YXIgcGFyc2VyID0gbW9kdWxlc1tcInBhcnNlclwiXTtcbnZhciBsZXhlciA9IG1vZHVsZXNbXCJsZXhlclwiXTtcbnZhciBydW50aW1lID0gbW9kdWxlc1tcInJ1bnRpbWVcIl07XG52YXIgTG9hZGVyID0gbW9kdWxlc1tcImxvYWRlclwiXTtcbnZhciBsb2FkZXJzID0gbW9kdWxlc1tcImxvYWRlcnNcIl07XG52YXIgcHJlY29tcGlsZSA9IG1vZHVsZXNbXCJwcmVjb21waWxlXCJdO1xuXG5udW5qdWNrcyA9IHt9O1xubnVuanVja3MuRW52aXJvbm1lbnQgPSBlbnYuRW52aXJvbm1lbnQ7XG5udW5qdWNrcy5UZW1wbGF0ZSA9IGVudi5UZW1wbGF0ZTtcblxubnVuanVja3MuTG9hZGVyID0gTG9hZGVyO1xubnVuanVja3MuRmlsZVN5c3RlbUxvYWRlciA9IGxvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcjtcbm51bmp1Y2tzLldlYkxvYWRlciA9IGxvYWRlcnMuV2ViTG9hZGVyO1xuXG5udW5qdWNrcy5jb21waWxlciA9IGNvbXBpbGVyO1xubnVuanVja3MucGFyc2VyID0gcGFyc2VyO1xubnVuanVja3MubGV4ZXIgPSBsZXhlcjtcbm51bmp1Y2tzLnJ1bnRpbWUgPSBydW50aW1lO1xuXG4vLyBBIHNpbmdsZSBpbnN0YW5jZSBvZiBhbiBlbnZpcm9ubWVudCwgc2luY2UgdGhpcyBpcyBzbyBjb21tb25seSB1c2VkXG5cbnZhciBlO1xubnVuanVja3MuY29uZmlndXJlID0gZnVuY3Rpb24odGVtcGxhdGVzUGF0aCwgb3B0cykge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuICAgIGlmKGxpYi5pc09iamVjdCh0ZW1wbGF0ZXNQYXRoKSkge1xuICAgICAgICBvcHRzID0gdGVtcGxhdGVzUGF0aDtcbiAgICAgICAgdGVtcGxhdGVzUGF0aCA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIG5vV2F0Y2ggPSAnd2F0Y2gnIGluIG9wdHMgPyAhb3B0cy53YXRjaCA6IGZhbHNlO1xuICAgIHZhciBsb2FkZXIgPSBsb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIgfHwgbG9hZGVycy5XZWJMb2FkZXI7XG4gICAgZSA9IG5ldyBlbnYuRW52aXJvbm1lbnQobmV3IGxvYWRlcih0ZW1wbGF0ZXNQYXRoLCBub1dhdGNoKSwgb3B0cyk7XG5cbiAgICBpZihvcHRzICYmIG9wdHMuZXhwcmVzcykge1xuICAgICAgICBlLmV4cHJlc3Mob3B0cy5leHByZXNzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZTtcbn07XG5cbm51bmp1Y2tzLmNvbXBpbGUgPSBmdW5jdGlvbihzcmMsIGVudiwgcGF0aCwgZWFnZXJDb21waWxlKSB7XG4gICAgaWYoIWUpIHtcbiAgICAgICAgbnVuanVja3MuY29uZmlndXJlKCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgbnVuanVja3MuVGVtcGxhdGUoc3JjLCBlbnYsIHBhdGgsIGVhZ2VyQ29tcGlsZSk7XG59O1xuXG5udW5qdWNrcy5yZW5kZXIgPSBmdW5jdGlvbihuYW1lLCBjdHgsIGNiKSB7XG4gICAgaWYoIWUpIHtcbiAgICAgICAgbnVuanVja3MuY29uZmlndXJlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGUucmVuZGVyKG5hbWUsIGN0eCwgY2IpO1xufTtcblxubnVuanVja3MucmVuZGVyU3RyaW5nID0gZnVuY3Rpb24oc3JjLCBjdHgsIGNiKSB7XG4gICAgaWYoIWUpIHtcbiAgICAgICAgbnVuanVja3MuY29uZmlndXJlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGUucmVuZGVyU3RyaW5nKHNyYywgY3R4LCBjYik7XG59O1xuXG5pZihwcmVjb21waWxlKSB7XG4gICAgbnVuanVja3MucHJlY29tcGlsZSA9IHByZWNvbXBpbGUucHJlY29tcGlsZTtcbiAgICBudW5qdWNrcy5wcmVjb21waWxlU3RyaW5nID0gcHJlY29tcGlsZS5wcmVjb21waWxlU3RyaW5nO1xufVxuXG5udW5qdWNrcy5yZXF1aXJlID0gZnVuY3Rpb24obmFtZSkgeyByZXR1cm4gbW9kdWxlc1tuYW1lXTsgfTtcblxuaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkgeyByZXR1cm4gbnVuanVja3M7IH0pO1xufVxuZWxzZSB7XG4gICAgd2luZG93Lm51bmp1Y2tzID0gbnVuanVja3M7XG4gICAgaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIG1vZHVsZS5leHBvcnRzID0gbnVuanVja3M7XG59XG5cbn0pKCk7XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzXCIgKTtcbnZhciBlbnYgPSBudW5qdWNrcy5lbnYgfHwgbmV3IG51bmp1Y2tzLkVudmlyb25tZW50KCk7XG52YXIgb2JqID0gKGZ1bmN0aW9uICgpIHtmdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG5vdXRwdXQgKz0gXCI8ZGl2IGNsYXNzPVxcXCJ0aHVtYm5haWxcXFwiPlxcclxcblxcdDxpbWcgZGF0YS1zcmM9XFxcImhvbGRlci5qcy8xMDBweDI1MD90ZXh0PVwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm1lc3NhZ2VcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiJnJhbmRvbT15ZXNcXFwiID5cXHJcXG5cXHRcIjtcbmNvbnRleHQuZ2V0QmxvY2soXCJjb250ZW50XCIpKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGZ1bmN0aW9uKHRfMix0XzEpIHtcbmlmKHRfMikgeyBjYih0XzIpOyByZXR1cm47IH1cbm91dHB1dCArPSB0XzE7XG5vdXRwdXQgKz0gXCJcXHJcXG48L2Rpdj5cIjtcbmNiKG51bGwsIG91dHB1dCk7XG59KTtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5mdW5jdGlvbiBiX2NvbnRlbnQoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbm91dHB1dCArPSBcIlxcclxcblxcdDxkaXYgY2xhc3M9XFxcImNhcHRpb25cXFwiPlxcclxcblxcdFxcdDxoMz5UaHVtYm5haWwgbGFiZWw8L2gzPlxcclxcblxcdFxcdDxwPi4uLjwvcD5cXHJcXG5cXHRcXHQ8cD48YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5XFxcIiByb2xlPVxcXCJidXR0b25cXFwiPkJ1dHRvbjwvYT4gPGEgaHJlZj1cXFwiI1xcXCIgY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdFxcXCIgcm9sZT1cXFwiYnV0dG9uXFxcIj5CdXR0b248L2E+PC9wPlxcclxcblxcdDwvZGl2PlxcclxcblxcdFwiO1xuY2IobnVsbCwgb3V0cHV0KTtcbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xuYl9jb250ZW50OiBiX2NvbnRlbnQsXG5yb290OiByb290XG59O1xufSkoKTtcbnZhciBvbGRSb290ID0gb2JqLnJvb3Q7XG5vYmoucm9vdCA9IGZ1bmN0aW9uKCBlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYiApIHtcblx0dmFyIG9sZEdldFRlbXBsYXRlID0gZW52LmdldFRlbXBsYXRlO1xuXHRlbnYuZ2V0VGVtcGxhdGUgPSBmdW5jdGlvbiggbmFtZSwgZWMsIHBhcmVudE5hbWUsIGNiICkge1xuXHRcdGlmKCB0eXBlb2YgZWMgPT09IFwiZnVuY3Rpb25cIiApIHtcblx0XHRcdGNiID0gZWM7XG5cdFx0XHRlYyA9IGZhbHNlO1xuXHRcdH1cblx0XHR2YXIgX3JlcXVpcmUgPSBmdW5jdGlvbihuYW1lKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4gcmVxdWlyZShuYW1lKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKCBmcmFtZS5nZXQoIFwiX3JlcXVpcmVcIiApICkgcmV0dXJuIGZyYW1lLmdldCggXCJfcmVxdWlyZVwiICkoIG5hbWUgKVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0dmFyIHRtcGwgPSBfcmVxdWlyZSggbmFtZSApO1xuXHRcdGZyYW1lLnNldCggXCJfcmVxdWlyZVwiLCBfcmVxdWlyZSApO1xuXHRcdGlmKCBlYyApIHRtcGwuY29tcGlsZSgpO1xuXHRcdGNiKCBudWxsLCB0bXBsICk7XG5cdH07XHRvbGRSb290KCBlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBmdW5jdGlvbiggZXJyLCByZXMgKSB7XG5cdFx0ZW52LmdldFRlbXBsYXRlID0gb2xkR2V0VGVtcGxhdGU7XG5cdFx0Y2IoIGVyciwgcmVzICk7XG5cdH0gKTtcbn07XG52YXIgc3JjID0ge1xuXHRvYmo6IG9iaixcblx0dHlwZTogXCJjb2RlXCJcbn07XG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBudW5qdWNrcy5UZW1wbGF0ZSggc3JjLCBlbnYgKTtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3NcIiApO1xudmFyIGVudiA9IG51bmp1Y2tzLmVudiB8fCBuZXcgbnVuanVja3MuRW52aXJvbm1lbnQoKTtcbnZhciBvYmogPSAoZnVuY3Rpb24gKCkge2Z1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbm91dHB1dCArPSBcIjxkaXYgY2xhc3M9XFxcImNhcHRpb25cXFwiPlxcclxcblxcdDxoMz5UZXN0TW9kdWxlIC0gPHNtYWxsPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwidGVzdFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwibWVzc2FnZVwiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9zbWFsbD48L2gzPlxcclxcblxcdDxwPk3Ds2R1bG8gV2luZG93PC9wPlxcclxcblxcdDxwPjxzcGFuPkJlYXRhZSBleCBxdWlidXNkYW0sIG1vZGkgc2VkIGlsbG8gY29uc2VxdWF0dXIgZXQhIEV4IG5lcXVlIHF1YXNpIG1vbGVzdGlhZSB2b2x1cHRhdGVzIGNvbW1vZGkgZnVnaWF0IHJlcHVkaWFuZGFlIHByYWVzZW50aXVtLCBvZmZpY2lpcyBxdWFzIHF1aWRlbSB2ZWwgbmloaWwgc2FlcGUgYXBlcmlhbSBhY2N1c2FudGl1bSwgZG9sb3JlIGxpYmVybyBvYmNhZWNhdGkgaW4gcXVhZXJhdC48L3NwYW4+PC9wPlxcclxcblxcdDxwPjxhIGhyZWY9XFxcIiNcXFwiIGNsYXNzPVxcXCJidG4gYnRuLXByaW1hcnlcXFwiIHJvbGU9XFxcImJ1dHRvblxcXCI+QnV0dG9uPC9hPiA8YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0XFxcIiByb2xlPVxcXCJidXR0b25cXFwiPkJ1dHRvbjwvYT48L3A+XFxyXFxuPC9kaXY+XCI7XG5jYihudWxsLCBvdXRwdXQpO1xuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xufSkoKTtcbnZhciBvbGRSb290ID0gb2JqLnJvb3Q7XG5vYmoucm9vdCA9IGZ1bmN0aW9uKCBlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYiApIHtcblx0dmFyIG9sZEdldFRlbXBsYXRlID0gZW52LmdldFRlbXBsYXRlO1xuXHRlbnYuZ2V0VGVtcGxhdGUgPSBmdW5jdGlvbiggbmFtZSwgZWMsIHBhcmVudE5hbWUsIGNiICkge1xuXHRcdGlmKCB0eXBlb2YgZWMgPT09IFwiZnVuY3Rpb25cIiApIHtcblx0XHRcdGNiID0gZWM7XG5cdFx0XHRlYyA9IGZhbHNlO1xuXHRcdH1cblx0XHR2YXIgX3JlcXVpcmUgPSBmdW5jdGlvbihuYW1lKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4gcmVxdWlyZShuYW1lKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKCBmcmFtZS5nZXQoIFwiX3JlcXVpcmVcIiApICkgcmV0dXJuIGZyYW1lLmdldCggXCJfcmVxdWlyZVwiICkoIG5hbWUgKVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0dmFyIHRtcGwgPSBfcmVxdWlyZSggbmFtZSApO1xuXHRcdGZyYW1lLnNldCggXCJfcmVxdWlyZVwiLCBfcmVxdWlyZSApO1xuXHRcdGlmKCBlYyApIHRtcGwuY29tcGlsZSgpO1xuXHRcdGNiKCBudWxsLCB0bXBsICk7XG5cdH07XHRvbGRSb290KCBlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBmdW5jdGlvbiggZXJyLCByZXMgKSB7XG5cdFx0ZW52LmdldFRlbXBsYXRlID0gb2xkR2V0VGVtcGxhdGU7XG5cdFx0Y2IoIGVyciwgcmVzICk7XG5cdH0gKTtcbn07XG52YXIgc3JjID0ge1xuXHRvYmo6IG9iaixcblx0dHlwZTogXCJjb2RlXCJcbn07XG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBudW5qdWNrcy5UZW1wbGF0ZSggc3JjLCBlbnYgKTtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3NcIiApO1xudmFyIGVudiA9IG51bmp1Y2tzLmVudiB8fCBuZXcgbnVuanVja3MuRW52aXJvbm1lbnQoKTtcbnJlcXVpcmUoIFwiLi9sYXlvdXQubnVualwiICk7XG5yZXF1aXJlKCBcIi4vcGFydGlhbHMvY29udGVudC5udW5qXCIgKTtcbnZhciBvYmogPSAoZnVuY3Rpb24gKCkge2Z1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbmVudi5nZXRUZW1wbGF0ZShcIi4vbGF5b3V0Lm51bmpcIiwgdHJ1ZSwgdW5kZWZpbmVkLCBmdW5jdGlvbih0XzIscGFyZW50VGVtcGxhdGUpIHtcbmlmKHRfMikgeyBjYih0XzIpOyByZXR1cm47IH1cbmZvcih2YXIgdF8xIGluIHBhcmVudFRlbXBsYXRlLmJsb2Nrcykge1xuY29udGV4dC5hZGRCbG9jayh0XzEsIHBhcmVudFRlbXBsYXRlLmJsb2Nrc1t0XzFdKTtcbn1cbm91dHB1dCArPSBcIlxcclxcblwiO1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSk7XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxuZnVuY3Rpb24gYl9jb250ZW50KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG5vdXRwdXQgKz0gXCJcXHJcXG5cXHRcIjtcbmVudi5nZXRUZW1wbGF0ZShcIi4vcGFydGlhbHMvY29udGVudC5udW5qXCIsIGZhbHNlLCB1bmRlZmluZWQsIGZ1bmN0aW9uKHRfNSx0XzMpIHtcbmlmKHRfNSkgeyBjYih0XzUpOyByZXR1cm47IH1cbnRfMy5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUucHVzaCgpLCBmdW5jdGlvbih0XzYsdF80KSB7XG5pZih0XzYpIHsgY2IodF82KTsgcmV0dXJuOyB9XG5vdXRwdXQgKz0gdF80XG5vdXRwdXQgKz0gXCJcXHJcXG5cIjtcbmNiKG51bGwsIG91dHB1dCk7XG59KX0pO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5iX2NvbnRlbnQ6IGJfY29udGVudCxcbnJvb3Q6IHJvb3Rcbn07XG59KSgpO1xudmFyIG9sZFJvb3QgPSBvYmoucm9vdDtcbm9iai5yb290ID0gZnVuY3Rpb24oIGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiICkge1xuXHR2YXIgb2xkR2V0VGVtcGxhdGUgPSBlbnYuZ2V0VGVtcGxhdGU7XG5cdGVudi5nZXRUZW1wbGF0ZSA9IGZ1bmN0aW9uKCBuYW1lLCBlYywgcGFyZW50TmFtZSwgY2IgKSB7XG5cdFx0aWYoIHR5cGVvZiBlYyA9PT0gXCJmdW5jdGlvblwiICkge1xuXHRcdFx0Y2IgPSBlYztcblx0XHRcdGVjID0gZmFsc2U7XG5cdFx0fVxuXHRcdHZhciBfcmVxdWlyZSA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJldHVybiByZXF1aXJlKG5hbWUpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAoIGZyYW1lLmdldCggXCJfcmVxdWlyZVwiICkgKSByZXR1cm4gZnJhbWUuZ2V0KCBcIl9yZXF1aXJlXCIgKSggbmFtZSApXG5cdFx0XHR9XG5cdFx0fTtcblx0XHR2YXIgdG1wbCA9IF9yZXF1aXJlKCBuYW1lICk7XG5cdFx0ZnJhbWUuc2V0KCBcIl9yZXF1aXJlXCIsIF9yZXF1aXJlICk7XG5cdFx0aWYoIGVjICkgdG1wbC5jb21waWxlKCk7XG5cdFx0Y2IoIG51bGwsIHRtcGwgKTtcblx0fTtcdG9sZFJvb3QoIGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGZ1bmN0aW9uKCBlcnIsIHJlcyApIHtcblx0XHRlbnYuZ2V0VGVtcGxhdGUgPSBvbGRHZXRUZW1wbGF0ZTtcblx0XHRjYiggZXJyLCByZXMgKTtcblx0fSApO1xufTtcbnZhciBzcmMgPSB7XG5cdG9iajogb2JqLFxuXHR0eXBlOiBcImNvZGVcIlxufTtcbm1vZHVsZS5leHBvcnRzID0gbmV3IG51bmp1Y2tzLlRlbXBsYXRlKCBzcmMsIGVudiApO1xuIiwiLy92YXIgc3dpZyA9IHJlcXVpcmUoJ3N3aWcnKTtcclxuXHJcbi8qKlxyXG4qXHRBw7FhZGllbmRvIGZpbHRyb3MgYSBsYXMgcGxhbnRpbGxhc1xyXG4qL1xyXG52YXIgbnVuanVja3MgPSByZXF1aXJlKCAnbnVuanVja3MnICk7XHJcbm51bmp1Y2tzLmVudiA9IG5ldyBudW5qdWNrcy5FbnZpcm9ubWVudCgpO1xyXG5udW5qdWNrcy5lbnYuYWRkRmlsdGVyKCAndGVzdCcsIGZ1bmN0aW9uKCB0ZXN0ICkge1xyXG4gICAgcmV0dXJuIHRlc3QrJyAoTnVuanVja3MgVGVzdCBGaWx0ZXIpJztcclxufSk7XHJcblxyXG52YXIgTU9EID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xyXG5cclxuXHR0ZW1wbGF0ZSBcdDogcmVxdWlyZSgnLi90ZW1wbGF0ZXMvdGVzdFRlbXBsYXRlLm51bmonKSxcclxuXHRcclxuXHRpbml0aWFsaXplIFx0OiBmdW5jdGlvbihvcHRpb25zKXtcclxuXHRcdHRoaXMubW9kdWxlQ29uZmlnID0gXy5leHRlbmQoe30sb3B0aW9ucyk7XHJcblx0XHRCYWNrYm9uZS5vbih7XHJcblx0XHRcdCdjdXN0b206Y2hhbmdlJ1x0OiBfLmJpbmQodGhpcy5vbkN1c3RvbUNoYW5nZSx0aGlzKSxcclxuXHRcdFx0J2N1c3RvbTpzdGFydCdcdDogXy5iaW5kKHRoaXMub25DdXN0b21TdGFydCx0aGlzKSxcclxuXHRcdFx0J2N1c3RvbTplbmQnXHQ6IF8uYmluZCh0aGlzLm9uQ3VzdG9tRW5kLHRoaXMpLFxyXG5cdFx0fSk7XHJcblx0XHR0aGlzLnJlbmRlcigpO1xyXG5cdH0sXHJcblx0cmVuZGVyIFx0XHQ6IGZ1bmN0aW9uKCl7XHJcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLnRlbXBsYXRlLnJlbmRlcih7bWVzc2FnZTogdGhpcy4kZWwuYXR0cignaWQnKX0pICk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9LFxyXG5cdG9uQ3VzdG9tQ2hhbmdlIFx0OiBmdW5jdGlvbigpe1xyXG5cdFx0Y29uc29sZS5sb2coXCJbY2hhbmdlXVwiLHRoaXMpO1xyXG5cdH0sXHJcblx0b25DdXN0b21TdGFydCBcdDogZnVuY3Rpb24oKXtcclxuXHRcdGNvbnNvbGUubG9nKFwiW3N0YXJ0XVwiLHRoaXMpO1xyXG5cdH0sXHJcblx0b25DdXN0b21FbmQgXHQ6IGZ1bmN0aW9uKCl7XHJcblx0XHRjb25zb2xlLmxvZyhcIltlbmRdXCIsdGhpcyk7XHJcblx0fSxcclxufSk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdHMsIHB1YnN1Yil7XHJcblx0aWYocHVic3ViKSBvcHRzLnB1YnN1YiA9IHB1YnN1YjtcclxuXHRyZXR1cm4gbmV3IE1PRChvcHRzKTtcclxufTsiXX0=

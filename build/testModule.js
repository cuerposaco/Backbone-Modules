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
output += "\n";
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
output += "\n\t";
env.getTemplate("./partials/content.nunj", false, undefined, function(t_5,t_3) {
if(t_5) { cb(t_5); return; }
t_3.render(context.getVariables(), frame.push(), function(t_6,t_4) {
if(t_6) { cb(t_6); return; }
output += t_4
output += "\n";
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

},{"./layout.nunj":3,"./partials/content.nunj":4,"nunjucks":1}],3:[function(require,module,exports){
var nunjucks = require( "nunjucks" );
var env = nunjucks.env || new nunjucks.Environment();
var obj = (function () {function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
output += "<div class=\"row\">\n\t<div class=\"wrapper\">\n\t\t";
context.getBlock("content")(env, context, frame, runtime, function(t_2,t_1) {
if(t_2) { cb(t_2); return; }
output += t_1;
output += "\n\t</div>\n</div>";
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
output += "\n\t\t<h1>Main content</h1>\n\t\t";
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

},{"nunjucks":1}],4:[function(require,module,exports){
var nunjucks = require( "nunjucks" );
var env = nunjucks.env || new nunjucks.Environment();
var obj = (function () {function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
output += "<h4>Hello ";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "message"), env.opts.autoescape);
output += "</h4>\n<p><span><strong>";
output += runtime.suppressValue(env.getFilter("test").call(context, env.getFilter("upper").call(context, runtime.contextOrFrameLookup(context, frame, "message"))), env.opts.autoescape);
output += "</strong></span>\n<span>Beatae ex quibusdam, modi sed illo consequatur et! Ex neque quasi molestiae voluptates commodi fugiat repudiandae praesentium, officiis quas quidem vel nihil saepe aperiam accusantium, dolore libero obcaecati in quaerat.</span>\n<span>Exercitationem porro hic officiis aut totam, sapiente tempore non ducimus, distinctio inventore eaque, necessitatibus earum velit error ratione minima sunt incidunt accusantium odio provident! Voluptates ipsum, error velit labore assumenda.</span>\n<span>Voluptate, perspiciatis consequatur saepe beatae. Asperiores nemo amet hic veniam adipisci repudiandae aliquid magnam similique dolores accusamus nisi voluptas id ea eaque, et voluptatibus labore placeat. Culpa similique numquam, est.</span></p>";
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

},{"nunjucks":1}],5:[function(require,module,exports){
//var swig = require('swig');

/**
*	Añadiendo filtros a las plantillas
*/
var nunjucks = require( 'nunjucks' );
nunjucks.env = new nunjucks.Environment();
nunjucks.env.addFilter( 'test', function( test ) {
    return test+' --- TEST';
});

module.exports = Backbone.View.extend({

	template 	: require('./templates/hello.nunj'),
	
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
},{"./templates/hello.nunj":2,"nunjucks":1}]},{},[5])(5)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvbnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltLmpzIiwic3JjL3RlbXBsYXRlcy9oZWxsby5udW5qIiwic3JjL3RlbXBsYXRlcy9sYXlvdXQubnVuaiIsInNyYy90ZW1wbGF0ZXMvcGFydGlhbHMvY29udGVudC5udW5qIiwic3JjL3Rlc3RNb2R1bGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzMkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIEJyb3dzZXIgYnVuZGxlIG9mIG51bmp1Y2tzIDEuMy4zIChzbGltLCBvbmx5IHdvcmtzIHdpdGggcHJlY29tcGlsZWQgdGVtcGxhdGVzKVxuXG4oZnVuY3Rpb24oKSB7XG52YXIgbW9kdWxlcyA9IHt9O1xuKGZ1bmN0aW9uKCkge1xuJ3VzZSBzdHJpY3QnO1xuXG4vLyBBIHNpbXBsZSBjbGFzcyBzeXN0ZW0sIG1vcmUgZG9jdW1lbnRhdGlvbiB0byBjb21lXG5cbmZ1bmN0aW9uIGV4dGVuZChjbHMsIG5hbWUsIHByb3BzKSB7XG4gICAgLy8gVGhpcyBkb2VzIHRoYXQgc2FtZSB0aGluZyBhcyBPYmplY3QuY3JlYXRlLCBidXQgd2l0aCBzdXBwb3J0IGZvciBJRThcbiAgICB2YXIgRiA9IGZ1bmN0aW9uKCkge307XG4gICAgRi5wcm90b3R5cGUgPSBjbHMucHJvdG90eXBlO1xuICAgIHZhciBwcm90b3R5cGUgPSBuZXcgRigpO1xuXG4gICAgdmFyIGZuVGVzdCA9IC94eXovLnRlc3QoZnVuY3Rpb24oKXsgeHl6OyB9KSA/IC9cXGJwYXJlbnRcXGIvIDogLy4qLztcbiAgICBwcm9wcyA9IHByb3BzIHx8IHt9O1xuXG4gICAgZm9yKHZhciBrIGluIHByb3BzKSB7XG4gICAgICAgIHZhciBzcmMgPSBwcm9wc1trXTtcbiAgICAgICAgdmFyIHBhcmVudCA9IHByb3RvdHlwZVtrXTtcblxuICAgICAgICBpZih0eXBlb2YgcGFyZW50ID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAgICAgIHR5cGVvZiBzcmMgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgICAgZm5UZXN0LnRlc3Qoc3JjKSkge1xuICAgICAgICAgICAgcHJvdG90eXBlW2tdID0gKGZ1bmN0aW9uIChzcmMsIHBhcmVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2F2ZSB0aGUgY3VycmVudCBwYXJlbnQgbWV0aG9kXG4gICAgICAgICAgICAgICAgICAgIHZhciB0bXAgPSB0aGlzLnBhcmVudDtcblxuICAgICAgICAgICAgICAgICAgICAvLyBTZXQgcGFyZW50IHRvIHRoZSBwcmV2aW91cyBtZXRob2QsIGNhbGwsIGFuZCByZXN0b3JlXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzID0gc3JjLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50ID0gdG1wO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pKHNyYywgcGFyZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHByb3RvdHlwZVtrXSA9IHNyYztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RvdHlwZS50eXBlbmFtZSA9IG5hbWU7XG5cbiAgICB2YXIgbmV3X2NscyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZihwcm90b3R5cGUuaW5pdCkge1xuICAgICAgICAgICAgcHJvdG90eXBlLmluaXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBuZXdfY2xzLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICBuZXdfY2xzLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IG5ld19jbHM7XG5cbiAgICBuZXdfY2xzLmV4dGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHByb3BzKSB7XG4gICAgICAgIGlmKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcHJvcHMgPSBuYW1lO1xuICAgICAgICAgICAgbmFtZSA9ICdhbm9ueW1vdXMnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBleHRlbmQobmV3X2NscywgbmFtZSwgcHJvcHMpO1xuICAgIH07XG5cbiAgICByZXR1cm4gbmV3X2Nscztcbn1cblxubW9kdWxlc1snb2JqZWN0J10gPSBleHRlbmQoT2JqZWN0LCAnT2JqZWN0Jywge30pO1xufSkoKTtcbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0JztcblxudmFyIEFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGU7XG52YXIgT2JqUHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG52YXIgZXNjYXBlTWFwID0ge1xuICAgICcmJzogJyZhbXA7JyxcbiAgICAnXCInOiAnJnF1b3Q7JyxcbiAgICAnXFwnJzogJyYjMzk7JyxcbiAgICAnPCc6ICcmbHQ7JyxcbiAgICAnPic6ICcmZ3Q7J1xufTtcblxudmFyIGVzY2FwZVJlZ2V4ID0gL1smXCInPD5dL2c7XG5cbnZhciBsb29rdXBFc2NhcGUgPSBmdW5jdGlvbihjaCkge1xuICAgIHJldHVybiBlc2NhcGVNYXBbY2hdO1xufTtcblxudmFyIGV4cG9ydHMgPSBtb2R1bGVzWydsaWInXSA9IHt9O1xuXG5leHBvcnRzLndpdGhQcmV0dHlFcnJvcnMgPSBmdW5jdGlvbihwYXRoLCB3aXRoSW50ZXJuYWxzLCBmdW5jKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGZ1bmMoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGlmICghZS5VcGRhdGUpIHtcbiAgICAgICAgICAgIC8vIG5vdCBvbmUgb2Ygb3VycywgY2FzdCBpdFxuICAgICAgICAgICAgZSA9IG5ldyBleHBvcnRzLlRlbXBsYXRlRXJyb3IoZSk7XG4gICAgICAgIH1cbiAgICAgICAgZS5VcGRhdGUocGF0aCk7XG5cbiAgICAgICAgLy8gVW5sZXNzIHRoZXkgbWFya2VkIHRoZSBkZXYgZmxhZywgc2hvdyB0aGVtIGEgdHJhY2UgZnJvbSBoZXJlXG4gICAgICAgIGlmICghd2l0aEludGVybmFscykge1xuICAgICAgICAgICAgdmFyIG9sZCA9IGU7XG4gICAgICAgICAgICBlID0gbmV3IEVycm9yKG9sZC5tZXNzYWdlKTtcbiAgICAgICAgICAgIGUubmFtZSA9IG9sZC5uYW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhyb3cgZTtcbiAgICB9XG59O1xuXG5leHBvcnRzLlRlbXBsYXRlRXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlLCBsaW5lbm8sIGNvbG5vKSB7XG4gICAgdmFyIGVyciA9IHRoaXM7XG5cbiAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIEVycm9yKSB7IC8vIGZvciBjYXN0aW5nIHJlZ3VsYXIganMgZXJyb3JzXG4gICAgICAgIGVyciA9IG1lc3NhZ2U7XG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlLm5hbWUgKyAnOiAnICsgbWVzc2FnZS5tZXNzYWdlO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGlmKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICAgICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShlcnIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZXJyLm5hbWUgPSAnVGVtcGxhdGUgcmVuZGVyIGVycm9yJztcbiAgICBlcnIubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgZXJyLmxpbmVubyA9IGxpbmVubztcbiAgICBlcnIuY29sbm8gPSBjb2xubztcbiAgICBlcnIuZmlyc3RVcGRhdGUgPSB0cnVlO1xuXG4gICAgZXJyLlVwZGF0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICAgICAgdmFyIG1lc3NhZ2UgPSAnKCcgKyAocGF0aCB8fCAndW5rbm93biBwYXRoJykgKyAnKSc7XG5cbiAgICAgICAgLy8gb25seSBzaG93IGxpbmVubyArIGNvbG5vIG5leHQgdG8gcGF0aCBvZiB0ZW1wbGF0ZVxuICAgICAgICAvLyB3aGVyZSBlcnJvciBvY2N1cnJlZFxuICAgICAgICBpZiAodGhpcy5maXJzdFVwZGF0ZSkge1xuICAgICAgICAgICAgaWYodGhpcy5saW5lbm8gJiYgdGhpcy5jb2xubykge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyBbTGluZSAnICsgdGhpcy5saW5lbm8gKyAnLCBDb2x1bW4gJyArIHRoaXMuY29sbm8gKyAnXSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKHRoaXMubGluZW5vKSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZSArPSAnIFtMaW5lICcgKyB0aGlzLmxpbmVubyArICddJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG1lc3NhZ2UgKz0gJ1xcbiAnO1xuICAgICAgICBpZiAodGhpcy5maXJzdFVwZGF0ZSkge1xuICAgICAgICAgICAgbWVzc2FnZSArPSAnICc7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlICsgKHRoaXMubWVzc2FnZSB8fCAnJyk7XG4gICAgICAgIHRoaXMuZmlyc3RVcGRhdGUgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxuICAgIHJldHVybiBlcnI7XG59O1xuXG5leHBvcnRzLlRlbXBsYXRlRXJyb3IucHJvdG90eXBlID0gRXJyb3IucHJvdG90eXBlO1xuXG5leHBvcnRzLmVzY2FwZSA9IGZ1bmN0aW9uKHZhbCkge1xuICByZXR1cm4gdmFsLnJlcGxhY2UoZXNjYXBlUmVnZXgsIGxvb2t1cEVzY2FwZSk7XG59O1xuXG5leHBvcnRzLmlzRnVuY3Rpb24gPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xufTtcblxuZXhwb3J0cy5pc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxuZXhwb3J0cy5pc1N0cmluZyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IFN0cmluZ10nO1xufTtcblxuZXhwb3J0cy5pc09iamVjdCA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBPYmpQcm90by50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xufTtcblxuZXhwb3J0cy5ncm91cEJ5ID0gZnVuY3Rpb24ob2JqLCB2YWwpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgdmFyIGl0ZXJhdG9yID0gZXhwb3J0cy5pc0Z1bmN0aW9uKHZhbCkgPyB2YWwgOiBmdW5jdGlvbihvYmopIHsgcmV0dXJuIG9ialt2YWxdOyB9O1xuICAgIGZvcih2YXIgaT0wOyBpPG9iai5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdmFsdWUgPSBvYmpbaV07XG4gICAgICAgIHZhciBrZXkgPSBpdGVyYXRvcih2YWx1ZSwgaSk7XG4gICAgICAgIChyZXN1bHRba2V5XSB8fCAocmVzdWx0W2tleV0gPSBbXSkpLnB1c2godmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuZXhwb3J0cy50b0FycmF5ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKG9iaik7XG59O1xuXG5leHBvcnRzLndpdGhvdXQgPSBmdW5jdGlvbihhcnJheSkge1xuICAgIHZhciByZXN1bHQgPSBbXTtcbiAgICBpZiAoIWFycmF5KSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHZhciBpbmRleCA9IC0xLFxuICAgIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCxcbiAgICBjb250YWlucyA9IGV4cG9ydHMudG9BcnJheShhcmd1bWVudHMpLnNsaWNlKDEpO1xuXG4gICAgd2hpbGUoKytpbmRleCA8IGxlbmd0aCkge1xuICAgICAgICBpZihleHBvcnRzLmluZGV4T2YoY29udGFpbnMsIGFycmF5W2luZGV4XSkgPT09IC0xKSB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChhcnJheVtpbmRleF0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5leHBvcnRzLmV4dGVuZCA9IGZ1bmN0aW9uKG9iaiwgb2JqMikge1xuICAgIGZvcih2YXIgayBpbiBvYmoyKSB7XG4gICAgICAgIG9ialtrXSA9IG9iajJba107XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG59O1xuXG5leHBvcnRzLnJlcGVhdCA9IGZ1bmN0aW9uKGNoYXJfLCBuKSB7XG4gICAgdmFyIHN0ciA9ICcnO1xuICAgIGZvcih2YXIgaT0wOyBpPG47IGkrKykge1xuICAgICAgICBzdHIgKz0gY2hhcl87XG4gICAgfVxuICAgIHJldHVybiBzdHI7XG59O1xuXG5leHBvcnRzLmVhY2ggPSBmdW5jdGlvbihvYmosIGZ1bmMsIGNvbnRleHQpIHtcbiAgICBpZihvYmogPT0gbnVsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYoQXJyYXlQcm90by5lYWNoICYmIG9iai5lYWNoID09PSBBcnJheVByb3RvLmVhY2gpIHtcbiAgICAgICAgb2JqLmZvckVhY2goZnVuYywgY29udGV4dCk7XG4gICAgfVxuICAgIGVsc2UgaWYob2JqLmxlbmd0aCA9PT0gK29iai5sZW5ndGgpIHtcbiAgICAgICAgZm9yKHZhciBpPTAsIGw9b2JqLmxlbmd0aDsgaTxsOyBpKyspIHtcbiAgICAgICAgICAgIGZ1bmMuY2FsbChjb250ZXh0LCBvYmpbaV0sIGksIG9iaik7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5leHBvcnRzLm1hcCA9IGZ1bmN0aW9uKG9iaiwgZnVuYykge1xuICAgIHZhciByZXN1bHRzID0gW107XG4gICAgaWYob2JqID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuXG4gICAgaWYoQXJyYXlQcm90by5tYXAgJiYgb2JqLm1hcCA9PT0gQXJyYXlQcm90by5tYXApIHtcbiAgICAgICAgcmV0dXJuIG9iai5tYXAoZnVuYyk7XG4gICAgfVxuXG4gICAgZm9yKHZhciBpPTA7IGk8b2JqLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJlc3VsdHNbcmVzdWx0cy5sZW5ndGhdID0gZnVuYyhvYmpbaV0sIGkpO1xuICAgIH1cblxuICAgIGlmKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICAgIHJlc3VsdHMubGVuZ3RoID0gb2JqLmxlbmd0aDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbn07XG5cbmV4cG9ydHMuYXN5bmNJdGVyID0gZnVuY3Rpb24oYXJyLCBpdGVyLCBjYikge1xuICAgIHZhciBpID0gLTE7XG5cbiAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICBpKys7XG5cbiAgICAgICAgaWYoaSA8IGFyci5sZW5ndGgpIHtcbiAgICAgICAgICAgIGl0ZXIoYXJyW2ldLCBpLCBuZXh0LCBjYik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjYigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV4dCgpO1xufTtcblxuZXhwb3J0cy5hc3luY0ZvciA9IGZ1bmN0aW9uKG9iaiwgaXRlciwgY2IpIHtcbiAgICB2YXIga2V5cyA9IGV4cG9ydHMua2V5cyhvYmopO1xuICAgIHZhciBsZW4gPSBrZXlzLmxlbmd0aDtcbiAgICB2YXIgaSA9IC0xO1xuXG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgaSsrO1xuICAgICAgICB2YXIgayA9IGtleXNbaV07XG5cbiAgICAgICAgaWYoaSA8IGxlbikge1xuICAgICAgICAgICAgaXRlcihrLCBvYmpba10sIGksIGxlbiwgbmV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjYigpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV4dCgpO1xufTtcblxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvaW5kZXhPZiNQb2x5ZmlsbFxuZXhwb3J0cy5pbmRleE9mID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2YgP1xuICAgIGZ1bmN0aW9uIChhcnIsIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChhcnIsIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCk7XG4gICAgfSA6XG4gICAgZnVuY3Rpb24gKGFyciwgc2VhcmNoRWxlbWVudCwgZnJvbUluZGV4KSB7XG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCA+Pj4gMDsgLy8gSGFjayB0byBjb252ZXJ0IG9iamVjdC5sZW5ndGggdG8gYSBVSW50MzJcblxuICAgICAgICBmcm9tSW5kZXggPSArZnJvbUluZGV4IHx8IDA7XG5cbiAgICAgICAgaWYoTWF0aC5hYnMoZnJvbUluZGV4KSA9PT0gSW5maW5pdHkpIHtcbiAgICAgICAgICAgIGZyb21JbmRleCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZihmcm9tSW5kZXggPCAwKSB7XG4gICAgICAgICAgICBmcm9tSW5kZXggKz0gbGVuZ3RoO1xuICAgICAgICAgICAgaWYgKGZyb21JbmRleCA8IDApIHtcbiAgICAgICAgICAgICAgICBmcm9tSW5kZXggPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yKDtmcm9tSW5kZXggPCBsZW5ndGg7IGZyb21JbmRleCsrKSB7XG4gICAgICAgICAgICBpZiAoYXJyW2Zyb21JbmRleF0gPT09IHNlYXJjaEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnJvbUluZGV4O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH07XG5cbmlmKCFBcnJheS5wcm90b3R5cGUubWFwKSB7XG4gICAgQXJyYXkucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hcCBpcyB1bmltcGxlbWVudGVkIGZvciB0aGlzIGpzIGVuZ2luZScpO1xuICAgIH07XG59XG5cbmV4cG9ydHMua2V5cyA9IGZ1bmN0aW9uKG9iaikge1xuICAgIGlmKE9iamVjdC5wcm90b3R5cGUua2V5cykge1xuICAgICAgICByZXR1cm4gb2JqLmtleXMoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHZhciBrZXlzID0gW107XG4gICAgICAgIGZvcih2YXIgayBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmKG9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgICAgICAgIGtleXMucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ga2V5cztcbiAgICB9XG59XG59KSgpO1xuKGZ1bmN0aW9uKCkge1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgbGliID0gbW9kdWxlc1tcImxpYlwiXTtcbnZhciBPYmogPSBtb2R1bGVzW1wib2JqZWN0XCJdO1xuXG4vLyBGcmFtZXMga2VlcCB0cmFjayBvZiBzY29waW5nIGJvdGggYXQgY29tcGlsZS10aW1lIGFuZCBydW4tdGltZSBzb1xuLy8gd2Uga25vdyBob3cgdG8gYWNjZXNzIHZhcmlhYmxlcy4gQmxvY2sgdGFncyBjYW4gaW50cm9kdWNlIHNwZWNpYWxcbi8vIHZhcmlhYmxlcywgZm9yIGV4YW1wbGUuXG52YXIgRnJhbWUgPSBPYmouZXh0ZW5kKHtcbiAgICBpbml0OiBmdW5jdGlvbihwYXJlbnQpIHtcbiAgICAgICAgdGhpcy52YXJpYWJsZXMgPSB7fTtcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgfSxcblxuICAgIHNldDogZnVuY3Rpb24obmFtZSwgdmFsLCByZXNvbHZlVXApIHtcbiAgICAgICAgLy8gQWxsb3cgdmFyaWFibGVzIHdpdGggZG90cyBieSBhdXRvbWF0aWNhbGx5IGNyZWF0aW5nIHRoZVxuICAgICAgICAvLyBuZXN0ZWQgc3RydWN0dXJlXG4gICAgICAgIHZhciBwYXJ0cyA9IG5hbWUuc3BsaXQoJy4nKTtcbiAgICAgICAgdmFyIG9iaiA9IHRoaXMudmFyaWFibGVzO1xuICAgICAgICB2YXIgZnJhbWUgPSB0aGlzO1xuXG4gICAgICAgIGlmKHJlc29sdmVVcCkge1xuICAgICAgICAgICAgaWYoKGZyYW1lID0gdGhpcy5yZXNvbHZlKHBhcnRzWzBdKSkpIHtcbiAgICAgICAgICAgICAgICBmcmFtZS5zZXQobmFtZSwgdmFsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmcmFtZSA9IHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IodmFyIGk9MDsgaTxwYXJ0cy5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpZCA9IHBhcnRzW2ldO1xuXG4gICAgICAgICAgICBpZighb2JqW2lkXSkge1xuICAgICAgICAgICAgICAgIG9ialtpZF0gPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9iaiA9IG9ialtpZF07XG4gICAgICAgIH1cblxuICAgICAgICBvYmpbcGFydHNbcGFydHMubGVuZ3RoIC0gMV1dID0gdmFsO1xuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFyaWFibGVzW25hbWVdO1xuICAgICAgICBpZih2YWwgIT09IHVuZGVmaW5lZCAmJiB2YWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcblxuICAgIGxvb2t1cDogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucGFyZW50O1xuICAgICAgICB2YXIgdmFsID0gdGhpcy52YXJpYWJsZXNbbmFtZV07XG4gICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkICYmIHZhbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcCAmJiBwLmxvb2t1cChuYW1lKTtcbiAgICB9LFxuXG4gICAgcmVzb2x2ZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucGFyZW50O1xuICAgICAgICB2YXIgdmFsID0gdGhpcy52YXJpYWJsZXNbbmFtZV07XG4gICAgICAgIGlmKHZhbCAhPT0gdW5kZWZpbmVkICYmIHZhbCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHAgJiYgcC5yZXNvbHZlKG5hbWUpO1xuICAgIH0sXG5cbiAgICBwdXNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGcmFtZSh0aGlzKTtcbiAgICB9LFxuXG4gICAgcG9wOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyZW50O1xuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiBtYWtlTWFjcm8oYXJnTmFtZXMsIGt3YXJnTmFtZXMsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBhcmdDb3VudCA9IG51bUFyZ3MoYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIGFyZ3M7XG4gICAgICAgIHZhciBrd2FyZ3MgPSBnZXRLZXl3b3JkQXJncyhhcmd1bWVudHMpO1xuXG4gICAgICAgIGlmKGFyZ0NvdW50ID4gYXJnTmFtZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwLCBhcmdOYW1lcy5sZW5ndGgpO1xuXG4gICAgICAgICAgICAvLyBQb3NpdGlvbmFsIGFyZ3VtZW50cyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgaW4gYXNcbiAgICAgICAgICAgIC8vIGtleXdvcmQgYXJndW1lbnRzIChlc3NlbnRpYWxseSBkZWZhdWx0IHZhbHVlcylcbiAgICAgICAgICAgIHZhciB2YWxzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCBhcmdzLmxlbmd0aCwgYXJnQ291bnQpO1xuICAgICAgICAgICAgZm9yKHZhciBpPTA7IGk8dmFscy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmKGkgPCBrd2FyZ05hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBrd2FyZ3Nba3dhcmdOYW1lc1tpXV0gPSB2YWxzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXJncy5wdXNoKGt3YXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihhcmdDb3VudCA8IGFyZ05hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCwgYXJnQ291bnQpO1xuXG4gICAgICAgICAgICBmb3IodmFyIGk9YXJnQ291bnQ7IGk8YXJnTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJnTmFtZXNbaV07XG5cbiAgICAgICAgICAgICAgICAvLyBLZXl3b3JkIGFyZ3VtZW50cyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgYXNcbiAgICAgICAgICAgICAgICAvLyBwb3NpdGlvbmFsIGFyZ3VtZW50cywgaS5lLiB0aGUgY2FsbGVyIGV4cGxpY2l0bHlcbiAgICAgICAgICAgICAgICAvLyB1c2VkIHRoZSBuYW1lIG9mIGEgcG9zaXRpb25hbCBhcmdcbiAgICAgICAgICAgICAgICBhcmdzLnB1c2goa3dhcmdzW2FyZ10pO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBrd2FyZ3NbYXJnXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXJncy5wdXNoKGt3YXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZ1bmMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcbn1cblxuZnVuY3Rpb24gbWFrZUtleXdvcmRBcmdzKG9iaikge1xuICAgIG9iai5fX2tleXdvcmRzID0gdHJ1ZTtcbiAgICByZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiBnZXRLZXl3b3JkQXJncyhhcmdzKSB7XG4gICAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICAgIGlmKGxlbikge1xuICAgICAgICB2YXIgbGFzdEFyZyA9IGFyZ3NbbGVuIC0gMV07XG4gICAgICAgIGlmKGxhc3RBcmcgJiYgbGFzdEFyZy5oYXNPd25Qcm9wZXJ0eSgnX19rZXl3b3JkcycpKSB7XG4gICAgICAgICAgICByZXR1cm4gbGFzdEFyZztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge307XG59XG5cbmZ1bmN0aW9uIG51bUFyZ3MoYXJncykge1xuICAgIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgICBpZihsZW4gPT09IDApIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgdmFyIGxhc3RBcmcgPSBhcmdzW2xlbiAtIDFdO1xuICAgIGlmKGxhc3RBcmcgJiYgbGFzdEFyZy5oYXNPd25Qcm9wZXJ0eSgnX19rZXl3b3JkcycpKSB7XG4gICAgICAgIHJldHVybiBsZW4gLSAxO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGxlbjtcbiAgICB9XG59XG5cbi8vIEEgU2FmZVN0cmluZyBvYmplY3QgaW5kaWNhdGVzIHRoYXQgdGhlIHN0cmluZyBzaG91bGQgbm90IGJlXG4vLyBhdXRvZXNjYXBlZC4gVGhpcyBoYXBwZW5zIG1hZ2ljYWxseSBiZWNhdXNlIGF1dG9lc2NhcGluZyBvbmx5XG4vLyBvY2N1cnMgb24gcHJpbWl0aXZlIHN0cmluZyBvYmplY3RzLlxuZnVuY3Rpb24gU2FmZVN0cmluZyh2YWwpIHtcbiAgICBpZih0eXBlb2YgdmFsICE9PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cblxuICAgIHRoaXMudmFsID0gdmFsO1xufVxuXG5TYWZlU3RyaW5nLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoU3RyaW5nLnByb3RvdHlwZSk7XG5TYWZlU3RyaW5nLnByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsO1xufTtcblNhZmVTdHJpbmcucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsO1xufTtcblxuZnVuY3Rpb24gY29weVNhZmVuZXNzKGRlc3QsIHRhcmdldCkge1xuICAgIGlmKGRlc3QgaW5zdGFuY2VvZiBTYWZlU3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBuZXcgU2FmZVN0cmluZyh0YXJnZXQpO1xuICAgIH1cbiAgICByZXR1cm4gdGFyZ2V0LnRvU3RyaW5nKCk7XG59XG5cbmZ1bmN0aW9uIG1hcmtTYWZlKHZhbCkge1xuICAgIHZhciB0eXBlID0gdHlwZW9mIHZhbDtcblxuICAgIGlmKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJldHVybiBuZXcgU2FmZVN0cmluZyh2YWwpO1xuICAgIH1cbiAgICBlbHNlIGlmKHR5cGUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciByZXQgPSB2YWwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgICAgICAgICAgaWYodHlwZW9mIHJldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFNhZmVTdHJpbmcocmV0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHN1cHByZXNzVmFsdWUodmFsLCBhdXRvZXNjYXBlKSB7XG4gICAgdmFsID0gKHZhbCAhPT0gdW5kZWZpbmVkICYmIHZhbCAhPT0gbnVsbCkgPyB2YWwgOiAnJztcblxuICAgIGlmKGF1dG9lc2NhcGUgJiYgdHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdmFsID0gbGliLmVzY2FwZSh2YWwpO1xuICAgIH1cblxuICAgIHJldHVybiB2YWw7XG59XG5cbmZ1bmN0aW9uIG1lbWJlckxvb2t1cChvYmosIHZhbCkge1xuICAgIG9iaiA9IG9iaiB8fCB7fTtcblxuICAgIGlmKHR5cGVvZiBvYmpbdmFsXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqW3ZhbF0uYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBvYmpbdmFsXTtcbn1cblxuZnVuY3Rpb24gY2FsbFdyYXAob2JqLCBuYW1lLCBhcmdzKSB7XG4gICAgaWYoIW9iaikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjYWxsIGAnICsgbmFtZSArICdgLCB3aGljaCBpcyB1bmRlZmluZWQgb3IgZmFsc2V5Jyk7XG4gICAgfVxuICAgIGVsc2UgaWYodHlwZW9mIG9iaiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBjYWxsIGAnICsgbmFtZSArICdgLCB3aGljaCBpcyBub3QgYSBmdW5jdGlvbicpO1xuICAgIH1cblxuICAgIHJldHVybiBvYmouYXBwbHkodGhpcywgYXJncyk7XG59XG5cbmZ1bmN0aW9uIGNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBuYW1lKSB7XG4gICAgdmFyIHZhbCA9IGZyYW1lLmxvb2t1cChuYW1lKTtcbiAgICByZXR1cm4gKHZhbCAhPT0gdW5kZWZpbmVkICYmIHZhbCAhPT0gbnVsbCkgP1xuICAgICAgICB2YWwgOlxuICAgICAgICBjb250ZXh0Lmxvb2t1cChuYW1lKTtcbn1cblxuZnVuY3Rpb24gaGFuZGxlRXJyb3IoZXJyb3IsIGxpbmVubywgY29sbm8pIHtcbiAgICBpZihlcnJvci5saW5lbm8pIHtcbiAgICAgICAgcmV0dXJuIGVycm9yO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBsaWIuVGVtcGxhdGVFcnJvcihlcnJvciwgbGluZW5vLCBjb2xubyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhc3luY0VhY2goYXJyLCBkaW1lbiwgaXRlciwgY2IpIHtcbiAgICBpZihsaWIuaXNBcnJheShhcnIpKSB7XG4gICAgICAgIHZhciBsZW4gPSBhcnIubGVuZ3RoO1xuXG4gICAgICAgIGxpYi5hc3luY0l0ZXIoYXJyLCBmdW5jdGlvbihpdGVtLCBpLCBuZXh0KSB7XG4gICAgICAgICAgICBzd2l0Y2goZGltZW4pIHtcbiAgICAgICAgICAgIGNhc2UgMTogaXRlcihpdGVtLCBpLCBsZW4sIG5leHQpOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjogaXRlcihpdGVtWzBdLCBpdGVtWzFdLCBpLCBsZW4sIG5leHQpOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzogaXRlcihpdGVtWzBdLCBpdGVtWzFdLCBpdGVtWzJdLCBpLCBsZW4sIG5leHQpOyBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgaXRlbS5wdXNoKGksIG5leHQpO1xuICAgICAgICAgICAgICAgIGl0ZXIuYXBwbHkodGhpcywgaXRlbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIGNiKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGxpYi5hc3luY0ZvcihhcnIsIGZ1bmN0aW9uKGtleSwgdmFsLCBpLCBsZW4sIG5leHQpIHtcbiAgICAgICAgICAgIGl0ZXIoa2V5LCB2YWwsIGksIGxlbiwgbmV4dCk7XG4gICAgICAgIH0sIGNiKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFzeW5jQWxsKGFyciwgZGltZW4sIGZ1bmMsIGNiKSB7XG4gICAgdmFyIGZpbmlzaGVkID0gMDtcbiAgICB2YXIgbGVuO1xuICAgIHZhciBvdXRwdXRBcnI7XG5cbiAgICBmdW5jdGlvbiBkb25lKGksIG91dHB1dCkge1xuICAgICAgICBmaW5pc2hlZCsrO1xuICAgICAgICBvdXRwdXRBcnJbaV0gPSBvdXRwdXQ7XG5cbiAgICAgICAgaWYoZmluaXNoZWQgPT09IGxlbikge1xuICAgICAgICAgICAgY2IobnVsbCwgb3V0cHV0QXJyLmpvaW4oJycpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmKGxpYi5pc0FycmF5KGFycikpIHtcbiAgICAgICAgbGVuID0gYXJyLmxlbmd0aDtcbiAgICAgICAgb3V0cHV0QXJyID0gbmV3IEFycmF5KGxlbik7XG5cbiAgICAgICAgaWYobGVuID09PSAwKSB7XG4gICAgICAgICAgICBjYihudWxsLCAnJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgaXRlbSA9IGFycltpXTtcblxuICAgICAgICAgICAgICAgIHN3aXRjaChkaW1lbikge1xuICAgICAgICAgICAgICAgIGNhc2UgMTogZnVuYyhpdGVtLCBpLCBsZW4sIGRvbmUpOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDI6IGZ1bmMoaXRlbVswXSwgaXRlbVsxXSwgaSwgbGVuLCBkb25lKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzOiBmdW5jKGl0ZW1bMF0sIGl0ZW1bMV0sIGl0ZW1bMl0sIGksIGxlbiwgZG9uZSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0ucHVzaChpLCBkb25lKTtcbiAgICAgICAgICAgICAgICAgICAgZnVuYy5hcHBseSh0aGlzLCBpdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHZhciBrZXlzID0gbGliLmtleXMoYXJyKTtcbiAgICAgICAgbGVuID0ga2V5cy5sZW5ndGg7XG4gICAgICAgIG91dHB1dEFyciA9IG5ldyBBcnJheShsZW4pO1xuXG4gICAgICAgIGlmKGxlbiA9PT0gMCkge1xuICAgICAgICAgICAgY2IobnVsbCwgJycpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yKHZhciBpPTA7IGk8a2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBrID0ga2V5c1tpXTtcbiAgICAgICAgICAgICAgICBmdW5jKGssIGFycltrXSwgaSwgbGVuLCBkb25lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlc1sncnVudGltZSddID0ge1xuICAgIEZyYW1lOiBGcmFtZSxcbiAgICBtYWtlTWFjcm86IG1ha2VNYWNybyxcbiAgICBtYWtlS2V5d29yZEFyZ3M6IG1ha2VLZXl3b3JkQXJncyxcbiAgICBudW1BcmdzOiBudW1BcmdzLFxuICAgIHN1cHByZXNzVmFsdWU6IHN1cHByZXNzVmFsdWUsXG4gICAgbWVtYmVyTG9va3VwOiBtZW1iZXJMb29rdXAsXG4gICAgY29udGV4dE9yRnJhbWVMb29rdXA6IGNvbnRleHRPckZyYW1lTG9va3VwLFxuICAgIGNhbGxXcmFwOiBjYWxsV3JhcCxcbiAgICBoYW5kbGVFcnJvcjogaGFuZGxlRXJyb3IsXG4gICAgaXNBcnJheTogbGliLmlzQXJyYXksXG4gICAga2V5czogbGliLmtleXMsXG4gICAgU2FmZVN0cmluZzogU2FmZVN0cmluZyxcbiAgICBjb3B5U2FmZW5lc3M6IGNvcHlTYWZlbmVzcyxcbiAgICBtYXJrU2FmZTogbWFya1NhZmUsXG4gICAgYXN5bmNFYWNoOiBhc3luY0VhY2gsXG4gICAgYXN5bmNBbGw6IGFzeW5jQWxsXG59O1xufSkoKTtcbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0JztcblxudmFyIHBhdGggPSBtb2R1bGVzW1wicGF0aFwiXTtcbnZhciBPYmogPSBtb2R1bGVzW1wib2JqZWN0XCJdO1xudmFyIGxpYiA9IG1vZHVsZXNbXCJsaWJcIl07XG5cbnZhciBMb2FkZXIgPSBPYmouZXh0ZW5kKHtcbiAgICBvbjogZnVuY3Rpb24obmFtZSwgZnVuYykge1xuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzIHx8IHt9O1xuICAgICAgICB0aGlzLmxpc3RlbmVyc1tuYW1lXSA9IHRoaXMubGlzdGVuZXJzW25hbWVdIHx8IFtdO1xuICAgICAgICB0aGlzLmxpc3RlbmVyc1tuYW1lXS5wdXNoKGZ1bmMpO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihuYW1lIC8qLCBhcmcxLCBhcmcyLCAuLi4qLykge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICAgICAgaWYodGhpcy5saXN0ZW5lcnMgJiYgdGhpcy5saXN0ZW5lcnNbbmFtZV0pIHtcbiAgICAgICAgICAgIGxpYi5lYWNoKHRoaXMubGlzdGVuZXJzW25hbWVdLCBmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzb2x2ZTogZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgICAgICAgcmV0dXJuIHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoZnJvbSksIHRvKTtcbiAgICB9LFxuXG4gICAgaXNSZWxhdGl2ZTogZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgICAgICAgcmV0dXJuIChmaWxlbmFtZS5pbmRleE9mKCcuLycpID09PSAwIHx8IGZpbGVuYW1lLmluZGV4T2YoJy4uLycpID09PSAwKTtcbiAgICB9XG59KTtcblxubW9kdWxlc1snbG9hZGVyJ10gPSBMb2FkZXI7XG59KSgpO1xuKGZ1bmN0aW9uKCkge1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgTG9hZGVyID0gbW9kdWxlc1tcImxvYWRlclwiXTtcblxudmFyIFdlYkxvYWRlciA9IExvYWRlci5leHRlbmQoe1xuICAgIGluaXQ6IGZ1bmN0aW9uKGJhc2VVUkwsIG5ldmVyVXBkYXRlKSB7XG4gICAgICAgIC8vIEl0J3MgZWFzeSB0byB1c2UgcHJlY29tcGlsZWQgdGVtcGxhdGVzOiBqdXN0IGluY2x1ZGUgdGhlbVxuICAgICAgICAvLyBiZWZvcmUgeW91IGNvbmZpZ3VyZSBudW5qdWNrcyBhbmQgdGhpcyB3aWxsIGF1dG9tYXRpY2FsbHlcbiAgICAgICAgLy8gcGljayBpdCB1cCBhbmQgdXNlIGl0XG4gICAgICAgIHRoaXMucHJlY29tcGlsZWQgPSB3aW5kb3cubnVuanVja3NQcmVjb21waWxlZCB8fCB7fTtcblxuICAgICAgICB0aGlzLmJhc2VVUkwgPSBiYXNlVVJMIHx8ICcnO1xuICAgICAgICB0aGlzLm5ldmVyVXBkYXRlID0gbmV2ZXJVcGRhdGU7XG4gICAgfSxcblxuICAgIGdldFNvdXJjZTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBpZih0aGlzLnByZWNvbXBpbGVkW25hbWVdKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHNyYzogeyB0eXBlOiAnY29kZScsXG4gICAgICAgICAgICAgICAgICAgICAgIG9iajogdGhpcy5wcmVjb21waWxlZFtuYW1lXSB9LFxuICAgICAgICAgICAgICAgIHBhdGg6IG5hbWVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgc3JjID0gdGhpcy5mZXRjaCh0aGlzLmJhc2VVUkwgKyAnLycgKyBuYW1lKTtcbiAgICAgICAgICAgIGlmKCFzcmMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHsgc3JjOiBzcmMsXG4gICAgICAgICAgICAgICAgICAgICBwYXRoOiBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgbm9DYWNoZTogIXRoaXMubmV2ZXJVcGRhdGUgfTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBmZXRjaDogZnVuY3Rpb24odXJsLCBjYWxsYmFjaykge1xuICAgICAgICAvLyBPbmx5IGluIHRoZSBicm93c2VyIHBsZWFzZVxuICAgICAgICB2YXIgYWpheDtcbiAgICAgICAgdmFyIGxvYWRpbmcgPSB0cnVlO1xuICAgICAgICB2YXIgc3JjO1xuXG4gICAgICAgIGlmKHdpbmRvdy5YTUxIdHRwUmVxdWVzdCkgeyAvLyBNb3ppbGxhLCBTYWZhcmksIC4uLlxuICAgICAgICAgICAgYWpheCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYod2luZG93LkFjdGl2ZVhPYmplY3QpIHsgLy8gSUUgOCBhbmQgb2xkZXJcbiAgICAgICAgICAgIGFqYXggPSBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFqYXgub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZihhamF4LnJlYWR5U3RhdGUgPT09IDQgJiYgKGFqYXguc3RhdHVzID09PSAwIHx8IGFqYXguc3RhdHVzID09PSAyMDApICYmIGxvYWRpbmcpIHtcbiAgICAgICAgICAgICAgICBsb2FkaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgc3JjID0gYWpheC5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdXJsICs9ICh1cmwuaW5kZXhPZignPycpID09PSAtMSA/ICc/JyA6ICcmJykgKyAncz0nICtcbiAgICAgICAgICAgICAgIChuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG5cbiAgICAgICAgLy8gU3luY2hyb25vdXMgYmVjYXVzZSB0aGlzIEFQSSBzaG91bGRuJ3QgYmUgdXNlZCBpblxuICAgICAgICAvLyBwcm9kdWN0aW9uIChwcmUtbG9hZCBjb21waWxlZCB0ZW1wbGF0ZXMgaW5zdGVhZClcbiAgICAgICAgYWpheC5vcGVuKCdHRVQnLCB1cmwsIGZhbHNlKTtcbiAgICAgICAgYWpheC5zZW5kKCk7XG5cbiAgICAgICAgcmV0dXJuIHNyYztcbiAgICB9XG59KTtcblxubW9kdWxlc1snd2ViLWxvYWRlcnMnXSA9IHtcbiAgICBXZWJMb2FkZXI6IFdlYkxvYWRlclxufTtcbn0pKCk7XG4oZnVuY3Rpb24oKSB7XG5pZih0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyB8fCB3aW5kb3cgIT09IHRoaXMpIHtcbiAgICBtb2R1bGVzWydsb2FkZXJzJ10gPSBtb2R1bGVzW1wibm9kZS1sb2FkZXJzXCJdO1xufVxuZWxzZSB7XG4gICAgbW9kdWxlc1snbG9hZGVycyddID0gbW9kdWxlc1tcIndlYi1sb2FkZXJzXCJdO1xufVxufSkoKTtcbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0JztcblxudmFyIGxpYiA9IG1vZHVsZXNbXCJsaWJcIl07XG52YXIgciA9IG1vZHVsZXNbXCJydW50aW1lXCJdO1xuXG52YXIgZmlsdGVycyA9IHtcbiAgICBhYnM6IGZ1bmN0aW9uKG4pIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYWJzKG4pO1xuICAgIH0sXG5cbiAgICBiYXRjaDogZnVuY3Rpb24oYXJyLCBsaW5lY291bnQsIGZpbGxfd2l0aCkge1xuICAgICAgICB2YXIgcmVzID0gW107XG4gICAgICAgIHZhciB0bXAgPSBbXTtcblxuICAgICAgICBmb3IodmFyIGk9MDsgaTxhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmKGkgJSBsaW5lY291bnQgPT09IDAgJiYgdG1wLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJlcy5wdXNoKHRtcCk7XG4gICAgICAgICAgICAgICAgdG1wID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRtcC5wdXNoKGFycltpXSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZih0bXAubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZihmaWxsX3dpdGgpIHtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGk9dG1wLmxlbmd0aDsgaTxsaW5lY291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0bXAucHVzaChmaWxsX3dpdGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVzLnB1c2godG1wKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIGNhcGl0YWxpemU6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICB2YXIgcmV0ID0gc3RyLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHJldC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHJldC5zbGljZSgxKSk7XG4gICAgfSxcblxuICAgIGNlbnRlcjogZnVuY3Rpb24oc3RyLCB3aWR0aCkge1xuICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IDgwO1xuXG4gICAgICAgIGlmKHN0ci5sZW5ndGggPj0gd2lkdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3BhY2VzID0gd2lkdGggLSBzdHIubGVuZ3RoO1xuICAgICAgICB2YXIgcHJlID0gbGliLnJlcGVhdCgnICcsIHNwYWNlcy8yIC0gc3BhY2VzICUgMik7XG4gICAgICAgIHZhciBwb3N0ID0gbGliLnJlcGVhdCgnICcsIHNwYWNlcy8yKTtcbiAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcHJlICsgc3RyICsgcG9zdCk7XG4gICAgfSxcblxuICAgICdkZWZhdWx0JzogZnVuY3Rpb24odmFsLCBkZWYpIHtcbiAgICAgICAgcmV0dXJuIHZhbCA/IHZhbCA6IGRlZjtcbiAgICB9LFxuXG4gICAgZGljdHNvcnQ6IGZ1bmN0aW9uKHZhbCwgY2FzZV9zZW5zaXRpdmUsIGJ5KSB7XG4gICAgICAgIGlmICghbGliLmlzT2JqZWN0KHZhbCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcignZGljdHNvcnQgZmlsdGVyOiB2YWwgbXVzdCBiZSBhbiBvYmplY3QnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhcnJheSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrIGluIHZhbCkge1xuICAgICAgICAgICAgLy8gZGVsaWJlcmF0ZWx5IGluY2x1ZGUgcHJvcGVydGllcyBmcm9tIHRoZSBvYmplY3QncyBwcm90b3R5cGVcbiAgICAgICAgICAgIGFycmF5LnB1c2goW2ssdmFsW2tdXSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2k7XG4gICAgICAgIGlmIChieSA9PT0gdW5kZWZpbmVkIHx8IGJ5ID09PSAna2V5Jykge1xuICAgICAgICAgICAgc2kgPSAwO1xuICAgICAgICB9IGVsc2UgaWYgKGJ5ID09PSAndmFsdWUnKSB7XG4gICAgICAgICAgICBzaSA9IDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoXG4gICAgICAgICAgICAgICAgJ2RpY3Rzb3J0IGZpbHRlcjogWW91IGNhbiBvbmx5IHNvcnQgYnkgZWl0aGVyIGtleSBvciB2YWx1ZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJyYXkuc29ydChmdW5jdGlvbih0MSwgdDIpIHtcbiAgICAgICAgICAgIHZhciBhID0gdDFbc2ldO1xuICAgICAgICAgICAgdmFyIGIgPSB0MltzaV07XG5cbiAgICAgICAgICAgIGlmICghY2FzZV9zZW5zaXRpdmUpIHtcbiAgICAgICAgICAgICAgICBpZiAobGliLmlzU3RyaW5nKGEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGEgPSBhLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsaWIuaXNTdHJpbmcoYikpIHtcbiAgICAgICAgICAgICAgICAgICAgYiA9IGIudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhID4gYiA/IDEgOiAoYSA9PT0gYiA/IDAgOiAtMSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBhcnJheTtcbiAgICB9LFxuXG4gICAgZXNjYXBlOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgaWYodHlwZW9mIHN0ciA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgICAgc3RyIGluc3RhbmNlb2Ygci5TYWZlU3RyaW5nKSB7XG4gICAgICAgICAgICByZXR1cm4gbGliLmVzY2FwZShzdHIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfSxcblxuICAgIHNhZmU6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICByZXR1cm4gci5tYXJrU2FmZShzdHIpO1xuICAgIH0sXG5cbiAgICBmaXJzdDogZnVuY3Rpb24oYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbMF07XG4gICAgfSxcblxuICAgIGdyb3VwYnk6IGZ1bmN0aW9uKGFyciwgYXR0cikge1xuICAgICAgICByZXR1cm4gbGliLmdyb3VwQnkoYXJyLCBhdHRyKTtcbiAgICB9LFxuXG4gICAgaW5kZW50OiBmdW5jdGlvbihzdHIsIHdpZHRoLCBpbmRlbnRmaXJzdCkge1xuICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IDQ7XG4gICAgICAgIHZhciByZXMgPSAnJztcbiAgICAgICAgdmFyIGxpbmVzID0gc3RyLnNwbGl0KCdcXG4nKTtcbiAgICAgICAgdmFyIHNwID0gbGliLnJlcGVhdCgnICcsIHdpZHRoKTtcblxuICAgICAgICBmb3IodmFyIGk9MDsgaTxsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoaSA9PT0gMCAmJiAhaW5kZW50Zmlyc3QpIHtcbiAgICAgICAgICAgICAgICByZXMgKz0gbGluZXNbaV0gKyAnXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlcyArPSBzcCArIGxpbmVzW2ldICsgJ1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCByZXMpO1xuICAgIH0sXG5cbiAgICBqb2luOiBmdW5jdGlvbihhcnIsIGRlbCwgYXR0cikge1xuICAgICAgICBkZWwgPSBkZWwgfHwgJyc7XG5cbiAgICAgICAgaWYoYXR0cikge1xuICAgICAgICAgICAgYXJyID0gbGliLm1hcChhcnIsIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdlthdHRyXTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFyci5qb2luKGRlbCk7XG4gICAgfSxcblxuICAgIGxhc3Q6IGZ1bmN0aW9uKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW2Fyci5sZW5ndGgtMV07XG4gICAgfSxcblxuICAgIGxlbmd0aDogZnVuY3Rpb24oYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnIgIT09IHVuZGVmaW5lZCA/IGFyci5sZW5ndGggOiAwO1xuICAgIH0sXG5cbiAgICBsaXN0OiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgaWYobGliLmlzU3RyaW5nKHZhbCkpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWwuc3BsaXQoJycpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYobGliLmlzT2JqZWN0KHZhbCkpIHtcbiAgICAgICAgICAgIHZhciBrZXlzID0gW107XG5cbiAgICAgICAgICAgIGlmKE9iamVjdC5rZXlzKSB7XG4gICAgICAgICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKHZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IodmFyIGsgaW4gdmFsKSB7XG4gICAgICAgICAgICAgICAgICAgIGtleXMucHVzaChrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBsaWIubWFwKGtleXMsIGZ1bmN0aW9uKGspIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBrZXk6IGssXG4gICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbFtrXSB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihsaWIuaXNBcnJheSh2YWwpKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBsaWIuVGVtcGxhdGVFcnJvcignbGlzdCBmaWx0ZXI6IHR5cGUgbm90IGl0ZXJhYmxlJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbG93ZXI6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICByZXR1cm4gc3RyLnRvTG93ZXJDYXNlKCk7XG4gICAgfSxcblxuICAgIHJhbmRvbTogZnVuY3Rpb24oYXJyKSB7XG4gICAgICAgIHJldHVybiBhcnJbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogYXJyLmxlbmd0aCldO1xuICAgIH0sXG5cbiAgICByZWplY3RhdHRyOiBmdW5jdGlvbihhcnIsIGF0dHIpIHtcbiAgICAgIHJldHVybiBhcnIuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHJldHVybiAhaXRlbVthdHRyXTtcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBzZWxlY3RhdHRyOiBmdW5jdGlvbihhcnIsIGF0dHIpIHtcbiAgICAgIHJldHVybiBhcnIuZmlsdGVyKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHJldHVybiAhIWl0ZW1bYXR0cl07XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgcmVwbGFjZTogZnVuY3Rpb24oc3RyLCBvbGQsIG5ld18sIG1heENvdW50KSB7XG4gICAgICAgIGlmIChvbGQgaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZShvbGQsIG5ld18pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlcyA9IHN0cjtcbiAgICAgICAgdmFyIGxhc3QgPSByZXM7XG4gICAgICAgIHZhciBjb3VudCA9IDE7XG4gICAgICAgIHJlcyA9IHJlcy5yZXBsYWNlKG9sZCwgbmV3Xyk7XG5cbiAgICAgICAgd2hpbGUobGFzdCAhPT0gcmVzKSB7XG4gICAgICAgICAgICBpZihjb3VudCA+PSBtYXhDb3VudCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsYXN0ID0gcmVzO1xuICAgICAgICAgICAgcmVzID0gcmVzLnJlcGxhY2Uob2xkLCBuZXdfKTtcbiAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCByZXMpO1xuICAgIH0sXG5cbiAgICByZXZlcnNlOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgdmFyIGFycjtcbiAgICAgICAgaWYobGliLmlzU3RyaW5nKHZhbCkpIHtcbiAgICAgICAgICAgIGFyciA9IGZpbHRlcnMubGlzdCh2YWwpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gQ29weSBpdFxuICAgICAgICAgICAgYXJyID0gbGliLm1hcCh2YWwsIGZ1bmN0aW9uKHYpIHsgcmV0dXJuIHY7IH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJyLnJldmVyc2UoKTtcblxuICAgICAgICBpZihsaWIuaXNTdHJpbmcodmFsKSkge1xuICAgICAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHZhbCwgYXJyLmpvaW4oJycpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH0sXG5cbiAgICByb3VuZDogZnVuY3Rpb24odmFsLCBwcmVjaXNpb24sIG1ldGhvZCkge1xuICAgICAgICBwcmVjaXNpb24gPSBwcmVjaXNpb24gfHwgMDtcbiAgICAgICAgdmFyIGZhY3RvciA9IE1hdGgucG93KDEwLCBwcmVjaXNpb24pO1xuICAgICAgICB2YXIgcm91bmRlcjtcblxuICAgICAgICBpZihtZXRob2QgPT09ICdjZWlsJykge1xuICAgICAgICAgICAgcm91bmRlciA9IE1hdGguY2VpbDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKG1ldGhvZCA9PT0gJ2Zsb29yJykge1xuICAgICAgICAgICAgcm91bmRlciA9IE1hdGguZmxvb3I7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByb3VuZGVyID0gTWF0aC5yb3VuZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByb3VuZGVyKHZhbCAqIGZhY3RvcikgLyBmYWN0b3I7XG4gICAgfSxcblxuICAgIHNsaWNlOiBmdW5jdGlvbihhcnIsIHNsaWNlcywgZmlsbFdpdGgpIHtcbiAgICAgICAgdmFyIHNsaWNlTGVuZ3RoID0gTWF0aC5mbG9vcihhcnIubGVuZ3RoIC8gc2xpY2VzKTtcbiAgICAgICAgdmFyIGV4dHJhID0gYXJyLmxlbmd0aCAlIHNsaWNlcztcbiAgICAgICAgdmFyIG9mZnNldCA9IDA7XG4gICAgICAgIHZhciByZXMgPSBbXTtcblxuICAgICAgICBmb3IodmFyIGk9MDsgaTxzbGljZXM7IGkrKykge1xuICAgICAgICAgICAgdmFyIHN0YXJ0ID0gb2Zmc2V0ICsgaSAqIHNsaWNlTGVuZ3RoO1xuICAgICAgICAgICAgaWYoaSA8IGV4dHJhKSB7XG4gICAgICAgICAgICAgICAgb2Zmc2V0Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZW5kID0gb2Zmc2V0ICsgKGkgKyAxKSAqIHNsaWNlTGVuZ3RoO1xuXG4gICAgICAgICAgICB2YXIgc2xpY2UgPSBhcnIuc2xpY2Uoc3RhcnQsIGVuZCk7XG4gICAgICAgICAgICBpZihmaWxsV2l0aCAmJiBpID49IGV4dHJhKSB7XG4gICAgICAgICAgICAgICAgc2xpY2UucHVzaChmaWxsV2l0aCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMucHVzaChzbGljZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICBzb3J0OiBmdW5jdGlvbihhcnIsIHJldmVyc2UsIGNhc2VTZW5zLCBhdHRyKSB7XG4gICAgICAgIC8vIENvcHkgaXRcbiAgICAgICAgYXJyID0gbGliLm1hcChhcnIsIGZ1bmN0aW9uKHYpIHsgcmV0dXJuIHY7IH0pO1xuXG4gICAgICAgIGFyci5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHZhciB4LCB5O1xuXG4gICAgICAgICAgICBpZihhdHRyKSB7XG4gICAgICAgICAgICAgICAgeCA9IGFbYXR0cl07XG4gICAgICAgICAgICAgICAgeSA9IGJbYXR0cl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB4ID0gYTtcbiAgICAgICAgICAgICAgICB5ID0gYjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoIWNhc2VTZW5zICYmIGxpYi5pc1N0cmluZyh4KSAmJiBsaWIuaXNTdHJpbmcoeSkpIHtcbiAgICAgICAgICAgICAgICB4ID0geC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIHkgPSB5LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHggPCB5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldmVyc2UgPyAxIDogLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKHggPiB5KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldmVyc2UgPyAtMTogMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH0sXG5cbiAgICBzdHJpbmc6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Mob2JqLCBvYmopO1xuICAgIH0sXG5cbiAgICB0aXRsZTogZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgIHZhciB3b3JkcyA9IHN0ci5zcGxpdCgnICcpO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgd29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHdvcmRzW2ldID0gZmlsdGVycy5jYXBpdGFsaXplKHdvcmRzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCB3b3Jkcy5qb2luKCcgJykpO1xuICAgIH0sXG5cbiAgICB0cmltOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgc3RyLnJlcGxhY2UoL15cXHMqfFxccyokL2csICcnKSk7XG4gICAgfSxcblxuICAgIHRydW5jYXRlOiBmdW5jdGlvbihpbnB1dCwgbGVuZ3RoLCBraWxsd29yZHMsIGVuZCkge1xuICAgICAgICB2YXIgb3JpZyA9IGlucHV0O1xuICAgICAgICBsZW5ndGggPSBsZW5ndGggfHwgMjU1O1xuXG4gICAgICAgIGlmIChpbnB1dC5sZW5ndGggPD0gbGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuXG4gICAgICAgIGlmIChraWxsd29yZHMpIHtcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyaW5nKDAsIGxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaWR4ID0gaW5wdXQubGFzdEluZGV4T2YoJyAnLCBsZW5ndGgpO1xuICAgICAgICAgICAgaWYoaWR4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIGlkeCA9IGxlbmd0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaW5wdXQgPSBpbnB1dC5zdWJzdHJpbmcoMCwgaWR4KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlucHV0ICs9IChlbmQgIT09IHVuZGVmaW5lZCAmJiBlbmQgIT09IG51bGwpID8gZW5kIDogJy4uLic7XG4gICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhvcmlnLCBpbnB1dCk7XG4gICAgfSxcblxuICAgIHVwcGVyOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0ci50b1VwcGVyQ2FzZSgpO1xuICAgIH0sXG5cbiAgICB1cmxlbmNvZGU6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICB2YXIgZW5jID0gZW5jb2RlVVJJQ29tcG9uZW50O1xuICAgICAgICBpZiAobGliLmlzU3RyaW5nKG9iaikpIHtcbiAgICAgICAgICAgIHJldHVybiBlbmMob2JqKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBwYXJ0cztcbiAgICAgICAgICAgIGlmIChsaWIuaXNBcnJheShvYmopKSB7XG4gICAgICAgICAgICAgICAgcGFydHMgPSBvYmoubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVuYyhpdGVtWzBdKSArICc9JyArIGVuYyhpdGVtWzFdKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJ0cyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnRzLnB1c2goZW5jKGspICsgJz0nICsgZW5jKG9ialtrXSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oJyYnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICB1cmxpemU6IGZ1bmN0aW9uKHN0ciwgbGVuZ3RoLCBub2ZvbGxvdykge1xuICAgICAgICBpZiAoaXNOYU4obGVuZ3RoKSkgbGVuZ3RoID0gSW5maW5pdHk7XG5cbiAgICAgICAgdmFyIG5vRm9sbG93QXR0ciA9IChub2ZvbGxvdyA9PT0gdHJ1ZSA/ICcgcmVsPVwibm9mb2xsb3dcIicgOiAnJyk7XG5cbiAgICAgICAgLy8gRm9yIHRoZSBqaW5qYSByZWdleHAsIHNlZVxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbWl0c3VoaWtvL2ppbmphMi9ibG9iL2YxNWI4MTRkY2JhNmFhMTJiYzc0ZDFmN2QwYzg4MWQ1NWY3MTI2YmUvamluamEyL3V0aWxzLnB5I0wyMC1MMjNcbiAgICAgICAgdmFyIHB1bmNSRSA9IC9eKD86XFwofDx8Jmx0Oyk/KC4qPykoPzpcXC58LHxcXCl8XFxufCZndDspPyQvO1xuICAgICAgICAvLyBmcm9tIGh0dHA6Ly9ibG9nLmdlcnYubmV0LzIwMTEvMDUvaHRtbDVfZW1haWxfYWRkcmVzc19yZWdleHAvXG4gICAgICAgIHZhciBlbWFpbFJFID0gL15bXFx3LiEjJCUmJyorXFwtXFwvPT9cXF5ge3x9fl0rQFthLXpcXGRcXC1dKyhcXC5bYS16XFxkXFwtXSspKyQvaTtcbiAgICAgICAgdmFyIGh0dHBIdHRwc1JFID0gL15odHRwcz86XFwvXFwvLiokLztcbiAgICAgICAgdmFyIHd3d1JFID0gL153d3dcXC4vO1xuICAgICAgICB2YXIgdGxkUkUgPSAvXFwuKD86b3JnfG5ldHxjb20pKD86XFw6fFxcL3wkKS87XG5cbiAgICAgICAgdmFyIHdvcmRzID0gc3RyLnNwbGl0KC9cXHMrLykuZmlsdGVyKGZ1bmN0aW9uKHdvcmQpIHtcbiAgICAgICAgICAvLyBJZiB0aGUgd29yZCBoYXMgbm8gbGVuZ3RoLCBiYWlsLiBUaGlzIGNhbiBoYXBwZW4gZm9yIHN0ciB3aXRoXG4gICAgICAgICAgLy8gdHJhaWxpbmcgd2hpdGVzcGFjZS5cbiAgICAgICAgICByZXR1cm4gd29yZCAmJiB3b3JkLmxlbmd0aDtcbiAgICAgICAgfSkubWFwKGZ1bmN0aW9uKHdvcmQpIHtcbiAgICAgICAgICB2YXIgbWF0Y2hlcyA9IHdvcmQubWF0Y2gocHVuY1JFKTtcblxuXG4gICAgICAgICAgdmFyIHBvc3NpYmxlVXJsID0gbWF0Y2hlcyAmJiBtYXRjaGVzWzFdIHx8IHdvcmQ7XG5cblxuICAgICAgICAgIC8vIHVybCB0aGF0IHN0YXJ0cyB3aXRoIGh0dHAgb3IgaHR0cHNcbiAgICAgICAgICBpZiAoaHR0cEh0dHBzUkUudGVzdChwb3NzaWJsZVVybCkpXG4gICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCInICsgcG9zc2libGVVcmwgKyAnXCInICsgbm9Gb2xsb3dBdHRyICsgJz4nICsgcG9zc2libGVVcmwuc3Vic3RyKDAsIGxlbmd0aCkgKyAnPC9hPic7XG5cbiAgICAgICAgICAvLyB1cmwgdGhhdCBzdGFydHMgd2l0aCB3d3cuXG4gICAgICAgICAgaWYgKHd3d1JFLnRlc3QocG9zc2libGVVcmwpKVxuICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovLycgKyBwb3NzaWJsZVVybCArICdcIicgKyBub0ZvbGxvd0F0dHIgKyAnPicgKyBwb3NzaWJsZVVybC5zdWJzdHIoMCwgbGVuZ3RoKSArICc8L2E+JztcblxuICAgICAgICAgIC8vIGFuIGVtYWlsIGFkZHJlc3Mgb2YgdGhlIGZvcm0gdXNlcm5hbWVAZG9tYWluLnRsZFxuICAgICAgICAgIGlmIChlbWFpbFJFLnRlc3QocG9zc2libGVVcmwpKVxuICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwibWFpbHRvOicgKyBwb3NzaWJsZVVybCArICdcIj4nICsgcG9zc2libGVVcmwgKyAnPC9hPic7XG5cbiAgICAgICAgICAvLyB1cmwgdGhhdCBlbmRzIGluIC5jb20sIC5vcmcgb3IgLm5ldCB0aGF0IGlzIG5vdCBhbiBlbWFpbCBhZGRyZXNzXG4gICAgICAgICAgaWYgKHRsZFJFLnRlc3QocG9zc2libGVVcmwpKVxuICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovLycgKyBwb3NzaWJsZVVybCArICdcIicgKyBub0ZvbGxvd0F0dHIgKyAnPicgKyBwb3NzaWJsZVVybC5zdWJzdHIoMCwgbGVuZ3RoKSArICc8L2E+JztcblxuICAgICAgICAgIHJldHVybiB3b3JkO1xuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB3b3Jkcy5qb2luKCcgJyk7XG4gICAgfSxcblxuICAgIHdvcmRjb3VudDogZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgIHZhciB3b3JkcyA9IChzdHIpID8gc3RyLm1hdGNoKC9cXHcrL2cpIDogbnVsbDtcbiAgICAgICAgcmV0dXJuICh3b3JkcykgPyB3b3Jkcy5sZW5ndGggOiBudWxsO1xuICAgIH0sXG5cbiAgICAnZmxvYXQnOiBmdW5jdGlvbih2YWwsIGRlZikge1xuICAgICAgICB2YXIgcmVzID0gcGFyc2VGbG9hdCh2YWwpO1xuICAgICAgICByZXR1cm4gaXNOYU4ocmVzKSA/IGRlZiA6IHJlcztcbiAgICB9LFxuXG4gICAgJ2ludCc6IGZ1bmN0aW9uKHZhbCwgZGVmKSB7XG4gICAgICAgIHZhciByZXMgPSBwYXJzZUludCh2YWwsIDEwKTtcbiAgICAgICAgcmV0dXJuIGlzTmFOKHJlcykgPyBkZWYgOiByZXM7XG4gICAgfVxufTtcblxuLy8gQWxpYXNlc1xuZmlsdGVycy5kID0gZmlsdGVyc1snZGVmYXVsdCddO1xuZmlsdGVycy5lID0gZmlsdGVycy5lc2NhcGU7XG5cbm1vZHVsZXNbJ2ZpbHRlcnMnXSA9IGZpbHRlcnM7XG59KSgpO1xuKGZ1bmN0aW9uKCkge1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBjeWNsZXIoaXRlbXMpIHtcbiAgICB2YXIgaW5kZXggPSAtMTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGN1cnJlbnQ6IG51bGwsXG4gICAgICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGluZGV4ID0gLTE7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaW5kZXgrKztcbiAgICAgICAgICAgIGlmKGluZGV4ID49IGl0ZW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGluZGV4ID0gMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gaXRlbXNbaW5kZXhdO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudDtcbiAgICAgICAgfSxcbiAgICB9O1xuXG59XG5cbmZ1bmN0aW9uIGpvaW5lcihzZXApIHtcbiAgICBzZXAgPSBzZXAgfHwgJywnO1xuICAgIHZhciBmaXJzdCA9IHRydWU7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWwgPSBmaXJzdCA/ICcnIDogc2VwO1xuICAgICAgICBmaXJzdCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH07XG59XG5cbnZhciBnbG9iYWxzID0ge1xuICAgIHJhbmdlOiBmdW5jdGlvbihzdGFydCwgc3RvcCwgc3RlcCkge1xuICAgICAgICBpZighc3RvcCkge1xuICAgICAgICAgICAgc3RvcCA9IHN0YXJ0O1xuICAgICAgICAgICAgc3RhcnQgPSAwO1xuICAgICAgICAgICAgc3RlcCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZighc3RlcCkge1xuICAgICAgICAgICAgc3RlcCA9IDE7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXJyID0gW107XG4gICAgICAgIGZvcih2YXIgaT1zdGFydDsgaTxzdG9wOyBpKz1zdGVwKSB7XG4gICAgICAgICAgICBhcnIucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH0sXG5cbiAgICAvLyBsaXBzdW06IGZ1bmN0aW9uKG4sIGh0bWwsIG1pbiwgbWF4KSB7XG4gICAgLy8gfSxcblxuICAgIGN5Y2xlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBjeWNsZXIoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSk7XG4gICAgfSxcblxuICAgIGpvaW5lcjogZnVuY3Rpb24oc2VwKSB7XG4gICAgICAgIHJldHVybiBqb2luZXIoc2VwKTtcbiAgICB9XG59XG5cbm1vZHVsZXNbJ2dsb2JhbHMnXSA9IGdsb2JhbHM7XG59KSgpO1xuKGZ1bmN0aW9uKCkge1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgcGF0aCA9IG1vZHVsZXNbXCJwYXRoXCJdO1xudmFyIGxpYiA9IG1vZHVsZXNbXCJsaWJcIl07XG52YXIgT2JqID0gbW9kdWxlc1tcIm9iamVjdFwiXTtcbnZhciBsZXhlciA9IG1vZHVsZXNbXCJsZXhlclwiXTtcbnZhciBjb21waWxlciA9IG1vZHVsZXNbXCJjb21waWxlclwiXTtcbnZhciBidWlsdGluX2ZpbHRlcnMgPSBtb2R1bGVzW1wiZmlsdGVyc1wiXTtcbnZhciBidWlsdGluX2xvYWRlcnMgPSBtb2R1bGVzW1wibG9hZGVyc1wiXTtcbnZhciBydW50aW1lID0gbW9kdWxlc1tcInJ1bnRpbWVcIl07XG52YXIgZ2xvYmFscyA9IG1vZHVsZXNbXCJnbG9iYWxzXCJdO1xudmFyIEZyYW1lID0gcnVudGltZS5GcmFtZTtcblxudmFyIEVudmlyb25tZW50ID0gT2JqLmV4dGVuZCh7XG4gICAgaW5pdDogZnVuY3Rpb24obG9hZGVycywgb3B0cykge1xuICAgICAgICAvLyBUaGUgZGV2IGZsYWcgZGV0ZXJtaW5lcyB0aGUgdHJhY2UgdGhhdCdsbCBiZSBzaG93biBvbiBlcnJvcnMuXG4gICAgICAgIC8vIElmIHNldCB0byB0cnVlLCByZXR1cm5zIHRoZSBmdWxsIHRyYWNlIGZyb20gdGhlIGVycm9yIHBvaW50LFxuICAgICAgICAvLyBvdGhlcndpc2Ugd2lsbCByZXR1cm4gdHJhY2Ugc3RhcnRpbmcgZnJvbSBUZW1wbGF0ZS5yZW5kZXJcbiAgICAgICAgLy8gKHRoZSBmdWxsIHRyYWNlIGZyb20gd2l0aGluIG51bmp1Y2tzIG1heSBjb25mdXNlIGRldmVsb3BlcnMgdXNpbmdcbiAgICAgICAgLy8gIHRoZSBsaWJyYXJ5KVxuICAgICAgICAvLyBkZWZhdWx0cyB0byBmYWxzZVxuICAgICAgICB2YXIgb3B0cyA9IHRoaXMub3B0cyA9IG9wdHMgfHwge307XG4gICAgICAgIHRoaXMub3B0cy5kZXYgPSAhIW9wdHMuZGV2O1xuXG4gICAgICAgIC8vIFRoZSBhdXRvZXNjYXBlIGZsYWcgc2V0cyBnbG9iYWwgYXV0b2VzY2FwaW5nLiBJZiB0cnVlLFxuICAgICAgICAvLyBldmVyeSBzdHJpbmcgdmFyaWFibGUgd2lsbCBiZSBlc2NhcGVkIGJ5IGRlZmF1bHQuXG4gICAgICAgIC8vIElmIGZhbHNlLCBzdHJpbmdzIGNhbiBiZSBtYW51YWxseSBlc2NhcGVkIHVzaW5nIHRoZSBgZXNjYXBlYCBmaWx0ZXIuXG4gICAgICAgIC8vIGRlZmF1bHRzIHRvIGZhbHNlXG4gICAgICAgIHRoaXMub3B0cy5hdXRvZXNjYXBlID0gISFvcHRzLmF1dG9lc2NhcGU7XG5cbiAgICAgICAgdGhpcy5vcHRzLnRyaW1CbG9ja3MgPSAhIW9wdHMudHJpbUJsb2NrcztcblxuICAgICAgICB0aGlzLm9wdHMubHN0cmlwQmxvY2tzID0gISFvcHRzLmxzdHJpcEJsb2NrcztcblxuICAgICAgICBpZighbG9hZGVycykge1xuICAgICAgICAgICAgLy8gVGhlIGZpbGVzeXN0ZW0gbG9hZGVyIGlzIG9ubHkgYXZhaWxhYmxlIGNsaWVudC1zaWRlXG4gICAgICAgICAgICBpZihidWlsdGluX2xvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcikge1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGVycyA9IFtuZXcgYnVpbHRpbl9sb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIoJ3ZpZXdzJyldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkZXJzID0gW25ldyBidWlsdGluX2xvYWRlcnMuV2ViTG9hZGVyKCcvdmlld3MnKV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmxvYWRlcnMgPSBsaWIuaXNBcnJheShsb2FkZXJzKSA/IGxvYWRlcnMgOiBbbG9hZGVyc107XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmluaXRDYWNoZSgpO1xuICAgICAgICB0aGlzLmZpbHRlcnMgPSB7fTtcbiAgICAgICAgdGhpcy5hc3luY0ZpbHRlcnMgPSBbXTtcbiAgICAgICAgdGhpcy5leHRlbnNpb25zID0ge307XG4gICAgICAgIHRoaXMuZXh0ZW5zaW9uc0xpc3QgPSBbXTtcblxuICAgICAgICBmb3IodmFyIG5hbWUgaW4gYnVpbHRpbl9maWx0ZXJzKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEZpbHRlcihuYW1lLCBidWlsdGluX2ZpbHRlcnNbbmFtZV0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGluaXRDYWNoZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIENhY2hpbmcgYW5kIGNhY2hlIGJ1c3RpbmdcbiAgICAgICAgbGliLmVhY2godGhpcy5sb2FkZXJzLCBmdW5jdGlvbihsb2FkZXIpIHtcbiAgICAgICAgICAgIGxvYWRlci5jYWNoZSA9IHt9O1xuXG4gICAgICAgICAgICBpZih0eXBlb2YgbG9hZGVyLm9uID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgbG9hZGVyLm9uKCd1cGRhdGUnLCBmdW5jdGlvbih0ZW1wbGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBsb2FkZXIuY2FjaGVbdGVtcGxhdGVdID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGFkZEV4dGVuc2lvbjogZnVuY3Rpb24obmFtZSwgZXh0ZW5zaW9uKSB7XG4gICAgICAgIGV4dGVuc2lvbi5fbmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuZXh0ZW5zaW9uc1tuYW1lXSA9IGV4dGVuc2lvbjtcbiAgICAgICAgdGhpcy5leHRlbnNpb25zTGlzdC5wdXNoKGV4dGVuc2lvbik7XG4gICAgfSxcblxuICAgIGdldEV4dGVuc2lvbjogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5leHRlbnNpb25zW25hbWVdO1xuICAgIH0sXG5cbiAgICBhZGRHbG9iYWw6IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIGdsb2JhbHNbbmFtZV0gPSB2YWx1ZTtcbiAgICB9LFxuXG4gICAgYWRkRmlsdGVyOiBmdW5jdGlvbihuYW1lLCBmdW5jLCBhc3luYykge1xuICAgICAgICB2YXIgd3JhcHBlZCA9IGZ1bmM7XG5cbiAgICAgICAgaWYoYXN5bmMpIHtcbiAgICAgICAgICAgIHRoaXMuYXN5bmNGaWx0ZXJzLnB1c2gobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maWx0ZXJzW25hbWVdID0gd3JhcHBlZDtcbiAgICB9LFxuXG4gICAgZ2V0RmlsdGVyOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIGlmKCF0aGlzLmZpbHRlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZmlsdGVyIG5vdCBmb3VuZDogJyArIG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcnNbbmFtZV07XG4gICAgfSxcblxuICAgIHJlc29sdmVUZW1wbGF0ZTogZnVuY3Rpb24obG9hZGVyLCBwYXJlbnROYW1lLCBmaWxlbmFtZSkge1xuICAgICAgICB2YXIgaXNSZWxhdGl2ZSA9IChsb2FkZXIuaXNSZWxhdGl2ZSAmJiBwYXJlbnROYW1lKT8gbG9hZGVyLmlzUmVsYXRpdmUoZmlsZW5hbWUpIDogZmFsc2U7XG4gICAgICAgIHJldHVybiAoaXNSZWxhdGl2ZSAmJiBsb2FkZXIucmVzb2x2ZSk/IGxvYWRlci5yZXNvbHZlKHBhcmVudE5hbWUsIGZpbGVuYW1lKSA6IGZpbGVuYW1lO1xuICAgIH0sXG5cbiAgICBnZXRUZW1wbGF0ZTogZnVuY3Rpb24obmFtZSwgZWFnZXJDb21waWxlLCBwYXJlbnROYW1lLCBjYikge1xuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHZhciB0bXBsID0gbnVsbDtcbiAgICAgICAgaWYobmFtZSAmJiBuYW1lLnJhdykge1xuICAgICAgICAgICAgLy8gdGhpcyBmaXhlcyBhdXRvZXNjYXBlIGZvciB0ZW1wbGF0ZXMgcmVmZXJlbmNlZCBpbiBzeW1ib2xzXG4gICAgICAgICAgICBuYW1lID0gbmFtZS5yYXc7XG4gICAgICAgIH1cblxuICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihwYXJlbnROYW1lKSkge1xuICAgICAgICAgICAgY2IgPSBwYXJlbnROYW1lO1xuICAgICAgICAgICAgcGFyZW50TmFtZSA9IG51bGw7XG4gICAgICAgICAgICBlYWdlckNvbXBpbGUgPSBlYWdlckNvbXBpbGUgfHwgZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZihsaWIuaXNGdW5jdGlvbihlYWdlckNvbXBpbGUpKSB7XG4gICAgICAgICAgICBjYiA9IGVhZ2VyQ29tcGlsZTtcbiAgICAgICAgICAgIGVhZ2VyQ29tcGlsZSA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RlbXBsYXRlIG5hbWVzIG11c3QgYmUgYSBzdHJpbmc6ICcgKyBuYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sb2FkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgX25hbWUgPSB0aGlzLnJlc29sdmVUZW1wbGF0ZSh0aGlzLmxvYWRlcnNbaV0sIHBhcmVudE5hbWUsIG5hbWUpO1xuICAgICAgICAgICAgdG1wbCA9IHRoaXMubG9hZGVyc1tpXS5jYWNoZVtfbmFtZV07XG4gICAgICAgICAgICBpZiAodG1wbCkgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBpZih0bXBsKSB7XG4gICAgICAgICAgICBpZihlYWdlckNvbXBpbGUpIHtcbiAgICAgICAgICAgICAgICB0bXBsLmNvbXBpbGUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoY2IpIHtcbiAgICAgICAgICAgICAgICBjYihudWxsLCB0bXBsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB0bXBsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHN5bmNSZXN1bHQ7XG5cbiAgICAgICAgICAgIGxpYi5hc3luY0l0ZXIodGhpcy5sb2FkZXJzLCBmdW5jdGlvbihsb2FkZXIsIGksIG5leHQsIGRvbmUpIHtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBoYW5kbGUoc3JjKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKHNyYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3JjLmxvYWRlciA9IGxvYWRlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbmUoc3JjKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFJlc29sdmUgbmFtZSByZWxhdGl2ZSB0byBwYXJlbnROYW1lXG4gICAgICAgICAgICAgICAgbmFtZSA9IHRoYXQucmVzb2x2ZVRlbXBsYXRlKGxvYWRlciwgcGFyZW50TmFtZSwgbmFtZSk7XG5cbiAgICAgICAgICAgICAgICBpZihsb2FkZXIuYXN5bmMpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVyLmdldFNvdXJjZShuYW1lLCBmdW5jdGlvbihlcnIsIHNyYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoZXJyKSB7IHRocm93IGVycjsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlKHNyYyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlKGxvYWRlci5nZXRTb3VyY2UobmFtZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgICAgICAgICAgICBpZighaW5mbykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCd0ZW1wbGF0ZSBub3QgZm91bmQ6ICcgKyBuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0bXBsID0gbmV3IFRlbXBsYXRlKGluZm8uc3JjLCB0aGlzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvLnBhdGgsIGVhZ2VyQ29tcGlsZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoIWluZm8ubm9DYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5sb2FkZXIuY2FjaGVbbmFtZV0gPSB0bXBsO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoY2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiKG51bGwsIHRtcGwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3luY1Jlc3VsdCA9IHRtcGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgICAgICByZXR1cm4gc3luY1Jlc3VsdDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBleHByZXNzOiBmdW5jdGlvbihhcHApIHtcbiAgICAgICAgdmFyIGVudiA9IHRoaXM7XG5cbiAgICAgICAgZnVuY3Rpb24gTnVuanVja3NWaWV3KG5hbWUsIG9wdHMpIHtcbiAgICAgICAgICAgIHRoaXMubmFtZSAgICAgICAgICA9IG5hbWU7XG4gICAgICAgICAgICB0aGlzLnBhdGggICAgICAgICAgPSBuYW1lO1xuICAgICAgICAgICAgdGhpcy5kZWZhdWx0RW5naW5lID0gb3B0cy5kZWZhdWx0RW5naW5lO1xuICAgICAgICAgICAgdGhpcy5leHQgICAgICAgICAgID0gcGF0aC5leHRuYW1lKG5hbWUpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmV4dCAmJiAhdGhpcy5kZWZhdWx0RW5naW5lKSB0aHJvdyBuZXcgRXJyb3IoJ05vIGRlZmF1bHQgZW5naW5lIHdhcyBzcGVjaWZpZWQgYW5kIG5vIGV4dGVuc2lvbiB3YXMgcHJvdmlkZWQuJyk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZXh0KSB0aGlzLm5hbWUgKz0gKHRoaXMuZXh0ID0gKCcuJyAhPT0gdGhpcy5kZWZhdWx0RW5naW5lWzBdID8gJy4nIDogJycpICsgdGhpcy5kZWZhdWx0RW5naW5lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIE51bmp1Y2tzVmlldy5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24ob3B0cywgY2IpIHtcbiAgICAgICAgICBlbnYucmVuZGVyKHRoaXMubmFtZSwgb3B0cywgY2IpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGFwcC5zZXQoJ3ZpZXcnLCBOdW5qdWNrc1ZpZXcpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKG5hbWUsIGN0eCwgY2IpIHtcbiAgICAgICAgaWYobGliLmlzRnVuY3Rpb24oY3R4KSkge1xuICAgICAgICAgICAgY2IgPSBjdHg7XG4gICAgICAgICAgICBjdHggPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2Ugc3VwcG9ydCBhIHN5bmNocm9ub3VzIEFQSSB0byBtYWtlIGl0IGVhc2llciB0byBtaWdyYXRlXG4gICAgICAgIC8vIGV4aXN0aW5nIGNvZGUgdG8gYXN5bmMuIFRoaXMgd29ya3MgYmVjYXVzZSBpZiB5b3UgZG9uJ3QgZG9cbiAgICAgICAgLy8gYW55dGhpbmcgYXN5bmMgd29yaywgdGhlIHdob2xlIHRoaW5nIGlzIGFjdHVhbGx5IHJ1blxuICAgICAgICAvLyBzeW5jaHJvbm91c2x5LlxuICAgICAgICB2YXIgc3luY1Jlc3VsdCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5nZXRUZW1wbGF0ZShuYW1lLCBmdW5jdGlvbihlcnIsIHRtcGwpIHtcbiAgICAgICAgICAgIGlmKGVyciAmJiBjYikge1xuICAgICAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmKGVycikge1xuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRtcGwucmVuZGVyKGN0eCwgY2IgfHwgZnVuY3Rpb24oZXJyLCByZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYoZXJyKSB7IHRocm93IGVycjsgfVxuICAgICAgICAgICAgICAgICAgICBzeW5jUmVzdWx0ID0gcmVzO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc3luY1Jlc3VsdDtcbiAgICB9LFxuXG4gICAgcmVuZGVyU3RyaW5nOiBmdW5jdGlvbihzcmMsIGN0eCwgb3B0cywgY2IpIHtcbiAgICAgICAgaWYobGliLmlzRnVuY3Rpb24ob3B0cykpIHtcbiAgICAgICAgICAgIGNiID0gb3B0cztcbiAgICAgICAgICAgIG9wdHMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBvcHRzID0gb3B0cyB8fCB7fTtcblxuICAgICAgICB2YXIgdG1wbCA9IG5ldyBUZW1wbGF0ZShzcmMsIHRoaXMsIG9wdHMucGF0aCk7XG4gICAgICAgIHJldHVybiB0bXBsLnJlbmRlcihjdHgsIGNiKTtcbiAgICB9XG59KTtcblxudmFyIENvbnRleHQgPSBPYmouZXh0ZW5kKHtcbiAgICBpbml0OiBmdW5jdGlvbihjdHgsIGJsb2Nrcykge1xuICAgICAgICB0aGlzLmN0eCA9IGN0eDtcbiAgICAgICAgdGhpcy5ibG9ja3MgPSB7fTtcbiAgICAgICAgdGhpcy5leHBvcnRlZCA9IFtdO1xuXG4gICAgICAgIGZvcih2YXIgbmFtZSBpbiBibG9ja3MpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkQmxvY2sobmFtZSwgYmxvY2tzW25hbWVdKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBsb29rdXA6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgLy8gVGhpcyBpcyBvbmUgb2YgdGhlIG1vc3QgY2FsbGVkIGZ1bmN0aW9ucywgc28gb3B0aW1pemUgZm9yXG4gICAgICAgIC8vIHRoZSB0eXBpY2FsIGNhc2Ugd2hlcmUgdGhlIG5hbWUgaXNuJ3QgaW4gdGhlIGdsb2JhbHNcbiAgICAgICAgaWYobmFtZSBpbiBnbG9iYWxzICYmICEobmFtZSBpbiB0aGlzLmN0eCkpIHtcbiAgICAgICAgICAgIHJldHVybiBnbG9iYWxzW25hbWVdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY3R4W25hbWVdO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNldFZhcmlhYmxlOiBmdW5jdGlvbihuYW1lLCB2YWwpIHtcbiAgICAgICAgdGhpcy5jdHhbbmFtZV0gPSB2YWw7XG4gICAgfSxcblxuICAgIGdldFZhcmlhYmxlczogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmN0eDtcbiAgICB9LFxuXG4gICAgYWRkQmxvY2s6IGZ1bmN0aW9uKG5hbWUsIGJsb2NrKSB7XG4gICAgICAgIHRoaXMuYmxvY2tzW25hbWVdID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW107XG4gICAgICAgIHRoaXMuYmxvY2tzW25hbWVdLnB1c2goYmxvY2spO1xuICAgIH0sXG5cbiAgICBnZXRCbG9jazogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBpZighdGhpcy5ibG9ja3NbbmFtZV0pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndW5rbm93biBibG9jayBcIicgKyBuYW1lICsgJ1wiJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5ibG9ja3NbbmFtZV1bMF07XG4gICAgfSxcblxuICAgIGdldFN1cGVyOiBmdW5jdGlvbihlbnYsIG5hbWUsIGJsb2NrLCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbiAgICAgICAgdmFyIGlkeCA9IGxpYi5pbmRleE9mKHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdLCBibG9jayk7XG4gICAgICAgIHZhciBibGsgPSB0aGlzLmJsb2Nrc1tuYW1lXVtpZHggKyAxXTtcbiAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzO1xuXG4gICAgICAgIGlmKGlkeCA9PT0gLTEgfHwgIWJsaykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdubyBzdXBlciBibG9jayBhdmFpbGFibGUgZm9yIFwiJyArIG5hbWUgKyAnXCInKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGJsayhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG4gICAgfSxcblxuICAgIGFkZEV4cG9ydDogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB0aGlzLmV4cG9ydGVkLnB1c2gobmFtZSk7XG4gICAgfSxcblxuICAgIGdldEV4cG9ydGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGV4cG9ydGVkID0ge307XG4gICAgICAgIGZvcih2YXIgaT0wOyBpPHRoaXMuZXhwb3J0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gdGhpcy5leHBvcnRlZFtpXTtcbiAgICAgICAgICAgIGV4cG9ydGVkW25hbWVdID0gdGhpcy5jdHhbbmFtZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV4cG9ydGVkO1xuICAgIH1cbn0pO1xuXG52YXIgVGVtcGxhdGUgPSBPYmouZXh0ZW5kKHtcbiAgICBpbml0OiBmdW5jdGlvbiAoc3JjLCBlbnYsIHBhdGgsIGVhZ2VyQ29tcGlsZSkge1xuICAgICAgICB0aGlzLmVudiA9IGVudiB8fCBuZXcgRW52aXJvbm1lbnQoKTtcblxuICAgICAgICBpZihsaWIuaXNPYmplY3Qoc3JjKSkge1xuICAgICAgICAgICAgc3dpdGNoKHNyYy50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdjb2RlJzogdGhpcy50bXBsUHJvcHMgPSBzcmMub2JqOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6IHRoaXMudG1wbFN0ciA9IHNyYy5vYmo7IGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYobGliLmlzU3RyaW5nKHNyYykpIHtcbiAgICAgICAgICAgIHRoaXMudG1wbFN0ciA9IHNyYztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignc3JjIG11c3QgYmUgYSBzdHJpbmcgb3IgYW4gb2JqZWN0IGRlc2NyaWJpbmcgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RoZSBzb3VyY2UnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGF0aCA9IHBhdGg7XG5cbiAgICAgICAgaWYoZWFnZXJDb21waWxlKSB7XG4gICAgICAgICAgICBsaWIud2l0aFByZXR0eUVycm9ycyh0aGlzLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5kZXYsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jb21waWxlLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jb21waWxlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24oY3R4LCBmcmFtZSwgY2IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjdHggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNiID0gY3R4O1xuICAgICAgICAgICAgY3R4ID0ge307XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIGZyYW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYiA9IGZyYW1lO1xuICAgICAgICAgICAgZnJhbWUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpYi53aXRoUHJldHR5RXJyb3JzKHRoaXMucGF0aCwgdGhpcy5lbnYuZGV2LCBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgLy8gQ2F0Y2ggY29tcGlsZSBlcnJvcnMgZm9yIGFzeW5jIHJlbmRlcmluZ1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBpbGUoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2IpIHJldHVybiBjYihlKTtcbiAgICAgICAgICAgICAgICBlbHNlIHRocm93IGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBjb250ZXh0ID0gbmV3IENvbnRleHQoY3R4IHx8IHt9LCB0aGlzLmJsb2Nrcyk7XG4gICAgICAgICAgICB2YXIgc3luY1Jlc3VsdCA9IG51bGw7XG5cbiAgICAgICAgICAgIHRoaXMucm9vdFJlbmRlckZ1bmModGhpcy5lbnYsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lIHx8IG5ldyBGcmFtZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW50aW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYiB8fCBmdW5jdGlvbihlcnIsIHJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZXJyKSB7IHRocm93IGVycjsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3luY1Jlc3VsdCA9IHJlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBzeW5jUmVzdWx0O1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cblxuICAgIGdldEV4cG9ydGVkOiBmdW5jdGlvbihjdHgsIGZyYW1lLCBjYikge1xuICAgICAgICBpZiAodHlwZW9mIGN0eCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2IgPSBjdHg7XG4gICAgICAgICAgICBjdHggPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgZnJhbWUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNiID0gZnJhbWU7XG4gICAgICAgICAgICBmcmFtZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYXRjaCBjb21waWxlIGVycm9ycyBmb3IgYXN5bmMgcmVuZGVyaW5nXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aGlzLmNvbXBpbGUoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGNiKSByZXR1cm4gY2IoZSk7XG4gICAgICAgICAgICBlbHNlIHRocm93IGU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSdW4gdGhlIHJvb3RSZW5kZXJGdW5jIHRvIHBvcHVsYXRlIHRoZSBjb250ZXh0IHdpdGggZXhwb3J0ZWQgdmFyc1xuICAgICAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KGN0eCB8fCB7fSwgdGhpcy5ibG9ja3MpO1xuICAgICAgICB0aGlzLnJvb3RSZW5kZXJGdW5jKHRoaXMuZW52LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWUgfHwgbmV3IEZyYW1lKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVudGltZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IobnVsbCwgY29udGV4dC5nZXRFeHBvcnRlZCgpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY29tcGlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKCF0aGlzLmNvbXBpbGVkKSB7XG4gICAgICAgICAgICB0aGlzLl9jb21waWxlKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgX2NvbXBpbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcHJvcHM7XG5cbiAgICAgICAgaWYodGhpcy50bXBsUHJvcHMpIHtcbiAgICAgICAgICAgIHByb3BzID0gdGhpcy50bXBsUHJvcHM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gY29tcGlsZXIuY29tcGlsZSh0aGlzLnRtcGxTdHIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5hc3luY0ZpbHRlcnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5leHRlbnNpb25zTGlzdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW52Lm9wdHMpO1xuXG4gICAgICAgICAgICB2YXIgZnVuYyA9IG5ldyBGdW5jdGlvbihzb3VyY2UpO1xuICAgICAgICAgICAgcHJvcHMgPSBmdW5jKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmJsb2NrcyA9IHRoaXMuX2dldEJsb2Nrcyhwcm9wcyk7XG4gICAgICAgIHRoaXMucm9vdFJlbmRlckZ1bmMgPSBwcm9wcy5yb290O1xuICAgICAgICB0aGlzLmNvbXBpbGVkID0gdHJ1ZTtcbiAgICB9LFxuXG4gICAgX2dldEJsb2NrczogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICAgICAgdmFyIGJsb2NrcyA9IHt9O1xuXG4gICAgICAgIGZvcih2YXIgayBpbiBwcm9wcykge1xuICAgICAgICAgICAgaWYoay5zbGljZSgwLCAyKSA9PT0gJ2JfJykge1xuICAgICAgICAgICAgICAgIGJsb2Nrc1trLnNsaWNlKDIpXSA9IHByb3BzW2tdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJsb2NrcztcbiAgICB9XG59KTtcblxuLy8gdGVzdCBjb2RlXG4vLyB2YXIgc3JjID0gJ3slIG1hY3JvIGZvbygpICV9eyUgaW5jbHVkZSBcImluY2x1ZGUuaHRtbFwiICV9eyUgZW5kbWFjcm8gJX17eyBmb28oKSB9fSc7XG4vLyB2YXIgZW52ID0gbmV3IEVudmlyb25tZW50KG5ldyBidWlsdGluX2xvYWRlcnMuRmlsZVN5c3RlbUxvYWRlcignLi4vdGVzdHMvdGVtcGxhdGVzJywgdHJ1ZSksIHsgZGV2OiB0cnVlIH0pO1xuLy8gY29uc29sZS5sb2coZW52LnJlbmRlclN0cmluZyhzcmMsIHsgbmFtZTogJ3Bvb3AnIH0pKTtcblxubW9kdWxlc1snZW52aXJvbm1lbnQnXSA9IHtcbiAgICBFbnZpcm9ubWVudDogRW52aXJvbm1lbnQsXG4gICAgVGVtcGxhdGU6IFRlbXBsYXRlXG59O1xufSkoKTtcbnZhciBudW5qdWNrcztcblxudmFyIGxpYiA9IG1vZHVsZXNbXCJsaWJcIl07XG52YXIgZW52ID0gbW9kdWxlc1tcImVudmlyb25tZW50XCJdO1xudmFyIGNvbXBpbGVyID0gbW9kdWxlc1tcImNvbXBpbGVyXCJdO1xudmFyIHBhcnNlciA9IG1vZHVsZXNbXCJwYXJzZXJcIl07XG52YXIgbGV4ZXIgPSBtb2R1bGVzW1wibGV4ZXJcIl07XG52YXIgcnVudGltZSA9IG1vZHVsZXNbXCJydW50aW1lXCJdO1xudmFyIExvYWRlciA9IG1vZHVsZXNbXCJsb2FkZXJcIl07XG52YXIgbG9hZGVycyA9IG1vZHVsZXNbXCJsb2FkZXJzXCJdO1xudmFyIHByZWNvbXBpbGUgPSBtb2R1bGVzW1wicHJlY29tcGlsZVwiXTtcblxubnVuanVja3MgPSB7fTtcbm51bmp1Y2tzLkVudmlyb25tZW50ID0gZW52LkVudmlyb25tZW50O1xubnVuanVja3MuVGVtcGxhdGUgPSBlbnYuVGVtcGxhdGU7XG5cbm51bmp1Y2tzLkxvYWRlciA9IExvYWRlcjtcbm51bmp1Y2tzLkZpbGVTeXN0ZW1Mb2FkZXIgPSBsb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXI7XG5udW5qdWNrcy5XZWJMb2FkZXIgPSBsb2FkZXJzLldlYkxvYWRlcjtcblxubnVuanVja3MuY29tcGlsZXIgPSBjb21waWxlcjtcbm51bmp1Y2tzLnBhcnNlciA9IHBhcnNlcjtcbm51bmp1Y2tzLmxleGVyID0gbGV4ZXI7XG5udW5qdWNrcy5ydW50aW1lID0gcnVudGltZTtcblxuLy8gQSBzaW5nbGUgaW5zdGFuY2Ugb2YgYW4gZW52aXJvbm1lbnQsIHNpbmNlIHRoaXMgaXMgc28gY29tbW9ubHkgdXNlZFxuXG52YXIgZTtcbm51bmp1Y2tzLmNvbmZpZ3VyZSA9IGZ1bmN0aW9uKHRlbXBsYXRlc1BhdGgsIG9wdHMpIHtcbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgICBpZihsaWIuaXNPYmplY3QodGVtcGxhdGVzUGF0aCkpIHtcbiAgICAgICAgb3B0cyA9IHRlbXBsYXRlc1BhdGg7XG4gICAgICAgIHRlbXBsYXRlc1BhdGggPSBudWxsO1xuICAgIH1cblxuICAgIHZhciBub1dhdGNoID0gJ3dhdGNoJyBpbiBvcHRzID8gIW9wdHMud2F0Y2ggOiBmYWxzZTtcbiAgICB2YXIgbG9hZGVyID0gbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyIHx8IGxvYWRlcnMuV2ViTG9hZGVyO1xuICAgIGUgPSBuZXcgZW52LkVudmlyb25tZW50KG5ldyBsb2FkZXIodGVtcGxhdGVzUGF0aCwgbm9XYXRjaCksIG9wdHMpO1xuXG4gICAgaWYob3B0cyAmJiBvcHRzLmV4cHJlc3MpIHtcbiAgICAgICAgZS5leHByZXNzKG9wdHMuZXhwcmVzcyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGU7XG59O1xuXG5udW5qdWNrcy5jb21waWxlID0gZnVuY3Rpb24oc3JjLCBlbnYsIHBhdGgsIGVhZ2VyQ29tcGlsZSkge1xuICAgIGlmKCFlKSB7XG4gICAgICAgIG51bmp1Y2tzLmNvbmZpZ3VyZSgpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IG51bmp1Y2tzLlRlbXBsYXRlKHNyYywgZW52LCBwYXRoLCBlYWdlckNvbXBpbGUpO1xufTtcblxubnVuanVja3MucmVuZGVyID0gZnVuY3Rpb24obmFtZSwgY3R4LCBjYikge1xuICAgIGlmKCFlKSB7XG4gICAgICAgIG51bmp1Y2tzLmNvbmZpZ3VyZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBlLnJlbmRlcihuYW1lLCBjdHgsIGNiKTtcbn07XG5cbm51bmp1Y2tzLnJlbmRlclN0cmluZyA9IGZ1bmN0aW9uKHNyYywgY3R4LCBjYikge1xuICAgIGlmKCFlKSB7XG4gICAgICAgIG51bmp1Y2tzLmNvbmZpZ3VyZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBlLnJlbmRlclN0cmluZyhzcmMsIGN0eCwgY2IpO1xufTtcblxuaWYocHJlY29tcGlsZSkge1xuICAgIG51bmp1Y2tzLnByZWNvbXBpbGUgPSBwcmVjb21waWxlLnByZWNvbXBpbGU7XG4gICAgbnVuanVja3MucHJlY29tcGlsZVN0cmluZyA9IHByZWNvbXBpbGUucHJlY29tcGlsZVN0cmluZztcbn1cblxubnVuanVja3MucmVxdWlyZSA9IGZ1bmN0aW9uKG5hbWUpIHsgcmV0dXJuIG1vZHVsZXNbbmFtZV07IH07XG5cbmlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHsgcmV0dXJuIG51bmp1Y2tzOyB9KTtcbn1cbmVsc2Uge1xuICAgIHdpbmRvdy5udW5qdWNrcyA9IG51bmp1Y2tzO1xuICAgIGlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSBtb2R1bGUuZXhwb3J0cyA9IG51bmp1Y2tzO1xufVxuXG59KSgpO1xuIiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrc1wiICk7XG52YXIgZW52ID0gbnVuanVja3MuZW52IHx8IG5ldyBudW5qdWNrcy5FbnZpcm9ubWVudCgpO1xucmVxdWlyZSggXCIuL2xheW91dC5udW5qXCIgKTtcbnJlcXVpcmUoIFwiLi9wYXJ0aWFscy9jb250ZW50Lm51bmpcIiApO1xudmFyIG9iaiA9IChmdW5jdGlvbiAoKSB7ZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xuZW52LmdldFRlbXBsYXRlKFwiLi9sYXlvdXQubnVualwiLCB0cnVlLCB1bmRlZmluZWQsIGZ1bmN0aW9uKHRfMixwYXJlbnRUZW1wbGF0ZSkge1xuaWYodF8yKSB7IGNiKHRfMik7IHJldHVybjsgfVxuZm9yKHZhciB0XzEgaW4gcGFyZW50VGVtcGxhdGUuYmxvY2tzKSB7XG5jb250ZXh0LmFkZEJsb2NrKHRfMSwgcGFyZW50VGVtcGxhdGUuYmxvY2tzW3RfMV0pO1xufVxub3V0cHV0ICs9IFwiXFxuXCI7XG5wYXJlbnRUZW1wbGF0ZS5yb290UmVuZGVyRnVuYyhlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYik7XG59KTtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5mdW5jdGlvbiBiX2NvbnRlbnQoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbm91dHB1dCArPSBcIlxcblxcdFwiO1xuZW52LmdldFRlbXBsYXRlKFwiLi9wYXJ0aWFscy9jb250ZW50Lm51bmpcIiwgZmFsc2UsIHVuZGVmaW5lZCwgZnVuY3Rpb24odF81LHRfMykge1xuaWYodF81KSB7IGNiKHRfNSk7IHJldHVybjsgfVxudF8zLnJlbmRlcihjb250ZXh0LmdldFZhcmlhYmxlcygpLCBmcmFtZS5wdXNoKCksIGZ1bmN0aW9uKHRfNix0XzQpIHtcbmlmKHRfNikgeyBjYih0XzYpOyByZXR1cm47IH1cbm91dHB1dCArPSB0XzRcbm91dHB1dCArPSBcIlxcblwiO1xuY2IobnVsbCwgb3V0cHV0KTtcbn0pfSk7XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbmJfY29udGVudDogYl9jb250ZW50LFxucm9vdDogcm9vdFxufTtcbn0pKCk7XG52YXIgb2xkUm9vdCA9IG9iai5yb290O1xub2JqLnJvb3QgPSBmdW5jdGlvbiggZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IgKSB7XG5cdHZhciBvbGRHZXRUZW1wbGF0ZSA9IGVudi5nZXRUZW1wbGF0ZTtcblx0ZW52LmdldFRlbXBsYXRlID0gZnVuY3Rpb24oIG5hbWUsIGVjLCBwYXJlbnROYW1lLCBjYiApIHtcblx0XHRpZiggdHlwZW9mIGVjID09PSBcImZ1bmN0aW9uXCIgKSB7XG5cdFx0XHRjYiA9IGVjO1xuXHRcdFx0ZWMgPSBmYWxzZTtcblx0XHR9XG5cdFx0dmFyIF9yZXF1aXJlID0gZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmV0dXJuIHJlcXVpcmUobmFtZSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGlmICggZnJhbWUuZ2V0KCBcIl9yZXF1aXJlXCIgKSApIHJldHVybiBmcmFtZS5nZXQoIFwiX3JlcXVpcmVcIiApKCBuYW1lIClcblx0XHRcdH1cblx0XHR9O1xuXHRcdHZhciB0bXBsID0gX3JlcXVpcmUoIG5hbWUgKTtcblx0XHRmcmFtZS5zZXQoIFwiX3JlcXVpcmVcIiwgX3JlcXVpcmUgKTtcblx0XHRpZiggZWMgKSB0bXBsLmNvbXBpbGUoKTtcblx0XHRjYiggbnVsbCwgdG1wbCApO1xuXHR9O1x0b2xkUm9vdCggZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgZnVuY3Rpb24oIGVyciwgcmVzICkge1xuXHRcdGVudi5nZXRUZW1wbGF0ZSA9IG9sZEdldFRlbXBsYXRlO1xuXHRcdGNiKCBlcnIsIHJlcyApO1xuXHR9ICk7XG59O1xudmFyIHNyYyA9IHtcblx0b2JqOiBvYmosXG5cdHR5cGU6IFwiY29kZVwiXG59O1xubW9kdWxlLmV4cG9ydHMgPSBuZXcgbnVuanVja3MuVGVtcGxhdGUoIHNyYywgZW52ICk7XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzXCIgKTtcbnZhciBlbnYgPSBudW5qdWNrcy5lbnYgfHwgbmV3IG51bmp1Y2tzLkVudmlyb25tZW50KCk7XG52YXIgb2JqID0gKGZ1bmN0aW9uICgpIHtmdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG5vdXRwdXQgKz0gXCI8ZGl2IGNsYXNzPVxcXCJyb3dcXFwiPlxcblxcdDxkaXYgY2xhc3M9XFxcIndyYXBwZXJcXFwiPlxcblxcdFxcdFwiO1xuY29udGV4dC5nZXRCbG9jayhcImNvbnRlbnRcIikoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgZnVuY3Rpb24odF8yLHRfMSkge1xuaWYodF8yKSB7IGNiKHRfMik7IHJldHVybjsgfVxub3V0cHV0ICs9IHRfMTtcbm91dHB1dCArPSBcIlxcblxcdDwvZGl2PlxcbjwvZGl2PlwiO1xuY2IobnVsbCwgb3V0cHV0KTtcbn0pO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbmZ1bmN0aW9uIGJfY29udGVudChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xub3V0cHV0ICs9IFwiXFxuXFx0XFx0PGgxPk1haW4gY29udGVudDwvaDE+XFxuXFx0XFx0XCI7XG5jYihudWxsLCBvdXRwdXQpO1xuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5iX2NvbnRlbnQ6IGJfY29udGVudCxcbnJvb3Q6IHJvb3Rcbn07XG59KSgpO1xudmFyIG9sZFJvb3QgPSBvYmoucm9vdDtcbm9iai5yb290ID0gZnVuY3Rpb24oIGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiICkge1xuXHR2YXIgb2xkR2V0VGVtcGxhdGUgPSBlbnYuZ2V0VGVtcGxhdGU7XG5cdGVudi5nZXRUZW1wbGF0ZSA9IGZ1bmN0aW9uKCBuYW1lLCBlYywgcGFyZW50TmFtZSwgY2IgKSB7XG5cdFx0aWYoIHR5cGVvZiBlYyA9PT0gXCJmdW5jdGlvblwiICkge1xuXHRcdFx0Y2IgPSBlYztcblx0XHRcdGVjID0gZmFsc2U7XG5cdFx0fVxuXHRcdHZhciBfcmVxdWlyZSA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJldHVybiByZXF1aXJlKG5hbWUpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAoIGZyYW1lLmdldCggXCJfcmVxdWlyZVwiICkgKSByZXR1cm4gZnJhbWUuZ2V0KCBcIl9yZXF1aXJlXCIgKSggbmFtZSApXG5cdFx0XHR9XG5cdFx0fTtcblx0XHR2YXIgdG1wbCA9IF9yZXF1aXJlKCBuYW1lICk7XG5cdFx0ZnJhbWUuc2V0KCBcIl9yZXF1aXJlXCIsIF9yZXF1aXJlICk7XG5cdFx0aWYoIGVjICkgdG1wbC5jb21waWxlKCk7XG5cdFx0Y2IoIG51bGwsIHRtcGwgKTtcblx0fTtcdG9sZFJvb3QoIGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGZ1bmN0aW9uKCBlcnIsIHJlcyApIHtcblx0XHRlbnYuZ2V0VGVtcGxhdGUgPSBvbGRHZXRUZW1wbGF0ZTtcblx0XHRjYiggZXJyLCByZXMgKTtcblx0fSApO1xufTtcbnZhciBzcmMgPSB7XG5cdG9iajogb2JqLFxuXHR0eXBlOiBcImNvZGVcIlxufTtcbm1vZHVsZS5leHBvcnRzID0gbmV3IG51bmp1Y2tzLlRlbXBsYXRlKCBzcmMsIGVudiApO1xuIiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrc1wiICk7XG52YXIgZW52ID0gbnVuanVja3MuZW52IHx8IG5ldyBudW5qdWNrcy5FbnZpcm9ubWVudCgpO1xudmFyIG9iaiA9IChmdW5jdGlvbiAoKSB7ZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xub3V0cHV0ICs9IFwiPGg0PkhlbGxvIFwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm1lc3NhZ2VcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9oND5cXG48cD48c3Bhbj48c3Ryb25nPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwidGVzdFwiKS5jYWxsKGNvbnRleHQsIGVudi5nZXRGaWx0ZXIoXCJ1cHBlclwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwibWVzc2FnZVwiKSkpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIjwvc3Ryb25nPjwvc3Bhbj5cXG48c3Bhbj5CZWF0YWUgZXggcXVpYnVzZGFtLCBtb2RpIHNlZCBpbGxvIGNvbnNlcXVhdHVyIGV0ISBFeCBuZXF1ZSBxdWFzaSBtb2xlc3RpYWUgdm9sdXB0YXRlcyBjb21tb2RpIGZ1Z2lhdCByZXB1ZGlhbmRhZSBwcmFlc2VudGl1bSwgb2ZmaWNpaXMgcXVhcyBxdWlkZW0gdmVsIG5paGlsIHNhZXBlIGFwZXJpYW0gYWNjdXNhbnRpdW0sIGRvbG9yZSBsaWJlcm8gb2JjYWVjYXRpIGluIHF1YWVyYXQuPC9zcGFuPlxcbjxzcGFuPkV4ZXJjaXRhdGlvbmVtIHBvcnJvIGhpYyBvZmZpY2lpcyBhdXQgdG90YW0sIHNhcGllbnRlIHRlbXBvcmUgbm9uIGR1Y2ltdXMsIGRpc3RpbmN0aW8gaW52ZW50b3JlIGVhcXVlLCBuZWNlc3NpdGF0aWJ1cyBlYXJ1bSB2ZWxpdCBlcnJvciByYXRpb25lIG1pbmltYSBzdW50IGluY2lkdW50IGFjY3VzYW50aXVtIG9kaW8gcHJvdmlkZW50ISBWb2x1cHRhdGVzIGlwc3VtLCBlcnJvciB2ZWxpdCBsYWJvcmUgYXNzdW1lbmRhLjwvc3Bhbj5cXG48c3Bhbj5Wb2x1cHRhdGUsIHBlcnNwaWNpYXRpcyBjb25zZXF1YXR1ciBzYWVwZSBiZWF0YWUuIEFzcGVyaW9yZXMgbmVtbyBhbWV0IGhpYyB2ZW5pYW0gYWRpcGlzY2kgcmVwdWRpYW5kYWUgYWxpcXVpZCBtYWduYW0gc2ltaWxpcXVlIGRvbG9yZXMgYWNjdXNhbXVzIG5pc2kgdm9sdXB0YXMgaWQgZWEgZWFxdWUsIGV0IHZvbHVwdGF0aWJ1cyBsYWJvcmUgcGxhY2VhdC4gQ3VscGEgc2ltaWxpcXVlIG51bXF1YW0sIGVzdC48L3NwYW4+PC9wPlwiO1xuY2IobnVsbCwgb3V0cHV0KTtcbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcbn0pKCk7XG52YXIgb2xkUm9vdCA9IG9iai5yb290O1xub2JqLnJvb3QgPSBmdW5jdGlvbiggZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IgKSB7XG5cdHZhciBvbGRHZXRUZW1wbGF0ZSA9IGVudi5nZXRUZW1wbGF0ZTtcblx0ZW52LmdldFRlbXBsYXRlID0gZnVuY3Rpb24oIG5hbWUsIGVjLCBwYXJlbnROYW1lLCBjYiApIHtcblx0XHRpZiggdHlwZW9mIGVjID09PSBcImZ1bmN0aW9uXCIgKSB7XG5cdFx0XHRjYiA9IGVjO1xuXHRcdFx0ZWMgPSBmYWxzZTtcblx0XHR9XG5cdFx0dmFyIF9yZXF1aXJlID0gZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmV0dXJuIHJlcXVpcmUobmFtZSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGlmICggZnJhbWUuZ2V0KCBcIl9yZXF1aXJlXCIgKSApIHJldHVybiBmcmFtZS5nZXQoIFwiX3JlcXVpcmVcIiApKCBuYW1lIClcblx0XHRcdH1cblx0XHR9O1xuXHRcdHZhciB0bXBsID0gX3JlcXVpcmUoIG5hbWUgKTtcblx0XHRmcmFtZS5zZXQoIFwiX3JlcXVpcmVcIiwgX3JlcXVpcmUgKTtcblx0XHRpZiggZWMgKSB0bXBsLmNvbXBpbGUoKTtcblx0XHRjYiggbnVsbCwgdG1wbCApO1xuXHR9O1x0b2xkUm9vdCggZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgZnVuY3Rpb24oIGVyciwgcmVzICkge1xuXHRcdGVudi5nZXRUZW1wbGF0ZSA9IG9sZEdldFRlbXBsYXRlO1xuXHRcdGNiKCBlcnIsIHJlcyApO1xuXHR9ICk7XG59O1xudmFyIHNyYyA9IHtcblx0b2JqOiBvYmosXG5cdHR5cGU6IFwiY29kZVwiXG59O1xubW9kdWxlLmV4cG9ydHMgPSBuZXcgbnVuanVja3MuVGVtcGxhdGUoIHNyYywgZW52ICk7XG4iLCIvL3ZhciBzd2lnID0gcmVxdWlyZSgnc3dpZycpO1xuXG4vKipcbipcdEHDsWFkaWVuZG8gZmlsdHJvcyBhIGxhcyBwbGFudGlsbGFzXG4qL1xudmFyIG51bmp1Y2tzID0gcmVxdWlyZSggJ251bmp1Y2tzJyApO1xubnVuanVja3MuZW52ID0gbmV3IG51bmp1Y2tzLkVudmlyb25tZW50KCk7XG5udW5qdWNrcy5lbnYuYWRkRmlsdGVyKCAndGVzdCcsIGZ1bmN0aW9uKCB0ZXN0ICkge1xuICAgIHJldHVybiB0ZXN0KycgLS0tIFRFU1QnO1xufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXG5cdHRlbXBsYXRlIFx0OiByZXF1aXJlKCcuL3RlbXBsYXRlcy9oZWxsby5udW5qJyksXG5cdFxuXHRpbml0aWFsaXplIFx0OiBmdW5jdGlvbihvcHRpb25zKXtcblx0XHR0aGlzLm1vZHVsZUNvbmZpZyA9IF8uZXh0ZW5kKHt9LG9wdGlvbnMpO1xuXHRcdEJhY2tib25lLm9uKHtcblx0XHRcdCdjdXN0b206Y2hhbmdlJ1x0OiBfLmJpbmQodGhpcy5vbkN1c3RvbUNoYW5nZSx0aGlzKSxcblx0XHRcdCdjdXN0b206c3RhcnQnXHQ6IF8uYmluZCh0aGlzLm9uQ3VzdG9tU3RhcnQsdGhpcyksXG5cdFx0XHQnY3VzdG9tOmVuZCdcdDogXy5iaW5kKHRoaXMub25DdXN0b21FbmQsdGhpcyksXG5cdFx0fSk7XG5cdFx0dGhpcy5yZW5kZXIoKTtcblx0fSxcblx0cmVuZGVyIFx0XHQ6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy50ZW1wbGF0ZS5yZW5kZXIoe21lc3NhZ2U6IHRoaXMuJGVsLmF0dHIoJ2lkJyl9KSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHRvbkN1c3RvbUNoYW5nZSBcdDogZnVuY3Rpb24oKXtcblx0XHRjb25zb2xlLmxvZyhcIltjaGFuZ2VdXCIsdGhpcyk7XG5cdH0sXG5cdG9uQ3VzdG9tU3RhcnQgXHQ6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc29sZS5sb2coXCJbc3RhcnRdXCIsdGhpcyk7XG5cdH0sXG5cdG9uQ3VzdG9tRW5kIFx0OiBmdW5jdGlvbigpe1xuXHRcdGNvbnNvbGUubG9nKFwiW2VuZF1cIix0aGlzKTtcblx0fSxcbn0pOyJdfQ==

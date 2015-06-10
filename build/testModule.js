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
output += "<div class=\"thumbnail\">\n\t<img data-src=\"holder.js/350x250?text=";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "message"), env.opts.autoescape);
output += "&random=yes\" >\n\t";
context.getBlock("content")(env, context, frame, runtime, function(t_2,t_1) {
if(t_2) { cb(t_2); return; }
output += t_1;
output += "\n</div>";
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
output += "\n\t<div class=\"caption\">\n\t\t<h3>Thumbnail label</h3>\n\t\t<p>...</p>\n\t\t<p><a href=\"#\" class=\"btn btn-primary\" role=\"button\">Button</a> <a href=\"#\" class=\"btn btn-default\" role=\"button\">Button</a></p>\n\t</div>\n\t";
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
output += "\n<div class=\"caption\">\n\t<h3>";
output += runtime.suppressValue(env.getFilter("test").call(context, env.getFilter("upper").call(context, runtime.contextOrFrameLookup(context, frame, "message"))), env.opts.autoescape);
output += "</h3>\n\t<p>Módulo Window</p>\n\t<p><span>Beatae ex quibusdam, modi sed illo consequatur et! Ex neque quasi molestiae voluptates commodi fugiat repudiandae praesentium, officiis quas quidem vel nihil saepe aperiam accusantium, dolore libero obcaecati in quaerat.</span></p>\n\t<p><a href=\"#\" class=\"btn btn-primary\" role=\"button\">Button</a> <a href=\"#\" class=\"btn btn-default\" role=\"button\">Button</a></p>\n</div>";
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

},{"./layout.nunj":2,"./partials/content.nunj":3,"nunjucks":1}],5:[function(require,module,exports){
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
},{"./templates/testTemplate.nunj":4,"nunjucks":1}]},{},[5])(5)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvbnVuanVja3MvYnJvd3Nlci9udW5qdWNrcy1zbGltLmpzIiwic3JjL3RlbXBsYXRlcy9sYXlvdXQubnVuaiIsInNyYy90ZW1wbGF0ZXMvcGFydGlhbHMvY29udGVudC5udW5qIiwic3JjL3RlbXBsYXRlcy90ZXN0VGVtcGxhdGUubnVuaiIsInNyYy90ZXN0TW9kdWxlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMzJEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBCcm93c2VyIGJ1bmRsZSBvZiBudW5qdWNrcyAxLjMuMyAoc2xpbSwgb25seSB3b3JrcyB3aXRoIHByZWNvbXBpbGVkIHRlbXBsYXRlcylcblxuKGZ1bmN0aW9uKCkge1xudmFyIG1vZHVsZXMgPSB7fTtcbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0JztcblxuLy8gQSBzaW1wbGUgY2xhc3Mgc3lzdGVtLCBtb3JlIGRvY3VtZW50YXRpb24gdG8gY29tZVxuXG5mdW5jdGlvbiBleHRlbmQoY2xzLCBuYW1lLCBwcm9wcykge1xuICAgIC8vIFRoaXMgZG9lcyB0aGF0IHNhbWUgdGhpbmcgYXMgT2JqZWN0LmNyZWF0ZSwgYnV0IHdpdGggc3VwcG9ydCBmb3IgSUU4XG4gICAgdmFyIEYgPSBmdW5jdGlvbigpIHt9O1xuICAgIEYucHJvdG90eXBlID0gY2xzLnByb3RvdHlwZTtcbiAgICB2YXIgcHJvdG90eXBlID0gbmV3IEYoKTtcblxuICAgIHZhciBmblRlc3QgPSAveHl6Ly50ZXN0KGZ1bmN0aW9uKCl7IHh5ejsgfSkgPyAvXFxicGFyZW50XFxiLyA6IC8uKi87XG4gICAgcHJvcHMgPSBwcm9wcyB8fCB7fTtcblxuICAgIGZvcih2YXIgayBpbiBwcm9wcykge1xuICAgICAgICB2YXIgc3JjID0gcHJvcHNba107XG4gICAgICAgIHZhciBwYXJlbnQgPSBwcm90b3R5cGVba107XG5cbiAgICAgICAgaWYodHlwZW9mIHBhcmVudCA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgICAgICAgICB0eXBlb2Ygc3JjID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAgICAgIGZuVGVzdC50ZXN0KHNyYykpIHtcbiAgICAgICAgICAgIHByb3RvdHlwZVtrXSA9IChmdW5jdGlvbiAoc3JjLCBwYXJlbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNhdmUgdGhlIGN1cnJlbnQgcGFyZW50IG1ldGhvZFxuICAgICAgICAgICAgICAgICAgICB2YXIgdG1wID0gdGhpcy5wYXJlbnQ7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHBhcmVudCB0byB0aGUgcHJldmlvdXMgbWV0aG9kLCBjYWxsLCBhbmQgcmVzdG9yZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlcyA9IHNyYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudCA9IHRtcDtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KShzcmMsIHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwcm90b3R5cGVba10gPSBzcmM7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90b3R5cGUudHlwZW5hbWUgPSBuYW1lO1xuXG4gICAgdmFyIG5ld19jbHMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYocHJvdG90eXBlLmluaXQpIHtcbiAgICAgICAgICAgIHByb3RvdHlwZS5pbml0LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbmV3X2Nscy5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgbmV3X2Nscy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBuZXdfY2xzO1xuXG4gICAgbmV3X2Nscy5leHRlbmQgPSBmdW5jdGlvbihuYW1lLCBwcm9wcykge1xuICAgICAgICBpZih0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHByb3BzID0gbmFtZTtcbiAgICAgICAgICAgIG5hbWUgPSAnYW5vbnltb3VzJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXh0ZW5kKG5ld19jbHMsIG5hbWUsIHByb3BzKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIG5ld19jbHM7XG59XG5cbm1vZHVsZXNbJ29iamVjdCddID0gZXh0ZW5kKE9iamVjdCwgJ09iamVjdCcsIHt9KTtcbn0pKCk7XG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBBcnJheVByb3RvID0gQXJyYXkucHJvdG90eXBlO1xudmFyIE9ialByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxudmFyIGVzY2FwZU1hcCA9IHtcbiAgICAnJic6ICcmYW1wOycsXG4gICAgJ1wiJzogJyZxdW90OycsXG4gICAgJ1xcJyc6ICcmIzM5OycsXG4gICAgJzwnOiAnJmx0OycsXG4gICAgJz4nOiAnJmd0Oydcbn07XG5cbnZhciBlc2NhcGVSZWdleCA9IC9bJlwiJzw+XS9nO1xuXG52YXIgbG9va3VwRXNjYXBlID0gZnVuY3Rpb24oY2gpIHtcbiAgICByZXR1cm4gZXNjYXBlTWFwW2NoXTtcbn07XG5cbnZhciBleHBvcnRzID0gbW9kdWxlc1snbGliJ10gPSB7fTtcblxuZXhwb3J0cy53aXRoUHJldHR5RXJyb3JzID0gZnVuY3Rpb24ocGF0aCwgd2l0aEludGVybmFscywgZnVuYykge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBmdW5jKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBpZiAoIWUuVXBkYXRlKSB7XG4gICAgICAgICAgICAvLyBub3Qgb25lIG9mIG91cnMsIGNhc3QgaXRcbiAgICAgICAgICAgIGUgPSBuZXcgZXhwb3J0cy5UZW1wbGF0ZUVycm9yKGUpO1xuICAgICAgICB9XG4gICAgICAgIGUuVXBkYXRlKHBhdGgpO1xuXG4gICAgICAgIC8vIFVubGVzcyB0aGV5IG1hcmtlZCB0aGUgZGV2IGZsYWcsIHNob3cgdGhlbSBhIHRyYWNlIGZyb20gaGVyZVxuICAgICAgICBpZiAoIXdpdGhJbnRlcm5hbHMpIHtcbiAgICAgICAgICAgIHZhciBvbGQgPSBlO1xuICAgICAgICAgICAgZSA9IG5ldyBFcnJvcihvbGQubWVzc2FnZSk7XG4gICAgICAgICAgICBlLm5hbWUgPSBvbGQubmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRocm93IGU7XG4gICAgfVxufTtcblxuZXhwb3J0cy5UZW1wbGF0ZUVycm9yID0gZnVuY3Rpb24obWVzc2FnZSwgbGluZW5vLCBjb2xubykge1xuICAgIHZhciBlcnIgPSB0aGlzO1xuXG4gICAgaWYgKG1lc3NhZ2UgaW5zdGFuY2VvZiBFcnJvcikgeyAvLyBmb3IgY2FzdGluZyByZWd1bGFyIGpzIGVycm9yc1xuICAgICAgICBlcnIgPSBtZXNzYWdlO1xuICAgICAgICBtZXNzYWdlID0gbWVzc2FnZS5uYW1lICsgJzogJyArIG1lc3NhZ2UubWVzc2FnZTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBpZihFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UoZXJyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVyci5uYW1lID0gJ1RlbXBsYXRlIHJlbmRlciBlcnJvcic7XG4gICAgZXJyLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIGVyci5saW5lbm8gPSBsaW5lbm87XG4gICAgZXJyLmNvbG5vID0gY29sbm87XG4gICAgZXJyLmZpcnN0VXBkYXRlID0gdHJ1ZTtcblxuICAgIGVyci5VcGRhdGUgPSBmdW5jdGlvbihwYXRoKSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gJygnICsgKHBhdGggfHwgJ3Vua25vd24gcGF0aCcpICsgJyknO1xuXG4gICAgICAgIC8vIG9ubHkgc2hvdyBsaW5lbm8gKyBjb2xubyBuZXh0IHRvIHBhdGggb2YgdGVtcGxhdGVcbiAgICAgICAgLy8gd2hlcmUgZXJyb3Igb2NjdXJyZWRcbiAgICAgICAgaWYgKHRoaXMuZmlyc3RVcGRhdGUpIHtcbiAgICAgICAgICAgIGlmKHRoaXMubGluZW5vICYmIHRoaXMuY29sbm8pIHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlICs9ICcgW0xpbmUgJyArIHRoaXMubGluZW5vICsgJywgQ29sdW1uICcgKyB0aGlzLmNvbG5vICsgJ10nO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZih0aGlzLmxpbmVubykge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyBbTGluZSAnICsgdGhpcy5saW5lbm8gKyAnXSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBtZXNzYWdlICs9ICdcXG4gJztcbiAgICAgICAgaWYgKHRoaXMuZmlyc3RVcGRhdGUpIHtcbiAgICAgICAgICAgIG1lc3NhZ2UgKz0gJyAnO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZSArICh0aGlzLm1lc3NhZ2UgfHwgJycpO1xuICAgICAgICB0aGlzLmZpcnN0VXBkYXRlID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICByZXR1cm4gZXJyO1xufTtcblxuZXhwb3J0cy5UZW1wbGF0ZUVycm9yLnByb3RvdHlwZSA9IEVycm9yLnByb3RvdHlwZTtcblxuZXhwb3J0cy5lc2NhcGUgPSBmdW5jdGlvbih2YWwpIHtcbiAgcmV0dXJuIHZhbC5yZXBsYWNlKGVzY2FwZVJlZ2V4LCBsb29rdXBFc2NhcGUpO1xufTtcblxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcbn07XG5cbmV4cG9ydHMuaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIE9ialByb3RvLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbmV4cG9ydHMuaXNTdHJpbmcgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBTdHJpbmddJztcbn07XG5cbmV4cG9ydHMuaXNPYmplY3QgPSBmdW5jdGlvbihvYmopIHtcbiAgICByZXR1cm4gT2JqUHJvdG8udG9TdHJpbmcuY2FsbChvYmopID09PSAnW29iamVjdCBPYmplY3RdJztcbn07XG5cbmV4cG9ydHMuZ3JvdXBCeSA9IGZ1bmN0aW9uKG9iaiwgdmFsKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIHZhciBpdGVyYXRvciA9IGV4cG9ydHMuaXNGdW5jdGlvbih2YWwpID8gdmFsIDogZnVuY3Rpb24ob2JqKSB7IHJldHVybiBvYmpbdmFsXTsgfTtcbiAgICBmb3IodmFyIGk9MDsgaTxvYmoubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHZhbHVlID0gb2JqW2ldO1xuICAgICAgICB2YXIga2V5ID0gaXRlcmF0b3IodmFsdWUsIGkpO1xuICAgICAgICAocmVzdWx0W2tleV0gfHwgKHJlc3VsdFtrZXldID0gW10pKS5wdXNoKHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbmV4cG9ydHMudG9BcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChvYmopO1xufTtcblxuZXhwb3J0cy53aXRob3V0ID0gZnVuY3Rpb24oYXJyYXkpIHtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgaWYgKCFhcnJheSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICB2YXIgaW5kZXggPSAtMSxcbiAgICBsZW5ndGggPSBhcnJheS5sZW5ndGgsXG4gICAgY29udGFpbnMgPSBleHBvcnRzLnRvQXJyYXkoYXJndW1lbnRzKS5zbGljZSgxKTtcblxuICAgIHdoaWxlKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICAgICAgaWYoZXhwb3J0cy5pbmRleE9mKGNvbnRhaW5zLCBhcnJheVtpbmRleF0pID09PSAtMSkge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goYXJyYXlbaW5kZXhdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxuZXhwb3J0cy5leHRlbmQgPSBmdW5jdGlvbihvYmosIG9iajIpIHtcbiAgICBmb3IodmFyIGsgaW4gb2JqMikge1xuICAgICAgICBvYmpba10gPSBvYmoyW2tdO1xuICAgIH1cbiAgICByZXR1cm4gb2JqO1xufTtcblxuZXhwb3J0cy5yZXBlYXQgPSBmdW5jdGlvbihjaGFyXywgbikge1xuICAgIHZhciBzdHIgPSAnJztcbiAgICBmb3IodmFyIGk9MDsgaTxuOyBpKyspIHtcbiAgICAgICAgc3RyICs9IGNoYXJfO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufTtcblxuZXhwb3J0cy5lYWNoID0gZnVuY3Rpb24ob2JqLCBmdW5jLCBjb250ZXh0KSB7XG4gICAgaWYob2JqID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmKEFycmF5UHJvdG8uZWFjaCAmJiBvYmouZWFjaCA9PT0gQXJyYXlQcm90by5lYWNoKSB7XG4gICAgICAgIG9iai5mb3JFYWNoKGZ1bmMsIGNvbnRleHQpO1xuICAgIH1cbiAgICBlbHNlIGlmKG9iai5sZW5ndGggPT09ICtvYmoubGVuZ3RoKSB7XG4gICAgICAgIGZvcih2YXIgaT0wLCBsPW9iai5sZW5ndGg7IGk8bDsgaSsrKSB7XG4gICAgICAgICAgICBmdW5jLmNhbGwoY29udGV4dCwgb2JqW2ldLCBpLCBvYmopO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuZXhwb3J0cy5tYXAgPSBmdW5jdGlvbihvYmosIGZ1bmMpIHtcbiAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgIGlmKG9iaiA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cblxuICAgIGlmKEFycmF5UHJvdG8ubWFwICYmIG9iai5tYXAgPT09IEFycmF5UHJvdG8ubWFwKSB7XG4gICAgICAgIHJldHVybiBvYmoubWFwKGZ1bmMpO1xuICAgIH1cblxuICAgIGZvcih2YXIgaT0wOyBpPG9iai5sZW5ndGg7IGkrKykge1xuICAgICAgICByZXN1bHRzW3Jlc3VsdHMubGVuZ3RoXSA9IGZ1bmMob2JqW2ldLCBpKTtcbiAgICB9XG5cbiAgICBpZihvYmoubGVuZ3RoID09PSArb2JqLmxlbmd0aCkge1xuICAgICAgICByZXN1bHRzLmxlbmd0aCA9IG9iai5sZW5ndGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdHM7XG59O1xuXG5leHBvcnRzLmFzeW5jSXRlciA9IGZ1bmN0aW9uKGFyciwgaXRlciwgY2IpIHtcbiAgICB2YXIgaSA9IC0xO1xuXG4gICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgaSsrO1xuXG4gICAgICAgIGlmKGkgPCBhcnIubGVuZ3RoKSB7XG4gICAgICAgICAgICBpdGVyKGFycltpXSwgaSwgbmV4dCwgY2IpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5leHQoKTtcbn07XG5cbmV4cG9ydHMuYXN5bmNGb3IgPSBmdW5jdGlvbihvYmosIGl0ZXIsIGNiKSB7XG4gICAgdmFyIGtleXMgPSBleHBvcnRzLmtleXMob2JqKTtcbiAgICB2YXIgbGVuID0ga2V5cy5sZW5ndGg7XG4gICAgdmFyIGkgPSAtMTtcblxuICAgIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgdmFyIGsgPSBrZXlzW2ldO1xuXG4gICAgICAgIGlmKGkgPCBsZW4pIHtcbiAgICAgICAgICAgIGl0ZXIoaywgb2JqW2tdLCBpLCBsZW4sIG5leHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5leHQoKTtcbn07XG5cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL0FycmF5L2luZGV4T2YjUG9seWZpbGxcbmV4cG9ydHMuaW5kZXhPZiA9IEFycmF5LnByb3RvdHlwZS5pbmRleE9mID9cbiAgICBmdW5jdGlvbiAoYXJyLCBzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoYXJyLCBzZWFyY2hFbGVtZW50LCBmcm9tSW5kZXgpO1xuICAgIH0gOlxuICAgIGZ1bmN0aW9uIChhcnIsIHNlYXJjaEVsZW1lbnQsIGZyb21JbmRleCkge1xuICAgICAgICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGggPj4+IDA7IC8vIEhhY2sgdG8gY29udmVydCBvYmplY3QubGVuZ3RoIHRvIGEgVUludDMyXG5cbiAgICAgICAgZnJvbUluZGV4ID0gK2Zyb21JbmRleCB8fCAwO1xuXG4gICAgICAgIGlmKE1hdGguYWJzKGZyb21JbmRleCkgPT09IEluZmluaXR5KSB7XG4gICAgICAgICAgICBmcm9tSW5kZXggPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoZnJvbUluZGV4IDwgMCkge1xuICAgICAgICAgICAgZnJvbUluZGV4ICs9IGxlbmd0aDtcbiAgICAgICAgICAgIGlmIChmcm9tSW5kZXggPCAwKSB7XG4gICAgICAgICAgICAgICAgZnJvbUluZGV4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvcig7ZnJvbUluZGV4IDwgbGVuZ3RoOyBmcm9tSW5kZXgrKykge1xuICAgICAgICAgICAgaWYgKGFycltmcm9tSW5kZXhdID09PSBzZWFyY2hFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZyb21JbmRleDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9O1xuXG5pZighQXJyYXkucHJvdG90eXBlLm1hcCkge1xuICAgIEFycmF5LnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYXAgaXMgdW5pbXBsZW1lbnRlZCBmb3IgdGhpcyBqcyBlbmdpbmUnKTtcbiAgICB9O1xufVxuXG5leHBvcnRzLmtleXMgPSBmdW5jdGlvbihvYmopIHtcbiAgICBpZihPYmplY3QucHJvdG90eXBlLmtleXMpIHtcbiAgICAgICAgcmV0dXJuIG9iai5rZXlzKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIga2V5cyA9IFtdO1xuICAgICAgICBmb3IodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZihvYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGtleXM7XG4gICAgfVxufVxufSkoKTtcbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0JztcblxudmFyIGxpYiA9IG1vZHVsZXNbXCJsaWJcIl07XG52YXIgT2JqID0gbW9kdWxlc1tcIm9iamVjdFwiXTtcblxuLy8gRnJhbWVzIGtlZXAgdHJhY2sgb2Ygc2NvcGluZyBib3RoIGF0IGNvbXBpbGUtdGltZSBhbmQgcnVuLXRpbWUgc29cbi8vIHdlIGtub3cgaG93IHRvIGFjY2VzcyB2YXJpYWJsZXMuIEJsb2NrIHRhZ3MgY2FuIGludHJvZHVjZSBzcGVjaWFsXG4vLyB2YXJpYWJsZXMsIGZvciBleGFtcGxlLlxudmFyIEZyYW1lID0gT2JqLmV4dGVuZCh7XG4gICAgaW5pdDogZnVuY3Rpb24ocGFyZW50KSB7XG4gICAgICAgIHRoaXMudmFyaWFibGVzID0ge307XG4gICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIH0sXG5cbiAgICBzZXQ6IGZ1bmN0aW9uKG5hbWUsIHZhbCwgcmVzb2x2ZVVwKSB7XG4gICAgICAgIC8vIEFsbG93IHZhcmlhYmxlcyB3aXRoIGRvdHMgYnkgYXV0b21hdGljYWxseSBjcmVhdGluZyB0aGVcbiAgICAgICAgLy8gbmVzdGVkIHN0cnVjdHVyZVxuICAgICAgICB2YXIgcGFydHMgPSBuYW1lLnNwbGl0KCcuJyk7XG4gICAgICAgIHZhciBvYmogPSB0aGlzLnZhcmlhYmxlcztcbiAgICAgICAgdmFyIGZyYW1lID0gdGhpcztcblxuICAgICAgICBpZihyZXNvbHZlVXApIHtcbiAgICAgICAgICAgIGlmKChmcmFtZSA9IHRoaXMucmVzb2x2ZShwYXJ0c1swXSkpKSB7XG4gICAgICAgICAgICAgICAgZnJhbWUuc2V0KG5hbWUsIHZhbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZnJhbWUgPSB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKHZhciBpPTA7IGk8cGFydHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaWQgPSBwYXJ0c1tpXTtcblxuICAgICAgICAgICAgaWYoIW9ialtpZF0pIHtcbiAgICAgICAgICAgICAgICBvYmpbaWRdID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvYmogPSBvYmpbaWRdO1xuICAgICAgICB9XG5cbiAgICAgICAgb2JqW3BhcnRzW3BhcnRzLmxlbmd0aCAtIDFdXSA9IHZhbDtcbiAgICB9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHZhciB2YWwgPSB0aGlzLnZhcmlhYmxlc1tuYW1lXTtcbiAgICAgICAgaWYodmFsICE9PSB1bmRlZmluZWQgJiYgdmFsICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICBsb29rdXA6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLnBhcmVudDtcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFyaWFibGVzW25hbWVdO1xuICAgICAgICBpZih2YWwgIT09IHVuZGVmaW5lZCAmJiB2YWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHAgJiYgcC5sb29rdXAobmFtZSk7XG4gICAgfSxcblxuICAgIHJlc29sdmU6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLnBhcmVudDtcbiAgICAgICAgdmFyIHZhbCA9IHRoaXMudmFyaWFibGVzW25hbWVdO1xuICAgICAgICBpZih2YWwgIT09IHVuZGVmaW5lZCAmJiB2YWwgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwICYmIHAucmVzb2x2ZShuYW1lKTtcbiAgICB9LFxuXG4gICAgcHVzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgRnJhbWUodGhpcyk7XG4gICAgfSxcblxuICAgIHBvcDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcmVudDtcbiAgICB9XG59KTtcblxuZnVuY3Rpb24gbWFrZU1hY3JvKGFyZ05hbWVzLCBrd2FyZ05hbWVzLCBmdW5jKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgYXJnQ291bnQgPSBudW1BcmdzKGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBhcmdzO1xuICAgICAgICB2YXIga3dhcmdzID0gZ2V0S2V5d29yZEFyZ3MoYXJndW1lbnRzKTtcblxuICAgICAgICBpZihhcmdDb3VudCA+IGFyZ05hbWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCwgYXJnTmFtZXMubGVuZ3RoKTtcblxuICAgICAgICAgICAgLy8gUG9zaXRpb25hbCBhcmd1bWVudHMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIGluIGFzXG4gICAgICAgICAgICAvLyBrZXl3b3JkIGFyZ3VtZW50cyAoZXNzZW50aWFsbHkgZGVmYXVsdCB2YWx1ZXMpXG4gICAgICAgICAgICB2YXIgdmFscyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgYXJncy5sZW5ndGgsIGFyZ0NvdW50KTtcbiAgICAgICAgICAgIGZvcih2YXIgaT0wOyBpPHZhbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZihpIDwga3dhcmdOYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAga3dhcmdzW2t3YXJnTmFtZXNbaV1dID0gdmFsc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFyZ3MucHVzaChrd2FyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoYXJnQ291bnQgPCBhcmdOYW1lcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDAsIGFyZ0NvdW50KTtcblxuICAgICAgICAgICAgZm9yKHZhciBpPWFyZ0NvdW50OyBpPGFyZ05hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZyA9IGFyZ05hbWVzW2ldO1xuXG4gICAgICAgICAgICAgICAgLy8gS2V5d29yZCBhcmd1bWVudHMgdGhhdCBzaG91bGQgYmUgcGFzc2VkIGFzXG4gICAgICAgICAgICAgICAgLy8gcG9zaXRpb25hbCBhcmd1bWVudHMsIGkuZS4gdGhlIGNhbGxlciBleHBsaWNpdGx5XG4gICAgICAgICAgICAgICAgLy8gdXNlZCB0aGUgbmFtZSBvZiBhIHBvc2l0aW9uYWwgYXJnXG4gICAgICAgICAgICAgICAgYXJncy5wdXNoKGt3YXJnc1thcmddKTtcbiAgICAgICAgICAgICAgICBkZWxldGUga3dhcmdzW2FyZ107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFyZ3MucHVzaChrd2FyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIG1ha2VLZXl3b3JkQXJncyhvYmopIHtcbiAgICBvYmouX19rZXl3b3JkcyA9IHRydWU7XG4gICAgcmV0dXJuIG9iajtcbn1cblxuZnVuY3Rpb24gZ2V0S2V5d29yZEFyZ3MoYXJncykge1xuICAgIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgICBpZihsZW4pIHtcbiAgICAgICAgdmFyIGxhc3RBcmcgPSBhcmdzW2xlbiAtIDFdO1xuICAgICAgICBpZihsYXN0QXJnICYmIGxhc3RBcmcuaGFzT3duUHJvcGVydHkoJ19fa2V5d29yZHMnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGxhc3RBcmc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHt9O1xufVxuXG5mdW5jdGlvbiBudW1BcmdzKGFyZ3MpIHtcbiAgICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gICAgaWYobGVuID09PSAwKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cblxuICAgIHZhciBsYXN0QXJnID0gYXJnc1tsZW4gLSAxXTtcbiAgICBpZihsYXN0QXJnICYmIGxhc3RBcmcuaGFzT3duUHJvcGVydHkoJ19fa2V5d29yZHMnKSkge1xuICAgICAgICByZXR1cm4gbGVuIC0gMTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBsZW47XG4gICAgfVxufVxuXG4vLyBBIFNhZmVTdHJpbmcgb2JqZWN0IGluZGljYXRlcyB0aGF0IHRoZSBzdHJpbmcgc2hvdWxkIG5vdCBiZVxuLy8gYXV0b2VzY2FwZWQuIFRoaXMgaGFwcGVucyBtYWdpY2FsbHkgYmVjYXVzZSBhdXRvZXNjYXBpbmcgb25seVxuLy8gb2NjdXJzIG9uIHByaW1pdGl2ZSBzdHJpbmcgb2JqZWN0cy5cbmZ1bmN0aW9uIFNhZmVTdHJpbmcodmFsKSB7XG4gICAgaWYodHlwZW9mIHZhbCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9XG5cbiAgICB0aGlzLnZhbCA9IHZhbDtcbn1cblxuU2FmZVN0cmluZy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFN0cmluZy5wcm90b3R5cGUpO1xuU2FmZVN0cmluZy5wcm90b3R5cGUudmFsdWVPZiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnZhbDtcbn07XG5TYWZlU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnZhbDtcbn07XG5cbmZ1bmN0aW9uIGNvcHlTYWZlbmVzcyhkZXN0LCB0YXJnZXQpIHtcbiAgICBpZihkZXN0IGluc3RhbmNlb2YgU2FmZVN0cmluZykge1xuICAgICAgICByZXR1cm4gbmV3IFNhZmVTdHJpbmcodGFyZ2V0KTtcbiAgICB9XG4gICAgcmV0dXJuIHRhcmdldC50b1N0cmluZygpO1xufVxuXG5mdW5jdGlvbiBtYXJrU2FmZSh2YWwpIHtcbiAgICB2YXIgdHlwZSA9IHR5cGVvZiB2YWw7XG5cbiAgICBpZih0eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICByZXR1cm4gbmV3IFNhZmVTdHJpbmcodmFsKTtcbiAgICB9XG4gICAgZWxzZSBpZih0eXBlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiB2YWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcmV0ID0gdmFsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgIGlmKHR5cGVvZiByZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBTYWZlU3RyaW5nKHJldCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzdXBwcmVzc1ZhbHVlKHZhbCwgYXV0b2VzY2FwZSkge1xuICAgIHZhbCA9ICh2YWwgIT09IHVuZGVmaW5lZCAmJiB2YWwgIT09IG51bGwpID8gdmFsIDogJyc7XG5cbiAgICBpZihhdXRvZXNjYXBlICYmIHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHZhbCA9IGxpYi5lc2NhcGUodmFsKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsO1xufVxuXG5mdW5jdGlvbiBtZW1iZXJMb29rdXAob2JqLCB2YWwpIHtcbiAgICBvYmogPSBvYmogfHwge307XG5cbiAgICBpZih0eXBlb2Ygb2JqW3ZhbF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9ialt2YWxdLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqW3ZhbF07XG59XG5cbmZ1bmN0aW9uIGNhbGxXcmFwKG9iaiwgbmFtZSwgYXJncykge1xuICAgIGlmKCFvYmopIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gY2FsbCBgJyArIG5hbWUgKyAnYCwgd2hpY2ggaXMgdW5kZWZpbmVkIG9yIGZhbHNleScpO1xuICAgIH1cbiAgICBlbHNlIGlmKHR5cGVvZiBvYmogIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gY2FsbCBgJyArIG5hbWUgKyAnYCwgd2hpY2ggaXMgbm90IGEgZnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqLmFwcGx5KHRoaXMsIGFyZ3MpO1xufVxuXG5mdW5jdGlvbiBjb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgbmFtZSkge1xuICAgIHZhciB2YWwgPSBmcmFtZS5sb29rdXAobmFtZSk7XG4gICAgcmV0dXJuICh2YWwgIT09IHVuZGVmaW5lZCAmJiB2YWwgIT09IG51bGwpID9cbiAgICAgICAgdmFsIDpcbiAgICAgICAgY29udGV4dC5sb29rdXAobmFtZSk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZUVycm9yKGVycm9yLCBsaW5lbm8sIGNvbG5vKSB7XG4gICAgaWYoZXJyb3IubGluZW5vKSB7XG4gICAgICAgIHJldHVybiBlcnJvcjtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBuZXcgbGliLlRlbXBsYXRlRXJyb3IoZXJyb3IsIGxpbmVubywgY29sbm8pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gYXN5bmNFYWNoKGFyciwgZGltZW4sIGl0ZXIsIGNiKSB7XG4gICAgaWYobGliLmlzQXJyYXkoYXJyKSkge1xuICAgICAgICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcblxuICAgICAgICBsaWIuYXN5bmNJdGVyKGFyciwgZnVuY3Rpb24oaXRlbSwgaSwgbmV4dCkge1xuICAgICAgICAgICAgc3dpdGNoKGRpbWVuKSB7XG4gICAgICAgICAgICBjYXNlIDE6IGl0ZXIoaXRlbSwgaSwgbGVuLCBuZXh0KTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDI6IGl0ZXIoaXRlbVswXSwgaXRlbVsxXSwgaSwgbGVuLCBuZXh0KTsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM6IGl0ZXIoaXRlbVswXSwgaXRlbVsxXSwgaXRlbVsyXSwgaSwgbGVuLCBuZXh0KTsgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGl0ZW0ucHVzaChpLCBuZXh0KTtcbiAgICAgICAgICAgICAgICBpdGVyLmFwcGx5KHRoaXMsIGl0ZW0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBjYik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBsaWIuYXN5bmNGb3IoYXJyLCBmdW5jdGlvbihrZXksIHZhbCwgaSwgbGVuLCBuZXh0KSB7XG4gICAgICAgICAgICBpdGVyKGtleSwgdmFsLCBpLCBsZW4sIG5leHQpO1xuICAgICAgICB9LCBjYik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhc3luY0FsbChhcnIsIGRpbWVuLCBmdW5jLCBjYikge1xuICAgIHZhciBmaW5pc2hlZCA9IDA7XG4gICAgdmFyIGxlbjtcbiAgICB2YXIgb3V0cHV0QXJyO1xuXG4gICAgZnVuY3Rpb24gZG9uZShpLCBvdXRwdXQpIHtcbiAgICAgICAgZmluaXNoZWQrKztcbiAgICAgICAgb3V0cHV0QXJyW2ldID0gb3V0cHV0O1xuXG4gICAgICAgIGlmKGZpbmlzaGVkID09PSBsZW4pIHtcbiAgICAgICAgICAgIGNiKG51bGwsIG91dHB1dEFyci5qb2luKCcnKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZihsaWIuaXNBcnJheShhcnIpKSB7XG4gICAgICAgIGxlbiA9IGFyci5sZW5ndGg7XG4gICAgICAgIG91dHB1dEFyciA9IG5ldyBBcnJheShsZW4pO1xuXG4gICAgICAgIGlmKGxlbiA9PT0gMCkge1xuICAgICAgICAgICAgY2IobnVsbCwgJycpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yKHZhciBpPTA7IGk8YXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGl0ZW0gPSBhcnJbaV07XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2goZGltZW4pIHtcbiAgICAgICAgICAgICAgICBjYXNlIDE6IGZ1bmMoaXRlbSwgaSwgbGVuLCBkb25lKTsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAyOiBmdW5jKGl0ZW1bMF0sIGl0ZW1bMV0sIGksIGxlbiwgZG9uZSk7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgMzogZnVuYyhpdGVtWzBdLCBpdGVtWzFdLCBpdGVtWzJdLCBpLCBsZW4sIGRvbmUpOyBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBpdGVtLnB1c2goaSwgZG9uZSk7XG4gICAgICAgICAgICAgICAgICAgIGZ1bmMuYXBwbHkodGhpcywgaXRlbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIga2V5cyA9IGxpYi5rZXlzKGFycik7XG4gICAgICAgIGxlbiA9IGtleXMubGVuZ3RoO1xuICAgICAgICBvdXRwdXRBcnIgPSBuZXcgQXJyYXkobGVuKTtcblxuICAgICAgICBpZihsZW4gPT09IDApIHtcbiAgICAgICAgICAgIGNiKG51bGwsICcnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGZvcih2YXIgaT0wOyBpPGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgayA9IGtleXNbaV07XG4gICAgICAgICAgICAgICAgZnVuYyhrLCBhcnJba10sIGksIGxlbiwgZG9uZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZXNbJ3J1bnRpbWUnXSA9IHtcbiAgICBGcmFtZTogRnJhbWUsXG4gICAgbWFrZU1hY3JvOiBtYWtlTWFjcm8sXG4gICAgbWFrZUtleXdvcmRBcmdzOiBtYWtlS2V5d29yZEFyZ3MsXG4gICAgbnVtQXJnczogbnVtQXJncyxcbiAgICBzdXBwcmVzc1ZhbHVlOiBzdXBwcmVzc1ZhbHVlLFxuICAgIG1lbWJlckxvb2t1cDogbWVtYmVyTG9va3VwLFxuICAgIGNvbnRleHRPckZyYW1lTG9va3VwOiBjb250ZXh0T3JGcmFtZUxvb2t1cCxcbiAgICBjYWxsV3JhcDogY2FsbFdyYXAsXG4gICAgaGFuZGxlRXJyb3I6IGhhbmRsZUVycm9yLFxuICAgIGlzQXJyYXk6IGxpYi5pc0FycmF5LFxuICAgIGtleXM6IGxpYi5rZXlzLFxuICAgIFNhZmVTdHJpbmc6IFNhZmVTdHJpbmcsXG4gICAgY29weVNhZmVuZXNzOiBjb3B5U2FmZW5lc3MsXG4gICAgbWFya1NhZmU6IG1hcmtTYWZlLFxuICAgIGFzeW5jRWFjaDogYXN5bmNFYWNoLFxuICAgIGFzeW5jQWxsOiBhc3luY0FsbFxufTtcbn0pKCk7XG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBwYXRoID0gbW9kdWxlc1tcInBhdGhcIl07XG52YXIgT2JqID0gbW9kdWxlc1tcIm9iamVjdFwiXTtcbnZhciBsaWIgPSBtb2R1bGVzW1wibGliXCJdO1xuXG52YXIgTG9hZGVyID0gT2JqLmV4dGVuZCh7XG4gICAgb246IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpIHtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycyB8fCB7fTtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnNbbmFtZV0gPSB0aGlzLmxpc3RlbmVyc1tuYW1lXSB8fCBbXTtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnNbbmFtZV0ucHVzaChmdW5jKTtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24obmFtZSAvKiwgYXJnMSwgYXJnMiwgLi4uKi8pIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgICAgIGlmKHRoaXMubGlzdGVuZXJzICYmIHRoaXMubGlzdGVuZXJzW25hbWVdKSB7XG4gICAgICAgICAgICBsaWIuZWFjaCh0aGlzLmxpc3RlbmVyc1tuYW1lXSwgZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHJlc29sdmU6IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gICAgICAgIHJldHVybiBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKGZyb20pLCB0byk7XG4gICAgfSxcblxuICAgIGlzUmVsYXRpdmU6IGZ1bmN0aW9uKGZpbGVuYW1lKSB7XG4gICAgICAgIHJldHVybiAoZmlsZW5hbWUuaW5kZXhPZignLi8nKSA9PT0gMCB8fCBmaWxlbmFtZS5pbmRleE9mKCcuLi8nKSA9PT0gMCk7XG4gICAgfVxufSk7XG5cbm1vZHVsZXNbJ2xvYWRlciddID0gTG9hZGVyO1xufSkoKTtcbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0JztcblxudmFyIExvYWRlciA9IG1vZHVsZXNbXCJsb2FkZXJcIl07XG5cbnZhciBXZWJMb2FkZXIgPSBMb2FkZXIuZXh0ZW5kKHtcbiAgICBpbml0OiBmdW5jdGlvbihiYXNlVVJMLCBuZXZlclVwZGF0ZSkge1xuICAgICAgICAvLyBJdCdzIGVhc3kgdG8gdXNlIHByZWNvbXBpbGVkIHRlbXBsYXRlczoganVzdCBpbmNsdWRlIHRoZW1cbiAgICAgICAgLy8gYmVmb3JlIHlvdSBjb25maWd1cmUgbnVuanVja3MgYW5kIHRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5XG4gICAgICAgIC8vIHBpY2sgaXQgdXAgYW5kIHVzZSBpdFxuICAgICAgICB0aGlzLnByZWNvbXBpbGVkID0gd2luZG93Lm51bmp1Y2tzUHJlY29tcGlsZWQgfHwge307XG5cbiAgICAgICAgdGhpcy5iYXNlVVJMID0gYmFzZVVSTCB8fCAnJztcbiAgICAgICAgdGhpcy5uZXZlclVwZGF0ZSA9IG5ldmVyVXBkYXRlO1xuICAgIH0sXG5cbiAgICBnZXRTb3VyY2U6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgaWYodGhpcy5wcmVjb21waWxlZFtuYW1lXSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzcmM6IHsgdHlwZTogJ2NvZGUnLFxuICAgICAgICAgICAgICAgICAgICAgICBvYmo6IHRoaXMucHJlY29tcGlsZWRbbmFtZV0gfSxcbiAgICAgICAgICAgICAgICBwYXRoOiBuYW1lXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHNyYyA9IHRoaXMuZmV0Y2godGhpcy5iYXNlVVJMICsgJy8nICsgbmFtZSk7XG4gICAgICAgICAgICBpZighc3JjKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB7IHNyYzogc3JjLFxuICAgICAgICAgICAgICAgICAgICAgcGF0aDogbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgIG5vQ2FjaGU6ICF0aGlzLm5ldmVyVXBkYXRlIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZmV0Y2g6IGZ1bmN0aW9uKHVybCwgY2FsbGJhY2spIHtcbiAgICAgICAgLy8gT25seSBpbiB0aGUgYnJvd3NlciBwbGVhc2VcbiAgICAgICAgdmFyIGFqYXg7XG4gICAgICAgIHZhciBsb2FkaW5nID0gdHJ1ZTtcbiAgICAgICAgdmFyIHNyYztcblxuICAgICAgICBpZih3aW5kb3cuWE1MSHR0cFJlcXVlc3QpIHsgLy8gTW96aWxsYSwgU2FmYXJpLCAuLi5cbiAgICAgICAgICAgIGFqYXggPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKHdpbmRvdy5BY3RpdmVYT2JqZWN0KSB7IC8vIElFIDggYW5kIG9sZGVyXG4gICAgICAgICAgICBhamF4ID0gbmV3IEFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJyk7XG4gICAgICAgIH1cblxuICAgICAgICBhamF4Lm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYoYWpheC5yZWFkeVN0YXRlID09PSA0ICYmIChhamF4LnN0YXR1cyA9PT0gMCB8fCBhamF4LnN0YXR1cyA9PT0gMjAwKSAmJiBsb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgbG9hZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHNyYyA9IGFqYXgucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHVybCArPSAodXJsLmluZGV4T2YoJz8nKSA9PT0gLTEgPyAnPycgOiAnJicpICsgJ3M9JyArXG4gICAgICAgICAgICAgICAobmV3IERhdGUoKS5nZXRUaW1lKCkpO1xuXG4gICAgICAgIC8vIFN5bmNocm9ub3VzIGJlY2F1c2UgdGhpcyBBUEkgc2hvdWxkbid0IGJlIHVzZWQgaW5cbiAgICAgICAgLy8gcHJvZHVjdGlvbiAocHJlLWxvYWQgY29tcGlsZWQgdGVtcGxhdGVzIGluc3RlYWQpXG4gICAgICAgIGFqYXgub3BlbignR0VUJywgdXJsLCBmYWxzZSk7XG4gICAgICAgIGFqYXguc2VuZCgpO1xuXG4gICAgICAgIHJldHVybiBzcmM7XG4gICAgfVxufSk7XG5cbm1vZHVsZXNbJ3dlYi1sb2FkZXJzJ10gPSB7XG4gICAgV2ViTG9hZGVyOiBXZWJMb2FkZXJcbn07XG59KSgpO1xuKGZ1bmN0aW9uKCkge1xuaWYodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcgfHwgd2luZG93ICE9PSB0aGlzKSB7XG4gICAgbW9kdWxlc1snbG9hZGVycyddID0gbW9kdWxlc1tcIm5vZGUtbG9hZGVyc1wiXTtcbn1cbmVsc2Uge1xuICAgIG1vZHVsZXNbJ2xvYWRlcnMnXSA9IG1vZHVsZXNbXCJ3ZWItbG9hZGVyc1wiXTtcbn1cbn0pKCk7XG4oZnVuY3Rpb24oKSB7XG4ndXNlIHN0cmljdCc7XG5cbnZhciBsaWIgPSBtb2R1bGVzW1wibGliXCJdO1xudmFyIHIgPSBtb2R1bGVzW1wicnVudGltZVwiXTtcblxudmFyIGZpbHRlcnMgPSB7XG4gICAgYWJzOiBmdW5jdGlvbihuKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmFicyhuKTtcbiAgICB9LFxuXG4gICAgYmF0Y2g6IGZ1bmN0aW9uKGFyciwgbGluZWNvdW50LCBmaWxsX3dpdGgpIHtcbiAgICAgICAgdmFyIHJlcyA9IFtdO1xuICAgICAgICB2YXIgdG1wID0gW107XG5cbiAgICAgICAgZm9yKHZhciBpPTA7IGk8YXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZihpICUgbGluZWNvdW50ID09PSAwICYmIHRtcC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXMucHVzaCh0bXApO1xuICAgICAgICAgICAgICAgIHRtcCA9IFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0bXAucHVzaChhcnJbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodG1wLmxlbmd0aCkge1xuICAgICAgICAgICAgaWYoZmlsbF93aXRoKSB7XG4gICAgICAgICAgICAgICAgZm9yKHZhciBpPXRtcC5sZW5ndGg7IGk8bGluZWNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdG1wLnB1c2goZmlsbF93aXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlcy5wdXNoKHRtcCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICBjYXBpdGFsaXplOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgdmFyIHJldCA9IHN0ci50b0xvd2VyQ2FzZSgpO1xuICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Moc3RyLCByZXQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyByZXQuc2xpY2UoMSkpO1xuICAgIH0sXG5cbiAgICBjZW50ZXI6IGZ1bmN0aW9uKHN0ciwgd2lkdGgpIHtcbiAgICAgICAgd2lkdGggPSB3aWR0aCB8fCA4MDtcblxuICAgICAgICBpZihzdHIubGVuZ3RoID49IHdpZHRoKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNwYWNlcyA9IHdpZHRoIC0gc3RyLmxlbmd0aDtcbiAgICAgICAgdmFyIHByZSA9IGxpYi5yZXBlYXQoJyAnLCBzcGFjZXMvMiAtIHNwYWNlcyAlIDIpO1xuICAgICAgICB2YXIgcG9zdCA9IGxpYi5yZXBlYXQoJyAnLCBzcGFjZXMvMik7XG4gICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHByZSArIHN0ciArIHBvc3QpO1xuICAgIH0sXG5cbiAgICAnZGVmYXVsdCc6IGZ1bmN0aW9uKHZhbCwgZGVmKSB7XG4gICAgICAgIHJldHVybiB2YWwgPyB2YWwgOiBkZWY7XG4gICAgfSxcblxuICAgIGRpY3Rzb3J0OiBmdW5jdGlvbih2YWwsIGNhc2Vfc2Vuc2l0aXZlLCBieSkge1xuICAgICAgICBpZiAoIWxpYi5pc09iamVjdCh2YWwpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoJ2RpY3Rzb3J0IGZpbHRlcjogdmFsIG11c3QgYmUgYW4gb2JqZWN0Jyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXJyYXkgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgayBpbiB2YWwpIHtcbiAgICAgICAgICAgIC8vIGRlbGliZXJhdGVseSBpbmNsdWRlIHByb3BlcnRpZXMgZnJvbSB0aGUgb2JqZWN0J3MgcHJvdG90eXBlXG4gICAgICAgICAgICBhcnJheS5wdXNoKFtrLHZhbFtrXV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHNpO1xuICAgICAgICBpZiAoYnkgPT09IHVuZGVmaW5lZCB8fCBieSA9PT0gJ2tleScpIHtcbiAgICAgICAgICAgIHNpID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChieSA9PT0gJ3ZhbHVlJykge1xuICAgICAgICAgICAgc2kgPSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IGxpYi5UZW1wbGF0ZUVycm9yKFxuICAgICAgICAgICAgICAgICdkaWN0c29ydCBmaWx0ZXI6IFlvdSBjYW4gb25seSBzb3J0IGJ5IGVpdGhlciBrZXkgb3IgdmFsdWUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFycmF5LnNvcnQoZnVuY3Rpb24odDEsIHQyKSB7XG4gICAgICAgICAgICB2YXIgYSA9IHQxW3NpXTtcbiAgICAgICAgICAgIHZhciBiID0gdDJbc2ldO1xuXG4gICAgICAgICAgICBpZiAoIWNhc2Vfc2Vuc2l0aXZlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGxpYi5pc1N0cmluZyhhKSkge1xuICAgICAgICAgICAgICAgICAgICBhID0gYS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAobGliLmlzU3RyaW5nKGIpKSB7XG4gICAgICAgICAgICAgICAgICAgIGIgPSBiLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYSA+IGIgPyAxIDogKGEgPT09IGIgPyAwIDogLTEpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfSxcblxuICAgIGVzY2FwZTogZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgIGlmKHR5cGVvZiBzdHIgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICAgIHN0ciBpbnN0YW5jZW9mIHIuU2FmZVN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIGxpYi5lc2NhcGUoc3RyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RyO1xuICAgIH0sXG5cbiAgICBzYWZlOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgcmV0dXJuIHIubWFya1NhZmUoc3RyKTtcbiAgICB9LFxuXG4gICAgZmlyc3Q6IGZ1bmN0aW9uKGFycikge1xuICAgICAgICByZXR1cm4gYXJyWzBdO1xuICAgIH0sXG5cbiAgICBncm91cGJ5OiBmdW5jdGlvbihhcnIsIGF0dHIpIHtcbiAgICAgICAgcmV0dXJuIGxpYi5ncm91cEJ5KGFyciwgYXR0cik7XG4gICAgfSxcblxuICAgIGluZGVudDogZnVuY3Rpb24oc3RyLCB3aWR0aCwgaW5kZW50Zmlyc3QpIHtcbiAgICAgICAgd2lkdGggPSB3aWR0aCB8fCA0O1xuICAgICAgICB2YXIgcmVzID0gJyc7XG4gICAgICAgIHZhciBsaW5lcyA9IHN0ci5zcGxpdCgnXFxuJyk7XG4gICAgICAgIHZhciBzcCA9IGxpYi5yZXBlYXQoJyAnLCB3aWR0aCk7XG5cbiAgICAgICAgZm9yKHZhciBpPTA7IGk8bGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmKGkgPT09IDAgJiYgIWluZGVudGZpcnN0KSB7XG4gICAgICAgICAgICAgICAgcmVzICs9IGxpbmVzW2ldICsgJ1xcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMgKz0gc3AgKyBsaW5lc1tpXSArICdcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcmVzKTtcbiAgICB9LFxuXG4gICAgam9pbjogZnVuY3Rpb24oYXJyLCBkZWwsIGF0dHIpIHtcbiAgICAgICAgZGVsID0gZGVsIHx8ICcnO1xuXG4gICAgICAgIGlmKGF0dHIpIHtcbiAgICAgICAgICAgIGFyciA9IGxpYi5tYXAoYXJyLCBmdW5jdGlvbih2KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZbYXR0cl07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcnIuam9pbihkZWwpO1xuICAgIH0sXG5cbiAgICBsYXN0OiBmdW5jdGlvbihhcnIpIHtcbiAgICAgICAgcmV0dXJuIGFyclthcnIubGVuZ3RoLTFdO1xuICAgIH0sXG5cbiAgICBsZW5ndGg6IGZ1bmN0aW9uKGFycikge1xuICAgICAgICByZXR1cm4gYXJyICE9PSB1bmRlZmluZWQgPyBhcnIubGVuZ3RoIDogMDtcbiAgICB9LFxuXG4gICAgbGlzdDogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIGlmKGxpYi5pc1N0cmluZyh2YWwpKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsLnNwbGl0KCcnKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKGxpYi5pc09iamVjdCh2YWwpKSB7XG4gICAgICAgICAgICB2YXIga2V5cyA9IFtdO1xuXG4gICAgICAgICAgICBpZihPYmplY3Qua2V5cykge1xuICAgICAgICAgICAgICAgIGtleXMgPSBPYmplY3Qua2V5cyh2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yKHZhciBrIGluIHZhbCkge1xuICAgICAgICAgICAgICAgICAgICBrZXlzLnB1c2goayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbGliLm1hcChrZXlzLCBmdW5jdGlvbihrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsga2V5OiBrLFxuICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWxba10gfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYobGliLmlzQXJyYXkodmFsKSkge1xuICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgbGliLlRlbXBsYXRlRXJyb3IoJ2xpc3QgZmlsdGVyOiB0eXBlIG5vdCBpdGVyYWJsZScpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGxvd2VyOiBmdW5jdGlvbihzdHIpIHtcbiAgICAgICAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpO1xuICAgIH0sXG5cbiAgICByYW5kb206IGZ1bmN0aW9uKGFycikge1xuICAgICAgICByZXR1cm4gYXJyW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFyci5sZW5ndGgpXTtcbiAgICB9LFxuXG4gICAgcmVqZWN0YXR0cjogZnVuY3Rpb24oYXJyLCBhdHRyKSB7XG4gICAgICByZXR1cm4gYXJyLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICByZXR1cm4gIWl0ZW1bYXR0cl07XG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgc2VsZWN0YXR0cjogZnVuY3Rpb24oYXJyLCBhdHRyKSB7XG4gICAgICByZXR1cm4gYXJyLmZpbHRlcihmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICByZXR1cm4gISFpdGVtW2F0dHJdO1xuICAgICAgfSk7XG4gICAgfSxcblxuICAgIHJlcGxhY2U6IGZ1bmN0aW9uKHN0ciwgb2xkLCBuZXdfLCBtYXhDb3VudCkge1xuICAgICAgICBpZiAob2xkIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyLnJlcGxhY2Uob2xkLCBuZXdfKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXMgPSBzdHI7XG4gICAgICAgIHZhciBsYXN0ID0gcmVzO1xuICAgICAgICB2YXIgY291bnQgPSAxO1xuICAgICAgICByZXMgPSByZXMucmVwbGFjZShvbGQsIG5ld18pO1xuXG4gICAgICAgIHdoaWxlKGxhc3QgIT09IHJlcykge1xuICAgICAgICAgICAgaWYoY291bnQgPj0gbWF4Q291bnQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGFzdCA9IHJlcztcbiAgICAgICAgICAgIHJlcyA9IHJlcy5yZXBsYWNlKG9sZCwgbmV3Xyk7XG4gICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgcmVzKTtcbiAgICB9LFxuXG4gICAgcmV2ZXJzZTogZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIHZhciBhcnI7XG4gICAgICAgIGlmKGxpYi5pc1N0cmluZyh2YWwpKSB7XG4gICAgICAgICAgICBhcnIgPSBmaWx0ZXJzLmxpc3QodmFsKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIENvcHkgaXRcbiAgICAgICAgICAgIGFyciA9IGxpYi5tYXAodmFsLCBmdW5jdGlvbih2KSB7IHJldHVybiB2OyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFyci5yZXZlcnNlKCk7XG5cbiAgICAgICAgaWYobGliLmlzU3RyaW5nKHZhbCkpIHtcbiAgICAgICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyh2YWwsIGFyci5qb2luKCcnKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9LFxuXG4gICAgcm91bmQ6IGZ1bmN0aW9uKHZhbCwgcHJlY2lzaW9uLCBtZXRob2QpIHtcbiAgICAgICAgcHJlY2lzaW9uID0gcHJlY2lzaW9uIHx8IDA7XG4gICAgICAgIHZhciBmYWN0b3IgPSBNYXRoLnBvdygxMCwgcHJlY2lzaW9uKTtcbiAgICAgICAgdmFyIHJvdW5kZXI7XG5cbiAgICAgICAgaWYobWV0aG9kID09PSAnY2VpbCcpIHtcbiAgICAgICAgICAgIHJvdW5kZXIgPSBNYXRoLmNlaWw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZihtZXRob2QgPT09ICdmbG9vcicpIHtcbiAgICAgICAgICAgIHJvdW5kZXIgPSBNYXRoLmZsb29yO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcm91bmRlciA9IE1hdGgucm91bmQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcm91bmRlcih2YWwgKiBmYWN0b3IpIC8gZmFjdG9yO1xuICAgIH0sXG5cbiAgICBzbGljZTogZnVuY3Rpb24oYXJyLCBzbGljZXMsIGZpbGxXaXRoKSB7XG4gICAgICAgIHZhciBzbGljZUxlbmd0aCA9IE1hdGguZmxvb3IoYXJyLmxlbmd0aCAvIHNsaWNlcyk7XG4gICAgICAgIHZhciBleHRyYSA9IGFyci5sZW5ndGggJSBzbGljZXM7XG4gICAgICAgIHZhciBvZmZzZXQgPSAwO1xuICAgICAgICB2YXIgcmVzID0gW107XG5cbiAgICAgICAgZm9yKHZhciBpPTA7IGk8c2xpY2VzOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBzdGFydCA9IG9mZnNldCArIGkgKiBzbGljZUxlbmd0aDtcbiAgICAgICAgICAgIGlmKGkgPCBleHRyYSkge1xuICAgICAgICAgICAgICAgIG9mZnNldCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGVuZCA9IG9mZnNldCArIChpICsgMSkgKiBzbGljZUxlbmd0aDtcblxuICAgICAgICAgICAgdmFyIHNsaWNlID0gYXJyLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgICAgICAgICAgaWYoZmlsbFdpdGggJiYgaSA+PSBleHRyYSkge1xuICAgICAgICAgICAgICAgIHNsaWNlLnB1c2goZmlsbFdpdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnB1c2goc2xpY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgc29ydDogZnVuY3Rpb24oYXJyLCByZXZlcnNlLCBjYXNlU2VucywgYXR0cikge1xuICAgICAgICAvLyBDb3B5IGl0XG4gICAgICAgIGFyciA9IGxpYi5tYXAoYXJyLCBmdW5jdGlvbih2KSB7IHJldHVybiB2OyB9KTtcblxuICAgICAgICBhcnIuc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICB2YXIgeCwgeTtcblxuICAgICAgICAgICAgaWYoYXR0cikge1xuICAgICAgICAgICAgICAgIHggPSBhW2F0dHJdO1xuICAgICAgICAgICAgICAgIHkgPSBiW2F0dHJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgeCA9IGE7XG4gICAgICAgICAgICAgICAgeSA9IGI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCFjYXNlU2VucyAmJiBsaWIuaXNTdHJpbmcoeCkgJiYgbGliLmlzU3RyaW5nKHkpKSB7XG4gICAgICAgICAgICAgICAgeCA9IHgudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB5ID0geS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZih4IDwgeSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXZlcnNlID8gMSA6IC0xO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZih4ID4geSkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXZlcnNlID8gLTE6IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9LFxuXG4gICAgc3RyaW5nOiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKG9iaiwgb2JqKTtcbiAgICB9LFxuXG4gICAgdGl0bGU6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICB2YXIgd29yZHMgPSBzdHIuc3BsaXQoJyAnKTtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHdvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB3b3Jkc1tpXSA9IGZpbHRlcnMuY2FwaXRhbGl6ZSh3b3Jkc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHIuY29weVNhZmVuZXNzKHN0ciwgd29yZHMuam9pbignICcpKTtcbiAgICB9LFxuXG4gICAgdHJpbTogZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgIHJldHVybiByLmNvcHlTYWZlbmVzcyhzdHIsIHN0ci5yZXBsYWNlKC9eXFxzKnxcXHMqJC9nLCAnJykpO1xuICAgIH0sXG5cbiAgICB0cnVuY2F0ZTogZnVuY3Rpb24oaW5wdXQsIGxlbmd0aCwga2lsbHdvcmRzLCBlbmQpIHtcbiAgICAgICAgdmFyIG9yaWcgPSBpbnB1dDtcbiAgICAgICAgbGVuZ3RoID0gbGVuZ3RoIHx8IDI1NTtcblxuICAgICAgICBpZiAoaW5wdXQubGVuZ3RoIDw9IGxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcblxuICAgICAgICBpZiAoa2lsbHdvcmRzKSB7XG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cmluZygwLCBsZW5ndGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGlkeCA9IGlucHV0Lmxhc3RJbmRleE9mKCcgJywgbGVuZ3RoKTtcbiAgICAgICAgICAgIGlmKGlkeCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBpZHggPSBsZW5ndGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyaW5nKDAsIGlkeCk7XG4gICAgICAgIH1cblxuICAgICAgICBpbnB1dCArPSAoZW5kICE9PSB1bmRlZmluZWQgJiYgZW5kICE9PSBudWxsKSA/IGVuZCA6ICcuLi4nO1xuICAgICAgICByZXR1cm4gci5jb3B5U2FmZW5lc3Mob3JpZywgaW5wdXQpO1xuICAgIH0sXG5cbiAgICB1cHBlcjogZnVuY3Rpb24oc3RyKSB7XG4gICAgICAgIHJldHVybiBzdHIudG9VcHBlckNhc2UoKTtcbiAgICB9LFxuXG4gICAgdXJsZW5jb2RlOiBmdW5jdGlvbihvYmopIHtcbiAgICAgICAgdmFyIGVuYyA9IGVuY29kZVVSSUNvbXBvbmVudDtcbiAgICAgICAgaWYgKGxpYi5pc1N0cmluZyhvYmopKSB7XG4gICAgICAgICAgICByZXR1cm4gZW5jKG9iaik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgcGFydHM7XG4gICAgICAgICAgICBpZiAobGliLmlzQXJyYXkob2JqKSkge1xuICAgICAgICAgICAgICAgIHBhcnRzID0gb2JqLm1hcChmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbmMoaXRlbVswXSkgKyAnPScgKyBlbmMoaXRlbVsxXSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFydHMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBrIGluIG9iaikge1xuICAgICAgICAgICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJ0cy5wdXNoKGVuYyhrKSArICc9JyArIGVuYyhvYmpba10pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwYXJ0cy5qb2luKCcmJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgdXJsaXplOiBmdW5jdGlvbihzdHIsIGxlbmd0aCwgbm9mb2xsb3cpIHtcbiAgICAgICAgaWYgKGlzTmFOKGxlbmd0aCkpIGxlbmd0aCA9IEluZmluaXR5O1xuXG4gICAgICAgIHZhciBub0ZvbGxvd0F0dHIgPSAobm9mb2xsb3cgPT09IHRydWUgPyAnIHJlbD1cIm5vZm9sbG93XCInIDogJycpO1xuXG4gICAgICAgIC8vIEZvciB0aGUgamluamEgcmVnZXhwLCBzZWVcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL21pdHN1aGlrby9qaW5qYTIvYmxvYi9mMTViODE0ZGNiYTZhYTEyYmM3NGQxZjdkMGM4ODFkNTVmNzEyNmJlL2ppbmphMi91dGlscy5weSNMMjAtTDIzXG4gICAgICAgIHZhciBwdW5jUkUgPSAvXig/OlxcKHw8fCZsdDspPyguKj8pKD86XFwufCx8XFwpfFxcbnwmZ3Q7KT8kLztcbiAgICAgICAgLy8gZnJvbSBodHRwOi8vYmxvZy5nZXJ2Lm5ldC8yMDExLzA1L2h0bWw1X2VtYWlsX2FkZHJlc3NfcmVnZXhwL1xuICAgICAgICB2YXIgZW1haWxSRSA9IC9eW1xcdy4hIyQlJicqK1xcLVxcLz0/XFxeYHt8fX5dK0BbYS16XFxkXFwtXSsoXFwuW2EtelxcZFxcLV0rKSskL2k7XG4gICAgICAgIHZhciBodHRwSHR0cHNSRSA9IC9eaHR0cHM/OlxcL1xcLy4qJC87XG4gICAgICAgIHZhciB3d3dSRSA9IC9ed3d3XFwuLztcbiAgICAgICAgdmFyIHRsZFJFID0gL1xcLig/Om9yZ3xuZXR8Y29tKSg/OlxcOnxcXC98JCkvO1xuXG4gICAgICAgIHZhciB3b3JkcyA9IHN0ci5zcGxpdCgvXFxzKy8pLmZpbHRlcihmdW5jdGlvbih3b3JkKSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHdvcmQgaGFzIG5vIGxlbmd0aCwgYmFpbC4gVGhpcyBjYW4gaGFwcGVuIGZvciBzdHIgd2l0aFxuICAgICAgICAgIC8vIHRyYWlsaW5nIHdoaXRlc3BhY2UuXG4gICAgICAgICAgcmV0dXJuIHdvcmQgJiYgd29yZC5sZW5ndGg7XG4gICAgICAgIH0pLm1hcChmdW5jdGlvbih3b3JkKSB7XG4gICAgICAgICAgdmFyIG1hdGNoZXMgPSB3b3JkLm1hdGNoKHB1bmNSRSk7XG5cblxuICAgICAgICAgIHZhciBwb3NzaWJsZVVybCA9IG1hdGNoZXMgJiYgbWF0Y2hlc1sxXSB8fCB3b3JkO1xuXG5cbiAgICAgICAgICAvLyB1cmwgdGhhdCBzdGFydHMgd2l0aCBodHRwIG9yIGh0dHBzXG4gICAgICAgICAgaWYgKGh0dHBIdHRwc1JFLnRlc3QocG9zc2libGVVcmwpKVxuICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiJyArIHBvc3NpYmxlVXJsICsgJ1wiJyArIG5vRm9sbG93QXR0ciArICc+JyArIHBvc3NpYmxlVXJsLnN1YnN0cigwLCBsZW5ndGgpICsgJzwvYT4nO1xuXG4gICAgICAgICAgLy8gdXJsIHRoYXQgc3RhcnRzIHdpdGggd3d3LlxuICAgICAgICAgIGlmICh3d3dSRS50ZXN0KHBvc3NpYmxlVXJsKSlcbiAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cImh0dHA6Ly8nICsgcG9zc2libGVVcmwgKyAnXCInICsgbm9Gb2xsb3dBdHRyICsgJz4nICsgcG9zc2libGVVcmwuc3Vic3RyKDAsIGxlbmd0aCkgKyAnPC9hPic7XG5cbiAgICAgICAgICAvLyBhbiBlbWFpbCBhZGRyZXNzIG9mIHRoZSBmb3JtIHVzZXJuYW1lQGRvbWFpbi50bGRcbiAgICAgICAgICBpZiAoZW1haWxSRS50ZXN0KHBvc3NpYmxlVXJsKSlcbiAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cIm1haWx0bzonICsgcG9zc2libGVVcmwgKyAnXCI+JyArIHBvc3NpYmxlVXJsICsgJzwvYT4nO1xuXG4gICAgICAgICAgLy8gdXJsIHRoYXQgZW5kcyBpbiAuY29tLCAub3JnIG9yIC5uZXQgdGhhdCBpcyBub3QgYW4gZW1haWwgYWRkcmVzc1xuICAgICAgICAgIGlmICh0bGRSRS50ZXN0KHBvc3NpYmxlVXJsKSlcbiAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cImh0dHA6Ly8nICsgcG9zc2libGVVcmwgKyAnXCInICsgbm9Gb2xsb3dBdHRyICsgJz4nICsgcG9zc2libGVVcmwuc3Vic3RyKDAsIGxlbmd0aCkgKyAnPC9hPic7XG5cbiAgICAgICAgICByZXR1cm4gd29yZDtcblxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gd29yZHMuam9pbignICcpO1xuICAgIH0sXG5cbiAgICB3b3JkY291bnQ6IGZ1bmN0aW9uKHN0cikge1xuICAgICAgICB2YXIgd29yZHMgPSAoc3RyKSA/IHN0ci5tYXRjaCgvXFx3Ky9nKSA6IG51bGw7XG4gICAgICAgIHJldHVybiAod29yZHMpID8gd29yZHMubGVuZ3RoIDogbnVsbDtcbiAgICB9LFxuXG4gICAgJ2Zsb2F0JzogZnVuY3Rpb24odmFsLCBkZWYpIHtcbiAgICAgICAgdmFyIHJlcyA9IHBhcnNlRmxvYXQodmFsKTtcbiAgICAgICAgcmV0dXJuIGlzTmFOKHJlcykgPyBkZWYgOiByZXM7XG4gICAgfSxcblxuICAgICdpbnQnOiBmdW5jdGlvbih2YWwsIGRlZikge1xuICAgICAgICB2YXIgcmVzID0gcGFyc2VJbnQodmFsLCAxMCk7XG4gICAgICAgIHJldHVybiBpc05hTihyZXMpID8gZGVmIDogcmVzO1xuICAgIH1cbn07XG5cbi8vIEFsaWFzZXNcbmZpbHRlcnMuZCA9IGZpbHRlcnNbJ2RlZmF1bHQnXTtcbmZpbHRlcnMuZSA9IGZpbHRlcnMuZXNjYXBlO1xuXG5tb2R1bGVzWydmaWx0ZXJzJ10gPSBmaWx0ZXJzO1xufSkoKTtcbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gY3ljbGVyKGl0ZW1zKSB7XG4gICAgdmFyIGluZGV4ID0gLTE7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBjdXJyZW50OiBudWxsLFxuICAgICAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpbmRleCA9IC0xO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50ID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgICAgICBpZihpbmRleCA+PSBpdGVtcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpbmRleCA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuY3VycmVudCA9IGl0ZW1zW2luZGV4XTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnQ7XG4gICAgICAgIH0sXG4gICAgfTtcblxufVxuXG5mdW5jdGlvbiBqb2luZXIoc2VwKSB7XG4gICAgc2VwID0gc2VwIHx8ICcsJztcbiAgICB2YXIgZmlyc3QgPSB0cnVlO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsID0gZmlyc3QgPyAnJyA6IHNlcDtcbiAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHZhbDtcbiAgICB9O1xufVxuXG52YXIgZ2xvYmFscyA9IHtcbiAgICByYW5nZTogZnVuY3Rpb24oc3RhcnQsIHN0b3AsIHN0ZXApIHtcbiAgICAgICAgaWYoIXN0b3ApIHtcbiAgICAgICAgICAgIHN0b3AgPSBzdGFydDtcbiAgICAgICAgICAgIHN0YXJ0ID0gMDtcbiAgICAgICAgICAgIHN0ZXAgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYoIXN0ZXApIHtcbiAgICAgICAgICAgIHN0ZXAgPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFyciA9IFtdO1xuICAgICAgICBmb3IodmFyIGk9c3RhcnQ7IGk8c3RvcDsgaSs9c3RlcCkge1xuICAgICAgICAgICAgYXJyLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9LFxuXG4gICAgLy8gbGlwc3VtOiBmdW5jdGlvbihuLCBodG1sLCBtaW4sIG1heCkge1xuICAgIC8vIH0sXG5cbiAgICBjeWNsZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gY3ljbGVyKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpO1xuICAgIH0sXG5cbiAgICBqb2luZXI6IGZ1bmN0aW9uKHNlcCkge1xuICAgICAgICByZXR1cm4gam9pbmVyKHNlcCk7XG4gICAgfVxufVxuXG5tb2R1bGVzWydnbG9iYWxzJ10gPSBnbG9iYWxzO1xufSkoKTtcbihmdW5jdGlvbigpIHtcbid1c2Ugc3RyaWN0JztcblxudmFyIHBhdGggPSBtb2R1bGVzW1wicGF0aFwiXTtcbnZhciBsaWIgPSBtb2R1bGVzW1wibGliXCJdO1xudmFyIE9iaiA9IG1vZHVsZXNbXCJvYmplY3RcIl07XG52YXIgbGV4ZXIgPSBtb2R1bGVzW1wibGV4ZXJcIl07XG52YXIgY29tcGlsZXIgPSBtb2R1bGVzW1wiY29tcGlsZXJcIl07XG52YXIgYnVpbHRpbl9maWx0ZXJzID0gbW9kdWxlc1tcImZpbHRlcnNcIl07XG52YXIgYnVpbHRpbl9sb2FkZXJzID0gbW9kdWxlc1tcImxvYWRlcnNcIl07XG52YXIgcnVudGltZSA9IG1vZHVsZXNbXCJydW50aW1lXCJdO1xudmFyIGdsb2JhbHMgPSBtb2R1bGVzW1wiZ2xvYmFsc1wiXTtcbnZhciBGcmFtZSA9IHJ1bnRpbWUuRnJhbWU7XG5cbnZhciBFbnZpcm9ubWVudCA9IE9iai5leHRlbmQoe1xuICAgIGluaXQ6IGZ1bmN0aW9uKGxvYWRlcnMsIG9wdHMpIHtcbiAgICAgICAgLy8gVGhlIGRldiBmbGFnIGRldGVybWluZXMgdGhlIHRyYWNlIHRoYXQnbGwgYmUgc2hvd24gb24gZXJyb3JzLlxuICAgICAgICAvLyBJZiBzZXQgdG8gdHJ1ZSwgcmV0dXJucyB0aGUgZnVsbCB0cmFjZSBmcm9tIHRoZSBlcnJvciBwb2ludCxcbiAgICAgICAgLy8gb3RoZXJ3aXNlIHdpbGwgcmV0dXJuIHRyYWNlIHN0YXJ0aW5nIGZyb20gVGVtcGxhdGUucmVuZGVyXG4gICAgICAgIC8vICh0aGUgZnVsbCB0cmFjZSBmcm9tIHdpdGhpbiBudW5qdWNrcyBtYXkgY29uZnVzZSBkZXZlbG9wZXJzIHVzaW5nXG4gICAgICAgIC8vICB0aGUgbGlicmFyeSlcbiAgICAgICAgLy8gZGVmYXVsdHMgdG8gZmFsc2VcbiAgICAgICAgdmFyIG9wdHMgPSB0aGlzLm9wdHMgPSBvcHRzIHx8IHt9O1xuICAgICAgICB0aGlzLm9wdHMuZGV2ID0gISFvcHRzLmRldjtcblxuICAgICAgICAvLyBUaGUgYXV0b2VzY2FwZSBmbGFnIHNldHMgZ2xvYmFsIGF1dG9lc2NhcGluZy4gSWYgdHJ1ZSxcbiAgICAgICAgLy8gZXZlcnkgc3RyaW5nIHZhcmlhYmxlIHdpbGwgYmUgZXNjYXBlZCBieSBkZWZhdWx0LlxuICAgICAgICAvLyBJZiBmYWxzZSwgc3RyaW5ncyBjYW4gYmUgbWFudWFsbHkgZXNjYXBlZCB1c2luZyB0aGUgYGVzY2FwZWAgZmlsdGVyLlxuICAgICAgICAvLyBkZWZhdWx0cyB0byBmYWxzZVxuICAgICAgICB0aGlzLm9wdHMuYXV0b2VzY2FwZSA9ICEhb3B0cy5hdXRvZXNjYXBlO1xuXG4gICAgICAgIHRoaXMub3B0cy50cmltQmxvY2tzID0gISFvcHRzLnRyaW1CbG9ja3M7XG5cbiAgICAgICAgdGhpcy5vcHRzLmxzdHJpcEJsb2NrcyA9ICEhb3B0cy5sc3RyaXBCbG9ja3M7XG5cbiAgICAgICAgaWYoIWxvYWRlcnMpIHtcbiAgICAgICAgICAgIC8vIFRoZSBmaWxlc3lzdGVtIGxvYWRlciBpcyBvbmx5IGF2YWlsYWJsZSBjbGllbnQtc2lkZVxuICAgICAgICAgICAgaWYoYnVpbHRpbl9sb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRlcnMgPSBbbmV3IGJ1aWx0aW5fbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyKCd2aWV3cycpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGVycyA9IFtuZXcgYnVpbHRpbl9sb2FkZXJzLldlYkxvYWRlcignL3ZpZXdzJyldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5sb2FkZXJzID0gbGliLmlzQXJyYXkobG9hZGVycykgPyBsb2FkZXJzIDogW2xvYWRlcnNdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0Q2FjaGUoKTtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0ge307XG4gICAgICAgIHRoaXMuYXN5bmNGaWx0ZXJzID0gW107XG4gICAgICAgIHRoaXMuZXh0ZW5zaW9ucyA9IHt9O1xuICAgICAgICB0aGlzLmV4dGVuc2lvbnNMaXN0ID0gW107XG5cbiAgICAgICAgZm9yKHZhciBuYW1lIGluIGJ1aWx0aW5fZmlsdGVycykge1xuICAgICAgICAgICAgdGhpcy5hZGRGaWx0ZXIobmFtZSwgYnVpbHRpbl9maWx0ZXJzW25hbWVdKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpbml0Q2FjaGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBDYWNoaW5nIGFuZCBjYWNoZSBidXN0aW5nXG4gICAgICAgIGxpYi5lYWNoKHRoaXMubG9hZGVycywgZnVuY3Rpb24obG9hZGVyKSB7XG4gICAgICAgICAgICBsb2FkZXIuY2FjaGUgPSB7fTtcblxuICAgICAgICAgICAgaWYodHlwZW9mIGxvYWRlci5vbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGxvYWRlci5vbigndXBkYXRlJywgZnVuY3Rpb24odGVtcGxhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9hZGVyLmNhY2hlW3RlbXBsYXRlXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBhZGRFeHRlbnNpb246IGZ1bmN0aW9uKG5hbWUsIGV4dGVuc2lvbikge1xuICAgICAgICBleHRlbnNpb24uX25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLmV4dGVuc2lvbnNbbmFtZV0gPSBleHRlbnNpb247XG4gICAgICAgIHRoaXMuZXh0ZW5zaW9uc0xpc3QucHVzaChleHRlbnNpb24pO1xuICAgIH0sXG5cbiAgICBnZXRFeHRlbnNpb246IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZXh0ZW5zaW9uc1tuYW1lXTtcbiAgICB9LFxuXG4gICAgYWRkR2xvYmFsOiBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgICAgICBnbG9iYWxzW25hbWVdID0gdmFsdWU7XG4gICAgfSxcblxuICAgIGFkZEZpbHRlcjogZnVuY3Rpb24obmFtZSwgZnVuYywgYXN5bmMpIHtcbiAgICAgICAgdmFyIHdyYXBwZWQgPSBmdW5jO1xuXG4gICAgICAgIGlmKGFzeW5jKSB7XG4gICAgICAgICAgICB0aGlzLmFzeW5jRmlsdGVycy5wdXNoKG5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZmlsdGVyc1tuYW1lXSA9IHdyYXBwZWQ7XG4gICAgfSxcblxuICAgIGdldEZpbHRlcjogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBpZighdGhpcy5maWx0ZXJzW25hbWVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZpbHRlciBub3QgZm91bmQ6ICcgKyBuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJzW25hbWVdO1xuICAgIH0sXG5cbiAgICByZXNvbHZlVGVtcGxhdGU6IGZ1bmN0aW9uKGxvYWRlciwgcGFyZW50TmFtZSwgZmlsZW5hbWUpIHtcbiAgICAgICAgdmFyIGlzUmVsYXRpdmUgPSAobG9hZGVyLmlzUmVsYXRpdmUgJiYgcGFyZW50TmFtZSk/IGxvYWRlci5pc1JlbGF0aXZlKGZpbGVuYW1lKSA6IGZhbHNlO1xuICAgICAgICByZXR1cm4gKGlzUmVsYXRpdmUgJiYgbG9hZGVyLnJlc29sdmUpPyBsb2FkZXIucmVzb2x2ZShwYXJlbnROYW1lLCBmaWxlbmFtZSkgOiBmaWxlbmFtZTtcbiAgICB9LFxuXG4gICAgZ2V0VGVtcGxhdGU6IGZ1bmN0aW9uKG5hbWUsIGVhZ2VyQ29tcGlsZSwgcGFyZW50TmFtZSwgY2IpIHtcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICB2YXIgdG1wbCA9IG51bGw7XG4gICAgICAgIGlmKG5hbWUgJiYgbmFtZS5yYXcpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgZml4ZXMgYXV0b2VzY2FwZSBmb3IgdGVtcGxhdGVzIHJlZmVyZW5jZWQgaW4gc3ltYm9sc1xuICAgICAgICAgICAgbmFtZSA9IG5hbWUucmF3O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYobGliLmlzRnVuY3Rpb24ocGFyZW50TmFtZSkpIHtcbiAgICAgICAgICAgIGNiID0gcGFyZW50TmFtZTtcbiAgICAgICAgICAgIHBhcmVudE5hbWUgPSBudWxsO1xuICAgICAgICAgICAgZWFnZXJDb21waWxlID0gZWFnZXJDb21waWxlIHx8IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYobGliLmlzRnVuY3Rpb24oZWFnZXJDb21waWxlKSkge1xuICAgICAgICAgICAgY2IgPSBlYWdlckNvbXBpbGU7XG4gICAgICAgICAgICBlYWdlckNvbXBpbGUgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd0ZW1wbGF0ZSBuYW1lcyBtdXN0IGJlIGEgc3RyaW5nOiAnICsgbmFtZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubG9hZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIF9uYW1lID0gdGhpcy5yZXNvbHZlVGVtcGxhdGUodGhpcy5sb2FkZXJzW2ldLCBwYXJlbnROYW1lLCBuYW1lKTtcbiAgICAgICAgICAgIHRtcGwgPSB0aGlzLmxvYWRlcnNbaV0uY2FjaGVbX25hbWVdO1xuICAgICAgICAgICAgaWYgKHRtcGwpIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodG1wbCkge1xuICAgICAgICAgICAgaWYoZWFnZXJDb21waWxlKSB7XG4gICAgICAgICAgICAgICAgdG1wbC5jb21waWxlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKGNiKSB7XG4gICAgICAgICAgICAgICAgY2IobnVsbCwgdG1wbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdG1wbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzeW5jUmVzdWx0O1xuXG4gICAgICAgICAgICBsaWIuYXN5bmNJdGVyKHRoaXMubG9hZGVycywgZnVuY3Rpb24obG9hZGVyLCBpLCBuZXh0LCBkb25lKSB7XG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gaGFuZGxlKHNyYykge1xuICAgICAgICAgICAgICAgICAgICBpZihzcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNyYy5sb2FkZXIgPSBsb2FkZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb25lKHNyYyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBSZXNvbHZlIG5hbWUgcmVsYXRpdmUgdG8gcGFyZW50TmFtZVxuICAgICAgICAgICAgICAgIG5hbWUgPSB0aGF0LnJlc29sdmVUZW1wbGF0ZShsb2FkZXIsIHBhcmVudE5hbWUsIG5hbWUpO1xuXG4gICAgICAgICAgICAgICAgaWYobG9hZGVyLmFzeW5jKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvYWRlci5nZXRTb3VyY2UobmFtZSwgZnVuY3Rpb24oZXJyLCBzcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGVycikgeyB0aHJvdyBlcnI7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZShzcmMpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZShsb2FkZXIuZ2V0U291cmNlKG5hbWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbihpbmZvKSB7XG4gICAgICAgICAgICAgICAgaWYoIWluZm8pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcigndGVtcGxhdGUgbm90IGZvdW5kOiAnICsgbmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG1wbCA9IG5ldyBUZW1wbGF0ZShpbmZvLnNyYywgdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mby5wYXRoLCBlYWdlckNvbXBpbGUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmKCFpbmZvLm5vQ2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZm8ubG9hZGVyLmNhY2hlW25hbWVdID0gdG1wbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmKGNiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYihudWxsLCB0bXBsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN5bmNSZXN1bHQgPSB0bXBsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgICAgICAgcmV0dXJuIHN5bmNSZXN1bHQ7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZXhwcmVzczogZnVuY3Rpb24oYXBwKSB7XG4gICAgICAgIHZhciBlbnYgPSB0aGlzO1xuXG4gICAgICAgIGZ1bmN0aW9uIE51bmp1Y2tzVmlldyhuYW1lLCBvcHRzKSB7XG4gICAgICAgICAgICB0aGlzLm5hbWUgICAgICAgICAgPSBuYW1lO1xuICAgICAgICAgICAgdGhpcy5wYXRoICAgICAgICAgID0gbmFtZTtcbiAgICAgICAgICAgIHRoaXMuZGVmYXVsdEVuZ2luZSA9IG9wdHMuZGVmYXVsdEVuZ2luZTtcbiAgICAgICAgICAgIHRoaXMuZXh0ICAgICAgICAgICA9IHBhdGguZXh0bmFtZShuYW1lKTtcbiAgICAgICAgICAgIGlmICghdGhpcy5leHQgJiYgIXRoaXMuZGVmYXVsdEVuZ2luZSkgdGhyb3cgbmV3IEVycm9yKCdObyBkZWZhdWx0IGVuZ2luZSB3YXMgc3BlY2lmaWVkIGFuZCBubyBleHRlbnNpb24gd2FzIHByb3ZpZGVkLicpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmV4dCkgdGhpcy5uYW1lICs9ICh0aGlzLmV4dCA9ICgnLicgIT09IHRoaXMuZGVmYXVsdEVuZ2luZVswXSA/ICcuJyA6ICcnKSArIHRoaXMuZGVmYXVsdEVuZ2luZSk7XG4gICAgICAgIH1cblxuICAgICAgICBOdW5qdWNrc1ZpZXcucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKG9wdHMsIGNiKSB7XG4gICAgICAgICAgZW52LnJlbmRlcih0aGlzLm5hbWUsIG9wdHMsIGNiKTtcbiAgICAgICAgfTtcblxuICAgICAgICBhcHAuc2V0KCd2aWV3JywgTnVuanVja3NWaWV3KTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbihuYW1lLCBjdHgsIGNiKSB7XG4gICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKGN0eCkpIHtcbiAgICAgICAgICAgIGNiID0gY3R4O1xuICAgICAgICAgICAgY3R4ID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIHN1cHBvcnQgYSBzeW5jaHJvbm91cyBBUEkgdG8gbWFrZSBpdCBlYXNpZXIgdG8gbWlncmF0ZVxuICAgICAgICAvLyBleGlzdGluZyBjb2RlIHRvIGFzeW5jLiBUaGlzIHdvcmtzIGJlY2F1c2UgaWYgeW91IGRvbid0IGRvXG4gICAgICAgIC8vIGFueXRoaW5nIGFzeW5jIHdvcmssIHRoZSB3aG9sZSB0aGluZyBpcyBhY3R1YWxseSBydW5cbiAgICAgICAgLy8gc3luY2hyb25vdXNseS5cbiAgICAgICAgdmFyIHN5bmNSZXN1bHQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZ2V0VGVtcGxhdGUobmFtZSwgZnVuY3Rpb24oZXJyLCB0bXBsKSB7XG4gICAgICAgICAgICBpZihlcnIgJiYgY2IpIHtcbiAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZihlcnIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0bXBsLnJlbmRlcihjdHgsIGNiIHx8IGZ1bmN0aW9uKGVyciwgcmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGVycikgeyB0aHJvdyBlcnI7IH1cbiAgICAgICAgICAgICAgICAgICAgc3luY1Jlc3VsdCA9IHJlcztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHN5bmNSZXN1bHQ7XG4gICAgfSxcblxuICAgIHJlbmRlclN0cmluZzogZnVuY3Rpb24oc3JjLCBjdHgsIG9wdHMsIGNiKSB7XG4gICAgICAgIGlmKGxpYi5pc0Z1bmN0aW9uKG9wdHMpKSB7XG4gICAgICAgICAgICBjYiA9IG9wdHM7XG4gICAgICAgICAgICBvcHRzID0ge307XG4gICAgICAgIH1cbiAgICAgICAgb3B0cyA9IG9wdHMgfHwge307XG5cbiAgICAgICAgdmFyIHRtcGwgPSBuZXcgVGVtcGxhdGUoc3JjLCB0aGlzLCBvcHRzLnBhdGgpO1xuICAgICAgICByZXR1cm4gdG1wbC5yZW5kZXIoY3R4LCBjYik7XG4gICAgfVxufSk7XG5cbnZhciBDb250ZXh0ID0gT2JqLmV4dGVuZCh7XG4gICAgaW5pdDogZnVuY3Rpb24oY3R4LCBibG9ja3MpIHtcbiAgICAgICAgdGhpcy5jdHggPSBjdHg7XG4gICAgICAgIHRoaXMuYmxvY2tzID0ge307XG4gICAgICAgIHRoaXMuZXhwb3J0ZWQgPSBbXTtcblxuICAgICAgICBmb3IodmFyIG5hbWUgaW4gYmxvY2tzKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEJsb2NrKG5hbWUsIGJsb2Nrc1tuYW1lXSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgbG9va3VwOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgb25lIG9mIHRoZSBtb3N0IGNhbGxlZCBmdW5jdGlvbnMsIHNvIG9wdGltaXplIGZvclxuICAgICAgICAvLyB0aGUgdHlwaWNhbCBjYXNlIHdoZXJlIHRoZSBuYW1lIGlzbid0IGluIHRoZSBnbG9iYWxzXG4gICAgICAgIGlmKG5hbWUgaW4gZ2xvYmFscyAmJiAhKG5hbWUgaW4gdGhpcy5jdHgpKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2xvYmFsc1tuYW1lXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN0eFtuYW1lXTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZXRWYXJpYWJsZTogZnVuY3Rpb24obmFtZSwgdmFsKSB7XG4gICAgICAgIHRoaXMuY3R4W25hbWVdID0gdmFsO1xuICAgIH0sXG5cbiAgICBnZXRWYXJpYWJsZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdHg7XG4gICAgfSxcblxuICAgIGFkZEJsb2NrOiBmdW5jdGlvbihuYW1lLCBibG9jaykge1xuICAgICAgICB0aGlzLmJsb2Nrc1tuYW1lXSA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdO1xuICAgICAgICB0aGlzLmJsb2Nrc1tuYW1lXS5wdXNoKGJsb2NrKTtcbiAgICB9LFxuXG4gICAgZ2V0QmxvY2s6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgaWYoIXRoaXMuYmxvY2tzW25hbWVdKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vua25vd24gYmxvY2sgXCInICsgbmFtZSArICdcIicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvY2tzW25hbWVdWzBdO1xuICAgIH0sXG5cbiAgICBnZXRTdXBlcjogZnVuY3Rpb24oZW52LCBuYW1lLCBibG9jaywgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG4gICAgICAgIHZhciBpZHggPSBsaWIuaW5kZXhPZih0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXSwgYmxvY2spO1xuICAgICAgICB2YXIgYmxrID0gdGhpcy5ibG9ja3NbbmFtZV1baWR4ICsgMV07XG4gICAgICAgIHZhciBjb250ZXh0ID0gdGhpcztcblxuICAgICAgICBpZihpZHggPT09IC0xIHx8ICFibGspIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbm8gc3VwZXIgYmxvY2sgYXZhaWxhYmxlIGZvciBcIicgKyBuYW1lICsgJ1wiJyk7XG4gICAgICAgIH1cblxuICAgICAgICBibGsoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xuICAgIH0sXG5cbiAgICBhZGRFeHBvcnQ6IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdGhpcy5leHBvcnRlZC5wdXNoKG5hbWUpO1xuICAgIH0sXG5cbiAgICBnZXRFeHBvcnRlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBleHBvcnRlZCA9IHt9O1xuICAgICAgICBmb3IodmFyIGk9MDsgaTx0aGlzLmV4cG9ydGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IHRoaXMuZXhwb3J0ZWRbaV07XG4gICAgICAgICAgICBleHBvcnRlZFtuYW1lXSA9IHRoaXMuY3R4W25hbWVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBleHBvcnRlZDtcbiAgICB9XG59KTtcblxudmFyIFRlbXBsYXRlID0gT2JqLmV4dGVuZCh7XG4gICAgaW5pdDogZnVuY3Rpb24gKHNyYywgZW52LCBwYXRoLCBlYWdlckNvbXBpbGUpIHtcbiAgICAgICAgdGhpcy5lbnYgPSBlbnYgfHwgbmV3IEVudmlyb25tZW50KCk7XG5cbiAgICAgICAgaWYobGliLmlzT2JqZWN0KHNyYykpIHtcbiAgICAgICAgICAgIHN3aXRjaChzcmMudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnY29kZSc6IHRoaXMudG1wbFByb3BzID0gc3JjLm9iajsgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdzdHJpbmcnOiB0aGlzLnRtcGxTdHIgPSBzcmMub2JqOyBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmKGxpYi5pc1N0cmluZyhzcmMpKSB7XG4gICAgICAgICAgICB0aGlzLnRtcGxTdHIgPSBzcmM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NyYyBtdXN0IGJlIGEgc3RyaW5nIG9yIGFuIG9iamVjdCBkZXNjcmliaW5nICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0aGUgc291cmNlJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBhdGggPSBwYXRoO1xuXG4gICAgICAgIGlmKGVhZ2VyQ29tcGlsZSkge1xuICAgICAgICAgICAgbGliLndpdGhQcmV0dHlFcnJvcnModGhpcy5wYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnYuZGV2LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY29tcGlsZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uKGN0eCwgZnJhbWUsIGNiKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY3R4ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYiA9IGN0eDtcbiAgICAgICAgICAgIGN0eCA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBmcmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2IgPSBmcmFtZTtcbiAgICAgICAgICAgIGZyYW1lID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsaWIud2l0aFByZXR0eUVycm9ycyh0aGlzLnBhdGgsIHRoaXMuZW52LmRldiwgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIC8vIENhdGNoIGNvbXBpbGUgZXJyb3JzIGZvciBhc3luYyByZW5kZXJpbmdcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb21waWxlKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNiKSByZXR1cm4gY2IoZSk7XG4gICAgICAgICAgICAgICAgZWxzZSB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KGN0eCB8fCB7fSwgdGhpcy5ibG9ja3MpO1xuICAgICAgICAgICAgdmFyIHN5bmNSZXN1bHQgPSBudWxsO1xuXG4gICAgICAgICAgICB0aGlzLnJvb3RSZW5kZXJGdW5jKHRoaXMuZW52LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZSB8fCBuZXcgRnJhbWUoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVudGltZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2IgfHwgZnVuY3Rpb24oZXJyLCByZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGVycikgeyB0aHJvdyBlcnI7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN5bmNSZXN1bHQgPSByZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gc3luY1Jlc3VsdDtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG5cbiAgICBnZXRFeHBvcnRlZDogZnVuY3Rpb24oY3R4LCBmcmFtZSwgY2IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjdHggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNiID0gY3R4O1xuICAgICAgICAgICAgY3R4ID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGZyYW1lID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYiA9IGZyYW1lO1xuICAgICAgICAgICAgZnJhbWUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2F0Y2ggY29tcGlsZSBlcnJvcnMgZm9yIGFzeW5jIHJlbmRlcmluZ1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhpcy5jb21waWxlKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChjYikgcmV0dXJuIGNiKGUpO1xuICAgICAgICAgICAgZWxzZSB0aHJvdyBlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUnVuIHRoZSByb290UmVuZGVyRnVuYyB0byBwb3B1bGF0ZSB0aGUgY29udGV4dCB3aXRoIGV4cG9ydGVkIHZhcnNcbiAgICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQ29udGV4dChjdHggfHwge30sIHRoaXMuYmxvY2tzKTtcbiAgICAgICAgdGhpcy5yb290UmVuZGVyRnVuYyh0aGlzLmVudixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lIHx8IG5ldyBGcmFtZSgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bnRpbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiKG51bGwsIGNvbnRleHQuZ2V0RXhwb3J0ZWQoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNvbXBpbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZighdGhpcy5jb21waWxlZCkge1xuICAgICAgICAgICAgdGhpcy5fY29tcGlsZSgpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIF9jb21waWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHByb3BzO1xuXG4gICAgICAgIGlmKHRoaXMudG1wbFByb3BzKSB7XG4gICAgICAgICAgICBwcm9wcyA9IHRoaXMudG1wbFByb3BzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGNvbXBpbGVyLmNvbXBpbGUodGhpcy50bXBsU3RyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnYuYXN5bmNGaWx0ZXJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbnYuZXh0ZW5zaW9uc0xpc3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVudi5vcHRzKTtcblxuICAgICAgICAgICAgdmFyIGZ1bmMgPSBuZXcgRnVuY3Rpb24oc291cmNlKTtcbiAgICAgICAgICAgIHByb3BzID0gZnVuYygpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ibG9ja3MgPSB0aGlzLl9nZXRCbG9ja3MocHJvcHMpO1xuICAgICAgICB0aGlzLnJvb3RSZW5kZXJGdW5jID0gcHJvcHMucm9vdDtcbiAgICAgICAgdGhpcy5jb21waWxlZCA9IHRydWU7XG4gICAgfSxcblxuICAgIF9nZXRCbG9ja3M6IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgICAgIHZhciBibG9ja3MgPSB7fTtcblxuICAgICAgICBmb3IodmFyIGsgaW4gcHJvcHMpIHtcbiAgICAgICAgICAgIGlmKGsuc2xpY2UoMCwgMikgPT09ICdiXycpIHtcbiAgICAgICAgICAgICAgICBibG9ja3Nbay5zbGljZSgyKV0gPSBwcm9wc1trXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBibG9ja3M7XG4gICAgfVxufSk7XG5cbi8vIHRlc3QgY29kZVxuLy8gdmFyIHNyYyA9ICd7JSBtYWNybyBmb28oKSAlfXslIGluY2x1ZGUgXCJpbmNsdWRlLmh0bWxcIiAlfXslIGVuZG1hY3JvICV9e3sgZm9vKCkgfX0nO1xuLy8gdmFyIGVudiA9IG5ldyBFbnZpcm9ubWVudChuZXcgYnVpbHRpbl9sb2FkZXJzLkZpbGVTeXN0ZW1Mb2FkZXIoJy4uL3Rlc3RzL3RlbXBsYXRlcycsIHRydWUpLCB7IGRldjogdHJ1ZSB9KTtcbi8vIGNvbnNvbGUubG9nKGVudi5yZW5kZXJTdHJpbmcoc3JjLCB7IG5hbWU6ICdwb29wJyB9KSk7XG5cbm1vZHVsZXNbJ2Vudmlyb25tZW50J10gPSB7XG4gICAgRW52aXJvbm1lbnQ6IEVudmlyb25tZW50LFxuICAgIFRlbXBsYXRlOiBUZW1wbGF0ZVxufTtcbn0pKCk7XG52YXIgbnVuanVja3M7XG5cbnZhciBsaWIgPSBtb2R1bGVzW1wibGliXCJdO1xudmFyIGVudiA9IG1vZHVsZXNbXCJlbnZpcm9ubWVudFwiXTtcbnZhciBjb21waWxlciA9IG1vZHVsZXNbXCJjb21waWxlclwiXTtcbnZhciBwYXJzZXIgPSBtb2R1bGVzW1wicGFyc2VyXCJdO1xudmFyIGxleGVyID0gbW9kdWxlc1tcImxleGVyXCJdO1xudmFyIHJ1bnRpbWUgPSBtb2R1bGVzW1wicnVudGltZVwiXTtcbnZhciBMb2FkZXIgPSBtb2R1bGVzW1wibG9hZGVyXCJdO1xudmFyIGxvYWRlcnMgPSBtb2R1bGVzW1wibG9hZGVyc1wiXTtcbnZhciBwcmVjb21waWxlID0gbW9kdWxlc1tcInByZWNvbXBpbGVcIl07XG5cbm51bmp1Y2tzID0ge307XG5udW5qdWNrcy5FbnZpcm9ubWVudCA9IGVudi5FbnZpcm9ubWVudDtcbm51bmp1Y2tzLlRlbXBsYXRlID0gZW52LlRlbXBsYXRlO1xuXG5udW5qdWNrcy5Mb2FkZXIgPSBMb2FkZXI7XG5udW5qdWNrcy5GaWxlU3lzdGVtTG9hZGVyID0gbG9hZGVycy5GaWxlU3lzdGVtTG9hZGVyO1xubnVuanVja3MuV2ViTG9hZGVyID0gbG9hZGVycy5XZWJMb2FkZXI7XG5cbm51bmp1Y2tzLmNvbXBpbGVyID0gY29tcGlsZXI7XG5udW5qdWNrcy5wYXJzZXIgPSBwYXJzZXI7XG5udW5qdWNrcy5sZXhlciA9IGxleGVyO1xubnVuanVja3MucnVudGltZSA9IHJ1bnRpbWU7XG5cbi8vIEEgc2luZ2xlIGluc3RhbmNlIG9mIGFuIGVudmlyb25tZW50LCBzaW5jZSB0aGlzIGlzIHNvIGNvbW1vbmx5IHVzZWRcblxudmFyIGU7XG5udW5qdWNrcy5jb25maWd1cmUgPSBmdW5jdGlvbih0ZW1wbGF0ZXNQYXRoLCBvcHRzKSB7XG4gICAgb3B0cyA9IG9wdHMgfHwge307XG4gICAgaWYobGliLmlzT2JqZWN0KHRlbXBsYXRlc1BhdGgpKSB7XG4gICAgICAgIG9wdHMgPSB0ZW1wbGF0ZXNQYXRoO1xuICAgICAgICB0ZW1wbGF0ZXNQYXRoID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgbm9XYXRjaCA9ICd3YXRjaCcgaW4gb3B0cyA/ICFvcHRzLndhdGNoIDogZmFsc2U7XG4gICAgdmFyIGxvYWRlciA9IGxvYWRlcnMuRmlsZVN5c3RlbUxvYWRlciB8fCBsb2FkZXJzLldlYkxvYWRlcjtcbiAgICBlID0gbmV3IGVudi5FbnZpcm9ubWVudChuZXcgbG9hZGVyKHRlbXBsYXRlc1BhdGgsIG5vV2F0Y2gpLCBvcHRzKTtcblxuICAgIGlmKG9wdHMgJiYgb3B0cy5leHByZXNzKSB7XG4gICAgICAgIGUuZXhwcmVzcyhvcHRzLmV4cHJlc3MpO1xuICAgIH1cblxuICAgIHJldHVybiBlO1xufTtcblxubnVuanVja3MuY29tcGlsZSA9IGZ1bmN0aW9uKHNyYywgZW52LCBwYXRoLCBlYWdlckNvbXBpbGUpIHtcbiAgICBpZighZSkge1xuICAgICAgICBudW5qdWNrcy5jb25maWd1cmUoKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBudW5qdWNrcy5UZW1wbGF0ZShzcmMsIGVudiwgcGF0aCwgZWFnZXJDb21waWxlKTtcbn07XG5cbm51bmp1Y2tzLnJlbmRlciA9IGZ1bmN0aW9uKG5hbWUsIGN0eCwgY2IpIHtcbiAgICBpZighZSkge1xuICAgICAgICBudW5qdWNrcy5jb25maWd1cmUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZS5yZW5kZXIobmFtZSwgY3R4LCBjYik7XG59O1xuXG5udW5qdWNrcy5yZW5kZXJTdHJpbmcgPSBmdW5jdGlvbihzcmMsIGN0eCwgY2IpIHtcbiAgICBpZighZSkge1xuICAgICAgICBudW5qdWNrcy5jb25maWd1cmUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZS5yZW5kZXJTdHJpbmcoc3JjLCBjdHgsIGNiKTtcbn07XG5cbmlmKHByZWNvbXBpbGUpIHtcbiAgICBudW5qdWNrcy5wcmVjb21waWxlID0gcHJlY29tcGlsZS5wcmVjb21waWxlO1xuICAgIG51bmp1Y2tzLnByZWNvbXBpbGVTdHJpbmcgPSBwcmVjb21waWxlLnByZWNvbXBpbGVTdHJpbmc7XG59XG5cbm51bmp1Y2tzLnJlcXVpcmUgPSBmdW5jdGlvbihuYW1lKSB7IHJldHVybiBtb2R1bGVzW25hbWVdOyB9O1xuXG5pZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBudW5qdWNrczsgfSk7XG59XG5lbHNlIHtcbiAgICB3aW5kb3cubnVuanVja3MgPSBudW5qdWNrcztcbiAgICBpZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykgbW9kdWxlLmV4cG9ydHMgPSBudW5qdWNrcztcbn1cblxufSkoKTtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3NcIiApO1xudmFyIGVudiA9IG51bmp1Y2tzLmVudiB8fCBuZXcgbnVuanVja3MuRW52aXJvbm1lbnQoKTtcbnZhciBvYmogPSAoZnVuY3Rpb24gKCkge2Z1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbm91dHB1dCArPSBcIjxkaXYgY2xhc3M9XFxcInRodW1ibmFpbFxcXCI+XFxuXFx0PGltZyBkYXRhLXNyYz1cXFwiaG9sZGVyLmpzLzM1MHgyNTA/dGV4dD1cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJtZXNzYWdlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIiZyYW5kb209eWVzXFxcIiA+XFxuXFx0XCI7XG5jb250ZXh0LmdldEJsb2NrKFwiY29udGVudFwiKShlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBmdW5jdGlvbih0XzIsdF8xKSB7XG5pZih0XzIpIHsgY2IodF8yKTsgcmV0dXJuOyB9XG5vdXRwdXQgKz0gdF8xO1xub3V0cHV0ICs9IFwiXFxuPC9kaXY+XCI7XG5jYihudWxsLCBvdXRwdXQpO1xufSk7XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxuZnVuY3Rpb24gYl9jb250ZW50KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG5vdXRwdXQgKz0gXCJcXG5cXHQ8ZGl2IGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cXG5cXHRcXHQ8aDM+VGh1bWJuYWlsIGxhYmVsPC9oMz5cXG5cXHRcXHQ8cD4uLi48L3A+XFxuXFx0XFx0PHA+PGEgaHJlZj1cXFwiI1xcXCIgY2xhc3M9XFxcImJ0biBidG4tcHJpbWFyeVxcXCIgcm9sZT1cXFwiYnV0dG9uXFxcIj5CdXR0b248L2E+IDxhIGhyZWY9XFxcIiNcXFwiIGNsYXNzPVxcXCJidG4gYnRuLWRlZmF1bHRcXFwiIHJvbGU9XFxcImJ1dHRvblxcXCI+QnV0dG9uPC9hPjwvcD5cXG5cXHQ8L2Rpdj5cXG5cXHRcIjtcbmNiKG51bGwsIG91dHB1dCk7XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbmJfY29udGVudDogYl9jb250ZW50LFxucm9vdDogcm9vdFxufTtcbn0pKCk7XG52YXIgb2xkUm9vdCA9IG9iai5yb290O1xub2JqLnJvb3QgPSBmdW5jdGlvbiggZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IgKSB7XG5cdHZhciBvbGRHZXRUZW1wbGF0ZSA9IGVudi5nZXRUZW1wbGF0ZTtcblx0ZW52LmdldFRlbXBsYXRlID0gZnVuY3Rpb24oIG5hbWUsIGVjLCBwYXJlbnROYW1lLCBjYiApIHtcblx0XHRpZiggdHlwZW9mIGVjID09PSBcImZ1bmN0aW9uXCIgKSB7XG5cdFx0XHRjYiA9IGVjO1xuXHRcdFx0ZWMgPSBmYWxzZTtcblx0XHR9XG5cdFx0dmFyIF9yZXF1aXJlID0gZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmV0dXJuIHJlcXVpcmUobmFtZSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGlmICggZnJhbWUuZ2V0KCBcIl9yZXF1aXJlXCIgKSApIHJldHVybiBmcmFtZS5nZXQoIFwiX3JlcXVpcmVcIiApKCBuYW1lIClcblx0XHRcdH1cblx0XHR9O1xuXHRcdHZhciB0bXBsID0gX3JlcXVpcmUoIG5hbWUgKTtcblx0XHRmcmFtZS5zZXQoIFwiX3JlcXVpcmVcIiwgX3JlcXVpcmUgKTtcblx0XHRpZiggZWMgKSB0bXBsLmNvbXBpbGUoKTtcblx0XHRjYiggbnVsbCwgdG1wbCApO1xuXHR9O1x0b2xkUm9vdCggZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgZnVuY3Rpb24oIGVyciwgcmVzICkge1xuXHRcdGVudi5nZXRUZW1wbGF0ZSA9IG9sZEdldFRlbXBsYXRlO1xuXHRcdGNiKCBlcnIsIHJlcyApO1xuXHR9ICk7XG59O1xudmFyIHNyYyA9IHtcblx0b2JqOiBvYmosXG5cdHR5cGU6IFwiY29kZVwiXG59O1xubW9kdWxlLmV4cG9ydHMgPSBuZXcgbnVuanVja3MuVGVtcGxhdGUoIHNyYywgZW52ICk7XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzXCIgKTtcbnZhciBlbnYgPSBudW5qdWNrcy5lbnYgfHwgbmV3IG51bmp1Y2tzLkVudmlyb25tZW50KCk7XG52YXIgb2JqID0gKGZ1bmN0aW9uICgpIHtmdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG5vdXRwdXQgKz0gXCJcXG48ZGl2IGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cXG5cXHQ8aDM+XCI7XG5vdXRwdXQgKz0gcnVudGltZS5zdXBwcmVzc1ZhbHVlKGVudi5nZXRGaWx0ZXIoXCJ0ZXN0XCIpLmNhbGwoY29udGV4dCwgZW52LmdldEZpbHRlcihcInVwcGVyXCIpLmNhbGwoY29udGV4dCwgcnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJtZXNzYWdlXCIpKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9oMz5cXG5cXHQ8cD5Nw7NkdWxvIFdpbmRvdzwvcD5cXG5cXHQ8cD48c3Bhbj5CZWF0YWUgZXggcXVpYnVzZGFtLCBtb2RpIHNlZCBpbGxvIGNvbnNlcXVhdHVyIGV0ISBFeCBuZXF1ZSBxdWFzaSBtb2xlc3RpYWUgdm9sdXB0YXRlcyBjb21tb2RpIGZ1Z2lhdCByZXB1ZGlhbmRhZSBwcmFlc2VudGl1bSwgb2ZmaWNpaXMgcXVhcyBxdWlkZW0gdmVsIG5paGlsIHNhZXBlIGFwZXJpYW0gYWNjdXNhbnRpdW0sIGRvbG9yZSBsaWJlcm8gb2JjYWVjYXRpIGluIHF1YWVyYXQuPC9zcGFuPjwvcD5cXG5cXHQ8cD48YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5XFxcIiByb2xlPVxcXCJidXR0b25cXFwiPkJ1dHRvbjwvYT4gPGEgaHJlZj1cXFwiI1xcXCIgY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdFxcXCIgcm9sZT1cXFwiYnV0dG9uXFxcIj5CdXR0b248L2E+PC9wPlxcbjwvZGl2PlwiO1xuY2IobnVsbCwgb3V0cHV0KTtcbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xucm9vdDogcm9vdFxufTtcbn0pKCk7XG52YXIgb2xkUm9vdCA9IG9iai5yb290O1xub2JqLnJvb3QgPSBmdW5jdGlvbiggZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IgKSB7XG5cdHZhciBvbGRHZXRUZW1wbGF0ZSA9IGVudi5nZXRUZW1wbGF0ZTtcblx0ZW52LmdldFRlbXBsYXRlID0gZnVuY3Rpb24oIG5hbWUsIGVjLCBwYXJlbnROYW1lLCBjYiApIHtcblx0XHRpZiggdHlwZW9mIGVjID09PSBcImZ1bmN0aW9uXCIgKSB7XG5cdFx0XHRjYiA9IGVjO1xuXHRcdFx0ZWMgPSBmYWxzZTtcblx0XHR9XG5cdFx0dmFyIF9yZXF1aXJlID0gZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmV0dXJuIHJlcXVpcmUobmFtZSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGlmICggZnJhbWUuZ2V0KCBcIl9yZXF1aXJlXCIgKSApIHJldHVybiBmcmFtZS5nZXQoIFwiX3JlcXVpcmVcIiApKCBuYW1lIClcblx0XHRcdH1cblx0XHR9O1xuXHRcdHZhciB0bXBsID0gX3JlcXVpcmUoIG5hbWUgKTtcblx0XHRmcmFtZS5zZXQoIFwiX3JlcXVpcmVcIiwgX3JlcXVpcmUgKTtcblx0XHRpZiggZWMgKSB0bXBsLmNvbXBpbGUoKTtcblx0XHRjYiggbnVsbCwgdG1wbCApO1xuXHR9O1x0b2xkUm9vdCggZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgZnVuY3Rpb24oIGVyciwgcmVzICkge1xuXHRcdGVudi5nZXRUZW1wbGF0ZSA9IG9sZEdldFRlbXBsYXRlO1xuXHRcdGNiKCBlcnIsIHJlcyApO1xuXHR9ICk7XG59O1xudmFyIHNyYyA9IHtcblx0b2JqOiBvYmosXG5cdHR5cGU6IFwiY29kZVwiXG59O1xubW9kdWxlLmV4cG9ydHMgPSBuZXcgbnVuanVja3MuVGVtcGxhdGUoIHNyYywgZW52ICk7XG4iLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzXCIgKTtcbnZhciBlbnYgPSBudW5qdWNrcy5lbnYgfHwgbmV3IG51bmp1Y2tzLkVudmlyb25tZW50KCk7XG5yZXF1aXJlKCBcIi4vbGF5b3V0Lm51bmpcIiApO1xucmVxdWlyZSggXCIuL3BhcnRpYWxzL2NvbnRlbnQubnVualwiICk7XG52YXIgb2JqID0gKGZ1bmN0aW9uICgpIHtmdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCIuL2xheW91dC5udW5qXCIsIHRydWUsIHVuZGVmaW5lZCwgZnVuY3Rpb24odF8yLHBhcmVudFRlbXBsYXRlKSB7XG5pZih0XzIpIHsgY2IodF8yKTsgcmV0dXJuOyB9XG5mb3IodmFyIHRfMSBpbiBwYXJlbnRUZW1wbGF0ZS5ibG9ja3MpIHtcbmNvbnRleHQuYWRkQmxvY2sodF8xLCBwYXJlbnRUZW1wbGF0ZS5ibG9ja3NbdF8xXSk7XG59XG5vdXRwdXQgKz0gXCJcXG5cIjtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0pO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbmZ1bmN0aW9uIGJfY29udGVudChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xub3V0cHV0ICs9IFwiXFxuXFx0XCI7XG5lbnYuZ2V0VGVtcGxhdGUoXCIuL3BhcnRpYWxzL2NvbnRlbnQubnVualwiLCBmYWxzZSwgdW5kZWZpbmVkLCBmdW5jdGlvbih0XzUsdF8zKSB7XG5pZih0XzUpIHsgY2IodF81KTsgcmV0dXJuOyB9XG50XzMucmVuZGVyKGNvbnRleHQuZ2V0VmFyaWFibGVzKCksIGZyYW1lLnB1c2goKSwgZnVuY3Rpb24odF82LHRfNCkge1xuaWYodF82KSB7IGNiKHRfNik7IHJldHVybjsgfVxub3V0cHV0ICs9IHRfNFxub3V0cHV0ICs9IFwiXFxuXCI7XG5jYihudWxsLCBvdXRwdXQpO1xufSl9KTtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xuYl9jb250ZW50OiBiX2NvbnRlbnQsXG5yb290OiByb290XG59O1xufSkoKTtcbnZhciBvbGRSb290ID0gb2JqLnJvb3Q7XG5vYmoucm9vdCA9IGZ1bmN0aW9uKCBlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYiApIHtcblx0dmFyIG9sZEdldFRlbXBsYXRlID0gZW52LmdldFRlbXBsYXRlO1xuXHRlbnYuZ2V0VGVtcGxhdGUgPSBmdW5jdGlvbiggbmFtZSwgZWMsIHBhcmVudE5hbWUsIGNiICkge1xuXHRcdGlmKCB0eXBlb2YgZWMgPT09IFwiZnVuY3Rpb25cIiApIHtcblx0XHRcdGNiID0gZWM7XG5cdFx0XHRlYyA9IGZhbHNlO1xuXHRcdH1cblx0XHR2YXIgX3JlcXVpcmUgPSBmdW5jdGlvbihuYW1lKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4gcmVxdWlyZShuYW1lKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKCBmcmFtZS5nZXQoIFwiX3JlcXVpcmVcIiApICkgcmV0dXJuIGZyYW1lLmdldCggXCJfcmVxdWlyZVwiICkoIG5hbWUgKVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0dmFyIHRtcGwgPSBfcmVxdWlyZSggbmFtZSApO1xuXHRcdGZyYW1lLnNldCggXCJfcmVxdWlyZVwiLCBfcmVxdWlyZSApO1xuXHRcdGlmKCBlYyApIHRtcGwuY29tcGlsZSgpO1xuXHRcdGNiKCBudWxsLCB0bXBsICk7XG5cdH07XHRvbGRSb290KCBlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBmdW5jdGlvbiggZXJyLCByZXMgKSB7XG5cdFx0ZW52LmdldFRlbXBsYXRlID0gb2xkR2V0VGVtcGxhdGU7XG5cdFx0Y2IoIGVyciwgcmVzICk7XG5cdH0gKTtcbn07XG52YXIgc3JjID0ge1xuXHRvYmo6IG9iaixcblx0dHlwZTogXCJjb2RlXCJcbn07XG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBudW5qdWNrcy5UZW1wbGF0ZSggc3JjLCBlbnYgKTtcbiIsIi8vdmFyIHN3aWcgPSByZXF1aXJlKCdzd2lnJyk7XG5cbi8qKlxuKlx0QcOxYWRpZW5kbyBmaWx0cm9zIGEgbGFzIHBsYW50aWxsYXNcbiovXG52YXIgbnVuanVja3MgPSByZXF1aXJlKCAnbnVuanVja3MnICk7XG5udW5qdWNrcy5lbnYgPSBuZXcgbnVuanVja3MuRW52aXJvbm1lbnQoKTtcbm51bmp1Y2tzLmVudi5hZGRGaWx0ZXIoICd0ZXN0JywgZnVuY3Rpb24oIHRlc3QgKSB7XG4gICAgcmV0dXJuIHRlc3QrJyAtLS0gVEVTVCc7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cblx0dGVtcGxhdGUgXHQ6IHJlcXVpcmUoJy4vdGVtcGxhdGVzL3Rlc3RUZW1wbGF0ZS5udW5qJyksXG5cdFxuXHRpbml0aWFsaXplIFx0OiBmdW5jdGlvbihvcHRpb25zKXtcblx0XHR0aGlzLm1vZHVsZUNvbmZpZyA9IF8uZXh0ZW5kKHt9LG9wdGlvbnMpO1xuXHRcdEJhY2tib25lLm9uKHtcblx0XHRcdCdjdXN0b206Y2hhbmdlJ1x0OiBfLmJpbmQodGhpcy5vbkN1c3RvbUNoYW5nZSx0aGlzKSxcblx0XHRcdCdjdXN0b206c3RhcnQnXHQ6IF8uYmluZCh0aGlzLm9uQ3VzdG9tU3RhcnQsdGhpcyksXG5cdFx0XHQnY3VzdG9tOmVuZCdcdDogXy5iaW5kKHRoaXMub25DdXN0b21FbmQsdGhpcyksXG5cdFx0fSk7XG5cdFx0dGhpcy5yZW5kZXIoKTtcblx0fSxcblx0cmVuZGVyIFx0XHQ6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy50ZW1wbGF0ZS5yZW5kZXIoe21lc3NhZ2U6IHRoaXMuJGVsLmF0dHIoJ2lkJyl9KSApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHRvbkN1c3RvbUNoYW5nZSBcdDogZnVuY3Rpb24oKXtcblx0XHRjb25zb2xlLmxvZyhcIltjaGFuZ2VdXCIsdGhpcyk7XG5cdH0sXG5cdG9uQ3VzdG9tU3RhcnQgXHQ6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc29sZS5sb2coXCJbc3RhcnRdXCIsdGhpcyk7XG5cdH0sXG5cdG9uQ3VzdG9tRW5kIFx0OiBmdW5jdGlvbigpe1xuXHRcdGNvbnNvbGUubG9nKFwiW2VuZF1cIix0aGlzKTtcblx0fSxcbn0pOyJdfQ==

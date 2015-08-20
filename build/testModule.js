(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.testModule = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports=window["nunjucks"];
},{}],2:[function(require,module,exports){
var nunjucks = require( "nunjucks" );
var env = nunjucks.env || new nunjucks.Environment();
var obj = (function () {function root(env, context, frame, runtime, cb) {
var lineno = null;
var colno = null;
var output = "";
try {
output += "<div class=\"thumbnail\">\n\t<img data-src=\"holder.js/100px250?text=";
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
output += "<div class=\"caption\">\n\t<h3>TestModule - <small>";
output += runtime.suppressValue(env.getFilter("test").call(context, runtime.contextOrFrameLookup(context, frame, "message")), env.opts.autoescape);
output += "</small></h3>\n\t<p>Módulo Window</p>\n\t<p><span>Beatae ex quibusdam, modi sed illo consequatur et! Ex neque quasi molestiae voluptates commodi fugiat repudiandae praesentium, officiis quas quidem vel nihil saepe aperiam accusantium, dolore libero obcaecati in quaerat.</span></p>\n\t<p><a href=\"#\" class=\"btn btn-primary\" role=\"button\">Button</a> <a href=\"#\" class=\"btn btn-default\" role=\"button\">Button</a></p>\n</div>";
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
    return test+' (Nunjucks Test Filter)';
});

var MOD = Backbone.View.extend({

	template 	: require('./templates/testTemplate.nunj'),
	
	initialize 	: function(options){
		this.moduleConfig = _.extend({},options);
		console.log('testModule');
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJudW5qdWNrc19icm93c2VyL251bmp1Y2tzX2Jyb3dzZXIuanMiLCJzcmMvdGVtcGxhdGVzL2xheW91dC5udW5qIiwic3JjL3RlbXBsYXRlcy9wYXJ0aWFscy9jb250ZW50Lm51bmoiLCJzcmMvdGVtcGxhdGVzL3Rlc3RUZW1wbGF0ZS5udW5qIiwic3JjL3Rlc3RNb2R1bGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cz13aW5kb3dbXCJudW5qdWNrc1wiXTsiLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCBcIm51bmp1Y2tzXCIgKTtcbnZhciBlbnYgPSBudW5qdWNrcy5lbnYgfHwgbmV3IG51bmp1Y2tzLkVudmlyb25tZW50KCk7XG52YXIgb2JqID0gKGZ1bmN0aW9uICgpIHtmdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG5vdXRwdXQgKz0gXCI8ZGl2IGNsYXNzPVxcXCJ0aHVtYm5haWxcXFwiPlxcblxcdDxpbWcgZGF0YS1zcmM9XFxcImhvbGRlci5qcy8xMDBweDI1MD90ZXh0PVwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm1lc3NhZ2VcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiJnJhbmRvbT15ZXNcXFwiID5cXG5cXHRcIjtcbmNvbnRleHQuZ2V0QmxvY2soXCJjb250ZW50XCIpKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGZ1bmN0aW9uKHRfMix0XzEpIHtcbmlmKHRfMikgeyBjYih0XzIpOyByZXR1cm47IH1cbm91dHB1dCArPSB0XzE7XG5vdXRwdXQgKz0gXCJcXG48L2Rpdj5cIjtcbmNiKG51bGwsIG91dHB1dCk7XG59KTtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5mdW5jdGlvbiBiX2NvbnRlbnQoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbm91dHB1dCArPSBcIlxcblxcdDxkaXYgY2xhc3M9XFxcImNhcHRpb25cXFwiPlxcblxcdFxcdDxoMz5UaHVtYm5haWwgbGFiZWw8L2gzPlxcblxcdFxcdDxwPi4uLjwvcD5cXG5cXHRcXHQ8cD48YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5XFxcIiByb2xlPVxcXCJidXR0b25cXFwiPkJ1dHRvbjwvYT4gPGEgaHJlZj1cXFwiI1xcXCIgY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdFxcXCIgcm9sZT1cXFwiYnV0dG9uXFxcIj5CdXR0b248L2E+PC9wPlxcblxcdDwvZGl2PlxcblxcdFwiO1xuY2IobnVsbCwgb3V0cHV0KTtcbjtcbn0gY2F0Y2ggKGUpIHtcbiAgY2IocnVudGltZS5oYW5kbGVFcnJvcihlLCBsaW5lbm8sIGNvbG5vKSk7XG59XG59XG5yZXR1cm4ge1xuYl9jb250ZW50OiBiX2NvbnRlbnQsXG5yb290OiByb290XG59O1xufSkoKTtcbnZhciBvbGRSb290ID0gb2JqLnJvb3Q7XG5vYmoucm9vdCA9IGZ1bmN0aW9uKCBlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYiApIHtcblx0dmFyIG9sZEdldFRlbXBsYXRlID0gZW52LmdldFRlbXBsYXRlO1xuXHRlbnYuZ2V0VGVtcGxhdGUgPSBmdW5jdGlvbiggbmFtZSwgZWMsIHBhcmVudE5hbWUsIGNiICkge1xuXHRcdGlmKCB0eXBlb2YgZWMgPT09IFwiZnVuY3Rpb25cIiApIHtcblx0XHRcdGNiID0gZWM7XG5cdFx0XHRlYyA9IGZhbHNlO1xuXHRcdH1cblx0XHR2YXIgX3JlcXVpcmUgPSBmdW5jdGlvbihuYW1lKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4gcmVxdWlyZShuYW1lKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKCBmcmFtZS5nZXQoIFwiX3JlcXVpcmVcIiApICkgcmV0dXJuIGZyYW1lLmdldCggXCJfcmVxdWlyZVwiICkoIG5hbWUgKVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0dmFyIHRtcGwgPSBfcmVxdWlyZSggbmFtZSApO1xuXHRcdGZyYW1lLnNldCggXCJfcmVxdWlyZVwiLCBfcmVxdWlyZSApO1xuXHRcdGlmKCBlYyApIHRtcGwuY29tcGlsZSgpO1xuXHRcdGNiKCBudWxsLCB0bXBsICk7XG5cdH07XHRvbGRSb290KCBlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBmdW5jdGlvbiggZXJyLCByZXMgKSB7XG5cdFx0ZW52LmdldFRlbXBsYXRlID0gb2xkR2V0VGVtcGxhdGU7XG5cdFx0Y2IoIGVyciwgcmVzICk7XG5cdH0gKTtcbn07XG52YXIgc3JjID0ge1xuXHRvYmo6IG9iaixcblx0dHlwZTogXCJjb2RlXCJcbn07XG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBudW5qdWNrcy5UZW1wbGF0ZSggc3JjLCBlbnYgKTtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3NcIiApO1xudmFyIGVudiA9IG51bmp1Y2tzLmVudiB8fCBuZXcgbnVuanVja3MuRW52aXJvbm1lbnQoKTtcbnZhciBvYmogPSAoZnVuY3Rpb24gKCkge2Z1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbm91dHB1dCArPSBcIjxkaXYgY2xhc3M9XFxcImNhcHRpb25cXFwiPlxcblxcdDxoMz5UZXN0TW9kdWxlIC0gPHNtYWxsPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShlbnYuZ2V0RmlsdGVyKFwidGVzdFwiKS5jYWxsKGNvbnRleHQsIHJ1bnRpbWUuY29udGV4dE9yRnJhbWVMb29rdXAoY29udGV4dCwgZnJhbWUsIFwibWVzc2FnZVwiKSksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9zbWFsbD48L2gzPlxcblxcdDxwPk3Ds2R1bG8gV2luZG93PC9wPlxcblxcdDxwPjxzcGFuPkJlYXRhZSBleCBxdWlidXNkYW0sIG1vZGkgc2VkIGlsbG8gY29uc2VxdWF0dXIgZXQhIEV4IG5lcXVlIHF1YXNpIG1vbGVzdGlhZSB2b2x1cHRhdGVzIGNvbW1vZGkgZnVnaWF0IHJlcHVkaWFuZGFlIHByYWVzZW50aXVtLCBvZmZpY2lpcyBxdWFzIHF1aWRlbSB2ZWwgbmloaWwgc2FlcGUgYXBlcmlhbSBhY2N1c2FudGl1bSwgZG9sb3JlIGxpYmVybyBvYmNhZWNhdGkgaW4gcXVhZXJhdC48L3NwYW4+PC9wPlxcblxcdDxwPjxhIGhyZWY9XFxcIiNcXFwiIGNsYXNzPVxcXCJidG4gYnRuLXByaW1hcnlcXFwiIHJvbGU9XFxcImJ1dHRvblxcXCI+QnV0dG9uPC9hPiA8YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0XFxcIiByb2xlPVxcXCJidXR0b25cXFwiPkJ1dHRvbjwvYT48L3A+XFxuPC9kaXY+XCI7XG5jYihudWxsLCBvdXRwdXQpO1xuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5yb290OiByb290XG59O1xufSkoKTtcbnZhciBvbGRSb290ID0gb2JqLnJvb3Q7XG5vYmoucm9vdCA9IGZ1bmN0aW9uKCBlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYiApIHtcblx0dmFyIG9sZEdldFRlbXBsYXRlID0gZW52LmdldFRlbXBsYXRlO1xuXHRlbnYuZ2V0VGVtcGxhdGUgPSBmdW5jdGlvbiggbmFtZSwgZWMsIHBhcmVudE5hbWUsIGNiICkge1xuXHRcdGlmKCB0eXBlb2YgZWMgPT09IFwiZnVuY3Rpb25cIiApIHtcblx0XHRcdGNiID0gZWM7XG5cdFx0XHRlYyA9IGZhbHNlO1xuXHRcdH1cblx0XHR2YXIgX3JlcXVpcmUgPSBmdW5jdGlvbihuYW1lKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRyZXR1cm4gcmVxdWlyZShuYW1lKTtcblx0XHRcdH0gY2F0Y2ggKGUpIHtcblx0XHRcdFx0aWYgKCBmcmFtZS5nZXQoIFwiX3JlcXVpcmVcIiApICkgcmV0dXJuIGZyYW1lLmdldCggXCJfcmVxdWlyZVwiICkoIG5hbWUgKVxuXHRcdFx0fVxuXHRcdH07XG5cdFx0dmFyIHRtcGwgPSBfcmVxdWlyZSggbmFtZSApO1xuXHRcdGZyYW1lLnNldCggXCJfcmVxdWlyZVwiLCBfcmVxdWlyZSApO1xuXHRcdGlmKCBlYyApIHRtcGwuY29tcGlsZSgpO1xuXHRcdGNiKCBudWxsLCB0bXBsICk7XG5cdH07XHRvbGRSb290KCBlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBmdW5jdGlvbiggZXJyLCByZXMgKSB7XG5cdFx0ZW52LmdldFRlbXBsYXRlID0gb2xkR2V0VGVtcGxhdGU7XG5cdFx0Y2IoIGVyciwgcmVzICk7XG5cdH0gKTtcbn07XG52YXIgc3JjID0ge1xuXHRvYmo6IG9iaixcblx0dHlwZTogXCJjb2RlXCJcbn07XG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBudW5qdWNrcy5UZW1wbGF0ZSggc3JjLCBlbnYgKTtcbiIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3NcIiApO1xudmFyIGVudiA9IG51bmp1Y2tzLmVudiB8fCBuZXcgbnVuanVja3MuRW52aXJvbm1lbnQoKTtcbnJlcXVpcmUoIFwiLi9sYXlvdXQubnVualwiICk7XG5yZXF1aXJlKCBcIi4vcGFydGlhbHMvY29udGVudC5udW5qXCIgKTtcbnZhciBvYmogPSAoZnVuY3Rpb24gKCkge2Z1bmN0aW9uIHJvb3QoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpIHtcbnZhciBsaW5lbm8gPSBudWxsO1xudmFyIGNvbG5vID0gbnVsbDtcbnZhciBvdXRwdXQgPSBcIlwiO1xudHJ5IHtcbmVudi5nZXRUZW1wbGF0ZShcIi4vbGF5b3V0Lm51bmpcIiwgdHJ1ZSwgdW5kZWZpbmVkLCBmdW5jdGlvbih0XzIscGFyZW50VGVtcGxhdGUpIHtcbmlmKHRfMikgeyBjYih0XzIpOyByZXR1cm47IH1cbmZvcih2YXIgdF8xIGluIHBhcmVudFRlbXBsYXRlLmJsb2Nrcykge1xuY29udGV4dC5hZGRCbG9jayh0XzEsIHBhcmVudFRlbXBsYXRlLmJsb2Nrc1t0XzFdKTtcbn1cbm91dHB1dCArPSBcIlxcblwiO1xucGFyZW50VGVtcGxhdGUucm9vdFJlbmRlckZ1bmMoZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IpO1xufSk7XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxuZnVuY3Rpb24gYl9jb250ZW50KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG5vdXRwdXQgKz0gXCJcXG5cXHRcIjtcbmVudi5nZXRUZW1wbGF0ZShcIi4vcGFydGlhbHMvY29udGVudC5udW5qXCIsIGZhbHNlLCB1bmRlZmluZWQsIGZ1bmN0aW9uKHRfNSx0XzMpIHtcbmlmKHRfNSkgeyBjYih0XzUpOyByZXR1cm47IH1cbnRfMy5yZW5kZXIoY29udGV4dC5nZXRWYXJpYWJsZXMoKSwgZnJhbWUucHVzaCgpLCBmdW5jdGlvbih0XzYsdF80KSB7XG5pZih0XzYpIHsgY2IodF82KTsgcmV0dXJuOyB9XG5vdXRwdXQgKz0gdF80XG5vdXRwdXQgKz0gXCJcXG5cIjtcbmNiKG51bGwsIG91dHB1dCk7XG59KX0pO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5iX2NvbnRlbnQ6IGJfY29udGVudCxcbnJvb3Q6IHJvb3Rcbn07XG59KSgpO1xudmFyIG9sZFJvb3QgPSBvYmoucm9vdDtcbm9iai5yb290ID0gZnVuY3Rpb24oIGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiICkge1xuXHR2YXIgb2xkR2V0VGVtcGxhdGUgPSBlbnYuZ2V0VGVtcGxhdGU7XG5cdGVudi5nZXRUZW1wbGF0ZSA9IGZ1bmN0aW9uKCBuYW1lLCBlYywgcGFyZW50TmFtZSwgY2IgKSB7XG5cdFx0aWYoIHR5cGVvZiBlYyA9PT0gXCJmdW5jdGlvblwiICkge1xuXHRcdFx0Y2IgPSBlYztcblx0XHRcdGVjID0gZmFsc2U7XG5cdFx0fVxuXHRcdHZhciBfcmVxdWlyZSA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJldHVybiByZXF1aXJlKG5hbWUpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAoIGZyYW1lLmdldCggXCJfcmVxdWlyZVwiICkgKSByZXR1cm4gZnJhbWUuZ2V0KCBcIl9yZXF1aXJlXCIgKSggbmFtZSApXG5cdFx0XHR9XG5cdFx0fTtcblx0XHR2YXIgdG1wbCA9IF9yZXF1aXJlKCBuYW1lICk7XG5cdFx0ZnJhbWUuc2V0KCBcIl9yZXF1aXJlXCIsIF9yZXF1aXJlICk7XG5cdFx0aWYoIGVjICkgdG1wbC5jb21waWxlKCk7XG5cdFx0Y2IoIG51bGwsIHRtcGwgKTtcblx0fTtcdG9sZFJvb3QoIGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGZ1bmN0aW9uKCBlcnIsIHJlcyApIHtcblx0XHRlbnYuZ2V0VGVtcGxhdGUgPSBvbGRHZXRUZW1wbGF0ZTtcblx0XHRjYiggZXJyLCByZXMgKTtcblx0fSApO1xufTtcbnZhciBzcmMgPSB7XG5cdG9iajogb2JqLFxuXHR0eXBlOiBcImNvZGVcIlxufTtcbm1vZHVsZS5leHBvcnRzID0gbmV3IG51bmp1Y2tzLlRlbXBsYXRlKCBzcmMsIGVudiApO1xuIiwiLy92YXIgc3dpZyA9IHJlcXVpcmUoJ3N3aWcnKTtcblxuLyoqXG4qXHRBw7FhZGllbmRvIGZpbHRyb3MgYSBsYXMgcGxhbnRpbGxhc1xuKi9cbnZhciBudW5qdWNrcyA9IHJlcXVpcmUoICdudW5qdWNrcycgKTtcbm51bmp1Y2tzLmVudiA9IG5ldyBudW5qdWNrcy5FbnZpcm9ubWVudCgpO1xubnVuanVja3MuZW52LmFkZEZpbHRlciggJ3Rlc3QnLCBmdW5jdGlvbiggdGVzdCApIHtcbiAgICByZXR1cm4gdGVzdCsnIChOdW5qdWNrcyBUZXN0IEZpbHRlciknO1xufSk7XG5cbnZhciBNT0QgPSBCYWNrYm9uZS5WaWV3LmV4dGVuZCh7XG5cblx0dGVtcGxhdGUgXHQ6IHJlcXVpcmUoJy4vdGVtcGxhdGVzL3Rlc3RUZW1wbGF0ZS5udW5qJyksXG5cdFxuXHRpbml0aWFsaXplIFx0OiBmdW5jdGlvbihvcHRpb25zKXtcblx0XHR0aGlzLm1vZHVsZUNvbmZpZyA9IF8uZXh0ZW5kKHt9LG9wdGlvbnMpO1xuXHRcdGNvbnNvbGUubG9nKCd0ZXN0TW9kdWxlJyk7XG5cdFx0QmFja2JvbmUub24oe1xuXHRcdFx0J2N1c3RvbTpjaGFuZ2UnXHQ6IF8uYmluZCh0aGlzLm9uQ3VzdG9tQ2hhbmdlLHRoaXMpLFxuXHRcdFx0J2N1c3RvbTpzdGFydCdcdDogXy5iaW5kKHRoaXMub25DdXN0b21TdGFydCx0aGlzKSxcblx0XHRcdCdjdXN0b206ZW5kJ1x0OiBfLmJpbmQodGhpcy5vbkN1c3RvbUVuZCx0aGlzKSxcblx0XHR9KTtcblx0XHR0aGlzLnJlbmRlcigpO1xuXHR9LFxuXHRyZW5kZXIgXHRcdDogZnVuY3Rpb24oKXtcblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLnRlbXBsYXRlLnJlbmRlcih7bWVzc2FnZTogdGhpcy4kZWwuYXR0cignaWQnKX0pICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cdG9uQ3VzdG9tQ2hhbmdlIFx0OiBmdW5jdGlvbigpe1xuXHRcdGNvbnNvbGUubG9nKFwiW2NoYW5nZV1cIix0aGlzKTtcblx0fSxcblx0b25DdXN0b21TdGFydCBcdDogZnVuY3Rpb24oKXtcblx0XHRjb25zb2xlLmxvZyhcIltzdGFydF1cIix0aGlzKTtcblx0fSxcblx0b25DdXN0b21FbmQgXHQ6IGZ1bmN0aW9uKCl7XG5cdFx0Y29uc29sZS5sb2coXCJbZW5kXVwiLHRoaXMpO1xuXHR9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0cywgcHVic3ViKXtcblx0aWYocHVic3ViKSBvcHRzLnB1YnN1YiA9IHB1YnN1Yjtcblx0cmV0dXJuIG5ldyBNT0Qob3B0cyk7XG59OyJdfQ==

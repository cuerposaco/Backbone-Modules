(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.asyncModule = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports=window["nunjucks"];
},{}],2:[function(require,module,exports){
var nunjucks = require( 'nunjucks' );
nunjucks.env = new nunjucks.Environment();
nunjucks.env.addFilter( 'test', function( test ) {
    return test+' (Nunjucks Test Filter)';
});

var MOD = Backbone.View.extend({

	template 	: require('./templates/asyncTemplate.nunj'),
	
	initialize 	: function(options){
		if(options){ _.extend(this,options); }
		console.log('asyncModule');
		this.render();
	},
	render 		: function(){
		this.$el.html( this.template.render({message: this.$el.attr('id')}) );
		this.postRender();
		return this;
	},
	postRender: function(){
		var scope = this;
		var $mods = $('[data-mod]', scope.$el);
		modLoader($mods);
	}
});

module.exports = function(opts, pubsub){
	if(pubsub) opts.pubsub = pubsub;
	return new MOD(opts);
};
},{"./templates/asyncTemplate.nunj":3,"nunjucks":1}],3:[function(require,module,exports){
var nunjucks = require( "nunjucks" );
var env = nunjucks.env || new nunjucks.Environment();
require( "./layout.nunj" );
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
output += "\n\t<div class=\"caption\">\n\t\t<h3>AsyncModule - <small>";
output += runtime.suppressValue(runtime.contextOrFrameLookup(context, frame, "message"), env.opts.autoescape);
output += "</small></h3>\n\t\t<p>Módulo asíncrono</p>\n\t\t<p><a href=\"#\" class=\"btn btn-primary\" role=\"button\">Button</a> <a href=\"#\" class=\"btn btn-default\" role=\"button\">Button</a></p>\n\t\t<div id=\"SubModulo\" data-mod=\"testModule\"></div>\n\t\t<div id=\"SubModulo2\" data-mod=\"testModule\"></div>\n\t\t<div id=\"SubModulo3\" data-mod=\"testModule\"></div>\n\t</div>\n";
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

},{"./layout.nunj":4,"nunjucks":1}],4:[function(require,module,exports){
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

},{"nunjucks":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJudW5qdWNrc19icm93c2VyL251bmp1Y2tzX2Jyb3dzZXIuanMiLCJzcmMvYXN5bmNNb2R1bGUuanMiLCJzcmMvdGVtcGxhdGVzL2FzeW5jVGVtcGxhdGUubnVuaiIsInNyYy90ZW1wbGF0ZXMvbGF5b3V0Lm51bmoiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cz13aW5kb3dbXCJudW5qdWNrc1wiXTsiLCJ2YXIgbnVuanVja3MgPSByZXF1aXJlKCAnbnVuanVja3MnICk7XG5udW5qdWNrcy5lbnYgPSBuZXcgbnVuanVja3MuRW52aXJvbm1lbnQoKTtcbm51bmp1Y2tzLmVudi5hZGRGaWx0ZXIoICd0ZXN0JywgZnVuY3Rpb24oIHRlc3QgKSB7XG4gICAgcmV0dXJuIHRlc3QrJyAoTnVuanVja3MgVGVzdCBGaWx0ZXIpJztcbn0pO1xuXG52YXIgTU9EID0gQmFja2JvbmUuVmlldy5leHRlbmQoe1xuXG5cdHRlbXBsYXRlIFx0OiByZXF1aXJlKCcuL3RlbXBsYXRlcy9hc3luY1RlbXBsYXRlLm51bmonKSxcblx0XG5cdGluaXRpYWxpemUgXHQ6IGZ1bmN0aW9uKG9wdGlvbnMpe1xuXHRcdGlmKG9wdGlvbnMpeyBfLmV4dGVuZCh0aGlzLG9wdGlvbnMpOyB9XG5cdFx0Y29uc29sZS5sb2coJ2FzeW5jTW9kdWxlJyk7XG5cdFx0dGhpcy5yZW5kZXIoKTtcblx0fSxcblx0cmVuZGVyIFx0XHQ6IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy50ZW1wbGF0ZS5yZW5kZXIoe21lc3NhZ2U6IHRoaXMuJGVsLmF0dHIoJ2lkJyl9KSApO1xuXHRcdHRoaXMucG9zdFJlbmRlcigpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXHRwb3N0UmVuZGVyOiBmdW5jdGlvbigpe1xuXHRcdHZhciBzY29wZSA9IHRoaXM7XG5cdFx0dmFyICRtb2RzID0gJCgnW2RhdGEtbW9kXScsIHNjb3BlLiRlbCk7XG5cdFx0bW9kTG9hZGVyKCRtb2RzKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ob3B0cywgcHVic3ViKXtcblx0aWYocHVic3ViKSBvcHRzLnB1YnN1YiA9IHB1YnN1Yjtcblx0cmV0dXJuIG5ldyBNT0Qob3B0cyk7XG59OyIsInZhciBudW5qdWNrcyA9IHJlcXVpcmUoIFwibnVuanVja3NcIiApO1xudmFyIGVudiA9IG51bmp1Y2tzLmVudiB8fCBuZXcgbnVuanVja3MuRW52aXJvbm1lbnQoKTtcbnJlcXVpcmUoIFwiLi9sYXlvdXQubnVualwiICk7XG52YXIgb2JqID0gKGZ1bmN0aW9uICgpIHtmdW5jdGlvbiByb290KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG5lbnYuZ2V0VGVtcGxhdGUoXCIuL2xheW91dC5udW5qXCIsIHRydWUsIHVuZGVmaW5lZCwgZnVuY3Rpb24odF8yLHBhcmVudFRlbXBsYXRlKSB7XG5pZih0XzIpIHsgY2IodF8yKTsgcmV0dXJuOyB9XG5mb3IodmFyIHRfMSBpbiBwYXJlbnRUZW1wbGF0ZS5ibG9ja3MpIHtcbmNvbnRleHQuYWRkQmxvY2sodF8xLCBwYXJlbnRUZW1wbGF0ZS5ibG9ja3NbdF8xXSk7XG59XG5vdXRwdXQgKz0gXCJcXG5cIjtcbnBhcmVudFRlbXBsYXRlLnJvb3RSZW5kZXJGdW5jKGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKTtcbn0pO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbmZ1bmN0aW9uIGJfY29udGVudChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xub3V0cHV0ICs9IFwiXFxuXFx0PGRpdiBjbGFzcz1cXFwiY2FwdGlvblxcXCI+XFxuXFx0XFx0PGgzPkFzeW5jTW9kdWxlIC0gPHNtYWxsPlwiO1xub3V0cHV0ICs9IHJ1bnRpbWUuc3VwcHJlc3NWYWx1ZShydW50aW1lLmNvbnRleHRPckZyYW1lTG9va3VwKGNvbnRleHQsIGZyYW1lLCBcIm1lc3NhZ2VcIiksIGVudi5vcHRzLmF1dG9lc2NhcGUpO1xub3V0cHV0ICs9IFwiPC9zbWFsbD48L2gzPlxcblxcdFxcdDxwPk3Ds2R1bG8gYXPDrW5jcm9ubzwvcD5cXG5cXHRcXHQ8cD48YSBocmVmPVxcXCIjXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1wcmltYXJ5XFxcIiByb2xlPVxcXCJidXR0b25cXFwiPkJ1dHRvbjwvYT4gPGEgaHJlZj1cXFwiI1xcXCIgY2xhc3M9XFxcImJ0biBidG4tZGVmYXVsdFxcXCIgcm9sZT1cXFwiYnV0dG9uXFxcIj5CdXR0b248L2E+PC9wPlxcblxcdFxcdDxkaXYgaWQ9XFxcIlN1Yk1vZHVsb1xcXCIgZGF0YS1tb2Q9XFxcInRlc3RNb2R1bGVcXFwiPjwvZGl2PlxcblxcdFxcdDxkaXYgaWQ9XFxcIlN1Yk1vZHVsbzJcXFwiIGRhdGEtbW9kPVxcXCJ0ZXN0TW9kdWxlXFxcIj48L2Rpdj5cXG5cXHRcXHQ8ZGl2IGlkPVxcXCJTdWJNb2R1bG8zXFxcIiBkYXRhLW1vZD1cXFwidGVzdE1vZHVsZVxcXCI+PC9kaXY+XFxuXFx0PC9kaXY+XFxuXCI7XG5jYihudWxsLCBvdXRwdXQpO1xuO1xufSBjYXRjaCAoZSkge1xuICBjYihydW50aW1lLmhhbmRsZUVycm9yKGUsIGxpbmVubywgY29sbm8pKTtcbn1cbn1cbnJldHVybiB7XG5iX2NvbnRlbnQ6IGJfY29udGVudCxcbnJvb3Q6IHJvb3Rcbn07XG59KSgpO1xudmFyIG9sZFJvb3QgPSBvYmoucm9vdDtcbm9iai5yb290ID0gZnVuY3Rpb24oIGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiICkge1xuXHR2YXIgb2xkR2V0VGVtcGxhdGUgPSBlbnYuZ2V0VGVtcGxhdGU7XG5cdGVudi5nZXRUZW1wbGF0ZSA9IGZ1bmN0aW9uKCBuYW1lLCBlYywgcGFyZW50TmFtZSwgY2IgKSB7XG5cdFx0aWYoIHR5cGVvZiBlYyA9PT0gXCJmdW5jdGlvblwiICkge1xuXHRcdFx0Y2IgPSBlYztcblx0XHRcdGVjID0gZmFsc2U7XG5cdFx0fVxuXHRcdHZhciBfcmVxdWlyZSA9IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHJldHVybiByZXF1aXJlKG5hbWUpO1xuXHRcdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0XHRpZiAoIGZyYW1lLmdldCggXCJfcmVxdWlyZVwiICkgKSByZXR1cm4gZnJhbWUuZ2V0KCBcIl9yZXF1aXJlXCIgKSggbmFtZSApXG5cdFx0XHR9XG5cdFx0fTtcblx0XHR2YXIgdG1wbCA9IF9yZXF1aXJlKCBuYW1lICk7XG5cdFx0ZnJhbWUuc2V0KCBcIl9yZXF1aXJlXCIsIF9yZXF1aXJlICk7XG5cdFx0aWYoIGVjICkgdG1wbC5jb21waWxlKCk7XG5cdFx0Y2IoIG51bGwsIHRtcGwgKTtcblx0fTtcdG9sZFJvb3QoIGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGZ1bmN0aW9uKCBlcnIsIHJlcyApIHtcblx0XHRlbnYuZ2V0VGVtcGxhdGUgPSBvbGRHZXRUZW1wbGF0ZTtcblx0XHRjYiggZXJyLCByZXMgKTtcblx0fSApO1xufTtcbnZhciBzcmMgPSB7XG5cdG9iajogb2JqLFxuXHR0eXBlOiBcImNvZGVcIlxufTtcbm1vZHVsZS5leHBvcnRzID0gbmV3IG51bmp1Y2tzLlRlbXBsYXRlKCBzcmMsIGVudiApO1xuIiwidmFyIG51bmp1Y2tzID0gcmVxdWlyZSggXCJudW5qdWNrc1wiICk7XG52YXIgZW52ID0gbnVuanVja3MuZW52IHx8IG5ldyBudW5qdWNrcy5FbnZpcm9ubWVudCgpO1xudmFyIG9iaiA9IChmdW5jdGlvbiAoKSB7ZnVuY3Rpb24gcm9vdChlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBjYikge1xudmFyIGxpbmVubyA9IG51bGw7XG52YXIgY29sbm8gPSBudWxsO1xudmFyIG91dHB1dCA9IFwiXCI7XG50cnkge1xub3V0cHV0ICs9IFwiPGRpdiBjbGFzcz1cXFwidGh1bWJuYWlsXFxcIj5cXG5cXHQ8aW1nIGRhdGEtc3JjPVxcXCJob2xkZXIuanMvMTAwcHgyNTA/dGV4dD1cIjtcbm91dHB1dCArPSBydW50aW1lLnN1cHByZXNzVmFsdWUocnVudGltZS5jb250ZXh0T3JGcmFtZUxvb2t1cChjb250ZXh0LCBmcmFtZSwgXCJtZXNzYWdlXCIpLCBlbnYub3B0cy5hdXRvZXNjYXBlKTtcbm91dHB1dCArPSBcIiZyYW5kb209eWVzXFxcIiA+XFxuXFx0XCI7XG5jb250ZXh0LmdldEJsb2NrKFwiY29udGVudFwiKShlbnYsIGNvbnRleHQsIGZyYW1lLCBydW50aW1lLCBmdW5jdGlvbih0XzIsdF8xKSB7XG5pZih0XzIpIHsgY2IodF8yKTsgcmV0dXJuOyB9XG5vdXRwdXQgKz0gdF8xO1xub3V0cHV0ICs9IFwiXFxuPC9kaXY+XCI7XG5jYihudWxsLCBvdXRwdXQpO1xufSk7XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxuZnVuY3Rpb24gYl9jb250ZW50KGVudiwgY29udGV4dCwgZnJhbWUsIHJ1bnRpbWUsIGNiKSB7XG52YXIgbGluZW5vID0gbnVsbDtcbnZhciBjb2xubyA9IG51bGw7XG52YXIgb3V0cHV0ID0gXCJcIjtcbnRyeSB7XG5vdXRwdXQgKz0gXCJcXG5cXHQ8ZGl2IGNsYXNzPVxcXCJjYXB0aW9uXFxcIj5cXG5cXHRcXHQ8aDM+VGh1bWJuYWlsIGxhYmVsPC9oMz5cXG5cXHRcXHQ8cD4uLi48L3A+XFxuXFx0XFx0PHA+PGEgaHJlZj1cXFwiI1xcXCIgY2xhc3M9XFxcImJ0biBidG4tcHJpbWFyeVxcXCIgcm9sZT1cXFwiYnV0dG9uXFxcIj5CdXR0b248L2E+IDxhIGhyZWY9XFxcIiNcXFwiIGNsYXNzPVxcXCJidG4gYnRuLWRlZmF1bHRcXFwiIHJvbGU9XFxcImJ1dHRvblxcXCI+QnV0dG9uPC9hPjwvcD5cXG5cXHQ8L2Rpdj5cXG5cXHRcIjtcbmNiKG51bGwsIG91dHB1dCk7XG47XG59IGNhdGNoIChlKSB7XG4gIGNiKHJ1bnRpbWUuaGFuZGxlRXJyb3IoZSwgbGluZW5vLCBjb2xubykpO1xufVxufVxucmV0dXJuIHtcbmJfY29udGVudDogYl9jb250ZW50LFxucm9vdDogcm9vdFxufTtcbn0pKCk7XG52YXIgb2xkUm9vdCA9IG9iai5yb290O1xub2JqLnJvb3QgPSBmdW5jdGlvbiggZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgY2IgKSB7XG5cdHZhciBvbGRHZXRUZW1wbGF0ZSA9IGVudi5nZXRUZW1wbGF0ZTtcblx0ZW52LmdldFRlbXBsYXRlID0gZnVuY3Rpb24oIG5hbWUsIGVjLCBwYXJlbnROYW1lLCBjYiApIHtcblx0XHRpZiggdHlwZW9mIGVjID09PSBcImZ1bmN0aW9uXCIgKSB7XG5cdFx0XHRjYiA9IGVjO1xuXHRcdFx0ZWMgPSBmYWxzZTtcblx0XHR9XG5cdFx0dmFyIF9yZXF1aXJlID0gZnVuY3Rpb24obmFtZSkge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cmV0dXJuIHJlcXVpcmUobmFtZSk7XG5cdFx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHRcdGlmICggZnJhbWUuZ2V0KCBcIl9yZXF1aXJlXCIgKSApIHJldHVybiBmcmFtZS5nZXQoIFwiX3JlcXVpcmVcIiApKCBuYW1lIClcblx0XHRcdH1cblx0XHR9O1xuXHRcdHZhciB0bXBsID0gX3JlcXVpcmUoIG5hbWUgKTtcblx0XHRmcmFtZS5zZXQoIFwiX3JlcXVpcmVcIiwgX3JlcXVpcmUgKTtcblx0XHRpZiggZWMgKSB0bXBsLmNvbXBpbGUoKTtcblx0XHRjYiggbnVsbCwgdG1wbCApO1xuXHR9O1x0b2xkUm9vdCggZW52LCBjb250ZXh0LCBmcmFtZSwgcnVudGltZSwgZnVuY3Rpb24oIGVyciwgcmVzICkge1xuXHRcdGVudi5nZXRUZW1wbGF0ZSA9IG9sZEdldFRlbXBsYXRlO1xuXHRcdGNiKCBlcnIsIHJlcyApO1xuXHR9ICk7XG59O1xudmFyIHNyYyA9IHtcblx0b2JqOiBvYmosXG5cdHR5cGU6IFwiY29kZVwiXG59O1xubW9kdWxlLmV4cG9ydHMgPSBuZXcgbnVuanVja3MuVGVtcGxhdGUoIHNyYywgZW52ICk7XG4iXX0=

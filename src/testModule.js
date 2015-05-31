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
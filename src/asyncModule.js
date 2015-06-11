var nunjucks = require( 'nunjucks' );
nunjucks.env = new nunjucks.Environment();
nunjucks.env.addFilter( 'test', function( test ) {
    return test+' (Nunjucks Test Filter)';
});

module.exports = Backbone.View.extend({

	template 	: require('./templates/asyncTemplate.nunj'),
	
	initialize 	: function(options){
		if(options){ _.extend(this,options); }
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
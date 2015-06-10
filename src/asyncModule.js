module.exports = Backbone.View.extend({

	template 	: require('./templates/asyncTemplate.nunj'),
	
	initialize 	: function(options){
		if(options){ _.extend(this,options); }
		this.render();
	},
	render 		: function(){
		this.$el.html( this.template.render({message: this.$el.attr('id')}) );
		return this;
	}
});
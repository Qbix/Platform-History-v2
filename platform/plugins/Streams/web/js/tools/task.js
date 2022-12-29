(function (Q, $) {

/**
 * Streams Tools
 * @module Streams-tools
 * @main
 */

/**
 * Standard interface for displaying progress on a task
 * @class Streams task
 * @constructor
 * @param {String} prefix Prefix of the tool to be constructed.
 * @param {Object} [options] A hash of options, containing:
 *   @param {String} [options.userId] The id of the user object. Can be '' for a blank-looking avatar.
 */	
Q.Tool.define("Streams/task", function(options) {
	var tool = this;
	var state = tool.state;
	Q.Streams.get(state.publisherId, state.streamName, function (err) {
		if (err) return;
		this.onAttribute('progress').set(function (attributes, k) {
			tool.refresh(attributes);
		}, tool);
		tool.stream = this
		if (tool.element.innerHTML) {
			return tool.refresh();
		}
		Q.Template.render('Streams/task', function (err, html) {
			Q.replace(tool.element, html);;
			tool.refresh();
		});
	});
},
{
	publisherId: null,
	streamName: null
},
{
	refresh: function (attributes) {
		var tool = this;
		var state = tool.state;
		var stream = tool.stream;
		if (!stream) return;
		var progress = (attributes && attributes.progress) || stream.getAttribute('progress');
		tool.$('.Streams_task_progress_bar').css('width', (progress*100)+'%');
	}
});

Q.Template.set('Streams/task',
	'<div class="Streams_task_progress">'
	+ '<div class="Streams_task_progress_bar"></div>'
	+ '</div>'
);

})(Q, jQuery);
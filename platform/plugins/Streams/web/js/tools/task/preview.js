(function (Q, $, window, undefined) {

var Streams = Q.Streams;

/**
 * @module Streams-tools
 */

/**
 * Play Streams/task stream.
 * @class Streams task
 * @constructor
 * @param {Object} [options] any options for the tool
 * @param {String} [options.publisherId]
 * @param {String} [options.streamName]
 * @param {String} [options.progress=Q/progress] - progress bar style, can be Q/progress and Q/pie
 */
Q.Tool.define("Streams/task/preview", function (options) {
	var tool = this;
	var state = this.state;

	if (!state.publisherId) {
		throw new Q.Error("publisherId required");
	}
	if (!state.streamName) {
		throw new Q.Error("streamName required");
	}

	tool.refresh();
},

{
	publisherId: null,
	streamName: null,
	progress: "Q/progress"
},

{
	refresh: function () {
		var tool = this;
		var state = this.state;

		Q.Streams.retainWith(true).get(state.publisherId, state.streamName, function (err) {
			if (err) {
				return;
			}

			this.onMessage('').set(function (message) {
				switch (message.type) {
					case "Streams/task/progress":
						tool.progressTool.state.fraction = message.getInstruction('progress');
						tool.progressTool.stateChanged('fraction');
						break;
					case "Streams/task/error":
						var instructions = message.getAllInstructions();
						var $table = $("<table class='Calendars_import_errors'>");
						for (var key in instructions) {
							$table.append($("<tr><td>" + key + ":</td><td>" + instructions[key] + "</td></tr>"));
						}
						Q.Dialogs.push({
							'title': tool.text.import.errorsTitle,
							'content': $table,
							'className': 'Q_alert',
							'fullscreen': false,
							'hidePrevious': true
						});
						break;
					case "Streams/task/complete":
						tool.progressTool.state.fraction = 100;
						tool.progressTool.stateChanged('fraction');
						break;
				}
			}, tool);

			if (tool.progressTool) {
				tool.progressTool.initPos();
			} else {
				$(tool.element).tool(state.progress, {
					size: 100,
					color: 'green'
				}).activate(function () {
					tool.progressTool = this;
				});
			}
		});
	}
});

})(Q, Q.$, window);
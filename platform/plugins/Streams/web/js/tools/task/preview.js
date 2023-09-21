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
 * @param {Q.Event} [options.onError] - occur when task complete with errors
 * @param {Q.Event} [options.onComplete] - occur when task complete
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
	progress: "Q/progress",
	onError: new Q.Event(),
	onComplete: new Q.Event()
},

{
	refresh: function () {
		var tool = this;
		var state = this.state;

		Q.Streams.retainWith(true).get(state.publisherId, state.streamName, function (err) {
			if (err) {
				return;
			}

			var stream = this;
			if (tool.progressTool) {
				tool.progressTool.initPos();
			} else {
				$(tool.element).tool(state.progress, {
					size: 100,
					color: 'green',
					showProgress: true
				}).activate(function () {
					tool.progressTool = Q.Tool.from(tool.element, state.progress);

					stream.onMessage('').set(function (message) {
						switch (message.type) {
							case "Streams/task/progress":
								tool.progressTool.state.fraction = parseInt(message.getInstruction('progress'));
								tool.progressTool.stateChanged('fraction');
								break;
							case "Streams/task/error":
								var instructions = message.getAllInstructions();
								var $table = $("<table class='Calendars_import_errors'>");
								for (var key in instructions) {
									$table.append($("<tr><td>" + key + ":</td><td>" + instructions[key] + "</td></tr>"));
								}
								Q.Dialogs.push({
									'title': tool.text.task.errorsTitle,
									'content': $table,
									'className': 'Streams_task_errors',
									'fullscreen': false,
									'hidePrevious': true
								});
								Q.handle(state.onError, tool, [instructions]);
								break;
							case "Streams/task/complete":
								tool.progressTool.state.fraction = 100;
								tool.progressTool.stateChanged('fraction');
								Q.handle(state.onComplete, tool);
								break;
						}
					}, tool);
				});
			}
		});
	}
});

})(Q, Q.$, window);
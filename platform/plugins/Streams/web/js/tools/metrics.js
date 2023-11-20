(function (Q, $, window, undefined) {

/**
 * Streams/metrics tool.
 * Renders a metrics for some stream
 * @class Streams/metrics
 * @constructor
 * @param {Object} [options] options to pass
 */
Q.Tool.define("Streams/metrics", function(options) {
	var tool = this;
	var state = this.state;

	if (!state.publisherId) {
		throw new Q.Error("Streams/metrics: publisherId undefined");
	}
	if (!state.streamName) {
		throw new Q.Error("Streams/metrics: streamName undefined");
	}

	// get video/audio duration
	if (state.duration) {
		tool.refresh();
	} else {
		if (state.streamName.startsWith("Streams/video") || state.streamName.startsWith("Streams/audio")) {
			Q.Streams.get(state.publisherId, state.streamName, function (err) {
				if (err) {
					return;
				}

				state.duration = this.getAttribute("duration");
				if (!state.duration) {
					throw new Q.Error("Streams/metrics: duration undefined");
				}

				tool.refresh();
			});
		}
	}
},

{
	publisherId: null,
	streamName: null,
	duration: null
},

{
	refresh: function () {
		var tool = this;
		var state = tool.state;

		Q.req("Streams/metrics", "metrics", function (err, response) {
			if (err) {
				return;
			}

			Q.each(response.slots.metrics, function (i, metrics) {
				$("<div>").tool("Users/avatar", {userId: metrics.fields.userId}).appendTo(tool.element).activate();
				var dataJSON = JSON.parse(metrics.fields.metrics);
				debugger
			});
		}, {
			fields: {
				publisherId: state.publisherId,
				streamName: state.streamName
			}
		});
	}
});

Q.Template.set('Streams/metrics/tool',
``,
	{text: ['Streams/content']}
);

})(Q, Q.$, window);
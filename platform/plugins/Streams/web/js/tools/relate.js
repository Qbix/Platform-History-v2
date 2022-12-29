(function (Q, $) {

/**
 * @module Streams-tools
 */

/**
 * Lets the user search for streams they can relate a given stream to, and relate it
 * @class Streams relate
 * @constructor
 * @param {Object} options Override various options for this tool
 * @param {String} options.publisherId publisher id of the stream to relate
 * @param {String} options.streamName name of stream to relate
 * @param {Array} options.types the types of streams the user can select
 * @param {String} options.relationType the type of the relation to create
 * @param {String} [options.communityId=Q.Users.communityId] id of the user publishing the streams to relate to
 * @param {Object} [options.typeNames] pairs of {type: typeName} to override names of the types, which would otherwise be taken from the types
 * @param {Boolean} [options.multiple=true] whether the user can select multiple types for the lookup
 * @param {Boolean} [options.relateFrom=false] if true, will relate FROM the user-selected stream TO the streamName instead
 * @param {String} [options.types] the types of streams the user can select
 * @param {Q.Event} [options.onRelate] This event handler occurs when a stream is successfully related
 */
Q.Tool.define("Streams/relate", function _Streams_relate_tool (options) {
	// check for required options
	var state = this.state;
	if (!state.publisherId || !state.streamName) {
		throw new Q.Error("Streams/relate tool: missing publisherId or streamName");
	}
	if (Q.isEmpty(state.types)) {
		throw new Q.Error("Streams/relate tool: missing types");
	}
	if (Q.isEmpty(state.relationType)) {
		throw new Q.Error("Streams/relate tool: missing relationType");
	}
	// render the tool
	this.refresh();
}, {
	publisherId: null,
	streamName: null,
	communityId: Q.Users.communityId,
	relationType: null,
	relateFrom: false,
	types: [],
	typeNames: {},
	onRefresh: new Q.Event(),
	onRelate: new Q.Event()
}, {
	/**
	 * Call this method to refresh the contents of the tool, requesting only
	 * what's needed and redrawing only what's needed.
	 * @method refresh
	 * @param {Function} An optional callback to call after refresh has completed.
	 *  It receives (result, entering, exiting, updating) arguments.
	 */
	refresh: function (callback) {
		var tool = this;
		var state = tool.state;
		var publisherId = state.publisherId;
		var streamName = state.streamName;
		fields = Q.extend({}, state, {
			'.Q_filter_tool': {
				'placeholder': 'foo'
			}
		});
		Q.Template.render('Streams/relate/tool', fields, function (err, html) {
			var msg;
			if (msg = Q.firstErrorMessage(err)) {
				return alert(msg);
			}
			Q.replace(tool.element, html);;
			Q.activate(tool.element, {
				'.Streams_lookup_tool': state
			}, function () {
				var lookup = tool.lookup = tool.child('Streams_lookup');
				lookup.state.onChoose.set(function (streamName) {
					tool.chosenStreamName = streamName;
				});
				tool.$button = tool.$('.Streams_relate_button').click(function (event) {
					if (!tool.chosenStreamName) {
						return;
					}
					Q.Streams.get(state.publisherId, state.streamName, function () {
						var stateStream = this;
						stateStream.relateTo(state.relationType, state.communityId, streamName,
						function (err) {
							if (err) return lookup.filter.end('');
							Q.Streams.get(state.communityId, tool.chosenStreamName,
							function () {
								if (!err) {
									Q.handle(state.onRelate, tool, [stateStream, this]);
								}
								lookup.filter.end('');
							});
						});
					});
					event.preventDefault();
				});
				Q.handle(callback, tool);
				Q.handle(state.onRefresh, tool);
			});
		});
	},
	Q: {
		beforeRemove: function () {

		}
	}
});

Q.Template.set('Streams/relate/tool',
	'{{&tool "Streams/lookup" ""}} <button class="Streams_relate_button Q_button">Post it</button>'
);

})(Q, jQuery);
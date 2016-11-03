(function (Q, $) {

/**
 * @module Streams-tools
 */

/**
 * Lets the user search for streams they can relate a given stream to, and relate it
 * @class Streams relate
 * @constructor
 * @param {array} [options] Override various options for this tool
 * @param {string} publisherId publisher id of the stream to relate
 * @param {string} streamName name of stream to relate
 * @param {string} [communityId=Users::communityId()] id of the user publishing the streams to relate to
 * @param {array} [types=Q_Config::expect('Streams','relate','types')] the types of streams the user can select
 * @param {Object} [typeNames] pairs of {type: typeName} to override names of the types, which would otherwise be taken from the types
 * @param {boolean} [relateFrom=false] if true, will relate FROM the user-selected stream TO the streamName instead
 * @param {string} [types] the types of streams the user can select
 */
Q.Tool.define("Streams/relate",

function _Streams_relate_tool (options)
{
	// check for required options
	var state = this.state;
	if ((!state.publisherId || !state.streamName)
	&& (!state.stream || Q.typeOf(state.stream) !== 'Streams.Stream')) {
		throw new Q.Error("Streams/relate tool: missing publisherId or streamName");
	}
	if (Q.isEmpty(state.types)) {
		throw new Q.Error("Streams/relate tool: missing types");
	}
	// render the tool
	this.refresh();
},

{
	publisherId: Q.info.app,
	streamName: null,
	communityId: Q.Users.communityId,
	relateFrom: false,
	types: [],
	typeNames: [],
	onRefresh: new Q.Event()
},

{
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
			tool.element.innerHTML = html;
			Q.activate(tool.element, {
				'.Streams_lookup_tool': state
			});
		});
	},
	Q: {
		beforeRemove: function () {

		}
	}
}

);

Q.Template.set('Streams/relate/tool',
	'{{&tool "Streams/lookup"}}'
);

})(Q, jQuery);
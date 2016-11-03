(function (Q, $) {

/**
 * @module Streams-tools
 */

/**
 * Lets the user search for streams they can lookup a given stream to, and lookup it
 * @class Streams lookup
 * @constructor
 * @param {Array} [options] Override various options for this tool
 * @param {String} publisherId publisher id of the stream to lookup
 * @param {String} streamName name of stream to lookup
 * @param {String} [communityId=Users::communityId()] id of the user publishing the streams to lookup to
 * @param {Array} [types=Q_Config::expect('Streams','lookup','types')] the types of streams the user can select
 * @param {Object} [typeNames] pairs of {type: typeName} to override names of the types, which would otherwise be taken from the types
 * @param {String} [types] the types of streams the user can select
 */
Q.Tool.define("Streams/lookup",

function _Streams_lookup_tool (options)
{
	// check for required options
	var state = this.state;
	if ((!state.publisherId || !state.streamName)
	&& (!state.stream || Q.typeOf(state.stream) !== 'Streams.Stream')) {
		throw new Q.Error("Streams/lookup tool: missing publisherId or streamName");
	}
	if (Q.isEmpty(state.types)) {
		throw new Q.Error("Streams/lookup tool: missing types");
	}
	// render the tool
	this.refresh();
},

{
	publisherId: Q.info.app,
	streamName: null,
	communityId: Q.Users.communityId,
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
		for (var i=0; i<state.types.length; ++i) {
			var type = state.types[i];
			if (!state.typeNames[type]) {
				state.typeNames[type] = state.types[i].split('/').pop().toCapitalized();
			}
		}
		fields = Q.extend({}, state);
		Q.Template.render('Streams/lookup/tool', fields, function (err, html) {
			var msg;
			if (msg = Q.firstErrorMessage(err)) {
				return alert(msg);
			}
		});
	},
	Q: {
		beforeRemove: function () {

		}
	}
}

);

Q.Template.set('Streams/lookup/tool',
	'<select name="streamType">\n'
	+ '{{#each types}}\n'
	+ '<option value="{{this}}">{{lookup ../typeNames this}}</option>\n'
	+ '{{/each}}\n'
	+ '</select>\n'
	+ '{{&tool "Q/filter"}}'
);

})(Q, jQuery);
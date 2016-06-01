(function (Q, $, window, undefined) {

/**
 * @module Streams-tools
 */

/**
 * Renders a large tool for a Streams/category stream
 * @class Streams category
 * @constructor
 * @param {Object} [options] this object contains function parameters
 * @param {Object} [options.publisherId=Q.Users.communityId] The id of the user publishing the Streams/category
 * @param {Object} options.streamName The name of the Streams/category stream
 * @param {Object} [options.related] Any options to pass to the Streams/related tool
 */
Q.Tool.define('Streams/category', function () {
	
	var tool = this;
	var state = tool.state;
	
	if (!state.streamName) {
		throw new Q.Error("Streams/category tool: missing options.streamName");
	}
	
	if (!this.$('.Streams_related_tool').length) {
		var element = Q.Tool.setUpElement('div', 'Streams/related',
		Q.extend(state.related, {
			publisherId: state.publisherId,
			streamName: state.streamName
		}));
		$(element).appendTo(tool.element).activate();
	}	
},

{
	// default options
	publisherId: Q.Users.communityId,
	related: {}
},

{
	// methods
}

);

})(Q, jQuery, window);
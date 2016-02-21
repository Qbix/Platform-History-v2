(function (Q, $, window, undefined) {

/**
 * @module Streams-tools
 */

/**
 * Renders a player for a Streams/category stream
 * @class Streams category player
 * @constructor
 * @param {Object} [options] this object contains function parameters
 * @param {Object} options.publisherId The id of the user publishing the Streams/category
 * @param {Object} options.streamName The name of the Streams/category stream
 * @param {Object} [options.related] Any options to pass to the Streams/related tool
 */
Q.Tool.define('Streams/category/player', function () {
	
	var tool = this;
	var state = tool.state;
	
	if (!state.publisherId) {
		throw new Q.Error("Streams/category/player tool: missing options.publisherId");
	}
	if (!state.streamName) {
		throw new Q.Error("Streams/category/player tool: missing options.streamName");
	}
	
	var element = Q.Tool.setUpElement('div', 'Streams/related',
	Q.extend(state.related, {
		publisherId: state.publisherId,
		streamName: state.streamName
	}));
	$(element).appendTo(tool.element).activate();
	
},

{
	// default options
	related: {}
},

{
	// methods
}

);

})(Q, jQuery, window);
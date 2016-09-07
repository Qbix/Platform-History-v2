(function (Q, $, window, document, undefined) {

/**
 * @module Websites-tools
 */

/**
 * Renders a Websites/slide stream,
 * including an interface to edit the presentation slide
 * for users who have the permissions to do so.
 * @method Websites slide
 * @param {Object} options
 * @param {String} options.publisherId
 * @param {String} options.streamName
 */
Q.Tool.define("Websites/slide", function () {
	var tool = this;
	var state = tool.state;
	$('<div />').tool('Streams/html', {
		publisherId: state.publisherId,
		streamName: state.streamName,
		field: 'html'
	}).appendTo(tool.element).activate();
},

{

}

);

})(Q, jQuery, window, document);
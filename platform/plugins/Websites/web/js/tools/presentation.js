(function (Q, $, window, document, undefined) {

/**
 * @module Websites-tools
 */

/**
 * Renders a Websites/presentation stream,
 * including an interface to edit the presentation
 * for users who have the permissions to do so.
 * @method Websites presentation
 * @param {Object} options
 * @param {String} options.publisherId
 * @param {String} options.streamName
 */
Q.Tool.define("Websites/presentation", function () {
	var tool = this;
	var state = tool.state;
	$('<div />').tool('Streams/related', {
		publisherId: state.publisherId,
		streamName: state.streamName,
		creatable: {
			'Websites/slide': {
				title: 'New Slide'
			}
		},
		'.Websites_slide_preview_tool': {
			onInvoke: 'Q.Websites.presentation.invoke'
		},
		relationType: 'Websites/slides'
	}).appendTo(tool.element).activate();
},

{

}

);

})(Q, jQuery, window, document);
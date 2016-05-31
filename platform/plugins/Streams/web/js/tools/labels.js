(function (Q, $, window, undefined) {

var Streams = Q.Streams;
var Users = Q.Users;

/**
 * @module Streams-tools
 */

/**
 * Renders an interface to edit labels
 * @class Streams labels
 * @constructor
 * @param {Object} [options] any options for the tool
 * @param {Q.Event} [options.prefix='Users/'] When the user selects a contact
 * @param {Q.Event} [options.onSelect] When the user selects a contact
 */
Q.Tool.define("Streams/labels", function(options) {

	var tool = this;
	var state = tool.state;
	var publisherId = state.publisherId || Users.loggedInUserId();
	if (!state.prefix || state.prefix.substr(-1) !== '/') {
		throw new Q.Error("Streams/labels: prefix must end in a slash");
	}
	if (!publisherId) {
		throw new Q.Error("Streams/labels: publisherId is empty");
	}
	Q.Tool.setUpElement('div', 'Streams/related', {
		publisherId: options.publisherId,
		streamName: 'Streams/labels',
		relationType: 'labels',
		tag: 'div',
		isCategory: true,
		creatable: 'Streams/label'
	});

},

{
	onSelect: new Q.Event()
},

{
	refresh: function (stream, onLoad) {
		var tpl = (state.editable !== false || stream.testWriteLevel('suggest'))
			? 'edit' 
			: 'view';
		Q.Template.render(
			'Streams/image/preview/'+tpl,
			fields,
			function (err, html) {
				if (err) return;
			},
			state.templates[tpl]
		);
	}
}

);

Q.Template.set('Streams/contacts/contact/view',
	'<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_image_preview_icon">'
	+ '<div class="Streams_image_preview_title {{titleClass}}">'
	+ '{{#if showTitle}}'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '{{/if}}'
	+ '</div></div>'
);

})(Q, jQuery, window);
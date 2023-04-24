(function (Q, $, window, undefined) {

/**
 * @module Streams-tools
 */

/**
 * Default tool for rendering a stream preview, which also serves as
 * a reference implementation.
 * Requires Streams/preview tool to be activated on the same element.
 * @class Streams default preview
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {Object} [options.inplace] Any options to pass to the Q/inplace tool -- see its options.
 *   @uses Q inplace
 *   @param {Object} [options.templates] Under the keys "views", "edit" and "create"
 *    you can override options for Q.Template.render .
 *     @param {Object} [options.templates.view]
 *       @param {String} [options.templates.view.name='Streams/image/preview/view']
 *       @param {Object} [options.templates.view.fields]
 *         @param {String} [options.templates.view.fields.alt]
 *         @param {String} [options.templates.view.fields.titleClass]
 *         @param {String} [options.templates.view.fields.titleTag]
 *     @param {Object} [options.templates.edit]
 *       @param {String} [options.templates.edit.name='Streams/image/preview/edit']
 *       @param {Object} [options.templates.edit.fields]
 *         @param {String} [options.templates.edit.fields.alt]
 *         @param {String} [options.templates.edit.fields.titleClass]
 *         @param {String} [options.templates.edit.fields.titleTag]
 *   @param {Q.Event} [options.onInvoke] onInvoke fires during Q.Pointer.fastclick
 *    and your handlers should open the corresponding full stream tool in a dialog or page.
 *    The first parameter is the preview tool.
 *   @param {Q.Event} [options.onRefresh] fires when tool template rendered
 */
Q.Tool.define("Streams/default/preview", "Streams/preview",
function _Streams_default_preview(options, preview) {
	var tool = this;
	tool.preview = preview;
	preview.state.onRefresh.add(tool.refresh.bind(this));
	$(tool.element).on(Q.Pointer.fastclick, function () {
		Q.handle(tool.state.onInvoke, tool, [preview]);
	});
},

{
	inplace: {},
	templates: {
		view: {
			name: 'Streams/default/preview/view',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
		},
		edit: {
			name: 'Streams/default/preview/edit',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
		}
	},
	onInvoke: new Q.Event(function () {
		var ps = this.preview.state;
		Q.Streams.get(ps.publisherId, ps.streamName, function (err, stream) {
			if (stream) {
				var url = url = stream.url();
				if (url) {
					Q.handle(url);
				}
			}
		});
	}, 'Streams/default/preview'),
	onRefresh: new Q.Event()
},

{
	refresh: function (stream, onLoad) {
		var tool = this;
		var state = tool.state;
		var ps = tool.preview.state;
		// set up a pipe to know when the icon has loaded
		var p = Q.pipe(['inplace', 'icon'], function () {
			Q.handle(onLoad, tool);
		});
		// set up the inplace options
		var inplace = null;
		if (state.inplace) {
			var inplaceOptions = Q.extend({
				publisherId: ps.publisherId,
				streamName: ps.streamName,
				field: 'title',
				inplaceType: 'text'
			}, state.inplace);
			var se = ps.editable;
			if (!se || (se !== true && se.indexOf('title') < 0)) {
				inplaceOptions.editable = false;
			}
			inplace = tool.setUpElementHTML('div', 'Streams/inplace', inplaceOptions);
		}
		// render a template
		var f = state.template && state.template.fields;
		var editable = stream.testWriteLevel('suggest');
		var mode = editable ? 'edit' : 'view';
		var fields = Q.extend({}, state.templates[mode].fields, f, {
			alt: 'icon',
			title: stream.fields.title,
			inplace: inplace
		});
		var tpl = (ps.editable !== false && editable) ? 'edit' : 'view';
		Q.Template.render(
			'Streams/default/preview/'+tpl,
			fields,
			function (err, html) {
				if (err) return;
				Q.replace(tool.element, html);;
				Q.activate(tool, function () {
					// load the icon
					var jq = tool.$('img.Streams_preview_icon');
					tool.preview.icon(jq[0], p.fill('icon'));
					var $pc = tool.$('.Streams_preview_contents');
					if ($pc.parent().is(":visible")) {
						$pc.width(0).width($pc[0].remainingWidth());
					}
					Q.onLayout(tool.element).set(function () {
						var $pc = tool.$('.Streams_preview_contents');
						if ($pc.parent().is(':visible')) {
							$pc.width(0).width($pc[0].remainingWidth());	
						}
					}, tool);
					Q.handle(state.onRefresh, tool);
					var inplace = tool.child('Streams_inplace');
					if (!inplace) {
						stream.onFieldChanged("title").set(function (modFields, field) {
							tool.$(".Streams_preview_title").html(modFields[field]);
						}, tool);

						return p.fill('inplace').apply(this, arguments);
					}
					inplace.state.onLoad.add(function () {
						p.fill('inplace').apply(this, arguments);
					});
				});
			},
			state.templates[tpl]
		);
	}
}

);

Q.Template.set('Streams/default/preview/view',
	'<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_icon" src="">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title Streams_preview_view">{{title}}</{{titleTag}}>'
	+ '</div></div>'
);

Q.Template.set('Streams/default/preview/edit',
	'<div class="Streams_preview_container Streams_preview_edit Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_icon" src="">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{& inplace}}</{{titleTag}}>'
	+ '</div></div>'
);

})(Q, Q.$, window);
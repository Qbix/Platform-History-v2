(function (Q, $, window, undefined) {

/**
 * @module Streams-tools
 */

/**
 * Renders a preview for a Streams/category stream
 * Requires Streams/preview tool to be activated on the same element.
 * @class Streams category preview
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {Object} [options.invoke] Any additional options to pass to Q.invoke(), or pass false to cancel this feature
 *   @param {Object} [options.subcategory] Any options to pass to Streams/category tool in the dialogs
 *   @uses Q inplace
 *   @param {Object} [options.inplace] Any options to pass to the Q/inplace tool -- see its options.
 *   @uses Q inplace
 *   @param {Object} [options.templates] Under the keys "views", "edit" and "create" you can override options for Q.Template.render .
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
 */
Q.Tool.define("Streams/category/preview", "Streams/preview",
function _Streams_category_preview(options, preview) {
	var tool = this;
	tool.preview = preview;
	preview.state.onRefresh.add(tool.refresh.bind(tool));
},

{
	inplace: {},
	templates: {
		view: {
			name: 'Streams/category/preview/view',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
		},
		edit: {
			name: 'Streams/category/preview/edit',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
		}
	},
	invoke: {},
	subcategory: {}
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
			alt: stream.fields.title,
			title: stream.fields.title,
			inplace: inplace
		});
		var tpl = (ps.editable !== false && editable) ? 'edit' : 'view';
		Q.Template.render(
			'Streams/category/preview/'+tpl,
			fields,
			function (err, html) {
				if (err) return;
				tool.element.innerHTML = html;
				Q.activate(tool, function () {
					// load the icon
					var jq = tool.$('img.Streams_preview_icon');
					tool.preview.icon(jq[0], p.fill('icon'));
					var $pc = tool.$('.Streams_preview_contents');
					$pc.width(0).width($pc[0].remainingWidth());
					Q.onLayout(tool.element).set(function () {
						var $pc = tool.$('.Streams_preview_contents');
						$pc.width($pc[0].remainingWidth());	
					}, tool);
					$(tool.element).on(Q.Pointer.fastclick, tool, function () {
						var parent = tool.parent();
						var relatedState = {};
						if (parent.name === 'streams_related') {
							relatedState = parent.state;
						}
						Q.invoke(Q.extend(state.invoke, {
							title: stream.fields.title,
							content: Q.Tool.setUpElement(
								'div',
								'Streams/category',
								Q.extend(
									{related: relatedState}, 
									state.subcategory, 
									{
										publisherId: stream.fields.publisherId,
										streamName: stream.fields.name
									}
								)
							),
							className: 'Streams_category_invoked'
						}));
					});
					var inplace = tool.child('Streams_inplace');
					if (!inplace) {
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

Q.Template.set('Streams/category/preview/view',
	'<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_icon">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '</div></div>'
);

Q.Template.set('Streams/category/preview/edit',
	'<div class="Streams_preview_container Streams_preview_edit Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_icon">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{& inplace}}</{{titleTag}}>'
	+ '</div></div>'
);

})(Q, Q.$, window);
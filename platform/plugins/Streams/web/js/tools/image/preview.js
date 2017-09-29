(function (Q, $, window, undefined) {

/**
 * @module Streams-tools
 */

/**
 * Renders a preview for a Streams/image stream
 * @class Streams image preview
 * @constructor
 * @param {Object} [options] any options for the tool
 *   @param {Object} [options.inplace] Any options to pass to the Q/inplace tool -- see its options.
 *   @uses Q inplace
 *   @param {Boolean} [options.showTitle=true] Whether to display the title of the image stream
 *   @param {Boolean} [options.updateTitle=false] Whether to update the title to reflect the file name
 *   of an image
 *   @param {Boolean} [options.dontSetSize=false] If true, shows the image in its natural size instead of using preview.state.imagepicker.showSize
 *   @param {Object} [options.templates] Under the keys "views", "edit" and "create" you can override options for Q.Template.render .
 *     @param {Object} [options.templates.view]
 *       @param {String} [options.templates.view.name='Streams/image/preview/view']
 *       @param {Object} [options.templates.view.fields]
 *         @param {String} [options.templates.view.fields.alt]
 *         @param {String} [options.templates.view.fields.showTitle]
 *         @param {String} [options.templates.view.fields.titleClass]
 *         @param {String} [options.templates.view.fields.titleTag]
 *     @param {Object} [options.templates.edit]
 *       @param {String} [options.templates.edit.name='Streams/image/preview/edit']
 *       @param {Object} [options.templates.edit.fields]
 *         @param {String} [options.templates.edit.fields.alt]
 *         @param {String} [options.templates.view.fields.showTitle]
 *         @param {String} [options.templates.edit.fields.titleClass]
 *         @param {String} [options.templates.edit.fields.titleTag]
 *     @param {Object} [options.templates.create]
 *       @param {String} [options.templates.create.name='Streams/image/preview/create']
 *       @param {Object} [options.templates.create.fields]
 *         @param {String} [options.templates.create.fields.alt]
 *         @param {String} [options.templates.create.fields.showTitle]
 *         @param {String} [options.templates.create.fields.titleClass]
 *         @param {String} [options.templates.create.fields.titleTag]
 */
Q.Tool.define("Streams/image/preview", "Streams/preview", function(options, preview) {
	var tool = this;
	var state = tool.state;
	var ps = preview.state;
	tool.preview = preview;
	if (ps.actions) {
		ps.actions.position = 'tr';
	}
	ps.templates.create.name = 'Streams/image/preview/create';
	ps.templates.create.showTitle = (state.showTitle !== false);
	if (ps.creatable) {
		ps.creatable.streamType = ps.creatable.streamType || 'Streams/image';
		ps.creatable.title = ps.creatable.title || 'New Image';
	}
	ps.onRefresh.add(tool.refresh.bind(tool), tool);
	ps.onComposer.add(function () {
		var src = Q.url('{{Q}}/img/actions/add.png');
		this.$('img.Streams_preview_add').attr('src', src);
	}, tool);
},

{
	inplace: {},
	dontSetSize: false,
	showTitle: true,
	updateTitle: false,
	templates: {
		view: {
			name: 'Streams/image/preview/view',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
		},
		edit: {
			name: 'Streams/image/preview/edit',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
		},
		create: {
			name: 'Streams/image/preview/edit',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
		}
	}
},

{
	refresh: function (stream, onLoad) {
		var tool = this;
		var state = tool.state;
		var ps = tool.preview.state;
		var sf = stream.fields;
		var attributes = sf.attributes && JSON.parse(sf.attributes);

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
		var fields = Q.extend({}, state.templates.edit.fields, f, {
			alt: sf.title,
			title: sf.title,
			inplace: inplace,
			showTitle: state.showTitle !== false
		});
		var tpl = (state.editable !== false || stream.testWriteLevel('suggest'))
			? 'edit' 
			: 'view';
		Q.Template.render(
			'Streams/image/preview/'+tpl,
			fields,
			function (err, html) {
				if (err) return;
				tool.element.innerHTML = html;
				Q.activate(tool, function () {
					// load the icon
					Q.extend(ps.imagepicker.onSuccess, {
						"Streams/image/preview": function (data, key, file) {
							if (state.updateTitle && file && file.name) {
								ps.stream.fields.title = file.name;
								ps.stream.save({
									changed: { icon: true }
								});
							}
						}
					});
					var $jq = tool.$('img.Streams_image_preview_icon');
					tool.preview.icon($jq[0], p.fill('icon'));
					var child = tool.child('Streams_inplace');
					if (child) {
						child.state.onLoad.add(p.fill('inplace'));
					}
					var parts = ps.imagepicker.showSize.split('x');
					if (!state.dontSetSize) {
						var $img = tool.$('.Streams_image_preview_icon');
						if (parts[0]) {
							$img.width(parts[0]);
						}
						if (parts[1]) {
							$img.height(parts[1]);
						}
					}
				});
			},
			state.templates[tpl]
		);
	}
}

);

Q.Template.set('Streams/image/preview/view',
	'<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_image_preview_icon">'
	+ '<div class="Streams_image_preview_title {{titleClass}}">'
	+ '{{#if showTitle}}'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '{{/if}}'
	+ '</div></div>'
);

Q.Template.set('Streams/image/preview/edit',
	'<div class="Streams_preview_container Streams_preview_edit Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_image_preview_icon">'
	+ '<div class="Streams_image_preview_title {{titleClass}}">'
	+ '{{#if showTitle}}'
	+ '<{{titleTag}} class="Streams_preview_title">{{& inplace}}</{{titleTag}}>'
	+ '{{/if}}'
	+ '</div></div>'
);

Q.Template.set('Streams/image/preview/create',
	'<div class="Streams_preview_container Streams_preview_create Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_add">'
	+ '<div class="Streams_image_preview_title {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '</div></div>'
);

})(Q, jQuery, window);
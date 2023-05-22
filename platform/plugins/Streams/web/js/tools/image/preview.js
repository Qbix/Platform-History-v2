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
 *   @param {Boolean|String} [options.defineTitle=false] If true, asks user to set the image stream's title. Or set to the default title.
 *   @param {Boolean} [options.updateTitle=false] Whether to update the title to reflect the file name
 *   of an image
 *   @param {Boolean} [options.sendOriginal=false] If true send to server original image source tool.
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
	ps.templates.create.name = 'Streams/image/preview/create';
	ps.templates.create.showTitle = (state.showTitle !== false);
	if (ps.creatable) {
		ps.creatable.streamType = ps.creatable.streamType || 'Streams/image';
		ps.creatable.title = ps.creatable.title || 'New Image';
	}

	Q.Text.get('Streams/content', function (err, text) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			console.warn(msg);
		}

		tool.text = text.image;
		ps.onRefresh.add(tool.refresh.bind(tool), tool);
		ps.onComposer.add(tool.composer.bind(tool), tool);
	});
},

{
	inplace: {},
	dontSetSize: false,
	showTitle: true,
	sendOriginal: false,
	defineTitle: false,
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
				Q.replace(tool.element, html);;
				var $img = tool.$('.Streams_image_preview_icon');
				var src = tool.element.getAttribute('data-icon-src');
				if (src) {
					$img.attr('src', src);
				}
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
	},
	composer: function () {
		var tool = this;
		var state = this.state;
		var ps = tool.preview.state;
		var src = Q.url('{{Q}}/img/actions/add.png');
		this.$('img.Streams_preview_add').attr('src', src);

		// add imagepicker
		var ipo = Q.extend({sendOriginal: state.sendOriginal}, ps.imagepicker, 10, {
			preprocess: function (callback) {
				if (ps.creatable && ps.creatable.preprocess) {
					Q.handle(ps.creatable.preprocess, this, [_proceed, tool]);
				} else if (typeof state.defineTitle === 'string') {
					_proceed({
						title: state.defineTitle
					});
				} else if (state.defineTitle) {
					Q.Dialogs.push({
						className: 'Q_dialog_stream_title',
						title: tool.text.imageTitle,
						content: "<input name='title' value='" + tool.text.uploadedImage + "'>",
						destroyOnClose: true,
						apply: true,
						onActivate : {

						},
						beforeClose: function(dialog) {
							_proceed({
								title: $("input[name=title]", dialog).val()
							});
						}
					});
				} else {
					_proceed();
				}

				Q.Streams.retainWith(tool);

				function _proceed(overrides, weight) {
					if (overrides != undefined && !Q.isPlainObject(overrides)) {
						return;
					}
					var fields = Q.extend({
						publisherId: ps.publisherId,
						type: (ps.creatable && ps.creatable.streamType) || "Streams/image"
					}, 10, overrides);
					Q.Streams.create(fields, function (err, stream, extra) {
						var path, subpath;
						if (err) {
							ps.onError.handle.call(tool, err);
							Q.handle(callback, tool, [{cancel: true}]);
							return err;
						}
						var iconUrl = this.iconUrl(40);
						var p = 'Q/plugins/';
						var i = this.iconUrl(40).indexOf('Q/plugins/');
						if (iconUrl.substr(i+p.length).startsWith('Users/')) {
							// uploading a user icon
							path = 'Q/uploads/Users';
							subpath = ps.publisherId.splitId() + '/icon';
						} else { // uploading a regular stream icon
							path = 'Q/uploads/Streams';
							subpath = ps.publisherId.splitId() + '/'
								+ stream.fields.name + '/icon';
						}
						subpath += '/'+Math.floor(Date.now()/1000);
						callback({ path: path, subpath: subpath });
						tool.element.removeClass('Streams_preview_composer');
						tool.element.addClass('Streams_preview_stream');
						setTimeout(function () {
							tool.preview.loading();
						}, 0);
						ps.streamName = stream.fields.name;
					}, null, ps.creatable && ps.creatable.options);
				}
			},
			onFinish: {'Streams/image/preview': function (data, key, file) {
				if (Q.getObject("related.publisherId", ps) && Q.getObject("related.streamName", ps)) {
					Q.Streams.relate(
						ps.related.publisherId,
						ps.related.streamName,
						ps.related.type,
						ps.publisherId,
						ps.streamName
					);
				}

				Q.Streams.Stream.refresh(ps.publisherId, ps.streamName, null, {
					messages: true,
					changed: {icon: true},
					evenIfNotRetained: true
				});
				ps.onCreate.handle.call(tool, this);
				tool.element.removeClass('Streams_preview_composer');
				tool.element.addClass('Streams_preview_stream');
				tool.preview.preview();
				return false;
			}}
		});
		var p = Q.pipe(['imagepicker', 'load'], function () {
			Q.handle(onLoad, tool, [element]);
		});
		var $element = this.$('.Streams_preview_create')
		.plugin('Q/imagepicker', ipo, p.fill('imagepicker'));
		$element.off('load.Streams-preview')
		.on('load.Streams-preview', p.fill('load'));
		var container = this.$('.Streams_preview_container');
		// override the fastclick handler that the Streams/preview tool set
		container.off([Q.Pointer.fastclick, '.Streams_preview']);	
		container.on([Q.Pointer.fastclick, '.Streams_image_preview'], function () {
			return;
			tool.create.bind(tool);
		});	
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
	+ '<{{titleTag}} class="Streams_preview_title">{{{inplace}}}</{{titleTag}}>'
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

})(Q, Q.$, window);
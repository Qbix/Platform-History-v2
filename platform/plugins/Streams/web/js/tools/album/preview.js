(function (Q, $, window, undefined) {

	var Dialogs = Q.Dialogs;
	var Users = Q.Users;
	var selector_tool = null;
	var toolText = null;

	/**
	 * @module Streams-tools
	 */

	/**
	 * Renders a preview for a Streams/album stream
	 * @class Streams album preview
	 * @constructor
	 * @param {Object} [options] any options for the tool
	 *   @param {Object} [options.inplace] Any options to pass to the Q/inplace tool -- see its options.
	 *   @uses Q inplace
	 *   @param {Boolean} [options.showTitle=true] Whether to display the title of the album stream
	 *   @param {Boolean} [options.updateTitle=false] Whether to update the title to reflect the file name
	 *   of an album
	 *   @param {Boolean} [options.dontSetSize=false] If true, shows the album in its natural size instead of using preview.state.imagepicker.showSize
	 *   @param {Object} [options.templates] Under the keys "views", "edit" and "create" you can override options for Q.Template.render .
	 *     @param {Object} [options.templates.view]
	 *       @param {String} [options.templates.view.name='Streams/album/preview/view']
	 *       @param {Object} [options.templates.view.fields]
	 *         @param {String} [options.templates.view.fields.alt]
	 *         @param {String} [options.templates.view.fields.showTitle]
	 *         @param {String} [options.templates.view.fields.titleClass]
	 *         @param {String} [options.templates.view.fields.titleTag]
	 *     @param {Object} [options.templates.edit]
	 *       @param {String} [options.templates.edit.name='Streams/album/preview/edit']
	 *       @param {Object} [options.templates.edit.fields]
	 *         @param {String} [options.templates.edit.fields.alt]
	 *         @param {String} [options.templates.view.fields.showTitle]
	 *         @param {String} [options.templates.edit.fields.titleClass]
	 *         @param {String} [options.templates.edit.fields.titleTag]
	 *     @param {Object} [options.templates.create]
	 *       @param {String} [options.templates.create.name='Streams/album/preview/create']
	 *       @param {Object} [options.templates.create.fields]
	 *         @param {String} [options.templates.create.fields.alt]
	 *         @param {String} [options.templates.create.fields.showTitle]
	 *         @param {String} [options.templates.create.fields.titleClass]
	 *         @param {String} [options.templates.create.fields.titleTag]
	 */
	Q.Tool.define("Streams/album/preview", "Streams/preview", function (options, preview) {
		var tool = this;
		var state = tool.state;
		var ps = preview.state;
		tool.preview = preview;
		previewTool = preview;
		if (ps.actions) {
			ps.actions.position = 'tr';
		}

		Q.Text.get('Streams/content', function (err, text) {
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				console.warn(msg);
			}

			toolText = text.preview;

		});

		ps.templates.create.name = 'Streams/album/preview/create';
		ps.templates.create.showTitle = (state.showTitle !== false);
		if (ps.creatable) {
			ps.creatable.streamType = ps.creatable.streamType || 'Streams/album';
			ps.creatable.title = ps.creatable.title || 'New Image';

			// rewrite Streams/preview composer
			ps.creatable.preprocess = function (_proceed) {
				Dialogs.push({
					title: toolText.DialogTitle,
					template: {
						name: "Streams/album/preview/select",
						fields: {
							dialogtext: toolText.DialogText
						}
					},
					removeOnClose: true,
					onActivate: function (dialog) {
						// Jquery for Local button on click event
						tool.fileSystemButton = $("<input type='button'/>")
							.val(toolText.FileSystemButtonTitle)
							.addClass("Q_button_local fb_selector-btn")
							.appendTo("div.Q_buttons");

						tool.fileSystemButton.on(Q.Pointer.click, function () {
							Dialogs.pop();
							_create_Stream();
						});

						tool.facebookButton = $("<input type='button'/>")
							.val(toolText.FacebookButtonTitle)
							.addClass("Q_button_fb fb_selector-btn")
							.appendTo("div.Q_buttons");

						// Jquery for Facebook button on click event
						tool.facebookButton.on(Q.Pointer.click, function () {
							// Photoselector tool init
							selector_tool = $("<div>").tool("Streams/photoSelector", {
								'oneLine': true,
								'onSelect': function (tool, photo, images) {
									var src = images[0].source;
									toDataUrl(src, function (myBase64) {
										var fields = {
											"title": toolText.FacebookImage
										};
										fields["icon"] = {
											data: myBase64, //  Base64 encode of selected photo from facebook albums
											save: ps.imagepicker.saveSizeName  //  fetch the different sizes from default preview.js file
										};
										// Q.handle(callback, tool, [args]);
										Q.handle(_proceed, preview, [fields]);
										Dialogs.pop(); // close the Dialog
									});
									// custom function to convert photo into base64 format
									function toDataUrl(url, callback) {
										var xhr = new XMLHttpRequest();
										xhr.onload = function () {
											var reader = new FileReader();
											reader.onloadend = function () {
												callback(reader.result);
											}
											reader.readAsDataURL(xhr.response);
										};
										xhr.open('GET', url);
										xhr.responseType = 'blob';
										xhr.send();
									}
								}
							});
							selector_tool.insertAfter(this);
							selector_tool.activate(); // Photoselector tool Active
						});

						Users.login.options = Q.extend(Q.Users.login.options, {
							using: ['native', 'facebook'],
							scope: ['email', 'public_profile', 'publish_actions', 'user_photos'],
							onSuccess: new Q.Event(function Users_login_onSuccess(user, options) {

							}, 'Users')
						});
					}
				});
			};
			// close of preprocess
			function _create_Stream() {
				ps.creatable.preprocess = undefined;
				Q.handle(preview.create, preview, [event]);
			}
		}
		ps.onRefresh.add(tool.refresh.bind(tool), tool);
		ps.onComposer.add(function () {
			var src = Q.url('{{Q}}/img/actions/add.png');
			this.$('img.Streams_preview_add').attr('src', src);
		}, tool);
	},

		{
			inplace: {},
			beforeClose: null,
			beforeCreate: new Q.Event(),
			onCreate: new Q.Event(),
			onRefresh: new Q.Event(),
			onLoad: new Q.Event(),
			dontSetSize: false,
			showTitle: true,
			updateTitle: false,
			templates: {
				view: {
					name: 'Streams/album/preview/view',
					fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
				},
				edit: {
					name: 'Streams/album/preview/edit',
					fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
				},
				create: {
					name: 'Streams/album/preview/edit',
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
					'Streams/album/preview/' + tpl,
					fields,
					function (err, html) {
						if (err) return;
						Q.replace(tool.element, html);;
						Q.activate(tool, function () {
							// load the icon
							Q.extend(ps.imagepicker.onSuccess, {
								"Streams/album/preview": function (data, key, file) {
									if (state.updateTitle && file && file.name) {
										ps.stream.fields.title = file.name;
										ps.stream.save({
											changed: { icon: true }
										});
									}
								}
							});
							var $jq = tool.$('img.Streams_album_preview_icon');
							tool.preview.icon($jq[0], p.fill('icon'));
							var child = tool.child('Streams_inplace');
							if (child) {
								child.state.onLoad.add(p.fill('inplace'));
							}
							var parts = ps.imagepicker.showSize.split('x');
							if (!state.dontSetSize) {
								var $img = tool.$('.Streams_album_preview_icon');
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

	Q.Template.set('Streams/album/preview/view',
		'<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
		+ '<img alt="{{alt}}" class="Streams_album_preview_icon">'
		+ '<div class="Streams_album_preview_title {{titleClass}}">'
		+ '{{#if showTitle}}'
		+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
		+ '{{/if}}'
		+ '</div></div>'
	);

	Q.Template.set('Streams/album/preview/edit',
		'<div class="Streams_preview_container Streams_preview_edit Q_clearfix">'
		+ '<img alt="{{alt}}" class="Streams_album_preview_icon">'
		+ '<div class="Streams_album_preview_title {{titleClass}}">'
		+ '{{#if showTitle}}'
		+ '<{{titleTag}} class="Streams_preview_title">{{{inplace}}}</{{titleTag}}>'
		+ '{{/if}}'
		+ '</div></div>'
	);

	Q.Template.set('Streams/album/preview/create',
		'<div class="Streams_preview_container Streams_preview_create Q_clearfix">'
		+ '<img alt="{{alt}}" class="Streams_preview_add">'
		+ '<div class="Streams_album_preview_title {{titleClass}}">'
		+ '<{{titleTag}} class="Streams_preview_title">Add Image</{{titleTag}}>'
		+ '</div></div>'
	);

	Q.Template.set('Streams/album/preview/select',
		'<div class="Q_messagebox Q_big_prompt">' +
		'<p>{{dialogtext}}</p>' +
		'<div class="Q_buttons">' +
		'</div>' +
		'</div>'
	);

})(Q, Q.$, window);
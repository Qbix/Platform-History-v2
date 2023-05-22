(function (Q, $, window, undefined) {

/**
 * @module Streams-tools
 */

/**
 * Renders a preview for a Streams/file stream
 * @class Streams file preview
 * @constructor
 * @param {Object} [options] options to pass to this tool, besides the ones passed to preview
 *   @param {String} [options.windowName='file'] the name of the window in which to open files. Set it to blank to open in the current window.
 *   @param {Object} [options.inplace] Any options to pass to the Q/inplace tool -- see its options.
 *   @param {Boolean} [options.skipImagePicker=false] If true skip apply Q/imagepicker plugin on icon
 *   @uses Q inplace
 *   @param {Object} [options.templates] Under the keys "views", "edit" and "create" you can override options for Q.Template.render .
 *     @param {Object} [options.templates.view]
 *       @param {String} [options.templates.view.name='Streams/file/preview/view']
 *       @param {Object} [options.templates.view.fields]
 *         @param {String} [options.templates.view.fields.alt]
 *         @param {String} [options.templates.view.fields.titleClass]
 *         @param {String} [options.templates.view.fields.titleTag]
 *     @param {Object} [options.templates.edit]
 *       @param {String} [options.templates.edit.name='Streams/file/preview/edit']
 *       @param {Object} [options.templates.edit.fields]
 *         @param {String} [options.templates.edit.fields.alt]
 *         @param {String} [options.templates.edit.fields.titleClass]
 *         @param {String} [options.templates.edit.fields.titleTag]
 * @param {Object} [preview] this is the preview tool that's been instantiated
 */
Q.Tool.define("Streams/file/preview", "Streams/preview",
function _Streams_file_preview(options, preview) {
	var tool = this;
	tool.preview = preview;
	var $te = $(tool.element);
	var state = this.state;
	var ps = preview.state;
	var src = Q.getObject('templates.create.fields.src', state);
	if (src) {
		state.templates.create.fields.src = Q.url(src);
	}
	ps.templates.create = Q.extend(
		ps.templates.create, 
		10,
		state.templates.create
	);
	if (ps.creatable) {
		ps.creatable.streamType = ps.creatable.streamType || 'Streams/file';
		ps.creatable.title = ps.creatable.title || 'Upload File';
		if (ps.creatable.clickable) {
			ps.creatable.clickable.preventDefault = false;
		}
	}
	ps.onRefresh.add(tool.refresh.bind(tool), tool);
	ps.onComposer.add(tool.composer.bind(tool), tool);
	preview.loading = function () {
		var $form = $te.find('form').detach();
		var $img = $te.find('img.Streams_preview_add').detach();
		$te.empty().append($img, $form).addClass('Q_uploading');
	};

	// edit action
	if (ps.editable) {
		Q.setObject(["actions", "actions", "edit"], true, ps);
	}
},

{
	skipImagePicker: false,
	inplace: {},
	windowName: 'file',
	templates: {
		view: {
			name: 'Streams/file/preview/view',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
		},
		edit: {
			name: 'Streams/file/preview/edit',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h3' }
		},
		create: {
			name: 'Streams/file/preview/create',
			fields: {
				src: '{{Q}}/img/actions/upload.png'
			}
		}
	}
},

{
	refresh: function (stream, callback) {
		var tool = this;
		var state = tool.state;
		var ps = tool.preview.state;
		var $te = $(tool.element);
		// set up a pipe to know when the icon has loaded
		var p = Q.pipe(['inplace', 'icon'], function () {
			Q.handle(callback, tool);
		});
		$te.removeClass('Q_uploading');
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
			} else {
				$te.addClass('Streams_editable_title');
			}
			inplace = tool.setUpElementHTML('div', 'Streams/inplace', inplaceOptions);
		}
		// render a template
		var f = state.template && state.template.fields;
		var size = stream.getAttribute('Q.file.size') || stream.getAttribute('file.size');
		var fields = Q.extend({}, state.templates.edit.fields, f, {
			alt: stream.fields.title,
			title: stream.fields.title,
			inplace: inplace,
			size: _formatSize(size),
			streamName: ps.streamName,
			streamType: stream.fields.type
		});
		var tpl = (ps.editable !== false && stream.testWriteLevel('suggest'))
			? 'edit' 
			: 'view';
		Q.Template.render(
			'Streams/file/preview/'+tpl,
			fields,
			function (err, html) {
				if (err) return;
				Q.replace(tool.element, html);;
				Q.activate(tool, function () {
					// load the icon
					var jq = tool.$('img.Streams_preview_icon');
					if (state.skipImagePicker) {
						p.fill('icon')();
					} else {
						tool.preview.icon(jq[0], p.fill('icon'));
					}

					var $pc = tool.$('.Streams_preview_contents');
					$pc.width(0).width($pc[0].remainingWidth());
					Q.onLayout(tool.element).set(function () {
						var $pc = tool.$('.Streams_preview_contents');
						$pc.width($pc[0].remainingWidth());	
					}, tool);
					var inplace = tool.child('Streams_inplace');
					if (!inplace) {
						return p.fill('inplace').apply(this, arguments);
					}
					inplace.state.onLoad.add(function () {
						p.fill('inplace').apply(this, arguments);
					});
				});
				$(tool.element).on(Q.Pointer.fastclick, function () {
					var url = stream.fileUrl();
					if (!url) {
						return tool.selectAndUploadFile();
					}
					if (state.windowName) {
						window.open(url, state.windowName);
					} else {
						window.location = url;
					}
				});

				// apply edit action
				if (Q.getObject(["actions", "actions", "edit"], ps)) {
					ps.actions.actions.edit = tool.selectAndUploadFile.bind(tool);
					tool.preview.actions();
				}
			},
			state.templates[tpl]
		);
	},
	composer: function () {
		var tool = this;
		var $file = tool.$('.Streams_file_input');

		var $container = this.$('.Streams_preview_container');

		// remove default click handler
		$container.off([Q.Pointer.fastclick, ".Streams_preview"]);

		// attach custom handler
		// As we styled file input to fill whole tool element no need to trigger click, because click happens naturally
		// on file element and hence on desktop and android click happens twice, but on ios it happens once.
		/*$container.on([Q.Pointer.fastclick, ".Streams_file_preview"], function () {
			$file.trigger("click");
		});*/

		var $icon = tool.$("img.Q_imagepicker");
		if ($icon.length) {
			$icon.plugin('Q/imagepicker', 'remove');
		}

		$file.on("click", function (event) {
			event.stopPropagation();
		}).change(function (event) {
			if (!this.value) {
				return; // it was canceled
			}
			var $this = $(this);
			var form = $this.closest('form').get(0);
			tool.preview.state.creatable.options.form = form;
			tool.preview.state.creatable.options.resultFunction = 'result';
			tool.preview.create(event, function (data) {
				var fem = Q.firstErrorMessage(data && data.error);
				if (fem) {
					Q.alert(fem);
				}

				// after file uploaded, Q/actions plugin must do this
				$container.off([Q.Pointer.fastclick, ".Streams_file_preview"]);
			});
			form.reset();
		});
	},
	selectAndUploadFile: function () {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		tool.$('.Streams_file_input')
		.off('click')
		.on("click", function (event) {
			event.stopPropagation();
		}).off('change')
		.on("change", function (event) {
			if (!this.value) {
				return; // it was canceled
			}

			$te.addClass("Q_working");

			var form = $(this).closest('form')[0];

			// send request to replace file
			Q.req("Streams/file", function(err, response){
				$te.removeClass("Q_working");
				var msg = Q.firstErrorMessage(err, response && response.errors);
				if (msg) {
					return Q.alert(msg);
				}

				// refresh tool
				var ps = tool.preview.state;
				Q.Streams.Stream.refresh(
					ps.publisherId, ps.streamName, function () {
						tool.preview.preview();	
					}
				);
						
			}, {
				method: 'POST',
				form: form
			});
		}).trigger("click");

		return false;
	}
}

);

function _formatSize(bytes)
{
	if (isNaN(bytes)) return '';
	if (bytes >= Math.pow(2, 30)) {
		return Math.ceil(bytes / Math.pow(2, 30)) + ' GB';
	} else if (bytes >= Math.pow(2, 20)) {
		return Math.ceil(bytes / Math.pow(2, 20)) + ' MB';
	} else if (bytes >= Math.pow(2, 10)) {
		return Math.ceil(bytes / Math.pow(2, 10)) + ' KB';
	} else {
		return bytes + ' bytes';
	}
}

Q.Template.set('Streams/file/preview/view',
	'<div class="Streams_preview_container Streams_preview_view Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_icon">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '<div class="Streams_preview_file_size">{{size}}</div>'
	+ '</div></div>'
);

Q.Template.set('Streams/file/preview/edit',
	'<div class="Streams_preview_container Streams_preview_edit Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_icon">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{{inplace}}}</{{titleTag}}>'
	+ '<div class="Streams_preview_file_size">{{size}}</div>'
	+ '<form enctype="multipart/form-data" class="Streams_file_form">'
	+ '	<input name="file" type="file" class="Streams_file_input">'
	+ ' <input name="streamName" type="hidden" value="{{streamName}}">'
	+ ' <input name="streamType" type="hidden" value="{{streamType}}">'
	+ '</form>'
	+ '</div></div>'
);

Q.Template.set('Streams/file/preview/create',
	'<div class="Streams_preview_container Streams_preview_create Q_clearfix">'
	+ '<img src="{{{src}}}" alt="{{alt}}" class="Streams_preview_add">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '</div>'
	+ '<form enctype="multipart/form-data" class="Streams_file_form"><input name="file" type="file" class="Streams_file_input"></form>'
	+ '</div>'
);

})(Q, Q.$, window);
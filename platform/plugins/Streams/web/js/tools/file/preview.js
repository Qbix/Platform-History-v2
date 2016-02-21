(function (Q, $, window, undefined) {

/**
 * @module Streams-tools
 */

/**
 * Renders a preview for a Streams/file stream
 * @class Streams file preview
 * @constructor
 * @param {Object} [options] options to pass to this tool, besides the ones passed to preview
 *   @param {String} [options.windowName='file'] the name of the window in which to open files. Leave it blank to open in the current window.
 *   @param {Object} [options.inplace] Any options to pass to the Q/inplace tool -- see its options.
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
	this.preview = preview;
	var state = this.state;
	var ps = preview.state;
	ps.templates.create.fields.src = Q.url('plugins/Streams/img/actions/upload.png');
	ps.templates.create.name = 'Streams/file/preview/create';
	ps.templates.create.showTitle = (state.showTitle !== false);
	if (ps.creatable) {
		ps.creatable.streamType = ps.creatable.streamType || 'Streams/file';
		ps.creatable.title = ps.creatable.title || 'Upload File';
		if (ps.creatable.clickable) {
			ps.creatable.clickable.preventDefault = false;
		}
	}
	ps.onRefresh.add(this.refresh.bind(this), this);
	ps.onComposer.add(this.composer.bind(this), this);
	preview.loading = function () {
		var $te = $(this.element);
		var $form = $te.find('form').detach();
		var $img = $te.find('img.Streams_preview_add').detach();
		$te.empty().append($img, $form).addClass('Q_uploading');
	};
},

{
	inplace: {},
	windowName: 'file',
	templates: {
		view: {
			name: 'Streams/file/preview/view',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h2' }
		},
		edit: {
			name: 'Streams/file/preview/edit',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h2' }
		}
	}
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
		$(tool.element).removeClass('Q_uploading');
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
			alt: stream.fields.title,
			title: stream.fields.title,
			inplace: inplace,
			size: _formatSize(stream.get('file.size'))
		});
		var tpl = (ps.editable !== false && stream.testWriteLevel('suggest'))
			? 'edit' 
			: 'view';
		Q.Template.render(
			'Streams/file/preview/'+tpl,
			fields,
			function (err, html) {
				if (err) return;
				tool.element.innerHTML = html;
				Q.activate(tool, function () {
					// load the icon
					var jq = tool.$('img.Streams_preview_icon');
					tool.preview.icon(jq[0], p.fill('icon'));
					var inplace = tool.child('Streams_inplace');
					if (!inplace) {
						return p.fill('inplace').apply(this, arguments);
					}
					inplace.state.onLoad.add(function () {
						p.fill('inplace').apply(this, arguments);
					});
					var $pc = tool.$('.Streams_preview_contents');
					$pc.width(0).width($pc[0].remainingWidth());
					Q.onLayout(tool.element).set(function () {
						var $pc = tool.$('.Streams_preview_contents');
						$pc.width($pc[0].remainingWidth());	
					}, tool);
				});
				$(tool.element).on(Q.Pointer.click, function () {
					var url = stream.get('file.url');
					if (!url) return;
					if (state.windowName) {
						window.open(url, state.windowName);
					} else {
						window.location = url;
					}
				});
			},
			state.templates[tpl]
		);
	},
	composer: function () {
		var tool = this;
		var state = tool.state;
		tool.$('.Streams_file_input')
		.click(function (event) {
			event.stopPropagation();
		}).change(function (event) {
			if (!this.value) {
				return; // it was canceled
			}
			var $this = $(this);
			var form = $this.closest('form').get(0);
			tool.preview.state.creatable.options.form = form;
			tool.preview.state.creatable.options.resultFunction = 'result';
			tool.preview.create(event);
			form.reset();
		});
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
	'<div class="Streams_preview_container Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_icon">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '<div class="Streams_preview_file_size">{{size}}</div>'
	+ '</div></div>'
);

Q.Template.set('Streams/file/preview/edit',
	'<div class="Streams_preview_container Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_icon">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{& inplace}}</{{titleTag}}>'
	+ '<div class="Streams_preview_file_size">{{size}}</div>'
	+ '</div></div>'
);

Q.Template.set('Streams/file/preview/create',
	'<div class="Streams_preview_container Q_clearfix">'
	+ '<img src="{{& src}}" alt="{{alt}}" class="Streams_preview_add">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '</div>'
	+ '<form enctype="multipart/form-data" class="Streams_file_form"><input name="file" type="file" id="{{prefix}}file" class="Streams_file_input"></form>'
	+ '</div>'
);

})(Q, jQuery, window);
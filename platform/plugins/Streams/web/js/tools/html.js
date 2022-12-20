(function (Q, $, window, document, undefined) {

/**
 * @module Streams-tools
 */
	
/**
 * Inline editor for HTML content
 * @class Streams html
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} options.publisherId  The publisher's user id.
 *   @param {String} options.field The name of the stream field used to save the html.
 *   @param {String} [options.streamName] If empty, and "creatable" is true, then this can be used to add new related streams.
 *   @param {String} [options.placeholder] The placeholder HTML
 *   @param {String} [options.editor="auto"]  Can be "ckeditor", "froala", "basic" or "auto".
 *   @param {Boolean} [options.editable] Set to false to avoid showing even authorized users an interface to replace the contents
 *   @param {Object} [options.ckeditor]  The config, if any, to pass to ckeditor
 *   @param {Object} [options.froala]  The config, if any, to pass to froala
 *   @param {Function} [options.preprocess]  Optional function which takes [callback, tool] and calls callback(objectToExtendAnyStreamFields)
 *  @param {Q.Event} [options.beforeSave] This event triggers before save
 *  @param {Q.Event} [options.onFroalaEditor] This event triggers when the froala editor is loaded
 */
Q.Tool.define("Streams/html", function (options) {
	var tool = this;
	var state = tool.state;
	var $toolElement = $(this.element);

	if (!state.publisherId) {
		throw new Q.Error("Streams/html tool: missing options.publisherId");
	}
	if (!('streamName' in state)) {
		throw new Q.Error("Streams/html tool: missing options.streamName");
	}
	if (!state.field) {
		throw new Q.Error("Streams/html tool: missing options.field");
	}
	
	var f = state.froala;
	f.toolbarButtonsXS = f.toolbarButtonsXS || f.toolbarButtons;
	f.toolbarButtonsSM = f.toolbarButtonsSM || f.toolbarButtons;
	f.toolbarButtonsMD = f.toolbarButtonsMD || f.toolbarButtons;

	if (state.streamName) {
		Q.Streams.retainWith(tool)
		.get(state.publisherId, state.streamName, function (err) {
			if (Q.firstErrorMessage(err)) return false;
			tool.element.innerHTML = this.fields[state.field] || state.placeholder;
			Q.fixScrollingParent(tool.element);
			_editor(this);
			Q.loadNonce(_editor);
		}, {fields: [state.field]});
	} else if (state.placeholder) {
		tool.element.innerHTML = state.placeholder;
		Q.fixScrollingParent(tool.element);
		Q.loadNonce(_editor);
	}

	function _editor(stream) {
		if (state.editable === false
		|| !stream || !stream.testWriteLevel('suggest')) {
			return;
		}
		if (state.editor === 'auto') {
			state.editor = 'froala';
			state.froala = state.froala || {};
			if (Q.info.isTouchscreen) {
				state.froala.toolbarInline = false;
				state.froala.toolbarSticky = true;
			}
		}
		if (state.editor === 'froala') {
			Q.extend(state.froala.imageUploadParams, {
				'publisherId': state.publisherId,
				'Q.Streams.related.publisherId': state.publisherId,
				'Q.Streams.related.streamName': state.streamName,
				'Q.Streams.related.type': 'images',
				'Q.nonce': Q.nonce
			});
			state.froala.key = state.froala.key || Q.Streams.froala.key;
			state.froala.toolbarStickyOffset = _getTopOffset();
			state.froala.placeholderText = (state.froala.placeholderText || state.placeholder).replace(/(<br>)/g, "\n");
		}
		switch (state.editor && state.editor.toLowerCase()) {
		case 'basic':
			tool.element.setAttribute('contenteditable', true);
			break;
		case 'ckeditor':
			tool.element.setAttribute('contenteditable', true);
			Q.addScript("{{Q}}/js/ckeditor/ckeditor.js", function () {
				CKEDITOR.disableAutoInline = true;
				state.editorObject = CKEDITOR.inline(tool.element, state.ckeditor || undefined);
			});
			break;
		case 'froala':
		default:
			Q.addStylesheet([
				"{{Q}}/font-awesome/css/font-awesome.min.css",
				"{{Q}}/js/froala/css/froala_editor.min.css",
				"{{Q}}/js/froala/css/froala_style.min.css",
				"{{Q}}/js/froala/css/plugins/fullscreen.min.css",
				"{{Q}}/js/froala/css/plugins/colors.min.css",
				"{{Q}}/js/froala/css/plugins/image.min.css",
				"{{Q}}/js/froala/css/plugins/table.min.css",
				"{{Q}}/js/froala/css/plugins/code_view.min.css"
			], { slotName: 'Q' });
			var scripts = [
				"{{Q}}/js/froala/js/froala_editor.min.js",
				"{{Q}}/js/froala/js/plugins/fullscreen.min.js",
				"{{Q}}/js/froala/js/plugins/code_view.min.js",
				"{{Q}}/js/froala/js/plugins/align.min.js",
				"{{Q}}/js/froala/js/plugins/table.min.js",
				"{{Q}}/js/froala/js/plugins/lists.min.js",
				"{{Q}}/js/froala/js/plugins/colors.min.js",
				"{{Q}}/js/froala/js/plugins/font_family.min.js",
				"{{Q}}/js/froala/js/plugins/font_size.min.js",
				"{{Q}}/js/froala/js/plugins/paragraph_style.min.js",
				"{{Q}}/js/froala/js/plugins/paragraph_format.min.js",
				"{{Q}}/js/froala/js/plugins/quote.min.js",
				"{{Q}}/js/froala/js/plugins/link.min.js",
				"{{Q}}/js/froala/js/plugins/image.min.js",
				"{{Q}}/js/froala/js/plugins/image_manager.min.js",
				"{{Q}}/js/froala/js/plugins/video.min.js"
			];
			if (Q.info.isIE(0, 8)) {
				scripts.push("{{Q}}/js/froala/froala_editor_ie8.min.js");
			}
			Q.addScript(scripts, function() {
				$toolElement.froalaEditor(state.froala)
				.on('froalaEditor.image.removed', function (e, editor, $img) {
					var src = $img.attr('src');
					if (src.substr(0, 5) === 'data:'
					|| src.substr(0, 5) === 'blob:') {
						return;
					}
					var parts = src.split('/');
					var publisherId = parts.slice(-7, -6).join('/');
					var streamName = parts.slice(-6, -3).join('/');
					Q.Streams.Stream.close(publisherId, streamName);
				});
				state.froalaEditor = $toolElement.data('froala.editor');
				Q.handle(state.onFroalaEditor, tool, state.froalaEditor);
			});
		}
		function _blur() {
			var content = state.editorObject
				? state.editorObject.getData()
				: $toolElement.froalaEditor('html.get');
			if (state.editorObject) {
				state.editorObject.focusManager.blur();
			} else {
				$('.froala-editor.f-inline', tool.element).hide();
			}
			_blurred = true;
			state.editing = false;
			if (state.startingContent === content) return;
			state.startingContent = null;
			if (!stream) return;
			if (state && state.beforeSave) {
				if (false === Q.handle(state.beforeSave, tool, [state.froalaEditor])) {
					return;
				}
			}
			Q.Streams.retainWith(tool)
			.get(state.publisherId, state.streamName, function (err) {
				var stream = this;
				stream.pendingFields[state.field] = content;
				stream.save();
			}, {fields: [state.field]});
		}
		function _focus() {
			if (!_blurred) return;
			_blurred = false;
			var content = state.editorObject
				? state.editorObject.getData()
				: $toolElement.froalaEditor('html.get');
			state.editing = true;
			state.startingContent = content;
		}
		var _blurred = true;
		$toolElement
			.off(Q.Pointer.focusin)
			.on(Q.Pointer.focusin, _focus)
			.off(Q.Pointer.focusout)
			.on(Q.Pointer.focusout, _blur)
			.off('keydown')
			.on('keydown', function(e){
				if (e.originalEvent.keyCode != 27) return;
				e.target.blur();
				document.body.focus();
			});
		Q.Streams.retainWith(tool)
		.get(state.publisherId, state.streamName, function (err) {
			var stream = this;
			var content = stream.fields[state.field];

			// if content empty, skip update, placeholder will be display
			if (content) {
				_updateHTML(content);
			}

			stream.onFieldChanged(state.field).set(function (fields, field) {
				if (fields[field] !== null) {
					_updateHTML(fields[field]);
				} else {
					stream.refresh(function () {
						_updateHTML(this.fields[field]);
					});
				}
			}, tool);
		}, {fields: [state.field]});
		function _updateHTML(html) {
			switch (state.editor && state.editor.toLowerCase()) {
			case 'ckeditor':
				if (tool.element.innerHTML !== html) {
					tool.element.innerHTML = html;
				}
				break;
			case 'froala':
			default:
				state.onFroalaEditor.add(function () {
					if (html != undefined) {
						$toolElement.froalaEditor('html.set', html);
					}
				});
				break;
			}
			Q.fixScrollingParent(tool.element);
		}
	}
	
	function _create(overrides) {

		var fields = Q.extend({
			publisherId: state.publisherId,
			type: state.creatable.streamType
		}, overrides);
		Q.Streams.retainWith(tool).create(fields, function (err, stream, icon) {
			if (err) {
				return err;
			}
			state.publisherId = this.fields.publisherId;
			state.streamName = this.fields.name;
			tool.stream = this;
			state.onCreate.handle.call(tool);
			tool.stream.refresh(function () {
				state.onUpdate.handle.call(tool);
			}, {messages: true});
		}, state.related);
	}

	function _getTopOffset() {
		var $children = $('body').children(':visible');
		var top = 0;
		$children.each(function () {
			var $this = $(this);
			var position = $this.css('position');
			if (position === 'fixed' || position === 'absolute' && parseInt($this.css('top')) === 0) {
				top += $this.outerHeight() + parseInt($this.css('margin-bottom'));
			}
		});
		return top;
	}
},

{
	editor: 'auto',
	editable: true,
	ckeditor: {},
	froala: {
		toolbarVisibleWithoutSelection: false,
		toolbarInline: true,
		imagePaste: true,
		toolbarButtons: [
			"bold", "italic", "underline", "strikeThrough", "subscript", "superscript", "|",
			"fontFamily", "fontSize", "color", "-",
			"inlineStyle", "paragraphStyle", "paragraphFormat", "|",
			"align", "formatOL", "formatUL", "|",
			"outdent", "indent", "quote", "-",
			"insertHR", "insertLink", "|",
			"insertImage", "insertTable", "|", "html"
		],
		fontFamily: {
			"Arial,Helvetica": "Arial",
			"Georgia,seif": "Georgia",
			"Impact,Charcoal,'HelveticaNeue-CondensedBlack'": "Impact",
			"Tahoma,Geneva,Verdana,sans-serif": "Tahoma",
			"'Times New Roman','Times',serif": "Times",
			"Courier,Courier New": "Courier",
			"'MarkerFelt-Thin','Comic Sans MS','Comic Sans'": "Playful",
			"Zapfino,": "Zapfino"
		},
		imageUploadMethod: 'POST',
		imageUploadURL: Q.action('Streams/froala'),
		imageUploadParam: 'image',
		imageUploadParams: {
			'type': 'Streams/image',
			'Q.ajax': 'json'
		},
		imageEditButtons: [
			"floatImageLeft","floatImageNone","floatImageRight",
			"linkImage","replaceImage","removeImage"
		]
	},
	streamName: "",
	placeholder: "Enter content here",
	preprocess: null,
	beforeSave: new Q.Event(),
	onSave: new Q.Event(),
	onCancel: new Q.Event(),
	onFroalaEditor: new Q.Event()
},

{
	Q: {
		beforeRemove: function () {
			if (this.state.froalaEditor) {
				try {
					$(this.element).froalaEditor('destroy');
				} catch (e) {
					console.warn(e);
				}
			}
		}
	},
	focus: function () {
		$(this.element).data('froala.editor').$el.plugin('Q/clickfocus');
	}
}

);

})(Q, Q.$, window, document);
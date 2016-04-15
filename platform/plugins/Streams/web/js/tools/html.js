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
 */
Q.Tool.define("Streams/html", function (options) {
	var tool = this;
	var state = tool.state;

	if (!tool.state.publisherId) {
		throw new Q.Error("Streams/html tool: missing options.publisherId");
	}
	if (!tool.state.field) {
		throw new Q.Error("Streams/html tool: missing options.field");
	}
	
	var f = state.froala;
	f.toolbarButtonsXS = f.toolbarButtonsXS || f.toolbarButtons;
	f.toolbarButtonsSM = f.toolbarButtonsSM || f.toolbarButtons;
	f.toolbarButtonsMD = f.toolbarButtonsMD || f.toolbarButtons;

	if (state.streamName) {
		Q.Streams.get(state.publisherId, state.streamName, function (err) {
			if (Q.firstErrorMessage(err)) return false;
			state.stream = this;
			tool.element.innerHTML = this.fields[state.field] || state.placeholder;
			Q.loadNonce(_proceed);
		});
	} else if (state.placeholder) {
		if (!state.stream) {
			throw new Q.Error("Streams/html tool: missing streamName and stream is not set");
		}
		tool.element.innerHTML = state.placeholder;
		Q.loadNonce(_proceed);
	}

	function _proceed() {
		if (state.editable === false || !state.stream.testWriteLevel('suggest')) {
			return;
		}
		if (state.editor === 'auto') {
			state.editor = 'froala';
			state.froala = state.froala || {};
			if (Q.info.isTouchscreen) {
				state.froala.toolbarInline = false;
				state.froala.toolbarSticky = false;
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
		}
		switch (state.editor && state.editor.toLowerCase()) {
		case 'basic':
			tool.element.setAttribute('contenteditable', true);
			break;
		case 'ckeditor':
			tool.element.setAttribute('contenteditable', true);
            Q.addScript("plugins/Q/js/ckeditor/ckeditor.js", function () {
                CKEDITOR.disableAutoInline = true;
                var editor = CKEDITOR.inline(tool.element, state.ckeditor || undefined);
                state.editorObject = editor;
            });
			break;
		case 'froala':
		default:
			var scripts = [
				"plugins/Q/js/froala/js/froala_editor.min.js",
				"plugins/Q/js/froala/js/plugins/fullscreen.min.js",
				"plugins/Q/js/froala/js/plugins/code_view.min.js",
				"plugins/Q/js/froala/js/plugins/align.min.js",
				"plugins/Q/js/froala/js/plugins/table.min.js",
				"plugins/Q/js/froala/js/plugins/lists.min.js",
				"plugins/Q/js/froala/js/plugins/colors.min.js",
				"plugins/Q/js/froala/js/plugins/font_family.min.js",
				"plugins/Q/js/froala/js/plugins/font_size.min.js",
				"plugins/Q/js/froala/js/plugins/paragraph_style.min.js",
				"plugins/Q/js/froala/js/plugins/paragraph_format.min.js",
				"plugins/Q/js/froala/js/plugins/quote.min.js",
				"plugins/Q/js/froala/js/plugins/link.min.js",
				"plugins/Q/js/froala/js/plugins/image.min.js",
				"plugins/Q/js/froala/js/plugins/image_manager.min.js",
				"plugins/Q/js/froala/js/plugins/video.min.js"
			];
			if (Q.info.isIE(0, 8)) {
 				scripts.push("plugins/Q/js/froala/froala_editor_ie8.min.js");
			}
            Q.addScript(scripts, function(){
				Q.addStylesheet([
					"plugins/Q/font-awesome/css/font-awesome.min.css",
					"plugins/Q/js/froala/css/froala_editor.min.css",
					"plugins/Q/js/froala/css/froala_style.min.css",
					"plugins/Q/js/froala/css/plugins/fullscreen.min.css",
					"plugins/Q/js/froala/css/plugins/colors.min.css",
					"plugins/Q/js/froala/css/plugins/image.min.css",
					"plugins/Q/js/froala/css/plugins/table.min.css",
					"plugins/Q/js/froala/css/plugins/code_view.min.css"
				]);
                $(tool.element).froalaEditor(state.froala)
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
				this.state.froalaEditor = true;
            });
		}
		function _blur() {
            var content = state.editorObject
				? state.editorObject.getData()
				: $(tool.element).froalaEditor('html.get');
			if (state.editorObject) {
				editor.focusManager.blur();
			} else {
				$('.froala-editor.f-inline').hide();
			}
			_blurred = true;
			state.editing = false;
            if (state.startingContent === content) return;
            state.startingContent = null;
            if (!state.stream) return;
            state.stream.pendingFields[state.field] = content;
            state.stream.save(function (err) {
                if (Q.firstErrorMessage(err)) {
                    return state.onCancel.handle(err);
                }
                state.stream.refresh(function () {
                    state.onSave.handle.call(this);
                }, {messages: true});
            });
		}
		function _focus() {
			if (!_blurred) return;
			_blurred = false;
            var content = state.editorObject
				? state.editorObject.getData()
				: $(tool.element).froalaEditor('html.get');
			state.editing = true;
            state.startingContent = content;
        }
		var _blurred = true;
		$(tool.element)
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
		if (state.stream) {
			state.stream.onFieldChanged(state.field).set(function (fields, field) {
				function _updateHTML(html) {
					switch (state.editor && state.editor.toLowerCase()) {
					case 'ckeditor':
						if (tool.element.innerHTML !== html) {
							tool.element.innerHTML = html;
						}
						break;
					case 'froala':
					default:
						$(tool.element).froalaEditor('html.set', html);
						break;
					}
				}
				if (fields[field] !== null) {
					_updateHTML(fields[field]);
				} else {
					state.stream.refresh(function () {
						_updateHTML(this.fields[field]);
					});
				}
			}, tool);
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
	
	function onSave() {
		if (state.creatable && state.creatable.preprocess) {
			Q.handle(state.creatable.preprocess, this, [_proceed, tool, evt]);
		} else {
			_proceed();
		}
		return false;
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
	onSave: new Q.Event(),
	onCancel: new Q.Event()
},

{
	Q: {
		beforeRemove: function () {
			if (this.state.froalaEditor) {
				$(this.element).froalaEditor('destroy');
			}
		}
	}
}

);

})(Q, jQuery, window, document);
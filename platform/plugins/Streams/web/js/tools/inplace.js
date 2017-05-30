(function (Q, $, window, document, undefined) {

/**
 * Streams Tools
 * @module Streams-tools
 */

/**
 * Inplace text editor tool to edit the content or attribute of a stream
 * @class Streams inplace
 * @constructor
 * @param {Object} [options] used to pass options
 *   @param {String} options.inplaceType Required. The type of the fieldInput. Can be "textarea", "text" or "select"
 *   @param {Array} [options.convert] The characters to convert to HTML. Pass an array containing zero or more of "\n", " "
 *   @param {String} [options.publisherId] Required if stream option is empty. The publisher's user id.
 *   @param {String} [options.streamName] Required if stream option is empty. The stream's name.
 *   @param {Stream} [options.stream] Optionally pass a Streams.Stream object here if you have it already
 *   @param {String} [options.field] Optional, name of a field to change instead of the content of the stream
 *   @param {String} [options.attribute] Optional, name of an attribute to change instead of a field.
 *   @param {Object} [options.inplace] Additional fields to pass to the child Q/inplace tool, if any
 *   @param {Function} [options.create] Optional. You can pass a function here, which takes the tool as "this"
 *     and a callback as the first parameter, is supposed to create a stream and
 *     call the callback with (err, stream). If omitted, then the tool doesn't render.
 *   @param {Q.Event} [options.onLoad]
 *   @param {Q.Event} [options.onUpdate]
 *   @param {Q.Event} [options.onError]
 */
Q.Tool.define("Streams/inplace", function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	var container = $('.Q_inplace_tool_container', $te);
	
	// if activated with JS should have following options:
	//  - stream: a Streams.Stream object that was already constructed
	//  - publisherId, streamName: alternative to stream
	//  - field: the name of the field to bind to, defaults to "content"
	//  - attribute: alternatively, the name of an attribute to bind to

	function _construct(err) {
		if (err) {
			return tool.state.onError.handle(err);
		}
		var stream = this;
		state.publisherId = stream.fields.publisherId;
		state.streamName = stream.fields.name;
		
		var currentContent = null;
		var currentHtml = null;

		function _setContent(content) {
			if (tool.inplace = tool.sibling('Q/inplace') || tool.child('', 'Q/inplace')) {
				tool.$static = tool.inplace.$static;
				tool.inplace.state.onLoad.add(state.onLoad.handle.bind(tool));
			} else if (!tool.$static) {
				tool.$static = tool.$('.Q_inplace_tool_static, .Q_inplace_tool_blockstatic');
			}
			Q.Streams.get(state.publisherId, state.streamName, function () {
				var placeholder = tool.inplace && tool.inplace.state.placeholder
					&& String(tool.inplace.state.placeholder).encodeHTML();
				var $e, html = String(content || '').encodeHTML()
					|| '<span class="Q_placeholder">'+placeholder+'</div>';
					
				if (state.inplaceType === 'textarea') {
					var convert = {};
					if (content) {
						var replacements = {
							"\n": '<br>',
						 	' ': '&nbsp;'
						};
						if (state.convert) {
							for (var i=0, l=state.convert.length; i<l; ++i) {
								var c = state.convert[i];
								convert[c] = replacements[c];
							}
						}
					}
					var toSet = html.replaceAll(convert);
				}
				if (tool.inplace) {
					var $input = tool.inplace.$input;
					if (currentContent !== content) {
						$input.val(currentContent = content);
					}
					if ($input.is(":visible")) {
						var margin = $input.outerHeight() + parseInt($input.css('margin-top'));
						tool.$('.Q_inplace_tool_editbuttons').css('margin-top', margin+'px');
					}
				}
				if (currentHtml !== html) {
					tool.$static.html(currentHtml = html);
				}
			});
		};

		if (state.attribute) {
			state.field = 'attributes['+encodeURIComponent(state.attribute)+']';
			stream.onAttribute(state.attribute).set(function (attributes, k) {
				if (attributes[k] !== null) {
					_setContent(attributes[k]);
				} else {
					Q.Streams.Stream.refresh(state.publisherId, state.streamName, function () {
						_setContent(this.getAttribute(k));
					});
				}
			}, tool);
		} else {
			state.field = state.field || 'content';
			stream.onFieldChanged(state.field).set(function (fields, k) {
				if (fields[k] !== null) {
					_setContent(fields[k]);
				} else {
					Q.Streams.Stream.refresh(state.publisherId, state.streamName, function () {
						_setContent(this.fields[k]);
					});
				}
			}, tool);
		}
		
		if (!container.length) {
			// dynamically construct the tool
			var ipo = Q.extend(state.inplace, {
				action: stream.actionUrl(),
				method: 'put',
				field: state.field,
				type: state.inplaceType
			});
			var value = (state.attribute ? stream.getAttribute(state.attribute) : stream.fields[state.field]) || "";
			switch (state.inplaceType) {
				case 'text':
					ipo.staticHtml = String(value).encodeHTML();
					break;
				case 'textarea':
					ipo.staticHtml = String(value).encodeHTML().replaceAll({
						'&lt;br&gt;': "<br>",
						'&lt;br /&gt;': "<br>",
						'&nbsp;': ' '
					});
					break;
				case 'select':
					if (!ipo.options) {
						throw new Q.Error("Streams/inplace tool: inplace.options must be provided");
					}
					if (!(value in ipo.options)) {
						throw new Q.Error("Streams/inplace tool: inplace.options must contain value: " + value);
					}
					ipo.staticHtml = String(ipo.options[value]).encodeHTML();
					break;
				default:
					throw new Q.Error("Streams/inplace tool: inplaceType must be 'textarea', 'text' or 'select'");
			}

			if (state.editable === false || !stream.testWriteLevel('suggest')) {
				var span = document.createElement('span');
				span.setAttribute('class', 'Q_inplace_tool_container');
				var div = document.createElement('div');
				var staticClass = options.inplaceType === 'textarea'
					? 'Q_inplace_tool_blockstatic'
					: 'Q_inplace_tool_static';
				div.setAttribute('class', staticClass);
				if (div.innerHTML !== ipo.staticHtml) {
					div.innerHTML = ipo.staticHtml;
				}
				span.appendChild(div);
				tool.$static = $(div);
				tool.element.appendChild(span);
				Q.handle(state.onLoad, tool);
				return; // leave the html that is currently in the element
			}

			tool.setUpElement(tool.element, 'Q/inplace', ipo);
			Q.activate(tool.element, _content);
		} else {
			tool.Q.onInit.add(_content, tool);
		}
		
		function _content() {
			if (state.attribute) {
				_setContent(stream.attributes[state.attribute]);
			} else {
				_setContent(stream.fields[state.field]);
			}
		}
	}
	
	if (state.stream) {
		state.publisherId = state.stream.fields.publisherId;
		state.streamName = state.stream.fields.name;
		delete state.stream;
	}
	if (!state.publisherId || !state.streamName) {
		throw new Q.Error("Streams/inplace tool: stream is undefined");
	}
	Q.Streams.retainWith(tool)
	.get(state.publisherId, state.streamName, _construct);
},

{
	inplaceType: 'textarea',
	editable: true,
	create: null,
	inplace: {},
	convert: [],
	onLoad: new Q.Event(),
	onUpdate: new Q.Event(),
	onError: new Q.Event(function (err) {
		var msg = Q.firstErrorMessage(err);
		console.warn("Streams/inplace: ", msg);
	}, "Streams/inplace")
},

{
	Q: {
		onInit: {"Streams/inplace": function () {
			var tool = this;
			var state = tool.state;
			this.forEachChild('Q/inplace', 1, true, _setup);
			function _setup() {
				this.state.onSave.set(function () {
					Q.Streams.Stream.refresh(
						state.publisherId, state.streamName,
						state.onUpdate.handle.bind(tool),
						{
							messages: true,
							unlessSocket: true
						}
					);
				}, 'Streams/inplace');
			}
		}}
	}
}

);

})(Q, jQuery, window, document);

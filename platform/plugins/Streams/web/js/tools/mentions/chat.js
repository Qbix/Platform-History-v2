(function (Q, $, window, undefined) {
	/**
	 * This tool create Streams/mentions/chat tools above urls in chat messages.
	 * @class Streams/mention
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 */
	Q.Tool.define("Streams/mentions/chat", ["Streams/chat"], function (options) {
		var tool = this;
		var state = this.state;
		state.chatTool = Q.Tool.from(this.element, "Streams/chat");

		Q.addStylesheet('{{Streams}}/css/tools/mentions.css');

		Q.Text.get('Streams/content', function (err, text) {
			tool.text = text;
		});

		var selector = '.Streams_chat_composer input, .Streams_chat_composer textarea';

		$(state.chatTool.element).on('keyup', selector, function (e) {
			if ($(this).closest(".Streams_mentions_chat").length) {
				return;
			}

			if (this.value.slice(-1) === '@') {
				tool.process(this);
			}
		});

		$(state.chatTool.element).on('focus', selector, function (e) {
			if ($(this).closest(".Streams_mentions_chat").length) {
				return;
			}

			tool.close(true);
		});

		// on new message render
		state.chatTool.state.onMessageRender.set(function (fields, html) {
			var $html = $(fields.html || html);

			tool.parseChatMessage($html, fields.instructions);

			fields.html = $html[0].outerHTML;
		}, tool);

		// parse old messages
		Q.each($(".Streams_chat_item", state.chatTool.element), function (i, element) {
			tool.parseChatMessage(this, this.getAttribute('data-instructions'));
		});

		// on before message post
		state.chatTool.state.beforePost.set(function (fields) {
			var selectedIds = state.selectedIds;
			if (!selectedIds.length) {
				return;
			}

			fields.instructions = Q.extend({}, fields.instructions, {
				'Streams/mentions': selectedIds
			});

			state.selectedIds = [];
		}, tool);

		$(document).keyup(function (e) {
			if (e.keyCode === 13 || e.keyCode === 27) {
				tool.close();
			}
		});
	},

	{
		selectedIds: []
	},

	{
		/**
		 * @method process
		 */
		process: function (input) {
			var tool = this;
			var state = this.state;
			if (state.userChooserTool) {
				return;
			}

			var $input = state.input = $(input);
			var $form = $input.closest("form");

			$input.blur();

			Q.Template.render('Streams/mentions/chat', {
				text: tool.text
			}, function (err, html) {
				if (err) {
					return;
				}

				var $element = $(html).prependTo($form);

				$('a.Q_close', $element).on(Q.Pointer.fastclick, function () {
					tool.close();
				});

				$element
				.css('top', -1 * $element.outerHeight())
				.tool("Streams/userChooser", {
					position: 'top',
					onChoose: function (userId, avatar) {
						$input.val($input.val() + userId);
						state.selectedIds.push(userId);
						tool.close();
					}
				}).on('focus', "input", function () {
					setTimeout(function () {
						state.chatTool.scrollToBottom();
					}, 500);
				}).on('blur', "input", function () {
					setTimeout(function () {
						$element.remove();
					}, 100);
				}).activate(function () {
					state.userChooserTool = this;
					$("input", this.element).plugin('Q/placeholders').focus();

				});
			});
		},
		/**
		 * @method close
		 */
		close: function (skipFocus) {
			var input = this.state.input;

			if (!skipFocus && input instanceof jQuery) {
				input.focus();
			}

			if (Q.typeOf(this.state.userChooserTool) === 'Q.Tool') {
				Q.Tool.remove(this.state.userChooserTool.element, true, true);
				this.state.userChooserTool = null;
			}
		},
		/**
		 *	Add Streams/mentions/chat tools to chat messages
		 *
		 * @method parseChatMessage
		 * @return {jQuery|HTMLElement} element Chat message element (Streams_chat_item)
		 */
		parseChatMessage: function (element, instructions) {
			instructions = Q.getObject('Streams/mentions', JSON.parse(instructions || null)) || [];
			if (!instructions.length) {
				return;
			}

			if (!(element instanceof jQuery)) {
				element = $(element);
			}

			if (element.attr('data-mentionsProcessed')) {
				return;
			}

			// parse all links in message
			var $chatMessageContent = $(".Streams_chat_message_content", element);
			var chatMessageContent = $chatMessageContent.html();
			Q.each(chatMessageContent.matchTypes('qbixUserId'), function (i, string) {
				var userId = string.replace('@', '');

				if (instructions.indexOf(userId) === -1) {
					return;
				}

				var avatarTool = Q.Tool.setUpElementHTML('div', 'Users/avatar', {
					userId: userId,
					short: true,
					icon: false
				});
				chatMessageContent = chatMessageContent.replace(string, avatarTool);
			});
			$chatMessageContent.html(chatMessageContent, true);

			// mark element as processed
			element.attr('data-mentionsProcessed', 1);

			return element;
		}
	});

	Q.Template.set('Streams/mentions/chat',
		'<div class="Streams_mentions_chat">' +
		'	<input placeholder="{{text.chat.SearchByName}}">' +
		'	<a class="Q_close"></a>' +
		'</div>'
	);
})(Q, Q.$, window);
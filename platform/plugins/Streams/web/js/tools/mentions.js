(function (Q, $, window, undefined) {
	/**
	 * This tool create Streams/mentions/chat tools above urls in chat messages.
	 * @class Streams/mention
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 */
	Q.Tool.define("Streams/mentions/chat", ["Streams/chat"], function (options) {
		var tool = this;
		var chatTool = Q.Tool.from(this.element, "Streams/chat");

		Q.addStylesheet('{{Streams}}/css/tools/mentions.css');

		Q.Text.get('Streams/content', function (err, text) {
			tool.text = text;
		});

		var selector = '.Streams_chat_composer input, .Streams_chat_composer textarea';

		$(chatTool.element).on('keyup', selector, function (e) {
			if ($(this).closest(".Streams_mentions_chat").length) {
				return;
			}

			if (e.keyCode === 50) {
				tool.process(this);
			}
		});

		$(chatTool.element).on('focus', selector, function (e) {
			if ($(this).closest(".Streams_mentions_chat").length) {
				return;
			}

			tool.close(true);
		});

		// on new message render
		chatTool.state.onMessageRender.set(function (fields, html) {
			var $html = $(fields.html || html);

			// parse all links in message
			var $chatMessageContent = $(".Streams_chat_message_content", $html);
			var chatMessageContent = $chatMessageContent.html();
			Q.each(chatMessageContent.matchTypes('qbixUserId'), function (i, string) {
				var avatarTool = Q.Tool.setUpElementHTML('div', 'Users/avatar', {
					userId: string.replace('@', ''),
					short: true,
					icon: false
				});
				chatMessageContent = chatMessageContent.replace(string, avatarTool);
			});
			$chatMessageContent.html(chatMessageContent);

			fields.html = $html[0].outerHTML;
		}, tool);

		$(document).keyup(function (e) {
			if (e.keyCode === 13 || e.keyCode === 27) {
				tool.close();
			}
		});
	},

	{

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

				$element
				.css('top', -1 * $element.outerHeight())
				.tool("Streams/userChooser", {
					position: 'top',
					onChoose: function (userId, avatar) {
						$input.val($input.val() + userId);
						tool.close();
					}
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
		}
	});

	Q.Template.set('Streams/mentions/chat',
		'<div class="Streams_mentions_chat">' +
		'	<input placeholder="{{text.chat.SearchByName}}">' +
		'</div>'
	);
})(Q, Q.$, window);
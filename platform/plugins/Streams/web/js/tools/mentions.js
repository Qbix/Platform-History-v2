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
		var chatTool = Q.Tool.from(this.element, "Streams/chat");

		// preload throbber
		$('<img/>')[0].src = Q.url("{{Q}}/img/throbbers/loading.gif");

		Q.addStylesheet('{{Streams}}/css/tools/mentions.css');

		$(chatTool.element).on('keyup', '.Streams_chat_composer input, .Streams_chat_composer textarea', function (e) {
			if (e.keyCode === 50) {
				tool.process(this);
			}
		});

		// on new message render
		chatTool.state.onMessageRender.set(function (fields, html) {
			var $html = $(html);

			// parse all links in message
			var $chatMessageContent = $(".Streams_chat_message_content", $html);
			var chatMessageContent = $chatMessageContent.html();
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

			$input.hide();
			$("<div><input></div>")
			.prependTo($form)
			.tool("Streams/userChooser", {
				position: 'top',
				onChoose: function (userId, avatar) {
					$input.val($input.val() + userId);
					tool.close();
				}
			}).activate(function () {
				state.userChooserTool = this;
				$("input", this.element).focus();
			});
		},
		/**
		 * @method close
		 */
		close: function () {
			var input = this.state.input;

			if (Q.typeOf(this.state.userChooserTool) === 'Q.Tool') {
				Q.Tool.remove(this.state.userChooserTool.element, true, true);
				this.state.userChooserTool = null;
			}

			if (input instanceof jQuery) {
				input.show().focus();
			}
		}
	});
})(Q, Q.$, window);
(function (Q, $, window, undefined) {
	/**
	 * This Streams/chat
	 * @class Streams/image/chat
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 * @param {string} [options.appendTo=bubble] Where to append preview tool in chat message:
	 * 	bubble - inside bubble element of message,
	 * 	message - inside message element itself
	 */
	Q.Tool.define("Streams/image/chat", ["Streams/chat"], function (options) {
		var tool = this;
		tool.chatTool = Q.Tool.from(this.element, "Streams/chat");
		var userId = Q.Users.loggedInUserId();

		// preload throbber
		$('<img/>')[0].src = Q.info.imgLoading;

		Q.addStylesheet('{{Streams}}/css/tools/previews.css');

		// on before message post
		tool.chatTool.state.beforePost.set(function (fields) {

		}, tool);

		// on new message render
		tool.chatTool.state.onMessageRender.set(function (fields, html) {

		}, tool);

		// parse old messages
		Q.each($(".Streams_chat_item", tool.chatTool.element), function (i, element) {

		});

		Q.Text.get('Streams/content', function (err, text) {
			tool.text = text;

			// non logged user can't add any items to chat
			if (!Q.Users.loggedInUserId()) {
				return;
			}

			var $element = $("<li class='Streams_chat_addon Streams_preview_create'></li>");
			$("<div class='Streams_chat_addon_icon'><img src='" + Q.url("{{Streams}}/img/icons/Streams/image/40.png") + "' /></div>").appendTo($element);
			$("<span class='Streams_chat_addon_title'>" + tool.text.types["Streams/image"].newItem + "</span>").appendTo($element);

			tool.chatTool.state.onContextualCreated.add(function (contextual) {
				$("ul.Q_listing", contextual).append($element);
				$element.plugin('Q/imagepicker', {
					fullSize: "400x",
					maxStretch: 2,
					save: "Streams/image",
					saveSizeName: {
						"40.png": "40.png",
						"50": "50",
						"50.png": "50.png",
						"80.png": "80.png",
						"200.png": "200.png",
						"400.png": "400.png",
						"400x.png": "400x.png",
						"x400.png": "x400.png"
					},
					showSize: "50"
				});
			}, tool);


			/*imagePreview.composer(function (params) {
				var fields = Q.extend({
					publisherId: userId,
					type: "Streams/image"
				}, 10, params);

				var $dummy = $("<div class='Streams_preview_dummy'>").appendTo(tool.chatTool.$('.Streams_chat_messages'));

				Q.Streams.create(fields, function Streams_preview_afterCreate(err, stream, extra) {
					$dummy.remove();

					if (err) {
						return err;
					}

					console.log(this);
				}, {
					publisherId: tool.chatTool.state.publisherId,
					streamName: tool.chatTool.state.streamName,
					type: "Streams/image"
				});
			});*/

		});

	},

	{
		appendTo: 'bubble'
	},

	{

	});

})(Q, Q.$, window);
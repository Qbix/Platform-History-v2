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

			// add contect menu item
			tool.refresh();
		});

	},

	{
		appendTo: 'bubble'
	},

	{
		refresh: function () {
			var tool = this;
			var userId = Q.Users.loggedInUserId();

			// non logged user can't add any items to chat
			if (!userId) {
				return;
			}

			tool.$previewElement && Q.Tool.remove(tool.$previewElement[0], true, true);

			tool.$previewElement = $("<div>").css("display", "none").appendTo(tool.chatTool.element.parentElement).tool("Streams/preview", {
				publisherId: userId,
				related: {
					publisherId: tool.chatTool.state.publisherId,
					streamName: tool.chatTool.state.streamName,
					type: "Streams/image"
				},
				onRefresh: function () {
					tool.refresh();
				},
				creatable: {
					/*preprocess: function (_proceed) {
						var fields = Q.extend({
							publisherId: userId,
							type: "Streams/image"
						});

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
					}*/
				}
			}).tool("Streams/image/preview", {
				defineTitle: '',
				sendOriginal: true
			}).activate(function () {
				var _handler = function () {
					$(".Q_imagepicker", tool.$previewElement).plugin('Q/imagepicker', 'click');
				};

				if (tool.menuItem) {
					return tool.menuItem.data("handler", _handler);
				}

				tool.menuItem = tool.chatTool.addMenuItem({
					title: Q.getObject(["types", "Streams/image", "newItem"], tool.text) || "Add Image",
					icon: "{{Streams}}/img/icons/Streams/image/40.png",
					handler: _handler
				});
			});
		}
	});

})(Q, Q.$, window);
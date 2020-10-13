(function (Q, $, window, undefined) {
	/**
	 * This Streams/chat
	 * @class Streams/video/chat
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 * @param {string} [options.appendTo=bubble] Where to append preview tool in chat message:
	 * 	bubble - inside bubble element of message,
	 * 	message - inside message element itself
	 */
	Q.Tool.define("Streams/video/chat", ["Streams/chat"], function (options) {
		var tool = this;
		tool.chatTool = Q.Tool.from(this.element, "Streams/chat");
		var userId = Q.Users.loggedInUserId();

		// preload throbber
		$('<img/>')[0].src = Q.info.imgLoading;

		Q.addStylesheet('{{Streams}}/css/tools/videoChatPlugin.css');

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
			tool.chatTool.addMenuItem({
				title: tool.text.types["Streams/video"].newItem,
				icon: "{{Streams}}/img/icons/Streams/video/40.png",
				handler: function () {
					$("<div>").tool("Streams/preview", {
						publisherId: userId
					}).tool("Streams/video/preview").activate(function () {
						var videoPreview = Q.Tool.from(this.element, "Streams/video/preview");

						videoPreview.composer(function (params) {
							var fields = Q.extend({
								publisherId: userId,
								type: "Streams/video"
							}, 10, params);
							Q.Streams.create(fields, function Streams_preview_afterCreate(err, stream, extra) {
								if (err) {
									return err;
								}

								console.log(this);
							}, {
								publisherId: tool.chatTool.state.publisherId,
								streamName: tool.chatTool.state.streamName,
								type: "Streams/video"
							});
						});
					});
				}
			});
		});

	},

	{
		appendTo: 'bubble'
	},

	{

	});

})(Q, Q.$, window);
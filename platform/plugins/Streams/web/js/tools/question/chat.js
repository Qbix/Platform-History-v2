(function (Q, $, window, undefined) {
	/**
	 * This Streams/chat
	 * @class Streams/question/chat
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 * @param {string} [options.appendTo=bubble] Where to append preview tool in chat message:
	 * 	bubble - inside bubble element of message,
	 * 	message - inside message element itself
	 */
	Q.Tool.define("Streams/question/chat", ["Streams/chat"], function (options) {
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

		var title = Q.getObject(["types", "Streams/question", "newItem"], tool.text) || "Add Question";

		// non logged user can't add any items to chat
		if (!Q.Users.loggedInUserId()) {
			return;
		}

		// add contect menu item
		tool.chatTool.addMenuItem({
			title: title,
			icon: "{{Streams}}/img/icons/Streams/question/40.png",
			className: "Streams_question_chat",
			handler: function () {
				Q.Dialogs.push({
					title: title,
					className: "Streams_question_dialog",
					content: $("<div>").tool("Streams/question", {
						publisherId: tool.chatTool.state.publisherId,
						streamName: tool.chatTool.state.streamName
					})
				});
			}
		});
	},

	{
		appendTo: 'bubble'
	},

	{

	});

})(Q, Q.$, window);
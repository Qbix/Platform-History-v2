(function (Q, $, window, undefined) {
	/**
	 * This tool create Websites/webpage/preview tools above urls in chat messages.
	 * @class Websites/webpage/chat
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 */
	Q.Tool.define("Websites/webpage/chat", ["Streams/chat"], function (options) {
		var tool = this;
		tool.chatTool = Q.Tool.from(this.element, "Streams/chat");

		Q.addStylesheet('{{Websites}}/css/tools/webpage/chat.css');

		var idleTimer;
		$(tool.chatTool.element).on('change input', '.Streams_chat_composer :input', function () {
			var $this = $(this);

			clearTimeout(idleTimer);

			idleTimer = setTimeout(function () {
				tool.process($this.val());
			}, 1000);
		});
	},

	{
		websitesPreview: {}
	},

	{
		/**
		 * Get urls from string and create Websites/webpage/preview tools for each.
		 *
		 * @method process
		 * @param {String} string
		 */
		process: function (string) {
			var tool = this;
			var websitesPreview = this.state.websitesPreview;
			var urls = tool.getURLsFromText(string);

			Q.each(urls, function (i, url) {
				if (websitesPreview[url]) {
					return;
				}

				Q.req('Websites/scrape', ['result'], function (err, response) {
					var msg = Q.firstErrorMessage(err, response && response.errors);
					if (msg) {
						return;
					}

					var siteData = response.slots.result;

					websitesPreview[url] = $("<div>").tool("Websites/webpage/preview", {
						title: siteData.title,
						description: siteData.description,
						keywords: siteData.keywords || '',
						interest: {
							title: ' ' + siteData.host,
							icon: siteData.smallIcon,
						},
						src: siteData.bigIcon,
						url: siteData.url
					}, Date.now()).appendTo(tool.chatTool.element).activate(function () {
						var previewTool = this;

						$('<a class="Q_close"></a>').on(Q.Pointer.fastclick, function () {
							Q.Tool.remove(previewTool.element, true, true);
						}).appendTo(this.element);
					});
				}, {
					method: 'post',
					fields: {url: url}
				});
			});
		},
		/**
		 *This is used Validation for Website URL Text in the contents.
		 *
		 * @method validateURLWithText
		 * @param {String} str content of string url
		 * @return {array} Returns Website url in the card details content.
		 */
		getURLsFromText: function (str) {
			var urls = str.match(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi);

			return Array.isArray(urls) ? urls : [];
		}
	});
})(Q, Q.$, window);
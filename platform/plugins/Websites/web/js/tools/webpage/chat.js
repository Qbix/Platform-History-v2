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

		// preload throbber
		$('<img/>')[0].src = Q.url("{{Q}}/img/throbbers/loading.gif");

		Q.addStylesheet('{{Websites}}/css/tools/webpage/chat.css');

		$(tool.chatTool.element).on('change input', '.Streams_chat_composer :input', Q.debounce(function () {
			tool.process(this);
		}, 500));

		// on message posted
		tool.chatTool.state.onMessagePost.set(function (ordinal) {
			var $preview = tool.getActivePreview();

			if ($preview) {
				$preview.insertAfter($(".Streams_chat_item.Streams_chat_from_me:last-child", tool.chatTool.element));
				tool.state.websitesPreview = {};
			}
		}, tool);
	},

	{
		websitesPreview: {}
	},

	{
		/**
		 * Get urls from string and create Websites/webpage/preview tools for each.
		 *
		 * @method process
		 * @param {HTMLElement|jQuery} input
		 */
		process: function (input) {
			var tool = this;
			var $input = $(input);
			var $form = $input.closest("form");
			var websitesPreview = this.state.websitesPreview;
			var urls = tool.getURLsFromText($input.val());

			Q.each(urls, function (i, url) {
				if (tool.getActivePreview() || url in websitesPreview) {
					return;
				}

				Q.Template.render('Websites/webpage/chat', {
					src: Q.url("{{Q}}/img/throbbers/loading.gif")
				}, function (err, html) {
					if (err) {
						return;
					}

					websitesPreview[url] = $(html).insertBefore($form);

					$('a.Q_close', websitesPreview[url]).on(Q.Pointer.fastclick, function () {
						websitesPreview[url].remove();
						websitesPreview[url] = null;
					});

					Q.req('Websites/scrape', ['result'], function (err, response) {
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg || !websitesPreview[url]) {
							return;
						}

						var siteData = response.slots.result;

						websitesPreview[url].tool("Websites/webpage/preview", {
							title: siteData.title,
							description: siteData.description,
							keywords: siteData.keywords || '',
							interest: {
								title: ' ' + siteData.host,
								icon: siteData.smallIcon,
							},
							src: siteData.bigIcon,
							url: siteData.url
						}, Date.now()).activate(function () {
							var previewTool = this;
							var $te = $(previewTool.element);

							$te.outerWidth($form.innerWidth());

							$te.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
								window.open(siteData.url, '_blank');
							});

							$('<a class="Q_close"></a>').on(Q.Pointer.fastclick, function () {
								websitesPreview[url] = null;
								Q.Tool.remove(previewTool.element, true, true);
							}).appendTo(previewTool.element);
						});
					}, {
						method: 'post',
						fields: {url: url}
					});
				});
			});
		},
		/**
		 *	This is used Validation for Website URL Text in the contents.
		 *
		 * @method getActivePreview
		 * @return {Q.Tool} Returns Websites/webpage/preview tool
		 */
		getActivePreview: function () {
			var websitesPreview = this.state.websitesPreview;

			for (var url in websitesPreview) {
				if (websitesPreview[url]) {
					return websitesPreview[url];
				}
			}

			return null;
		},
		/**
		 *	This is used Validation for Website URL Text in the contents.
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

	Q.Template.set('Websites/webpage/chat',
		'<div class="Websites_webpage_preview_tool"><img src="{{src}}"><a class="Q_close"></a></div>'
	);
})(Q, Q.$, window);
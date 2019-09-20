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

		$(tool.chatTool.element).on('input', '.Streams_chat_composer :input', Q.debounce(function () {
			tool.process(this);
		}, 500));

		// on before message post
		tool.chatTool.state.onBeforePost.set(function (fields) {
			var $preview = tool.getActivePreview();
			if (!$preview) {
				return;
			}

			var previewTool = Q.Tool.from($preview, "Websites/webpage/preview");

			fields.instructions = Q.extend({}, fields.instructions, {
				'Websites/webpages': {
					publisherId: previewTool.state.publisherId,
					streamName: previewTool.state.streamName
				}
			});

			Q.Tool.remove(previewTool.element, true, true);
			tool.state.websitesPreview = {};
		}, tool);

		// on new message render
		tool.chatTool.state.onMessageRender.set(function (fields, html) {
			var instructions = Q.getObject('Websites/webpages', JSON.parse(fields.instructions || null));

			if (!instructions) {
				return;
			}

			var $html = $(html);

			$(Q.Tool.setUpElementHTML('div', 'Websites/webpage/preview', instructions)).appendTo($(".Streams_chat_bubble", $html));

			fields.html = $html[0].outerHTML;
		}, tool);

		Q.Tool.onActivate('Websites/webpage/preview').add(function () {
			var previewTool = this;
			var $te = $(this.element);

			if ($te.closest('.Streams_chat_item').length) {
				$te.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
					window.open(previewTool.state.url, '_blank');
				});
			}
		}, true);
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
			var urls = $input.val().matchTypes('url');

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

					Q.req('Websites/scrape', ['result', 'publisherId', 'streamName'], function (err, response) {
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg || !websitesPreview[url]) {
							return;
						}

						var siteData = response.slots.result;

						websitesPreview[url].tool("Websites/webpage/preview", {
							publisherId: response.slots.publisherId,
							streamName: response.slots.streamName
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
		}
	});

	Q.Template.set('Websites/webpage/chat',
		'<div class="Websites_webpage_preview_tool"><img src="{{src}}"><a class="Q_close"></a></div>'
	);
})(Q, Q.$, window);
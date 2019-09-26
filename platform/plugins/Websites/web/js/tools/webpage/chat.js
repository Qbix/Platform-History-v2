(function (Q, $, window, undefined) {
	/**
	 * This tool create Websites/webpage/chat tools above urls in chat messages.
	 * @class Websites/webpage/chat
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 * @param {string} [options.appendTo=bubble] Where to append preview tool in chat message:
	 * 	bubble - inside bubble element of message,
	 * 	message - inside message element itself
	 */
	Q.Tool.define("Websites/webpage/chat", ["Streams/chat"], function (options) {
		var tool = this;
		var state = this.state;
		tool.chatTool = Q.Tool.from(this.element, "Streams/chat");

		// preload throbber
		$('<img/>')[0].src = Q.url("{{Q}}/img/throbbers/loading.gif");

		Q.addStylesheet('{{Websites}}/css/tools/webpage/chat.css');

		$(tool.chatTool.element).on('input', '.Streams_chat_composer input', Q.debounce(function () {
			tool.process(this);
		}, 500));

		// on before message post
		tool.chatTool.state.beforePost.set(function (fields) {
			var $preview = tool.getActivePreview();
			state.websitesPreview = {};
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

			tool.removePreview(previewTool.element);
		}, tool);

		// on new message render
		tool.chatTool.state.onMessageRender.set(function (fields, html) {
			var $html = $(fields.html || html);

			$html = tool.parseChatMessage($html, fields.instructions);

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
		}, tool);

		// parse old messages
		Q.each($(".Streams_chat_item", tool.chatTool.element), function (i, element) {
			var $this = $(this);
			tool.parseChatMessage($this, $this.attr('data-instructions'));
		});
	},

	{
		websitesPreview: {},
		appendTo: 'bubble'
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
			var inputVal = $input.val();
			var $form = $input.closest("form");
			var websitesPreview = this.state.websitesPreview;
			var urls = inputVal.matchTypes('url');

			Q.each(urls, function (i, url) {
				if (tool.getActivePreview() || url in websitesPreview || inputVal.endsWith(url)) {
					return;
				}

				Q.Template.render('Websites/webpage/chat', {
					src: Q.url("{{Q}}/img/throbbers/loading.gif")
				}, function (err, html) {
					if (err) {
						return;
					}

					websitesPreview[url] = $(html).prependTo($form);

					var _close = function () {
						tool.removePreview(websitesPreview[url]);
						websitesPreview[url] = null;
						tool.process(input);
					};

					$('a.Q_close', websitesPreview[url]).on(Q.Pointer.fastclick, _close);

					Q.req('Websites/scrape', ['result', 'publisherId', 'streamName'], function (err, response) {
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg) {
							return _close();
						}

						var siteData = response.slots.result;

						$(".Websites_webpage_preview_tool", websitesPreview[url]).tool("Websites/webpage/preview", {
							publisherId: response.slots.publisherId,
							streamName: response.slots.streamName,
							editable: false
						}, Date.now()).activate(function () {
							var previewTool = this;
							var $te = $(previewTool.element);

							$te.outerWidth($form.innerWidth());

							$te.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
								window.open(siteData.url, '_blank');
							});
						});
					}, {
						method: 'post',
						fields: {url: url}
					});
				});
			});
		},
		/**
		 *	Add Websites/webpage/preview tools to chat messages
		 *
		 * @method parseChatMessage
		 * @return {jQuery|HTMLElement} element Chat message element (Streams_chat_item)
		 */
		parseChatMessage: function (element, instructions) {
			if (!(element instanceof jQuery)) {
				element = $(element);
			}

			if (element.attr('data-webpageProcessed')) {
				return;
			}

			var state = this.state;

			// parse all links in message
			var $chatMessageContent = $(".Streams_chat_message_content", element);
			var chatMessageContent = $chatMessageContent.html();
			Q.each(chatMessageContent.matchTypes('url'), function (i, url) {
				var href = url;
				if (href.indexOf('//') === -1) {
					href = '//' + href;
				}

				chatMessageContent = chatMessageContent.replace(url, "<a href='" + href + "' target='_blank'>" + url + "</a>");
			});
			$chatMessageContent.html(chatMessageContent);

			instructions = Q.getObject('Websites/webpages', JSON.parse(instructions || null));
			if (instructions) {
				var elementToAppend = state.appendTo === 'bubble' ? $(".Streams_chat_bubble", element) : element;
				instructions.editable = false;
				$(Q.Tool.setUpElementHTML('div', 'Websites/webpage/preview', instructions)).appendTo(elementToAppend);
			}

			// mark element as processed
			element.attr('data-webpageProcessed', 1);

			return element;
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
					return $(".Websites_webpage_preview_tool", websitesPreview[url]);
				}
			}

			return null;
		},
		/**
		 *	Correctly remove preview element
		 *
		 * @method removePreview
		 * @param {HTMLElement|jQuery} element Element need to remove
		 */
		removePreview: function (element) {
			if (element instanceof HTMLElement) {
				element = $(element);
			}

			var $parent = element.closest(".Websites_webpage_chat");
			Q.Tool.remove(element[0], true, true);
			$parent.remove();
		}
	});

	Q.Template.set('Websites/webpage/chat',
		'<div class="Websites_webpage_chat">' +
		'	<div class="Websites_webpage_preview_tool"><img src="{{src}}"></div>' +
		'	<a class="Q_close"></a>' +
		'</div>'
	);
})(Q, Q.$, window);
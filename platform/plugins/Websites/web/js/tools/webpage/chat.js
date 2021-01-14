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
		$('<img/>')[0].src = Q.info.imgLoading;

		Q.addStylesheet('{{Websites}}/css/tools/webpage/chat.css');

		// input event handler
		$(tool.chatTool.element).on('input', '.Streams_chat_composer input, .Streams_chat_composer textarea', Q.debounce(function (event) {
			tool.process(this, event);
		}, 1000));

		// paste event handler
		$(tool.chatTool.element).on('paste', '.Streams_chat_composer input, .Streams_chat_composer textarea', Q.debounce(function (event) {
			tool.process(this, event);
		}, 1000));

		// on before message post
		tool.chatTool.state.beforePost.set(function (fields) {
			var previewTool = tool.getToolFromElement(tool.getActivePreview());
			state.websitesPreview = {};
			state.processedURLs = {};

			if (Q.typeOf(previewTool) !== 'Q.Tool') {
				return;
			}

			var type = previewTool.name.replace(/_/g, '/');
			type = type.charAt(0).toUpperCase() + type.slice(1);

			fields.instructions = Q.extend({}, fields.instructions, {
				'Websites/webpages': {
					url: previewTool.state.url,
					streamType: type
				}
			});

			tool.removePreview(previewTool.element);
		}, tool);

		// on new message render
		tool.chatTool.state.onMessageRender.set(function (fields, html) {
			var $html = $(fields.html || html);

			$html = tool.parseChatMessage($html, fields.instructions);
			if (!$html) {
				return;
			}

			fields.html = $html[0].outerHTML;
		}, tool);

		// parse old messages
		Q.each($(".Streams_chat_item", tool.chatTool.element), function (i, element) {
			var $this = $(this);
			tool.parseChatMessage($this, $this.attr('data-instructions'));
		});
	},

	{
		websitesPreview: {},
		processedURLs: {},
		appendTo: 'bubble'
	},

	{
		/**
		 * Get urls from string and create Websites/webpage/preview tools for each.
		 *
		 * @method process
		 * @param {HTMLElement|jQuery} input
		 * @param {Event} event event which called this method ('input', 'paste', etc)
		 */
		process: function (input, event) {
			var tool = this;
			var $input = $(input);
			var inputVal = $input.val();
			var $form = $input.closest("form");
			var websitesPreview = this.state.websitesPreview;
			var processedURLs = this.state.processedURLs;
			var urls = inputVal.replace(/[!^*()]/g,' ').matchTypes('url', {requireScheme: false});
			var eventType = Q.getObject("type", event);

			Q.each(urls, function (i, url) {
				// if url already parsed   or  url not pasted and cursor at the end of url (means user not finished url typing)
				if (processedURLs[i] === url || (eventType === 'input' && event.target.selectionStart === (inputVal.lastIndexOf(url) + url.length))) {
					return;
				}

				var activePreview = tool.getActivePreview();

				// if processed url modified and active preview processed exactly this url
				if (processedURLs[i] && processedURLs[i] !== url) {
					var $element = websitesPreview[processedURLs[i]];

					// currently active preview url modified
					if ($element instanceof jQuery && $element.is(":visible")) {
						var activePreviewTool = tool.getToolFromElement(activePreview);

						if (activePreviewTool) {
							activePreviewTool.state.url = url;
							activePreviewTool.stateChanged('url');

							// replace url in processed urls object
							Object.defineProperty(websitesPreview, url, Object.getOwnPropertyDescriptor(websitesPreview, processedURLs[i]));
							delete websitesPreview[processedURLs[i]];
							processedURLs[i] = url;
						}
					}
				}

				// if we have already active preview - do nothing
				if (activePreview) {
					return;
				}


				Q.Template.render('Websites/webpage/chat', {
					src: Q.info.imgLoading
				}, function (err, html) {
					if (err) {
						return;
					}

					var $element = $(html).prependTo($form);
					websitesPreview[url] = $element;
					processedURLs[i] = url;

					var _close = function () {
						websitesPreview[tool.getActiveURL()] = null;
						tool.removePreview($element);
						tool.process(input);
					};

					$('a.Q_close', websitesPreview[url]).on(Q.Pointer.fastclick, _close);

					Q.req('Websites/scrape', ['result'], function (err, response) {
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg) {
							return _close();
						}

						var result = response.slots.result;
						var type = result.type;

						var streamType = type ? Q.Websites.getStreamType(type) : Q.Websites.getStreamType(url);

						$(".Websites_webpage_chat_preview", websitesPreview[url]).tool("Streams/preview", {
							publisherId: result.publisherId || Q.Users.loggedInUserId() || Q.Users.communityId,
							streamName: result.streamName,
							closeable: false,
							editable: false
						}).tool(streamType + "/preview", {
							url: url,
							publisherId: result.publisherId,
							streamName: result.streamName,
							siteData: result,
							editable: false,
							onError: _close
						}, Date.now()).activate(function () {
							var previewTool = this;
							var $te = $(previewTool.element);

							$te.outerWidth($form.innerWidth());

							$te.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
								window.open(url, '_blank');
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
		 *	Get valid preview tool (Q/audio, Q/video, Websites/webpage) from jquery or html element
		 * @method getToolFromElement
		 * @return {jQuery|HTMLElement} element
		 */
		getToolFromElement: function (element) {
			return Q.Tool.from(element, "Websites/webpage/preview") || Q.Tool.from(element, "Streams/audio/preview") || Q.Tool.from(element, "Streams/video/preview");
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
			if (!$chatMessageContent.length) {
				return;
			}

			var chatMessageContent = $chatMessageContent.html();
			Q.each(chatMessageContent.matchTypes('url'), function (i, url) {
				var href = url;
				if (href.indexOf('//') === -1) {
					href = '//' + href;
				}

				chatMessageContent = chatMessageContent.replace(url, "<a href='" + href + "' target='_blank'>" + url + "</a>");
			});
			$chatMessageContent.html(chatMessageContent, true);

			instructions = Q.getObject('Websites/webpages', JSON.parse(instructions || null));
			if (instructions) {
				var elementToAppend = state.appendTo === 'bubble' ? $(".Streams_chat_bubble", element) : element;
				var streamType = null;

				if (instructions.streamType) {
					streamType = instructions.streamType;
				} else if (instructions.streamName) {
					streamType = instructions.streamName.substr(0, instructions.streamName.lastIndexOf("/")) + '/preview';
				} else {
					streamType = Q.Websites.getStreamType(instructions.url) + '/preview';
				}

				instructions.editable = false;

				var streamsPreview = Q.Tool.setUpElementHTML('div', 'Streams/preview', {
					publisherId: instructions.publisherId || Q.Users.loggedInUserId(),
					streamName: instructions.streamName,
					closeable: false,
					editable: false
				});
				var specialPreview = Q.Tool.setUpElementHTML($(streamsPreview).addClass("Websites_webpage_chat_preview")[0], streamType, {
					publisherId: instructions.publisherId,
					streamName: instructions.streamName,
					streamRequired: true,
					url: instructions.url,
					editable: false
				});

				$(specialPreview).appendTo(elementToAppend);
			}

			// mark element as processed
			element.attr('data-webpageProcessed', 1);

			return element;
		},
		/**
		 * Return active preview tool
		 * @method getActivePreview
		 * @return {jQuery} Returns Websites/webpage/preview tool element
		 */
		getActivePreview: function () {
			var websitesPreview = this.state.websitesPreview;

			for (var url in websitesPreview) {
				if (websitesPreview[url]) {
					return $(".Streams_preview_tool", websitesPreview[url]);
				}
			}

			return null;
		},
		/**
		 * Return url from active preview tool
		 * @method getActiveURL
		 * @return {String}
		 */
		getActiveURL: function () {
			var websitesPreview = this.state.websitesPreview;

			for (var url in websitesPreview) {
				if (websitesPreview[url]) {
					return url;
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
		'	<div class="Websites_webpage_chat_preview"><img src="{{src}}"></div>' +
		'	<a class="Q_close"></a>' +
		'</div>'
	);
})(Q, Q.$, window);
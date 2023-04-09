(function (Q, $, window, undefined) {
	/**
	 * @class Websites/webpage/preview
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 *   @param {string} [options.publisherId] publisherId of Websites/webpage stream
	 *   @param {string} [options.streamName] name of Websites/webpage stream
	 *   @param {boolean} [options.streamRequired=false] If true and publisherId and streamName empty, send request to get or create stream.
	 *   @param {array} [options.editable=["title"]] Array of editable fields (by default only title). Can be ["title", "description"]
	 *   @param {string} [options.mode=document] This option regulates tool layout. Can be 'title' and 'document'.
	 *   @param {Q.Event} [options.onInvoke] fires when the user click on preview element
	 *   @param {boolean} [options.showDomainOnly=false] If true show domain:port if port != 80, else show full url
	 *   @param {boolean} [options.showDescription=false] If true show site description below title instead url
	 *   @param {object} [options.siteData] Site data
	 *   @param {Q.Event} [options.onRefresh] Event occurs when tool element has rendered with content
	 *   @param {string} [options.url] url for preview
	 *   @param {Q.Event} [onLoad] called when styles and texts loaded
	 */
	Q.Tool.define("Websites/webpage/preview", function (options) {
		var tool = this;
		var state = this.state;
		var preview = Q.Tool.from(this.element, "Streams/preview");
		var previewState = Q.getObject("state", preview);
		var $toolElement = $(tool.element);

		state.publisherId = state.publisherId || Q.getObject("state.publisherId", preview);
		state.streamName = state.streamName || Q.getObject("state.streamName", preview);

		$toolElement.attr('data-mode', this.state.mode);

		// if tool element empty, fill it with throbber
		if ($toolElement.is(':empty')) {
			$toolElement.append('<img src="' + Q.info.imgLoading + '">');
		}

		if (Q.getObject("creatable", previewState)) {
			if (previewState.creatable.clickable) {
				previewState.creatable.clickable.preventDefault = false;
			}

			if (state.url) {
				previewState.creatable.options = Q.extend({}, previewState.creatable.options, {
					skipComposer: true
				});
			}

			// rewrite Streams/preview composer
			previewState.creatable.preprocess = function (_proceed) {
				// if url specified, just call light refresh
				if (state.url) {
					tool.scrapeUrl({
						callback: tool.refreshLight
					});
					return ;
				}

				// when all components loaded, call composer
				state.onLoad.add(function () {
					tool.composer(_proceed);
				}, tool);

				return false;
			};
		}

		// wait when styles and texts loaded and then run refresh
		var pipe = Q.pipe(['styles', 'text'], function () {
			Q.handle(state.onLoad, tool);

			if (previewState) {
				previewState.onRefresh.add(tool.refresh.bind(tool));
			} else {
				tool.refresh();
			}
		});

		// loading styles
		Q.addStylesheet('{{Websites}}/css/tools/webpage/preview.css', pipe.fill('styles'));

		// loading text
		Q.Text.get('Websites/content', function (err, text) {
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				console.warn(msg);
			}

			tool.text = text;

			pipe.fill('text')();
		});

		tool.Q.onStateChanged('url').set(function () {
			$toolElement.html('<img src="' + Q.info.imgLoading + '">');
			tool.scrapeUrl({
				callback: tool.refresh
			});
		}, tool);
	},

	{
		publisherId: null,
		streamName: null,
		streamRequired: false,
		isComposer: true,
		editable: ['title'],
		mode: 'document',
		showDomainOnly: false,
		showDescription: false,
		hideIfNoParticipants: false,
		category: null,
		// light mode params
		siteData: {},
		url: null,
		onInvoke: new Q.Event(),
		onRefresh: new Q.Event(),
		onError: new Q.Event(),
		onLoad: new Q.Event()
	},

	{
		refresh: function () {
			var tool = this;
			var state = this.state;
			var $te = $(tool.element);

			// if url specified, just call refresh to build preview with scraped data
			if (!Q.isEmpty(state.siteData)) {
				return tool.refreshLight();
			} else if (state.url) {
				if (!state.streamRequired && !state.streamName) {
					return tool.scrapeUrl({
						callback: tool.refreshLight
					});
				} else if (state.streamRequired && !state.streamName) {
					return tool.scrapeUrl({
						callback: tool.refresh,
						streamRequired: true
					});
				}
			}

			var pipe = new Q.Pipe(['interest', 'webpage'], function (params) {
				var interestStream = params.interest[0];
				var webpageStream = params.webpage[0];
				state.url = webpageStream.getAttribute("url");

				if (state.hideIfNoParticipants
					&& webpageStream.fields.participatingCount === 0) {
					$te.addClass('Streams_chat_preview_noParticipants');
				} else {
					$te.removeClass('Streams_chat_preview_noParticipants');
				}

				var iconBig = webpageStream.getAttribute("image");
				if (!iconBig) {
					iconBig = webpageStream.fields.icon;
					if (!iconBig.match(/\.[a-z]{3,4}$/i)) {
						iconBig = webpageStream.iconUrl('50');
					}
				}

				var iconSmall = null;
				if (Q.Streams.isStream(interestStream)) {
					iconSmall = interestStream.fields.icon;
					if (!iconSmall.match(/\.[a-z]{3,4}$/i)) {
						iconSmall = interestStream.iconUrl(interestStream.getAttribute('iconSize') || 40);
					}
				}

				Q.Template.render('Websites/webpage/preview', {
					title: state.editable && state.editable.indexOf('title') >= 0
					? Q.Tool.setUpElementHTML('div', 'Streams/inplace', {
						publisherId: webpageStream.fields.publisherId,
						streamName: webpageStream.fields.name,
						field: 'title',
						inplaceType: 'text'
					}) : webpageStream.fields.title,
					description: state.editable && state.editable.indexOf('description') >= 0 ? Q.Tool.setUpElementHTML('div', 'Streams/inplace', {
						publisherId: webpageStream.fields.publisherId,
						streamName: webpageStream.fields.name,
						field: 'content',
						inplaceType: 'textarea'
					}) : webpageStream.fields.content,
					interest: {
						title: (Q.getObject(['fields', 'title'], interestStream) || '').replace('Websites:',''),
						icon: iconSmall,
					},
					src: iconBig,
					url: state.url,
					text: tool.text.webpage
				}, function (err, html) {

					Q.replace(tool.element, html);;

					var $a = tool.$('a');
					if ($a.length) {
						if (state.mode === 'title') {
							$te.on('click', function () {
								window.open($a.attr('href'), $a.attr('target'));
							});
						}
						$a.on('click', function (e) {
							e.preventDefault();
						});
					}

					Q.activate(tool.element, function () {
						Q.handle(state.onRefresh, tool);
					});

					if (state.mode === 'title') {
						return;
					}

					// set onInvoke handler
					$te.on(Q.Pointer.fastclick, function () {
						if ($te.closest('.Websites_webpage_composer_tool').length) {
							return;
						}
						Q.handle(state.onInvoke, tool);
					});

					// setup unseen element
					Q.Streams.Message.Total.setUpElement(
						$(".Streams_chat_unseen", $te)[0],
						webpageStream.fields.publisherId,
						webpageStream.fields.name,
						'Streams/chat/message',
						tool,
						{ unseenClass: 'Streams_preview_nonzero' }
					);

					// get participants and create Users/pale
					Q.Streams.Participant.get.force(
						webpageStream.fields.publisherId,
						webpageStream.fields.name,
						{
							limit: 3,
							offset: 0,
							state: 'participating'
						},
						function (err, participants) {
							var msg = Q.firstErrorMessage(err);
							if (msg) {
								console.warn("Websites/webpage/preview tool: " + msg);
								return;
							}

							var userIds = [];
							Q.each(participants, function (userId) {
								if (userId === Q.Users.loggedInUserId()) {
									return;
								}

								userIds.push(userId);
							});

							var $participantsElement = $(".streams_chat_participants", tool.element);
							if (userIds.length) {
								$participantsElement.tool("Users/pile", {
									avatar: {
										contents: false
									},
									userIds: userIds
								}).activate(function () {
									$te.attr('data-participants', 1);
								});
							} else {
								$participantsElement.remove();
							}
						}
					);
				});
			});

			Q.Streams.get(state.publisherId, state.streamName, function (err) {
				var msg = Q.firstErrorMessage(err);
				if (msg) {
					return Q.alert(msg);
				}

				pipe.fill('webpage')(this);

				var interest = JSON.parse(Q.getObject(["fields", "interest"], this) || null);
				var interestPublisherId = Q.getObject(["publisherId"], this.getAttribute('interest')) || Q.getObject(['publisherId'], interest);
				var interestStreamName = Q.getObject(["streamName"], this.getAttribute('interest')) || Q.getObject(['streamName'], interest);

				if (!interestPublisherId || !interestStreamName) {
					return pipe.fill('interest')(null);
				}

				// get interest stream
				Q.Streams.get(interestPublisherId, interestStreamName, function (err) {
					var msg = Q.firstErrorMessage(err);
					if (msg) {
						return Q.alert(msg);
					}

					pipe.fill('interest')(this);
				});
			});
		},
		/**
		 * Create preview tool using just state data
		 * @method refreshLight
		 */
		refreshLight: function () {
			var tool = this;
			var state = this.state;
			var siteData = state.siteData;

			if (!Q.getObject('interest.icon', siteData)) {
				Q.setObject('interest.icon', siteData.iconSmall, siteData);
			}

			if (state.showDomainOnly) {
				Q.setObject('interest.title', siteData.host + (siteData.port ? ':' + siteData.port : ''), siteData);
			} else {
				Q.setObject('interest.title', state.url, siteData);
			}

			Q.Template.render('Websites/webpage/preview', {
				title: siteData.title,
				description: siteData.description,
				keywords: siteData.keywords || '',
				interest: siteData.interest,
				src: siteData.iconBig,
				url: state.url,
				showDescription: state.showDescription
			}, function (err, html) {
				if (err) {
					return;
				}

				$(tool.element).html(html);

				Q.activate(tool.element, function () {
					Q.handle(state.onRefresh, tool);
				});
			});
		},
		/**
		 * Request Websites/scrape for site data
		 * @method scrapeUrl
		 * @param {object} params
		 * @param {string} [params.url] URL to scrape. By default state.url
		 * @param {boolean} [params.streamRequired=false] If true force to create stream (if not created yet)
		 * @param {function} [params.callback] Callback called when on response
		 */
		scrapeUrl: function (params) {
			var tool = this;
			var state = this.state;
			var siteData = this.state.siteData;
			var slots = ["result"];

			var callback = Q.getObject("callback", params);
			var streamRequired = !!Q.getObject("streamRequired", params);
			var url = Q.getObject("url", params) || state.url;

			if (streamRequired) {
				slots = slots.concat(["publisherId", "streamName"]);
			}

			Q.req("Websites/scrape", slots, function (err, response) {
				var msg = Q.firstErrorMessage(err, response && response.errors);
				if (msg) {
					Q.handle(state.onError, tool, [msg]);
					return console.warn(msg);
				}

				if (streamRequired) {
					state.publisherId = response.slots.publisherId;
					state.streamName = response.slots.streamName;
				}

				var result = response.slots.result;
				siteData.title = result.title;
				siteData.description = result.description;
				siteData.keywords = result.keywords;
				siteData.interest = result.interest;
				siteData.iconBig = result.iconBig;

				Q.handle(callback, tool, [result]);
			}, {
				method: "post",
				fields: {
					url: url
				}
			});
		},
		/**
		 * Start webpage composer dialog
		 * @method composer
		 */
		composer: function (callback) {
			var tool = this;
			var state = this.state;

			/**
			 * Process composer submitting
			 * @method _process
			 */
			var _process = function () {
				var _error = function (err) {
					state.mainDialog.removeClass('Q_uploading');
					Q.alert(err);
				};

				var clipTool = Q.Tool.from($(".Q_clip_tool", state.mainDialog), "Q/clip");
				var clipStart = clipTool ? clipTool.getPosition("start") : null;
				var clipEnd = clipTool ? clipTool.getPosition("end") : null;

				state.mainDialog.addClass('Q_uploading');

				// url defined
				var url = $("input[name=url]", state.mainDialog).val();
				if (!url) {
					return _error("Link not found");
				}

				tool.scrapeUrl({
					url: url,
					callback: function (result) {
						Q.Dialogs.pop();
						Q.handle(callback, tool, [{
							title: result.title,
							content: result.description,
							attributes: {
								url: url,
								iconBig: result.iconBig,
								host: result.host,
								port: result.port,
								lang: result.lang
							}
						}]);
					}
				});
			};

			// setting clip start position handler
			var _onStart = function (setNewPosition, toolPreview) {
				if (setNewPosition) {
					var position = toolPreview.state.currentPosition;

					toolPreview.state.clipStart = position;
					this.setPosition(position, position + '%', "start");
				} else {
					toolPreview.state.clipStart = null;
				}
				toolPreview.stateChanged('clipStart');
			};

			// setting clip end position handler
			var _onEnd = function (setNewPosition, toolPreview) {
				if (setNewPosition) {
					var contentHeight = ($(toolPreview.element).height() / toolPreview.state.stuffHeight * 100).toPrecision(3);
					var position = (parseFloat(toolPreview.state.currentPosition) + parseFloat(contentHeight)).toPrecision(3);

					toolPreview.state.clipEnd = position;
					this.setPosition(position, position + '%', "end");
				} else {
					toolPreview.state.clipEnd = null;
				}
				toolPreview.stateChanged('clipEnd');
			};

			Q.Dialogs.push({
				className: 'Websites_dialog_webpage',
				title: "Webpage",
				template: {
					name: 'Websites/webpage/preview/composer',
					fields: {
						isComposer: state.isComposer,
						text: tool.text.webpage.composer
					}
				},
				onActivate: function (mainDialog) {
					state.mainDialog = mainDialog;

					// if stream defined, render player
					if (tool.stream) {
						var $webpageElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=edit] .Websites_webpage_composer_preview", mainDialog);
						var $clipElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=edit] .Websites_webpage_composer_clip", mainDialog);
						var clipStart = tool.stream.getAttribute('clipStart');
						var clipEnd = tool.stream.getAttribute('clipEnd');

						$webpageElement.tool("Q/website", {
							clipStart: clipStart,
							clipEnd: clipEnd,
							url: tool.getAttribute("url")
						}).activate(function () {
							var toolPreview = this;

							$clipElement.tool("Q/clip", {
								startPosition: clipStart,
								startPositionDisplay: clipStart + '%',
								endPosition: clipEnd,
								endPositionDisplay: clipEnd + '%',
								onStart: function (setNewPosition) {
									Q.handle(_onStart, this, [setNewPosition, toolPreview]);
								},
								onEnd: function (setNewPosition) {
									Q.handle(_onEnd, this, [setNewPosition, toolPreview]);
								}
							}).activate(function () {
								toolPreview.clipTool = this;
							});
						});
					}

					// save by URL
					$("button[name=save]", mainDialog).on(Q.Pointer.click, function (e) {
						e.preventDefault();
						e.stopPropagation();

						mainDialog.addClass('Q_uploading');

						var _error = function (err) {
							mainDialog.removeClass('Q_uploading');
							Q.alert(err);
						};
						var action = mainDialog.attr("data-action");

						if (action === 'link') {
							var url = $("input[name=url]", mainDialog).val();
							if (!url.matchTypes('url').length) {
								return _error(tool.text.webpage.composer.invalidURL);
							}
						}

						Q.handle(_process, mainDialog);
					});

					// custom tabs implementation
					var _selectTab = function () {
						var $this = $(this);
						var action = $this.attr('data-name');

						mainDialog.attr("data-action", action);
						$this.addClass('Q_current').siblings().removeClass('Q_current');
						$(".Q_tabbing_container .Q_tabbing_item[data-content=" + action + "]", mainDialog).addClass('Q_current').siblings().removeClass('Q_current');
					};
					$(".Q_tabbing_tabs .Q_tabbing_tab", mainDialog).on(Q.Pointer.fastclick, _selectTab);

					// select first visible tab
					Q.handle(_selectTab, $(".Q_tabbing_tabs .Q_tabbing_tab:visible:first", mainDialog)[0]);

					// hide tabs if there is only one tab
					$(".Websites_webpage_composer", mainDialog).attr("data-tabs", $(".Q_tabbing_tabs .Q_tabbing_tab:visible", mainDialog).length);

					// Reset button
					$("button[name=reset]", mainDialog).on(Q.Pointer.click, function (e) {
						state.dataBlob = undefined;

						Q.each($(".Q_tabbing_container .Q_tabbing_item[data-content=link], .Q_tabbing_container .Q_tabbing_item[data-content=upload]", mainDialog), function (i, content) {
							var webpageTool = Q.Tool.from($(".Websites_webpage_composer_preview", content)[0], "Q/webpage");
							var clipTool = Q.Tool.from($(".Websites_webpage_composer_clip", content)[0], "Q/clip");

							if (webpageTool) {
								$("<div>").addClass('Websites_webpage_composer_preview').insertAfter(webpageTool.element);
								Q.Tool.remove(webpageTool.element, true, true);
							}

							if (clipTool) {
								Q.Tool.remove(clipTool.element, true);
								clipTool.element.innerHTML = '';
							}
						});
					});

					// set clip start/end for link
					$("button[name=setClip]", mainDialog).on(Q.Pointer.fastclick, function () {
						var $button = $(this);
						$button.addClass("Q_working");
						var $webpageElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=link] .Websites_webpage_composer_preview", mainDialog);
						var $clipElement = $(".Q_tabbing_container .Q_tabbing_item[data-content=link] .Websites_webpage_composer_clip", mainDialog);
						var url = $("input[name=url]", mainDialog).val();
						if (!url.matchTypes('url').length) {
							$button.removeClass("Q_working");
							return Q.alert(tool.text.webpage.composer.invalidURL);
						}

						Q.Tool.remove($webpageElement[0], true);
						Q.Tool.remove($clipElement[0], true);

						$webpageElement.empty();
						$clipElement.empty();

						Q.req("Websites/file", ["result"], function (err, response) {
							$button.removeClass("Q_working");

							var msg = Q.firstErrorMessage(err, response && response.errors);
							if (msg) {
								return console.warn(msg);
							}

							var result = response.slots.result;

							$webpageElement.tool("Q/webpage", {
								action: "implement",
								url: result.destinationUrl
							}).activate(function () {
								var toolPreview = this;
								$clipElement.tool("Q/clip", {
									onStart: function (setNewPosition) {
										Q.handle(_onStart, this, [setNewPosition, toolPreview]);
									},
									onEnd: function (setNewPosition) {
										Q.handle(_onEnd, this, [setNewPosition, toolPreview]);
									}
								}).activate(function () {
									toolPreview.clipTool = this;
								});
							});
						}, {
							method: "post",
							fields: {url: url}
						});
					});
				},
				beforeClose: function (mainDialog) {

				}
			});
		}
	});

	Q.Template.set('Websites/webpage/preview',
		'<img alt="icon" class="Streams_preview_icon" src="{{& src}}">' +
		'<div class="Streams_preview_contents">' +
		'	<h3 class="Streams_preview_title Streams_preview_view">{{& title}}</h3>' +
		//'	<div class="Streams_aspect_url">{{& url}}</div>' +
		'	<div class="Streams_aspect_description" data-show="{{showDescription}}">{{& description}}</div>' +
		'	<div class="Streams_aspect_interests" data-hide="{{showDescription}}"><img src="{{& interest.icon}}"><a href="{{& url}}" target="_blank">{{& interest.title}}</a></div>' +
		'	<div class="streams_chat_participants"></div>' +
		'	<div class="Streams_chat_unseen"></div>' +
		'</div>'
	);

	Q.Template.set('Websites/webpage/preview/composer',
		'<div class="Websites_webpage_composer" data-composer="{{isComposer}}"><form>'
		+ '  <div class="Q_tabbing_tabs">'
		+ '  	<div data-name="edit" class="Q_tabbing_tab">{{text.edit}}</div>'
		+ '  	<div data-name="link" class="Q_tabbing_tab">{{text.link}}</div>'
		+ '  </div>'
		+ '  <div class="Q_tabbing_container">'
		+ '	 	<div class="Q_tabbing_item" data-content="edit">'
		+ '			<div class="Websites_webpage_composer_preview"></div>'
		+ '			<div class="Websites_webpage_composer_clip"></div>'
		+ '  	</div>'
		+ '  	<div class="Q_tabbing_item" data-content="link">'
		+ '	   		<label>'
		+ '				<input name="url" enterkeyhint="go" placeholder="{{text.setUrl}}" type="url">'
		//+ '				<button name="setClip" type="button" class="Q_button">{{text.setClip}}</button>'
		+ '			</label>'
		+ '			<div class="Websites_webpage_composer_preview"></div>'
		+ '			<div class="Websites_webpage_composer_clip"></div>'
		+ '		</div>'
		+ '  </div>'
		+ '  <div class="Websites_webpage_composer_submit"><button name="save" class="Q_button" type="button">{{text.save}}</button><button name="reset" type="reset" class="Q_button">{{text.reset}}</button></div>'
		+ '</form></div>'
	);
})(Q, Q.$, window);
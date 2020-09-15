(function (Q, $, window, undefined) {
	/**
	 * @class Websites/webpage/preview
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 *   @param {string} [options.publisherId] publisherId of Websites/webpage stream
	 *   @param {string} [options.streamName] name of Websites/webpage stream
	 *   @param {array} [options.editable=["title"]] Array of editable fields (by default only title). Can be ["title", "description"]
	 *   @param {string} [options.mode=document] This option regulates tool layout. Can be 'title' and 'document'.
	 *   @param {Q.Event} [options.onInvoke] fires when the user click on preview element
	 *   @param {boolean} [options.showDomainOnly=false] If true show domain:port if port != 80, else show full url
	 *   @param {boolean} [options.showDescription=false] If true show site description below title instead url
	 *   @param {object} [options.siteData] Site data
	 *   @param {string} [options.url] url for preview
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

		// wait when styles and texts loaded and then run refresh
		var pipe = Q.pipe(['styles', 'text'], function () {
			if (state.publisherId && state.streamName) {
				if (previewState) {
					previewState.onRefresh.add(tool.refresh.bind(tool));
				} else {
					tool.refresh();
				}
			} else {
				tool.refreshLight();
			}
		});

		if (previewState) {
			if (state.url) {
				previewState.creatable.options = Q.extend({}, previewState.creatable.options, {
					skipComposer: true
				});
			}

			// rewrite Streams/preview composer
			previewState.creatable.preprocess = function (_proceed) {
				// if url specified, just call refresh to build preview with scraped data
				if (!Q.isEmpty(state.siteData)) {
					tool.refreshLight();
				} else if (state.url) {
					tool.scrapeUrl(tool.refreshLight);
				}

				return false;
			};
		}

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
			tool.scrapeUrl(tool.refreshLight);
		}, tool);
	},

	{
		publisherId: null,
		streamName: null,
		editable: ['title'],
		mode: 'document',
		onInvoke: new Q.Event(),
		onRender: new Q.Event(),
		onError: new Q.Event(),
		showDomainOnly: false,
		showDescription: false,
		hideIfNoParticipants: false,

		// light mode params
		siteData: {},
		url: null
	},

	{
		refresh: function () {
			var tool = this;
			var state = this.state;
			var $te = $(tool.element);

			if (state.url && !state.streamName) {
				return tool.refreshLight();
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
						icon: Q.Streams.isStream(interestStream) ? interestStream.iconUrl(interestStream.getAttribute('iconSize')) : null,
					},
					src: webpageStream.iconUrl('80'),
					url: state.url,
					text: tool.text.webpage
				}, function (err, html) {

					tool.element.innerHTML = html;

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
						Q.handle(state.onRender, tool);
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
						$(".streams_chat_unseen", $te)[0],
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
					Q.handle(tool.state.onRender, tool);
				});
			});
		},
		/**
		 * Request Websites/scrape for site data
		 * @method scrapeUrl
		 */
		scrapeUrl: function (callback) {
			var tool = this;
			var state = this.state;
			var siteData = this.state.siteData;

			Q.req("Websites/scrape", ["result"], function (err, response) {
				var msg = Q.firstErrorMessage(err, response && response.errors);
				if (msg) {
					Q.handle(state.onError, tool, [msg]);
					return console.warn(msg);
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
					url: state.url
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
		'	<div class="streams_chat_unseen"></div>' +
		'</div>'
	);
})(Q, Q.$, window);
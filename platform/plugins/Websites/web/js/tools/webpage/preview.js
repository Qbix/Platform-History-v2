(function (Q, $, window, undefined) {
	/**
	 * @class Websites/webpage/preview
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 *   @param {array} [options.editable=["title"]] Array of editable fields (by default only title). Can be ["title", "description"]
	 *   @param {string} [options.mode=document] This option regulates tool layout. Can be 'title' and 'document'.
	 *   @param {Q.Event} [options.onInvoke] fires when the user click on preview element
	 */
	Q.Tool.define("Websites/webpage/preview", "Streams/preview", function (options, preview) {
		var tool = this;
		tool.preview = preview;

		$(tool.element).attr('data-mode', this.state.mode);

		// wait when styles and texts loaded and then run refresh
		var pipe = Q.pipe(['styles', 'text'], function () {
			preview.state.onRefresh.add(tool.refresh.bind(tool));
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
	},

	{
		editable: ['title'],
		mode: 'document',
		onInvoke: new Q.Event(),
		hideIfNoParticipants: false
	},

	{
		refresh: function (stream) {
			var tool = this;
			var state = this.state;
			var $te = $(tool.element);

			if (state.hideIfNoParticipants
				&& stream.fields.participatingCount === 0) {
				$te.addClass('Streams_chat_preview_noParticipants');
			} else {
				$te.removeClass('Streams_chat_preview_noParticipants');
			}

			var pipe = new Q.Pipe(['interest', 'webpage'], function (params) {
				var interestStream = params.interest[0];
				var webpageStream = params.webpage[0];
				var url = webpageStream.getAttribute("url");

				Q.Template.render('Websites/webpage/preview', {
					title: $.inArray('title', state.editable) >= 0 ? Q.Tool.setUpElementHTML('div', 'Streams/inplace', {
						publisherId: webpageStream.fields.publisherId,
						streamName: webpageStream.fields.name,
						field: 'title',
						inplaceType: 'text'
					}) : webpageStream.fields.title,
					description: $.inArray('description', state.editable) >= 0 ? Q.Tool.setUpElementHTML('div', 'Streams/inplace', {
						publisherId: webpageStream.fields.publisherId,
						streamName: webpageStream.fields.name,
						field: 'content',
						inplaceType: 'textarea'
					}) : webpageStream.fields.content,
					interest: {
						title: Q.getObject(['fields', 'title'], interestStream).replace('Websites:',''),
						icon: interestStream.iconUrl(interestStream.getAttribute('iconSize')),
					},
					src: webpageStream.iconUrl('80'),
					url: url,
					text: tool.text.webpage
				}, function (err, html) {

					tool.element.innerHTML = html;

					Q.activate(tool);

					if ($te.find('a').length) {
						$te.plugin('Q/clickable').on('click', function () {
							if (state.mode === 'title') {
								var $a = $te.find('a');
								window.open($a.attr('href'), $a.attr('target'));
							}
						});
					}

					tool.$('a').on('click', function (e) {
						e.preventDefault();
					});

					if (state.mode === 'title') {
						return;
					}

					// set onInvoke handler
					$te.on(Q.Pointer.fastclick, function () {
						if ($te.closest('.Websites_webpage_composer_tool').length) {
							return;
						}
						Q.handle(state.onInvoke, tool, [tool.preview]);
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

			Q.Streams.get(stream.fields.publisherId, stream.fields.name, function (err) {
				var msg = Q.firstErrorMessage(err);
				if (msg) {
					return Q.alert(msg);
				}

				pipe.fill('webpage')(this);

				var interestPublisherId = Q.getObject(["publisherId"], this.getAttribute('interest'));
				var interestStreamName = Q.getObject(["streamName"], this.getAttribute('interest'));

				if (!interestPublisherId || !interestStreamName) {
					pipe.fill('interest')(null);
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
		}
	});

	Q.Template.set('Websites/webpage/preview',
		'<img alt="icon" class="Streams_preview_icon" src="{{& src}}">' +
		'<div class="Streams_preview_contents">' +
		'	<h3 class="Streams_preview_title Streams_preview_view">{{& title}}</h3>' +
		//'	<div class="Streams_aspect_url">{{& url}}</div>' +
		//'	<div class="Streams_aspect_description">{{& description}}</div>' +
		'	<div class="Streams_aspect_interests"><img src="{{& interest.icon}}"><a href="{{& url}}" target="_blank">{{& interest.title}}</a></div>' +
		'	<div class="streams_chat_participants"></div>' +
		'	<div class="streams_chat_unseen"></div>' +
		'</div>'
	);
})(Q, Q.$, window);
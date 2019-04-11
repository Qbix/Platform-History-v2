(function (Q, $, window, undefined) {
	/**
	 * This tool lets the user create new Websites/webpage stream
	 * @class Websites/webpage/preview
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 *   @param {string} [options.publisherId] Publisher id of stream
	 *   @param {string} [options.streamName] Stream name
	 *   @param {string} [options.editable=["title"]] Array of editable fields (by default only title). Can be ["title", "description"]
	 *   @param {Q.Event} [options.onCreate] fires when the tool successfully creates a new Websites/webpage stream
	 *   @param {Q.Event} [options.onInvoke] fires when the user click on "Start Conversation" button
	 */
	Q.Tool.define("Websites/webpage/preview", function (options) {
		var tool = this;

		// wait when styles and texts loaded and then run refresh
		var pipe = Q.pipe(['styles', 'text'], function () {
			tool.refresh();
		});

		// loading styles
		Q.addStylesheet('{{Websites}}/css/tools/WebpageComposer.css', pipe.fill('styles'));

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
		publisherId: null,
		streamName: null,
		editable: ["title"],
		onCreate: new Q.Event(),
		onInvoke: new Q.Event()
	},

	{
		refresh: function () {
			var tool = this;
			var state = tool.state;

			if (state.publisherId && state.streamName) {
				tool.preview();
			} else {
				tool.composer();
			}
		},
		composer: function () {
			var tool = this;
			var $te = $(tool.element);
			var state = this.state;

			Q.Template.render('Websites/webpage/composer', {
				text: tool.text.webpage
			}, function (err, html) {
				$te.html(html);
				var $url = tool.$('input').plugin('Q/placeholders');
				var $goButton = tool.$('button[name=go]');
				var $startButton = tool.$('button[name=startConversation]');
				var $message = tool.$('textarea[name=message]').plugin('Q/placeholders').plugin('Q/autogrow');

				$url.on('focus', function () { $(this).removeClass('Q_error'); });

				$startButton.on(Q.Pointer.fastclick, function () {
					$startButton.addClass('Q_working');
					Q.req("Websites/webpage", "start", function (err, response) {
						$startButton.removeClass('Q_working');
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg) {
							return Q.alert(msg);
						}

						Q.handle(state.onInvoke, tool);
					}, {
						fields: {
							publisherId: state.publisherId,
							streamName: state.streamName,
							message: $message.val()
						}
					});

				});

				$goButton.on(Q.Pointer.fastclick, function () {
					var url = $url.val();

					if (!/^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url)) {
						$url.addClass('Q_error');

						return false;
					}

					// start url parsing
					$message.removeClass("Q_disabled").plugin('Q/clickfocus');
					$te.addClass('Websites_webpage_loading');

					Q.req('Websites/scrape', ['publisherId', 'streamName', 'result'], function (err, response) {
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg) {
							$te.removeClass('Websites_webpage_loading');
							$message.addClass('Q_disabled');
							return Q.alert(msg);
						}

						Q.Streams.get(response.slots.publisherId, response.slots.streamName, function (err) {
							$te.removeClass('Websites_webpage_loading');

							var msg = Q.firstErrorMessage(err);
							if (msg) {
								$message.addClass('Q_disabled');
								return Q.alert(msg);
							}

							$startButton.removeClass('Q_disabled');

							state.publisherId = this.fields.publisherId;
							state.streamName = this.fields.name;

							tool.preview();

							Q.handle(state.onCreate, tool, [this]);
						});
					}, {
						method: 'post',
						fields: {
							url: url
						}
					});
				});
			});
		},
		preview: function () {
			var tool = this;
			var state = this.state;

			// check if Streams/preview tool applied
			/*if (!Q.Tool.from(tool.element, 'Streams/preview')) {
				return $(tool.element).tool('Streams/preview', {
					'publisherId': state.publisherId,
					'streamName': state.streamName,
					'closeable': false,
					'editable': false
				}).activate(function () {
					tool.preview();
				});
			}*/

			var pipe = new Q.Pipe(['interest', 'webpage'], function (params) {
				var interestStream = params.interest[0];
				var webpageStream = params.webpage[0];
				var url = webpageStream.getAttribute("url");

				Q.Template.render('Websites/webpage/preview', {
					title: $.inArray('title', state.editable) >= 0 ? Q.Tool.setUpElementHTML('div', 'Streams/inplace', {
						publisherId: state.publisherId,
						streamName: state.streamName,
						field: 'title',
						inplaceType: 'text'
					}) : webpageStream.fields.title,
					description: $.inArray('description', state.editable) >= 0 ? Q.Tool.setUpElementHTML('div', 'Streams/inplace', {
						publisherId: state.publisherId,
						streamName: state.streamName,
						field: 'content',
						inplaceType: 'textarea'
					}) : webpageStream.fields.content,
					interest: {
						title: Q.getObject(['fields', 'title'], interestStream).replace('Websites:',''),
						icon: interestStream.iconUrl(interestStream.getAttribute('iconSize')),
					},
					src: webpageStream.iconUrl('80'),
					url: '<a href="' + url + '" target="_blank">' + url + '</a>',
					text: tool.text.webpage
				}, function (err, html) {
					var $composer = tool.$(".Websites_webpage_composer");

					if ($composer.length) {
						$composer.html(html);
					} else {
						tool.element.innerHTML = html;
					}

					Q.activate(tool);
				});
			});

			Q.Streams.get(state.publisherId, state.streamName, function (err) {
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

	Q.Template.set('Websites/webpage/composer',
		'<div class="Websites_webpage_composer"><input name="url" autocomplete="off" placeholder="{{text.composer.PasteLinkHere}}"> <button name="go" class="Q_button">{{text.composer.Go}}</button></div>' +
		'<textarea name="message" class="Q_disabled" placeholder="{{text.composer.WriteToStartConversation}}"></textarea>' +
		'<button name="startConversation" class="Q_button Q_disabled">{{text.composer.StartConversation}}</button>'
	);
	Q.Template.set('Websites/webpage/preview',
		'<img alt="icon" class="Streams_preview_icon" src="{{& src}}">' +
		'<div class="Streams_preview_contents">' +
		'	<h3 class="Streams_preview_title Streams_preview_view">{{& title}}</h3>' +
		'	<div class="Streams_aspect_url">{{& url}}</div>' +
		'	<div class="Streams_aspect_description">{{& description}}</div>' +
		'	<div class="Streams_aspect_interests"><img src="{{& interest.icon}}">{{& interest.title}}</div>' +
		'</div>'
	);
})(Q, Q.$, window);
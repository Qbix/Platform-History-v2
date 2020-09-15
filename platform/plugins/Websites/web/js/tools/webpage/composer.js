(function (Q, $, window, undefined) {
	/**
	 * This tool lets the user create new Websites/webpage stream
	 * @class Websites/webpage/composer
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 * @param {Object} [options.categoryStream] Object with publisherId, streamName, relationType of stream where to need to
	 * relate new Websites/webpage stream.
	 * @param {Object} [options.relationType] Type of relation to category stream.
	 * @param {Q.Event} [options.onScrape] fires when the tool successfully scrapes a webpage
	 * @param {Q.Event} [options.onCreate] fires when the Websites/webpage stream successfully created
	 */
	Q.Tool.define("Websites/webpage/composer", function (options) {
		var tool = this;

		// wait when styles and texts loaded and then run refresh
		var pipe = Q.pipe(['styles', 'text'], function () {
			tool.refresh();
		});

		// loading styles
		Q.addStylesheet([
			'{{Websites}}/css/tools/webpage/composer.css',
			'{{Websites}}/css/tools/webpage/preview.css'
		], pipe.fill('styles'));

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
		categoryStream: {
			publisherId: Q.Users.communityId,
			streamName: 'Streams/chats/main',
			relationType: 'Websites/webpage'
		},
		onScrape: new Q.Event(),
		onCreate: new Q.Event()
	},

	{
		refresh: function (stream) {
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

				// browse button only for cordova
				if (Q.info.isCordova) {
					var $browse = tool.$('.Websites_webpage_composer_input a');
					$url.on('change keyup keydown input paste', function () {
						setTimeout(function () {
							if (tool.validUrl($url.val())) {
								$browse.show();
								$url.removeClass('Q_error');
							} else {
								$browse.hide();
							}
						}, 100);
					});
					$browse.on(Q.Pointer.fastclick, function () {
						Q.Cordova.chooseLink($url.val(), false, function (selectedUrl) {
							$url.val(selectedUrl);
						}, null, function () {
							$url.focus();
							console.warn("Error: ", arguments);
						});
					});
				}

				$startButton.on(Q.Pointer.fastclick, function () {
					$startButton.addClass('Q_working');

					tool.createStream(function () {
						$startButton.removeClass('Q_working');
					});
				});

				$url.on('keydown', function (e) {
					if (e.keyCode === 13) {
						_scrape();
					}
				});
				$goButton.on(Q.Pointer.fastclick, _scrape);
				
				function _scrape() {
					var url = $url.val();

					if (!tool.validUrl(url)) {
						$url.addClass('Q_error');
						return false;
					}

					// start url parsing
					$message.removeClass("Q_disabled").plugin('Q/clickfocus');
					$te.addClass('Websites_webpage_loading');

					Q.req('Websites/scrape', ['result'], function (err, response) {
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg) {
							$te.removeClass('Websites_webpage_loading');
							$message.addClass('Q_disabled');
							return Q.alert(msg);
						}

						var siteData = response.slots.result;

						$te.removeClass('Websites_webpage_loading');

						if (siteData.alreadyExist) {
							$message.hide();
							$message.closest(".Q_autogrow_container").hide();
							$startButton.html(tool.text.webpage.composer.GotoConversation);
						}

						tool.$(".Websites_webpage_composer").tool("Websites/webpage/preview", {
							title: siteData.title,
							description: siteData.description,
							keywords: siteData.keywords || '',
							interest: {
								title: ' ' + siteData.host,
								icon: siteData.iconSmall,
							},
							src: siteData.iconBig,
							url: url
						}, Date.now()).activate(function () {
							$startButton.removeClass('Q_disabled');

							// save url in state to use later
							state.url = url;
						});

						Q.handle(state.onScrape, tool);
					}, {
						method: 'post',
						fields: {
							url: url
						}
					});
				}
			});
		},
		/**
		 * Create stream and relate to category
		 * @method createStream
		 * @param {function} callback
		 */
		createStream: function (callback) {
			var tool = this;
			var state = this.state;
			var $message = tool.$('textarea[name=message]');

			Q.req("Websites/webpage", ["publisherId", "streamName"], function (err, response) {
				var msg = Q.firstErrorMessage(err, response && response.errors);
				if (msg) {
					return Q.alert(msg);
				}

				state.publisherId = response.slots.publisherId;
				state.streamName = response.slots.streamName;

				Q.handle(state.onCreate, tool);
				Q.handle(callback);
			}, {
				method: 'post',
				fields: {
					action: 'start',
					url: state.url,
					categoryStream: state.categoryStream,
					message: $message.val()
				}
			});
		},
		/**
		 * Check whether string is valid URL
		 * @method validUrl
		 * @param {string} url
		 * @return bool
		 */
		validUrl: function (url) {
			return url.matchTypes('url', {requireScheme: false}).length;
		}
	});

	Q.Template.set('Websites/webpage/composer',
		'<div class="Websites_webpage_composer">' +
		'	<div class="Websites_webpage_composer_input">' +
		'		<input name="url" autocomplete="off" placeholder="{{text.composer.PasteLinkHere}}">' +
		'		<a><span>{{text.composer.BrowseTheWeb}}</span></a>' +
		'	</div>' +
		'	<button name="go" class="Q_button">{{text.composer.Go}}</button>' +
		'</div>' +
		'<textarea name="message" class="Q_disabled" placeholder="{{text.composer.WriteToStartConversation}}"></textarea>' +
		'<button name="startConversation" class="Q_button Q_disabled">{{text.composer.StartConversation}}</button>'
	);
})(Q, Q.$, window);
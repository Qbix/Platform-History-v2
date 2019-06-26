(function (Q, $, window, undefined) {
	/**
	 * This tool lets the user create new Websites/webpage stream
	 * @class Websites/webpage/composer
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 *   @param {Q.Event} [options.onScrape] fires when the tool successfully scrapes a webpage
	 *   @param {Q.Event} [options.onCreate] fires when the Websites/webpage stream successfully created
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
				var $browse = tool.$('.Websites_webpage_composer_input a');
				var $goButton = tool.$('button[name=go]');
				var $startButton = tool.$('button[name=startConversation]');
				var $message = tool.$('textarea[name=message]').plugin('Q/placeholders').plugin('Q/autogrow');

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
					var url = $url.val();

					if (Q.info.isCordova) {
						cordova.plugins.browsertab.openUrl(url);
					} else {
						window.open(url, '_blank');
					}
				});

				$startButton.on(Q.Pointer.fastclick, function () {
					$startButton.addClass('Q_working');
					Q.req("Websites/webpage", "start", function (err, response) {
						$startButton.removeClass('Q_working');
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg) {
							return Q.alert(msg);
						}

						var slot = response.slots.start;
						state.publisherId = slot.publisherId;
						state.streamName = slot.streamName;

						Q.handle(state.onCreate, tool);
					}, {
						fields: {
							data: state.siteData,
							message: $message.val()
						}
					});

				});

				$goButton.on(Q.Pointer.fastclick, function () {
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

						state.siteData = response.slots.result;

						$te.removeClass('Websites_webpage_loading');

						Q.Template.render('Websites/webpage/composer/preview', {
							title: state.siteData.title,
							description: state.siteData.description,
							keywords: state.siteData.keywords || '',
							interest: {
								title: ' ' + state.siteData.host,
								icon: state.siteData.smallIcon,
							},
							src: state.siteData.bigIcon,
							url: state.siteData.url,
							text: tool.text.webpage
						}, function (err, html) {
							tool.$(".Websites_webpage_composer").html(html);
						});

						$startButton.removeClass('Q_disabled');

						Q.handle(state.onScrape, tool, [this]);
					}, {
						method: 'post',
						fields: {
							url: url
						}
					});
				});
			});
		},
		/**
		 * Check whether string is valid URL
		 * @method validUrl
		 * @param {string} url
		 * @return bool
		 */
		validUrl: function (url) {
			return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url);
		}
	});

	Q.Template.set('Websites/webpage/composer',
		'<div class="Websites_webpage_composer Websites_webpage_preview_tool" data-type="document">' +
		'	<div class="Websites_webpage_composer_input">' +
		'		<input name="url" autocomplete="off" placeholder="{{text.composer.PasteLinkHere}}">' +
		'		<a><span>{{text.composer.BrowseTheWeb}}</span></a>' +
		'	</div>' +
		'	<button name="go" class="Q_button">{{text.composer.Go}}</button>' +
		'</div>' +
		'<textarea name="message" class="Q_disabled" placeholder="{{text.composer.WriteToStartConversation}}"></textarea>' +
		'<button name="startConversation" class="Q_button Q_disabled">{{text.composer.StartConversation}}</button>'
	);

	Q.Template.set('Websites/webpage/composer/preview',
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
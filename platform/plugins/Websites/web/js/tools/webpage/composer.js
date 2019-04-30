(function (Q, $, window, undefined) {
	/**
	 * This tool lets the user create new Websites/webpage stream
	 * @class Websites/webpage/composer
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 *   @param {Q.Event} [options.onCreate] fires when the tool successfully creates a new Websites/webpage stream
	 *   @param {Q.Event} [options.onStart] fires when the user click on "Start Conversation" button
	 */
	Q.Tool.define("Websites/webpage/composer", function (options) {
		var tool = this;

		// wait when styles and texts loaded and then run refresh
		var pipe = Q.pipe(['styles', 'text'], function () {
			tool.refresh();
		});

		// loading styles
		Q.addStylesheet('{{Websites}}/css/tools/webpage/composer.css', pipe.fill('styles'));

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
		onCreate: new Q.Event(),
		onStart: new Q.Event()
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

				$url.on('focus', function () { $(this).removeClass('Q_error'); });

				$startButton.on(Q.Pointer.fastclick, function () {
					$startButton.addClass('Q_working');
					Q.req("Websites/webpage", "start", function (err, response) {
						$startButton.removeClass('Q_working');
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg) {
							return Q.alert(msg);
						}

						Q.handle(state.onStart, tool);
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

							state.publisherId = this.fields.publisherId;
							state.streamName = this.fields.name;

							tool.$(".Websites_webpage_composer").tool('Streams/preview', {
								'publisherId': state.publisherId,
								'streamName': state.streamName,
								'closeable': false,
								'editable': false
							}).tool('Websites/webpage/preview').activate();

							$startButton.removeClass('Q_disabled');

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
		}
	});

	Q.Template.set('Websites/webpage/composer',
		'<div class="Websites_webpage_composer"><input name="url" autocomplete="off" placeholder="{{text.composer.PasteLinkHere}}"> <button name="go" class="Q_button">{{text.composer.Go}}</button></div>' +
		'<textarea name="message" class="Q_disabled" placeholder="{{text.composer.WriteToStartConversation}}"></textarea>' +
		'<button name="startConversation" class="Q_button Q_disabled">{{text.composer.StartConversation}}</button>'
	);
})(Q, Q.$, window);
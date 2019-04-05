(function (Q, $, window, undefined) {
	/**
	 * This tool lets the user create new Websites/webpage stream
	 * @class Websites/webpage/preview
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 *   @param {string} [options.publisherId] Publisher id of stream
	 *   @param {string} [options.streamName] Stream name
	 *   @param {Q.Event} [options.onCreate] fires when the tool successfully creates a new Websites/webpage stream
	 *   @param {Q.Event} [options.onInvoke] fires when the user click on preview tool element
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
			var state = this.state;

			Q.Template.render('Websites/webpage/composer', {
				text: tool.text.webpage
			}, function (err, html) {
				tool.element.innerHTML = html;

				var $url = tool.$('input').plugin('Q/placeholders');
				var $button = tool.$('button[name=go]');

				$url.on('focus', function () { $(this).removeClass('Q_error'); });

				$button.on(Q.Pointer.fastclick, function () {
					var url = $url.val();

					if (!/^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url)) {
						$url.addClass('Q_error');

						return false;
					}

					$button.addClass('Q_working');
					Q.req('Websites/scrape', ['publisherId', 'streamName', 'result'], function (err, response) {
						var msg = Q.firstErrorMessage(err, response && response.errors);
						if (msg) {
							$button.removeClass('Q_working');
							return Q.alert(msg);
						}

						Q.Streams.get(response.slots.publisherId, response.slots.streamName, function (err) {
							$button.removeClass('Q_working');

							var msg = Q.firstErrorMessage(err);
							if (msg) {
								return Q.alert(msg);
							}

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

			Q.Streams.get(state.publisherId, state.streamName, function (err) {
				var msg = Q.firstErrorMessage(err);
				if (msg) {
					return Q.alert(msg);
				}

				var stream = this;
				var url = stream.getAttribute("url");

				Q.Template.render('Websites/webpage/preview', {
					title: Q.Tool.setUpElementHTML('div', 'Streams/inplace', {
						publisherId: state.publisherId,
						streamName: state.streamName,
						field: 'title',
						inplaceType: 'text'
					}),
					description: Q.Tool.setUpElementHTML('div', 'Streams/inplace', {
						publisherId: state.publisherId,
						streamName: state.streamName,
						field: 'content',
						inplaceType: 'textarea'
					}),
					interest: Q.getObject('title', stream.getAttribute("interestTitle")),
					src: stream.iconUrl('80'),
					url: '<a href="' + url + '" target="_blank">' + url + '</a>',
					text: tool.text.webpage
				}, function (err, html) {
					tool.element.innerHTML = html;

					Q.activate(tool);

					$(tool.element).on(Q.Pointer.fastclick, function () {
						Q.handle(state.onInvoke, tool, [stream]);
					});
				});
			});
		}
	});

	Q.Template.set('Websites/webpage/composer', '<input name="url" placeholder="{{text.composer.PasteLinkHere}}"> <button name="go" class="Q_button">{{text.composer.Go}}</button>');
	Q.Template.set('Websites/webpage/preview',
		'<img alt="icon" class="Streams_preview_icon" src="{{& src}}">' +
		'<div class="Streams_preview_contents">' +
		'	<h3 class="Streams_preview_title Streams_preview_view">{{& title}}</h3>' +
		'	<div class="Streams_aspect_url">{{& url}}</div>' +
		'	<div class="Streams_aspect_description">{{& description}}</div>' +
		'	<div class="Streams_aspect_interests">{{& interest}}</div>' +
		'</div>'
	);
})(Q, Q.$, window);
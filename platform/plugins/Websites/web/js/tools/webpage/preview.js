(function (Q, $, window, undefined) {
	/**
	 * @class Websites/webpage/preview
	 * @constructor
	 * @param {Object} [options] this is an object that contains parameters for this function
	 *   @param {string} [options.editable=["title"]] Array of editable fields (by default only title). Can be ["title", "description"]
	 *   @param {Q.Event} [options.onInvoke] fires when the user click on preview element
	 */
	Q.Tool.define("Websites/webpage/preview", "Streams/preview", function (options, preview) {
		var tool = this;
		tool.preview = preview;

		// wait when styles and texts loaded and then run refresh
		var pipe = Q.pipe(['styles', 'text'], function () {
			preview.state.onRefresh.add(tool.refresh.bind(tool));
		});

		// loading styles
		Q.addStylesheet('{{Websites}}/css/tools/WebpagePreview.css', pipe.fill('styles'));

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
		editable: ["title"],
		onInvoke: new Q.Event()
	},

	{
		refresh: function (stream) {
			var tool = this;
			var state = this.state;

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
					url: '<a href="' + url + '" target="_blank">' + url + '</a>',
					text: tool.text.webpage
				}, function (err, html) {

					tool.element.innerHTML = html;

					Q.activate(tool);

					// set onInvoke handler
					$(tool.element).on(Q.Pointer.fastclick, function () {
						Q.handle(state.onInvoke, tool, [tool.oPreview]);
					});
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
		'	<div class="Streams_aspect_url">{{& url}}</div>' +
		'	<div class="Streams_aspect_description">{{& description}}</div>' +
		'	<div class="Streams_aspect_interests"><img src="{{& interest.icon}}">{{& interest.title}}</div>' +
		'</div>'
	);
})(Q, Q.$, window);
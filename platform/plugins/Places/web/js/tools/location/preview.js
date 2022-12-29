(function (Q, $, window, undefined) {

	/**
	 * @module Places-tools
	 */

	/**
	 * @class Places location preview
	 * @constructor
	 * @param {Object} [options] this object contains function parameters
	 */
	Q.Tool.define("Places/location/preview", "Streams/preview", function (options, preview) {
		this.preview = preview;
		preview.state.onRefresh.add(this.refresh.bind(this));

		Q.addStylesheet('{{Places}}/css/PlacesLocationPreview.css', { slotName: 'Places' });
	},
	{

	},
	{
		refresh: function (stream, onLoad) {
			var tool = this;

			Q.Template.render('Places/location/preview', {
				title: stream.fields.title,
				icon: Q.url('{{Places}}/img/icons/location/40.png'),
				address: stream.getAttribute('address')
			}, function (err, html) {
				if (err) return;

				Q.replace(tool.element, html);;
			});
		}
	});

	Q.Template.set('Places/location/preview',
		'<div class="Places_location_preview Q_clearfix">'
		+ '<img src="{{icon}}" alt="icon" class="Places_location_preview_icon">'
		+ '<div class="Places_location_preview_contents">'
		+ '<h3>{{title}}</h3>'
		+ '<div class="Places_location_preview_address">{{address}}</div>'
		+ '</div></div>'
	);
})(Q, Q.$, window);
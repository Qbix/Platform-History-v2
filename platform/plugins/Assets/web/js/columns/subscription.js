"use strict";
(function(Q, $, undefined) {
Q.exports(function (options, index, column, data) {
	Q.addStylesheet('{{Assets}}/css/columns/subscription.css', { slotName: 'Assets' });

	Q.Text.get('Assets/content', function (err, text) {
		var relatedTool = Q.Tool.byId("Streams_related-assets_subscription");

	});
});
})(Q, jQuery);
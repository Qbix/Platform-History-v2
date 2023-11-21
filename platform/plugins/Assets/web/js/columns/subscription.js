"use strict";
(function(Q, $, undefined) {
Q.exports(function (options, index, column, data) {
	var $titleContainer = $('.Q_columns_title_container', column);

	Q.addStylesheet('{{Assets}}/css/columns/subscription.css', { slotName: 'Assets' });

	Q.Text.get('Assets/content', function (err, text) {
		// apply FaceBook column style
		if (Q.getObject('Communities.layout.columns.style', Q) === 'facebook') {
			$(column).addClass("Communities_column_facebook");
			var icons = [];
			var $relatedTool = $(".Assets_subscription_tool", column);
			if (!$relatedTool.length) {
				return;
			}

			$relatedTool[0].forEachTool("Streams/related", function () {
				var relatedTool = this;
				Q.Streams.get(relatedTool.state.publisherId, relatedTool.state.streamName, function (err) {
					if (err) {
						return;
					}

					if (!this.testWriteLevel(23)) {
						return;
					}

					icons.unshift($("<i class='qp-communities-plus'></i>").on(Q.Pointer.fastclick, function () {
						var $this = $(this);
						var composer = Q.Tool.from($(".Assets_plan_preview_tool.Streams_preview.Streams_preview_composer", column)[0], "Assets/plan/preview");
						if (composer) {
							Q.handle(composer.preview.create, composer.preview);
						}
					}));
					$titleContainer.tool('Communities/columnFBStyle', {
						icons: icons,
					}, 'Events_column').activate();
				});
			}, true);
		}
	});
});
})(Q, jQuery);
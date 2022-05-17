"use strict";
(function(Q, $, undefined) {
	
Q.exports(function (options, index, column, data) {
	Q.addStylesheet('{{Assets}}/css/columns/NFT.css');

	column.forEachTool("Assets/NFT/preview", function () {
		var NFTpreview = this;
		var previewState = NFTpreview.preview.state;
		var $previewIcon = $(".NFT_preview_icon", this.element);
		this.state.onInvoke.set(function (publisherId, streamName) {
			var stream = this.stream;
			var iconEditable = previewState.editable === true && stream.testWriteLevel('edit');
			if (iconEditable) {
				return;
			}
			Q.Dialogs.push({
				title: "Full size",
				className: "NFT_fullsize_icon_dialog",
				content: "<img class='NFT_fullsize_icon' src='" + stream.iconUrl("x") + "'>",
				onActivate: function (dialog) {
					$(".NFT_fullsize_icon", dialog).load(function () {
						var $img = $(this);
						var width = $img.width();
						var image = new Image();
						image.src = $img.prop("src");
						image.onload = function() {
							$img.plugin("Q/viewport", {
								initial: {scale: 1},
								maxScale: image.naturalWidth/width
							});
						}
					});
				}
			});
		}, true);
	});
});

})(Q, jQuery);
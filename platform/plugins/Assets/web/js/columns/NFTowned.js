"use strict";
(function(Q, $, undefined) {
	
Q.exports(function (options, index, column, data) {
	var $profileColumn = $(".Assets_NFTowned_column", column);
	if (!$profileColumn.length) {
		return;
	}

	Q.addStylesheet('{{Assets}}/css/columns/NFTowned.css', {slotName: 'Assets'});

	$profileColumn[0].forEachTool("Assets/NFT/preview", function () {
		this.state.onInvoke.set(function (publisherId, streamName) {
			var stream = this.stream;
			var $toolElement = $(this.element);
			var lastPart = streamName.split("/").pop();
			var columns = Q.Tool.byId("Q_columns-Communities") || Q.Tool.from($toolElement.closest(".Q_tool.Q_columns_tool"), "Q/columns");
			if (!columns) {
				return;
			}

			var index = $toolElement.closest('.Q_columns_column').data('index') || 0;
			var options = {
				title: stream.fields.title,
				name: 'NFT',
				url: Q.url("Assets/NFT/" + publisherId + "/" + lastPart),
				columnClass: 'Assets_column_NFT'
			};
			if (index !== null) {
				columns.open(options, index + 1);
			} else {
				columns.push(options);
			}
			Q.addStylesheet('{{Assets}}/css/columns/NFT.css', { slotName: 'Assets' });
		}, true);
	});

	$(".Q_column_slot", column).plugin("Q/scrollbarsAutoHide", {vertical: true, horizontal: true});
});

})(Q, jQuery);
"use strict";
(function(Q, $, undefined) {
	
Q.exports(function (options, index, column, data) {
	var $profileColumn = $(".Assets_NFTprofile_column", column);
	if (!$profileColumn.length) {
		return;
	}

	Q.addStylesheet('{{Assets}}/css/columns/NFTprofile.css');

	Q.Text.get('Assets/content', function (err, content) {
		$(".Assets_NFTprofile_logout").on(Q.Pointer.fastclick, function () {
			Q.confirm(content.NFT.profile.SureLogOut, function(result) {
				if (!result) {
					return;
				}

				Q.Users.logout({
					using: 'web3',
					onSuccess: function () {
						window.location.href = Q.info.baseUrl;
					}
				});
			});
			return false;
		});
	});

	Q.Users.Interface.coverPhoto(
		$("button[name=coverPhoto]")[0],
		$(".banner-block")[0]
	);
	$("button[name=coverPhoto]").show();

	var $bannerBlock = $(".banner-block", $profileColumn);
	var _setCover = function (stream) {
		var seriesPreviewTool = this;
		if (!$(seriesPreviewTool.element).hasClass("Q_selected")) {
			return;
		}

		$bannerBlock.css("background-image", "url(" + stream.iconUrl("x") + ")");
	};
	$profileColumn[0].forEachTool("Assets/NFT/series", function () {
		this.state.onSelected.set(_setCover, true);
	});
	$profileColumn[0].forEachTool("Assets/NFT/series/preview", function () {
		this.state.onIconChanged.set(_setCover, true);
		this.state.onClose.set(function () {
			if ($(this.element).hasClass("Q_selected")) {
				$bannerBlock.css("background-image", "none");
			}
		}, true);
	});
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
"use strict";
(function(Q, $, undefined) {
Q.exports(function (options, index, column, data) {
	var $columnSlot = $(".Q_column_slot", column);
	if (!$columnSlot.length) {
		return;
	}

	Q.addStylesheet('{{Assets}}/css/columns/NFTowned.css', {slotName: 'Assets'});

	$columnSlot[0].forEachTool("Assets/NFT/preview", function () {
		this.state.onInvoke.set(function (metadata, authorAddress, ownerAddress, commissionInfo, saleInfo, authorUserId) {
			var $toolElement = $(this.element);
			var columns = Q.Tool.byId("Q_columns-Communities") || Q.Tool.from($toolElement.closest(".Q_tool.Q_columns_tool"), "Q/columns");
			if (!columns) {
				return;
			}

			var index = $toolElement.closest('.Q_columns_column').data('index') || 0;
			var options = {
				title: metadata.name,
				//name: 'NFT',
				template: "Assets/NFT/owned/NFT",
				fields: {
					metadata: metadata,
					authorAddress: authorAddress
				},
				columnClass: 'Assets_column_NFT',
				afterDelay: function (options, index, column, data) {
					$(".Assets_NFT_preview", column).tool("Assets/NFT/preview", {
						metadata: metadata
					}).activate();

					var $table = $("table.assetsNFTAttributes", column);
					Q.each(metadata.attributes, function (i, attribute) {
						$table.append('<tr><td>' + attribute["trait_type"] + ':</td><td>' + attribute["value"] + '</td></tr>');
					});
				}
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

Q.Template.set('Assets/NFT/owned/NFT',`
<div class="Assets_NFT_preview"></div>
{{#if authorAddress}}
<div class="Assets_NFT_section" data-type="author">
    <div class="Assets_info_icon"><i class="qp-communities-owner"></i></div>
    <div class="Assets_info_content">{{authorAddress}}</div>
</div>
{{/if}}
{{#if metadata.attributes}}
<div class="Assets_NFT_section" data-type="attributes">
    <div class="Assets_info_icon"><i class="qp-communities-clipboard"></i></div>
    <div class="Assets_info_content">
        <table class="assetsNFTAttributes"></table>
    </div>
</div>
{{/if}}
`, {text: ['Assets/content']});
})(Q, jQuery);
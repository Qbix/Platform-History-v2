"use strict";
(function(Q, $, undefined) {
Q.exports(function (options, index, column, data) {
	Q.addStylesheet('{{Assets}}/css/columns/NFT.css', { slotName: 'Assets' });

	var $column = $(column);
	var publisherId = $("input[name=publisherId]", column).val();
	var streamName = $("input[name=streamName]", column).val();
	var $titleSlot = $(".Q_title_slot", column);

	$titleSlot.empty().tool("Streams/inplace", {
		editable: false,
		field: "title",
		inplaceType: "text",
		publisherId: publisherId,
		streamName: streamName
	}, "nft_column_" + streamName.split("/").pop()).activate();

	Q.Text.get('Assets/content', function (err, text) {
		column.forEachTool("Assets/NFT/preview", function () {
			var NFTpreview = this;
			var previewState = NFTpreview.preview.state;
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

		$(".Assets_NFT_section[data-type=chat]", column).plugin("Q/clickable").on(Q.Pointer.fastclick, function() {
			/*Q.Streams.get(publisherId, streamName, function (err) {
                if (err) {
                    return;
                }

                Q.Communities.pushChatColumn(this, column);
            });*/

			Q.Streams.get(publisherId, streamName, function (err, data) {
				var fem = Q.firstErrorMessage(err, data);
				if (fem) {
					return Q.alert(fem);
				}
				var invite = this.getAttribute('private') ? null : {};
				var stream = this;
				var columns = Q.Tool.from($column.closest(".Q_columns_tool"), "Q/columns");
				var min = parseInt($column.data('index')) || 0;
				min++;
				columns.close({min: min}, null, {animation: {duration: 0}});
				columns.push({
					title: text.NFT.Conversation,
					template: 'Communities/templates/conversation',
					columnClass: 'Assets_NFT_conversation',
					fields: {
						'Streams/chat': {
							publisherId: publisherId,
							streamName: streamName
						},
						'Users/avatar': {
							userId: publisherId,
							icon: true
						},
						stream: stream.fields,
						content: stream.fields.content.encodeHTML()
					},
					name: 'NFTconversation',
					controls: Q.Tool.setUpElement('div', 'Streams/participants', {
						publisherId: publisherId,
						streamName: streamName,
						invite: invite
					}),
					//pagePushUrl: 'conversation/' + publisherId + '/' + Q.normalize(streamName),
					onActivate: function () {
						setTimeout(function () {
							Q.scrollIntoView(column, {
								behavior: 'smooth',
								block: 'center',
								unlessOffscreenHorizontally: true
							});
						}, 300);
					}
				}, function () {});
			});
		});
		$(".Assets_NFT_section[data-type=edit]", column).plugin("Q/clickable").on(Q.Pointer.fastclick, function () {
			var nftTool = Q.Tool.from($(".Assets_NFT_preview_tool", column)[0], "Assets/NFT/preview");
			if (!nftTool) {
				return console.warn("Assets/NFT/preview tool not found");
			}

			nftTool.update();
		});


		Q.Streams.Stream.onAttribute(publisherId, streamName, "Assets/NFT/attributes").set(function (attributes, k) {
			var isEmpty = Q.isEmpty(attributes[k]) ? 1 : 0;
			var $attrsBox = $(".Assets_NFT_section[data-type=attributes]", column);
			$attrsBox.attr("data-empty", isEmpty);
			var $attrs = $(".assetsNFTAttributes", column);
			$attrs.empty();

			Q.each(attributes[k], function () {
				$attrs.append("<tr><td>" + this.trait_type + ":</td><td>" + this.value + "</td></tr>");
			});
		}, true);
	});

	$(".Q_column_slot", column).plugin("Q/scrollbarsAutoHide", {vertical: true, horizontal: false});
});
})(Q, jQuery);
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

	var $bannerBlock = $(".banner-block", $profileColumn);
	var $coverPhoto = $("button[name=coverPhoto]", $profileColumn);
	var _setCover = function (stream) {
		var seriesPreviewTool = this;
		if (!$(seriesPreviewTool.element).hasClass("Q_selected")) {
			return;
		}

		$bannerBlock.css("background-image", "url(" + stream.iconUrl("x") + ")");
	};
	Q.Users.Interface.coverPhoto(
		$coverPhoto[0],
		$bannerBlock[0]
	);
	$coverPhoto.show();
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

	var _socialHandlerProfile = function () {
		var $this = $(this);
		var social = $this.attr('data-type');
		var socialUserName = $this.attr('data-connected');

		const socialUrls = {
			"facebook": "https://www.facebook.com/",
			"twitter": "https://twitter.com/",
			"linkedin": "https://www.linkedin.com/in/",
			"github": "https://github.com/",
			"instagram": "https://www.instagram.com/"
		};

		if (userId !== Q.getObject("loggedInUser.id", Q.Users)) {
			var url = socialUserName;
			if (!url.includes(socialUrls[social])) {
				url = socialUrls[social] + url;
			}
			Q.openUrl(url);
			return;
		}

		$this.addClass('Q_working');

		Q.Text.get('Communities/content', function (err, content) {
			Q.req('Communities/profileInfo', 'social', function (err, data) {
				$this.removeClass('Q_working');

				var msg = Q.firstErrorMessage(err, data && data.errors);
				if (msg) {
					return;
				}

				var value = data.slots.social;
				Q.prompt(null, function (username) {
					// dialog closed
					if (username === null) {
						return;
					}

					$this.addClass('Q_working');
					Q.req('Communities/profileInfo', 'social', function (err, data) {
						$this.removeClass('Q_working');
						var msg = Q.firstErrorMessage(err, data && data.errors);
						if (msg) {
							return;
						}

						$this.attr('data-connected', data.slots.social);
					}, {
						fields: {
							social: social,
							value: username,
							action: "update"
						}
					});
				}, {
					title: content.me.UpdateSocialTitle.replace('{{1}}', social),
					initialText: value,
					className: 'profile-social'
				});
			}, {
				fields: {
					social: social,
					action: "get"
				}
			});
		});

		return false;
	};
	$(".header-list-itms .Communities_social_icon[data-type=facebook]").on(Q.Pointer.fastclick, _socialHandlerProfile);
	$(".header-list-itms .Communities_social_icon[data-type=twitter]").on(Q.Pointer.fastclick, _socialHandlerProfile);
	$(".header-list-itms .Communities_social_icon[data-type=linkedin]").on(Q.Pointer.fastclick, _socialHandlerProfile);
	$(".header-list-itms .Communities_social_icon[data-type=github]").on(Q.Pointer.fastclick, _socialHandlerProfile);
	$(".header-list-itms .Communities_social_icon[data-type=instagram]").on(Q.Pointer.fastclick, _socialHandlerProfile);
});

})(Q, jQuery);
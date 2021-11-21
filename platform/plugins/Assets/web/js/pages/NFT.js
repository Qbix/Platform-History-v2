Q.page("Assets/NFT", function () {

    // code to execute after page finished loading
    $("#content .assets_nft_tabs .tablinks").on(Q.Pointer.fastclick, function() {
        $(this).addClass('active').siblings('li').removeClass('active');
        $("#content .assets_nft_details ." + this.id).addClass("active-content").siblings('.tabcontent').removeClass("active-content");
    });

    // set likes
    $("#content .assets_nft_details_header_right .fa-heart").on(Q.Pointer.fastclick, function() {
        if (!Q.Users.loggedInUserId()) {
            return Q.Users.login({
                onSuccess: function () {
                    Q.handle(window.location.href);
                }
            });
        }

        var $likes = $(this).closest(".assets_nft_details_header_right");
        Q.req("Assets/NFT", "setLikes", function (err, data) {
            if (err) {
                return;
            }

            data = data.slots.set;

            if (data.res) {
                $likes.addClass("Q_selected");
            } else {
                $likes.removeClass("Q_selected");
            }

            $("span", $likes).text(data.likes);
        }, {
            fields: {
                publisherId: Assets.NFT.publisherId,
                streamName: Assets.NFT.streamName
            }
        });
    });

    $("#Assets_goback").on(Q.Pointer.fastclick, function() {
        history.back();
    });

    $(".assets_nft_col_eight")[0].forEachTool("Assets/NFT/preview", function () {
        var tool = this;
        var previewState = this.preview.state;

        Q.Streams.get(previewState.publisherId, previewState.streamName, function () {
            var src = this.getAttribute("src");

            if (!src) {
                return;
            }

            $(tool.element).on(Q.Pointer.fastclick, ".NFT_preview_icon", function (e) {
                e.stopPropagation();

                Q.Dialogs.push({
                    title: "Full size",
                    content: "<img class='NFT_fullsize_icon' src='" + src + "'>",
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

                return false;
            });
        });
    });

	return function () {
		// code to execute before page starts unloading
	};
	
}, 'Assets');
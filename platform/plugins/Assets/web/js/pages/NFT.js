Q.page("Assets/NFT", function () {

    Q.Text.get("Assets/content", function (err, text) {
        if (err) {
            return console.warn(err);
        }

        // code to execute after page finished loading
        $("#content .assets_nft_tabs .tablinks").on(Q.Pointer.fastclick, function() {
            $(this).addClass('active').siblings('li').removeClass('active');
            $("#content .assets_nft_details ." + this.id).addClass("active-content").siblings('.tabcontent').removeClass("active-content");
        });

        $("#assets_goback").on(Q.Pointer.fastclick, function() {
            var ownerId = $("input[name=ownerId]").val();
            if (!ownerId) {
                return Q.alert(text.NFT.OwnerUserNotFound);
            }

            Q.handle(Q.url('{{TokenSociety}}/profile/' + ownerId));
        });
    });

	return function () {
		// code to execute before page starts unloading
	};
	
}, 'Assets');
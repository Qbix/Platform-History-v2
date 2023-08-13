var Users = Q.Users;

Q.onReady.add(function() {
	$("#activate_setIdentifier").click(function() { Users.setIdentifier(); });
	$("#activate_logoutAndTryAgain").click(function () {
		Q.Users.logout({
			onSuccess: function () {
				window.location.reload(true);
			}
		}
	)})
	$("#activate_login").click(function() { Users.login(); });
	$("#new-password").val("").focus();
	
	Q.addScript("{{Q}}/js/sha1.js");
	
	var $form = $("form");
	$form.data("onBeforeSubmit", new Q.Event());
	var onBeforeSubmit = $form.data("onBeforeSubmit");
	onBeforeSubmit.set(function () {
		var $form = $(this);
		var $input = $form.find("input[name=passphrase]");
		var password = $input.val();
		$("<input type=\"hidden\" name=\"password\">").val(password).appendTo($form);
	});
	$form.on("submit", function (event) {
        if (Q.handle($form.data("onBeforeSubmit"), this) === false) {
            event.stopImmediatePropagation();
            return false;
        }
        
		var salt = Users.pages.activate.salt_json;
		if (!window.CryptoJS || !salt) {
			return;
		}
		var p = $("#new-password");
		var v = p.val();
		if (v && location.protocol !== "https:") {
			if (!/^[0-9a-f]{40}$/i.test(v)) {
				p.val(CryptoJS.SHA1(p.val() + "\t" + salt));
			}
			$("#Users_login_isHashed").attr("value", 1);
		} else {
			$("#Users_login_isHashed").attr("value", 0);
		}
	});
	
	// Get the suggestions from YAHOO, if possible
	
	$("#new-password").plugin("Q/placeholders").plugin("Q/clickfocus");
	
	// this used to work:
	// var url = "http://query.yahooapis.com/v1/public/yql?format=json&diagnostics=false&q=select%20abstract%20from%20search.news%20where%20query%3D%22{{verb_ue}}%22";
	// but YAHOO now deprecated the search.news table.
	// later we can pay for BOSS to do this. But for now, here is what we do:
	var url = "https://query.yahooapis.com/v1/public/yql?format=json&diagnostics=false&q=SELECT+Rating.LastReviewIntro+from+local.search+WHERE+zip+%3D+%2210001%22+AND+%28query%3D%22{{verb_ue}}%22+OR+query%3D%22{{noun_ue}}%22%29+AND+Rating.LastReviewIntro+MATCHES+%22%5E.%2B%22+LIMIT+10"
        .interpolate(Users.pages.activate);
	
	$(".Users_activate_container .Q_buttons .Q_button").plugin("Q/clickable");

	Q.request(url, null, function(err, data) {
		if (data.query && data.query.results && data.query.results.Result) {
			// var r = data.query.results.result;
			var r = data.query.results.Result;
			var ul = $("#suggestions");
			var rand, text;
			var source = "";
			for (var i=0; i<r.length; ++i) {
				text = r[i].Rating.LastReviewIntro;
				if (text) {
					source += " " + text;
				}
			}
			var source_words = source.toLowerCase().replace(/[^A-Za-z0-9-_\" ]/g, "").split(" ");
			for (var i=0; i<7; ++i) { // add seven quotes from here
				rand = Math.floor(Math.random() * source_words.length);
				var text = source_words.slice(rand, rand+3).join(" ");
				if (text) {
					ul.prepend($("<li />").addClass("Users_fromYahoo").html(text));
					$("li:last", ul).eq(0).remove();
				}
			}
		}

	}, {"callbackName": "callback"});
});
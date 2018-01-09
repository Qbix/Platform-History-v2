"use strict";
(function (Q, $) {

	var Users = Q.Users;

	$('#activate_login').on(Q.Pointer.fastclick, function(){
		Users.login({
			onSuccess: function() {
				Q.handle(Q.Page.currentUrl());
				return false;
			}
		});
	});

	$('body').on(Q.Pointer.fastclick, '#content .users_unsubscribe button', function(){
		Q.req('Users/unsubscribe', 'result', function (err, response) {
			var msg;
			if (msg = Q.firstErrorMessage(err, response && response.errors)) {
				return Q.alert(msg);
			}

			$("#content").attr("data-state", response.slots.result);
		}, {
			method: 'post',
			fields: {}
		});

		return false;
	});

})(Q, jQuery);

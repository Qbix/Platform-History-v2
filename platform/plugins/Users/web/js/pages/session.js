(function () {
	
	Q.page("Users/session", function () {
	
		var url = Q.getObject("Q.Cordova.handoff.url");
		if (url) {
			location.href = url;
			return;
		}
	
		_login();
		$('#Users_login').plugin('Q/clickable')
		.on(Q.Pointer.click, function () {
			_login();
		});

		return function () {
			// code to execute before page starts unloading
		};
	}, 'Users');
	
	function _login() {
		Q.Users.login({
			fullscreen: true,
			noClose: true,
			closeOnEsc: false,
			onSuccess: function () {
				// now we are signed in
				window.location.reload(true)
			}
		});
		setTimeout(function () {
			Q.Pointer.hint($('#Users_login_identifier')[0]);
		}, 500);
	}

})();
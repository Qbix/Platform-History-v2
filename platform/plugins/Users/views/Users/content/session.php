<div id="content">
	<?php Q_Response::addScriptLine(<<<EOT
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
		Q.page('Users/session', function () {
			_login();
			$('#Users_login').plugin('Q/clickable')
			.on(Q.Pointer.click, function () {
				_login();
			});
		});
EOT
	); ?>
</div>
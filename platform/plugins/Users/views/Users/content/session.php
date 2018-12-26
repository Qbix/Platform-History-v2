<div id="content">
	<?php Q_Response::addScriptLine(<<<EOT
		function _login() {
			Q.Users.login({
				onSuccess: function () {
					// now we are signed in
					window.location.reload(true)
				}
			});
			setTimeout(function () {
				Q.hint($('#Users_login_identifier')[0]);
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
	<div id="Users_session_buttons">
		<a class="Q_button" id="Users_login"><?php echo $session['GetStarted'] ?></a>
	</div>
</div>
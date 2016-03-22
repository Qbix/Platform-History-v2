<p>
	Greetings from <?php echo $publisher->displayName() ?>.
</p>

<p>
	Is this really your email address, <?php echo $user->displayName() ?>?
	If so, click <?php echo Q_Html::a(
		'Users/activate?code='.urlencode($email->activationCode)
		 . ' emailAddress='.urlencode($email->address),
		'here'
	) ?> to attach it to your account.
</p>

<p>
	See you on <a href="<?php echo Q_Request::baseUrl() ?>"><?php echo $publisher->displayName() ?></a>!
</p>

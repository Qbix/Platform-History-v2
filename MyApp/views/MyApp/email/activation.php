<p>
	Thanks for signing up with <?php echo Q_Html::text($communityName) ?>.
</p>

<p>
	Is this really your email address, <?php echo Q_Html::text($user->displayName()) ?>?
	If so, click <?php echo Q_Html::a($link, 'here') ?> to set your passphrase and activate your account.
</p>

<p>
	See you on <a href="<?php echo Q_Request::baseUrl() ?>"><?php echo Q_Html::text($communityName) ?></a>!
</p>

<p style="margin-top: 100px;">
	Here is a link to <?php echo Q_Html::a($unsubscribe, 'unsubscribe') ?> if you don't want to get any more emails.
</p>

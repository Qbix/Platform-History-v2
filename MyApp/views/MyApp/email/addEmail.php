<p>
	<?php echo Q::text($Greetings, array($communityName)) ?>
</p>

<p>
	<?php echo Q::interpolate($activation['ReallyYourEmail'], 
		array($user->displayName(), $link)
	) ?>
</p>

<p>
	<?php echo Q::interpolate($activation['SeeYou'],
		array(Q_Request::baseUrl(), $communityName)
	) ?>
</p>

<p style="margin-top: 100px;">
	<?php echo Q::interpolate($LinkToUnsubscribe, array($unsubscribe)) ?>
</p>

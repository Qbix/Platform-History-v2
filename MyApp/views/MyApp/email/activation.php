<p>
	<?php Q::text($activation['Thanks'], array($communityName)) ?>
</p>

<p>
	<?php Q::interpolate($activation['ReallyYourEmail'], 
		array($user->displayName(), $link)) ?>
</p>

<p> 
	<?php Q::text($activation['SeeYou'],
		array(Q_Request::baseUrl(), $communityName)) ?>
</p>

<p style="margin-top: 100px;">
	<?php echo Q::text($LinkToUnsubscribe, array($unsubscribe)) ?>
</p>

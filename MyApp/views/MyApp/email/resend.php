<p>
	Thanks for visiting <?php echo $communityName ?>, <?php echo $user->displayName() ?>.
</p>

<p>
	You are receiving this email because someone entered your email address
	and clicked "forgot passphrase". If it wasn't you, simply ignore this message.
	
 	To reset your passphrase, click <?php echo Q_Html::a(
		'Users/activate?p=1&code='.urlencode($email->activationCode)
		 . ' emailAddress='.urlencode($email->address),
		'here'
	) ?>.
</p>

<p>
	See you on <a href="<?php echo Q_Request::baseUrl() ?>"><?php echo $communityName ?></a>!
</p>

<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "EmailMessage",
  "action": {
    "@type": "ViewAction",
    "url": "<?php echo $link ?>",
    "name": "Set up passphrase"
  },
  "description": "Set up passphrase"
}
</script>
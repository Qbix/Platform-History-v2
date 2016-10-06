<p>
	Thanks for visiting <?php echo Q_Html::text($communityName) ?>, <?php echo Q_Html::text($user->displayName()) ?>.
</p>

<p>
	You are receiving this email because someone entered your email address
	and clicked "forgot passphrase". If it wasn't you, simply ignore this message.
	
 	To reset your passphrase, click <?php echo Q_Html::a($link, 'here') ?>.
</p>

<p>
	See you on <a href="<?php echo Q_Request::baseUrl() ?>"><?php echo Q_Html::text($communityName) ?></a>!
</p>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EmailMessage",
  "action": {
    "@type": "ViewAction",
    "url": "<?php echo $link ?>",
    "name": "Set up passphrase"
  },
  "description": "Set up passphrase"
}
</script>
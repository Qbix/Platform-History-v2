<p>
	<?php echo Q::text($resend['Thanks'], array($communityName)) ?>
</p>

<p>
	<?php echo Q::text($resend['YouAreReceiving']) ?>
	<?php echo Q::interpolate($resend['Reset'], array(Q_Html::a($link, 'here'))) ?>
</p>

<p>
	(<?php echo Q::interpolate($resend['DomainCode'], compact('domain', 
'code')) ?>)
</p>

<p>
	<?php echo Q::interpolate($SeeYou, array(Q_Html::a(Q_Html::themedUrl(''), $communityName))) ?>
</p>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EmailMessage",
  "action": {
    "@type": "ViewAction",
    "url": "<?php echo $link ?>",
    "name": <?php echo Q::json_encode($resend['SetUpPassphrase']) ?>
  },
  "description": <?php echo Q::json_encode($resend['SetUpPassphrase']) ?>
}
</script>

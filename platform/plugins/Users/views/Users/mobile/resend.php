<?php echo Q::interpolate($resend['DidYouWant'], array($communityName)) ?>
<?php echo Q::interpolate($resend['ClickHere'], array(Q_Uri::url($link))) ?>

<?php echo Q::interpolate($resend['OrEnterCode']) ?>
@<?= $domain ?> #<?= $code ?>
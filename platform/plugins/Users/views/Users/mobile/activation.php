<?php echo Q::interpolate($activation['Thanks'], array($communityName)) ?> 
<?php echo Q::interpolate($activation['ClickHere'], array(Q_Uri::url($link))) ?>

<?php echo Q::interpolate($resend['OrEnterCode']) ?>
@<?= $domain ?> #<?= $code ?>
<?php echo Q::interpolate($activation['Thanks'], array($communityName)) ?> 
<?php echo Q::interpolate($activation['ClickHere'], array(Q_Uri::url($link))) ?>

code @<?= $domain ?> #<?= $code ?>
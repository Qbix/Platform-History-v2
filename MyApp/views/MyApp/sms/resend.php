<?php echo Q::text($resend['DidYouWant'], array($communityName)) ?>
<?php echo Q::interpolate($resend['ClickHere'], array(Q_Uri::url($link))) ?>

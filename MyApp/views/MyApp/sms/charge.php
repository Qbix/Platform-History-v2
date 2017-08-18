<?php echo Q::text($charge['HasBeenCharged'], array(
	$user->displayName(), $displayAmount, $description, $publisher->displayName()
)) ?>
<?php

function Assets_subscription_validate()
{
	Q_Request::requireFields(array('payments', 'planStreamName'), true);
}

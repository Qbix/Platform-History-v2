<?php

function Awards_subscription_validate()
{
	Q_Request::requireFields(array('payments', 'planStreamName'), true);
}

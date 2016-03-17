<?php

function Awards_payment_validate()
{
	Q_Request::requireFields(array('payments', 'amount', 'currency'), true);
}

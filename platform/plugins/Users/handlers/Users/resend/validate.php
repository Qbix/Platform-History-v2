<?php

function Users_resend_validate()
{
	Q_Valid::nonce(true);

	foreach (array('identifier') as $field) {
		if (!isset($_REQUEST[$field])) {
			throw new Q_Exception("$field is missing", array($field));
		}
	}
}

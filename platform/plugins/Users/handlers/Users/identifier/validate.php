<?php

function Users_contact_validate()
{
	Q_Valid::nonce(true);
	return Q::event('Users/user/validate');
}

<?php

function Users_importContacts_validate()
{
	Q_Valid::nonce(true);

	if (empty($_GET['platform']))
		throw new Q_Exception('No platform specified');

	if(!Q::canHandle('Users/importContacts/platforms/'.$_GET['platform']))
		throw new Q_Exception('Unsupported platform specified: '.$_GET['platform']);
}

<?php

function Users_importContacts_validate()
{
	Q_Valid::nonce(true);

	if (empty($_GET['provider']))
		throw new Q_Exception('No provider specified');

	if(!Q::canHandle('Users/importContacts/providers/'.$_GET['provider']))
		throw new Q_Exception('Unsupported provider specified: '.$_GET['provider']);
}

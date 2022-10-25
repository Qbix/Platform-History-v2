<?php

function Users_unsubscribe_response()
{
	// echo "TODO: implement this page, with a form that POSTs something to this action, and handler that
	//  	validates the request fields in validate.php and then setting \$email->state = 'unsubscribed';";
	Q_Response::setSlot('content', Q::tool('Users/identifier'));
	return true;
}
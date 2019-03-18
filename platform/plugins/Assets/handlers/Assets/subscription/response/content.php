<?php
	
function Assets_subscription_response_content()
{
	Q_Request::requireFields(array('publisherId', 'userId'), true);
	// TODO: implement listing of all payments by the user to this publisher
}
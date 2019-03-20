<?php

function Users_importContacts_response_content()
{
	return Q::tool('Users/importContacts', array('platform'=>$_GET['platform']));
}
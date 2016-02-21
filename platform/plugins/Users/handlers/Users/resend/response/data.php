<?php

function Users_resend_response_data()
{
	return array('user' => Users::$cache['user']->exportArray());
}
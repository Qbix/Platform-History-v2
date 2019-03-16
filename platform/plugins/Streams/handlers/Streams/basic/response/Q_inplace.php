<?php

function Streams_basic_response_Q_inplace()
{
	$user = Users::loggedInUser();
	return Q_Html::text($user->displayName());
}
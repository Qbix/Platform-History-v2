<?php

function Assets_after_Users_insertUser($params)
{
	// Create a stream for the user's credits
	$user = $params['user'];
	$stream = Assets_Credits::userStream($user->id, $user->id);
	$stream->join(array('userId' => $user->id));
}
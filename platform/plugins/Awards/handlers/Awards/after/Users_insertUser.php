<?php

function Awards_after_Users_insertUser($params)
{
	// Create a stream for the user's credits
	$user = $params['user'];
	$stream = Awards_Credits::userStream($user->id, $user->id);
	$stream->join(array('userId' => $user->id));
}
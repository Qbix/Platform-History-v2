<?php

function Streams_before_Users_User_displayName($params, &$result)
{
	$result = Streams::displayName($params['user'], $params['options']);
}
<?php

function Streams_lookup_response_results()
{
	Q_Request::requireFields(array('publisherId', 'types', 'filter'), true);
	$streams = Streams::lookup(
		$_REQUEST['publisherId'],
		$_REQUEST['types'],
		$_REQUEST['filter']
	);
	return Db::exportArray($streams);
}
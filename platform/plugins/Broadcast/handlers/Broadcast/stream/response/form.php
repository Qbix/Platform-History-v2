<?php

function Broadcast_stream_response_form($params)
{	
	extract($params);
	
	if (empty($publisherId))	$publisherId = Streams::requestedPublisherId(true);
	if (empty($name)) $name = Streams::requestedName(true);
	
	$name = is_array($name)
		? implode('/', $name)
		: $name;
	
	$src = 'Broadcast/widget?';
	$q = array(
		'publisherId' => $publisherId,
		'streamName' => $name
	);
	foreach (array('css', 'button', 'checkbox', 'explanation') as $field) {
		if (isset($_REQUEST[$field])) {
			$q[$field] = $_REQUEST[$field];
		}
	}
	$src .= http_build_query($q, null, '&');
	$style = 'border: 0px;';
	$code = Q_Html::tag('iframe', compact('src', 'style'), '');
	return $code;
}
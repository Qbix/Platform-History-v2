<?php

function Websites_seo_post()
{
	if (empty($_REQUEST['streamName'])) {
		throw new Q_Exception_RequiredField(array('field' => 'streamName'));
	}
	$prefix = "Websites/seo/";
	if (substr($_REQUEST['streamName'], 0, strlen($prefix)) !== $prefix) {
		throw new Q_Exception_WrongValue(array(
			'field' => 'streamName',
			'range' => "string beginning with $prefix"
		));
	}
	$user = Users::loggedInUser(true);
	$publisherId = Users::communityId();
	$type = "Websites/seo";
	if (!Streams::canCreateStreamType($user->id, $publisherId, $type)) {
		throw new Users_Exception_NotAuthorized();
	}
	$stream = new Streams_Stream($publisherId);
	$stream->publisherId = $publisherId;
	$stream->name = $_REQUEST['streamName'];
	$stream->type = $type;
	if (isset($_REQUEST['uri'])) {
		$stream->setAttribute('uri', $_REQUEST['uri']);
	}
	$stream->save();
	
	$stream->post($user->id, array(
		'type' => 'Streams/created',
		'content' => '',
		'instructions' => Q::json_encode($stream->toArray())
	), true);
	
	$stream->subscribe(); // autosubscribe to streams you yourself create, using templates
	
	Q_Response::setSlot('stream', $stream->exportArray());
}
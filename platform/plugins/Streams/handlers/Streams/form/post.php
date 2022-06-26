<?php

function Streams_form_post($params = array())
{
	if (empty($_REQUEST['inputs'])) {
		throw new Q_Exception_RequiredField(array('field' => 'inputs'));
	}
	$inputs = Q::json_decode($_REQUEST['inputs'], true);
	$user = Users::loggedInUser(true);
	$r = array_merge($_REQUEST, $params);
	$streams = array();
	foreach ($inputs as $name => $info) {
		$inputName = "input_$name";
		if (!isset($r[$inputName])) {
			continue;
		}
		if (!is_array($info) or count($info) < 4) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'inputs',
				'range' => 'array of name => (streamExists, publisherId, streamName, fieldName)'
			));
		}
		list($streamExists, $publisherId, $streamName, $fieldName) = $info;
		$stream = Streams_Stream::fetch(null, $publisherId, $streamName);
		if (!$stream) {
			if ($user->id !== $publisherId
			or !Q_Config::get('Streams', 'possibleUserStreams', $streamName, false)) {
				throw new Users_Exception_NotAuthorized();
			}
			$stream = Streams::create(null, $publisherId, null, array(
				'name' => $streamName
			));
		}
		$attribute = (substr($fieldName, 0, 10) === 'attribute:')
			? substr($fieldName, 10)
			: null;
		if ($attribute) {
			$stream->setAttribute($attribute, $r[$inputName]);
		} else {
			$stream->$fieldName = $r[$inputName];
		}
		$stream->save();
		$streams[$stream->name] = $stream;
	}
	Q_Response::setSlot('streams', Db::exportArray($streams));
}
<?php

function Streams_stream_tool($options) {
	extract($options);

	$fields = array();
	$hidden = array();
	$user = Users::loggedInUser();
	if (!$user) {
		throw new Users_Exception_NotLoggedIn();
	}

	// if PK provided check for the stream
	if (isset($publisherId) && isset($name)) {
		$stream = Streams::fetch($user->id, $publisherId, $name);
		$stream = !empty($stream) ? reset($stream) : null;
		if (!$stream) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'stream',
				'criteria' => 'with that name'
			), 'streamName');	
		}
		if (!$stream->testReadLevel('content') || !$stream->testWriteLevel('edit')) {
			throw new Users_Exception_NotAuthorized();
		}
	} else {
		$stream = null;
	}

	// publisherId can be taken from request or shall be equal to user id
	$hidden['publisherId'] = $publisherId = isset($stream) ?$stream->publisherId : $user->id;

	// name for existing stream, for new streams name will be generated from type
	if (isset($stream)) {
		$hidden['name'] = $stream->name;
	}

	if (isset($publisherId)) $fields['publisherId'] = array(
		'label' => 'Publisher ID',
		'type' => 'static',
		'value' => $publisherId
	);

	if (isset($name)) $fields['name'] = array(
		'label' => 'Stream name',
		'type' => 'static',
		'value' => $name
	);

	// type shall be defined for new streams
	if (!isset($stream)) {
		$range = array_keys(Q_Config::expect('Streams', 'types'));
		if (!isset($type)) {
			// selection of available types
			$fields['type'] = array(
				'label' => 'Stream type',
				'type' => 'select',
				'options' => array_combine($range, $range),
				'value' => 'Streams/text'
			);
		} else {
			// check if type is allowed
			if (!in_array($type, $range)) {
				throw new Q_Exception_WrongValue(array(
					'field' => 'stream type',
					'range' => join(', ', $range)
				));
			}
			$hidden['type'] = $type;
		}
	}

	// stream title
	$fields['title'] = array(
		'label' => 'Title',
		'type' => 'text',
		'value' => $stream ? $stream->title : ''
	);
	// stream content
	$fields['content'] = array(
		'label' => 'Content',
		'type' => 'textarea',
		'value' => $stream ? $stream->content : ''
	);

	$read_options = array_flip(Streams::$READ_LEVEL);
	if ($stream) {	
		foreach ($read_options as $key => $value) {
			if (!$stream->testReadLevel($key)) unset($read_options[$key]);
		}
		$readLevel = min(isset($readLevel) ? $readLevel : 100, $stream->readLevel);
	}
	$fields['readLevel'] = array(
		'label' => 'Read level',
		'type' => 'select',
		'value' => $readLevel ? $readLevel : Streams::$READ_LEVEL['content'],
		'options' => $read_options
	);
	$write_options = array_flip(Streams::$WRITE_LEVEL);
	if ($stream) {	
		foreach ($write_options as $key => $value) {
			if (!$stream->testWriteLevel($key)) unset($write_options[$key]);
		}
		$writeLevel = min(isset($writeLevel) ? $writeLevel : 100, $stream->writeLevel);
	}
	$fields['writeLevel'] = array(
		'label' => 'Write level',
		'type' => 'select',
		'value' => $writeLevel ? $writeLevel : Streams::$WRITE_LEVEL['post'],
		'options' => $write_options
	);
	$admin_options = array_flip(Streams::$ADMIN_LEVEL);
	if ($stream) {	
		foreach ($admin_options as $key => $value) {
			if (!$stream->testAdminLevel($key)) unset($admin_options[$key]);
		}
		$adminLevel = min(isset($adminLevel) ? $adminLevel : 100, $stream->adminLevel);
	}
	array_pop($admin_options);
	$fields['adminLevel'] = array(
		'label' => 'Admin level',
		'type' => 'select',
		'value' => $adminLevel ? $adminLevel : Streams::$ADMIN_LEVEL['none'],
		'options' => $admin_options
	);

	$fields['submit'] = array(
		'label' => '',
		'type' => 'submit_buttons',
		'options' => array(
			'submit' => $stream ? 'Update' : 'Create'
		)
	);

	if (empty($noJoin)) {
		$hidden['join'] = true;
	}

	return Q_Html::tag('h3', array(), !$stream ? 'Create a stream' : 'Update stream')
		. Q_Html::form(Q_Request::baseUrl().'/action.php/Streams/stream', $stream ? 'put' : 'post', array(), 
			Q_Html::hidden($hidden).Q::tool('Q/form', array(
				'fields' => $fields,
				'onSuccess' => 'function (data) {
					if (data.errors) alert(data.errors);
					else {
						var stream = Q.getObject(["slots", "form", "fields"], data);
						Q.handle(Q.info.baseUrl+"/{{Streams}}/put?publisherId="+stream.publisherId+"&name="+stream.name);
					}
				}'
		))
	);
}
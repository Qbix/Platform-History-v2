<?php

function Streams_message_tool($options) {
	extract($options);
	$user = Users::loggedInUser(true);
	if (empty($publisherId)) $publisherId = Streams::requestedPublisherId();
	if (empty($publisherId)) $publisherId = $_REQUEST['publisherId'] = $user->id;
	if (empty($name)) $name = Streams::requestedName(true);

	$stream = Streams::fetch($user->id, $publisherId, $name);
	$stream = !empty($stream) ? reset($stream) : null;
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => 'with that name'
		), 'streamName');	
	}
	if (!$stream->testReadLevel('messages') || !$stream->testWriteLevel('post')) {
		throw new Users_Exception_NotAuthorized();
	}

	$hidden = array(
		'publisherId' => $publisherId,
		'streamName' => $name
	);

	$fields = array(
		'stream' => array(
			'label' => 'Stream',
			'type' => 'static',
			'value' => $stream->title			
		)
	);

	$type = Streams::requestedType();

	// check if stream has messages
	$types = Q_Config::get('Streams', 'messages', $stream->type, array());
	if (count($types) === 0) throw new Q_Exception("Stream of type '{$stream->type}' does not support messages");

	if (!empty($type) && !in_array($type, $types)) {
		throw new Q_Exception("Requested message type '$type' is not alowed for streams of type '{$stream->type}'");
	}

	if (!empty($type)) {
		$hidden['type'] = $type;
		$fields['type'] = array(
			'label' => 'Message type',
			'type' => 'static',
			'value' => $type			
		);
	} else {
		$fields['type'] = array(
			'label' => 'Message type',
			'type' => 'select',
			'options' => array_merge(array('' => 'Select type'), array_combine($types, $types)),
			'value' => ''			
		);		
	}

	$fields['content'] = array(
		'label' => 'Content',
		'type' => 'textarea'
	);

	$fields['submit'] = array(
		'label' => '',
		'type' => 'submit_buttons',
		'options' => array(
			'submit' => 'Post'
		)
	);

	return Q_Html::tag('h3', array(), 'Post a message')
		. Q_Html::form(Q_Request::baseUrl().'/action.php/Streams/message', 'post', array(), 
			Q_Html::hidden($hidden).Q::tool('Q/form', array(
				'fields' => $fields,
				'onSuccess' => 'function (data) {
					if (data.errors) alert(data.errors);
					else {
						alert("Message posted");
						var message = Q.getObject(["slots", "form", "fields"], data);
						Q.handle(Q.info.baseUrl+"/{{Streams}}/message?publisherId="+message.publisherId+"&name="+message.streamName);
					}
				}'
		))
	);
}
<?php

function Streams_invite_tool($options)
{
	extract($options);
	$form_tool = Q::tool('Q/form', array(
		'fields' => array(
			'displayName' => array(
				'label' => "Display name",
				'type' => 'text',
				'value' => Streams::displayName(
					Users::loggedInUser(),
					array('fullAccess' => true)
				)
			),
			'userId' => array(
				'label' => "User id to invite",
				'type' => 'textarea'
			),
			'identifier' => array(
				'label' => 'Mobile Number or Email Address',
				'type' => 'textarea'
			),
			'label' => array(
				'label' => 'Group label',
				'type' => 'textarea'
			),
			'readLevel' => array(
				'label' => 'Read level',
				'type' => 'select',
				'value' => Streams::$READ_LEVEL['content'],
				'options' => array_flip(Streams::$READ_LEVEL)
			),
			'writeLevel' => array(
				'label' => 'Write level',
				'type' => 'select',
				'value' => Streams::$WRITE_LEVEL['post'],
				'options' => array_flip(Streams::$WRITE_LEVEL)
			),
			'adminLevel' => array(
				'label' => 'Admin level',
				'type' => 'select',
				'options' => array_flip(Streams::$ADMIN_LEVEL)
			),
			'submit' => array(
				'label' => '',
				'type' => 'submit_buttons',
				'options' => array(
					'submit' => 'Send Invite'
				)
			)
		)
	)) . Q_Html::hidden(array(
		'publisherId' => $stream->publisherId,
		'streamName' => $stream->name
	));
	return Q_Html::tag('h3', array(), 'Invite to stream "'.$options['stream']->name . '"')
		.Q_Html::form(Q_Request::baseUrl().'/action.php/Streams/invite', 'post', array(), $form_tool);
}
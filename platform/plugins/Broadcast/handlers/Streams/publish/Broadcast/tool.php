<?php

function Streams_publish_Broadcast_tool($options)
{
	extract($options);
	$publisherId = $stream->publisherId;
	$streamName = $stream->name;
	$type = 'Broadcast';
	
	$input = Q_Html::input('content', '');
	$button = Q_Html::tag('button', array(), 'Post');
	return Q_Html::form(
		'Streams/stream',
		'post', array(), 
		Q_Html::formInfo(true)
		.Q_Html::hidden(compact('publisherId', 'streamName', 'type'))
		.Q::tool('Q/form', array(
			'fields' => array(
				'message' => array(
					'type' => 'text',
					'message' => 'this message will appear as if the user typed it before posting'
				),
				'link' => array(
					'type' => 'text',
					'message' => 'the address of the webpage to share'
				),
				'picture' => array(
					'type' => 'text',
					'message' => 'if you enter a picture url here, it will override the picture that is posted'
				),
				'description' => array(
					'type' => 'textarea', 
					'message' => 'if you enter something here, it will override the description that facebook would have automatically grabbed from that page'
				),
				'' => array(
					'type' => 'button', 
					'value' => 'Post'
				)
			),
			'onSuccess' => 'Q.plugins.Broadcast.onBroadcastSuccess'
		))
	);
}
<?php 

function Streams_player_Websites_article($options)
{
	$stream = $options['stream'];
	$emailSubject = Q::ifset($options, 'emailSubject', "Reaching out from your website");
	$result = Q::tool('Websites/article', array(
		'publisherId' => $stream->publisherId,
		'streamName' => $stream->name,
		'html' => array(
			'placeholder' => 'Start editing the article here. Select some text to use the HTML editor.',
			'froala' => array(
				'key' => Q_Config::get('Streams', 'froala', 'key', null),
				'pasteImage' => true
			)
		),
		'getintouch' => array(
			'email' => true,
			'emailSubject' => $emailSubject,
			'sms' => 'Text',
			'call' => 'Call',
			'class' => 'Q_button clickable',
		)
	));
	$result .= Q::tool("Websites/seo", array(
		'skipIfNotAuthorized' => true,
		'publisherId' => $stream->publisherId,
		'streamName' => $stream->name
	));
	return $result;
}
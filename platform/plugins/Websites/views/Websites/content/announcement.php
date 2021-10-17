<div id="content">
	<?php echo Q::tool('Websites/article', array(
		'publisherId' => $publisherId,
		'streamName' => $streamName,
		'html' => array(
			'placeholder' => "Start editing the announcement here. Select some text to use the HTML editor.<br><br>When the announcement is totally ready, you can post it to tenants.",
			'froala' => array(
				'key' => Q_Config::get('Streams', 'froala', 'key', null),
				'pasteImage' => true
			)
		),
		'getintouch' => array(
			'email' => true,
			'emailSubject' => "Reaching out from your website",
			'sms' => 'Text',
			'call' => 'Call',
			'class' => 'Q_button clickable',
		)
	)) ?>
	<?php echo Q::tool('Streams/relate', @compact('publisherId', 'streamName', 'relationType')) ?>
</div>
<div id="content">
	<?php echo isset($header) ? $header : '' ?> 
	<div class="Websites_article">
		<?php echo Q::tool('Websites/article', array(
			'publisherId' => $publisherId,
			'streamName' => $streamName,
			'html' => array(
				'placeholder' => "Start editing the article here. Select some text to use the HTML editor.<br><br>The article will appear on the website.",
				'froala' => array(
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
		<?php echo Q::tool("Websites/metadata", array(
			'skipIfNotAuthorized' => true,
			'publisherId' => $publisherId,
			'streamName' => $streamName
		)); ?>
	</div>
	<?php echo isset($footer) ? $footer : '' ?> 
</div>
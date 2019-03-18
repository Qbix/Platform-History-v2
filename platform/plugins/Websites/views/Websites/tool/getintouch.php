		<?php echo Q::tool('Q/form') ?>
		<?php echo Q_Html::formInfo(Q_Request::url()); ?>
		<?php echo Q_Html::input('getintouch', 'true', array(
			'type' => 'checkbox',
			'checked' => !empty($getintouch) ? 'checked' : null,
			'id' => 'getintouch'
		)) ?>
		<?php echo Q_Html::hidden(array(
			'publisherId' => $article->publisherId,
			'name' => $article->name
		)) ?>
		<?php echo Q_Html::label('getintouch', 'Provide ways to get in touch')?>
		<?php echo Q_Html::buttons('submit', array('submit' => 'Submit')) ?>
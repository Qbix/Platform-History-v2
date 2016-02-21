<ul>
	<?php foreach ($categories as $category):?>
		<li>
			<?php echo Q_Html::checkboxes(
				'', // name
				array($category->name => $category->title), // value => label
				'cat_', // id prefix
				array($category->name => $category->member), // checked
				'', // between
				array(
					'data-publisherId' => $stream->publisherId,
					'data-name' => $stream->name
				)
			); ?>
		</li>
	<?php endforeach; ?>
</ul>
<div class="Places_user_location_container Places_user_location_checking">
	<?php echo Q::interpolate($location['interested'], array(
		'select' => Q_Html::select('meters', array(
			'class' => 'Places_user_location_meters'
		)) . Q_Html::options($meters, 'meters', $defaultMeters) . '</select>'
	))?>
	<div class="Places_user_location_whileObtaining">
		<?php echo Q_Html::img($map['prompt'], 'map', array(
			'class' => 'Places_user_location_set '
		)) ?> 
	</div>
	<div class="Places_user_location_whileObtained">
		<div class="Places_user_location_map_container">
			<div class="Places_user_location_map"></div>
		</div>
		<div class="Places_user_location_update Places_user_location_whileObtained">
			<button class="Places_user_location_update_button Q_button">
				<?php echo Q::text($location['update']) ?>
			</button>
		</div>
	</div>
</div>
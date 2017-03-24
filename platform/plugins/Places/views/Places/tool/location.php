<div class="Places_user_location_container Places_user_location_checking">
	I'm interested in things taking place within
	<?php echo Q_Html::select('meters', array(
		'class' => 'Places_user_location_meters'
	)) ?> 
		<?php echo Q_Html::options($meters, 'meters', $defaultMeters) ?> 
	</select>
	of
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
				Update my location
			</button>
		</div>
	</div>
</div>
	I'm interested in things taking place within
	<?php echo Q_Html::select('miles', array(
		'class' => 'Places_location_miles'
	)) ?> 
		<?php echo Q_Html::options($miles, 'miles', $defaultMiles) ?> 
	</select>
	of
	<div class="Places_location_whileObtaining">
		<?php echo Q_Html::img($map['prompt'], 'map', array(
			'class' => 'Places_location_set '
		)) ?> 
	</div>
	<div class="Places_location_whileObtained">
		<div class="Places_location_map_container">
			<div class="Places_location_map"></div>
		</div>
		<div class="Places_location_update Places_location_whileObtained">
			<button class="Places_location_update_button Q_button">
				Update my location
			</button>
		</div>
	</div>

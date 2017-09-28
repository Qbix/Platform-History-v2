<div id='content' class='Groups_content Groups_newGroup_content'>
	<table id="Groups_newGroup">
		<tr class="Groups_step Groups_newGroup_interest">
			<td class="Groups_newGroup_icon">
				<?php echo Q_Html::img('img/colorful/interests.png', 'interest icon', array(
					'class' => 'Groups_newGroup_interest_icon'
				)) ?> 
			</td>
			<td class="Groups_newGroup_choose">
				<button class="Q_button Streams_aspect_interests Groups_newGroup_interest_button">Choose an activity</button>
				<input type="hidden" id="Groups_newGroup_interest">
			</td>
		</tr>
		<tr class="Groups_step Groups_newGroup_location">
			<td class="Groups_newGroup_icon">
				<?php echo Q_Html::img('img/colorful/local.png', '') ?> 
			</td>
			<td class="Groups_newGroup_choose Groups_newGroup_location_container <?php
				echo $locationSetClass
			?>">
				<?php // echo Q_Html::smartTag('input', array('id' => 'Groups_newGroup_location', 'name' => 'local', 'placeholder' => 'Select a location')) ?> 
				<?php echo Q::tool('Places/address') ?>
				<button class="Groups_newGroup_location_button Q_button">Set My Location</button>
				<!-- <select name="location" id="Groups_newGroup_location">
					<option selected="selected" disabled="disabled" value="">
						Select a location
					</option>
				</select> -->
			</td>
		</tr>
		<tr class="Groups_step Groups_newGroup_time">
			<td class="Groups_newGroup_icon">
				<?php echo Q_Html::img('img/colorful/time.png', '') ?> 
			</td>
			<td class="Groups_newGroup_choose">
				<div id="Groups_newGroup_date_container">
					<label for="Groups_newGroup_day">Day:</label>
					<?php echo Q_Html::tag('input', array(
						'name' => 'date',
						'id' => 'Groups_newGroup_date',
						'min' => date("Y-m-d", strtotime('today')),
						'max' => date("Y-m-d", strtotime('today + 1 year'))
					)) ?>
				</div>
				<div id="Groups_newGroup_time_container">
					<label for="Groups_newGroup_time">Starting:</label>
					<?php echo Q_Html::smartTag('select', array('name' => 'time', 'id' => 'Groups_newGroup_time'), '15:15', $times) ?><br>
				</div>
			</td>
		</tr>
		<!--
		<tr style="display: none;">
			<td class="Groups_newGroup_icon">
				<?php echo Q_Html::img('img/colorful/time.png', '') ?> 
			</td>
			<td class="Groups_newGroup_choose">
				<label for="Groups_newGroup_time">Confirm by:</label>
				<?php echo Q_Html::smartTag('select', array('name' => 'time', 'id' => 'Groups_newGroup_time'), "15:00", $times) ?><br>
				<?php echo Q_Html::smartTag('select', array('name' => 'time', 'id' => 'Groups_newGroup_day'), null, $days) ?> 
			</div>
		</tr>
		-->
		<tr class="Groups_step Groups_newGroup_location_labels">
			<td class="Groups_newGroup_icon">
				<?php echo Q_Html::img('img/colorful/people.png', '') ?> 
			</td>
			<td class="Groups_newGroup_choose">
				<input name="peopleMin" type="tel" maxlength="2" value="2" class="Groups_minmax" >
				<span>&ndash;</span>
				<input name="peopleMax" type="tel" maxlength="4" value="10" class="Groups_minmax">
				<?php echo Q_Html::smartTag('select', array(
					'name' => 'labels',
					'id' => 'Groups_newGroup_labels'
				), $selectedLabels, $labels) ?> 
			</td>
		</tr>
		<tr class="Groups_step">
			<td colspan="2" style="text-align: center;">
				<button id="Groups_group_share" class="Q_button Q_aspect_when">Share</button>
			</td>
		</tr>
	</table>
</div>
<div id="Groups_newGroup_map" style="display: none"></div>


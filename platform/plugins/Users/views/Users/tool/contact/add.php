<?php echo Q_Html::div('tool', 'Users_contact_tool necessary panel'); ?> 
	<?php echo Q_Html::form($tool_action_url, 'post', array('class' => 'askEmail')) ?> 
		<?php echo Q_Html::formInfo($onSuccess, null, $snf) ?> 
		<h3 class='prompt'>
			<?php echo $prompt ?>
		</h3>
		<label for="authorized_email">your email address:</label>
		<input id="authorized_email" name="emailAddress" type="text" />
		<button type="submit" name="do_add" class="submit"><?php echo $button_content ?></button>
	</form>
</div>

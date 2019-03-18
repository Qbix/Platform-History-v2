<?php if ($verified) : ?>
	<?php echo Q_Html::div('tool', 'Users_contact_tool fleeting panel'); ?>
		<h3>
			Congratulations, you've verified your email, 
			<span class='email'><?php echo $user->emailAddress ?></span>
		</h3>
	</div>
<?php endif; ?>

<div class="Users_whenLoggedIn Users_status_avatar">
	<?php if ($user): ?>
		<?php echo Q::tool('Users/avatar', $avatar) ?> 
	<?php endif; ?>
</div>
<div class="Users_whenLoggedOut Users_status_login">
	<?php echo Q_Html::text($actions['LogIn']) ?>
</div>
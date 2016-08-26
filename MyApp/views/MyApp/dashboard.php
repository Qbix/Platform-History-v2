<div id='dashboard'>
	<h1><?php echo Users::communityName() ?></h1>

	<div id="dashboard_user">
		<?php if ($user): ?>
			<?php echo Q::tool("Users/avatar", array('userId' => $user->id, 'icon' => 50, 'short' => true), 'dashboard') ?>
		<?php else: ?>
			<a href="#login" class="MyApp_login">log in</a>
		<?php endif; ?>
		<div id="dashboard_user_contextual" class="Q_contextual" data-handler="MyApp.userContextual">
			<ul class="Q_listing">
				<?php if ($user): ?>
					<?php if (!$user->mobileNumber): ?>
						<li data-action="setIdentifier">set mobile number</li>
					<?php elseif (!$user->emailAddress): ?>
						<li data-action="setIdentifier">set email address</li>
					<?php endif ?>
				<?php endif ?>
				<li data-action="logout">log out</li>
			</ul>
		</div>
	</div>
	
	<?php echo Q::tool('Q/tabs', array(
		'vertical' => !Q_Request::isMobile(),
		'overflow' => array(
			'content' => '{{html}}'
		),
		'compact' => true,
		'tabs' => array(
			'welcome' => 'Welcome',
			'about' => 'About'
		),
		'urls' => array(
			'welcome' => 'MyApp/welcome',
			'about' => 'MyApp/about'
		)
	))?>
</div>

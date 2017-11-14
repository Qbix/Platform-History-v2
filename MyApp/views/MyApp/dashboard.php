<div id='dashboard'>
	<?php echo Q_Html::a('MyApp/home', array('class' => 'MyApp_dashboard_logo')) ?>
		<h1><?php echo Users::communityName() ?></h1>
	</a>

	<div id="dashboard_user">
		<?php if ($user): ?>
			<?php echo Q::tool("Users/avatar", array('userId' => $user->id, 'icon' => 50, 'short' => true), 'dashboard') ?>
		<?php else: ?>
			<a href="#login" class="MyApp_login"><?php echo $dashboard["LogIn"] ?></a>
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
			'content' => '{{html}}',
			'defaultHtml' => $dashboard['Menu']
		),
		'compact' => true,
		'tabs' => $tabs,
		'urls' => $urls
	))?>
</div>

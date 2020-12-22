<div id='dashboard'>
	<?php echo Q_Html::a('MyApp/home', array('class' => 'MyApp_dashboard_logo')) ?>
		<h1><?php echo Users::communityName() ?></h1>
	</a>

	<div id="dashboard_user">
		<?php echo Q::tool('Users/status') ?>
	</div>

	<div id="dashboard_user_contextual">
		<ul class="Q_listing">
			<li data-action="setIdentifier"><?php echo $dashboard['SetEmailAddress'] ?></li>
			<li data-action="logout"><?php echo $dashboard['LogOut'] ?></li>
		</ul>
	</div>
	
	<?php echo Q::tool('Q/tabs', array(
		'vertical' => !$isMobile and Q_Config::get('Q', 'response', 'layout', 'sidebar', false),
		'overflow' => array(
			'content' => '{{text}}',
			'defaultHtml' => $dashboard['Menu']
		),
		'compact' => $isMobile,
		'tabs' => $tabs,
		'urls' => $urls
	))?>
</div>

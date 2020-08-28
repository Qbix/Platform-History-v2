<div id='dashboard'>
	<?php echo Q_Html::a('MyApp/home', array('class' => 'MyApp_dashboard_logo')) ?>
		<h1><?php echo Users::communityName() ?></h1>
	</a>

	<div id="dashboard_user">
		<?php echo Q::tool('Users/status') ?>
	</div>
	
	<?php echo Q::tool('Q/tabs', array(
		'vertical' => !Q_Request::isMobile(),
		'overflow' => array(
			'content' => '{{text}}',
			'defaultHtml' => $dashboard['Menu']
		),
		'compact' => true,
		'tabs' => $tabs,
		'urls' => $urls
	))?>
</div>

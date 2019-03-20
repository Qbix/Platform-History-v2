<html <?php echo Q_Response::htmlAttributes() ?>">
<head>
	<title><?php echo $title ?></title>
	<style type="text/css">
		* { font-family: Arial; }
		#content_slot { padding: 10px; }
		.exception_message { color: red; }
	</style>
</head>
<body>
	<div id="dashboard_slot">
		<?php echo $dashboard ?>
	</div>
	<div id="content_slot">
		<?php echo $content ?>
	</div>
	<div id="dialog" style="display: none;">
		<div class="Q_title_slot"></div>
		<div class="Q_dialog_slot"></div>
	</div>
</body>
</html>

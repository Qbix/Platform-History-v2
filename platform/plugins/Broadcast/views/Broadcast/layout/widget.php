<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"
"http://www.w3.org/TR/html4/strict.dtd">
<html <?php echo Q_Response::htmlAttributes() ?>>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title><?php echo $title ?></title>
	<link rel="shortcut icon" href="<?php echo Q_Request::proxyBaseUrl(); ?>/favicon.ico" type="image/x-icon">
	
	<?php echo Q_Response::stylesheets(true, "\n\t") ?> 
	<?php echo Q_Response::scripts(true, "\n\t") ?> 
	<style type="text/css">
		<?php echo Q_Response::stylesInline(true) ?> 
	</style>
</head>
<body>
	<?php if ($notices): ?>
		<div id="notices_slot">
			<?php echo $notices ?>
		</div>
	<?php endif; ?>
	<div id="widget_slot">
		<?php echo $widget; ?> 
	</div>
	<?php echo Q_Html::script(Q_Response::scriptLines()) ?>
</body>
</html>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"
"http://www.w3.org/TR/html4/strict.dtd">
<html <?php echo Q_Response::htmlAttributes() ?>>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title><?php echo $title ?></title>
	<link rel="shortcut icon" href="<?php echo Q_Request::proxyBaseUrl(); ?>/favicon.ico" type="image/x-icon">
	<!-- scripts have been moved to the bottom of the body -->
	<?php echo Q_Response::links(true, "\n\t") ?> 
	<?php echo Q_Response::stylesheets(true, "\n\t") ?> 
	<?php echo Q_Response::styles(true, "\n\t") ?>
</head>
<body>
	<div id="content_slot">
		
<?php echo $content; ?>

	</div>
</body>
</html>

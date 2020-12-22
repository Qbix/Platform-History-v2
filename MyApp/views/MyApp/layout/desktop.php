<!DOCTYPE html>
<html <?php echo Q_Response::htmlAttributes() ?>>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<?php echo Q_Response::metas(true, "\n\t") ?>
	
	<title id="title_slot"><?php echo $title ?></title>
	<link rel="shortcut icon" href="<?php echo Q_Request::proxyBaseUrl(); ?>/favicon.ico" type="image/x-icon">
	
	<script type="text/javascript">
		document.documentElement.className += ' Q_js'; // better than noscript
	</script>
	
	<!-- scripts have been moved to the bottom of the body -->
	<?php echo Q_Response::links(true, "\n\t") ?> 
	<?php echo Q_Response::stylesheets(true, "\n\t") ?> 
	<?php echo Q_Response::styles(true, "\n\t") ?> 
</head>
<body>
	<div id="dashboard_slot">
<!-- - - - - - - - - - - - - begin dashboard slot- - - - - - - - - - - - - - - - -->
<?php echo $dashboard ?> 
<!-- - - - - - - - - - - - - - end dashboard slot- - - - - - - - - - - - - - - - -->
	</div>
	<div id="page">
		<div id="notices_slot" class="Q_fixed_top">
<!-- - - - - - - - - - - - - - begin notices slot- - - - - - - - - - - - - - - - -->
<?php echo $notices ?> 
<!-- - - - - - - - - - - - - - end notices slot- - - - - - - - - - - - - - - - - -->
		</div>
		<div id="content_slot">
<!-- - - - - - - - - - - - - - begin content slot- - - - - - - - - - - - - - - - -->
<?php echo $content; ?> 
<!-- - - - - - - - - - - - - - - end content slot- - - - - - - - - - - - - - - - -->
		</div>
		<div id="dialogs_slot">
<!-- - - - - - - - - - - - - - begin dialogs slot- - - - - - - - - - - - - - - - -->
<?php echo $dialogs; ?> 
<!-- - - - - - - - - - - - - - - end dialogs slot- - - - - - - - - - - - - - - - -->
		</div>
	</div>
	<?php echo Q_Response::scripts(true, "\n\t") ?> 
	<?php echo Q_Response::templates(true, "\n\t") ?> 
	<?php echo Q_Response::scriptLines(true) ?> 
</body>
</html>

<fb:fbml version="1.1">
<?php Q_Response::addStylesheet("css/fbml.css")?>

<?php echo Q_Response::stylesheetsInline(true) ?> 
<?php echo Q_Response::scriptsInline(true)?> 

<div id="body">
	<div id="dashboard_slot">
		<?php echo $dashboard ?> 
	</div>
	<?php if ($notices): ?>
		<div id="notices_slot">
			<?php echo $notices ?>
		</div>
	<?php endif; ?>
	<div id="content_slot">
		<?php echo $content; ?> 
	</div>
	<br style="clear: both;">
</div>

<?php echo Q_Html::script(Q_Response::scriptLines()) ?>
<?php echo Q_html::script("Q.ready();"); ?>
	
</fb:fbml>

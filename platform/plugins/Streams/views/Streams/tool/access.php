<?php if (!$controls): ?>
	<?php echo Q::tool('Q/tabs', array(
		'tabs' => $tabs,
		'urls' => array(
			'read' => "$accessActionUrl&tab=read",
			'write' => "$accessActionUrl&tab=write",
			'admin' => "$accessActionUrl&tab=admin",
		),
		'titleClasses' => array(
			'read'   => 'basic32 basic32_view Streams_access_read_tab',
			'write'  => 'basic32 basic32_edit Streams_access_read_write',
			'admin'  => 'basic32 basic32_group Streams_access_read_admin'
		),
		'slot'      => array('controls', 'extra'),
		'defaultTabName' => 'read'
	)) ?> 
	<div class="Streams_access_controls Q_tabbed Q_document_surface">
<?php endif; ?>
		<div>
			<?php if ($tab === 'read'): ?>
				The general public can see
			<?php else: ?>
				The general public can
			<?php endif; ?>

			<select name="levelForEveryone" class="Streams_access_levelForEveryone">
				<?php echo Q_Html::options($levels, '') ?> 
			</select>
		</div>

		<?php if (count($labels) != 0): ?>
			<div>
				Grant additional access to
				<select name="levelAddLabel" class="Streams_access_levelAddLabel">
					<?php echo Q_Html::options($labels, '', null, true) ?>
				</select>
			</div>
			<table class="Streams_access_label_array"></table>
		<?php endif ?>

		<div>Custom access for individual users:</div>
		<div class="Q_big_prompt">
			<?php echo Q::tool('Streams/userChooser') ?>
		</div>
		<table class="Streams_access_user_array"></table>
<?php if (!$controls): ?>
	</div>
<?php endif; ?>
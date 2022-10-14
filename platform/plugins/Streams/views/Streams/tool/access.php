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
		<div class="Streams_access_controls_item Streams_access_general">
			<?php if ($tab === 'read'): ?>
				<div class="Streams_access_controls_caption">The general public can see</div>
			<?php else: ?>
				<div class="Streams_access_controls_caption">The general public can</div>
			<?php endif; ?>
			<div class="Streams_access_controls_config">
				<select name="levelForEveryone" class="Streams_access_levelForEveryone">
					<?php echo Q_Html::options($levels, '') ?> 
				</select>
			</div>
		</div>

		<?php if (count($labels) != 0): ?>
		<div class="Streams_access_controls_section">
			<div class="Streams_access_controls_item Streams_access_by_label">
			<div class="Streams_access_controls_caption">Grant additional access to</div>
			<div class="Streams_access_controls_config">
				<select name="levelAddLabel" class="Streams_access_levelAddLabel">
					<?php echo Q_Html::options($labels, '', null, true) ?>
				</select>
			</div>
			</div>

			<div class="Streams_access_controls_subconfig">
				<div class="Streams_access_by_table Streams_access_label_array"></div>
			</div>
		</div>
		<?php endif ?>

		<div class="Streams_access_controls_section Streams_access_by_user">
			<div class="Streams_access_controls_scaption">Custom access for individual users:</div>
			<div class="Streams_access_controls_sconfig">
				<?php echo Q::tool('Streams/userChooser') ?>
			</div>
			<div class="Streams_access_controls_subconfig">
				<div class="Streams_access_by_table Streams_access_user_array"></div>
			</div>
		</div>
<?php if (!$controls): ?>
	</div>
<?php endif; ?>
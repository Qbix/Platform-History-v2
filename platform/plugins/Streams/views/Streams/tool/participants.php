<?php /* ?>
TODO (DT): this is tmp commented because of new code for SmartApp; maybe to be removed later
Participants:
<?php foreach ($avatars as $a): ?>
	<?php echo $a->username ?>,
<?php endforeach ?>
*/ ?>
<div class="Streams_participant_list_wrapper">
	<ul class="Streams_participant_list">
		<li>
			<div class="Streams_participant_subscribed_icon"></div><br />
			<span>Subscribed</span>
		</li>
	  <?php foreach ($participants as $p): ?>
		<li>
			<?php echo Q_Html::img($p['avatar']) ?><br />
			<span><?php echo $p['name'] ?></span>
		</li>
		<?php endforeach ?>
	</ul>
</div>
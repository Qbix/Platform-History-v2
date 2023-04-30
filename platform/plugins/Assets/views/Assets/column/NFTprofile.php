<div class="Assets_NFTprofile_column">
	<!-- banner container -->
	<div class="banner-container">
		<div class="banner-block" <?php if (!empty($cover) && preg_match("/^image/", $cover["mimeType"])) { echo 'style="background-image: url('.$cover["url"].')"'; } ?>>
			<?php if (!empty($cover) && preg_match("/^video/", $cover["mimeType"])) { echo '<video autoplay loop muted src="'.$cover["url"].'"></video>'; } ?>
		</div>
		<?php echo Q::tool("Users/avatar", array(
			'userId' => $user->id,
			'editable' => $self,
			"icon" => $isMobile ? 80 : 200,
			"contents" => false
		), "profile-avatar")?>

		<?php if ($self) { ?>
			<a href="#" class="Assets_NFTprofile_logout"><?php echo $NFT["profile"]["LogOut"]; ?></a>
		<?php } ?>
	</div>

	<!-- Social icons, quick links -->
	<ul class="header-list-social">
		<li>
			<?php
			$facebook = Q::ifset($xids, 'facebook/'.$app, null);
			if ($self || $facebook) {
				echo '<i class="Communities_social_icon" data-type="facebook" data-connected="'.$facebook.'"></i>';
			}?>
		</li>
		<li>
			<?php
			$twitter = Q::ifset($xids, 'twitter/'.$app, null);
			if ($self || $twitter) {
				echo '<i class="Communities_social_icon" data-type="twitter" data-connected="'.$twitter.'"></i>';
			}
			?>
		</li>
		<li>
			<?php
			$linkedin = Q::ifset($xids, 'linkedin/'.$app, null);
			if ($self || $linkedin) {
				echo '<i class="Communities_social_icon" data-type="linkedin" data-connected="'.$linkedin.'"></i>';
			}
			?>
		</li>
		<li>
			<?php
			$github = Q::ifset($xids, 'github/'.$app, null);
			if ($self || $github) {
				echo '<i class="Communities_social_icon" data-type="github" data-connected="'.$github.'"></i>';
			}
			?>
		</li>
		<li>
			<?php
			$instagram = Q::ifset($xids, 'instagram/'.$app, null);
			if ($self || $instagram) {
				echo '<i class="Communities_social_icon" data-type="instagram" data-connected="'.$instagram.'"></i>';
			}
			?>
		</li>
	</ul>
	<div class="profile-block">
		<div class="profile-name">
			<?php echo Q::tool("Users/avatar", array(
				'userId' => $user->id,
				'editable' => $self,
				"icon" => false,
				'show' => 'u f l'
			), "profile-name")?>
		</div>

		<div class="punchline">
			<div class="Assets_NFTprofile_greeting" data-val="greeting"><?php
				echo Q::tool('Streams/inplace', array(
					'stream' => $greeting,
					'inplaceType' => 'textarea',
					'linkify' => true,
					'inplace' => array(
						'placeholder' => $profile['aboutPlaceholder'],
						'editing' => empty($greeting->content),
						'showEditButtons' => true,
						'selectOnEdit' => false
					),
					'convert' => array("\n")
				), uniqid());
				?>
			</div>
		</div>
	</div>

	<?php
	//if ($loggedInUserId && Streams::canCreateStreamType($loggedInUserId, $loggedInUserId, "Assets/NFT/contract")) {
	//echo Q::tool("Assets/NFT/contract", array("userId" => $user->id));
	//}
	?>

	<?php
	//echo Q::tool("Assets/NFT/owned", array("userId" => $user->id))
	?>

	<?php
	echo Q::tool("Assets/NFT/series", array(
		"userId" => $user->id,
		"selectedSeriesId" => $selectedSeriesId
	));
	?>
</div>
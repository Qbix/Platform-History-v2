<?php

function Streams_after_Q_objects () {
	$invite = Streams::$followedInvite;
	if (!$invite) {
		return;
	}
	$nameIsMissing = true;
	if ($user = Users::loggedInUser()) {
		$displayName = $user->displayName(array('show' => 'flu'));
		$showDialog = !$displayName;	
		$avatar = Streams_Avatar::fetch($user->id, $user->id);
		if (Q::ifset($avatar, 'username', null) || Q::ifset($avatar, 'firstName', null) || Q::ifset($avatar, 'lastName', null)) {
			$nameIsMissing = false;
		}
	} else {
		$displayName = '';
		$showDialog = true;
	}

	$text = Q_Text::get('Streams/content');
	
	$p = @compact('user', 'invite', 'displayName');
	Q::event('Streams/inviteDialog', $p, 'before', false, $showDialog);
	if (!$showDialog) {
		return;
	}

	$stream = new Streams_Stream();
	$stream->publisherId = $invite->publisherId;
	$stream->name = $invite->streamName;
	if (!$stream->retrieve()) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => 'with that name'
		), 'streamName');
	}

	// Prepare the complete invite dialog
	$invitingUser = Users_User::fetch($invite->invitingUserId);
	if ($user) {
		list($relations, $related) = Streams::related(
			$user->id,
			$stream->publisherId,
			$stream->name,
			false
		);
	}

	$templateName = Streams_Stream::getConfigField(
		$stream->type,
		array('invited', 'dialog', 'templateName'),
		'Streams/templates/invited/complete'
	);

	$invitedToProfile = ($stream->name === 'Streams/user/profile');
	$textKey = $invitedToProfile
		? 'HasInvitedYouToProfile'
		: 'HasInvitedYou';

	$params = array(
		'displayName' => $displayName,
		'nameIsMissing' => $nameIsMissing,
		'action' => 'Streams/basic',
		'icon' => $user && $user->iconUrl(false),
		'token' => $invite->token,
		'invitingUser' => array(
			'icon' => $invitingUser->iconUrl(false),
			'displayName' => $invitingUser->displayName(array(
				'fullAccess' => true,
				'show' => 'flu'
			)),
			'text' => Q::interpolate(
				$text['invite']['complete'][$textKey],
				array('title' => $stream->title)
			)
		),
		'showStreamPreview' => !$invitedToProfile,
		'templateName' => $templateName,
		'stream' => $stream->exportArray(),
		'relations' => !empty($relations) ? Db::exportArray($relations) : array(),
		'related' => !empty($related) ? Db::exportArray($related) : array()
	);

	if (Users::isCommunityId($stream->publisherId)) {
		$params['communityId'] = $stream->publisherId;
		$params['communityName'] = Streams::displayName($stream->publisherId);
	}

	$config = Streams_Stream::getConfigField($stream->type, 'invite', array());
	$defaults = Q::ifset($config, 'dialog', array());
	$tree = new Q_Tree($defaults);
	if ($tree->merge($params)) {
		$dialogData = $tree->getAll();
		if ($dialogData) {
			Q_Response::setScriptData('Q.plugins.Streams.invited.dialog', $dialogData);
			Q_Response::addTemplate($templateName);
		}
	}
}

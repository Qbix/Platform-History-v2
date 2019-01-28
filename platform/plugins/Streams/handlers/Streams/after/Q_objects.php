<?php

function Streams_after_Q_objects () {
	$invite = Streams::$followedInvite;
	if (!$invite) {
		return;
	}
	if ($user = Users::loggedInUser()) {
		$displayName = $user->displayName(array('show' => 'flu'));
		$showDialog = !$displayName;	
		$nameIsMissing = true;
		$avatar = new Streams_Avatar(array(
			'toUserId' => $user->id,
			'publisherId' => $user->id
		));
		if ($avatar->fetch()) {
			if ($avatar->username or $avatar->firstName or $avatar->lastName) {
				$nameIsMissing = false;
			}
		}
	} else {
		$displayName = '';
		$showDialog = true;
	}
	
	$p = compact('user', 'invite', 'displayName');
	Q::event('Streams/inviteDialog', $p, 'before', false, $showDialog);
	if (!$showDialog) {
		return;
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

	$stream = new Streams_Stream();
	$stream->publisherId = $invite->publisherId;
	$stream->name = $invite->streamName;
	if (!$stream->retrieve()) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => 'with that name'
		), 'streamName');
	}
	
	$templateName = Streams_Stream::getConfigField(
		$stream->type,
		array('invited', 'dialog', 'templateName'),
		'Streams/invited/complete'
	);
	$params = array(
		'displayName' => $displayName,
		'nameIsMissing' => $nameIsMissing,
		'action' => 'Streams/basic',
		'icon' => $user->iconUrl(),
		'token' => $invite->token,
		'invitingUser' => array(
			'icon' => $invitingUser->iconUrl(),
			'displayName' => $invitingUser->displayName(array(
				'fullAccess' => true,
				'show' => 'flu'
			))
		),
		'templateName' => $templateName,
		'stream' => $stream->exportArray(),
		'relations' => $relations ? Db::exportArray($relations) : array(),
		'related' => $related ? Db::exportArray($related) : array()
	);

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

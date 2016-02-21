<?php

function Streams_after_Q_objects () {
	$user = Users::loggedInUser();
	if (!$user) return;
	$invite = Streams::$followedInvite;
	if (!$invite) return;
	$displayName = $user->displayName();
	if ($displayName) return;

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
	list($relations, $related) = Streams::related(
		$user->id,
		$stream->publisherId,
		$stream->name,
		false
	);
	
	$params = array(
		'displayName' => null,
		'action' => 'Streams/basic',
		'icon' => $user->iconUrl(),
		'token' => $invite->token,
		'user' => array(
			'icon' => $invitingUser->iconUrl(),
			'displayName' => $invitingUser->displayName(array('fullAccess' => true))
		),
		'stream' => $stream->exportArray(),
		'relations' => Db::exportArray($relations),
		'related' => Db::exportArray($related)
	);

	$config = Streams_Stream::getConfigField($stream->type, 'invite', array());
	$defaults = Q::ifset($config, 'dialog', array());
	$tree = new Q_Tree($defaults);
	if ($tree->merge($params)) {
		$dialogData = $tree->getAll();
		if ($dialogData) {
			Q_Response::setScriptData('Q.plugins.Streams.invite.dialog', $dialogData);
			Q_Response::addTemplate('Streams/invite/complete');
		}
	}
}

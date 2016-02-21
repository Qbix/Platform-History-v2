<?php

function Streams_invite_response_data () {
	if (isset(Streams::$cache['invited'])) {
		return Streams::$cache['invited'];
	}

	$user = Users::loggedInUser(true);

	$publisherId = Streams::requestedPublisherId();
	$streamType = Streams::requestedType();
	$invitingUserId = Streams::requestedField('invitingUserId');

	$limit = Q::ifset($_REQUEST, 'limit', 
		Q_Config::get('Streams', 'invites', 'limit', 100)
	);
	$invited = Streams_Invited::select('*')->where(array(
		'userId' => $user->id,
		'state' => 'pending',
		'expireTime <' => new Db_Expression('CURRENT_TIMESTAMP')
	))->limit($limit)
	->fetchDbRows(null, null, 'token');
	
	$query = Streams_Invite::select('*')->where(array(
		'token' => array_keys($invited)
	));
	if (isset($publisherId)) $query = $query->where(array(
		'publisherId' => $publisherId
	));
	if (isset($streamType)) $query = $query->where(array(
		'streamName' => new Db_Range($streamType.'/', true, false, true)
	));
	if (isset($invitingUserId)) $query = $query->where(array(
		'invitingUserId' => $invitingUserId
	));
	$invites = $query->fetchDbRows();

	$streams = array();
	foreach ($invites as $invite) {
		$stream = new Streams_Stream();
		$stream->publisherId = $invite->publisherId;
		$stream->name = $invite->streamName;
		if ($stream->retrieve()) {
			$streams[$invite->token] = $stream->exportArray();
			$streams[$invite->token]['displayName'] = $invite->displayName;
		}
	}
	return compact('streams', 'invites');
}
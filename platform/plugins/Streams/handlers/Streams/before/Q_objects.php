<?php

function Streams_before_Q_objects()
{
	$token = Q_Request::special('Streams.token', null);
	if ($token === null) {
		$field = Q_Config::get('Streams', 'token', 'field', null);
		$token = Q::ifset($_REQUEST, $field, null);
		if ($token === null) {
			return;
		}
	}
	
	static $alreadyExecuted = false;
	if ($alreadyExecuted) {
		return; // this can happen during e.g. Q_Response::forward()
	}
	$alreadyExecuted = true;

	$invite = Streams_Invite::fromToken($token, true);
	
	// did invite expire?
	$ts = Streams_Invite::db()->select("CURRENT_TIMESTAMP")->fetchAll(PDO::FETCH_NUM);
	if (isset($invite->expireTime)
	and $invite->expireTime < $ts[0][0]) {
		$invite->state = 'expired';
		$invite->save();
	}
	
	// retain the invite object for further processing
	Streams::$followedInvite = $invite;
	
	// is invite still pending?
	if ($invite->state !== 'pending') {
		$exception = null;
		switch ($invite->state) {
		case 'accepted':
			break;
		case 'expired':
			$exception = new Streams_Exception_AlreadyExpired(null, 'token');
			break;
		case 'declined':
			$exception = new Streams_Exception_AlreadyDeclined(null, 'token');
			break;
		case 'forwarded':
			$exception = new Streams_Exception_AlreadyForwarded(null, 'token');
			break;
		case 'claimed':
			$exception = new Streams_Exception_AlreadyC(null, 'token');
			break;
		default:
			$exception = new Q_Exception("This invite has already been " . $invite->state, 'token');
			break;
		}
		if ($exception) {
			$shouldThrow = Q::event('Streams/objects/inviteException', 
				@compact('invite', 'exception'), 'before'
			);
			if ($shouldThrow === null) {
				Q_Response::setNotice('Streams/objects', $exception->getMessage());
			} else if ($shouldThrow === true) {
				throw $exception;
			}
		}
	}
	
	$liu = Users::loggedInUser();	
	if ($invite->userId and (!$liu or $liu->id !== $invite->userId)) {
		// log the invited user in, suddenly
		$user = new Users_User();
		$user->id = $invite->userId;
		if (!$user->retrieve()) {
			// The user who was invited doesn't exist
			// This shouldn't happen. We just silently log it and return.
			Q::log("Sanity check failed: invite with {$invite->token} pointed to nonexistent user");
			return;
		}
		Users::setLoggedInUser($user);
	}
	
	if (!$liu and !$invite->userId) {
		// schedule the invite to be accepted after the user logs in
		$_SESSION['Streams']['invite']['token'] = $token;
		// tell Users plugin we have an icon ready for a certain user
		$splitId = Q_Utils::splitId($invite->invitingUserId, 3, "/");
		$path = 'Q/uploads/Users';
		$subpath = $splitId.'/invited/'.$token;
		$pathToToken = APP_DIR.'/web/'.$path.'/'.$subpath;
		Q_Utils::normalizePath($pathToToken);
		if (file_exists($pathToToken)) {
			$_SESSION['Users']['register']['icon'] = Q_Html::themedUrl(
				$path.DS.$subpath,
				array("baseUrlPlaceholder" => true)
			);
		}
		return;
	}
	
	// accept invite and autosubscribe if first time and possible
	if ($invite->accept(array(
		'access' => true,
		'subscribe' => true
	)));
}

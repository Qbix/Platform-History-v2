<?php
	
function Streams_after_Users_setLoggedInUser($params)
{
	$user = $params['user'];
	if ($token = Q::ifset($_SESSION, 'Streams', 'invite', 'token', null)) {
		$invite = Streams_Invite::fromToken($token);
		// accept invite and autosubscribe if first time and possible
		if ($invite and $invite->accept(array(
			'access' => true,
			'subscribe' => true
		)));
		unset($_SESSION['Streams']['invite']['token']);
		$splitId = Q_Utils::splitId($invite->invitingUserId);
		$path = 'Q/uploads/Users';
		$subpath = $splitId.'/invited/'.$token;
		$pathToToken = APP_DIR.'/web/'.$path.DS.$subpath;
		Q_Utils::normalizePath($pathToToken);
		if (file_exists($pathToToken) && $user->icon != $subpath && !Users::isCustomIcon($user->icon)) {
			$user->icon = Q_Html::themedUrl("$path/$subpath");
			$user->save();
		}
	}

	// if this the first time the user has ever logged in...
	if ($user->sessionCount != 1) {
		return;
	}
	
	// subscribe to main community announcements
	$communityId = Users::communityId();
	$stream = Streams::fetchOne($user->id, $communityId, 'Streams/experience/main');
	if ($stream and !$stream->subscription($user->id)) {
		$stream->subscribe();
	}
}
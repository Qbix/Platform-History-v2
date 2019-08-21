<?php
	
function Users_after_Q_init()
{
	// if app in preview mode
	if (!Q_Config::get('Q', 'appInfo', 'previewMode', false)) {
		return;
	}

	if (!Users::loggedInUser()) {
		// find first valid user and login
		$users = Users_User::select()
			->where(array(
				'signedUpWith !=' => 'none'
			))
			->orderBy('insertedTime', false)
			->limit(1000, 0)
			->fetchDbRows();
		foreach ($users as $user) {
			if (Users::isCommunityId($user->id)) {
				continue;
			}

			Users::setLoggedInUser($user);
			break;
		}
	}
}
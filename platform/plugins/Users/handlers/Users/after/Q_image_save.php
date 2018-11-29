<?php

function Users_after_Q_image_save($params, &$return)
{
	extract($params);
	/**
	 * @var string $path
	 * @var string $subpath
	 * @var Users_User $user
	 */
	$user = Users::loggedInUser(true);

	$fullpath = $path.($subpath ? DS.$subpath : '');
	Q_Utils::normalizePath($fullpath);

	$splitId = Q_Utils::splitId($user->id);
	$prefix = "Q/uploads/Users/$splitId/icon";
	Q_Utils::normalizePath($prefix);

	if (substr($fullpath, 0, strlen($prefix)) === $prefix) { // modification of logged user icon
		if ($user->icon != $subpath) {
			$user->icon = Q_Html::themedUrl("$path/$subpath");
			$user->save(); // triggers any registered hooks
			Users::$cache['iconUrlWasChanged'] = true;
		} else {
			Users::$cache['iconUrlWasChanged'] = false;
		}
	} else { // modification of another user
		// trying to fetch userId from subpath
		$anotherUserId = preg_replace('/\/icon.*/', '', $subpath);
		$anotherUserId = preg_replace('/\//', '', $anotherUserId);

		$anotherUser = Users_User::fetch($anotherUserId, false);

		if (!$anotherUser) {
			return;
		}

		$permitted = array_keys(Users::byRoles(array("Communities/admins", "Users/owners")));

		// check whether logged user have permissiosn to change icon of another user
		if (in_array($anotherUserId, $permitted)) {
			if ($anotherUser->icon != $subpath) {
				$anotherUser->icon = Q_Html::themedUrl("$path/$subpath");
				$anotherUser->save(); // triggers any registered hooks
				Users::$cache['iconUrlWasChanged'] = true;
			} else {
				Users::$cache['iconUrlWasChanged'] = false;
			}
		} else {
			throw new Users_Exception_NotAuthorized();
		}
	}
}
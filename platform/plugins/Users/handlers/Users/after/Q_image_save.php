<?php

function Users_after_Q_image_save($params, &$return)
{
	extract($params);
	/**
	 * @var string $path
	 * @var string $subpath
	 * @var Users_User $user
	 */
	$user = Q::ifset(Users::$cache, 'user', Users::loggedInUser(false, false));
	if (!$user) {
		return;
	}

	$fullpath = $path.($subpath ? DS.$subpath : '');
	Q_Utils::normalizePath($fullpath);

	$splitId = Q_Utils::splitId($user->id);
	$prefix = "Q/uploads/Users/$splitId";
	Q_Utils::normalizePath($prefix);

	if (Q::startsWith($fullpath, $prefix)) {
		$iconPrefix = "Q/uploads/Users/$splitId/icon";
		$invitePrefix = "Q/uploads/Users/$splitId/invited";
		Q_Utils::normalizePath($iconPrefix);
		Q_Utils::normalizePath($invitePrefix);
		if (Q::startsWith($fullpath,$iconPrefix)) {
			// modification of logged user icon
			if ($user->icon != $subpath) {
				$user->icon = Q_Html::themedUrl("$path/$subpath", array(
					'baseUrlPlaceholder' => true
				));
				$user->save(); // triggers any registered hooks
				Users::$cache['iconUrlWasChanged'] = true;
			} else {
				Users::$cache['iconUrlWasChanged'] = false;
			}
		} else if (Q::startsWith($fullpath, $invitePrefix)) {
			$token = preg_replace('/.*\/invited\//', '', $subpath);
			$invites = Streams_Invite::select()->where(
				array('token' => $token, 'state' => 'accepted'
			))->fetchDbRows();
			if (!empty($invites)) {
				$user = Users::fetch($invites[0]->userId);
				if ($user and $user->icon != $subpath
				and !Users::isCustomIcon($user->icon)) {
					$user->icon = Q_Html::themedUrl("$path/$subpath");
					$user->save();
				}
			}
		}
	} else if (Q::startsWith($fullpath, implode(DS, array('Q', 'uploads', 'Users')))) {
		// modification of another user
		// trying to fetch userId from subpath
		$anotherUserId = preg_replace('/\/icon.*/', '', $subpath);
		$anotherUserId = preg_replace('/\//', '', $anotherUserId);

		$anotherUser = Users_User::fetch($anotherUserId, false);

		if (!$anotherUser) {
			return;
		}

		// label can manage icons of other users
		$labelsCanManage = Q_Config::get("Users", "icon", "canManage", array());

		// whether logged user assigned as one of $labelsCanManage to $anotherUser
		$permitted = Users_Contact::select()->where(array(
			'userId' => $anotherUserId,
			'label' => $labelsCanManage,
			'contactUserId' => $user->id
		))->fetchDbRows();
		
		if ($permitted) {
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

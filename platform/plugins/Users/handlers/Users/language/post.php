<?php

/**
 * @module Users
 */

/**
 * Modify users preferred language
 * @class HTTP Users language
 * @method POST/language
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.language New language selected
 * @throws
 */
function Users_language_post($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Request::requireFields(array('language'), $req, true);
	$language = Q::ifset($req, 'language', null);
	$list = array_keys(Q_Config::expect('Q', 'web', 'languages'));

	$loggedInUser = Users::loggedInUser(true);
	if (!empty($language)) {
		if (!in_array($language, $list)) {
			// throw exception in the user's language
			throw new Q_Exception_InvalidLanguage(compact('language'));
		}
		$loggedInUser->preferredLanguage = $language;
		$loggedInUser->save();
	}

	Q_Response::setSlot('result', true);
}
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
	$loggedInUser = Users::loggedInUser(true);
	$language = Q::ifset($req, 'language', null);
	$list = array_keys(Q_Config::expect('Q', 'web', 'languages'));

	if (empty($language) || !in_array($language, $list)) {
		$text = Q_Text::get("Users/content", array('language' => $loggedInUser->preferredLanguage));
		throw new Exception($text['invalidLanguageSelected']);
	}

	$loggedInUser->preferredLanguage = $language;
	$loggedInUser->save();

	Q_Response::setSlot('result', true);
}
<?php

/**
 * @module Users
 */

/**
 * Modify users preferred language
 * @class HTTP Users language
 * @method POST/language
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.newLang New language selected
 * @throws
 */
function Users_language_post($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Request::requireFields(array('newLang'), $req, true);
	$loggedInUser = Users::loggedInUser(true);
	$newLang = Q::ifset($req, 'newLang', null);
	$list = array_keys(Q_Config::expect('Q', 'web', 'languages'));

	if (empty($newLang) || !in_array($newLang, $list)) {
		$text = Q_Text::get("Users/content", array('language' => $loggedInUser->preferredLanguage));
		throw new Exception($text['invalidLanguageSelected']);
	}

	$loggedInUser->preferredLanguage = $newLang;
	$loggedInUser->save();

	Q_Response::setSlot('result', true);
}
<?php

function Users_activate_response_content()
{
	$email = $mobile = $type = $user = $emailAddress = $mobileNumber = null;
	extract(Users::$cache, EXTR_IF_EXISTS);

	$complete = false;
	if ($user and !empty($user->passphraseHash)) {
		if ($emailAddress and $user->emailAddress == $emailAddress) {
			$complete = true;
		} else if ($mobileNumber and $user->mobileNumber = $mobileNumber) {
			$complete = true;
		}
	}
	
	if (!empty(Users::$cache['success'])) {
		$app = Q::app();
		$successUrl = Q_Config::get('Users', 'uris', "$app/successUrl", "$app/home");
		if (Q_Request::method() === 'POST') {
			if ($qs = $_SERVER['QUERY_STRING']) {
				$qs = "&$qs";
			}
			Q_Response::redirect(
				Q_Config::get('Users', 'uris', "$app/afterActivate", $successUrl)
				.'?Q.fromSuccess=Users/activate'.$qs
			);
			return true;
		}
	}
	
	$view = Q_Config::get('Users', 'activateView', 'Users/content/activate.php');
	$t = $email ? 'e' : 'm';
	$identifier = $email ? $emailAddress : $mobileNumber;

	// Generate 10 passphrase suggestions
	$suggestions = array();
	$arr = include(USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'passphrases.php');
	for ($i=0; $i<10; ++$i) {
		$pre1 = $arr['pre'][random_int(0, count($arr['pre'])-1)];
		$noun1 = $arr['nouns'][random_int(0, count($arr['nouns'])-1)];
		$verb = $arr['verbs'][random_int(0, count($arr['verbs'])-1)];
		$pre2 = $arr['pre'][random_int(0, count($arr['pre'])-1)];
		$adj = $arr['adjectives'][random_int(0, count($arr['adjectives'])-1)];
		$noun2 = $arr['nouns'][random_int(0, count($arr['nouns'])-1)];
		//$suggestions[] = strtolower("$pre1 $noun1 $verb $pre2 $adj $noun2");
		$suggestions[] = strtolower("$pre1 $noun1 $verb $pre2 $noun2");
	}
	$verb_ue = urlencode($arr['verbs'][random_int(0, count($arr['verbs']) - 1)]);
	$noun_ue = urlencode($arr['nouns'][random_int(0, count($arr['nouns']) - 1)]);
	$code = Q::ifset($_REQUEST['code']);
	
	if ($key = Q_Config::get('Users', 'newsapi', 'key', null)) {
		$words = 3;
		try {
			$languages = array();
			foreach (Q_Request::languages() as $entry) {
				$languages[reset($entry)] = true;
			}
			$json = file_get_contents("https://newsapi.org/v1/sources");
			$result = Q::json_decode($json, true);
			$sources = array();
			$fallback = array();
			if (isset($result['sources'])) {
				foreach ($result['sources'] as $source) {
					if (isset($languages[$source['language']])) {
						$sources[] = $source['id'];
					}
					if ($source['language'] === 'en') {
						$fallback[] = $source['id'];
					}
				}
			}
			if (!$sources) {
				$sources = $fallback;
			}
			$suggestions2 = array();
			if ($sources) {
				$rand = rand() % count($sources);
				$url = "https://newsapi.org/v1/articles?" . http_build_query(array(
					'source' => $sources[$rand],
					'sortBy' => 'latest',
					'apiKey' => $key
				));
				$json = file_get_contents($url);
				$result = Q::json_decode($json, true);
				if (isset($result['articles'])) {
					foreach ($result['articles'] as $article) {
						$characters = "/([^A-Za-z0-9-']|\\s{2,})+/";
						$text = strtolower(
							preg_replace($characters, ' ', $article['description'])
						);
						$parts = explode(' ', $text);
						$count = count($parts);
						if ($count > $words) {
							$rand = rand() % ($count - $words);
							$suggestion = implode(' ', array_slice($parts, $rand, $words));
							if (strlen($suggestion) > 10) {
								$suggestions2[] = $suggestion;
							}
						}
					}
				}
			}
			if ($suggestions2) {
				$suggestions = $suggestions2;
			}
		} catch (Exception $e) {
			// ignore it
		}
		
	}

	Q_Response::addScriptLine("Q.onReady.set(function () {
		if (Q.Notice) {
			Q.Notice.hide('Users/email');
			Q.Notice.hide('Users/mobile');
		}
	});"); // shh! not while I'm activating! lol
	
	return Q::view($view, compact(
		'identifier', 'type', 'user', 'code',
		'suggestions', 'verb_ue', 'noun_ue', 't', 'app', 'home', 'complete'
	));
}
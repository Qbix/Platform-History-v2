<?php

function Users_before_Q_objects(&$params)
{
	$app = Q::app();

	// We sometimes pass this in the request, for browsers like Safari
	// that don't allow setting of cookies using javascript inside 3rd party iframes
	
	if ($authResponse = Q_Request::special('Users.facebook.authResponse', null)) {
		$appId = Q::ifset($authResponse, 'appId', $app);
		Users_ExternalFrom_Facebook::authenticate($appId);
	}

	$uri = Q_Dispatcher::uri();
	$actions = array('activate' => true);
	if ($uri->module === 'Users' and isset($actions[$uri->action])) {
		Q::event("Users/{$uri->action}/objects");
	}
	
	// Fire an event for hooking into, if necessary
	Q::event('Users/objects', array(), 'after');
	
	if ($user = Users::loggedInUser(false, false)
	and $user->preferredLanguage
	and Q_Config::get('Users', 'login', 'setLanguage', true)
	and !Q_Request::special('language')) {
		Q_Text::setLanguage($user->preferredLanguage);
	}

	if ($sigField = Q_Config::get('Users', 'signatures', 'sigField', null)
	and !empty($_SESSION['Users']['publicKey'])) {
		$rl = Q_Config::get('Users', 'requireLogin', array());
		foreach ($rl as $k => $v) {
			$uri = Q_Uri::from($k);
			$duri = Q_Dispatcher::uri();
			if (($uri->module != '*' and $uri->module = $duri->module)
			or ($uri->action != '*' and $uri->action = $duri->action)) {
				continue;
			}

			$sigField = str_replace('.', '_', $sigField);
			$nonceField = Q_Config::get('Users', 'signatures', 'nonceField', null);
			if ($nonceField) {
				Q_Valid::requireFields(array($nonceField), $_POST, true);
				$nonce = $_POST[$nonceField];
				$prevNonce = Q::ifset($_SESSION, 'Users', 'nonce', 0);
				if ($nonce <= $prevNonce) {
					throw new Q_Exception_WrongValue(array(
						'field' => $nonceField,
						'range' => "something > $prevNonce"
					));
				}
				$_SESSION['Users']['nonce'] = $nonce;
				// session will probably be saved, unless transaction is rolled back
			}

			// validate the signature on the request
			$payload = $_POST;
			$signature = Q::ifset($payload, $sigField, null);
			if (empty($signature)) {
				throw new Users_Exception_MissingSignature();
			}
			if (is_array($signature)) {
				if (!empty($signature['fieldNames'])) {
					$nf = Q_Config::get('Users', 'signatures', 'nonceField', null);
					if (!in_array($nf, $signature['fieldNames'])) {
						$signature['fieldNames'][] = $nf;
					}
					$payload = Q::take($payload, $signature['fieldNames']);
				}
				Q_Valid::requireFields(array('signature'), $signature, true);
				$signature = $signature['signature'];
			}
			try {
				if (Users::verify($payload, $signature, true) === false) {
					throw new Users_Exception_NotAuthorized();
				}
			} catch (Q_Exception_MissingPHPVersion $e) {
				// we can't check the signature because PHP is too old,
				// so we can silently exit, or write to the log
				// SECURITY: inform the admins to update their PHP
			}
			break; // we already checked, once is enough
		}
	}

	// If app is in preview mode (for screenshots) and user is not logged in
	if (!$user and Q_Config::get('Users', 'previewMode', false)) {
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

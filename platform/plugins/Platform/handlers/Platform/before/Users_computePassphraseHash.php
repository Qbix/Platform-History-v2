<?php

function Platform_before_Users_computePassphraseHash ($params) {
	$user = $params['user'];
	$passphrase = $params['passphrase'];
	$isHashed = $params['isHashed'];
	$appRootUrl = Q_Config::get("Platform", "appRootUrl", Q_Config::expect("Q", "web", "appRootUrl"));
	if (!$isHashed) {
		$passphrase = sha1($passphrase . "\t" . $appRootUrl . "\t" . $user->id);
	}
	return Users::hashPassphrase($passphrase, $user->passphraseHash);
}
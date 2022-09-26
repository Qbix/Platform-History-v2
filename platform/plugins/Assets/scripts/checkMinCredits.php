<?php
date_default_timezone_set('UTC');
ini_set('max_execution_time', 0);

$FROM_APP = defined('RUNNING_FROM_APP'); //Are we running from app or framework?

if(!$FROM_APP) {
	die(PHP_EOL.PHP_EOL.'this script should be called from application');
}

$creditsStreams = Streams_Stream::select()->where(array(
	"name" => "Assets/user/credits"
))->fetchDbRows();

foreach ($creditsStreams as $creditsStream) {
	if (Users::isCommunityId($creditsStream->publisherId)) {
		continue;
	}

	echo "Processing user: ".$creditsStream->publisherId."\n";

	$user = Users::fetch($creditsStream->publisherId);
	$creditsAmount = $creditsStream->getAttribute("amount");
	$creditsMin = (int)$creditsStream->getAttribute("creditsMin") ?: Q_Config::expect("Assets", "credits", "amount", "min");
	$creditsAdd = (int)$creditsStream->getAttribute("creditsAdd") ?: Q_Config::expect("Assets", "credits", "amount", "add");

	if ($creditsAmount > $creditsMin) {
		continue;
	}

	try {
		Assets::charge("stripe", Assets_Credits::convert($creditsAmount + $creditsAdd, 'credits', 'USD'), 'USD', array(
			'user' => $user,
			'description' => 'check min credits'
		));
	} catch(Exception $e) {
		$creditsStream->post($asUserId, array(
			'type' => 'Assets/credits/alert',
			'instructions' => array(
				'userId' => $user->id,
				'displayName' => $user->displayName(),
				'link' => Q_Uri::url(Q_Config::get("Assets", "credits", "buyLink", "Communities/me"))
			)
		), true);
	}
}

<?php
date_default_timezone_set('UTC');
ini_set('max_execution_time', 0);

$FROM_APP = defined('RUNNING_FROM_APP'); //Are we running from app or framework?

if(!$FROM_APP) {
	die(PHP_EOL.PHP_EOL.'this script should be called from application');
}

$offset = 0;
$limit = 10;
$i = 0;
while (1) {
	$creditsStreams = Streams_Stream::select()->where(array(
		"name" => "Assets/user/credits"
	))->limit($limit, $offset)->fetchDbRows();

	if (!$creditsStreams) {
		break;
	}

	foreach ($creditsStreams as $creditsStream) {
		if (Users::isCommunityId($creditsStream->publisherId)) {
			continue;
		}

		echo ++$i.". Processing user: ".$creditsStream->publisherId."\n";

		$user = Users::fetch($creditsStream->publisherId);
		$communityId = Users::communityId();
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
			$link = Q_Uri::url(Q_Config::expect("Assets", "credits", "buyLink"));
			$text = Q_Text::get("Assets/content");
			$messageType = 'Assets/credits/alert';
			$creditsStream->post($communityId, array(
				'type' => $messageType,
				'content' => Q::interpolate($text["messages"][$messageType]['content'], @compact("link")),
				'instructions' => array(
					'messageId' => uniqid(),
					'userId' => $user->id,
					'displayName' => $user->displayName(),
					'link' => $link,
					'timeout' => Q_Config::expect("Streams", "types", "Assets/credits", "messages", $messageType, "Q/notice", "timeout")
				)
			), true);
		}
	}
	$offset += $limit;
};
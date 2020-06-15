<?php
function Assets_credits_post($params = array())
{
    $req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('amount', 'currency'), $req, true);

	$loggedUserId = Users::loggedInUser(true)->id;
	$rate = (float)Q_Config::expect('Assets', 'credits', 'exchange', $req['currency']);
	$amount = (float)$req['amount'];
	$credits = (int)Assets_Credits::amount();
	$needCredits = $rate * $amount;

	if ($credits < $needCredits) {
		Q_response::setSlot('status', false);
		Q_response::setSlot('details', compact("credits", "needCredits"));
		return;
	}

	// if stream defined
	$publisherId = Q::ifset($req, 'publisherId', null);
	$streamName = Q::ifset($req, 'streamName', null);
	$userId = Q::ifset($req, 'userId', null);
	$reason = Q::ifset($req, 'reason', null);
	$texts = Q_Text::get('Assets/content');

	if ($publisherId and $streamName) {
		$stream = Streams::fetchOne(null, $publisherId, $streamName);
		$reason = $reason ?: Q::interpolate($texts['credits']['PaymentFor'], array($stream->title));

		Assets_Credits::send($needCredits, $publisherId, $loggedUserId, compact("reason"));
	} elseif ($userId) {
		$reason = $reason ?: Q::interpolate($texts['credits']['PaymentTo'], array($userId));

		Assets_Credits::send($needCredits, $userId, $loggedUserId, compact("reason"));
	}

	Q_response::setSlot('status', true);
	Q_response::setSlot('details', compact("credits", "needCredits", "reason"));
}
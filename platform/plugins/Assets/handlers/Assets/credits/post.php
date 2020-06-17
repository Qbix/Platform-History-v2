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
		$needCredits = $needCredits - $credits;
		Q_response::setSlot('status', false);
		Q_response::setSlot('details', compact("credits", "needCredits"));
		return;
	}

	// if stream defined
	$publisherId = Q::ifset($req, 'stream', 'publisherId', null);
	$streamName = Q::ifset($req, 'stream', 'streamName', null);
	$userId = Q::ifset($req, 'userId', null);

	if ($publisherId && $streamName) {
		Assets_Credits::spend($needCredits, 'JoinPaidStream', $loggedUserId, compact("publisherId", "streamName"));
	} elseif ($userId) {
		Assets_Credits::send($needCredits,'PaymentToUser', $userId, $loggedUserId);
	}

	Q_response::setSlot('status', true);
	Q_response::setSlot('details', compact("credits", "needCredits"));
}
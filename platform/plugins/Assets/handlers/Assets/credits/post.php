<?php
function Assets_credits_post($params = array())
{
    $req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('amount', 'currency'), $req, true);

	$loggedUserId = Users::loggedInUser(true)->id;
	$amount = (float)$req['amount'];
	$credits = (int)Assets_Credits::amount();
	$needCredits = $req['currency'] == "credits" ? $amount : Assets_Credits::convertToCredits($amount, $req['currency']);

	if ($credits < $needCredits) {
		$needCredits = $needCredits - $credits;
		Q_response::setSlot('status', false);
		Q_response::setSlot('details', compact("credits", "needCredits"));
		return;
	}

	// if stream defined
	$toPublisherId = Q::ifset($req, 'toStream', 'publisherId', null);
	$toStreamName = Q::ifset($req, 'toStream', 'streamName', null);
	$userId = Q::ifset($req, 'userId', null);
	$items = Q::ifset($req, 'items', null);

	// convert amount to credits in items
	if ($items) {
		foreach ($items as $key => $item) {
			$items[$key]['amount'] = Assets_Credits::convertToCredits($item['amount'], $req['currency']);
		}
	}

	if ($toPublisherId && $toStreamName) {
		$reason = Q::ifset($req, 'reason', Assets::JOINED_PAID_STREAM);
		Assets_Credits::spend($needCredits, $reason, $loggedUserId, compact(
			"toPublisherId", "toStreamName", "items"
		));
	} elseif ($userId) {
		$reason = Q::ifset($req, 'reason', Assets::PAYMENT_TO_USER);
		Assets_Credits::send($needCredits, $reason, $userId, $loggedUserId, compact(
			"toPublisherId", "toStreamName", "items"
		));
	}

	Q_response::setSlot('status', true);
	Q_response::setSlot('details', compact("credits", "needCredits"));
}
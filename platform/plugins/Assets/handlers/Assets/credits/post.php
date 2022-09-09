<?php
function Assets_credits_post($params = array(), $securedParams = array())
{
    $req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('amount', 'currency'), $req, true);

	$loggedUserId = Q::ifset($securedParams, "loggedUserId", Users::loggedInUser(true)->id);
	$user = Users::fetch($loggedUserId);
	$amount = (float)$req['amount'];
	$credits = (int)Assets_Credits::amount($loggedUserId);
	$currency = $req['currency'];
	$needCredits = $currency == "credits" ? $amount : (int)Assets_Credits::convert($amount, $currency, "credits");

	if ($credits < $needCredits) {
		Q_response::setSlot('status', false);
		Q_response::setSlot('details', array(
			"credits" => $credits,
			"needCredits" => $needCredits - $credits
		));
		return;
	}

	// if stream defined
	$toPublisherId = Q::ifset($req, 'toStream', 'publisherId', null);
	$toStreamName = Q::ifset($req, 'toStream', 'streamName', Q::ifset($req, 'toStream', 'name', null));
	$toUserId = Q::ifset($req, 'toUserId', null);
	$items = Q::ifset($req, 'items', null);

	// convert amount to credits in items
	if ($items) {
		foreach ($items as $key => $item) {
			$items[$key]['amount'] = Assets_Credits::convert($item['amount'], $currency, "credits");
		}
	}

	if ($toPublisherId && $toStreamName) {
		$reason = Q::ifset($req, 'reason', Assets::JOINED_PAID_STREAM);
		Assets_Credits::spend($needCredits, $reason, $loggedUserId, @compact(
			"toPublisherId", "toStreamName", "items"
		));
	} elseif ($toUserId) {
		$reason = Q::ifset($req, 'reason', Assets::PAYMENT_TO_USER);
		Assets_Credits::send($needCredits, $reason, $toUserId, $loggedUserId, @compact(
			"toPublisherId", "toStreamName", "items"
		));
	}

	Q_response::setSlot('status', true);
	Q_response::setSlot('details', @compact("credits", "needCredits"));
}
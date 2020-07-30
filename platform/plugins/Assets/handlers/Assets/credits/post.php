<?php
function Assets_credits_post($params = array())
{
    $req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array('amount', 'currency'), $req, true);

	$loggedUserId = Users::loggedInUser(true)->id;
	$amount = (float)$req['amount'];
	$credits = (int)Assets_Credits::amount();
	$needCredits = Assets_Credits::convertToCredits($amount, $req['currency']);

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
	$paymentDetails = Q::ifset($req, 'paymentDetails', null);

	// convert amount to credits in paymentDetails
	if ($paymentDetails) {
		foreach ($paymentDetails as $key => $item) {
			$paymentDetails[$key]['amount'] = Assets_Credits::convertToCredits($item['amount'], $req['currency']);
		}
	}

	if ($toPublisherId && $toStreamName) {
		Assets_Credits::spend($needCredits, 'JoinPaidStream', $loggedUserId, compact(
			"toPublisherId", "toStreamName", "paymentDetails"
		));
	} elseif ($userId) {
		Assets_Credits::send($needCredits,'PaymentToUser', $userId, $loggedUserId, compact(
			"toPublisherId", "toStreamName", "paymentDetails"
		));
	}

	Q_response::setSlot('status', true);
	Q_response::setSlot('details', compact("credits", "needCredits"));
}
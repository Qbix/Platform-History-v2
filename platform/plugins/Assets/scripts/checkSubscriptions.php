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
	$subscriptionStreams = Streams_Stream::select()->where(array(
		"type" => "Assets/subscription",
		"closedTime" => null
	))->limit($limit, $offset)->fetchDbRows();

	if (empty($subscriptionStreams)) {
		break;
	}

	foreach ($subscriptionStreams as $subscriptionStream) {
		if (Users::isCommunityId($subscriptionStream->publisherId)) {
			continue;
		}

		echo ++$i.". Processing user: ".$subscriptionStream->publisherId.PHP_EOL;

		try {
			$user = Users::fetch($subscriptionStream->publisherId, true);
			$plan = Assets_Subscription::getPlan($subscriptionStream);
			if ($plan->closedTime) {
				echo $plan->title." subscription plan closed ".PHP_EOL;

				// if Assets/plan closed, subscription stream should be closed too
				$subscriptionStream->close($subscriptionStream->publisherId);
				continue;
			}

			if ($plan->getAttribute("interrupted")) {
				echo "Plan ".$plan->title." interrupted";
				continue;
			}

			if (Assets_Subscription::isAdmin($subscriptionStream->publisherId)) {
				echo "subscription stream publisher is admin".PHP_EOL;
				Assets_Subscription::start($plan, $user);
				continue;
			}

			if (Assets_Subscription::isCurrent($subscriptionStream)) {
				echo "subscription is active".PHP_EOL;
				continue;
			}

			if (Assets_Subscription::isUnsubscribe($subscriptionStream)) {
				echo "subscription stopped".PHP_EOL;

				// if subscription outdated (!Assets_Subscription::isCurrent) remove permission for this plan
				Users_Contact::delete()->where(array(
					"userId" => $plan->publisherId,
					"label" => $plan->name,
					"contactUserId" => $subscriptionStream->publisherId
				))->execute();
				continue;
			}

			Q::event("Assets/credits/post", array(
				"userId" => $user->id,
				"amount" => $plan->getAttribute('amount'),
				"currency" => $plan->getAttribute('currency', 'USD'),
				"toStream" => $plan,
				"forcePayment" => true
			));

			$status = Q_response::getSlot('status');
			$details = Q_response::getSlot('details');

			if ($status) {
				Assets_Subscription::start($plan, $user);
				echo "charged successfully".PHP_EOL;
			} else {
				echo "charge failed".PHP_EOL;
				echo "need {$details["needCredits"]} credits".PHP_EOL;

				// if payment failed, remove permission for this plan
				Users_Contact::delete()->where(array(
					"userId" => $plan->publisherId,
					"label" => $plan->name,
					"contactUserId" => $subscriptionStream->publisherId
				))->execute();

				// and also mark subscription stream as stopped
				Assets_Subscription::unsubscribe($subscriptionStream);
			}
		} catch (Exception $e) {
			echo $e->getMessage();
		}
	}
	$offset += $limit;
};
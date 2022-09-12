<?php
	
function Assets_after_Assets_charge($params)
{
	$user = $params['user'];
	$payments = $params['payments'];
	$amount = $params['amount'];
	$currency = $params['currency'];
	$charge = $params['charge'];
	$adapter = $params['adapter'];
	$options = $params['options'];

	// rate for currency required
	$credits = Assets_Credits::convert($amount, $currency, "credits");

	Assets_Credits::grant($credits, 'BoughtCredits', $user->id, array(
		"charge" => @compact("amount", "currency"),
		"token" => $options["token"]
	));

	//TODO: as we come to use credits system, need to change this to send email with amount of credits bought
	$text = Q_Text::get('Assets/content', array('language' => Users::getLanguage($user->id)));
	$description = Q::interpolate(Q::ifset($text, 'credits', 'forMessages', 'BoughtCredits', Q::ifset($text, 'credits', 'BoughtCredits', 'Bought {{amount}} credits')), array('amount' => $credits));
	$stream = Q::ifset($options, 'stream', null);
	if ($stream) {
		$publisherId = $stream->publisherId;
		$publisher = Users_User::fetch($publisherId, true);
		if ($stream->type === 'Assets/subscription') {
			$plan = Assets_Subscription::getPlan($stream);
			$months = $plan->getAttribute('months');
			$weeks = $plan->getAttribute('weeks');
			$days = $plan->getAttribute('days');
			$startDate = $stream->getAttribute('startDate');
			$endDate = $stream->getAttribute('endDate');
		}
		$description = $stream->title;
	} else {
		$publisherId = Users::communityId();
		$publisher = Users_User::fetch($publisherId, true);
	}
	if (isset($options['description'])) {
		$description = $options['description'];
	}
	list($currencyName, $symbol) = Assets::currency($currency);
	$displayAmount = Assets::display($currency, $amount);
	$communityId = Users::communityId();
	$communityName = Users::communityName();
	$communitySuffix = Users::communitySuffix();
	$link = Q_Request::baseUrl('action.php') . "/Assets/payment"
			. "?publisherId=" . urlencode($publisherId)
			. "&userId=" . urlencode($user->id);

	$fields = @compact(
		'user', 'publisher', 'publisherId', 'communityId', 'communityName', 'communitySuffix',
		'description', 'subscription', 'stream', 'plan', 'currency', 
		'name', 'symbol', 'currencyName', 'amount', 'displayAmount',
		'months', 'startDate', 'endDate', 'link'
	);
	
	if ($user->emailAddress) {
		$email = new Users_Email();
		$email->address = $user->emailAddress;
		$email->retrieve(true);
		$emailSubject = Q_Config::get('Assets', 'transactional', 'charged', 'subject', false);
		$emailView = Q_Config::get('Assets', 'transactional', 'charged', 'body', false);
		if ($emailSubject !== false and $emailView) {
			$email->sendMessage($emailSubject, $emailView, $fields);
		}
	} else if ($user->mobileNumber) {
		$mobile = new Users_Mobile();
		$mobile->number = $user->mobileNumber;
		$mobile->retrieve(true);
		if ($mobileView = Q_Config::get('Assets', 'transactional', 'charged', 'sms', false)) {
			$mobile->sendMessage($mobileView, $fields);
		}
	}

	if ($publisher->emailAddress) {
		$email = new Users_Email();
		$email->address = $publisher->emailAddress;
		$email->retrieve(true);
		$emailSubject = Q_Config::get('Assets', 'transactional', 'charge', 'subject', false);
		$emailView = Q_Config::get('Assets', 'transactional', 'charge', 'body', false);
		if ($emailSubject !== false and $emailView) {
			$email->sendMessage($emailSubject, $emailView, $fields);
		}
	} else if ($publisher->mobileNumber) {
		$mobile = new Users_Mobile();
		$mobile->number = $publisher->mobileNumber;
		$mobile->retrieve(true);
		if ($mobileView = Q_Config::get('Assets', 'transactional', 'charge', 'sms', false)) {
			$mobile->sendMessage($mobileView, $fields);
		}
	}
}
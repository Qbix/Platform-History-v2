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
		"token" => Q::ifset($options, 'token', null)
	));

	$text = Q_Text::get('Assets/content', array('language' => Users::getLanguage($user->id)));
	$description = Q::interpolate(Q::ifset($text, 'credits', 'forMessages', 'BoughtCredits', Q::ifset($text, 'credits', 'BoughtCredits', 'Bought {{amount}} credits')), array('amount' => $credits));

	$stream = Q::ifset($options, 'stream', null);
	if ($stream) {
		$description = $stream->title;
		$publisherId = $stream->publisherId;
	} else {
		$publisherId = Users::communityId();
	}
	$publisher = Users_User::fetch($publisherId, true);

	list($currencyName, $symbol) = Assets::currency($currency);
	$displayAmount = Assets::display($currency, $amount);
	$communityId = Users::communityId();
	$communityName = Users::communityName();
	$communitySuffix = Users::communitySuffix();
	$link = Q_Request::baseUrl('me/credits/charges');

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
			try {
				$email->sendMessage($emailSubject, $emailView, $fields);
			} catch (Exception $e) {}
		}
	} else if ($user->mobileNumber) {
		$mobile = new Users_Mobile();
		$mobile->number = $user->mobileNumber;
		$mobile->retrieve(true);
		if ($mobileView = Q_Config::get('Assets', 'transactional', 'charged', 'sms', false)) {
			try {
				$mobile->sendMessage($mobileView, $fields);
			} catch (Exception $e) {}
		}
	}

	if ($publisher->emailAddress) {
		$email = new Users_Email();
		$email->address = $publisher->emailAddress;
		$email->retrieve(true);
		$emailSubject = Q_Config::get('Assets', 'transactional', 'charge', 'subject', false);
		$emailView = Q_Config::get('Assets', 'transactional', 'charge', 'body', false);
		if ($emailSubject !== false and $emailView) {
			try {
				$email->sendMessage($emailSubject, $emailView, $fields);
			} catch (Exception $e) {}
		}
	} else if ($publisher->mobileNumber) {
		$mobile = new Users_Mobile();
		$mobile->number = $publisher->mobileNumber;
		$mobile->retrieve(true);
		if ($mobileView = Q_Config::get('Assets', 'transactional', 'charge', 'sms', false)) {
			try {
				$mobile->sendMessage($mobileView, $fields);
			} catch (Exception $e) {}
		}
	}
}
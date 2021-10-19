<?php
	
function Assets_after_Assets_startSubscription($params)
{
	$plan = $user = $publisher = $stream = $startDate = $endDate = $months = $currency = null;
	extract($params, EXTR_OVERWRITE);

	$description = $stream->title;
	$publisherId = $stream->publisherId;
	if (isset($options['description'])) {
		$description = $options['description'];
	}
	$currencies = Q::json_decode(file_get_contents(ASSETS_PLUGIN_CONFIG_DIR.DS.'currencies.json'), true);
	if (!isset($currencies['symbols'][$currency])) {
		throw new Q_Exception_BadValue(array('internal' => 'currency', 'problem' => 'no symbol found'), 'currency');
	}
	if (!isset($currencies['names'][$currency])) {
		throw new Q_Exception_BadValue(array('internal' => 'currency', 'problem' => 'no name found'), 'currency');
	}
	$symbol = $currencies['symbols'][$currency];
	$currencyName = $currencies['names'][$currency];
	$communityId = Users::communityId();
	$communityName = Users::communityName();
	$communitySuffix = Users::communitySuffix();
	$amount = $stream->getAttribute('amount');
	$months = $stream->getAttribute('months');
	$weeks = $stream->getAttribute('weeks');
	$days = $stream->getAttribute('days');
	$link = Q_Request::baseUrl('action.php') . "/Assets/payment"
			. "?publisherId=" . urlencode($publisherId)
			. "&userId=" . urlencode($user->id);

	$fields = @compact(
		'user', 'publisher', 'publisherId', 'communityId', 'communityName', 'communitySuffix',
		'description', 'subscription', 'stream', 'plan', 'currency',
		'name', 'symbol', 'currencyName', 'amount', 'months', 'weeks', 'days', 'startDate', 'endDate', 'link'
	);
	
	if ($user->emailAddress) {
		$email = new Users_Email();
		$email->address = $user->emailAddress;
		$email->retrieve(true);
		$emailSubject = Q_Config::get('Assets', 'transactional', 'startedSubscription', 'subject', false);
		$emailView = Q_Config::get('Assets', 'transactional', 'startedSubscription', 'body', false);
		if ($emailSubject !== false and $emailView) {
			$email->sendMessage($emailSubject, $emailView, $fields);
		}
	} else if ($user->mobileNumber) {
		$mobile = new Users_Mobile();
		$mobile->number = $user->mobileNumber;
		$mobile->retrieve(true);
		if ($mobileView = Q_Config::get('Assets', 'transactional', 'startedSubscription', 'sms', false)) {
			$mobile->sendMessage($mobileView, $fields);
		}
	}
	
	if ($publisher->emailAddress) {
		$email = new Users_Email();
		$email->address = $publisher->emailAddress;
		$email->retrieve(true);
		$emailSubject = Q_Config::get('Assets', 'transactional', 'startSubscription', 'subject', false);
		$emailView = Q_Config::get('Assets', 'transactional', 'startSubscription', 'body', false);
		if ($emailSubject !== false and $emailView) {
			$email->sendMessage($emailSubject, $emailView, $fields);
		}
	} else if ($publisher->mobileNumber) {
		$mobile = new Users_Mobile();
		$mobile->number = $publisher->mobileNumber;
		$mobile->retrieve(true);
		if ($mobileView = Q_Config::get('Assets', 'transactional', 'startSubscription', 'sms', false)) {
			$mobile->sendMessage($mobileView, $fields);
		}
	}
}
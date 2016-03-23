<?php
	
function Assets_after_Assets_charge($params)
{
	$user = $payments = $amount = $currency = $charge = $adapter = $options = null;
	extract($params, EXTR_OVERWRITE);

	$description = 'a product or service';
	$stream = Q::ifset($options, 'stream', null);
	if ($stream) {
		$publisherId = $stream->publisherId;
		$publisher = Users_User::fetch($publisherId, true);
		if ($stream->type === 'Assets/subscription') {
			$plan = Streams::fetchOne(
				$stream->getAttribute('planPublisherId'),
				$stream->getAttribute('planPublisherId'),
				$stream->getAttribute('planStreamName'),
				true
			);
			$months = $stream->getAttribute('months');
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
	$currencies = Q::json_decode(file_get_contents(AWARDS_PLUGIN_CONFIG_DIR.DS.'currencies.json'), true);
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
	$link = Q_Request::baseUrl('action.php')
		. "/Assets/payment?publisherId=$publisherId&userId=".$user->id;
	
	$fields = compact(
		'user', 'publisher', 'publisherId', 'communityId', 'communityName', 'communitySuffix',
		'description', 'subscription', 'stream', 'plan', 'currency', 
		'name', 'symbol', 'currencyName', 'amount', 'months', 'startDate', 'endDate', 'link'
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
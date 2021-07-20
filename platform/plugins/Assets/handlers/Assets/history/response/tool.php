<?php

/**
 * get messages
 * @class Assets history
 * @constructor
 * @param {array} $options Override various options for this tool
 *  @param {string} $options.type can be "credits" or "charges"
 *  @param {double} [$options.userId=Users::loggedInUser(true)] id of user which history need to display
 */
function Assets_history_response_tool($options)
{
	$options = array_merge($_REQUEST, $options);
	$supportedTypes = array('credits', 'charges');

	Q_Valid::requireFields(array('type'), $options, true);
	$type = $options["type"];
	$loggedUser = Users::loggedInUser(true);
	//$userId = Q::ifset($options, 'userId', $loggedUser->id);
	$userId = $loggedUser->id;

	// if user is admin, he can see transactions of other users
	if ((bool)Users::roles(null, Q_Config::expect('Assets', 'canCheckPaid'))) {
		$userId = Q::ifset($options, 'userId', $userId);
	}

	if (!in_array($type, $supportedTypes)) {
		throw new Q_Exception("Unsupported type ".$type.". Supported types are: ".join(',', $supportedTypes));
	}

	$texts = Q_Text::get('Assets/content', array('language' => Users::getLanguage($userId)));

	$res = array();
	if ($type == 'credits') {
		$rows = Assets_Credits::select()
		->where(array('fromUserId' => $userId))
		->orWhere(array('toUserId' => $userId))
		->orderBy('insertedTime', false)
		->fetchDbRows();

		foreach ($rows as $i => $row) {
			$attributes = (array)Q::json_decode($row->attributes);
			$attributes['amount'] = $row->credits;
			$attributes['toPublisherId'] = $row->toPublisherId;
			$attributes['toStreamName'] = $row->toStreamName;
			$attributes['fromPublisherId'] = $row->fromPublisherId;
			$attributes['fromStreamName'] = $row->fromStreamName;

			$amount = $row->credits;
			$sign = $direction = $clientInfo = $clientId = null;
			if ($row->fromUserId == $userId) {
				$clientId = $row->toUserId;
				$direction = Q::ifset($texts, 'history', 'To', 'To');
				$sign = '-';

			} elseif ($row->toUserId == $userId) {
				$clientId = $row->fromUserId;
				$direction = Q::ifset($texts, 'history', 'From', 'From');
				$sign = '+';
			}

			if ($clientId) {
				$clientInfo = array(
					'id' => $clientId,
					'name' => Streams::displayName($clientId),
					'direction' => $direction
				);
			}

			$operation = Q::ifset($texts, 'history', $row->reason, $sign, Q::ifset($texts, 'history', $row->reason, null));
			if ($operation) {
				$operation = Q::interpolate($operation, compact("amount"));
			} else {
				$operation = $row->reason;
			}

			if ($reason = Q::ifset($texts, 'credits', $row->reason, null)) {
				$reason = Q::interpolate($reason, $attributes);
			} else {
				$reason = $row->reason;
			}

			// remove operation from reason to avoid repeat
			$reason = str_replace($operation, "", $reason);

			$res[] = array(
				'id' => $row->id,
				'date' => $row->insertedTime,
				'amount' => $amount,
				'operation' => $operation,
				'reason' => $reason,
				'sign' => $sign,
				'clientInfo' => $clientInfo
			);
		}
	} elseif ($type == 'charges') {
		$rows = Assets_Charge::select()
		->where(array(
			'userId' => $userId
		))
		->orderBy('insertedTime', false)
		->fetchDbRows();

		// clean rows
		foreach ($rows as $i => $row) {
			$attributes = Q::json_decode($row->attributes);
			$description = Q::ifset($texts, 'history', $row->description, null);
			if ($description && $attributes->credits) {
				$description = Q::interpolate($description, array('amount' => $attributes->credits));
			} else {
				$description = $row->description;
			}
			$res[] = array(
				'id' => $row->id,
				'gateway' => $attributes->payments,
				'amount' => $attributes->amount,
				'currency' => $attributes->currency,
				'communityId' => $attributes->communityId,
				'description' => $description,
				'date' => $row->insertedTime
			);
		}
	}

	return $res;
};
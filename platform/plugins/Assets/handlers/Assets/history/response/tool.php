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

	if (!in_array($type, $supportedTypes)) {
		throw new Q_Exception("Unsupported type ".$type.". Supported types are: ".join(',', $supportedTypes));
	}

	$texts = Q_Text::get('Assets/content', array('language' => Users::getLanguage($userId)));

	$res = array();
	if ($type == 'credits') {
		$rows = Streams_Message::select()
		->where(array(
			'streamName' => 'Assets/user/credits',
			'byUserId' => $userId,
			'type like ' => 'Assets/credits/%'
		))
		->orderBy('insertedTime', false)
		->fetchDbRows();

		foreach ($rows as $i => $row) {
			$instructions = Q::json_decode($row->instructions);
			$direction = $instructions->operation == '+' ? Q::ifset($texts, 'history', 'From', 'From') : Q::ifset($texts, 'history', 'To', 'To');
			$res[] = array(
				'date' => $row->insertedTime,
				'type' => $row->type,
				'amount' => $row->content,
				'operation' => $instructions->operation,
				'client' => array(
					'id' => $row->byClientId,
					'name' => Streams::displayName($row->byClientId),
					'direction' => $direction
				),
				'description' => $instructions->reason
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
			$res[] = array(
				'gateway' => $attributes->payments,
				'amount' => $attributes->amount,
				'currency' => $attributes->currency,
				'communityId' => $attributes->communityId,
				'description' => $row->description,
				'date' => $row->insertedTime
			);
		}
	}

	return $res;
};
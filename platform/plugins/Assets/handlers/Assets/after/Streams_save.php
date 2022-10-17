<?php
function Assets_after_Streams_save($params) {
	Assets_NF_update_attributes_relations($params);
	Assets_grant_credits_for_filling_personal_streams($params);
	Assets_grant_credits_for_invited_users($params);
}

function Assets_NF_update_attributes_relations ($params) {
	$stream = $params['row'];

	if (!in_array($stream->type, array("Assets/NFT", "TokenSociety/NFT"))) {
		return;
	}

	if (Q::ifset($params, "modifiedFields", "attributes", null)) {
		Assets_NFT::updateAttributesRelations($stream);
	}
}
function Assets_grant_credits_for_filling_personal_streams($params) {
	$stream = $params['row'];

	$allowedNames = Q_Config::get("Assets", "credits", "grant", "forStreams", null);
	$specialFields = array(
		"Streams/user/icon" => "icon",
		"Places/user/location" => "attributes"
	);

	$appropriateName = null;
	foreach ($allowedNames as $allowedName => $credits) {
		if ($stream->name == $allowedName || $stream->type == $allowedName) {
			$appropriateName = $allowedName;
			break;
		}
	}
	if (!$appropriateName) {
		return;
	}

	$streamField = 'content';
	foreach ($specialFields as $k => $v) {
		if ($stream->name == $k) {
			$streamField = $v;
		}
	}

	if (!Q::ifset($stream, $streamField, null)) {
		return;
	}

	$originalContent = Q::ifset($stream, "fieldsOriginal", $streamField, null);
	if (
		($stream->name != "Streams/user/icon" && !empty($originalContent))
		|| ($stream->name == "Streams/user/icon" && Users::isCustomIcon($originalContent, true))
	) {
		return;
	}

	Assets_Credits::grant($credits, "ForFillingStream", $stream->publisherId, array(
		'FilledStreamTitle' => $stream->title
	));
}

function Assets_grant_credits_for_invited_users ($params) {
	$stream = $params['row'];

	$allowedNames = array(
		array("name" => "Streams/user/firstName", "field" => "content"),
		array("name" => "Streams/user/lastName", "field" => "content"),
		array("name" => "Streams/user/icon", "field" => "content"),
		array("name" => "Places/user/location", "field" => "attributes"),
		array("name" => "Streams/greeting/".Users::communityId(), "field" => "content")
	);

	$appropriateName = null;
	foreach ($allowedNames as $allowedName) {
		if ($stream->name == $allowedName["name"] && Q::ifset($stream, $allowedName["field"], null)) {
			$appropriateName = $allowedName;
		}
	}
	if (!$appropriateName) {
		return;
	}

	$originalContent = Q::ifset($stream, "fieldsOriginal", $appropriateName["field"], null);
	if (
		($stream->name != "Streams/user/icon" && !empty($originalContent))
		|| ($stream->name == "Streams/user/icon" && Users::isCustomIcon($originalContent))
	) {
		return;
	}

	$inviteRow = Streams_Invite::select()
		->where(array('userId' => $stream->publisherId))
		->orderBy("insertedTime", false)
		->fetchDbRow();
	if (!$inviteRow || Users::isCommunityId($inviteRow->invitingUserId)) {
		return;
	}

	// Make earning for invited user
	$invitedUser = Users::fetch($inviteRow->userId);
	if (!$invitedUser) {
		return;
	}

	$invitedUserEntered = Q_Config::get('Assets', 'credits', 'grant', 'invitedUserEntered', array());
	$credits = null;
	foreach ($invitedUserEntered as $streamName => $credit) {
		if (strpos($stream->name, $streamName) === false) {
			continue;
		}

		$credits = $credit;
	}
	if (empty($credits)) {
		return;
	}

	Assets_Credits::grant($credits, "InvitedUserFilledStream", $inviteRow->invitingUserId, array(
		'invitedUserName' => $invitedUser->displayName(array('asUserId' => $inviteRow->invitingUserId)),
		'FilledStreamTitle' => $stream->title
	));
}
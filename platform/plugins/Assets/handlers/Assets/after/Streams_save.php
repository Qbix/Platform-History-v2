<?php
function Assets_after_Streams_save($params) {
	$stream = $params['row'];

	if (in_array($stream->type, array("Assets/NFT", "TokenSociety/NFT"))) {
		if (Q::ifset($params, "modifiedFields", "attributes", null)) {
			Assets_NFT::updateAttributesRelations($stream);
		}

		return;
	}

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

	$invitedUserEntered = Q_Config::get('Assets', 'credits', 'granted', 'invitedUserEntered', array());
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

	$streamName = strpos($stream->name, "Streams/greeting/") === false ? $stream->name : "Streams/greeting";
	Assets_Credits::grant($credits, Q_Utils::ucfirst(Q_Utils::normalize($streamName)), $inviteRow->invitingUserId, array(
		'publisherId' => $stream->publisherId,
		'streamName' => $stream->name,
		'invitedUserName' => $invitedUser->displayName(array('asUserId' => $inviteRow->invitingUserId))
	));
}
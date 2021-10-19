<?php
function Websites_lookup_response_results ($params) {
	Q_Valid::nonce(true);

	$req = array_merge($_REQUEST, $params);

	$platforms = $req["platforms"];
	$query = $req["query"];

	if (empty($platforms)) {
		throw new Q_Exception_WrongValue(array(
			'field' => 'platforms',
			'range' => "not empty"
		));
	}

	if ($platforms["youtube"]) {
		$channel = Q_Config::get("Websites", "youtube", "channelId", null);
		return Websites_Webpage::youtube(@compact("query","channel"));
	}
}
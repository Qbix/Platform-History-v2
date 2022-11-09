<?php
function Assets_NFTcontract_response_getInfo ($params) {
	$req = array_merge($_REQUEST, $params);
	Q_Valid::requireFields(array("address", "chainId"), $req, true);
	$contractAddress = $req["address"];
	$chainId = $req["chainId"];
	$title = Q::ifset($req, "title", null);
	$publisherId = Q::ifset($req, "publisherId", null);
	$streamName = Q::ifset($req, "streamName", null);
	$texts = Q_Text::get('Assets/content')['NFT']['contract'];
	$chain = Assets_NFT::getChains($chainId);

	$name = $symbol = null;
	if (!$title || $title == "false") {
		$name = Users_Web3::execute('Assets/templates/R1/NFT/contract', $contractAddress, "name", array(), $chainId);
		$symbol = Users_Web3::execute('Assets/templates/R1/NFT/contract', $contractAddress, "symbol", array(), $chainId);
		if ($publisherId && $streamName) {
			$stream = Streams_Stream::fetch($publisherId, $publisherId, $streamName);
			$stream->title = Q::interpolate($texts["ContractName"], array(
				"contractName" => $name,
				"contractSymbol" => $symbol,
				"chainNetwork" => $chain["name"]
			));
			$stream->save();
		}
	}
	$owner = Users_Web3::execute('Assets/templates/R1/NFT/contract', $contractAddress, "owner", array(), $chainId);

	return compact("name", "symbol", "owner");
}
<?php
echo Q::tool("Assets/NFT/owned", array(
	"owner" => array(
		"userId" => $userId,
		//"accountAddress" => "",
	),
	"holder" => array(
		"contractAddress" => "0x6F1E437dBb8BA1709a14c17E8A6647D336Bf0C89",
		"pathABI" => "Assets/templates/R1/NFT/sales/contract"
	),
	"chainId" => "0x13881",
	"caching" => false
	//"contractAddress" => "0x6F1E437dBb8BA1709a14c17E8A6647D336Bf0C89"
))

/*echo Q::tool("Assets/NFT/owned", array(
	"userId" => $userId,
	//"accountAddress" => "0x6F1E437dBb8BA1709a14c17E8A6647D336Bf0C89",
	"chainId" => "0x61",
	"contractAddress" => "0xf6bfca1c64e8124440795a9e654be8029ca91829",
	"pathABI" => "ITR/templates/NFT/0xf6bfca1c64e8124440795a9e654be8029ca91829"
))*/
?>

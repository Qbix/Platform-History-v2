<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
function Assets_web3_coin_staking_start_tool($options) {
	
	Q_Valid::requireFields(array('communityCoinAddress'), $options, true);
	
	// the following code:
	//	- generate instances info from blockchain
	//	- put in cache 
	//	- and through into tool "Assets/web3/coin/staking/start"  preventing doing the same for each clients
	// and THIS CODE DOESNOT WORK with current lib "sc0vu/web3.php" and crashed (cant handle "tuple[]" structure in responces)
	// so uncomment the code below after fix that
	/**/
	$updateCache = Q::ifset($options, 'updateCache', false);
	if ($updateCache) {
		$caching = null;
		$cacheDuration = 0;
	} else {
		$caching = true;
		$cacheDuration = null;
	}
//$caching = false;
	$longDuration = 31104000;// year
	$middleDuration = 86400;// day
	$shortDuration = 600;// 10 min
	$communityCoinAddress = $options["communityCoinAddress"];
	$chainId = $options["chainId"];
	
	$abiPathCommunityCoin = Q::ifset($options, "abiPathCommunityCoin", "Assets/templates/R1/CommunityCoin/contract");
	$abiPathCommunityStakingPoolFactory = Q::ifset($options, "abiPathCommunityStakingPool", "Assets/templates/R1/CommunityStakingPool/factory");
	
	$stakingPoolFactory = Users_Web3::execute($abiPathCommunityCoin, $communityCoinAddress, "instanceManagment", array(), $chainId, $caching, $longDuration);
//print_r($stakingPoolFactory);
//Array ( [result] => 0x7da8275d454e7acd195d1097b5798c38b93a8bf8 )

//$stakingPoolFactory = "0x7da8275d454e7acd195d1097b5798c38b93a8bf8";
	$poolsInstances = Users_Web3::execute($abiPathCommunityStakingPoolFactory, $stakingPoolFactory, "instances", array(), $chainId, $caching, $shortDuration);
	
//print_r($poolsInstances );
//die();
	$poolList = [];
	
	foreach ($poolsInstances as $poolAddress) {
		$tmp = Users_Web3::execute(
			$abiPathCommunityStakingPoolFactory, 
			$stakingPoolFactory, 
			"getInstanceInfoByPoolAddress", 
			array($poolAddress), 
			$chainId, 
			$caching, 
			$middleDuration
		);
		$poolList[] = array_merge(
			$tmp,
			array(
				"communityPoolAddress" => $poolAddress
			)
		);
		
	}
	
//	print_r($poolList);
//	exit;
	$options["cache"]["poolsList"] = $poolList;
	/**/

	Q_Response::setToolOptions($options);
	
}

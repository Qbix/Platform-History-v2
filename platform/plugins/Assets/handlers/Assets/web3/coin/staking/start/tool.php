<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
function Assets_web3_coin_staking_start_tool($options) {
	//print_r($options);
	/*
	 * Array ( [chainId] => 0x13881 [fields] => Array ( ) [communityStakingPoolAddress] => 0xe7bb39b640f06c1cbb518b3415e49b2e887ff826 [communityCoinAddress] => 0x68348dfa31dcb80bdaa2f327b802f0a491a6263f )
	 */
////	$result = Users_Web3::execute();
////	Q_Response::setToolOptions("somename");
	
	Q_Response::setToolOptions($options);
}

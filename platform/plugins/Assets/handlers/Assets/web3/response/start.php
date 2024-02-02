<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
function Assets_web3_response_start($options) {
	$options = array_merge($_REQUEST, $options);
    $response = Q::event("Assets/web3/coin/staking/start/tool", $options);
    return $response;
}

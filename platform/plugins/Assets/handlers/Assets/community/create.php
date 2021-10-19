<?php

function Assets_community_create($params)
{
	$myCredits = Assets_Credits::amount();
	$needCredits = (int)Q_Config::expect('Assets', 'credits', 'amounts', 'createCommunity');
	$authorized = $myCredits >= $needCredits;

	$res = @compact('authorized', 'myCredits', 'needCredits');
	return $res;
}
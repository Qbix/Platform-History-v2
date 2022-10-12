<?php

function Assets_community_create($params)
{
	$myCredits = Assets_Credits::amount();
	$needCredits = (int)Q_Config::expect('Assets', 'credits', 'spend', 'Communities/create');
	$authorized = $myCredits >= $needCredits;

	$res = @compact('authorized', 'myCredits', 'needCredits');
	return $res;
}
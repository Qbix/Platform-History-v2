<?php

function Assets_0_3()
{
	$app = Q_Config::expect('Q', 'app');
	Streams::create($app, $app, 'Streams/category', 
		array('name' => 'Assets/plans', 'title' => 'Subscription Plans')
	);
}

Assets_0_3();
<?php

function Awards_0_3()
{
	$app = Q_Config::expect('Q', 'app');
	Streams::create($app, $app, 'Streams/category', 
		array('name' => 'Awards/plans', 'title' => 'Subscription Plans')
	);
}

Awards_0_3();
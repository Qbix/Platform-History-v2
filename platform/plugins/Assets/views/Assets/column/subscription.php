<?php
echo Q::tool("Streams/related", array(
	"publisherId" => $communityId,
	"streamName" => "Assets/plans",
	"relationType" => "Assets/plan",
	"creatable" => array('Assets/plan' => array('title' => 'New Plan'))
), "assets_subscription");
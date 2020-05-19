<?php
echo Q::tool("Streams/related", array(
	"publisherId" => $communityId,
	"streamName" => "Assets/services",
	"relationType" => "Assets/service",
	"editable" => true,
	"realtime" => false,
	"sortable" => false,
	"creatable" => array(
		'Assets/service' => array(
			'title' => $types['Assets/service']['newService']
		)
	)
));
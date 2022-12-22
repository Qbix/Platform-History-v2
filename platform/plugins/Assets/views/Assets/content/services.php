<h2><?php echo $text['services']['ManageServices'] ?></h2>
<?php
echo Q::tool("Streams/related", array(
	"publisherId" => $communityId,
	"streamName" => "Assets/services",
	"relationType" => "Assets/service",
	"editable" => true,
	"realtime" => true,
	"sortable" => false,
	"relatedOptions" => array("withParticipant" => false),
	"creatable" => array(
		'Assets/service' => array(
			'title' => $text['services']['NewServiceTemplate']['Title']
		)
	)
));
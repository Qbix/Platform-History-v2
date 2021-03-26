<h2><?php echo $types['Assets/service']['ManageServiceTemplates'] ?></h2>
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
			'title' => $types['Assets/service']['newService']
		)
	)
));
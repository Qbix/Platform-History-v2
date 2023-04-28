<div class="Assets_NFTcollections_column">
    <?=Q::tool("Streams/related", array(
        "publisherId" => $communityId,
        "streamName" => "Assets/contests",
		"relationType" => "Assets/contest",
		"editable" => true,
		"closeable" => true,
		"realtime" => true,
		"sortable" => false,
        "creatable" => array(
			"Assets/contest" => array(
				"title" => $NFT["collections"]["NewCollection"]
			)
		)
	))?>
</div>
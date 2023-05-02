<div class="Assets_NFTcollections_column">
    <?=Q::tool("Streams/related", array(
        "publisherId" => $communityId,
        "streamName" => "Assets/NFT/collections",
		"relationType" => "Assets/NFT/collection",
		"editable" => true,
		"closeable" => true,
		"realtime" => true,
		"sortable" => false,
        "creatable" => array(
			"Assets/NFT/collection" => array(
				"title" => $NFT["collections"]["NewCollection"]
			)
		)
	))?>
</div>
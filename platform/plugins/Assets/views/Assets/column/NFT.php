<!-- Outer container -->
<?php
    echo Q::tool(array(
            "Streams/preview" => array(
                "publisherId" => $stream->publisherId,
                "streamName" => $stream->name,
                "editable" => false,
                "closeable" => false
            ),
            "Assets/NFT/preview" => array(
                "imagepicker" => array("showSize" => "x.png"),
                "show" => array(
                    "avatar" => false,
                    "participants" => true,
                    "title" => false
                )
            )
        )
    );
?>


<div class="Assets_NFT_section" data-type="author">
    <div class="Assets_info_icon"><i class="qp-communities-owner"></i></div>
    <div class="Assets_info_content"><a href="<?=Q_Request::baseUrl()."/profile/".$stream->publisherId?>"><?=$authorName?></a></div>
</div>
<div class="Assets_NFT_section" data-type="chat">
    <div class="Assets_info_icon"><i class="qp-calendars-conversations"></i></div>
    <div class="Assets_info_content"><?=$texts["NFT"]["Conversation"]?></div>
</div>
<div class="Assets_NFT_section" data-type="attributes" data-empty="<?=empty($assetsNFTAttributes)?>">
    <div class="Assets_info_icon"><i class="qp-communities-clipboard"></i></div>
    <div class="Assets_info_content">
        <table class="assetsNFTAttributes">
            <?php foreach ($assetsNFTAttributes as $attribute) {
                echo "<tr><td>".$attribute["trait_type"].":</td><td>".$attribute["value"]."</td></tr>";
            } ?>
        </table>
    </div>
</div>
<?php if ($stream->testWriteLevel("edit")) {?>
    <div class="Assets_NFT_section" data-type="edit">
        <div class="Assets_info_icon"><i class="qp-communities-account"></i></div>
        <div class="Assets_info_content"><?=$texts["NFT"]["UpdateNFT"]?></div>
    </div>
<?php } ?>
<hr>
<?=Q::tool("Streams/inplace", array(
    "field" => "content",
    "inplaceType" => "textarea",
    "inplace" => array("placeholder" => $texts["NFT"]["DescriptionPlaceholder"]),
    "publisherId" => $stream->publisherId,
    "streamName" => $stream->name
), "nft_preview_description_".Q_Utils::normalize($stream->name))?>

<input type="hidden" name="publisherId" value="<?php echo $stream->publisherId ?>">
<input type="hidden" name="streamName" value="<?php echo $stream->name ?>">

<!-- Outer container -->
<?php
    echo Q::tool(array(
            "Streams/preview" => array(
                "publisherId" => $stream->publisherId,
                "streamName" => $stream->name,
                "editable" => true,
                "closeable" => false
            ),
            "Assets/NFT/preview" => array(
                 "imagepicker" => array("showSize" => "x.png")
            )
        )
    );
?>

<div class="Assets_nft_details_header">
    <div class="Assets_nft_details_header_left">
        <h2><?php echo Q::tool("Streams/inplace", array(
                "stream" => $stream,
                "editable" => $stream->testWriteLevel("edit"),
                "inplaceType" => "text",
                "field" => "title",
                "inplace" => array(
                    "placeholder" => $texts["NFT"]["TitlePlaceholder"]
                )
            ), Q_Utils::normalize($stream->name . "_title")) ?></h2>
    </div>
    <div class="Assets_nft_details_header_right <?php echo $likes["res"] ? "Q_selected" : "" ?>">
        <i class="far fa-heart"></i>
        <span><?php echo ($likes["likes"] ?: "") ?></span>
    </div>
</div>
<ul class="Assets_nft_tabs">
    <li class="Q_selected"><?php echo $texts["NFT"]["Details"] ?></li>
</ul>
<div class="table_description">
    <table class="Assets_collection_info">
        <tr>
            <td>Title:</td>
            <td>
                <?php echo Q::tool("Streams/inplace", array(
                        "stream" => $stream,
                        "editable" => $stream->testWriteLevel("edit"),
                        "inplaceType" => "textarea",
                        "field" => "title",
                        "inplace" => array(
                            "placeholder" => $texts["NFT"]["DescriptionPlaceholder"]
                        )
                    ), Q_Utils::normalize($stream->name . "_content")) ?>
            </td>
        </tr>
        <tr>
            <td>Creator:</td><td><a href="<?= Q_Request::baseUrl()?>/profile/<?= $stream->publisherId?>"><?= $authorName?></a></td>
        </tr>
        <?php if ($stream->content) {?>
        <tr>
            <td>Description:</td><td><?=$stream->content?></td>
        </tr>
        <?php } ?>
        <?php if (!empty($assetsNFTAttributes)) {?>
            <tr>
                <td style="vertical-align: top">Attributes:</td><td>
                    <table class="assetsNFTAttributes">
                        <?php foreach ($assetsNFTAttributes as $attribute) {
                            echo "<tr><td>".$attribute["trait_type"].":</td><td>".$attribute["value"]."</td></tr>";
                        } ?>
                    </table>
                </td>
            </tr>
        <?php } ?>
    </table>
</div>
<input type="hidden" name="publisherId" value="<?php echo $stream->publisherId ?>">
<input type="hidden" name="streamName" value="<?php echo $stream->name ?>">

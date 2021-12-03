<div id="content">

    <!-- Outer container -->
    <div class="assets_nft">
        <div class="layout-container">
            <div class="assets_nft_row">
                <div class="assets_nft_col_eight">
                    <?php
                        echo Q::tool(array(
                                "Streams/preview" => array(
                                    "publisherId" => $stream->publisherId,
                                    "streamName" => $stream->name,
                                    "editable" => false,
                                    "closeable" => false
                                ),
                                "Assets/NFT/preview" => array(
                                     "poster" => $poster,
                                     "movie"=> $movie,
                                     "src" => $stream->getAttribute("src")
                                )
                            )
                        );
                    ?>
                </div>
                <div class="assets_nft_col_four">
                    <div class="assets_nft_details">
                        <div class="assets_nft_details_header">
                            <div class="assets_nft_details_header_left">
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
                            <div class="assets_nft_details_header_right <?php echo $likes["res"] ? "Q_selected" : "" ?>">
                                <i class="far fa-heart"></i>
                                <span><?php echo ($likes["likes"] ?: "") ?></span>
                            </div>
                        </div>
                        <div class="assets_nft_body">
                            <div class="assets_nft_body_left author">
                                <h2>Author</h2>
                                <div class="assets_nft_body_details">
                                    <img src="../../img/t.png"/>
                                    <span class="assets_nft_wallet"></span>
                                </div>
                            </div>
                            <div class="assets_nft_body_left owner">
                                <h2>Owner</h2>
                                <div class="assets_nft_body_details">
                                    <img src="../../img/t.png"/>
                                    <span class="assets_nft_wallet"></span>
                                </div>
                            </div>
							<?php if (!empty($collections)) { ?>
                                <div class="assets_nft_body_left">
                                    <h2>Collection</h2>
                                    <div class="assets_nft_body_collection">
										<?php
										foreach ($collections as $collection) {
											echo "<span>" . $collection . "</span>";
										}
										?>
                                    </div>
                                </div>
							<?php } ?>
                        </div>
						<?php if ($royalty) { ?>
                            <p class="assets_nft_buttons"><?php echo $royalty ?>
                                % <?php echo $texts["NFT"]["SalesCreator"] ?></p>
						<?php } ?>
                        <div class="assets_nft_tabs">
                            <ul>
                                <li id="details" class="tablinks active"><?php echo $texts["NFT"]["Details"] ?></li>
                                <li id="bids" class="tablinks" style="display: none;"><?php echo $texts["NFT"]["Bids"] ?></li>
                                <li id="history" class="tablinks" style="display: none;"><?php echo $texts["NFT"]["History"] ?></li>
                            </ul>
                        </div>
						<div class="table_description">
						    <table class="assets_collection_info">
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
							</table>
						</div>
                        <div class="assets_goback_section">
                            <button class="Q_button assets_register_submit" id="assets_goback"><?php echo $texts["NFT"]["Back"] ?></button>
                        </div>
                        <div class="tabcontent details active-content">

                        </div>
                        <div class="tabcontent bids">

                        </div>
                        <div class="tabcontent history">

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <input type="hidden" name="publisherId" value="<?php echo $stream->publisherId ?>">
    <input type="hidden" name="streamName" value="<?php echo $stream->name ?>">
</div>

<div id="content">

    <!-- Outer container -->
    <div class="assets_nft">
        <div class="layout-container">
            <div class="assets_nft_row">
                <div class="assets_nft_col_eight">
                    <?php
                        echo Q::tool("Assets/NFT/preview", array(
                             "tokenId" => $tokenId,
                             "chainId"=> $chainId
                        ));
                    ?>
                </div>
                <div class="assets_nft_col_four">
                    <div class="assets_nft_details">
                        <div class="assets_nft_details_header">
                            <div class="assets_nft_details_header_left">
                                <h2><?=$nftInfo["name"]?></h2>
                            </div>
                        </div>
                        <div class="assets_nft_body">
                            <div class="assets_nft_body_left author">
                                <h2><?=$texts["NFT"]["Author"]?></h2>
                                <div class="assets_nft_body_details">
                                    <img src="../../img/t.png"/>
                                    <span class="assets_nft_wallet"><?=$nftInfo["author"]?></span>
                                </div>
                            </div>
                            <div class="assets_nft_body_left owner">
                                <h2><?=$texts["NFT"]["Owner"]?></h2>
                                <div class="assets_nft_body_details">
                                    <img src="../../img/t.png"/>
                                    <span class="assets_nft_wallet"><?=$nftInfo["name"]?></span>
                                </div>
                            </div>
                        </div>
                        <div class="assets_nft_tabs">
                            <ul>
                                <li id="details" class="tablinks active"><?=$texts["NFT"]["Details"]?></li>
                                <li id="bids" class="tablinks" style="display: none;"><?=$texts["NFT"]["Bids"]?></li>
                                <li id="history" class="tablinks" style="display: none;"><?=$texts["NFT"]["History"]?></li>
                            </ul>
                        </div>
						<div class="table_description">
						    <table class="assets_collection_info">
							    <tr>
							        <td><?=$texts["NFT"]["Title"]?>:</td>
                                    <td><?=$nftInfo["data"]["name"]?></td>
							    </tr>
                                <tr>
							        <td><?=$texts["NFT"]["Author"]?>:</td>
                                    <td><?=$nftInfo["author"]?></td>
                                </tr>
                                <tr>
                                    <td><?=$texts["NFT"]["Owner"]?>:</td>
                                    <td><?=$nftInfo["owner"]?></td>
                                </tr>
								<?php if ($nftInfo["data"]["description"]) {?>
                                    <tr>
                                        <td><?=$texts["NFT"]["Description"]?>:</td><td><?=$nftInfo["data"]["description"]?></td>
                                    </tr>
								<?php } ?>
								<?php if (!empty($nftInfo["data"]["attributes"])) {?>
                                    <tr>
                                        <td style="vertical-align: top"><?=$texts["NFT"]["attributes"]["Attributes"]?>:</td><td>
                                            <table class="assetsNFTAttributes">
												<?php foreach ($nftInfo["data"]["attributes"] as $attribute) {
													echo "<tr><td>".$attribute["trait_type"].":</td><td>".$attribute["value"]."</td></tr>";
												} ?>
                                            </table>
                                        </td>
                                    </tr>
								<?php } ?>
                            </table>
						</div>
                        <?php if ($ownerId) { ?>
                        <div class="assets_goback_section">
                            <button class="Q_button assets_register_submit" id="assets_goback"><?php echo $texts["NFT"]["Back"] ?></button>
                        </div>
                        <?php } ?>
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

    <input type="hidden" name="ownerId" value="<?=$ownerId?>">
</div>

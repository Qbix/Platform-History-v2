(function (window, Q, $, undefined) {
    /**
     * @module Assets
     */

    var Assets = Q.Assets;
    var Web3 = Assets.Web3;
    var NFT = Web3.NFT;

    /**
     * YUIDoc description goes here
     * @class Assets NFT/preview
     * @constructor
     * @param {Object} [options] Override various options for this tool
     *  @param {string|object} data - JSON object with all needed data to construct NFT
     *  @param {boolean} [onMarketPlace=true] default value of onMarketPlace
     *  @param {boolean} [useWeb3=true] If true use blockchain to read info about NFT (author, owners, saleInfo)
     *  @param {boolean} [poster] URL of poster image for movie (If movie provided)
     *  @param {boolean} [movie] Movie URL. If no image defined during NFT creation, this movie will be used instead.
     *  On NFT/view the movie will display instead image (event if image defined).
     *  @param {boolean} [src] URL of additional image which will use instead default image.
     *  @param {Q.Event} [options.onInvoke] Event occur when user click on tool element.
     *  @param {Q.Event} [options.onAvatar] Event occur when click on Users/avatar tool inside tool element.
     */
    Q.Tool.define("Assets/NFT/preview", ["Streams/preview"], function(options, preview) {
            var tool = this;
            var state = tool.state;
            var previewState = preview.state;
            var $toolElement = $(this.element);
            tool.preview = preview;

            // <set Streams/preview imagepicker settings>
            previewState.imagepicker.showSize = state.imagepicker.showSize;
            previewState.imagepicker.fullSize = state.imagepicker.fullSize;
            previewState.imagepicker.save = state.imagepicker.save;
            previewState.imagepicker.saveSizeName = {};
            Q.each(NFT.icon.sizes, function (i, size) {
                previewState.imagepicker.saveSizeName[size] = size;
            });
            // </set Streams/preview imagepicker settings>

            var pipe = Q.pipe(["stylesheet", "text", "interests", "likes"], function (params, subjects) {
                if (!previewState.streamName) {
                    previewState.onComposer.add(tool.composer.bind(tool), tool);
                    return;
                }

                previewState.onRefresh.add(function (stream) {
                    tool.stream = stream;

                    $toolElement.addClass("Q_working");

                    var pipe = new Q.pipe(["author", "owner", "commissionInfo", "saleInfo"], function (params, subjects) {
                        var author = params.author[1];
                        var owner = params.owner[1];
                        var commissionInfo = params.commissionInfo[1];
                        var saleInfo = params.saleInfo[1];

                        tool.refresh(stream, author, owner, commissionInfo, saleInfo);
                        $toolElement.removeClass("Q_working");

                        Q.Users.Web3.onAccountsChanged.set(function () {
                            tool.refresh(stream, author, owner, commissionInfo, saleInfo);
                        }, tool);
                    });

                    var _fallback = function () {
                        pipe.fill("author")(stream.getAttribute("author"));
                        pipe.fill("owner")();
                        pipe.fill("commissionInfo")();
                        pipe.fill("saleInfo")({
                            isSale: false,
                            price: null,
                            currencyToken: null
                        });
                    };
                    tool.tokenId = stream.getAttribute("tokenId");
                    tool.chainId = stream.getAttribute("chainId") || stream.getAttribute("network");
                    $toolElement.attr("data-tokenId", tool.tokenId);
                    $toolElement.attr("data-chainId", tool.chainId);

                    tool.network = NFT.networks.filter(obj => { return obj.chainId === tool.chainId })[0];

                    if (!tool.tokenId) {
                        return _fallback();
                    }

                    if (state.useWeb3) {
                        Q.handle(Assets.batchFunction(), null, ["NFT", "getInfo", tool.tokenId, tool.network.chainId, !!state.updateCache, function (err, data) {
                            state.updateCache = false;

                            var msg = Q.firstErrorMessage(err, data);
                            if (msg) {
                                return console.error(msg);
                            }

                            var currencyToken = this.saleInfo[0];
                            var price = this.saleInfo[1];
                            var priceDecimal = price ? parseInt(price)/1e18 : null;
                            var isSale = this.saleInfo[2];

                            pipe.fill("author")(null, this.author || stream.getAttribute("author"));
                            pipe.fill("owner")(null, this.owner || "");
                            pipe.fill("commissionInfo")(null, this.commissionInfo || "");
                            pipe.fill("saleInfo")(null, {
                                isSale: isSale,
                                price: price,
                                priceDecimal: priceDecimal,
                                currencyToken: currencyToken
                            });
                        }]);
                    } else {
                        if (tool.chainId !== window.ethereum.chainId) {
                            return _fallback();
                        }

                        Q.handle(NFT.getAuthor, tool, [tool.tokenId, tool.network, pipe.fill("author")]);
                        Q.handle(NFT.getOwner, tool, [tool.tokenId, tool.network, pipe.fill("owner")]);
                        Q.handle(NFT.commissionInfo, tool, [tool.tokenId, tool.network, pipe.fill("commissionInfo")]);
                        Q.handle(NFT.saleInfo, tool, [tool.tokenId, tool.network, pipe.fill("saleInfo")]);
                    }
                }, tool);
            });

            var _fallback = function () {
                pipe.fill("author")();
                pipe.fill("owner")();
                pipe.fill("commissionInfo")();
                pipe.fill("saleInfo")({
                    isSale: false,
                    price: null,
                    currencyToken: null
                });
            };
            tool.tokenId = data.attributes.tokenId;
            tool.chainId = data.attributes.chainId || data.attributes.network;
            tool.chain = NFT.chains[tool.chainId];
            $toolElement.attr("data-tokenId", tool.tokenId);
            $toolElement.attr("data-chainId", tool.chainId);

            if (!tool.tokenId) {
                return _fallback();
            }

            if (state.useWeb3) {
                Q.handle(Assets.batchFunction(), null, ["NFT", "getInfo", tool.tokenId, tool.chainId, !!state.updateCache, function (err, data) {
                    state.updateCache = false;

                    var msg = Q.firstErrorMessage(err, data);
                    if (msg) {
                        return console.error(msg);
                    }

                    var currencyToken = this.saleInfo[0];
                    var price = this.saleInfo[1];
                    var priceDecimal = price ? parseInt(price)/1e18 : null;
                    var isSale = this.saleInfo[2];

                    pipe.fill("author")(null, this.author || "");
                    pipe.fill("owner")(null, this.owner || "");
                    pipe.fill("commissionInfo")(null, this.commissionInfo || "");
                    pipe.fill("saleInfo")(null, {
                        isSale: isSale,
                        price: price,
                        priceDecimal: priceDecimal,
                        currencyToken: currencyToken
                    });
                }]);
            } else {
                if (tool.chainId !== window.ethereum.chainId) {
                    return _fallback();
                }

                Q.handle(NFT.getAuthor, tool, [tool.tokenId, tool.chain, pipe.fill("author")]);
                Q.handle(NFT.getOwner, tool, [tool.tokenId, tool.chain, pipe.fill("owner")]);
                Q.handle(NFT.commissionInfo, tool, [tool.tokenId, tool.chain, pipe.fill("commissionInfo")]);
                Q.handle(NFT.saleInfo, tool, [tool.tokenId, tool.chain, pipe.fill("saleInfo")]);
            }
        });

        Q.addStylesheet("{{Assets}}/css/tools/NFT/preview.css", pipe.fill('stylesheet'), { slotName: 'Assets' });
        Q.Text.get('Assets/content', function(err, text) {
            tool.text = text;
            pipe.fill('text')();
        }, {
            ignoreCache: true
        });
    },

    { // default options here
        data: null,
        useWeb3: true,
        onMarketPlace: true,
        onInvoke: new Q.Event(),
        onAvatar: new Q.Event(),
        poster: null,
        movie: null,
        src: null
    },

    {
        /**
         * Refreshes the appearance of the tool completely
         * @method refresh
         * @param {Object} data
         * @param {String} author
         * @param {String} owner
         * @param {object} comissionInfo
         * @param {object} saleInfo
         */
        refresh: function (data, author, owner, comissionInfo, saleInfo) {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);
            var userId = Q.Users.loggedInUserId();

            var selectedAddress = (Q.getObject("ethereum.selectedAddress", window) || "").toLowerCase();
            owner = owner || "";

            if (owner) {
                $toolElement.attr("data-owned", owner.toLowerCase() === selectedAddress.toLowerCase());
            } else {
                $toolElement.attr("data-owned", false);
            }

            if (saleInfo) {
                $toolElement.attr("data-onSale", Q.getObject("isSale", saleInfo));
            } else {
                $toolElement.attr("data-onSale", false);
            }

            var currencyToken = saleInfo.currencyToken;
            var currency;
            if (tool.tokenId) {
                // get currency symbol from currency token and chainId
                currency = NFT.currencies.filter(function(item) { return item[tool.chainId] === currencyToken; });
            } else {
                $toolElement.addClass("Assets_NFT_comingsoon");
            }

            var price = Q.getObject("priceDecimal", saleInfo);

            NFT.onTransfer.set(function (oldAddress, newAddress, token) {
                var processedTokenId = parseInt(token._hex, 16);
                if (parseInt(tool.tokenId) !== processedTokenId) {
                    return;
                }

                state.updateCache = true;
                Q.handle(tool.init, tool, []);
            }, tool);

            var _saleChanged = function (token) {
                var processedTokenId = parseInt(token._hex, 16);
                if (parseInt(tool.tokenId) !== processedTokenId) {
                    return;
                }

                state.updateCache = true;
                Q.handle(tool.init, tool, []);
            };
            NFT.onTokenAddedToSale.set(function (tokenId, amount, consumeToken) {
                _saleChanged(tokenId);
            }, tool);
            NFT.onTokenRemovedFromSale.set(function (tokenId) {
                _saleChanged(tokenId);
            }, tool);

            Q.Template.render('Assets/NFT/view', {
                title: data.title,
                price: price,
                currency: currency,
                owner: NFT.minimizeAddress(owner, 20, 3)
            }, (err, html) => {
                tool.element.innerHTML = html;

                $toolElement.activate();

                $(".assets_NFT_avatar", tool.element).tool("Users/avatar", {
                    userId: userId,
                    icon: 50,
                    contents: true,
                    editable: false
                }).activate(function () {
                    $(this.element).on(Q.Pointer.fastclick, function (e) {
                        Q.handle(state.onAvatar, this, [e]);
                    });
                });

                // apply Streams/preview icon behavior
                var movie = data.attributes["video"] || data.attributes["Q.file.url"];
                var poster = state.poster;
                var nftMovie = state.movie;
                var nftSrc = state.src;

                if (nftMovie) {
                    $(".video-container", tool.element).empty().html('<video preload="auto" poster="' + poster + '" controls="" src="' + nftMovie + '"></video>');
                    $(".assets_nft_col_eight .video-container").on(Q.Pointer.fastclick, function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    });
                } else if (nftSrc) {
                    $(".video-container", tool.element).empty().html('<img alt="icon" class="NFT_preview_icon" src="' + nftSrc + '">');
                } else if (movie && data.icon.includes("/img/empty_white.png")) {
                    var qVideo = $("<div>").tool("Q/video", {
                        url: movie,
                        loop: true
                    }).activate();
                    qVideo.on(Q.Pointer.fastclick, function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    });
                    $("img.NFT_preview_icon", tool.element).replaceWith(qVideo);
                } else {
                    $("img.NFT_preview_icon", tool.element).prop("src", data.image);
                }

                // handle with days, hours, minutes visibility
                var $startDate = $(".assets_NFT_startDate", tool.element);
                var $endDate = $(".assets_NFT_endDate", tool.element);
                if ($startDate.length || $endDate.length) {
                    // apply Q/countdown tool to startTime, endTime
                    $("[data-timestamp]", tool.element).each(function () {
                        $(this).tool("Q/countdown", {
                            onRefresh: function () {
                                var $currentElement = $(this.element);
                                var currentTimestamp = Date.now()/1000;
                                if (startTime > currentTimestamp) {
                                    $startDate.show();
                                    $endDate.hide();
                                } else {
                                    $startDate.hide();
                                    $endDate.show();
                                    $toolElement.removeClass("Assets_NFT_notStarted");

                                    if (endTime && endTime < currentTimestamp) {
                                        $toolElement.addClass("Assets_NFT_ended");
                                    }
                                }

                                $(".Q_days:visible, .Q_hours:visible, .Q_minutes:visible, .Q_seconds:visible", $currentElement).each(function () {
                                    var $this = $(this);
                                    if (($this.hasClass("Q_days") || $this.hasClass("Q_hours") || $this.hasClass("Q_minutes")) && $this.text() === "0") {
                                        var $parent = $this.parent();
                                        var $prevSpan = $parent.prev("span:visible");
                                        if (!$prevSpan.length) {
                                            $parent.hide();
                                        }
                                    }

                                    Q.each(["day", "hour", "minute"], function(i, val) {
                                        if (val === 'day') {
                                            if ($this.hasClass("Q_" +val + "s") && $this.text() === "1") {
                                                $this.next("." + val + "sText").text(tool.text.NFT[val.toCapitalized()]);
                                            } else {
                                                $this.next("." + val + "sText").text(tool.text.NFT[(val + "s").toCapitalized()]);
                                            }
                                        } else {
                                            $this.next("." + val + "sText").text(':');
                                        }

                                    });
                                });
                            }
                        }).activate();
                    });
                }

                // set onInvoke event
                $toolElement.on(Q.Pointer.fastclick, function () {
                    Q.handle(state.onInvoke, tool, [tool.tokenId, tool.chainId]);
                });

                // buy NFT
                $("button[name=placeBid]", tool.element).on(Q.Pointer.fastclick, function (e) {
                    e.stopPropagation();
                    e.preventDefault();

                    NFT.checkProvider(tool.chain, function (err) {
                        if (err) {
                            return;
                        }

                        NFT.buy(tool.tokenId, tool.chain, currency, function (err, transaction) {});
                    });
                });

                // buy NFT
                $("button[name=buy]", tool.element).on(Q.Pointer.fastclick, function (e) {
                    e.stopPropagation();
                    e.preventDefault();

                    Q.alert("Under Construction");
                    return false;
                });

                // button only for owner, provide actions Transfer and put on/off sale
                $("button[name=update]", tool.element).on(Q.Pointer.fastclick, function (e) {
                    e.stopPropagation();
                    e.preventDefault();

                    var content = "";
                    if (Q.getObject("isSale", saleInfo)) {
                        content += '<button name="offSale" class="Q_button">' + tool.text.NFT.PutOffSale + '</button>';
                    } else {
                        content += '<button name="onSale" class="Q_button">' + tool.text.NFT.PutOnSale + '</button>';
                    }

                    content += '<button name="transfer" class="Q_button">' + tool.text.NFT.Transfer + '</button>';

                    Q.Dialogs.push({
                        title: "Update NFT",
                        content: content,
                        className: 'Assets_NFT_update',
                        onActivate: function (dialog) {
                            // Put NFT on sale
                            $("button[name=onSale]", dialog).on("click", function () {
                                NFT.checkProvider(tool.chain, function (err, contract) {
                                    if (err) {
                                        return $toolElement.removeClass("Q_working");
                                    }

                                    contract["listForSale(uint256,uint256,address)"](tool.tokenId.toString(), saleInfo.price.toString(), saleInfo.currencyToken).catch(function (e) {
                                        console.error(e);
                                        $toolElement.removeClass("Q_working");
                                    });
                                });

                                Q.Dialogs.pop();
                                $toolElement.addClass("Q_working");
                            });

                            // Put NFT off sale
                            $("button[name=offSale]", dialog).on("click", function () {
                                NFT.checkProvider(tool.chain, function (err, contract) {
                                    if (err) {
                                        return $toolElement.removeClass("Q_working");
                                    }

                                    contract.removeFromSale(tool.tokenId).catch(function (e) {
                                        console.error(e);
                                        $toolElement.removeClass("Q_working");
                                    });
                                });

                                Q.Dialogs.pop();
                                $toolElement.addClass("Q_working");
                            });

                            // Transfer NFT from one wallet to another
                            $("button[name=transfer]", dialog).on("click", function () {
                                Q.prompt(null, function (address) {
                                    if (!address) {
                                        return;
                                    }

                                    NFT.checkProvider(tool.chain, function (err, contract) {
                                        if (err) {
                                            return $toolElement.removeClass("Q_working");
                                        }

                                        contract.transferFrom(owner, address, tool.tokenId).catch(function (e) {
                                            console.error(e);
                                            $toolElement.removeClass("Q_working");
                                        });
                                    });

                                    Q.Dialogs.pop();
                                    $toolElement.addClass("Q_working");
                                },{
                                    title: "Wallet address"
                                });
                            });
                        }
                    });
                });
            });
        },
        /**
         * Create token for NFT
         * @method createToken
         * @param {number} price - Price of NFT in decimal.
         * @param {object} currency - Object with details of currency (symbol, name, decimals, token, commissionToken).
         * @param {object} chain - Object with details of chain (chainId, contract, name, rpcUrls, blockExplorerUrls) selected to create token in.
         * @param {number} royalty - Royalty in percents from price.
         * @param {boolean} [onSale=false] If false, call contract.create which just create token, but not put NFT to listForSale
         * @param {function} callback
         */
        createToken: function (price, currency, chain, royalty, onSale,  callback) {
            var tool = this;
            var currencyToken = currency.token;
            var commissionToken = currency.commissionToken;

            NFT.checkProvider(chain, function (err, contract) {
                if (err) {
                    return Q.handle(callback, tool, [err]);
                }

                // price should be integer with 18 decimals
                price = 1e18 * price.toFixed(4);
                var reduceCommissionPercent = price ? 0 : 10000;
                royalty = parseFloat(royalty).toFixed(2) || 0;
                royalty = parseInt(royalty > 0 ? price/(100/royalty) : 0) || 0;
                royalty = '0x'+(royalty).toString(16);
                var commissionParams = [commissionToken, royalty, 1, 0, 1, reduceCommissionPercent];
                if (onSale && !price) {
                    Q.alert(tool.text.errors.PriceRequired, {
                        title: tool.text.errors.Error
                    });
                    return Q.handle(callback, tool, [tool.text.errors.PriceRequired]);
                }

                // listen transaction receipt and get TokenCreated event results
                var _transactionHandler = function (TransactionReceipt) {
                    if (NFT.isSuccessfulTransaction(TransactionReceipt)) {
                        for (var i in TransactionReceipt.events) {
                            if (TransactionReceipt.events[i].event !== "TokenCreated") {
                                continue;
                            }

                            return Q.handle(callback, tool, [
                                null,
                                TransactionReceipt.events[i].args['tokenId'].toString(),
                                window.ethereum.chainId,
                                TransactionReceipt.events[i].args['author']
                            ]);
                        }
                    } else {
                        Q.handle(callback, null, ["transaction failed"]);
                    }
                };
                var _transactionFailed = function (err) {
                    var errMsg = err.reason || err.message;
                    Q.alert(errMsg, {
                        title: tool.text.errors.Error
                    });
                    Q.handle(callback, null, [errMsg]);
                };

                var _jsonURL = Q.url("NFT/" + previewState.publisherId + "/" + lastPart + ".json");

                if (onSale) { // if need to put NFT on sale, use method "createAndSale", which create token and put on sale
                    contract.createAndSale(
                        _jsonURL,
                        commissionParams,
                        '0x'+(price).toString(16),
                        currencyToken
                    ).then(function (transactionRequest) {
                        transactionRequest.wait(1).then(_transactionHandler, _transactionFailed);
                    }, _transactionFailed);
                } else { // else use method "create", which just create token
                    var arrayArgs = [_jsonURL, commissionParams];
                    if (tool.series) { // if series created, add one more argument
                        arrayArgs.push(tokensAmount);
                    }
                    contract.create.apply(null, arrayArgs).then(function (transactionRequest) {
                        transactionRequest.wait(1).then(_transactionHandler, _transactionFailed);
                    }, _transactionFailed);
                }
            });
        },
        Q: {
            beforeRemove: function () {
                if (this.state.countdownTimeId) {
                    clearInterval(this.state.countdownTimeId);
                }

                this.observer && this.observer.disconnect();
            }
        }
    });

    Q.Template.set('Assets/NFT/view',
        `<div class="tile-block">
        <div class="tile_block_header">
            <ul class="online-c Assets_author">
                <li><div class="Assets_NFT_avatar"></div></li>
            </ul>
            <div style="display: none">
                <p class="categories">{{#each interests}} {{this}} {{/each}}</p>
                <div class="NFT_preview_owner">{{NFT.Owner}}: <span class="NFT_owner">{{owner}}</span></div>
            </div>
        </div>
        <div class="video-container">
            <img class="NFT_preview_icon">
        </div>
        <h2 class="tile-name">{{title}}</h2>
        <ul class="bid-info">
            <li class="Assets_NFT_price">
                <p><span class="Assets_NFT_price_value">{{price}}</span> {{currency}}</p>
                <span class="Assets_NFT_comingsoon">Coming Soon</span>
            </li>
            <li class="action-block">
                <button name="buy" class="Q_button">{{NFT.Buy}}</button>
                <button name="placeBid" class="Q_button">{{NFT.PlaceBid}}</button>
                <button name="soldOut" class="Q_button">{{NFT.SoldOut}}</button>
                <button name="update" class="Q_button">{{NFT.Update}}</button>
            </li>
        </ul>
    </div>`,
    {text: ['Assets/content']}
    );
})(window, Q, jQuery);
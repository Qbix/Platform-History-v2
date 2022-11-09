(function (window, Q, $, undefined) {
    /**
     * @module Assets
     */

    var Users = Q.Users;
    var Assets = Q.Assets;
    var Web3 = Assets.NFT.Web3;
    var NFT = Assets.NFT;
    /**
     * YUIDoc description goes here
     * @class Assets NFT/preview
     * @constructor
     * @param {Object} [options] Override various options for this tool
     *  @param {string} chainId - blockchain chain id
     *  @param {string} tokenId - NFT token is in the chain described by chainId
     *  @param {boolean} [composer=false] - If true build composer.
     *  @param {String} [mode=regular] - Can be "regular" and "series".
     *  If "series" - skip definition of "price", "currency", "royalty", "chain", because get these data from serie.
     *  @param {boolean} [useWeb3=false] If true use backend to read data from blockchain
     *  @param {string} [userId] - id of user on whose behalf NFT will be created
     *  @param {boolean} [poster] URL of poster image for movie (If movie provided)
     *  @param {boolean} [movie] Movie URL. If no image defined during NFT creation, this movie will be used instead.
     *  On NFT/view the movie will display instead image (event if image defined).
     *  @param {boolean} [src] URL of additional image which will use instead default image.
     *  @param {Q.Event} [options.onInvoke] Event occur when user click on tool element.
     *  @param {Q.Event} [options.onAvatar] Event occur when click on Users/avatar tool inside tool element.
     *  @param {Q.Event} [options.onCreated] Event occur when NFT created.
     */
    Q.Tool.define("Assets/NFT/preview", function(options) {
        var tool = this;
        var state = tool.state;
        var $toolElement = $(this.element);
        var loggedInUserId = Q.Users.loggedInUserId();
        tool.preview = Q.Tool.from(this.element, "Streams/preview");

        // is admin
        var roles = Object.keys(Q.getObject("roles", Q.Users) || {});
        tool.isAdmin = (roles.includes('Users/owners') || roles.includes('Users/admins'));

        if (!state.composer) {
            if (Q.isEmpty(state.chainId)) {
                return console.warn("chain id required!");
            }
            if (typeof state.tokenId === 'undefined' || isNaN(parseInt(state.tokenId))) {
                return console.warn("token id required!");
            }
        }

        var pipe = Q.pipe(["stylesheet", "text"], function (params, subjects) {
            $toolElement.addClass("Q_working");
            state.chain = NFT.Web3.chains[state.chainId];
            $toolElement.attr("data-tokenId", state.tokenId);
            $toolElement.attr("data-chainId", state.chainId);

            // get all data from blockchain and refresh
            tool.init();
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
        chainId: null,
        tokenId: null,
        data: null,
        userId: null,
        mode: "regular", // "series"
        composer: false,
        useWeb3: true,
        imagepicker: {
            showSize: NFT.icon.defaultSize,
            save: "NFT/icon"
        },
        onMarketPlace: true,
        onInvoke: new Q.Event(),
        onAvatar: new Q.Event(),
        onCreated: new Q.Event(),
        poster: null,
        movie: null,
        src: null
    },

    {
        /**
         * Get all data from blockchain and refresh
         * @method init
         */
        init: function () {
            var tool = this;
            var state = this.state;
            var $toolElement = $(this.element);
            var loggedInUserId = Q.Users.loggedInUserId();
            var pipeList = ["data", "author", "owner", "commissionInfo", "saleInfo", "authorUserId"];

            if (state.composer) {
                $toolElement.addClass("Assets_NFT_composer");
                if ((loggedInUserId && state.userId === loggedInUserId) || tool.isAdmin) {
                    $toolElement.removeClass("Q_working");
                    tool.composer();
                } else {
                    Q.Tool.remove(tool.element, true, true);
                }

                return;
            }

            $toolElement.append('<img src="' + Q.url("{{Q}}/img/throbbers/loading.gif") + '">');

            var pipe = new Q.pipe(pipeList, function (params, subjects) {
                // collect errors
                var errors = [];
                Q.each(pipeList, function (index, value) {
                    var err = Q.getObject([value, 0], params);
                    err && errors.push(err);
                });
                if (!Q.isEmpty(errors)) {
                    return console.warn(errors);
                }

                var data = params.data[1];
                var author = params.author[1];
                var owner = params.owner[1];
                var commissionInfo = params.commissionInfo[1];
                var saleInfo = params.saleInfo[1];
                var authorUserId = params.authorUserId[1];
                authorUserId = authorUserId || '';

                tool.refresh(data, author, owner, commissionInfo, saleInfo, authorUserId);
                $toolElement.removeClass("Q_working");

                Users.Web3.onAccountsChanged.set(function () {
                    tool.refresh(data, author, owner, commissionInfo, saleInfo, authorUserId);
                }, tool);
            });

            if (state.useWeb3) {
                Q.handle(Assets.batchFunction(), null, ["NFT", "getInfo", state.tokenId, state.chainId, state.updateCache, function (err, data) {
                    state.updateCache = false;

                    var msg = Q.firstErrorMessage(err, data);
                    if (msg) {
                        return console.error(msg);
                    }

                    var currencyToken = this.saleInfo[0];
                    var price = this.saleInfo[1];
                    var priceDecimal = price ? parseInt(price)/1e18 : null;
                    var isSale = this.saleInfo[2];

                    pipe.fill("authorUserId")(null, this.authorUserId || "");
                    pipe.fill("data")(null, this.data || "");
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

                // get smart contract just to set contract events to update preview
                NFT.Web3.getContract(state.chain);
            } else {
                if (state.chainId !== Q.getObject("ethereum.chainId", window)) {
                    return console.warn("Chain id selected is not appropriate to NFT chain id " + state.chainId);
                }

                // if data defined, don't request it
                if (state.data) {
                    pipe.fill("data")(null, state.data);
                } else {
                    Q.handle(Web3.getTokenJSON, tool, [state.tokenId, state.chain, pipe.fill("data")]);
                }

                Q.handle(Web3.getAuthor, tool, [state.tokenId, state.chain, function (err, author) {
                    if (err) {
                        return console.warn(err);
                    }

                    pipe.fill("author")(arguments[0], arguments[1], arguments[2]);
                    Q.req("Assets/NFT", "getUserIdByWallet", function (err, response) {
                        if (err) {
                            return console.warn(err);
                        }

                        pipe.fill("authorUserId")(null, response.slots.getUserIdByWallet);
                    }, {
                        fields: { wallet: author }
                    });
                }]);
                Q.handle(Web3.getOwner, tool, [state.tokenId, state.chain, pipe.fill("owner")]);
                Q.handle(Web3.commissionInfo, tool, [state.tokenId, state.chain, pipe.fill("commissionInfo")]);
                Q.handle(Web3.saleInfo, tool, [state.tokenId, state.chain, pipe.fill("saleInfo")]);
            }
        },
        /**
         * Refreshes the appearance of the tool completely
         * @method refresh
         * @param {Object} data
         * @param {String} author
         * @param {String} owner
         * @param {object} commissionInfo
         * @param {object} saleInfo
         * @param {string} authorUserId - id of NFT author user
         */
        refresh: function (data, author, owner, commissionInfo, saleInfo, authorUserId) {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);

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
            if (typeof state.tokenId !== 'undefined' && !isNaN(parseInt(state.tokenId))) {
                // get currency symbol from currency token and chainId
                currency = NFT.currencies.filter(function(item) { return item[state.chainId] === currencyToken; });
                if (Q.isArrayLike(currency)) {
                    currency = currency[0];
                }
            } else {
                $toolElement.addClass("Assets_NFT_comingsoon");
            }

            var price = Q.getObject("priceDecimal", saleInfo);

            Web3.onTransfer.set(function (oldAddress, newAddress, token) {
                var processedTokenId = parseInt(token._hex, 16);
                if (parseInt(state.tokenId) !== processedTokenId) {
                    return;
                }

                state.updateCache = true;
                tool.init();
            }, tool);

            var _saleChanged = function (token) {
                var processedTokenId = parseInt(token._hex, 16);
                if (parseInt(state.tokenId) !== processedTokenId) {
                    return;
                }

                state.updateCache = true;
                tool.init();
            };
            Web3.onTokenPutOnSale.set(function (tokenId, amount, consumeToken) {
                _saleChanged(tokenId);
            }, tool);
            Web3.onTokenRemovedFromSale.set(function (tokenId) {
                _saleChanged(tokenId);
            }, tool);

            Q.Template.render('Assets/NFT/view', {
                title: data.name,
                price: price,
                currency: currency,
                owner: Web3.minimizeAddress(owner, 20, 3)
            }, (err, html) => {
                tool.element.innerHTML = html;

                $toolElement.activate();

                if (authorUserId) {
                    $(".Assets_NFT_avatar", tool.element).tool("Users/avatar", {
                        userId: authorUserId,
                        icon: 50,
                        contents: true,
                        editable: false
                    }).activate(function () {
                        $(this.element).on(Q.Pointer.fastclick, function (e) {
                            Q.handle(state.onAvatar, this, [e]);
                        });
                    });
                } else {
                    $(".Assets_NFT_avatar", tool.element).html(Web3.minimizeAddress(author, 20, 3));
                }

                // apply Streams/preview icon behavior
                var movie = data.animation_url;
                var poster = state.poster;
                var nftMovie = state.movie;
                var nftSrc = state.src;
                var $videoContainer = $(".video-container", tool.element);

                if (nftMovie) {
                    $videoContainer.html('<video preload="auto" poster="' + poster + '" controls="" src="' + nftMovie + '"></video>');
                    $videoContainer.on(Q.Pointer.fastclick, function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    });
                } else if (nftSrc) {
                    $videoContainer.empty().css("background-image", 'url(' + nftSrc + ')');
                } else if (movie && !data.image) {
                    var qVideo = $("<div>").tool("Q/video", {
                        url: movie,
                        loop: true
                    }).activate();
                    qVideo.on(Q.Pointer.fastclick, function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    });
                    $videoContainer.html(qVideo);
                } else {
                    $videoContainer.empty().css("background-image", 'url(' + data.image + ')');
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
                $toolElement.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
                    Q.handle(state.onInvoke, tool, [state.tokenId, state.chainId, author, owner]);
                });

                // buy NFT
                $("button[name=buy]", tool.element).on(Q.Pointer.fastclick, function (e) {
                    e.stopPropagation();
                    e.preventDefault();

                    NFT.Web3.buy(state.tokenId, state.chain, currency, function (err, transaction) {
                        state.updateCache = true;
                        tool.init();
                    });
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
                        title: tool.text.NFT.Actions,
                        content: content,
                        className: 'Assets_NFT_update',
                        onActivate: function (dialog) {
                            // Put NFT on sale
                            $("button[name=onSale]", dialog).on("click", function () {
                                Users.Web3.execute(
                                    'Assets/templates/NFT',
                                    {
                                        chainId: state.chainId,
                                        address: NFT.Web3.chains[state.chainId].contract
                                    },
                                    "listForSale(uint256,uint256,address)",
                                    [state.tokenId.toString(), saleInfo.price.toString(), saleInfo.currencyToken],
                                    function (e) {
                                        console.error(e);
                                        $toolElement.removeClass("Q_working");
                                    }
                                );
                                Q.Dialogs.pop();
                                $toolElement.addClass("Q_working");
                            });

                            // Put NFT off sale
                            $("button[name=offSale]", dialog).on("click", function () {
                                Users.Web3.execute(
                                    'Assets/templates/NFT',
                                    {
                                        chainId: state.chainId,
                                        address: NFT.Web3.chains[state.chainId].contract
                                    },
                                    "removeFromSale",
                                    [state.tokenId],
                                    function (e) {
                                        console.error(e);
                                        $toolElement.removeClass("Q_working");
                                    }
                                );
                                Q.Dialogs.pop();
                                $toolElement.addClass("Q_working");
                            });

                            // Transfer NFT from one wallet to another
                            $("button[name=transfer]", dialog).on("click", function () {
                                Q.prompt(null, function (address) {
                                    if (!address) {
                                        return;
                                    }
                                    Users.Web3.execute(
                                        'Assets/templates/NFT',
                                        {
                                            chainId: state.chainId,
                                            address: NFT.Web3.chains[state.chainId].contract
                                        },
                                        "transferFrom",
                                        [owner, address, state.tokenId],
                                        function (e) {
                                            console.error(e);
                                            $toolElement.removeClass("Q_working");
                                        }
                                    );
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
         * Create NFT
         * @method composer
         */
        composer: function () {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);
            var previewState = {};
            var chains = {};
            var userId = state.userId;

            // get supported chains
            Q.each(NFT.chains, function (i, chain) {
                chains[chain.name] = chain;
            });

            var _openDialog = function () {
                Q.Dialogs.push({
                    title: tool.text.NFT.CreateNFT,
                    className: "Assets_NFT_preview_composer",
                    template: {
                        name: "Assets/NFT/nftCreate",
                        fields: {
                            chains: chains,
                            mode: state.mode,
                            currencies: NFT.currencies.map(a => a.symbol),
                            onMarketPlace: state.onMarketPlace,
                            baseUrl: Q.baseUrl()
                        }
                    },
                    onActivate: function (dialog) {
                        var $icon = $("img.NFT_preview_icon", dialog);

                        // apply Streams/preview icon behavior
                        tool.preview.icon($icon[0]);

                        // manage attributes
                        tool.manageAttributes($(".Assets_nft_attributes", dialog));
                        $("button[name=addAttribute]", dialog).on(Q.Pointer.fastclick, function (event) {
                            event.preventDefault();
                            tool.manageAttributes($(".Assets_nft_attributes", dialog));
                            return false;
                        });

                        // upload image button
                        $(".Assets_nft_upload_button", dialog).on(Q.Pointer.fastclick, function (event) {
                            event.preventDefault();
                            $icon.trigger("click");
                        });

                        // composer tabs (Fixed price, Timed action ...)
                        $(".Assets_nft_clickable", dialog).on(Q.Pointer.fastclick, function (event) {
                            event.preventDefault();
                            $(".Assets_nft_clickable").removeClass("active");
                            $(this).closest(".Assets_nft_clickable").addClass("active");
                        });

                        // switch onMarketPlace
                        var $onMarketPlace = $(".Assets_nft_check", dialog);
                        $onMarketPlace.click(function() {
                            $(".Assets_nft_form_details, .Assets_nft_royalties, .Assets_nft_selectNetwork", dialog).attr("data-active", $onMarketPlace.prop('checked'));
                        });

                        $(".time_details", dialog).hide();

                        $("[data-type=fixed]", dialog).on(Q.Pointer.fastclick, function (event) {
                            event.preventDefault();
                            $(".fixed_details", dialog).show();
                            $(".time_details", dialog).hide();
                        });

                        $("[data-type=time]", dialog).on(Q.Pointer.fastclick, function (event) {
                            event.preventDefault();
                            $(".fixed_details", dialog).hide();
                            $(".time_details", dialog).show();
                        });

                        $("[data-type=bid]", dialog).on(Q.Pointer.fastclick, function (event) {
                            event.preventDefault();
                            $(".fTransferixed_details", dialog).hide();
                            $(".time_details", dialog).hide();
                        });

                        var videoTool;
                        var $videoParent = $(".Assets_nft_movie", dialog).closest(".Assets_nft_picture");
                        var _createVideoTool = function (options) {
                            var videoOptions = Q.extend({}, state.video);
                            var videoId = tool.stream.getAttribute("videoId");
                            var videoProvider = tool.stream.getAttribute("videoProvider");
                            var videoUrl = tool.stream.getAttribute("animation_url");
                            if (options) {
                                videoId = Q.getObject("videoId", options);
                                videoProvider = Q.getObject("videoProvider", options);
                                videoUrl = Q.getObject("videoUrl", options);
                            }

                            if (videoUrl) {
                                videoOptions.url = videoUrl;
                            } else if (videoId && videoProvider) {
                                videoOptions.url = Q.getObject(["video", videoProvider, "url"], Q).interpolate({videoId: videoId})
                            }

                            var $element = $(".Assets_nft_movie", dialog);
                            if (Q.Tool.from($element, "Q/video")) {
                                var $newElement = $("<div class='Assets_nft_movie'></div>").insertAfter($element);
                                Q.Tool.remove($element, true, true);
                                $element = $newElement;
                            }

                            if (!videoOptions.url) {
                                return;
                            }

                            $element.tool("Q/video", videoOptions).activate(function () {
                                videoTool = this;
                                $videoParent.removeClass("NFT_preview_loading");
                            });
                        };

                        // get a stream by data got from "newItem" request
                        Q.Streams.get.force(previewState.publisherId, previewState.streamName, function () {
                            tool.stream = this;
                            _createVideoTool();

                            this.onFieldChanged("icon").set(function (modFields, field) {
                                //modFields[field]
                                this.refresh(function () {
                                    tool.preview.icon($icon[0]);
                                }, {
                                    evenIfNotRetained: true
                                });
                            }, tool);
                        });

                        // set video URL
                        var $inputURL = $("input[name=movieURL]", dialog);
                        $inputURL.on("change", function () {
                            if (!this.value.matchTypes('url', {requireScheme: false}).length) {
                                return _createVideoTool();
                            }

                            _createVideoTool({
                                videoId: null,
                                videoUrl: this.value
                            });
                        });

                        // set muse videoId
                        var $museVideoId = $("input[name=museVideoId]", dialog);
                        $museVideoId.on("change", function () {
                            if (!this.value) {
                                return _createVideoTool();
                            }

                            _createVideoTool({
                                videoId: this.value,
                                videoProvider: "muse",
                                videoUrl: null
                            });
                        });

                        // upload video
                        $("input[name=movieUpload]", dialog).on("change", function () {
                            var file = this.files[0];
                            if (!file) {
                                return;
                            }

                            var reader = new FileReader();
                            $videoParent.addClass("NFT_preview_loading");
                            reader.readAsDataURL(file);
                            reader.onload = function () {
                                Q.request(Q.action("Streams/stream"), 'data',function (err, res) {
                                    var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(res && res.errors);
                                    if (msg) {
                                        $videoParent.removeClass("NFT_preview_loading");
                                        return Q.handle([state.onError, state.onFinish], tool, [msg]);
                                    }

                                    Q.Streams.get.force(previewState.publisherId, previewState.streamName, function () {
                                        tool.stream = this;
                                        _createVideoTool();
                                        $inputURL.val("");
                                    });
                                }, {
                                    fields: {
                                        file: {
                                            name: file.name,
                                            data: reader.result,
                                            subpath: previewState.publisherId.splitId() + "/" + previewState.streamName + "/file/movie"
                                        },
                                        publisherId: previewState.publisherId,
                                        streamName: previewState.streamName
                                    },
                                    timeout: 100000,
                                    method: 'put'
                                });
                            };
                            reader.onerror = function (error) {
                                console.log('Error: ', error);
                                $videoParent.removeClass("NFT_preview_loading");
                            };
                            this.value = null;
                        });

                        // create NFT
                        $("button[name=save]", dialog).on(Q.Pointer.fastclick, function (event) {
                            event.preventDefault();

                            $(dialog).addClass("Q_disabled");

                            // set WEB3_CONNECT_MODAL_ID element z-index
                            var modalLimit = 5000;
                            var modalPeriod = 500;
                            var modalCounter = 0;
                            tool.modalExist = setInterval(function() {
                                modalCounter += modalPeriod;
                                if (modalCounter >= modalLimit) {
                                    clearInterval(tool.modalExist);
                                }

                                var $modal = $("#WEB3_CONNECT_MODAL_ID");
                                if (!$modal.length) {
                                    return;
                                }

                                clearInterval(tool.modalExist);

                                var modalZIndex = $(".Q_overlay_open:visible").css("z-index");
                                if (!modalZIndex) {
                                    return;
                                }
                                modalZIndex = parseInt(modalZIndex) + 1;
                                $(".web3modal-modal-lightbox", $modal).css("z-index", modalZIndex);
                            }, modalPeriod);

                            var priceType = $(".Assets_market_button .active", dialog).attr("data-type");

                            var startTime = $("input[name=startTime]", dialog).val();
                            if (startTime) {
                                startTime = Date.parse(startTime)/1000;
                            }

                            var endTime = $("input[name=endTime]", dialog).val();
                            if (endTime) {
                                endTime = Date.parse(endTime)/1000;
                            }

                            var royalty = $("input[name=royalty]", dialog).val();
                            var price = parseFloat($("input[name=fixedPrice]:visible", dialog).val() || $("input[name=minBid]:visible", dialog).val()) || 0;
                            var onMarketPlace = $onMarketPlace.prop("checked");
                            var chainId = $("select[name=chain]", dialog).val();
                            var chain = NFT.Web3.chains[chainId];
                            var currencySymbol = $("select[name=currency]", dialog).val();
                            var currency = {};
                            Q.each(NFT.currencies, function (i, c) {
                                if (c.symbol !== currencySymbol) {
                                    return;
                                }

                                currency = c;
                                currency.token = c[chainId];
                            });

                            // method to create NFT stream after tokenId created
                            var _reqCreateNFT = function (params) {
                                var tokenId = Q.getObject("tokenId", params);
                                var chainId = Q.getObject("chainId", params);
                                var attributes = Q.extend({
                                    onMarketPlace: onMarketPlace,
                                    currency: $("select[name=currency] option:selected", dialog).text(),
                                    price: $("input[name=fixedPrice]", dialog).val(),
                                    royalty: royalty
                                }, params);
                                if (tokenId) {
                                    attributes.tokenId = tokenId;
                                }
                                if (chainId) {
                                    attributes.chainId = chainId;
                                }
                                if ($inputURL.val()) {
                                    attributes["animation_url"] = $inputURL.val();
                                } else if ($museVideoId.val()) {
                                    attributes["videoId"] = $museVideoId.val();
                                    attributes["videoProvider"] = "muse";
                                }

                                // collect NFT attributes
                                attributes["Assets/NFT/attributes"] = tool.collectAttributes(dialog);

                                // after token created, create NFT stream (actually update composer stream and change relation from "new" to "NFT")
                                // and set tokenId, chainId, currency, royalty in attributes
                                Q.req("Assets/NFT",function (err) {
                                    Q.Dialogs.pop();

                                    Q.Tool.remove(tool.element, true, false);
                                    tool.element.className = "";
                                    tool.element.innerHTML = "";

                                    $toolElement.tool("Assets/NFT/preview", {
                                        tokenId: tokenId,
                                        chainId: chainId
                                    }).activate();

                                    Q.handle(state.onCreated, tool, [tokenId, chainId]);
                                }, {
                                    method: "post",
                                    fields: {
                                        userId: userId,
                                        title: $("input[name=title]", dialog).val(),
                                        content: $("input[name=description]", dialog).val(),
                                        attributes: attributes
                                    }
                                });
                            };

                            if (onMarketPlace) {
                                // create token for NFT
                                tool.createToken(price, currency, chain, royalty, onMarketPlace, function (err, tokenId, chainId) {
                                    if (err) {
                                        return $(dialog).removeClass("Q_disabled");
                                    }

                                    Q.Dialogs.pop();

                                    // now, when tokenId create, create NFT stream
                                    _reqCreateNFT({
                                        "tokenId": tokenId,
                                        "chainId": chainId
                                    });
                                });
                            } else {
                                _reqCreateNFT();
                                Q.Dialogs.pop();
                            }
                        });
                    }
                });
            };

            Q.Template.render('Assets/NFT/composer', {}, function(err, html) {
                tool.element.innerHTML = html;

                // get or create composer stream
                Q.req("Assets/NFT", "newItem", function (err, response) {
                    if (err) {
                        return;
                    }

                    var newItem = response.slots.newItem;

                    // activate Streams/preview tool if not activated yet.
                    if (!tool.preview) {
                        $toolElement.tool("Streams/preview", {
                            publisherId: newItem.publisherId,
                            streamName: newItem.streamName,
                            closeable: false
                        }).activate(function () {
                            // this is weird, but 'this' is not a Streams/preview tool, but Assets/NFT/preview
                            tool.preview = Q.Tool.from(this.element, "Streams/preview");

                            previewState = tool.preview.state;

                            // <set Streams/preview imagepicker settings>
                            previewState.imagepicker.showSize = state.imagepicker.showSize;
                            previewState.imagepicker.fullSize = state.imagepicker.fullSize;
                            previewState.imagepicker.save = state.imagepicker.save;
                            previewState.imagepicker.useAnySize = true;
                            previewState.imagepicker.sendOriginal = true;
                            previewState.imagepicker.saveSizeName = {};
                            Q.each(NFT.icon.sizes, function (i, size) {
                                previewState.imagepicker.saveSizeName[size] = size;
                            });
                            // </set Streams/preview imagepicker settings>

                            $toolElement.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, _openDialog);
                        });
                    } else {
                        $toolElement.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, _openDialog);
                    }
                }, {
                    fields: {
                        userId: userId
                    }
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
            var previewState = tool.preview.state;
            var streamId = tool.preview.state.streamName.split("/").pop();

            NFT.Web3.getContract(chain, function (err, contract) {
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
                    if (Web3.isSuccessfulTransaction(TransactionReceipt)) {
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

                var _jsonURL = Q.url("Assets/NFT/" + previewState.publisherId + "/" + streamId + ".json");

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
                    contract.create.apply(null, arrayArgs).then(function (transactionRequest) {
                        transactionRequest.wait(1).then(_transactionHandler, _transactionFailed);
                    }, _transactionFailed);
                }
            });
        },
        /**
         * Create and sign signature
         * @method manageAttributes
         * @param {Element|jQuery} element - element which need to replace with manager
         * @param {Object} attributes - object with defined attributes
         */
        manageAttributes: function (element, attributes) {
            attributes = Q.isEmpty(attributes) ? [{}] : attributes;
            var $element = element instanceof Element ? $(element) : element;
            var tool = this;
            var previewState = tool.preview.state;

            // get default attributes from server
            Q.req("Assets/NFT", "attributes", function (err, response) {
                var fem = Q.firstErrorMessage(err, response);
                if (fem) {
                    return console.error(fem);
                }

                var defaultAttributes = response.slots.attributes;

                // merge exists attributes with default
                Q.each(attributes, function () {
                    var attribute = this;

                    if (!attribute.display_type) {
                        return;
                    }

                    if (Q.isEmpty(defaultAttributes[attribute.display_type])) {
                        defaultAttributes[attribute.display_type] = {};
                    }
                    if (Q.isEmpty(defaultAttributes[attribute.display_type][attribute.trait_type])) {
                        defaultAttributes[attribute.display_type][attribute.trait_type] = [];
                    }
                    var arr = defaultAttributes[attribute.display_type][attribute.trait_type];
                    if (!arr.includes(attribute.value)) {
                        arr.push(attribute.value);
                    }
                });

                Q.each(attributes, function () {
                    var attribute = this;

                    Q.Template.render("Assets/NFT/manage/attributes", {
                        attributes: defaultAttributes,
                    }, function (err, html) {
                        var $html = $(html);
                        $element.append($html);

                        var $displayType = $("select[name=display_type]", $html);
                        $displayType.val(Q.getObject("display_type", attribute));
                        var $traitType = $("select[name=trait_type]", $html);
                        var $traitType_ = $("option[value=_]", $traitType);
                        var $value = $("select[name=value]", $html);
                        $value.val(Q.getObject("value", attribute));
                        var $value_ = $("option[value=_]", $value);
                        $(".basic32_remove", $html).on(Q.Pointer.fastclick, function () { $html.remove(); });
                        var _addItem = function () {
                            var $this = this instanceof Element ? $(this) : this;
                            $this.val("");
                            var titleKey = null;
                            var $lastOption = $("option[value='_']", $this);
                            switch ($this.prop("name")) {
                                case "trait_type":
                                    titleKey = "AddTraitTitle";
                                    break;
                                case "value":
                                    titleKey = "AddValueTitle";
                                    break;
                            }
                            Q.prompt(null, function (title) {
                                if (!title) {
                                    return;
                                }

                                $('<option data-type="attr">' + title + '</option>').insertBefore($lastOption);
                                $this.val(title).trigger("change");

                                var displayType = $displayType.val();
                                var traitType = $traitType.val();
                                var value = $value.val();

                                // don't send POST request if some value empty
                                if (!displayType || !traitType || !value) {
                                    return;
                                }

                                Q.req("Assets/NFT", ["attrUpdate"], function (err, response) {
                                    var fem = Q.firstErrorMessage(err, response);
                                    if (fem) {
                                        return console.error(fem);
                                    }

                                    if (!response.slots.attrUpdate) {
                                        return;
                                    }

                                    Q.setObject([displayType, traitType], value, defaultAttributes);
                                }, {
                                    method: "post",
                                    fields: {
                                        publisherId: previewState.publisherId,
                                        display_type: displayType,
                                        trait_type: traitType,
                                        value: value
                                    }
                                });
                            }, {
                                placeholder: tool.text.NFT.attributes[titleKey] //AddDisplayType
                            });
                        };

                        $value.on("change", function () {
                            var val = $value.val();
                            if (val === "_") {
                                return Q.handle(_addItem, $value);
                            }
                        });
                        $traitType.on("change", function () {
                            var dtVal = $displayType.val();
                            var ttVal = $traitType.val();

                            if (!ttVal) {
                                return $value.prop("disabled", true);
                            } else if (ttVal === "_") {
                                return Q.handle(_addItem, $traitType);
                            }

                            $value.prop("disabled", false);

                            $("[data-type=attr]", $value).remove();
                            Q.each(Q.getObject([dtVal, ttVal], defaultAttributes) || [], function (index, value) {
                                $('<option data-type="attr">' + value + '</option>').insertBefore($value_);
                            });

                            var value = Q.getObject("value", attribute);
                            value && $value.val(value);
                        });
                        $displayType.on("change", function () {
                            var dtVal = $displayType.val();

                            if (!dtVal) {
                                $traitType.prop("disabled", true);
                                $value.prop("disabled", true);
                                return;
                            }

                            $traitType.prop("disabled", false);

                            $("[data-type=attr]", $traitType).remove();

                            Q.each(Q.getObject(dtVal, defaultAttributes) || [], function (index, value) {
                                $('<option data-type="attr">' + index + '</option>').insertBefore($traitType_);
                            });

                            var traitType = Q.getObject("trait_type", attribute);
                            traitType && $traitType.val(traitType);

                            $traitType.trigger("change");
                        }).trigger("change");
                    });
                });
            }, {
                fields: {
                    publisherId: previewState.publisherId
                }
            });
        },
        /**
         * Collect attributes under some element
         * @method collectAttributes
         * @param {Element,jQuery} element
         */
        collectAttributes: function (element) {
            // collect NFT attributes
            var assetsNFTAttributes = [];
            $(".Assets_NFT_attribute", element).each(function () {
                var displayType = $("select[name=display_type]", this).val();
                var traitType = $("select[name=trait_type]", this).val();
                var value = $("select[name=value]", this).val();
                var attribute = {};
                if (displayType && displayType !== '_') {
                    attribute.display_type = displayType;
                }
                if (traitType && traitType !== '_') {
                    attribute.trait_type = traitType;
                }
                if (value && value !== '_') {
                    attribute.value = value;
                }

                if (!Q.isEmpty(attribute)) {
                    assetsNFTAttributes.push(attribute);
                }
            });
            return assetsNFTAttributes;
        }
    });

    Q.Template.set('Assets/NFT/composer',
        `<div class="tile-block Assets_create_tiles">
       <div class="video-container Assets_create_video">
           <h4>{{NFT.CreateNFT}}</h4>
       </div>
       <div class="Assets_create_video_footer"></div>
    </div>`,
        {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/nftCreate',
        `<div class="Assets_nft" data-mode="{{mode}}">
        <form>
            <div class="Assets_nft_form_group">
                <label>{{NFT.NftName}}:</label>
                <input type="text" name="title" class="Assets_nft_form_control" placeholder="{{NFT.TitlePlaceholder}}">
            </div>
            <div class="Assets_nft_form_group">
                <label>{{NFT.Description}}:</label>
                <input type="text" name="description" class="Assets_nft_form_control" placeholder="{{NFT.DescribeYourNFT}}">
            </div>
            <div class="Assets_nft_form_group" data-type="nft_attributes">
                <label>{{NFT.attributes.Title}}:</label>
                <div class="Assets_nft_attributes"></div>
                <button class="Q_button" name="addAttribute">{{NFT.attributes.NewAttribute}}</button>
            </div>
            <div class="Assets_nft_form_group">
                <label>{{NFT.NftPicture}}:</label>
                <div class="Assets_nft_picture">
                    <img class="NFT_preview_icon">
                    <button class="Assets_nft_upload_button">{{NFT.UploadFile}}</button>
                </div>
            </div>
            <div class="Assets_nft_form_group">
                <label>{{NFT.NftMovie}}:</label>
                <div class="Assets_nft_picture">
                    <input name="museVideoId" placeholder="muse video id"> <label>{{NFT.UploadMovie}}<input type="file" style="display: none;" name="movieUpload"></label>
                    <input name="movieURL" placeholder="{{NFT.MovieSource}}">
                    <div class="Assets_nft_movie"></div>
                </div>
            </div>
            <div class="Assets_nft_form_group Assets_nft_form_market">
                <div class="Assets_nft_market">
                    <div>
                        <label>{{NFT.PutOnMarketplace}} :</label>
                    </div>
                    <label class="switch">
                        <input type="checkbox" {{#if onMarketPlace}}checked{{/if}} class="Assets_nft_check">
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="Assets_nft_form_details" data-active="{{onMarketPlace}}">
                    <div class="Assets_market_button" style="display: none">
                        <div class="Assets_nft_clickable active" data-type="fixed">
                            <img src="{{baseUrl}}/img/price.svg" />
                            <span>{{NFT.FixedPrice}}</span>
                        </div>
                        <div class="Assets_nft_clickable" data-type="time">
                            <img src="{{baseUrl}}/img/time.svg" />
                            <span>{{NFT.TimedAuction}}</span>
                        </div>
                        <div class="Assets_nft_clickable" data-type="bid">
                            <img src="{{baseUrl}}/img/bid.svg" />
                            <span>{{NFT.OpenForBids}}</span>
                        </div>
                    </div>
    
                    <div class="fixed_details">
                        <div class="Assets_nft_form_group">
                            <label>{{NFT.Price}}</label>
                            <div class="Assets_price">
                                <input type="text" name="fixedPrice" class="Assets_nft_form_control" placeholder="{{NFT.PriceOnePiece}}">
                                <select name="currency">
                                    {{#each currencies}}
                                        <option>{{this}}</option>
                                    {{/each}}
                                </select>
                                {{currency}}
                            </div>
                        </div>
                    </div>
                    <div class="time_details">
                        <div class="Assets_nft_form_group">
                            <label>{{NFT.MinimumBid}}</label>
                            <div class="Assets_price">
                                <input type="text" name="minBid" class="Assets_nft_form_control" placeholder="{{NFT.EnterMinimumBid}}">
                                {{currency}}
                            </div>
                            <p>{{NFT.BidsBelowThisAmount}}</p>
                        </div>
                        <div class="Assets_nft_form_group">
                            <div class="Assets_price">
                                <div>
                                    <label>{{NFT.StartingDate}}</label>
                                    <input type="datetime-local" name="startTime">
                                </div>
                                <div>
                                    <label>{{NFT.ExpirationDate}}</label>
                                    <input type="datetime-local" name="endTime">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="Assets_nft_form_group Assets_nft_royalties">
                <label>{{NFT.Royalties}}:</label>
                <div class="Assets_royality">
                    <input type="number" name="royalty" class="Assets_nft_form_control" placeholder="{{NFT.RoyaltyPlaceholder}}">%
                </div>
            </div>
            <div class="Assets_nft_form_group Assets_nft_selectNetwork">
                <label>{{NFT.SelectChain}}:
                <select name="chain">
                {{#each chains}}
                    <option value="{{this.chainId}}" {{#if this.default}}selected{{/if}}>{{@key}}</option>
                {{/each}}
                </select>
                </label>
            </div>
            <button class="Q_button" name="save">{{NFT.CreateYourNFT}}</button>
        </form>
    </div>`,
        {text: ['Assets/content']});

    Q.Template.set('Assets/NFT/manage/attributes',
        `<div class="Assets_NFT_attribute">
<select name='display_type'><option value="">{{NFT.attributes.DisplayTitle}}</option>` +
        '{{#each attributes}}' +
        '<option>{{@key}}</option>' +
        '{{/each}}' +
        `</select>
<select name='trait_type'><option value="">{{NFT.attributes.TraitTitle}}</option><option value="_">{{NFT.attributes.NewTrait}}</option></select>
<select name='value'><option value="">{{NFT.attributes.ValueTitle}}</option><option value="_">{{NFT.attributes.NewValue}}</option></select>
<div class="basic32 basic32_remove"></div>
</div>`,
        {text: ['Assets/content']}
    );

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
        <div class="video-container"></div>
        <h2 class="tile-name">{{title}}</h2>
        <ul class="bid-info">
            <li class="Assets_NFT_price">
                <p><span class="Assets_NFT_price_value">{{price}}</span> {{currency.symbol}}</p>
                <span class="Assets_NFT_comingsoon">Coming Soon</span>
            </li>
            <li class="action-block">
                <button name="buy" class="Q_button">{{NFT.Buy}}</button>
                <button name="soldOut" class="Q_button">{{NFT.NotOnSale}}</button>
                <button name="update" class="Q_button">{{NFT.Actions}}</button>
            </li>
        </ul>
    </div>`,
        {text: ['Assets/content']}
    );
})(window, Q, jQuery);
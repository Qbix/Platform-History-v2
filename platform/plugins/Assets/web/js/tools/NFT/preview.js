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
     *  @param {boolean} onMarketPlace=true default value of onMarketPlace
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

            tool.interests = [];
            tool.likes = [];
            if (previewState.streamName) {
                Q.handle(Assets.batchFunction(), null, ["NFT", "getInterests", previewState.publisherId, previewState.streamName, function (err, data) {
                    var msg = Q.firstErrorMessage(err, data);
                    if (msg) {
                        return console.error(msg);
                    }

                    Q.each(this, function (index) {
                        tool.interests.push("<span>" + this.title + "</span>");
                    });

                    pipe.fill('interests')();
                }]);
                Q.handle(Assets.batchFunction(), null, ["NFT", "getLikes", previewState.publisherId, previewState.streamName, function (err, data) {
                    var msg = Q.firstErrorMessage(err, data);
                    if (msg) {
                        return console.error(msg);
                    }

                    tool.likes[0] = this.res;
                    tool.likes[1] = this.likes;

                    pipe.fill('likes')();
                }]);
            } else {
                pipe.fill('interests')();
                pipe.fill('likes')();
            }

            Q.addStylesheet("{{Assets}}/css/tools/NFT/preview.css", pipe.fill('stylesheet'), { slotName: 'Assets' });
            Q.Text.get('Assets/content', function(err, text) {
                tool.text = text;
                pipe.fill('text')();
            }, {
                ignoreCache: true
            });
        },

        { // default options here
            useWeb3: true,
            onMarketPlace: true,
            onInvoke: new Q.Event(),
            onAvatar: new Q.Event(),
            poster: null,
            movie: null,
            src: null,
            imagepicker: {
                showSize: NFT.icon.defaultSize,
                fullSize: NFT.icon.sizes[NFT.icon.sizes.length-1],
                save: "NFT/icon"
            }
        },

        {
            /**
             * Refreshes the appearance of the tool completely
             * @method refresh
             * @param {Streams_Stream} stream
             * @param {String} author
             * @param {String} owner
             * @param {object} comissionInfo
             * @param {object} saleInfo
             */
            refresh: function (stream, author, owner, comissionInfo, saleInfo) {
                var tool = this;
                var state = tool.state;
                var publisherId = stream.fields.publisherId;
                var streamName = stream.fields.name;
                var $toolElement = $(this.element);
                var userId = Q.Users.loggedInUserId();

                tool.preview.state.editable = false;

                if (userId === publisherId) {
                    $toolElement.addClass("Assets_NFT_self");
                }

                if (!tool.tokenId) {
                    $toolElement.addClass("Assets_NFT_comingsoon");
                }

                var fixedPrice = stream.getAttribute("fixedPrice");
                var timedAuction = stream.getAttribute("timedAuction");
                var selectedAddress = (Q.getObject("ethereum.selectedAddress", window) || "").toLowerCase();
                owner = owner || "";

                if (owner) {
                    $toolElement.attr("data-owned", owner.toLowerCase()===selectedAddress.toLowerCase());
                } else {
                    $toolElement.attr("data-owned", false);
                }

                if (saleInfo) {
                    $toolElement.attr("data-onSale", Q.getObject("isSale", saleInfo));
                } else {
                    $toolElement.attr("data-onSale", false);
                }

                var bidText = tool.text.NFT.CurrentBid;
                var startTime = null;
                var endTime = null;
                var activeNftText = null;
                var storedPrice = null;
                var currency = stream.getAttribute("currency"); // saleInfo.currencyToken, network
                if (Q.getObject("active", fixedPrice) === "true") {
                    bidText = tool.text.NFT.FixedBid;
                    activeNftText = "class='Assets_NFT_active'";
                    storedPrice = Q.getObject("price", fixedPrice);
                    currency = currency || fixedPrice.currency;
                } else if (Q.getObject("active", timedAuction) === "true") {
                    storedPrice = Q.getObject("price", timedAuction);
                    startTime = parseInt(Q.getObject("startTime", timedAuction)) || 0;
                    var currentTimeStamp = Date.now()/1000;
                    if (startTime > currentTimeStamp) {
                        $toolElement.addClass("Assets_NFT_notStarted");
                    }
                    endTime = parseInt(Q.getObject("endTime", timedAuction)) || 0;
                    if (endTime && endTime < currentTimeStamp) {
                        $toolElement.addClass("Assets_NFT_ended");
                    }
                    currency = currency || fixedPrice.timedAuction;
                }

                if (!saleInfo || (saleInfo && !Q.getObject("isSale", saleInfo))) {
                    bidText = tool.text.NFT.SoldOut;
                    activeNftText = "class='Assets_NFT_sold'";
                }
                var price = Q.getObject("priceDecimal", saleInfo) || parseFloat(storedPrice || 4.165);

                // check special users settings
                Q.each(NFT.specialPublishers, function (specialPublisherId, settings) {
                    if (publisherId !== specialPublisherId) {
                        return;
                    }

                    if ("price" in settings) {
                        price = settings.price;
                    }

                    if ("currency" in settings) {
                        currency = settings.currency;
                    }

                    Q.each(settings.attributes, function (attr, value) {
                        $toolElement.attr(attr, value);
                    });

                    Q.each(settings.classes, function (i, val) {
                        $toolElement.addClass(val);
                    });
                });

                NFT.onTransfer.set(function (oldAddress, newAddress, token) {
                    var processedTokenId = parseInt(token._hex, 16);
                    if (parseInt(tool.tokenId) !== processedTokenId) {
                        return;
                    }

                    state.updateCache = true;
                    Q.handle(tool.preview.state.onRefresh, tool.preview, [stream]);
                }, tool);

                var _saleChanged = function (token) {
                    var processedTokenId = parseInt(token._hex, 16);
                    if (parseInt(tool.tokenId) !== processedTokenId) {
                        return;
                    }

                    state.updateCache = true;
                    Q.handle(tool.preview.state.onRefresh, tool.preview, [stream]);
                };
                NFT.onTokenAddedToSale.set(function (tokenId, amount, consumeToken) {
                    _saleChanged(tokenId);
                }, tool);
                NFT.onTokenRemovedFromSale.set(function (tokenId) {
                    _saleChanged(tokenId);
                }, tool);

                Q.Template.render('Assets/NFT/view', {
                    title: stream.fields.title,
                    price: price,
                    currency: currency,
                    bidText: bidText,
                    interests: tool.interests,
                    likes: tool.likes,
                    owner: NFT.minimizeAddress(owner, 20, 3),
                    startTime: startTime,
                    endTime: endTime,
                    activeNftText: activeNftText
                }, (err, html) => {
                    tool.element.innerHTML = html;

                    $toolElement.activate();

                    $(".assets_NFT_avatar", tool.element).tool("Users/avatar", {
                        userId: publisherId,
                        icon: 50,
                        contents: true,
                        editable: false
                    }).activate(function () {
                        $(this.element).on(Q.Pointer.fastclick, function (e) {
                            Q.handle(state.onAvatar, this, [e]);
                        });
                    });

                    // apply Streams/preview icon behavior
                    var movie = stream.getAttribute("video") || stream.getAttribute("Q.file.url");
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
                    } else if (movie && stream.fields.icon.includes("/img/empty_white.png")) {
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
                        tool.preview.icon($("img.NFT_preview_icon", tool.element)[0]);
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
                    var lastPart = streamName.split('/')[2];
                    $toolElement.on(Q.Pointer.fastclick, function () {
                        Q.handle(state.onInvoke, tool, [publisherId, lastPart]);
                    });

                    // set onForward event
                    $(".forward-btn", $toolElement).on(Q.Pointer.fastclick, function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        Q.Streams.invite(Q.Users.communityId, 'Streams/experience/main', {
                            appUrl: [Q.info.baseUrl, "NFT", publisherId, lastPart].join("/")
                        });
                    });

                    var $likes = $(".likes", $toolElement);
                    // set likes handler
                    $likes.on(Q.Pointer.fastclick, function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!userId) {
                            return Q.Users.login({
                                onSuccess: function () {
                                    Q.handle(window.location.href);
                                }
                            });
                        }

                        Q.req("Assets/likes", "setLikes", function (err, data) {
                            if (err) {
                                return;
                            }

                            data = data.slots.setLikes;

                            if (data.res) {
                                $likes.addClass("Q_selected");
                            } else {
                                $likes.removeClass("Q_selected");
                            }

                            $likes.text(data.likes || "");
                        }, {
                            fields: {
                                publisherId: publisherId,
                                streamName: streamName
                            }
                        });
                    });

                    // buy NFT
                    $("button[name=placeBid]", tool.element).on(Q.Pointer.fastclick, function (e) {
                        e.stopPropagation();
                        e.preventDefault();

                        NFT.checkProvider(tool.network, function (err) {
                            if (err) {
                                return;
                            }

                            NFT.buy(tool.tokenId, tool.network, currency, function (err, transaction) {});
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
                                    NFT.checkProvider(tool.network, function (err, contract) {
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
                                    NFT.checkProvider(tool.network, function (err, contract) {
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

                                        NFT.checkProvider(tool.network, function (err, contract) {
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
             * Create NFT
             * @method composer
             */
            composer: function () {
                var tool = this;
                var state = tool.state;
                var $toolElement = $(this.element);
                var previewState = tool.preview.state;
                var relatedTool = Q.Tool.from($toolElement.closest(".Streams_related_tool")[0], "Streams/related");
                var networks = {};
                var userId = Q.Users.loggedInUserId();

                // get supported networks
                Q.each(NFT.networks, function (i, network) {
                    networks[network.name] = network;
                });

                var _openDialog = function () {
                    Q.Dialogs.push({
                        title: tool.text.NFT.CreateNFT,
                        className: "Assets_NFT_preview_composer",
                        template: {
                            name: "Assets/NFT/nftCreate",
                            fields: {
                                networks: networks,
                                currencies: NFT.currencies.map(a => a.symbol),
                                onMarketPlace: state.onMarketPlace,
                                baseUrl: Q.baseUrl()
                            }
                        },
                        onActivate: function (dialog) {
                            var $icon = $("img.NFT_preview_icon", dialog);

                            // apply Streams/preview icon behavior
                            tool.preview.icon($icon[0]);

                            // get categories
                            var interests = [];
                            $(".assets_nft_categories", dialog).tool("Streams/interests", {
                                userId: false,
                                canAdd: false,
                                all: false,
                                filter: null,
                                skipSelect: true,
                                onClick: function (element, normalized, category, title2, wasSelected) {
                                    if (wasSelected) {
                                        interests = interests.filter(function(value, index, arr){
                                            return value !== normalized;
                                        });
                                    } else {
                                        interests.push(normalized);
                                    }
                                }
                            }).activate();

                            // upload image button
                            $(".assets_nft_upload_button", dialog).on(Q.Pointer.fastclick, function (event) {
                                event.preventDefault();
                                $icon.trigger("click");
                            });

                            // composer tabs (Fixed price, Timed action ...)
                            $(".assets_nft_clickable", dialog).on(Q.Pointer.fastclick, function (event) {
                                event.preventDefault();
                                $(".assets_nft_clickable").removeClass("active");
                                $(this).closest(".assets_nft_clickable").addClass("active");
                            });

                            // switch onMarketPlace
                            var $onMarketPlace = $(".assets_nft_check", dialog);
                            $onMarketPlace.click(function() {
                                $(".assets_nft_form_details, .assets_nft_royalties, .assets_nft_selectNetwork", dialog).attr("data-active", $onMarketPlace.prop('checked'));
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
                            // get a stream by data got from "newItem" request
                            Q.Streams.get(previewState.publisherId, previewState.streamName, function () {
                                var stream = this;

                                $(".assets_nft_movie", dialog).tool("Q/video", {
                                    url: stream.getAttribute("Q.file.url")
                                }).activate(function () {
                                    videoTool = this;
                                    this.state.onLoad.set(function () {
                                        $(this.element).removeClass("NFT_preview_loading");
                                    }, tool);
                                });
                            });

                            // set video URL
                            var $inputURL = $("input[name=movieURL]", dialog);
                            $inputURL.on("change", function () {
                                if (!this.value.matchTypes('url', {requireScheme: false}).length) {
                                    return;
                                }

                                videoTool.state.url = this.value;
                                $(videoTool.element).addClass("NFT_preview_loading");
                                videoTool.implement();
                            });

                            // upload video
                            $("input[name=movieUpload]", dialog).on("change", function () {
                                var file = this.files[0];
                                var reader = new FileReader();
                                $(videoTool.element).addClass("NFT_preview_loading");
                                reader.readAsDataURL(file);
                                reader.onload = function () {
                                    Q.request(Q.action("Streams/stream"), 'data',function (err, res) {
                                        var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(res && res.errors);
                                        if (msg) {
                                            if (state.mainDialog) state.mainDialog.removeClass('Q_uploading');
                                            return Q.handle([state.onError, state.onFinish], tool, [msg]);
                                        }

                                        videoTool.state.url = Q.url(JSON.parse(res.slots.data.attributes)["Q.file.url"]);
                                        videoTool.implement();
                                        $inputURL.val("");
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
                                    $(videoTool.element).removeClass("NFT_preview_loading");
                                };
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

                                var priceType = $(".assets_market_button .active", dialog).attr("data-type");

                                var startTime = $("input[name=startTime]", dialog).val();
                                if (startTime) {
                                    startTime = Date.parse(startTime)/1000;
                                }

                                var endTime = $("input[name=endTime]", dialog).val();
                                if (endTime) {
                                    endTime = Date.parse(endTime)/1000;
                                }

                                var royalty = $("input[name=royalty]", dialog).val();
                                var price = parseFloat($("input[name=fixedPrice]:visible", dialog).val() || $("input[name=minBid]:visible", dialog).val());
                                var onMarketPlace = $onMarketPlace.prop("checked");
                                var chainId = $("select[name=network]", dialog).val();
                                var network = NFT.networks.filter(obj => { return obj.chainId === chainId })[0];
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
                                var _reqCreateNFT = function (tokenId, chainId, author) {
                                    var attributes = {
                                        tokenId: tokenId || null,
                                        chainId: chainId,
                                        onMarketPlace: onMarketPlace,
                                        currency: $("select[name=currency] option:selected", dialog).text(),
                                        fixedPrice: {
                                            active: priceType === "fixed",
                                            price: $("input[name=fixedPrice]", dialog).val()
                                        },
                                        timedAuction: {
                                            active: priceType === "time",
                                            price: $("input[name=minBid]", dialog).val(),
                                            startTime: startTime,
                                            endTime: endTime
                                        },
                                        openForBids: {
                                            active: priceType === "bid"
                                        },
                                        royalty: royalty
                                    };
                                    if ($inputURL.val()) {
                                        attributes["Q.file.url"] = $inputURL.val();
                                    }

                                    // after token created, create NFT stream (actually update composer stream and change relation from "new" to "NFT")
                                    // and set tokenId, chainId, currency, royalty in attributes
                                    Q.req("Assets/NFT",function (err) {
                                        Q.Dialogs.pop();

                                        // after stream created need to refreah Streams/related tool to make this stream preview tool appear in the list
                                        relatedTool.refresh();

                                        // call composer method to recreate composer stream, because current stream
                                        Q.handle(tool.composer, tool);
                                    }, {
                                        method: "post",
                                        fields: {
                                            userId: userId,
                                            title: $("input[name=title]", dialog).val(),
                                            content: $("input[name=description]", dialog).val(),
                                            author: author,
                                            interests: interests,
                                            attributes: attributes
                                        }
                                    });
                                };

                                if (onMarketPlace) {
                                    // create token for NFT
                                    tool.createToken(price, currency, network, royalty, onMarketPlace, function (err, tokenId, chainId, author) {
                                        if (err) {
                                            return $(dialog).removeClass("Q_disabled");
                                        }

                                        Q.Dialogs.pop();

                                        // now, when tokenId create, create NFT stream
                                        _reqCreateNFT(tokenId, chainId, author);
                                    });
                                } else {
                                    _reqCreateNFT(null, null, null);
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

                        previewState.publisherId = newItem.publisherId;
                        previewState.streamName = newItem.streamName;

                        // this need for Streams/related tool to avoid appear composer twice
                        Q.setObject("options.streams_preview.publisherId", newItem.publisherId, tool.element);
                        Q.setObject("options.streams_preview.streamName", newItem.streamName, tool.element);

                        $toolElement.off("click.NFTcomposer").on("click.NFTcomposer", _openDialog);
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
             * @param {object} network - Object with details of network (chainId, contract, name, rpcUrls, blockExplorerUrls) selected to create token in.
             * @param {number} royalty - Royalty in percents from price.
             * @param {boolean} [onSale=false] If false, call contract.create which just create token, but not put NFT to listForSale
             * @param {function} callback
             */
            createToken: function (price, currency, network, royalty, onSale,  callback) {
                var tool = this;
                var previewState = tool.preview.state;
                var lastPart = previewState.streamName.split('/')[2];

                var currencyToken = currency.token;
                var commissionToken = currency.commissionToken;

                NFT.checkProvider(network, function (err, contract) {
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
                <span {{& activeNftText}} >{{bidText}}</span>
                <span class="Assets_NFT_comingsoon">Coming Soon</span>
            </li>
            <li class="action-block">
                <button name="buy" class="Q_button">{{NFT.Buy}}</button>
                <button name="placeBid" class="Q_button">{{NFT.PlaceBid}}</button>
                <button name="soldOut" class="Q_button">{{NFT.SoldOut}}</button>
                <button name="update" class="Q_button">{{NFT.Update}}</button>
            </li>
            {{#if startTime}}
                <li class="Assets_NFT_startDate">
                    <span>{{NFT.StartingIn}}</span>
                    <p data-timestamp="{{startTime}}">
                        <span class="dateDays"><span class="Q_days"></span> <span class="daysText">{{NFT.Days}}</span></span>
                        <span class="dateHours"><span class="Q_hours"></span> <span class="hoursText"></span></span>
                        <span class="dateMinutes"><span class="Q_minutes"></span> <span class="minutesText"></span></span>
                        <span class="dateSeconds"><span class="Q_seconds"></span> <span class="secondsText"></span></span>
                    </p>
                </li>
            {{/if}}
            {{#if endTime}}
                <li class="Assets_NFT_endDate">
                    <span>{{NFT.EndingIn}}</span>
                    <p data-timestamp="{{endTime}}">
                        <span class="dateDays"><span class="Q_days"></span> <span class="daysText">{{NFT.Days}}</span></span>
                        <span class="dateHours"><span class="Q_hours"></span> <span class="hoursText"></span></span>
                        <span class="dateMinutes"><span class="Q_minutes"></span> <span class="minutesText"></span></span>
                        <span class="dateSeconds"><span class="Q_seconds"></span> <span class="secondsText"></span></span>
                    </p>
                </li>
            {{/if}}
        </ul>
    </div>
    <div class="action-block">
        <span class="likes {{#if likes.[0]}}Q_selected{{/if}}">{{likes.[1]}}</span>
        <span class="forward-btn"></span>
    </div>`,
        {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/composer',
        `<div class="tile-block assets_create_tiles">
       <div class="video-container assets_create_video">
           <h4>{{NFT.CreateNFT}}</h4>
       </div>
       <div class="Assets_create_video_footer"></div>
    </div>`,
        {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/nftCreate',
        `<div class="Assets_nft">
    <form>
        <div class="Assets_nft_form_group">
            <label>{{NFT.NftName}}:</label>
            <input type="text" name="title" class="Assets_nft_form_control" placeholder="{{NFT.TitlePlaceholder}}">
        </div>
        <div class="Assets_nft_form_group">
            <label>{{NFT.Description}}:</label>
            <input type="text" name="description" class="Assets_nft_form_control" placeholder="{{NFT.DescribeYourNFT}}">
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
                <input name="movieURL" placeholder="{{NFT.MovieSource}}"> <label>{{NFT.UploadMovie}}<input type="file" style="display: none;" name="movieUpload"></label>
                <div class="Assets_nft_movie"></div>
            </div>
        </div>
        <div class="Assets_nft_form_group">
            <label>{{NFT.SelectCategory}}:</label>
            <div class="Assets_nft_categories"></div>
        </div>
        <div class="Assets_nft_form_group">
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
                <div class="Assets_market_button">
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
        <div class="Assets_nft_form_group assets_nft_royalties">
            <label>{{NFT.Royalties}}:</label>
            <div class="Assets_royality">
                <input type="number" name="royalty" class="Assets_nft_form_control" placeholder="{{NFT.RoyaltyPlaceholder}}">%
            </div>
        </div>
        <div class="Assets_nft_form_group assets_nft_selectNetwork">
            <label>{{NFT.SelectNetwork}}:
            <select name="network">
            {{#each networks}}
                <option value="{{this.chainId}}">{{@key}}</option>
            {{/each}}
            </select>
            </label>
        </div>
        <button class="Q_button" name="save">{{NFT.CreateYourNFT}}</button>
    </form>
</div>`,
        {text: ['Assets/content']});

})(window, Q, jQuery);
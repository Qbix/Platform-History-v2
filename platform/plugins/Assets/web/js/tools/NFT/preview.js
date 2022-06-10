(function (window, Q, $, undefined) {
    /**
     * @module Assets
     */

    var Streams = Q.Streams;
    var Assets = Q.Assets;
    var Web3 = Assets.NFT.Web3;
    var NFT = Assets.NFT;
    /**
     * YUIDoc description goes here
     * @class Assets NFT/preview
     * @constructor
     * @param {Object} [options] Override various options for this tool
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
        tool.preview = Q.Tool.from(this.element, "Streams/preview");
        var previewState = Q.getObject("preview.state", tool) || {};
        var loggedInUserId = Q.Users.loggedInUserId();
        var tokenId = Q.getObject("token.id", state);
        var chainId = Q.getObject("token.chainId", state);
        var contractAddress = Q.getObject("token.contractAddress", state);

        // is admin
        var roles = Object.keys(Q.getObject("roles", Q.Users) || {});
        tool.isAdmin = (roles.includes('Users/owners') || roles.includes('Users/admins'));
        $toolElement.attr("data-admin", tool.isAdmin);
        tool.isPublisher = (loggedInUserId && loggedInUserId === previewState.publisherId);
        $toolElement.attr("data-publisher", tool.isPublisher);

        if (!Q.isEmpty(previewState)) {
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
        }

        var pipe = Q.pipe(["stylesheet", "text"], function (params, subjects) {
            // get all data from blockchain and refresh
            if (state.metadata) {
                if (typeof state.metadata !== "object") {
                    throw new Error("metadata is not a valid object");
                }

                tool.refresh();
            } else if (state.tokenURI) {
                if (!state.tokenURI.matchTypes('url').length) {
                    throw new Error("tokenURI is not a valid URL");
                }

                tool.refresh();
            } else if (tokenId) {
                if (!chainId) {
                    throw new Error("chain id required");
                }
                if (!contractAddress) {
                    throw new Error("contract address required");
                }

                tool.refresh();
            } else if (!Q.isEmpty(previewState) && previewState.streamName) {
                $toolElement.attr("data-publisherId", previewState.publisherId);
                $toolElement.attr("data-streamName", previewState.streamName);
                previewState.onRefresh.add(tool.refresh.bind(tool), tool);
            } else if (!Q.isEmpty(previewState)) {
                previewState.onComposer.add(tool.composer.bind(tool), tool);
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
        useWeb3: true,
        metadata: null,
        tokenURI: null,
        token: {
            id: null,
            contractAddress: null,
            chainId: null
        },
        imagepicker: {
            showSize: NFT.icon.defaultSize,
            save: "NFT/icon"
        },
        show: {
            avatar: true,
            title: true,
            description: false,
            participants: false
        },
        templates: {
            view: {
                name: 'Assets/NFT/view',
                fields: {}
            }
        },
        movie: null,
        imageSrc: null,
        onInvoke: new Q.Event(),
        onAvatar: new Q.Event(),
        onCreated: new Q.Event()
    },

{
        /**
         * Get all data from blockchain and refresh
         * @method init
         * @param {Streams_Stream} stream
         */
        refresh: function (stream) {
            if (Streams.isStream(stream)) {
                return this.renderFromStream(stream);
            }

            var tool = this;
            var state = this.state;
            var $toolElement = $(this.element);
            var tokenId = Q.getObject("token.id", state);
            var chainId = Q.getObject("token.chainId", state);
            var contractAddress = Q.getObject("token.contractAddress", state);
            var tokenURI = state.tokenURI;
            var metadata = state.metadata;

            $toolElement.append('<img src="' + Q.url("{{Q}}/img/throbbers/loading.gif") + '">');

            if (metadata) {
                return tool.renderFromMetadata(metadata);
            } else if (tokenURI) {
                Q.req("Assets/NFT", "getRemoteJSON", function (err, response) {
                    if (err) {
                        return;
                    }

                    var metadata = response.slots.getRemoteJSON;
                    tool.renderFromMetadata(metadata);
                }, {
                    fields: {
                        tokenURI: tokenURI
                    }
                });

                return;
            }

            var pipeList = ["metadata", "author", "owner", "commissionInfo", "saleInfo", "authorUserId"];
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

                var metadata = params.metadata[1];
                var authorAddress = params.author[1];
                var ownerAddress = params.owner[1];
                var commissionInfo = params.commissionInfo[1];
                var saleInfo = params.saleInfo[1];
                var authorUserId = params.authorUserId[1];
                authorUserId = authorUserId || '';

                tool.renderFromMetadata(metadata, authorAddress, ownerAddress, commissionInfo, saleInfo, authorUserId);
                $toolElement.removeClass("Q_working");

                //Users.Web3.onAccountsChanged.set(tool.refresh.bind(tool), tool);
            });

            if (state.useWeb3) {
                Q.handle(Assets.batchFunction(), null, ["NFT", "getInfo", tokenId, chainId, contractAddress, state.updateCache, function (err, metadata) {
                    state.updateCache = false;

                    var msg = Q.firstErrorMessage(err, metadata);
                    if (msg) {
                        return console.error(msg);
                    }

                    var currencyToken = Q.getObject(["saleInfo", 0], this);
                    var price = Q.getObject(["saleInfo", 1], this);
                    var priceDecimal = price ? parseInt(price)/1e18 : null;
                    var isSale = Q.getObject(["saleInfo", 2], this);

                    pipe.fill("authorUserId")(null, this.authorUserId || "");
                    pipe.fill("metadata")(null, this.metadata || "");
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
                //Web3.getContract(state.chain);
            } else {
                if (state.chainId !== Q.getObject("ethereum.chainId", window)) {
                    return console.warn("Chain id selected is not appropriate to NFT chain id " + state.chainId);
                }

                // if metadata defined, don't request it
                if (state.metadata) {
                    pipe.fill("metadata")(null, state.metadata);
                } else {
                    Q.handle(Web3.getTokenJSON, tool, [state.tokenId, state.chain, pipe.fill("metadata")]);
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
         * Render NFT image
         * @method renderImage
         * @param {jQuery|Element} $container - image container element
         * @param {String} imageUrl
         */
        renderImage: function ($container, imageUrl) {
            if ($container instanceof Element) {
                $container = $($container);
            }

            $container.empty().html('<img alt="icon" class="NFT_preview_icon" src="' + Q.url(imageUrl) + '">');
        },
        /**
         * Render NFT video
         * @method renderVideo element
         * @param {jQuery|Element} $container - video container element
         * @param {String} videoUrl
         * @param {String} imageUrl - image that would be a poster of video
         */
        renderVideo: function ($container, videoUrl, imageUrl) {
            if ($container instanceof Element) {
                $container = $($container);
            }

            var $qVideo = $("<div>").on(Q.Pointer.fastclick, function (e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
            $container.empty().append($qVideo);
            var videoOptions = Q.extend({}, {
                url: videoUrl,
                image: imageUrl && !imageUrl.includes("/img/empty_white.png") ? imageUrl : ""
            });
            $qVideo.tool("Q/video", videoOptions).activate();
        },
        /**
         * Render NFT audio element
         * @method renderVideo
         * @param {jQuery|Element} $container - video container element
         * @param {String} audioUrl
         */
        renderAudio: function ($container, audioUrl) {
            var $qAudio = $("<div>").on(Q.Pointer.fastclick, function (e) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
            $container.empty().append($qAudio);
            var audioOptions = Q.extend({}, {
                url: audioUrl
            });
            $qAudio.tool("Q/audio", audioOptions).activate();
        },
        /**
         * Refreshes the appearance of the tool completely
         * @method refresh
         * @param {Streams_Stream} stream - NFT stream
         */
        renderFromStream: function (stream) {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);
            tool.stream = stream;
            var publisherId = stream.fields.publisherId;
            var streamName = stream.fields.name;

            tool.minted = stream.getAttribute("tokenId");
            $toolElement.attr("data-minted", !!tool.minted);
            var templateName = state.templates.view.name;
            var templateFields = Q.extend({
                show: state.show
            }, state.templates.view.fields);

            Q.Template.render(templateName, templateFields, function (err, html) {
                tool.element.innerHTML = html;

                $toolElement.activate();

                $(".Assets_NFT_avatar", tool.element).tool("Users/avatar", {
                    userId: publisherId,
                    icon: 50,
                    contents: true,
                    editable: false
                }).activate(function () {
                    $(this.element).on(Q.Pointer.fastclick, function (e) {
                        Q.handle(state.onAvatar, this, [e]);
                    });
                });

                $(".Assets_NFT_participants", tool.element).tool("Streams/participants", {
                    showSummary: false,
                    showControls: true,
                    showBlanks: true,
                    publisherId: publisherId,
                    streamName: streamName
                }).activate();

                $(".Assets_NFT_title", tool.element).tool("Streams/inplace", {
                    editable: false,
                    field: "title",
                    inplaceType: "text",
                    publisherId: publisherId,
                    streamName: streamName
                }, "nft_preview_title_" + tool.stream.fields.name.split("/").pop()).activate();

                $(".Assets_NFT_description", tool.element).tool("Streams/inplace", {
                    editable: false,
                    field: "content",
                    inplaceType: "text",
                    publisherId: publisherId,
                    streamName: streamName
                }, "nft_preview_description_" + tool.stream.fields.name.split("/").pop()).activate();

                // apply Streams/preview icon behavior
                var videoUrl = state.video || stream.getAttribute("videoUrl");
                var audioUrl = state.audio || stream.getAttribute("audioUrl");
                var videoProvider = stream.getAttribute("videoProvider");
                var videoId = stream.getAttribute("videoId");
                var imageUrl = state.image || stream.iconUrl("x");
                var $container = $(".video-container", tool.element);
                var $previewIcon = $("img.NFT_preview_icon", tool.element);

                if (videoUrl) {
                    tool.renderVideo($container, videoUrl, imageUrl);
                } else if (audioUrl) {
                    tool.renderAudio($container, audioUrl);
                } else if (imageUrl && !imageUrl.includes("empty_white")) {
                    tool.renderImage($container, imageUrl);
                } else if (videoId) {
                    videoUrl = Q.getObject(["video", "cloudUpload", videoProvider, "url"], Q).interpolate({videoId: videoId});
                    tool.renderVideo($container, videoUrl);
                } else {
                    var overrides = NFT.icon.defaultSize ? {
                        "overrideShowSize": {
                            '': (stream.fields.defaultSize || state.defaultSize || NFT.icon.defaultSize)
                        }
                    } : {};
                    tool.preview.icon($previewIcon[0], null, overrides);
                }

                // set onInvoke event
                $toolElement.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
                    Q.handle(state.onInvoke, tool, [publisherId, streamName]);
                });

                // set onMessage Streams/changed to change image or video or audio
                stream.onMessage("Streams/changed").set(function (updatedStream, message) {
                    tool.renderFromStream(updatedStream);
                }, [tool.id, Q.normalize(publisherId), Q.normalize(streamName.split("/").pop())].join("_"));
            });
        },
        /**
         * Render preview from metadata object
         * @method renderFromMetadata
         * @param {object} metadata
         * @param {String} authorAddress
         * @param {String} ownerAddress
         * @param {object} commissionInfo
         * @param {object} saleInfo
         * @param {string} authorUserId - id of NFT author user
         */
        renderFromMetadata: function (metadata, authorAddress, ownerAddress, commissionInfo, saleInfo, authorUserId) {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);

            tool.minted = true;
            $toolElement.attr("data-minted", tool.minted);
            var templateName = state.templates.view.name;
            var templateFields = Q.extend({
                title: metadata.name,
                description: metadata.description,
                show: state.show
            }, state.templates.view.fields);

            Q.Template.render(templateName, templateFields, (err, html) => {
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
                }

                var videoUrl = state.video || metadata.video || metadata.youtube_url;
                var audioUrl = state.audio;
                var imageUrl = state.image || metadata.image || "";
                if (!imageUrl && metadata.image_data) {
                    imageUrl = 'data:image/svg+xml;utf8,' + imageUrl;
                }
                var $container = $(".video-container", tool.element);

                if (videoUrl) {
                    tool.renderVideo($container, videoUrl, imageUrl);
                } else if (audioUrl) {
                    tool.renderAudio($container, audioUrl);
                } else if (imageUrl) {
                    tool.renderImage($container, imageUrl);
                } else if (metadata.animation_url) {
                    /*var xhr = new XMLHttpRequest();
                    xhr.open('HEAD', metadata.animation_url, true);
                    xhr.onload = function() {
                        var contentType = xhr.getResponseHeader('Content-Type');
                        if (contentType.includes("video")) {
                            _renderVideoTool(metadata.animation_url);
                        } else if (contentType.includes("audio")) {
                            _renderAudioTool(metadata.animation_url);
                        }
                    };
                    xhr.send();*/

                    $.ajax({
                        type: "HEAD",
                        url: metadata.animation_url,
                    }).done(function(message, text, jqXHR){
                        var contentType = jqXHR.getResponseHeader('Content-Type');
                        if (contentType.includes("video")) {
                            tool.renderVideoTool(metadata.animation_url);
                        } else if (contentType.includes("audio")) {
                            tool.renderAudioTool(metadata.animation_url);
                        }
                    });
                }

                // set onInvoke event
                $toolElement.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
                    Q.handle(state.onInvoke, tool, [metadata, authorAddress, ownerAddress, commissionInfo, saleInfo, authorUserId]);
                });
            });
        },
        /**
         * Create NFT
         * @method composer
         */
        composer: function () {
            var tool = this;
            var $toolElement = $(this.element);
            var previewState = tool.preview.state;
            previewState.editable = true; // we need to upload icon

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

                    Streams.get(previewState.publisherId, previewState.streamName, function (err) {
                        if (err) {
                            return;
                        }

                        tool.stream = this;
                        $toolElement.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, tool.update.bind(tool));
                    });
                }, {
                    fields: {
                        publisherId: previewState.publisherId,
                        category: previewState.related
                    }
                });
            });
        },
        /**
         * Update NFT
         * @method update
         */
        update: function () {
            var tool = this;
            var $toolElement = $(this.element);
            var state = this.state;
            var isNew = $toolElement.hasClass("Streams_preview_composer");
            var previewState = this.preview.state;
            var publisherId = previewState.publisherId;
            var streamName = previewState.streamName;

            // need to update tool.stream
            // actually on this stage stream should be cached, so Streams.get is just reading stream from cache, hence it can be used as synchronous
            Streams.get(publisherId, streamName, function () {
                tool.stream = this;
            });

            Q.Dialogs.push({
                title: isNew ? tool.text.NFT.CreateNFT : tool.text.NFT.UpdateNFT,
                className: "Assets_NFT_preview_composer",
                template: {
                    name: "Assets/NFT/nftCreate",
                    fields: {
                        minted: false,
                        title: Q.getObject("stream.fields.title", tool) || "",
                        content: Q.getObject("stream.fields.content", tool) || "",
                        saveButtonText: isNew ? tool.text.NFT.CreateYourNFT : tool.text.NFT.UpdateNFT
                    }
                },
                onActivate: function (dialog) {
                    var $icon = $("img.NFT_preview_icon", dialog);
                    var $imageContainer = $icon.closest(".Assets_nft_container");

                    // create new Streams/preview tool to set icon behavior to $icon element
                    $("<div>").tool("Streams/preview", Q.extend(previewState, {editable: true})).activate(function () {
                        this.icon($icon[0], function (element) {
                            var src = element.src;

                            if (src.includes("empty_white")) {
                                $imageContainer.plugin("Q/actions", "remove");
                            } else {
                                $imageContainer.plugin("Q/actions", {
                                    actions: {
                                        remove: function () {
                                            Q.confirm(tool.text.NFT.AreYouSureDeleteImage, function(result) {
                                                if (!result) {
                                                    return;
                                                }

                                                Q.req("Assets/NFT", ["image"], function (err) {
                                                    if (err) {
                                                        return;
                                                    }

                                                    Streams.get.force(publisherId, streamName, function (err) {
                                                        if (err) {
                                                            return;
                                                        }

                                                        tool.renderFromStream(this);
                                                    });
                                                }, {
                                                    method: "delete",
                                                    fields: {
                                                        publisherId: publisherId,
                                                        streamName: streamName
                                                    }
                                                });
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    });

                    // manage attributes
                    tool.manageAttributes($(".Assets_nft_attributes", dialog), tool.stream.getAttribute("Assets/NFT/attributes"));
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

                    var videoTool;
                    var $videoContainer = $(".Assets_nft_movie", dialog).closest(".Assets_nft_container");
                    var _updateVideoTool = function (options) {
                        var videoOptions = Q.extend({}, state.video);
                        var videoId = tool.stream.getAttribute("videoId");
                        var videoProvider = tool.stream.getAttribute("videoProvider");
                        var videoUrl = tool.stream.getAttribute("videoUrl");
                        if (options) {
                            videoId = Q.getObject("videoId", options) || videoId;
                            videoProvider = Q.getObject("videoProvider", options) || videoProvider;
                            videoUrl = Q.getObject("videoUrl", options) || videoUrl;
                        }

                        if (videoUrl) {
                            videoOptions.url = Q.url(videoUrl);
                        } else if (videoId && videoProvider) {
                            videoOptions.url = Q.getObject(["video", "cloudUpload", videoProvider, "url"], Q).interpolate({videoId: videoId})
                        }

                        var $element = $(".Assets_nft_movie", dialog);
                        if (Q.Tool.from($element, "Q/video")) {
                            var $newElement = $("<div class='Assets_nft_movie'></div>").insertAfter($element);
                            Q.Tool.remove($element, true, true);
                            $element = $newElement;
                        }

                        $videoContainer.plugin("Q/actions", "remove");

                        if (!videoOptions.url) {
                            return $videoContainer.removeClass("NFT_preview_loading");
                        }

                        $element.tool("Q/video", videoOptions).activate(function () {
                            videoTool = this;
                            $videoContainer.plugin("Q/actions", {
                                actions: {
                                    remove: function () {
                                        Q.confirm(tool.text.NFT.AreYouSureDeleteVideo, function(result) {
                                            if (!result) {
                                                return;
                                            }

                                            Q.req("Assets/NFT", ["video"], function (err) {
                                                if (err) {
                                                    return;
                                                }

                                                Streams.get.force(publisherId, streamName, function (err) {
                                                    if (err) {
                                                        return;
                                                    }

                                                    tool.renderFromStream(this);
                                                    _updateVideoTool();
                                                });
                                            }, {
                                                method: "delete",
                                                fields: {
                                                    publisherId: publisherId,
                                                    streamName: streamName
                                                }
                                            });
                                        });
                                    }
                                }
                            });
                            $videoContainer.removeClass("NFT_preview_loading");

                        });
                    };

                    _updateVideoTool();

                    // set video Url
                    var $inputUrl = $("input[name=movieUrl]", dialog);
                    $inputUrl.on("change", function () {
                        if (!this.value.matchTypes('url', {requireScheme: false}).length) {
                            return _updateVideoTool();
                        }

                        _updateVideoTool({
                            videoId: null,
                            videoUrl: this.value
                        });
                    });

                    // upload video
                    $("input[name=movieUpload]", dialog).on("change", function () {
                        var file = this.files[0];
                        if (!file) {
                            return;
                        }

                        var reader = new FileReader();
                        $videoContainer.addClass("NFT_preview_loading");
                        reader.readAsDataURL(file);
                        reader.onload = function () {
                            Q.req(Q.action("Streams/stream"), 'data',function (err, res) {
                                var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(res && res.errors);
                                if (msg) {
                                    $videoContainer.removeClass("NFT_preview_loading");
                                    return Q.handle([state.onError, state.onFinish], tool, [msg]);
                                }

                                Streams.get.force(publisherId, streamName, function () {
                                    tool.stream = this;
                                    _updateVideoTool();
                                    $inputUrl.val("");
                                });
                            }, {
                                fields: {
                                    file: {
                                        name: file.name,
                                        data: reader.result,
                                        subpath: publisherId.splitId() + "/" + streamName + "/video"
                                    },
                                    publisherId: publisherId,
                                    streamName: streamName
                                },
                                timeout: 100000,
                                method: 'put'
                            });
                        };
                        reader.onerror = function (error) {
                            console.log('Error: ', error);
                            $videoContainer.removeClass("NFT_preview_loading");
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

                        var attributes = {
                            "Assets/NFT/attributes": tool.collectAttributes(dialog)
                        };
                        if ($inputUrl.val()) {
                            attributes["videoUrl"] = $inputUrl.val();
                        }

                        if (!tool.minted) {
                            Q.req("Assets/NFT", ["NFTStream"],function (err, response) {
                                if (err) {
                                    return;
                                }

                                Q.Dialogs.pop();
                                var streamData = response.slots.NFTStream;
                                Q.handle(state.onCreated, tool, [streamData]);
                            }, {
                                method: isNew ? "post" : "put",
                                fields: {
                                    publisherId: publisherId,
                                    streamName: streamName,
                                    title: $("input[name=title]", dialog).val(),
                                    content: $("input[name=description]", dialog).val(),
                                    attributes: attributes,
                                    category: previewState.related
                                }
                            });

                            return;
                        }

                        var price = parseFloat($("input[name=price]", dialog).val());
                        var $onMarketPlace = $(".Assets_nft_check", dialog);
                        var onMarketPlace = $onMarketPlace.prop("checked");
                        var chainId = $("select[name=chain]", dialog).val();
                        var currencySymbol = $("select[name=currency]", dialog).val();
                        var chain = NFT.chains[chainId];
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
                                price: price
                            }, params);
                            if (tokenId) {
                                attributes.tokenId = tokenId;
                            }
                            if (chainId) {
                                attributes.chainId = chainId;
                            }

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
                                    userId: publisherId,
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
        },
        /**
         * Create attributes list
         * @method manageAttributes
         * @param {Element|jQuery} element - element which need to replace with manager
         * @param {Object} attributes - object with defined attributes
         */
        manageAttributes: function (element, attributes) {
            attributes = Q.isEmpty(attributes) ? [{}] : attributes;
            var $element = element instanceof Element ? $(element) : element;
            var tool = this;
            var previewState = tool.preview.state;
            var publisherId = previewState.publisherId;
            var streamName = previewState.streamName;

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
                                    method: "put",
                                    fields: {
                                        publisherId: publisherId,
                                        streamName: streamName,
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
                            Q.each(Q.getObject([dtVal, "data", ttVal], defaultAttributes) || [], function (index, value) {
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

                            Q.each(Q.getObject([dtVal, "data"], defaultAttributes) || [], function (index, value) {
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
                    publisherId: publisherId
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
        `<div class="title-block Assets_create_titles">
       <div class="video-container Assets_create_video">
           <h4>{{NFT.CreateNFT}}</h4>
       </div>
       <div class="Assets_create_video_footer"></div>
    </div>`,
        {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/nftCreate',
        `<div class="Assets_nft" data-minted="{{minted}}">
        <form>
            <div class="Assets_nft_form_group">
                <input type="text" name="title" value="{{title}}" class="Assets_nft_form_control" placeholder="{{NFT.TitlePlaceholder}}">
            </div>
            <div class="Assets_nft_form_group">
                <input type="text" name="description" value="{{content}}" class="Assets_nft_form_control" placeholder="{{NFT.DescribeYourNFT}}">
            </div>
            <div class="Assets_nft_form_group" data-type="nft_attributes">
                <label>{{NFT.attributes.Title}}:</label>
                <div class="Assets_nft_attributes"></div>
                <button class="Q_button" name="addAttribute">{{NFT.attributes.NewAttribute}}</button>
            </div>
            <div class="Assets_nft_form_group">
                <label>{{NFT.NftPicture}}:</label>
                <div class="Assets_nft_container">
                    <img class="NFT_preview_icon">
                    <button class="Assets_nft_upload_button">{{NFT.UploadFile}}</button>
                </div>
            </div>
            <div class="Assets_nft_form_group">
                <label>{{NFT.NftMovie}}:</label>
                <div class="Assets_nft_container">
                    <input name="movieUrl" placeholder="{{NFT.MovieURL}}"> <label>{{NFT.UploadMovie}}<input type="file" style="display: none;" name="movieUpload"></label>
                    <div class="Assets_nft_movie"></div>
                </div>
            </div>
            <button class="Q_button" name="save">{{saveButtonText}}</button>
        </form>
    </div>`,
        {text: ['Assets/content']});

    Q.Template.set('Assets/NFT/mint', `
        <div class="Assets_nft_market">
            <div><label>{{NFT.PutOnMarketplace}} :</label></div>
            <label class="switch">
                <input type="checkbox" {{#if onMarketPlace}}checked{{/if}} class="Assets_nft_check">
                <span class="slider round"></span>
            </label>
        </div>
        <div class="Assets_nft_form_details" data-active="{{onMarketPlace}}">
            <div class="Assets_nft_form_group">
                <div class="Assets_price">
                    <input type="text" name="price" class="Assets_nft_form_control" placeholder="{{NFT.EnterPrice}}">
                    <select name="currency">
                        {{#each currencies}}
                            <option>{{this}}</option>
                        {{/each}}
                    </select>
                    {{currency}}
                </div>
            </div>
            <div class="Assets_nft_form_group Assets_nft_royalties">
                <div class="Assets_royality">
                    <input type="number" name="royalty" class="Assets_nft_form_control" placeholder="{{NFT.RoyaltyPlaceholder}}">%
                </div>
            </div>
            <button class="Q_button" name="save">{{NFT.MintNFT}}</button>
        </div>
    `, {text: ['Assets/content']});

    Q.Template.set('Assets/NFT/manage/attributes',
        `<div class="Assets_NFT_attribute">
            <select name='display_type'><option value="">{{NFT.attributes.DisplayTitle}}</option>` +
                '{{#each attributes}}' +
                '<option value="{{@key}}">{{this.name}}</option>' +
                '{{/each}}' +
            `</select>
            <select name='trait_type'><option value="">{{NFT.attributes.TraitTitle}}</option><option value="_">{{NFT.attributes.NewTrait}}</option></select>
            <select name='value'><option value="">{{NFT.attributes.ValueTitle}}</option><option value="_">{{NFT.attributes.NewValue}}</option></select>
            <div class="basic32 basic32_remove"></div>
        </div>`,
        {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/view',
        `<div class="title-block">
        {{#if show.avatar}}
            <div class="title_block_header">
                <div class="Assets_NFT_avatar"></div>
            </div>
        {{/if}}
        <div class="video-container"><img class="NFT_preview_icon"></div>
        {{#if show.title}}
            <div class="Assets_NFT_title">{{title}}</div>
        {{/if}}
        {{#if show.description}}
            <div class="Assets_NFT_description">{{description}}</div>
        {{/if}}
        {{#if show.participants}}
            <div class="Assets_NFT_participants"></div>
        {{/if}}
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
(function (window, Q, $, undefined) {
    /**
     * @module Assets
     */

    var Users = Q.Users;
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
    Q.Tool.define("Assets/NFT/preview", ["Streams/preview"], function(options, preview) {
        var tool = this;
        var state = tool.state;
        var $toolElement = $(this.element);
        tool.preview = preview;
        var previewState = preview.state;

        // is admin
        var roles = Object.keys(Q.getObject("roles", Q.Users) || {});
        tool.isAdmin = (roles.includes('Users/owners') || roles.includes('Users/admins'));

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

        var pipe = Q.pipe(["stylesheet", "text"], function (params, subjects) {
            // get all data from blockchain and refresh
            if (previewState.streamName) {
                $toolElement.attr("data-publisherId", previewState.publisherId);
                $toolElement.attr("data-streamName", previewState.streamName);
                previewState.onRefresh.add(tool.refresh.bind(tool), tool);
            } else {
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
        onInvoke: new Q.Event(),
        onAvatar: new Q.Event(),
        onCreated: new Q.Event(),
        poster: null,
        movie: null,
        src: null
    },

{
        /**
         * Refreshes the appearance of the tool completely
         * @method refresh
         */
        refresh: function (stream) {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);
            tool.stream = stream;

            tool.minted = stream.getAttribute("tokenId");
            $toolElement.attr("data-minted", tool.minted);

            Q.Template.render('Assets/NFT/view', {
                title: stream.fields.title,
                show: state.show,
                stream: stream
            }, (err, html) => {
                tool.element.innerHTML = html;

                $toolElement.activate();

                $(".Assets_NFT_avatar", tool.element).tool("Users/avatar", {
                    userId: stream.fields.publisherId,
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
                    publisherId: stream.fields.publisherId,
                    streamName: stream.fields.name
                }).activate();

                $(".Assets_NFT_title", tool.element).tool("Streams/inplace", {
                    editable: false,
                    field: "title",
                    inplaceType: "text",
                    publisherId: stream.fields.publisherId,
                    streamName: stream.fields.name
                }, "nft_preview_title_" + tool.stream.fields.name.split("/").pop()).activate();

                $(".Assets_NFT_description", tool.element).tool("Streams/inplace", {
                    editable: false,
                    field: "content",
                    inplaceType: "text",
                    publisherId: stream.fields.publisherId,
                    streamName: stream.fields.name
                }, "nft_preview_description_" + tool.stream.fields.name.split("/").pop()).activate();

                // apply Streams/preview icon behavior
                var movie = stream.getAttribute("video") || stream.getAttribute("animation_url");
                var videoProvider = stream.getAttribute("videoProvider");
                var videoId = stream.getAttribute("videoId");
                var poster = state.poster;
                var nftMovie = state.movie;
                var nftSrc = state.src;
                var $videoContainer = $(".video-container", tool.element);
                var $previewIcon = $("img.NFT_preview_icon", tool.element);
                var $qVideo, videoOptions;

                if (nftMovie) {
                    $videoContainer.empty().html('<video preload="auto" playsinline="playsinline" loop poster="' + poster + '" controls="" src="' + nftMovie + '#t=0.1"></video>');
                    $videoContainer.on(Q.Pointer.fastclick, function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    });
                } else if (nftSrc) {
                    $videoContainer.empty().html('<img alt="icon" class="NFT_preview_icon" src="' + Q.url(nftSrc) + '">');
                } else if (movie) {
                    $qVideo = $("<div>").on(Q.Pointer.fastclick, function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    });
                    $previewIcon.replaceWith($qVideo);
                    videoOptions = Q.extend({}, state.video, {
                        url: movie,
                        image: stream.fields.icon.includes("/img/empty_white.png") ? "" : stream.iconUrl("x")
                    });
                    $qVideo.tool("Q/video", videoOptions).activate();
                } else if (videoId) {
                    $qVideo = $("<div>").on(Q.Pointer.fastclick, function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    });
                    $previewIcon.replaceWith($qVideo);
                    videoOptions = Q.extend({}, state.video, {
                        url: Q.getObject(["video", videoProvider, "url"], Q).interpolate({videoId: videoId})
                    });
                    $qVideo.tool("Q/video", videoOptions).activate();
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
                    Q.handle(state.onInvoke, tool, [tool.preview.state.publisherId, tool.preview.state.streamName]);
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
            var previewState = this.preview.state;
            var isNew = $toolElement.hasClass("Streams_preview_composer");

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

                    // create new Streams/preview tool to set icon behavior to $icon element
                    $("<div>").tool("Streams/preview", Q.extend(previewState, {editable: true})).activate(function () {
                        this.icon($icon[0]);
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
                    Streams.get.force(previewState.publisherId, previewState.streamName, function () {
                        tool.stream = this;
                        _createVideoTool();
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

                                Streams.get.force(previewState.publisherId, previewState.streamName, function () {
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

                        var attributes = {
                            "Assets/NFT/attributes": tool.collectAttributes(dialog)
                        };
                        if ($inputURL.val()) {
                            attributes["animation_url"] = $inputURL.val();
                        } else if ($museVideoId.val()) {
                            attributes["videoId"] = $museVideoId.val();
                            attributes["videoProvider"] = "muse";
                        }

                        if (!tool.minted) {
                            Q.req("Assets/NFT", ["NFTStream"],function (err, response) {
                                if (err) {
                                    return;
                                }

                                Q.Dialogs.pop();

                                var streamData = response.slots.NFTStream;

                                // need to refresh stream cache
                                Streams.get.force(streamData.publisherId, streamData.streamName, function () {
                                    // need to refresh streams because
                                    //Streams.refresh();
                                    tool.stream = this;
                                });

                                Q.handle(state.onCreated, tool, [streamData]);
                            }, {
                                method: isNew ? "post" : "put",
                                fields: {
                                    publisherId: previewState.publisherId,
                                    streamName: previewState.streamName,
                                    title: $("input[name=title]", dialog).val(),
                                    content: $("input[name=description]", dialog).val(),
                                    attributes: attributes
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
                                    userId: previewState.publisherId,
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
                                        publisherId: previewState.publisherId,
                                        streamName: previewState.streamName,
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
                    <div class="Assets_nft_form_group">
                        <div class="Assets_price">
                            <input type="text" name="price" class="Assets_nft_form_control" placeholder="{{NFT.PriceOnePiece}}">
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
                </div>
            </div>
            <button class="Q_button" name="save">{{saveButtonText}}</button>
        </form>
    </div>`,
        {text: ['Assets/content']});

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
            <div class="Assets_NFT_title"></div>
        {{/if}}
        {{#if show.description}}
            <div class="Assets_NFT_description"></div>
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
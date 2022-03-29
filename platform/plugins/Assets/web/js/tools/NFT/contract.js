(function (window, Q, $, undefined) {
    /**
     * @module Assets
     */

    var Assets = Q.Assets;
    var NFT = Assets.NFT;
    var Web3 = NFT.Web3;

    /**
     * YUIDoc description goes here
     * @class Assets NFT/contract
     * @constructor
     * @param {Object} [options] Override various options for this tool
     *  @param {string} userId - contract owner
     *  @param {string} chainId
     *  @param {boolean} [withSeries=true] - If true activate Streams/related on tool element with series related.
     *  @param {Q.Event} [options.onInvoke] Event occur when user click on tool element.
     *  @param {Q.Event} [options.onAvatar] Event occur when user click on avatar tool.
     *  @param {Q.Event} [options.onCreated] Event occur when contract created.
     */
    Q.Tool.define("Assets/NFT/contract/preview", function(options) {
        var tool = this;
        var state = tool.state;
        var $toolElement = $(this.element);

        // is admin
        var roles = Object.keys(Q.getObject("roles", Q.Users) || {});
        tool.isAdmin = (roles.includes('Users/owners') || roles.includes('Users/admins'));

        if (Q.isEmpty(state.userId)) {
            return console.warn("user id required!");
        }
        if (Q.isEmpty(state.chainId)) {
            return console.warn("chain id required!");
        }
        $toolElement.attr("data-chainId", state.chainId);

        var pipe = new Q.pipe(["stylesheet", "text", "stream"], function (params) {
            tool.text = params.text[1];
            tool.stream = params.stream[1];

            if (tool.stream) {
                $toolElement.attr("data-publisherId", tool.stream.fields.publisherId);
                $toolElement.attr("data-streamName", tool.stream.fields.name);

                tool.refresh(tool.stream);
            } else {
                tool.composer();
            }
        });

        Q.addStylesheet("{{Assets}}/css/tools/NFT/contract.css", pipe.fill('stylesheet'), { slotName: 'Assets' });
        Q.Text.get('Assets/content', pipe.fill('text'), {
            ignoreCache: true
        });
        Q.Streams.get.force(state.userId, NFT.userContractStreamName.interpolate({chainId: state.chainId}), function (err) {
            if (err) {
                if (Q.getObject([0, "classname"], err) === "Q_Exception_MissingRow") {
                    pipe.fill('stream')(null);
                }
                return;
            }
            pipe.fill('stream')(null, this);
        });
    },

    { // default options here
        userId: Q.Users.loggedInUserId(),
        chainId: null,
        withSeries: true,
        onInvoke: new Q.Event(),
        onAvatar: new Q.Event(),
        onCreated: new Q.Event(),
        onRefresh: new Q.Event()
    },

    {
        /**
         * Refreshes the appearance of the tool completely
         * @method refresh
         * @param {Streams_Stream} stream
         */
        refresh: function (stream) {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);
            var publisherId = stream.fields.publisherId;
            var streamName = stream.fields.name;

            $toolElement.removeClass("Assets_NFT_contract_composer");

            Q.Template.render('Assets/NFT/contract/view', {
                title: stream.fields.title,
                address: stream.getAttribute("address")
            }, (err, html) => {
                tool.element.innerHTML = html;

                $(".Assets_NFT_avatar", tool.element).tool("Users/avatar", {
                    userId: publisherId,
                    icon: 40,
                    contents: false,
                    editable: false
                }).activate(function () {
                    $(this.element).on(Q.Pointer.fastclick, function (e) {
                        Q.handle(state.onAvatar, this, [e]);
                    });
                });

                // set onInvoke event
                $toolElement.off("click").on("click", function () {
                    Q.handle(state.onInvoke, tool, [stream]);
                });

                if (state.withSeries) {
                    $("<div class='Assets_NFT_contract_series'>").insertAfter($toolElement).tool("Streams/related", {
                        publisherId: publisherId,
                        streamName: streamName,
                        relationType: "Assets/NFT/series",
                        closeable: false,
                        editable: false,
                        creatable: {
                            'Assets/NFT/series': {
                                title: tool.text.NFT.series.NewItem
                            }
                        },
                        specificOptions: {
                            userId: state.userId,
                            seriesId: Q.Streams.toHexString(state.userId),
                            chainId: state.chainId,
                            contract: stream.getAttribute("address")
                        }
                    }).activate();
                }

                Q.handle(state.onRefresh, tool, [stream]);
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

            $toolElement.addClass("Assets_NFT_contract_composer");

            /*
            var $parent = $toolElement.parent();
            var leftChains = NFT.chains;
            // collect chains
            var usedChains = [];
            Q.each($(".Assets_NFT_contract_preview", $parent), function () {
                usedChains.push($(this).attr("data-chainId"));
            });
            leftChains = Object.keys(NFT.chains)
            .filter(key => usedChains.includes(key))
            .reduce((obj, key) => {
                obj[key] = NFT.chains[key];
                return obj;
            }, {});
            */

            Q.Template.render("Assets/NFT/contract/composer", {
                iconUrl: Q.url("{{Q}}/img/actions/add.png"),
                CreateContractFor: tool.text.NFT.contract.CreateContractFor.interpolate({chain: NFT.chains[state.chainId].name})
            }, function (err, html) {
                if (err) {
                    return;
                }

                tool.element.innerHTML = html;

                $toolElement.off("click").on("click", function (event) {
                    event.preventDefault();

                    $toolElement.addClass("Q_working");

                    var chain = NFT.chains[state.chainId];
                    tool.createContract(chain, function (err, name, symbol, address) {
                        if (err) {
                            return $toolElement.removeClass("Q_working");
                        }

                        Q.req("Assets/NFTContract", ["stream"],function (err, response) {
                            if (err) {
                                return;
                            }

                            var stream = response.slots.stream;
                            Q.Streams.get.force(stream.publisherId, stream.streamName, function (err) {
                                $toolElement.removeClass("Q_working");

                                if (err) {
                                    return;
                                }

                                tool.refresh(this);
                            });
                        }, {
                            method: "post",
                            fields: {
                                userId: state.userId,
                                chainId: state.chainId,
                                symbol: symbol,
                                address: address
                            }
                        });
                    });
                });
            });
        },
        /**
         * Create NFT
         * @method createContract
         * @param {Object} chain - object with all chain info
         * @param {Function} callback
         */
        createContract: function (chain, callback) {
            var tool = this;
            var state = this.state;
            var userId = state.userId;
            var streamTitle = Q.Users.communityId + "/" + userId + "/" + chain.chainId;

            Web3.checkProvider(chain, function (err, factory) {
                if (err) {
                    return Q.handle(callback, tool, [err]);
                }

                Web3.onInstanceCreated.set(function (name, symbol, address) {
                    if (state.onInstanceCreatedCalled) {
                        return;
                    }

                    state.onInstanceCreatedCalled = true;

                    Q.handle(callback, tool, [null, name, symbol, address]);
                    Q.handle(state.onCreated, tool, [name, symbol, address]);
                }, tool);

                Q.handle(Web3.onInstanceCreated, tool, [streamTitle, "0x0000000000000000000000000000000000000000", "some address..."]);

                /*
                try {
                    factory["produce(string,string,string)"](streamTitle, "0x0000000000000000000000000000000000000000", "").catch(function (err) {
                        if (err) {
                            return Q.handle(callback, tool, [err]);
                        }

                    });
                } catch (e) {
                    Q.handle(callback, tool, [e]);
                }*/
            }, {
                mode: "factory",
                factoryJson: chain.factoryJson
            });
        }
    });

    Q.Template.set('Assets/NFT/contract/composer',
        `<img src="{{iconUrl}}" alt="new" class="Streams_preview_add">
        <h3 class="Streams_preview_title" style="user-select: none;">{{CreateContractFor}}</h3>`, {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/contract/view',
        `<div class="Assets_NFT_avatar"></div>
        <h3 class="Streams_preview_title" style="user-select: none;">{{title}}</h3>`,
        {text: ['Assets/content']}
    );
})(window, Q, jQuery);
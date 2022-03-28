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
     *  @param {Q.Event} [options.onInvoke] Event occur when user click on tool element.
     *  @param {Q.Event} [options.onAvatar] Event occur when user click on avatar tool.
     *  @param {Q.Event} [options.onCreated] Event occur when contract created.
     */
    Q.Tool.define("Assets/NFT/contract/preview", ["Streams/preview"], function(options, preview) {
        var tool = this;
        var state = tool.state;
        tool.preview = preview;
        var previewState = tool.preview.state;
        var $toolElement = $(this.element);
        var loggedInUserId = Q.Users.loggedInUserId();

        // is admin
        var roles = Object.keys(Q.getObject("roles", Q.Users) || {});
        tool.isAdmin = (roles.includes('Users/owners') || roles.includes('Users/admins'));

        if (Q.isEmpty(state.userId)) {
            return console.warn("user id required!");
        }

        var pipe = Q.pipe(["stylesheet", "text"], function (params, subjects) {
            if (previewState.streamName) {
                $toolElement.attr("data-publisherId", previewState.publisherId);
                $toolElement.attr("data-streamName", previewState.streamName);

                previewState.onRefresh.add(tool.refresh.bind(tool), tool);
            } else {
                if ((loggedInUserId && state.userId === loggedInUserId) || tool.isAdmin) {
                    previewState.onComposer.add(tool.composer.bind(tool), tool);
                } else {
                    Q.Tool.remove(tool.element, true, true);
                }
            }
        });

        Q.addStylesheet("{{Assets}}/css/tools/NFT/contract.css", pipe.fill('stylesheet'), { slotName: 'Assets' });
        Q.Text.get('Assets/content', function(err, text) {
            tool.text = text;
            pipe.fill('text')();
        }, {
            ignoreCache: true
        });
    },

    { // default options here
        userId: Q.Users.loggedInUserId(),
        onInvoke: new Q.Event(),
        onAvatar: new Q.Event(),
        onCreated: new Q.Event()
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

            $toolElement.attr("data-chainId", stream.fields.chainId);

            Q.Template.render('Assets/NFT/contract/view', {
                title: stream.fields.title,
                address: stream.getAttribute("address")
            }, (err, html) => {
                tool.element.innerHTML = html;

                $(".Assets_NFT_avatar", tool.element).tool("Users/avatar", {
                    userId: stream.fields.publisherId,
                    icon: 40,
                    contents: false,
                    editable: false
                }).activate(function () {
                    $(this.element).on(Q.Pointer.fastclick, function (e) {
                        Q.handle(state.onAvatar, this, [e]);
                    });
                });

                // set onInvoke event
                $toolElement.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
                    Q.handle(state.onInvoke, tool, [stream]);
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
            var relatedTool = Q.Tool.from($toolElement.closest(".Streams_related_tool")[0], "Streams/related");

            $toolElement.addClass("Assets_NFT_contract_new");

            var leftChains = NFT.chains;
            // collect chains
            if (relatedTool) {
                var usedChains = [];
                Q.each(relatedTool.$(".Assets_NFT_contract_preview"), function () {
                    usedChains.push($(this).attr("data-chainId"));
                });

                leftChains = Object.keys(NFT.chains)
                .filter(key => usedChains.includes(key))
                .reduce((obj, key) => {
                    obj[key] = NFT.chains[key];
                    return obj;
                }, {});
            }

            var _openDialog = function () {
                Q.Dialogs.push({
                    title: tool.text.NFT.CreateContract,
                    className: "Assets_NFT_contract_composer",
                    template: {
                        name: "Assets/NFT/contract/Create",
                        fields: {
                            isAdmin: tool.isAdmin,
                            chains: leftChains
                        }
                    },
                    onActivate: function (dialog) {
                        // create NFT
                        $("button[name=create]", dialog).on(Q.Pointer.fastclick, function (event) {
                            event.preventDefault();

                            $(dialog).addClass("Q_disabled");

                            var chainId = $("select[name=chains]", dialog).val();
                            var chain = NFT.chains[chainId];
                            tool.createContract(chain, function (name, symbol, address) {
                                Q.req("Assets/NFTContract",function (err) {
                                    Q.Dialogs.pop();

                                    relatedTool && relatedTool.refresh();
                                }, {
                                    method: "post",
                                    fields: {
                                        userId: state.userId,
                                        title: "Contract for " + chain["name"],
                                        address: address
                                    }
                                });
                            });
                        });
                    }
                });
            };

            var $container = tool.$('.Streams_preview_container');
            $container.off(".Streams_preview").on(".Streams_preview", function () {
                _openDialog();
            });
        },
        createContract: function (chain, callback) {
            var tool = this;
            var $toolElement = $(this.element);
            var state = this.state;
            var userId = state.userId;

            Web3.checkProvider(chain, function (err, factory) {
                if (err) {
                    return;
                }

                Web3.onInstanceCreated.set(function (name, symbol, address) {
                    if (state.onInstanceCreatedCalled) {
                        return;
                    }

                    state.onInstanceCreatedCalled = true;

                    Q.handle(callback, tool, [name, symbol, address]);
                }, tool);

                try {
                    factory["produce(string,string,string)"](Q.Users.communityId + "_" + userId, "0x0000000000000000000000000000000000000000", "").catch(function (e) {
                        console.error(e);
                    });
                } catch (e) {

                }
            }, {
                mode: "factory"
            });
        }
    });

    Q.Template.set('Assets/NFT/contract/Create',
`<div class="Assets_nft_form_group">
            <select name="chain">
                {{#each chains}}
                    <option value="{{@index}}">{{this.name}}</option>
                {{/each}}
            </select>
        </div>
        <button class="Q_button" name="create">{{NFT.Create}}</button>`, {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/contract/view',
        `<div class="Assets_NFT_avatar"></div>
        <div class="Assets_NFT_chain">{{chain}}</div>
        <div class="Assets_NFT_address">{{address}}</div>`,
        {text: ['Assets/content']}
    );
})(window, Q, jQuery);
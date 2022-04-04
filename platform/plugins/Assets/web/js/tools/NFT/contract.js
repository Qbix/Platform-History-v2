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
     *  @param {boolean} [withSeries=true] - If true activate Streams/related on tool element with series related.
     *  @param {integer} [limitSeries=1] - limit related series amount.
     *  @param {Q.Event} [options.onAvatar] Event occur when user click on avatar tool.
     *  @param {Q.Event} [options.onCreated] Event occur when contract created.
     */
    Q.Tool.define("Assets/NFT/contract/preview", function(options) {
        var tool = this;
        var state = tool.state;
        var $toolElement = $(this.element);

        if (Q.isEmpty(state.userId)) {
            return console.warn("user id required!");
        }

        var pipe = new Q.pipe(["stylesheet", "text", "stream", "relations"], function (params) {
            tool.text = params.text[1];
            tool.stream = params.stream[1];
            tool.relations = params.relations[1];

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

        // get related contract
        Q.Streams.related(state.userId, "Assets/NFT/contracts", "Assets/NFT/contract", true, {
            withParticipant: false
        }, function (err) {
            if (err) {
                return;
            }

            if (!this.relations.length) {
                pipe.fill('stream')(null, null);
                pipe.fill('relations')(null, 0);
                return;
            }

            var relation = this.relations[0];
            Q.Streams.get.force(relation.fromPublisherId, relation.fromStreamName, function (err) {
                if (err) {
                    return;
                }

                pipe.fill('stream')(null, this);
                tool.relationType = "Assets/NFT/series/" + this.getAttribute("contract");

                // get related series
                Q.Streams.related(this.fields.publisherId, this.fields.name, tool.relationType, true, {
                    relationsOnly: true,
                    withParticipant: false
                }, function (err) {
                    if (err) {
                        return;
                    }

                    pipe.fill('relations')(null, this.relations.length);
                });
            });
        });
    },

    { // default options here
        userId: Q.Users.loggedInUserId(),
        withSeries: true,
        limitSeries: 1,
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
            var publisherId = stream.fields.publisherId;
            var streamName = stream.fields.name;

            $toolElement.removeClass("Assets_NFT_contract_composer");
            var contractAddress = stream.getAttribute("address");
            var chain = Assets.NFT.chains[state.chainId];

            tool.renderView({
                $element: $toolElement,
                userId: publisherId,
                title: stream.fields.title,
                address: contractAddress,
                onInvoke: function () {
                    Q.Dialogs.push({
                        title: tool.text.NFT.contract.UpdateContract,
                        className: "Assets_NFT_contract_update",
                        template: {
                            name: "Assets/NFT/contract/update"
                        },
                        onActivate: function (dialog) {
                            // Transfer owner
                            $("button[name=transfer]", dialog).on(Q.Pointer.fastclick, function (event) {
                                event.preventDefault();

                                Q.prompt(null, function (address) {
                                    if (!address) {
                                        return;
                                    }

                                    Web3.checkProvider(chain, function (err, contract) {
                                        if (err) {
                                            return;
                                        }

                                        contract.transferOwnership(address).then(function () {
                                            Q.Dialogs.pop();
                                        }).catch(function (err) {
                                            $(dialog).removeClass("Q_disabled");
                                        });
                                    }, {
                                        contractAddress: contractAddress
                                    })
                                },{
                                    title: tool.text.NFT.contract.TransferOwnership
                                });
                            });
                            $("button[name=setBaseURI]", dialog).on(Q.Pointer.fastclick, function (event) {
                                event.preventDefault();

                                Q.prompt(null, function (baseURI) {
                                    if (!baseURI) {
                                        return;
                                    }

                                    Web3.checkProvider(chain, function (err, contract) {
                                        if (err) {
                                            return;
                                        }

                                        contract.setBaseURI(baseURI).then(function () {
                                            Q.Dialogs.pop();
                                        }).catch(function (err) {
                                            $(dialog).removeClass("Q_disabled");
                                        });
                                    }, {
                                        contractAddress: contractAddress
                                    });
                                },{
                                    title: tool.text.NFT.contract.SetBaseURI
                                });
                            });
                            $("button[name=setSuffix]", dialog).on(Q.Pointer.fastclick, function (event) {
                                event.preventDefault();

                                Q.prompt(null, function (suffix) {
                                    if (!suffix) {
                                        return;
                                    }

                                    Web3.checkProvider(chain, function (err, contract) {
                                        if (err) {
                                            return;
                                        }

                                        contract.setSuffix(suffix).then(function () {
                                            Q.Dialogs.pop();
                                        }).catch(function (err) {
                                            $(dialog).removeClass("Q_disabled");
                                        });
                                    }, {
                                        contractAddress: contractAddress
                                    });
                                },{
                                    title: tool.text.NFT.contract.SetSuffix
                                });
                            });
                        },
                        onClose: function () {
                            $toolElement.removeClass("Q_working");
                        }
                    });
                },
                onAvatar: function (e) {
                    Q.handle(state.onAvatar, this, [e]);
                },
                callback: function () {
                    if (state.withSeries) {
                        var relatedOptions = {
                            publisherId: publisherId,
                            streamName: streamName,
                            relationType: "Assets/NFT/series/" + stream.getAttribute("contract"),
                            closeable: false,
                            editable: false,
                            specificOptions: {
                                userId: state.userId,
                                seriesId: Q.Streams.toHexString(state.userId),
                                chainId: state.chainId,
                                contract: stream.getAttribute("address")
                            }
                        };
                        if (tool.relations < state.limitSeries) {
                            relatedOptions.creatable = {
                                'Assets/NFT/series': {
                                    title: tool.text.NFT.series.NewItem
                                }
                            };
                        }
                        $("<div class='Assets_NFT_contract_series'>").insertAfter($toolElement).tool("Streams/related", relatedOptions).activate();
                    }

                    Q.handle(state.onRefresh, tool);
                }
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
            var communityId = Q.Users.communityId;
            var _chainSelect = function (dialog) {
                var $this = $(this);
                var chainId = $this.val();
                var $globalContract = $(".Assets_NFT_contract[data-type=global]", dialog);
                var $customContract = $(".Assets_NFT_contract[data-type=custom]", dialog);
                var streamName = NFT.userContractStreamName.interpolate({chainId: chainId});
                var $selectedOption = $(":selected", $this);
                var contract = $selectedOption.attr("data-contract");
                var factory = $selectedOption.attr("data-factory");
                var chainNetwork = $selectedOption.text();

                Q.Tool.remove($globalContract[0], true, false);
                Q.Tool.remove($customContract[0], true, false);

                $globalContract.removeClass("Q_selected").off("click");
                $customContract.removeClass("Q_selected").off("click");

                if (contract) {
                    tool.renderView({
                        $element: $globalContract,
                        userId: communityId,
                        title: tool.text.NFT.contract.GlobalContractFor.interpolate({chainNetwork: chainNetwork}),
                        address: contract,
                        onInvoke: function () {
                            $globalContract.addClass("Q_selected");
                            $customContract.removeClass("Q_selected");
                        }
                    });
                } else {
                    $globalContract.html(tool.text.NFT.contract.ContractAddressAbsent);
                }

                if (factory) {
                    Q.Streams.get.force(state.userId, streamName, function (err) {
                        if (err) {
                            if (Q.getObject([0, "classname"], err) === "Q_Exception_MissingRow") {
                                Q.Template.render("Assets/NFT/contract/composer", {
                                    iconUrl: Q.url("{{Q}}/img/actions/add.png")
                                }, function (err, html) {
                                    if (err) {
                                        return;
                                    }

                                    $customContract[0].innerHTML = html;

                                    $customContract.off("click").on("click", function () {
                                        Q.Dialogs.push({
                                            title: tool.text.NFT.contract.CreateContract,
                                            className: "Assets_NFT_contract_create",
                                            template: {
                                                name: "Assets/NFT/contract/create"
                                            },
                                            onActivate: function (dialog) {
                                                $("button[name=create]", dialog).on(Q.Pointer.fastclick, function () {
                                                    var name = $("input[name=name]", dialog).val();
                                                    var symbol = $("input[name=symbol]", dialog).val();

                                                    if (!name) {
                                                        return Q.alert(tool.text.NFT.contract.TitleRequired);
                                                    }
                                                    if (!symbol) {
                                                        return Q.alert(tool.text.NFT.contract.SymbolRequired);
                                                    }

                                                    tool.createContract(chainId, name, symbol, function (err, name, symbol, address) {
                                                        if (err) {
                                                            return $customContract.removeClass("Q_working");
                                                        }

                                                        Q.req("Assets/NFTcontract", ["stream"],function (err, response) {
                                                            if (err) {
                                                                return;
                                                            }

                                                            var stream = response.slots.stream;
                                                            Q.Streams.get.force(stream.publisherId, stream.streamName, function (err) {
                                                                $toolElement.removeClass("Q_working");

                                                                if (err) {
                                                                    return;
                                                                }

                                                                tool.stream = this;
                                                                tool.refresh(this);
                                                                $globalContract.addClass("Q_selected");
                                                                $customContract.removeClass("Q_selected");
                                                            });
                                                        }, {
                                                            method: "post",
                                                            fields: {
                                                                name: name,
                                                                userId: state.userId,
                                                                chainId: state.chainId,
                                                                symbol: symbol,
                                                                address: address
                                                            }
                                                        });
                                                    });
                                                });
                                            }
                                        });
                                    });
                                });
                            }
                            return;
                        }

                        tool.renderView({
                            $element: $customContract,
                            title: tool.text.NFT.contract.CustomContractFor.interpolate({chainNetwork: chainNetwork}),
                            address: contract,
                            onInvoke: function () {
                                $globalContract.removeClass("Q_selected");
                                $customContract.addClass("Q_selected");
                            }
                        });
                    });
                } else {
                    $customContract.html(tool.text.NFT.contract.FactoryAddressAbsent);
                }
            }

            $toolElement.addClass("Assets_NFT_contract_composer");

            Q.Template.render("Assets/NFT/contract/composer", {
                iconUrl: Q.url("{{Q}}/img/actions/add.png")
            }, function (err, html) {
                if (err) {
                    return;
                }

                tool.element.innerHTML = html;

                $toolElement.off("click").on("click", function (event) {
                    event.preventDefault();

                    Q.Dialogs.push({
                        title: tool.text.NFT.contract.SelectContract,
                        className: "Assets_NFT_contract_select",
                        apply: true,
                        template: {
                            name: "Assets/NFT/contract/select",
                            fields: {
                                chains: Object.values(NFT.chains)
                            }
                        },
                        onActivate: function (dialog) {
                            var $chains = $("select[name=chains]", dialog);
                            $chains.on("change", function () {
                                Q.handle(_chainSelect, this, [dialog]);
                            });
                            Q.handle(_chainSelect, $chains[0], [dialog]);
                        },
                        onClose: function (dialog) {
                            var chainId = $("select[name=chains]", dialog).val();
                            var $selectedContract = $(".Assets_NFT_contract.Q_selected", dialog);
                            if (!$selectedContract.length) {
                                return;
                            }
                            var type = $selectedContract.attr("data-type");
                            var publisherId = state.userId;
                            if (type === "global") {
                                publisherId = communityId;
                            }

                            $toolElement.addClass("Q_working");

                            Q.req("Assets/NFTcontract", ["setContract"], function (err, response) {
                                if (err) {
                                    return $toolElement.removeClass("Q_working");
                                }

                                var publisherId = Q.getObject("slots.setContract.publisherId", response);
                                var streamName = Q.getObject("slots.setContract.streamName", response);
                                Q.Streams.get.force(publisherId, streamName, function (err) {
                                    if (err) {
                                        return;
                                    }

                                    tool.stream = this;
                                    tool.refresh(this);
                                    $toolElement.removeClass("Q_working");
                                });
                            }, {
                                method: "post",
                                fields: {
                                    publisherId: publisherId,
                                    userId: state.userId,
                                    chainId: chainId
                                }
                            });
                        }
                    });
                });
            });
        },
        /**
         * Rendering contract view template
         * @method renderView
         * @param {object} options
         * @param {Element|jQuery} [options.$element] - elemen to render in, tool.element by default.
         * @param {String} [options.userId] - Users/avatar userId, state.userId by default
         * @param {String} options.title
         * @param {String} [options.address]
         * @param {function} [options.onInvoke] - onclick element
         * @param {function} [options.onAvatar] - onclick avatar
         * @param {function} [options.callback] - on template rendered
         */
        renderView: function (options) {
            var state = this.state;
            var $element = options.$element || $(this.element);
            var userId = options.userId || state.userId;
            var title = options.title;
            var address = options.address;
            var onInvoke = options.onInvoke;
            var onAvatar = options.onAvatar;
            var callback = options.callback;

            Q.Template.render('Assets/NFT/contract/view', {
                title: title, //tool.text.NFT.contract.CustomContractFor.interpolate({chainNetwork: chainNetwork})
                address: address
            }, (err, html) => {
                $element[0].innerHTML = html;

                $(".Assets_NFT_avatar", $element).tool("Users/avatar", {
                    userId: userId,
                    icon: 40,
                    contents: false,
                    editable: false
                }).activate(function () {
                    if (onAvatar) {
                        $(this.element).on(Q.Pointer.fastclick, function (e) {
                            Q.handle(onAvatar, this, [e]);
                        });
                    }
                });

                $element.off("click");
                if (onInvoke) {
                    $element.on("click", onInvoke);
                }

                Q.handle(callback);
            });
        },
        /**
         * Create NFT
         * @method createContract
         * @param {String} chainId
         * @param {String} name - contract name
         * @param {String} symbol - contract symbol
         * @param {Function} callback
         */
        createContract: function (chainId, name, symbol, callback) {
            var tool = this;
            var state = this.state;
            var chain = NFT.chains[chainId];

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

                //Q.handle(Web3.onInstanceCreated, tool, [streamTitle, "0x0000000000000000000000000000000000000000", "some address..."]);

                //symbol max length 10 only capitalized chars

                try {
                    factory["produce(string,string,string)"](name, symbol, "").catch(function (err) {
                        if (err) {
                            return Q.handle(callback, tool, [err]);
                        }

                    });
                } catch (e) {
                    Q.handle(callback, tool, [e]);
                }
            }, {
                mode: "factory"
            });
        }
    });

    Q.Template.set('Assets/NFT/contract/composer',
        `<img src="{{iconUrl}}" alt="new" class="Streams_preview_add">
        <h3 class="Streams_preview_title">{{NFT.contract.CreateContract}}</h3>`, {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/contract/select',
        `<select name="chains">
        {{#each chains}}
            <option value="{{chainId}}" {{#if default}}selected{{/if}} data-contract="{{contract}}" data-factory="{{factory}}">{{name}}</option>
        {{/each}}
        </select>
        <div class="Assets_NFT_contract" data-type="global"></div>
        <div class="Assets_NFT_contract" data-type="custom"></div>`, {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/contract/create',
        `<input name="name" placeholder="{{NFT.contract.TypeContractName}}" /><input name="symbol" placeholder="{{NFT.contract.TypeContractSymbol}}" />
        <button class="Q_button" name="create">{{NFT.contract.CreateContract}}</button>`, {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/contract/update',
        `<button class="Q_buton" name="transfer">{{NFT.contract.TransferOwnership}}</button>
        <button class="Q_buton" name="setBaseURI">{{NFT.contract.SetBaseURI}}</button>
        <button class="Q_buton" name="setSuffix">{{NFT.contract.SetSuffix}}</button>`, {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/contract/view',
        `<div class="Assets_NFT_avatar"></div>
        <h3 class="Streams_preview_title">{{title}}</h3>`,
        {text: ['Assets/content']}
    );
})(window, Q, jQuery);
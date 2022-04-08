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
     *  @param {string} userId - contract owner
     * @param {Object} [options] Override various options for this tool
     *  @param {boolean} [customContracts=true] - If false use only global contracts.
     *  @param {boolean} [onlyDefaultChain=false] - If false use only global contracts.
     *  @param {boolean} [withSeries=true] - If true activate Streams/related on tool element with series related.
     *  @param {integer} [limitSeries=1] - limit related series amount.
     *  @param {Q.Event} [options.onAvatar] Event occur when user click on avatar tool.
     *  @param {Q.Event} [options.onCreated] Event occur when contract created.
     */
    Q.Tool.define("Assets/NFT/contract", function(options) {
        var tool = this;
        var state = tool.state;

        if (Q.isEmpty(state.userId)) {
            return console.warn("user id required!");
        }

        var pipe = new Q.pipe(["stylesheet", "text"], function (params) {
            tool.text = params.text[1];
            tool.refresh();
        });

        Q.addStylesheet("{{Assets}}/css/tools/NFT/contract.css", pipe.fill('stylesheet'), { slotName: 'Assets' });
        Q.Text.get('Assets/content', pipe.fill('text'), {
            ignoreCache: true
        });
    },

    { // default options here
        userId: Q.Users.loggedInUserId(),
        onlyDefaultChain: true,
        customContracts: false,
        withSeries: true,
        limitSeries: 1,
        onAvatar: new Q.Event(),
        onCreated: new Q.Event()
    },

    {
        /**
         * Refreshes the appearance of the tool completely
         * @method refresh
         */
        refresh: function () {
            var tool = this;
            var state = this.state;

            // get related contract
            Q.Streams.related.force(state.userId, "Assets/NFT/contracts", "Assets/NFT/contract", true, {
                withParticipant: false
            }, function (err) {
                if (err) {
                    return;
                }

                if (!this.relations.length) {
                    tool.stream = null;
                    tool.render();
                    return;
                }

                var relation = this.relations[0];
                Q.Streams.get.force(relation.fromPublisherId, relation.fromStreamName, function (err) {
                    if (err) {
                        return;
                    }

                    tool.stream = this;
                    tool.render();
                });
            });
        },
        render: function () {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);
            var communityId = Q.Users.communityId;

            $toolElement.attr("data-customContracts", state.customContracts);
            $toolElement.attr("data-onlyDefaultChain", state.onlyDefaultChain);

            var _chainSelect = function (element) {
                var $this = $(this);
                var selectedChainId = $this.val();
                var $globalContract = $(".Assets_NFT_contract[data-type=global]", element);
                var $customContract = $(".Assets_NFT_contract[data-type=custom]", element);
                var selectedStreamName = NFT.userContractStreamName.interpolate({chainId: selectedChainId});
                var $selectedOption = $(":selected", $this);
                var contract = $selectedOption.attr("data-contract");
                var factory = $selectedOption.attr("data-factory");
                var chainNetwork = $selectedOption.text();

                var chainId = null;
                var publisherId = null;
                var streamName = null;
                if (tool.stream) {
                    publisherId = tool.stream.fields.publisherId;
                    streamName = tool.stream.fields.name;
                    chainId = streamName.split("/").pop();
                }

                Q.Tool.remove($globalContract[0], true, false);
                Q.Tool.remove($customContract[0], true, false);

                $globalContract.removeClass("Q_selected", "Q_working").off("click").empty();
                $customContract.removeClass("Q_selected", "Q_working").off("click").empty();

                // remove all related tools
                $(".Streams_related_tool", tool.element).each(function () {
                    Q.Tool.remove(this, true, true);
                });

                if (contract) {
                    $globalContract.attr("data-publisherId", communityId);
                    $globalContract.attr("data-streamName", selectedStreamName);
                    tool.renderView({
                        $element: $globalContract,
                        title: tool.text.NFT.contract.GlobalContractFor.interpolate({chainNetwork: chainNetwork}),
                        contract: contract,
                        publisherId: communityId,
                        streamName: selectedStreamName,
                        onInvoke: function () {
                            _selectContract($globalContract, function (err) {
                                if (err) {
                                    return;
                                }

                                $globalContract.addClass("Q_selected");
                                $customContract.removeClass("Q_selected");
                            });
                        },
                        callback: function () {
                            if (publisherId === communityId && chainId === selectedChainId) {
                                $globalContract.addClass("Q_selected");
                            }
                        }
                    });
                } else {
                    $globalContract.html(tool.text.NFT.contract.ContractAddressAbsent);
                }

                if (state.customContracts && factory) {
                    Q.Streams.get.force(state.userId, selectedStreamName, function (err) {
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
                                        $customContract.addClass("Q_working");
                                        Q.Dialogs.push({
                                            title: tool.text.NFT.contract.CreateContract,
                                            className: "Assets_NFT_contract_create",
                                            template: {
                                                name: "Assets/NFT/contract/create"
                                            },
                                            onActivate: function (dialog) {
                                                $("button[name=create]", dialog).on(Q.Pointer.fastclick, function () {
                                                    var name = $("input[name=name]", dialog).val();
                                                    var symbol = $("input[name=symbol]", dialog).val().substr(0,10).toUpperCase();

                                                    if (!name) {
                                                        return Q.alert(tool.text.NFT.contract.TitleRequired);
                                                    }
                                                    if (!symbol) {
                                                        return Q.alert(tool.text.NFT.contract.SymbolRequired);
                                                    }

                                                    dialog.addClass("Q_working");

                                                    tool.createContract(selectedChainId, name, symbol, function (err, name, symbol, address) {
                                                        if (err) {
                                                            Q.alert(Q.getObject("data.message", err) || Q.firstErrorMessage(err));
                                                            return dialog.removeClass("Q_working");
                                                        }

                                                        Q.req("Assets/NFTcontract", ["stream"],function (err, response) {
                                                            if (err) {
                                                                Q.alert(Q.firstErrorMessage(err));
                                                                return dialog.removeClass("Q_working");
                                                            }

                                                            var stream = response.slots.stream;
                                                            Q.Streams.get.force(stream.publisherId, stream.streamName, function (err) {
                                                                if (err) {
                                                                    Q.alert(Q.firstErrorMessage(err));
                                                                    return dialog.removeClass("Q_working");
                                                                }

                                                                Q.Dialogs.pop();

                                                                tool.stream = this;
                                                                $globalContract.removeClass("Q_selected");
                                                                $customContract.addClass("Q_selected");

                                                                tool.renderView({
                                                                    $element: $customContract,
                                                                    title: tool.stream.fields.title,
                                                                    contract: tool.stream.getAttribute("contract"),
                                                                    publisherId: tool.stream.fields.publisherId,
                                                                    streamName: tool.stream.fields.name,
                                                                    onInvoke: function () {
                                                                        _selectContract($customContract, function (err) {
                                                                            if (err) {
                                                                                return;
                                                                            }

                                                                            $globalContract.removeClass("Q_selected");
                                                                            $customContract.addClass("Q_selected");
                                                                        });
                                                                    },
                                                                    callback: function () {
                                                                        if (publisherId === state.userId && chainId === selectedChainId) {
                                                                            $customContract.addClass("Q_selected");
                                                                        }
                                                                    }
                                                                });
                                                            });
                                                        }, {
                                                            method: "post",
                                                            fields: {
                                                                name: name,
                                                                userId: state.userId,
                                                                chainId: selectedChainId,
                                                                symbol: symbol,
                                                                contract: address
                                                            }
                                                        });
                                                    });
                                                });
                                            },
                                            onClose: function () {
                                                $customContract.removeClass("Q_working");
                                            }
                                        });
                                    });
                                });
                            }
                            return;
                        }

                        $customContract.attr("data-publisherId", this.fields.publisherId);
                        $customContract.attr("data-streamName", this.fields.name);
                        tool.renderView({
                            $element: $customContract,
                            title: tool.text.NFT.contract.CustomContractFor.interpolate({chainNetwork: chainNetwork}),
                            contract: this.getAttribute("contract"),
                            publisherId: this.fields.publisherId,
                            streamName: this.fields.name,
                            onInvoke: function () {
                                _selectContract($customContract, function (err) {
                                    if (err) {
                                        return;
                                    }

                                    $globalContract.removeClass("Q_selected");
                                    $customContract.addClass("Q_selected");
                                });
                            },
                            callback: function () {
                                if (publisherId === state.userId && chainId === selectedChainId) {
                                    $customContract.addClass("Q_selected");
                                }
                            }
                        });
                    });
                } else if (state.customContracts) {
                    $customContract.html(tool.text.NFT.contract.FactoryAddressAbsent);
                }
            }

            var _selectContract = function ($element, callback) {
                var selectedChainId = $("select[name=chains]", $toolElement).val();
                var type = $element.attr("data-type");
                var publisherId = state.userId;
                if (type === "global") {
                    publisherId = communityId;
                }

                $toolElement.addClass("Q_working");

                Q.req("Assets/NFTcontract", ["setContract"], function (err, response) {
                    if (err) {
                        Q.handle(callback, null, [true]);
                        return $toolElement.removeClass("Q_working");
                    }

                    var publisherId = Q.getObject("slots.setContract.publisherId", response);
                    var streamName = Q.getObject("slots.setContract.streamName", response);
                    Q.Streams.get.force(publisherId, streamName, function (err) {
                        if (err) {
                            return;
                        }

                        tool.stream = this;
                        $toolElement.removeClass("Q_working");
                        Q.handle(callback, null, [null]);
                    });
                }, {
                    method: "post",
                    fields: {
                        publisherId: publisherId,
                        userId: state.userId,
                        chainId: selectedChainId
                    }
                });
            };

            var chains = Object.values(NFT.chains);
            if (state.onlyDefaultChain) {
                chains = chains.filter(function(value, index, arr){
                    return value.default;
                });
            }
            var chainId = null;
            var streamName = null;
            if (tool.stream) {
                streamName = tool.stream.fields.name;
                chainId = streamName.split("/").pop();
            }
            for (var i=0; i<chains.length; i++) {
                if (chainId && chains[i].chainId === chainId) {
                    chains[i].selected = true;
                }
                if (!chainId && chains[i].default) {
                    chains[i].selected = true;
                }
            }

            Q.Template.render("Assets/NFT/contract/select", {
                chains: chains
            }, function (err, html) {
                if (err) {
                    return;
                }

                tool.element.innerHTML = html;
                $toolElement.addClass("Assets_NFT_contract_select");

                var $chains = $("select[name=chains]", tool.element);
                $chains.on("change", function () {
                    Q.handle(_chainSelect, this, [tool.element]);
                });
                Q.handle(_chainSelect, $chains[0], [tool.element]);
            });
        },
        /**
         * Rendering contract view template
         * @method renderView
         * @param {object} options
         * @param {Element|jQuery} [options.$element] - elemen to render in, tool.element by default.
         * @param {String} options.title
         * @param {String} options.publisherId - publisher of contract stream
         * @param {String} options.streamName - stream name of contract stream
         * @param {String} [options.contract]
         * @param {function} [options.onInvoke] - onclick element
         * @param {function} [options.onAvatar] - onclick avatar
         * @param {function} [options.callback] - on template rendered
         */
        renderView: function (options) {
            var tool = this;
            var state = this.state;
            var $element = options.$element || $(this.element);
            var title = options.title;
            var contractAddress = options.contract;
            var onInvoke = options.onInvoke;
            var onAvatar = options.onAvatar;
            var callback = options.callback;
            var publisherId = options.publisherId;
            var streamName = options.streamName;
            var chainId = streamName.split("/").pop();
            var chain = NFT.chains[chainId];
            var relationType = "Assets/NFT/series/" + contractAddress;

            $element.attr("data-contract", contractAddress);

            Q.Template.render('Assets/NFT/contract/view', {
                title: title, //tool.text.NFT.contract.CustomContractFor.interpolate({chainNetwork: chainNetwork})
                contract: contractAddress
            }, (err, html) => {
                $element[0].innerHTML = html;

                $(".Assets_NFT_avatar", $element).tool("Users/avatar", {
                    userId: publisherId,
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

                if (publisherId === state.userId) {
                    $element.plugin('Q/actions', {
                        alwaysShow: true,
                        actions: {
                            edit: function () {
                                Q.prompt(null, function (address) {
                                    if (!address) {
                                        return;
                                    }

                                    Web3.checkProvider(chain, function (err, contract) {
                                        if (err) {
                                            return;
                                        }

                                        contract.transferOwnership(address).then(function () {

                                        }).catch(function (err) {
                                            Q.alert(Q.getObject("data.message", err) || Q.firstErrorMessage(err));
                                        });
                                    }, {
                                        contractAddress: contractAddress
                                    })
                                },{
                                    title: tool.text.NFT.contract.TransferOwnership
                                });
                            }
                        }
                    });
                }

                if (state.withSeries) {
                    var relatedOptions = {
                        publisherId: publisherId,
                        streamName: streamName,
                        relationType: relationType,
                        closeable: false,
                        editable: false,
                        beforeRenderPreview: function (tff) {
                            if (state.userId !== tff.publisherId) {
                                return false;
                            }
                        },
                        specificOptions: {
                            userId: state.userId,
                            chainId: chainId,
                            contractAddress: contractAddress
                        }
                    };

                    // get related series
                    Q.Streams.related.force(publisherId, streamName, relationType, true, {
                        withParticipant: false
                    }, function (err) {
                        if (err) {
                            return;
                        }

                        if (this.relations.length < state.limitSeries) {
                            relatedOptions.creatable = {
                                'Assets/NFT/series': {
                                    publisherId: state.userId,
                                    title: tool.text.NFT.series.NewItem
                                }
                            };
                        }
                        $("<div class='Assets_NFT_contract_series'>").insertAfter($element).tool("Streams/related", relatedOptions).activate();
                    });
                }

                Q.handle(callback, $element);
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

                try {
                    factory["produce(string,string,string,string,string)"](name, symbol, "", NFT.URI.base, NFT.URI.suffix).catch(function (err) {
                        if (err) {
                            return Q.handle(callback, tool, [err]);
                        }

                    });
                } catch (err) {
                    Q.handle(callback, tool, [err]);
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
            <option value="{{chainId}}" {{#if selected}}selected{{/if}} data-contract="{{contract}}" data-factory="{{factory}}">{{name}}</option>
        {{/each}}
        </select>
        <div class="Assets_NFT_contract" data-type="global"></div>
        <div class="Assets_NFT_contract" data-type="custom"></div>`, {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/contract/create',
        `<input name="name" placeholder="{{NFT.contract.TypeContractName}}" /><input name="symbol" maxlength="10" placeholder="{{NFT.contract.TypeContractSymbol}}" />
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
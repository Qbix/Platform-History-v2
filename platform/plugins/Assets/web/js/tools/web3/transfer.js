(function (window, Q, $, undefined) {

var Assets = Q.Assets;
var Users = Q.Users;

/**
 * @module Assets
 */

/**
 * Allows a user to transfer tokens to someone else
 * @class Assets/web3/transfer
 * @constructor
 * @param {Object} options Override various options for this tool
 * @param {String} [options.recipientUserId] - id of user to whom the tokens should be sent
 * @param {Q.Event} [options.onSubmitted] - when signed transaction is submitted to the mempool to be mined
 * @param {Boolean} [options.withHistory] - if true ad a Assets/history tool to the bottom
 */

Q.Tool.define("Assets/web3/transfer", function (options) {
        var tool = this;
        var state = this.state;

        if (!Users.loggedInUserId()) {
            throw new Q.Exception("You are not logged in");
        }

        tool[state.action]();
    },

    { // default options here
        action: "send",
        recipientUserId: null,
        tokenInfo: null,
        withHistory: false,
        onSubmitted: new Q.Event()
    },

    { // methods go here
        refresh: function () {
            var tool = this;
            var state = this.state;

        },
        send: function () {
            var tool = this;
            var state = this.state;
            var $toolElement = $(tool.element);

            Q.Template.render("Assets/web3/transfer/send", {
                recipientUserId: state.recipientUserId,
                tokenInfo: state.tokenInfo,
                withHistory: state.withHistory
            }, function (err, html) {
                if (err) {
                    return;
                }

                Q.replace(tool.element, html);
                Q.activate(tool.element);

                var userSelected = null;
                var $send = $("button[name=send]", tool.element);
                var $userSelected = $(".Assets_transfer_userSelected", tool.element);
                var _transactionSuccess = function () {
                    Q.Dialogs.pop();
                    Q.alert(tool.text.transfer.TransactionSuccess);
                };
                var _getSelectedUser = function (userId) {
                    Q.Streams.get(userId, "Streams/user/xid/web3", function (err) {
                        if (err) {
                            return;
                        }

                        var wallet,walletError;
                        if (!this.testReadLevel("content")) {
                            walletError = tool.text.errors.NotEnoughPermissionsWallet;
                        } else {
                            wallet = this.fields.content;
                            if (!wallet) {
                                walletError = tool.text.errors.ThisUserHaveNoWallet;
                            } else if (!ethers.utils.isAddress(wallet)) {
                                walletError = tool.text.errors.TheWalletOfThisUserInvalid;
                            }
                        }

                        userSelected = null;
                        $(".Users_avatar_tool", $userSelected).each(function () {
                            Q.Tool.remove(this, true, true);
                        });

                        $("<div>").appendTo($userSelected).tool("Users/avatar", {
                            userId: userId,
                            icon: 50,
                            contents: true,
                            editable: false
                        }).activate();

                        userSelected = {
                            userId: userId,
                            wallet: this.fields.content,
                            walletError: walletError
                        };

                        $send.removeClass("Q_disabled");
                    });
                };

                if (Q.isEmpty(state.recipientUserId)) {
                    $(".Assets_transfer_userChooser", tool.element).tool("Streams/userChooser").activate(function () {
                        this.state.onChoose.set(function (userId, avatar) {
                            _getSelectedUser(userId);
                        }, tool);
                    });

                    /*$(".Assets_transfer_usersList", tool.element).tool("Streams/people", {
                        avatar: {
                            short: true,
                            icon: '50'
                        }
                    }).activate(function () {
                        this.state.onChoose.set(function () {
                            //TODO: when Streams/people tool ready, move onChoose event handler here from above
                        }, tool);
                    });*/
                } else {
                    _getSelectedUser(state.recipientUserId);
                }

                tool.assetsWeb3BalanceTool = null;
                if (!state.tokenInfo) {
                    $toolElement.addClass("Q_disabled");
                    $(".Assets_transfer_balance", tool.element).tool("Assets/web3/balance").activate(function () {
                        this.state.onChainChange.add(function () {
                            $toolElement.addClass("Q_disabled");
                        }, tool);
                        this.state.onChainChanged.add(function () {
                            $toolElement.removeClass("Q_disabled");
                        }, tool);
                        tool.assetsWeb3BalanceTool = this;
                    });
                }
                var $amount = $("input[name=amount]", tool.element);
                $send.on(Q.Pointer.fastclick, function () {
                    var $this = $(this);
                    var tokenInfo = state.tokenInfo;
                    if (Q.isEmpty(tokenInfo)) {
                        tokenInfo = tool.assetsWeb3BalanceTool.getValue();
                    }
                    var amount = parseFloat($amount.val());

                    $this.addClass("Q_working");

                    if (tokenInfo.tokenName === "credits") {
                        return Assets.Credits.pay({
                            amount: amount,
                            currency: "credits",
                            userId: userSelected.userId,
                            onSuccess: function () {
                                _transactionSuccess();
                            },
                            onFailure: function (err) {
                                Q.Dialogs.pop();
                                Q.alert(err);
                            }
                        });
                    }

                    if (!amount || amount > tokenInfo.tokenAmount) {
                        $this.removeClass("Q_working");
                        return Q.alert(tool.text.errors.AmountInvalid);
                    }

                    var walletSelected = $("input[name=wallet]", tool.element).val() || Q.getObject("wallet", userSelected);

                    if (Q.isEmpty(walletSelected)) {
                        $this.removeClass("Q_working");
                        return Q.alert(userSelected.walletError || tool.text.errors.NoRecipientSelected);
                    } else if (!ethers.utils.isAddress(walletSelected)) {
                        $this.removeClass("Q_working");
                        return Q.alert(tool.text.errors.WalletInvalid);
                    }

                    var parsedAmount = ethers.utils.parseUnits(String(amount), tokenInfo.decimals);

                    if (parseInt(tokenInfo.tokenAddress) === 0) {
                        Users.Web3.transaction(walletSelected, amount, function (err, transactionRequest, transactionReceipt) {
                            Q.handle(state.onSubmitted, tool, [err, transactionRequest, transactionReceipt]);

                            if (err) {
                                Q.alert(Users.Web3.parseMetamaskError(err));
                                return $this.removeClass("Q_working");
                            }

                            _transactionSuccess();
                        }, {
                            wait: 1,
                            chainId: tokenInfo.chainId
                        });
                        return;
                    }

                    Users.Web3.getContract("Assets/templates/ERC20", {
                        chainId: tokenInfo.chainId,
                        contractAddress: tokenInfo.tokenAddress,
                        readOnly: false
                    }, function (err, contract) {
                        if (err) {
                            //Q.alert(Users.Web3.parseMetamaskError(err, [contract]));
                            return $this.removeClass("Q_working");
                        }

                        contract.on("Transfer", function _assets_web3_transfer_listener (from, to, value) {
                            if (walletSelected.toLowerCase() !== to.toLowerCase()) {
                                return;
                            }

                            _transactionSuccess();
                            contract.off(_assets_web3_transfer_listener);
                        });

                        Users.Web3.withChain(tokenInfo.chainId, function () {
                            contract.transfer(walletSelected, parsedAmount).then(function (info) {
                                Q.handle(state.onSubmitted, tool, [null, info]);
                            }, function (err) {
                                Q.alert(Users.Web3.parseMetamaskError(err, [contract]));
                                $this.removeClass("Q_working");
                            });
                        });
                    });
                });
            });

        }
    });

Q.Template.set("Assets/web3/transfer/send",
`{{#if recipientUserId}}{{else}}
        <div class="Assets_transfer_userChooser"><input name="query" value="" type="text" class="text Streams_userChooser_input" placeholder="{{transfer.SelectRecipient}}" autocomplete="off"></div>
        <div class="Assets_transfer_usersList"></div>
    {{/if}}
    {{#if tokenInfo}}{{else}}
        <div class="Assets_transfer_balance"></div>
    {{/if}}
    <div class="Assets_transfer_userSelected"></div>
    {{#if recipientUserId}}{{else}}
        <input name="wallet" placeholder="{{transfer.OrTypeWalletAddress}}" />
    {{/if}}
    <div class="Assets_transfer_send">
        <input name="amount" placeholder="{{payment.EnterAmount}}" />
        <button class="Q_button" name="send">{{payment.Send}}</button>
    </div>
    {{#if withHistory}}
        {{&tool "Assets/history" type="credits" withUserId=recipientUserId}}
    {{/if}}`,
    {text: ['Assets/content']}
);
})(window, Q, jQuery);
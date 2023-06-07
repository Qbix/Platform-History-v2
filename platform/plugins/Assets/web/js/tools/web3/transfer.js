(function (window, Q, $, undefined) {

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

        if (!Q.Users.loggedInUserId()) {
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

                        if (!this.testReadLevel("content")) {
                            return Q.alert(tool.text.errors.NotEnoughPermissionsWallet);
                        }

                        var wallet = this.fields.content;
                        if (Q.isEmpty(wallet)) {
                            return Q.alert(tool.text.errors.ThisUserHaveNoWallet);
                        } else if (!ethers.utils.isAddress(wallet)) {
                            return Q.alert(tool.text.errors.TheWalletOfThisUserInvalid);
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
                            wallet: this.fields.content
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

                if (!state.tokenInfo) {
                    $(".Assets_transfer_balance", tool.element).tool("Assets/web3/balance").activate();
                }
                var $amount = $("input[name=amount]", tool.element);
                $send.on(Q.Pointer.fastclick, function () {
                    var $this = $(this);
                    if (Q.isEmpty(state.tokenInfo)) {
                        state.tokenInfo = Q.Tool.from($(".Assets_web3_balance_tool", tool.element)[0], "Assets/web3/balance").getValue();
                    }
                    var amount = parseFloat($amount.val());
                    if (!amount || amount > state.tokenInfo.tokenAmount) {
                        return Q.alert(tool.text.errors.AmountInvalid);
                    }

                    var walletSelected = $("input[name=wallet]", tool.element).val() || Q.getObject("wallet", userSelected);

                    if (Q.isEmpty(walletSelected)) {
                        return Q.alert(tool.text.errors.NoRecipientSelected);
                    }
                    if (!ethers.utils.isAddress(walletSelected)) {
                        return Q.alert(tool.text.errors.WalletInvalid);
                    }

                    $this.addClass("Q_working");

                    var parsedAmount = ethers.utils.parseUnits(String(amount), state.tokenInfo.decimals);

                    if (parseInt(state.tokenInfo.tokenAddress) === 0) {
                        Q.Users.Web3.transaction(walletSelected, amount, function (err, transactionRequest, transactionReceipt) {
                            Q.handle(state.onSubmitted, tool, [err, transactionRequest, transactionReceipt]);

                            if (err) {
                                return $this.removeClass("Q_working");
                            }

                            _transactionSuccess();
                        }, {
                            wait: 1,
                            chainId: state.tokenInfo.chainId
                        });
                        return;
                    }

                    Q.Users.Web3.getContract("Assets/templates/ERC20", {
                        chainId: state.tokenInfo.chainId,
                        contractAddress: state.tokenInfo.tokenAddress,
                        readOnly: false
                    }, function (err, contract) {
                        if (err) {
                            return $this.removeClass("Q_working");
                        }

                        contract.on("Transfer", function _assets_web3_transfer_listener (from, to, value) {
                            if (walletSelected.toLowerCase() !== to.toLowerCase()) {
                                return;
                            }

                            _transactionSuccess();
                            contract.off(_assets_web3_transfer_listener);
                        });

                        contract.transfer(walletSelected, parsedAmount).then(function (info) {
                            Q.handle(state.onSubmitted, tool, [null, info]);
                        }, function (err) {
                            $this.removeClass("Q_working");
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
        <button class="Q_button Q_disabled" name="send">{{payment.Send}}</button>
    </div>
    {{#if withHistory}}
        {{&tool "Assets/history" type="credits" withUserId=recipientUserId}}
    {{/if}}`,
    {text: ['Assets/content']}
);
})(window, Q, jQuery);
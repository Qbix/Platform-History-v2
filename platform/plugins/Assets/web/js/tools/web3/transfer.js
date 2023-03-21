(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

/**
 * Allows a user to transfer tokens to someone else
 * @class Assets/web3/transfer
 * @constructor
 * @param {Object} options Override various options for this tool
 * @param {String} options.recipientUserId - id of user to whom the tokens should be sent
 * @param {Q.Event} options.onSubmitted - when signed transaction is submitted to the mempool to be mined
 */

Q.Tool.define("Assets/web3/transfer", function (options) {
        var tool = this;
        var state = this.state;

        if (!Q.Users.loggedInUserId()) {
            throw new Q.Exception("You are not logged in");
        }
        if (Q.isEmpty(state.tokenInfo)) {
            throw new Q.Exception("token info not found");
        }

        tool[state.action]();

        /*var pipe = new Q.pipe(["avatar"], tool[state.action].bind(tool));
        Q.Streams.Avatar.get(state.recipientUserId, function (err, avatar) {
            if (err) {
                return
            }

            state.displayName = avatar.displayName({short: true});
            pipe.fill("avatar")();
        });*/
    },

    { // default options here
        action: "send",
        tokenInfo: null,
        chainId: Q.getObject("Web3.defaultChain.chainId", Q.Assets),
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
                tokenInfo: state.tokenInfo
            }, function (err, html) {
                if (err) {
                    return;
                }

                Q.replace(tool.element, html);

                var userSelected = null;
                $(".Assets_transfer_userChooser", tool.element).tool("Streams/userChooser").activate(function () {
                    var userChooser = this;
                    this.state.onChoose.set(function (userId, avatar) {
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
                            $(".Users_avatar_tool", userChooser.element).each(function () {
                                Q.Tool.remove(this, true, true);
                            });

                            $("<div>").appendTo(userChooser.element).tool("Users/avatar", {
                                userId: userId,
                                icon: 50,
                                contents: true,
                                editable: false
                            }).activate();

                            userSelected = {
                                userId: userId,
                                avatar: avatar,
                                wallet: this.fields.content
                            };
                        });
                    }, tool);
                });

                var $amount = $("input[name=amount]", tool.element);
                $("button[name=send]", tool.element).on(Q.Pointer.fastclick, function () {
                    var $this = $(this);
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

                    var parsedAmount = ethers.utils.parseUnits(String(amount), state.tokenInfo.decimals);

                    if (state.tokenInfo.tokenAddress == Q.Users.Web3.zeroAddress){
                        Q.Users.Web3.transaction(walletSelected, amount, function (err, transaction) {
                            Q.handle(state.onSubmitted, tool, [err, transaction]);
                        }, {
                            chainId: state.chainId
                        });
                        return;
                    }

                    Q.Users.Web3.getContract("Assets/templates/ERC20", {
                        chainId: state.chainId,
                        contractAddress: state.tokenInfo.tokenAddress,
                        readOnly: false
                    }, function (err, contract) {
                        if (err) {
                            return;
                        }

                        $this.addClass("Q_working");

                        contract.on("Transfer", function _assets_web3_transfer_listener (from, to, value) {
                            if (!($this instanceof jQuery)) {
                                return;
                            }

                            if (walletSelected.toLowerCase() !== to.toLowerCase()) {
                                return;
                            }

                            Q.Dialogs.pop();
                            Q.alert(tool.text.transfer.TransactionSuccess);
                            contract.off(_assets_web3_transfer_listener);
                        });

                        contract.transfer(walletSelected, parsedAmount).then(function (info) {

                        }, function (err) {
                            $this.removeClass("Q_working");
                        });
                    });
                });
            });

        }
    });

Q.Template.set("Assets/web3/transfer/send",
    `<div class="Assets_transfer_userChooser"><input name="query" value="" type="text" class="text Streams_userChooser_input" placeholder="{{transfer.SelectRecipient}}" autocomplete="off"></div>
    <input name="wallet" placeholder="{{transfer.OrTypeWalletAddress}}" />
    <input name="amount" placeholder="{{payment.EnterAmount}}" />
    <button class="Q_button" name="send">{{payment.Send}}</button>`,
    {text: ['Assets/content']}
);
})(window, Q, jQuery);
(function (window, Q, $, undefined) {

    /**
     * @module Assets
     */

    /**
     * Allows a user to transfer crypto and credits to someone else
     * @class Assets/web3/transfer
     * @constructor
     * @param {Object} options Override various options for this tool
     * @param {String} options.userId - id of user to whom the crypt should be sent
     * @param {String} options.wallet - wallet address of user to whom the crypt should be sent
     */

    Q.Tool.define("Assets/web3/transfer", function (options) {
            var tool = this;
            var state = this.state;
            var $toolElement = $(tool.element);

            if (!state.userId) {
                throw new Q.Exception("User id required");
            }
            if (!Q.Users.loggedInUserId()) {
                throw new Q.Exception("You are not logged in");
            }

            $toolElement.addClass("Q_working");
            var pipe = new Q.pipe(["avatar", "styles", "text"], function () {
                $toolElement.removeClass("Q_working");
            });
            Q.Streams.Avatar.get(state.userId, function (err, avatar) {
                if (err) {
                    return
                }

                state.displayName = avatar.displayName({short: true});
                pipe.fill("avatar")();
            });

            Q.addStylesheet(["{{Assets}}/css/tools/Web3Pay.css"], pipe.fill("styles"));
            Q.Text.get('Assets/content', function (err, text) {
                var msg = Q.firstErrorMessage(err);
                if (msg) {
                    return console.warn("Assets/text: " + msg);
                }

                tool.texts = text;
                pipe.fill("text")();
            });

            tool.refresh();
        },

        { // default options here
            userId: null,
            wallet: null
        },

        { // methods go here
            refresh: function () {
                var tool = this;
                var state = this.state;
                var _calculateWidth = function (text, css) {
                    var $span = $("<span>").css(css).html(text).hide().appendTo(document.body);
                    var width = $span.width();
                    $span.remove();
                    return width;
                };
                var _formatBalance = function (number) {
                    var zeros = String(number).match(/0+$/g);
                    if (number > 100000 && zeros) {
                        number = String(number/Math.pow(10, zeros[0].length)) + "e+" + zeros[0].length;
                    }
                    return number;
                };

                Q.Template.render("Assets/web3/transfer/crypto", {}, function (err, html) {
                    if (err) {
                        return;
                    }

                    Q.replace(tool.element, html);;
                    $("button[name=sendCrypto]", tool.element)
                    .plugin("Q/clickable")
                    .on(Q.Pointer.fastclick, function () {
                        Q.Dialogs.push({
                            title: tool.texts.payment.PayTo.interpolate({displayName: state.displayName}),
                            className: "Assets_web3_transfer_sendCrypto",
                            onActivate: function (dialog) {
                                dialog.attr("data-loaded", false);
                                var $content = $(".Q_dialog_content", this);

                                Q.req("Assets/currencies", "cryptoBalance", function (err, response) {
                                    dialog.attr("data-loaded", true);
                                    var msg = Q.firstErrorMessage(err, response && response.errors);
                                    if (msg) {
                                        dialog.addClass("Q_error");
                                        return $content.html(msg);
                                    }

                                    var cryptoBalance = response.slots.cryptoBalance;
                                    var $select = $("<select name='currency'></select>");
                                    $select.append($("<option>").html(tool.texts.payment.ChooseCurrency));
                                    $content.html($select);
                                    var sWidth = $select.width() - 10;
                                    var sCss = {
                                        "font-size": $select.css("font-size"),
                                        "font-family": $select.css("font-family")
                                    };
                                    var spaceWidth = Math.ceil(_calculateWidth("&nbsp;", sCss));
                                    Q.each(cryptoBalance, function (i, item) {
                                        var formattedSymbol = item.symbol;
                                        if (formattedSymbol.length > 13) {
                                            formattedSymbol = formattedSymbol.substring(0, 10) + "...";
                                        }
                                        var formattedSymbolWidth = Math.ceil(_calculateWidth(formattedSymbol, sCss));

                                        var formattedBalance = _formatBalance(item.balance);

                                        var formattedBalanceWidth = Math.ceil(_calculateWidth(String(formattedBalance), sCss));

                                        var spaceAmount = (sWidth - (formattedSymbolWidth + formattedBalanceWidth))/spaceWidth;
                                        spaceAmount = spaceAmount > 0 ? spaceAmount : 1;

                                        $select.append($("<option value='" + item.symbol + "'>").html(formattedSymbol + "&nbsp;".repeat(spaceAmount) + formattedBalance));
                                    });
                                    $select.on("change", function () {
                                        Q.Template.render("Assets/web3/transfer/send", {
                                            text: tool.texts.payment.YouCanSendUpTo.interpolate({
                                                amount: _formatBalance(cryptoBalance[$select.val()].balance),
                                                symbol: $select.val()
                                            })
                                        }, function (err, html) {
                                            if (err) {
                                                return;
                                            }

                                            $content.html(html);
                                        });
                                    });
                                }, {
                                    fields: {
                                        userId: Q.Users.loggedInUserId()
                                    }
                                });
                            }
                        });
                    });
                });
            }
        });

    Q.Template.set("Assets/web3/transfer",
        `<button class="Q_button" name="sendCrypto">{{payment.Pay}}</button>`,
        {text: ['Assets/content']}
    );
    Q.Template.set("Assets/web3/transfer/send",
        `<div class="Assets_web3_transfer_send">{{text}}</div>
        <input name="amount" type="number" placeholder="{{payment.EnterAmount}}" />
        <button class="Q_button" name="send">{{payment.Send}}</button>`,
        {text: ['Assets/content']}
    );
})(window, Q, jQuery);
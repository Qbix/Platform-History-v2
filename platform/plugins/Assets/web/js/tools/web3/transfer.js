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
        recipientAddress: "0x206F557a3a49460619d52725Fb00b42937623fE7",
        tokenInfo: null,
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

                var $amount = $("input[name=amount]", tool.element);
                $("button[name=send]", tool.element).on(Q.Pointer.fastclick, function () {
                    var amount = parseFloat($amount.val());
                    if (!amount || amount > state.tokenInfo.tokenAmount) {
                        return Q.alert(tool.text.errors.AmountInvalid);
                    }


                });
            });

        }
    });

Q.Template.set("Assets/web3/transfer/send",
    `<div class="Assets_web3_transfer_send">{{tokenInfo.tokenAmount}} {{tokenInfo.tokenName}}</div>
    <input name="amount" placeholder="{{payment.EnterAmount}}" />
    <button class="Q_button" name="send">{{payment.Send}}</button>`,
    {text: ['Assets/content']}
);
})(window, Q, jQuery);
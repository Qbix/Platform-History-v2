(function (window, Q, $, undefined) {
    /**
     * @module Assets
     */

    var Assets = Q.Assets;
    var Users = Q.Users;
    var Web3 = Users.Web3;

    /**
     * YUIDoc description goes here
     * @class Assets NFT/owned
     * @constructor
     * @param {Object} [options] Override various options for this tool
     *  @param {string} ownerAddress Owner wallet address
     *  @param {string} contractAddress
     */
    Q.Tool.define("Assets/NFT/owned", function(options) {
        var tool = this;
        var state = tool.state;

        if (Q.isEmpty(state.contractAddress)) {
            return Q.alert("contract address required!");
        }
        if (Q.isEmpty(state.ownerAddress)) {
            return Q.alert("owner address required!");
        }

        var pipe = Q.pipe(["stylesheet", "text"], function (params, subjects) {
            Web3.getContract(state.contractAddress, function (err, contract) {
                if (err) {
                    return Q.alert(err.message);
                }

                tool.contract = contract;

                var methodName = "tokensByOwner";
                if (!contract[methodName]) {
                    methodName = "balanceOf";
                    if (!contract[methodName]) {
                        return Q.alert("Method name not supported!");
                    }
                }

                Q.handle(Web3.execute, null, [methodName, state.ownerAddress, contract, function (err, result) {
                    if (err) {
                        return;
                    }

                    //TODO: balanceOf didn't work because you didn't switch chain to BSCT
                    // tokensByOwner return array of tokens, balanceOf return amount of tokens
                    var tokens = parseInt(Q.getObject("0._hex", result));

                    if (!tokens) {
                        return;
                    }

                    return tool.refresh(tokens);
                }]);
            });
        });

        Q.addStylesheet("{{Assets}}/css/tools/NFT/owned.css", pipe.fill('stylesheet'), { slotName: 'Assets' });
        Q.Text.get('Assets/content', function(err, text) {
            tool.text = text;
            pipe.fill('text')();
        }, {
            ignoreCache: true
        });
    },

    { // default options here
        ownerAddress: null,
        contractAddress: null
    },

    {
        /**
         * Refreshes the appearance of the tool completely
         * @method refresh
         * @param {Integer} amount Tokens amount
         */
        refresh: function (amount) {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);

            for (var i=1; i<=amount; i++) {
                Q.handle(Web3.execute, null, ["tokenOfOwnerByIndex", [state.ownerAddress, i], tool.contract, function (err, result) {
                    if (err) {
                        return;
                    }


                    //$("<div>").tool("Assets/NFT/preview")
                }]);
            }
        }
    });
})(window, Q, jQuery);
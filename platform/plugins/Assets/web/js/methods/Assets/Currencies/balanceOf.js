Q.exports(function(){
    /**
    * Get amount of tokens by wallet and chain
    * @method balanceOf
    * @param {String} walletAddress
    * @param {String} chainId
    * @param {function} callback
    * @param {object} [options] - some options pass to getContract method
    * @param {string} [options.tokenAddress] - filter tokens with this contract address
    */
    return function Assets_Currencies_balanceOf(walletAddress, chainId, callback, options) {
        Q.req("Assets/balances", "balance", function (err, response) {
            if (err) {
                return;
            }

            var balance = response.slots.balance;
            Q.handle(callback, null, [null, balance]);
        }, {
            fields: {
                walletAddress: walletAddress,
                chainId: chainId,
                tokenAddresses: Q.getObject("tokenAddresses", options)
            }
        });
    }

});
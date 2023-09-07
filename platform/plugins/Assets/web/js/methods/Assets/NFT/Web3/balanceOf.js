Q.exports(function(){
    /**
    * Get amount of tokens by wallet and chain
    * @method balanceOf
    * @param {String} address
    * @param {Object} chain
    * @param {function} callback
    * @param {object} [options] - some options pass to getContract method
    */
    function balanceOf(address, chain, callback, options) {
        Q.Assets.NFT.Web3.getContract(chain, Q.extend({}, options, {readOnly: true}), function (err, contract) {
            if (err) {
                Q.handle(callback, null, [err]);
            }

            Promise.all([contract.balanceOf(address), contract.name()]).then(function ([tokenAmount, tokenName]) {
                if (Q.getObject("_isBigNumber", tokenAmount)) {
                    tokenAmount = ethers.utils.formatUnits(tokenAmount);
                }

                Q.handle(callback, null, [null, tokenAmount, tokenName, contract]);
            }).catch(function (e) {
                Q.handle(callback, null, [e]);
            });
        });
    }
    
    return balanceOf;
});
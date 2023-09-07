Q.exports(function(){
    /**
    * Get author of NFT by tokenId and chain.
    * If wrong chain selected, suggest to switch chain.
    * @method getAuthor
    * @param {String} tokenId NFT tokenId
    * @param {Object} chain
    * @param {function} callback
    * @param {object} options
    */
    function getAuthor(tokenId, chain, callback, options) {
        Q.Assets.NFT.Web3.getContract(chain, Q.extend({}, options, {readOnly: true}), function (err, contract) {
            if (err) {
                Q.handle(callback, null, [err]);
            }

            contract.authorOf(tokenId).then(function (address) {
                Q.handle(callback, null, [null, address, contract]);
            }, function (err) {
                Q.handle(callback, null, [err.reason]);
            });
        });
    }
    
    return getAuthor;
})
Q.exports(function(){
    /**
    * Get metadata
    * @method metadata
    * @param {String} tokenId - NFT tokenId
    * @param {String} chainId
    * @param {String} contractAddress
    * @param {function} callback
    */
    return function Assets_NFT_Web3_metadata(tokenId, chainId, contractAddress, callback) {
        Q.handle(Q.Assets.batchFunction(), null, ["NFT", "fetchMetadata", tokenId, chainId, contractAddress, function (err) {
            if (err) {
                return Q.handle(callback, null, [err]);
            }

            Q.handle(callback, null, [null, this]);
        }]);
    }
})
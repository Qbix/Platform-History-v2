Q.exports(function(){
    /**
    * Transfer NFT from one address to another.
    * @method transferFrom
    * @param {String} tokenId NFT tokenId
    * @param {Object} chain
    * @param {String} recipient address to transfer to
    * @param {function} callback
    */
    function transferFrom(tokenId, chain, recipient, callback) {
        Q.handle(Q.Assets.NFT.Web3.getOwner, this, [tokenId, chain, function (err, owner, contract) {
            if (err) {
                return Q.alert(err);
            }
            contract.transferFrom(owner, recipient, tokenId).then(function (info) {
                Q.handle(callback, null, [null, info]);
            }, function (err) {
                Q.handle(callback, null, [err.reason]);
            });
        }]);
    }
    return transferFrom;
})
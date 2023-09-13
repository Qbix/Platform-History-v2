Q.exports(function(){
    /**
    * Get owner of NFT by tokenId and chain.
    * If wrong chain selected, suggest to switch chain.
    * @method getOwner
    * @param {String} tokenId NFT tokenId
    * @param {Object} chain
    * @param {function} callback
    * @param {object} options
    */
    function getOwner(tokenId, chain, callback, options) {
        var contract;
        Q.Assets.NFT.Web3.getContract(chain, Q.extend({}, options, {readOnly: true}),function (err, contract_) {
            contract = contract_
            if (err) {
                Q.handle(callback, null, [err]);
            }

            contract.ownerOf(tokenId).then(function (address) {
                Q.handle(callback, null, [null, address, contract]);
            }, function (err) {
                Q.handle(callback, null, [err.reason]);
            });
        });
    }
    
    return getOwner;
})
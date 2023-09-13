Q.exports(function(){
    /**
    * Get commissionInfo of NFT by tokenId and chain.
    * If wrong chain selected, suggest to switch chain.
    * @method commissionInfo
    * @param {String} tokenId NFT tokenId
    * @param {Object} chain
    * @param {function} callback
    * @param {object} options
    */
    function commissionInfo(tokenId, chain, callback, options) {
        var contract;
        Q.Assets.NFT.Web3.getContract(chain, Q.extend({}, options, {readOnly: true}), function (err, contract_) {
            contract = contract_;
            if (err) {
                Q.handle(callback, null, [err]);
            }

            contract.getCommission(tokenId).then(function (info) {
                Q.handle(callback, null, [null, info, contract]);
            }, function (err) {
                Q.handle(callback, null, [err.reason]);
            });
        });
    }
    
    return commissionInfo;
})
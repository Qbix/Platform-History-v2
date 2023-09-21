Q.exports(function(){
    /**
    * Get NFT contract instance
    * @method getContract
    * @param {Object} chainId
    * @param {object} [options]
    * @param {string} [options.contractAddress] - if defined override default chain contract address
    * @param {string} [options.abiPath] - if defined override default abi path
    * @param {function} [callback]
    * @return {Q.Promise} instead of callback
    */
    return function Assets_NFT_Web3_getContract(chainId, options, callback) {
        var address = Q.getObject("contractAddress", options) || chainId.contract;
        var abiPath = Q.getObject("abiPath", options) || 'Assets/templates/R1/NFT/contract';
        return Q.Users.Web3.getContract(abiPath, {
            chainId: chainId,
            contractAddress: address,
            readOnly: !!Q.getObject("readOnly", options)
        }, function (err, contract) {
            if (err) {
                return Q.handle(callback, null, [err]);
            }

            // commented becasue contract.on send infinite requests to publicRPC url
            //TODO: need to use some third party API to listen contract event
            /*var events = {
                TokenRemovedFromSale: "onTokenRemovedFromSale",
                TokenPutOnSale: "onTokenAddedToSale",
                Transfer: "onTransfer",
                OwnershipTransferred: "onTransferOwnership",
                TokenBought: "onTokenBought",
                SeriesPutOnSale: "onSeriesPutOnSale",
                SeriesRemovedFromSale: "onSeriesRemovedFromSale"
            };
            Q.each(contract.ABI, function (index, obj) {
                Q.each(events, function (event1, event2) {
                    if (obj.type === "event" && obj.name === event1) {
                        contract.on(event1, function () {
                            Q.handle(Assets.NFT.Web3[event2], contract, Array.from(arguments))
                        });
                    }
                });
            });*/

            Q.handle(callback, null, [null, contract]);
        });
    }
})
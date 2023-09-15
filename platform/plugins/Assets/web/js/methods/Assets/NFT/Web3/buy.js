Q.exports(function(){
    /**
    * Buy NFT.
    * If wrong chain selected, suggest to switch chain.
    * @method buy
    * @param {String} tokenId NFT tokenId
    * @param {Object} chain Blockchain chain where the tokenId was created
    * @param {String} currency currency of NFT
    * @param {function} callback
    */
   	return function Assets_NFT_Web3_buy(tokenId, chain, currency, callback) {
        if (window.ethereum.chainId !== chain.chainId) {
                Q.handle(callback, null, [true]);
                return Q.alert(Q.Assets.texts.NFT.WrongChain.interpolate({chain: chain.name}), {
                    title: Q.Assets.texts.errors.Error
                });
            }
            var _waitTransaction = function (transactionRequest) {
                if (!Q.getObject("wait", transactionRequest)) {
                    Q.handle(callback, null, [true])
                    return Q.alert("Transaction request invalid!");
                }

                transactionRequest.wait(1).then(function (TransactionReceipt) {
                    if (Q.Assets.NFT.Web3.isSuccessfulTransaction(TransactionReceipt)) {
                        Q.handle(callback, null, [null, TransactionReceipt]);
                    } else {
                        Q.handle(callback, null, ["transaction failed"]);
                    }
                }, function (err) {
                    Q.alert(err.reason, {
                        title: Q.Assets.texts.errors.Error
                    });
                    Q.handle(callback, null, [err.reason]);
                });
            };

            Q.Assets.NFT.Web3.saleInfo(tokenId, chain, function (err, price) {
                if (err) {
                    return console.warn(err);
                }

                Q.Assets.Web3.getContract(chain, function (err, contract) {
                    if (err) {
                        return;
                    }

                    /*contract.estimateGas.buy(tokenId, {value: price.price, from: window.ethereum.selectedAddress}).then(function (gasAmount) {
                        contract.buy(tokenId, {value: price.price, gasLimit: parseInt(gasAmount._hex, 16)}).then(_waitTransaction);
                    }).catch(function (err) {
                        debugger;
                    });*/
                    contract.buy(tokenId, {value: price.price, gasLimit: 10000000}).then(_waitTransaction);
                });
            });
    }
});
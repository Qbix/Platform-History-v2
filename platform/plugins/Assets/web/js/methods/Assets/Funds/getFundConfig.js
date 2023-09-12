Q.exports(function () {
    function getFundConfig(contractAddress, chainId, userAddress, callback) {
        Q.Assets.Funds._getFundConfig(
            contractAddress, 
            chainId,
            userAddress
        ).then(function (instances) {
            Q.handle(callback, null, [null, instances]);	
        }).catch(function(err){
            console.warn(err);
        })

    }
    return getFundConfig;
});
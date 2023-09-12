Q.exports(function () {
    function getAll(chainId, abiPath, callback) {
        Q.Assets.Funds._getAll(
            chainId, 
            abiPath
        ).then(function (instances) {
            Q.handle(callback, null, [null, instances]);	
        }).catch(function(err){
            console.warn(err);
        })

    }
    return getAll;
});
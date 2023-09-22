Q.exports(function () {
    /**
     * Getting all Fund instances info created in Factory
     * @param {type} chainId
     * @param {type} abiPath
     * @param {type} callback
     */
    return function getAll(chainId, abiPath, callback) {
        var fundFactory;
        return Q.Assets.Funds.getFactory(
            chainId, 
            true,
            abiPath
        ).then(function (contract) {
            fundFactory = contract;
            return contract.instancesCount();
        }).then(function (amount) {
            if (amount == 0) {
                return new Promise(function (resolve, reject) {resolve([])});
            }
            var p = [];
            for(var i = 0; i < amount; i++) {
                p.push(fundFactory.instances(i));
            }
            return Promise.allSettled(p);
        }).then(function (instances) {
            Q.handle(callback, null, [null, instances]);	
            return instances;
        }).catch(function(err){
            Q.handle(callback, null, [err]);
            console.warn(err);
        })
    }
});
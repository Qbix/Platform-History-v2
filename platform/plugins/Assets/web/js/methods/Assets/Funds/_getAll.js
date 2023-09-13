Q.exports(function () {
    function _getAll(chainId, abiPath) {
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
        });
    }
    return _getAll;
});
Q.exports(function () {
    /**
    * Get pool instances from blockchain
    * @method getAll
    * @param {String} communityCoinAddress address of communitycoin contract
    * @param {Object} abiPaths optional parameter
    * @param {String} abiPaths.abiPathCommunityCoin path in config to CommunityCoin's ABI
    * @param {String} abiPaths.abiPathStakingPoolF  path in config to CommunityStakingPoolFactory's ABI
    * @param {String} chainId
    * @param {function} callback
    * @param {object} options
    */
    return function getAll(communityCoinAddress, abiPaths, chainId, callback) {
        const defaultAbi = {
            abiPathCommunityCoin: "Assets/templates/R1/CommunityCoin/contract",	
            abiPathStakingPoolF: "Assets/templates/R1/CommunityStakingPool/factory"
        };
        var abi = {};
        if (Q.isEmpty(abiPaths)) {
            abi = defaultAbi;
        } else if (Q.isEmpty(abiPaths.abiPathCommunityCoin)) {
            abi.abiPathCommunityCoin = defaultAbi.abiPathCommunityCoin;
        } else if (Q.isEmpty(abiPaths.abiPathStakingPoolF)) {
            abi.abiPathStakingPoolF = defaultAbi.abiPathStakingPoolF;
        }
        var contractPoolF;
        return Q.Assets.CommunityCoins.Pools.Factory.Get(
            communityCoinAddress, 
            abiPaths, 
            chainId
        ).then(function (_contractPoolF) {
            contractPoolF = _contractPoolF;
            return contractPoolF.instances();
        }).then(function (instanceAddresses) {
            if (Q.isEmpty(instanceAddresses)) {
                return instanceAddresses;
            } else {
                var p = [];

                p.push(new Promise(function (resolve, reject) {resolve(instanceAddresses)}));

                instanceAddresses.forEach(function(i){
                    p.push(contractPoolF.getInstanceInfoByPoolAddress(i));
                });
                return Promise.allSettled(p);
            }
        }).then(function (_ref) {

            var instanceAddresses = _ref.shift(0);

            var ret = [];
            _ref.forEach(function(i, index){
                ret.push(
                    $.extend(
                        {}, 
                        //instanceInfos.value[index], 
                        //t, 
                        {...i.value},
                        {
                            "communityPoolAddress": instanceAddresses.value[index]
                        }
                    )
                ); 
            });
            Q.handle(callback, null, [null, ret]);
            return ret;
        }).catch(function(err){
            console.warn(err);
        });
    }
    
});
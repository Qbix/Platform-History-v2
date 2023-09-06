Q.exports(function () {
    function _getAll(communityCoinAddress, abiPaths, chainId) {
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

            return new Promise(function (resolve, reject) {resolve(ret)});
        });
    }
    return _getAll;
});
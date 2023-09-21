Q.exports(function () {
    /**
    * Get pool instances from blockchain and additionally get token info name/symbol/user/balance
    * @method getAll
    * @param {Object} poolsList pool list from blockchain. can be obtained from server side(php) or form client side (js) by `Assets.CommunityCoins.Pools.getAll`
    * @param {String} communityCoinAddress address of communitycoin contract
    * @param {Object} abiPaths optional parameter
    * @param {String} abiPaths.abiPathCommunityCoin path in config to CommunityCoin's ABI
    * @param {String} abiPaths.abiPathStakingPoolF  path in config to CommunityStakingPoolFactory's ABI
    * @param {String} chainId
    * @param {String} userAddress
    * @param {function} callback
    * @param {object} options
    */
    function Assets_CommunityCoins_Pools_getAllExtended(poolsList, communityCoinAddress, abiPaths, chainId, userAddress, callback){
        var m;
        if (Q.isEmpty(poolsList)) {
            //poolsList retrive from js
            m = Q.Assets.CommunityCoins.Pools.getAll(communityCoinAddress, abiPaths, chainId)
        } else {
            //poolsList got from backend;
            m = new Promise(function (resolve, reject) {resolve(poolsList)})
        }

        m.then(function (instanceInfos) {
            var p = [];
            p.push(new Promise(function (resolve, reject) {resolve(instanceInfos)}));

            p.push(Q.Assets.CommunityCoins.Pools.getERC20TokenInfo(communityCoinAddress, userAddress, chainId));

            instanceInfos.forEach(function(i){
                p.push(Q.Assets.CommunityCoins.Pools.getERC20TokenInfo(i.tokenErc20, userAddress, chainId));
            });

            return Promise.allSettled(p);
        }).then(function (_ref) {

            var instanceInfos = _ref.shift(0);
            var communityCoinInfos = _ref.shift(0);

            var ret = [];
            _ref.forEach(function(i, index){
                var t;
                t = {...instanceInfos.value[index]};
                for (var j in t) {
                    if (
                    (typeof t[j] == 'object') && 
                    (typeof t.duration._isBigNumber == 'boolean') &&
                    (t.duration._isBigNumber == true)
                    ) {
                        t[j] = t[j].toNumber();
                    }
                }

                ret.push(
                    $.extend(
                        {}, 
                        //instanceInfos.value[index], 
                        t, 
                        {
                            "erc20TokenInfo": i.status == 'rejected' ? 
                                            {name:"", symbol:"", balance:""} : 
                                            {name:i.value[0], symbol:i.value[1], balance:i.value[2]}
                        },
                        {
                            "communityCoinInfo": communityCoinInfos.status == 'rejected' ? 
                                            {name:"", symbol:"", balance:""} : 
                                            {name:communityCoinInfos.value[0], symbol:communityCoinInfos.value[1], balance:communityCoinInfos.value[2]}
                        }
                    )
                ); 
            });

            Q.handle(callback, null, [null, ret]);

        }).catch(function(err){
            console.warn(err);
        });
    }
    return Assets_CommunityCoins_Pools_getAllExtended;
});
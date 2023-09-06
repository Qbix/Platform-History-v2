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
    function Assets_CommunityCoins_Pools_getAll(communityCoinAddress, abiPaths, chainId, callback) {
        Q.Assets.CommunityCoins.Pools._getAll(communityCoinAddress, abiPaths, chainId).then(function (instanceInfos) {
            Q.handle(callback, null, [null, instanceInfos]);
        }).catch(function(err){
            console.warn(err);
        });	
    }
    return Assets_CommunityCoins_Pools_getAll;
});
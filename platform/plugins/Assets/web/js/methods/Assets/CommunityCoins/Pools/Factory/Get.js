Q.exports(function () {
    function Get(communityCoinAddress, abiPaths, chainId) {
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

        return Q.Users.Web3.getContract(
            abi.abiPathCommunityCoin, 
            {
                contractAddress: communityCoinAddress,
                readOnly: true,
                chainId: chainId
            }
        ).then(function (contract) {
            return contract.instanceManagment();
        }).then(function (stakingPoolFactory) {
            return Q.Users.Web3.getContract(
                abi.abiPathStakingPoolF, 
                {
                    contractAddress: stakingPoolFactory,
                    readOnly: true,
                    chainId: chainId
                });
        })
    }
    return Get;
});
Q.exports(function () {
    function _getFundConfig(contractAddress, chainId, userAddress) {
        return Q.Users.Web3.getContract(
            'Assets/templates/R1/Fund/contract', {
                chainId: chainId,
                contractAddress: contractAddress,
                readOnly: true
            }
        ).then(function (contract) {
            return contract.getConfig();
        }).then(function (configs) {	
            var p = [];
            p.push(new Promise(function (resolve, reject) {resolve(configs)}));

            if (Q.isEmpty(userAddress)) {
                p.push(new Promise(function (resolve, reject) {resolve([])}));	
                p.push(new Promise(function (resolve, reject) {resolve([])}));	
            } else {
                p.push(Q.Assets.CommunityCoins.Pools._getERC20TokenInfo(configs._sellingToken, userAddress, chainId));
                p.push(Q.Assets.Funds._getWhitelisted(contractAddress, userAddress, chainId));
            }
            return Promise.allSettled(p);
        }).then(function (_ref) {
            var ret = {..._ref[0].value};
            ret = $.extend(
                {}, 
                //instanceInfos.value[index], 
                ret, 
                {	"fundContract": contractAddress,
                    "erc20TokenInfo": _ref[1].status == 'rejected' ? 
                                    {name:"", symbol:"", balance:""} : 
                                    {name:_ref[1].value[0], symbol:_ref[1].value[1], balance:_ref[1].value[2]},
                    "inWhitelist": (
                            _ref[2].status == 'rejected' 
                            ? 
                            // can be in several cases:
                            // 1. whitelist address == address(0), but use whitelist == true. script will try to get data from ZERO address and will fail
                            // 2. whitelist address != address(0), whitelist == true, but contract didnot support whitelist interface.
                            // 3. smth really unexpected
                            false
                            :
                            _ref[2].value
                            )
                }
            );				
            return (new Promise(function (resolve, reject) {resolve(ret)}));
        });

    }
    return _getFundConfig;
});
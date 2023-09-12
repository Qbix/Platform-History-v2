Q.exports(function () {
    function _getERC20TokenInfo(contract, userAddress, chainId){
        return Q.Users.Web3.getContract(
            "Assets/templates/ERC20", 
            {
                contractAddress: contract,
                readOnly: true,
                chainId: chainId
            }
        ).then(function (contract) {
            var p = [];
            p.push(contract.name());
            p.push(contract.symbol());
            p.push(contract.balanceOf(userAddress));

            return Promise.all(p);
        })
    }
    return _getERC20TokenInfo;
});
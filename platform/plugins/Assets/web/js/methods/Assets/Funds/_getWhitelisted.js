Q.exports(function () {
    function _getWhitelisted(contract, userAddress, chainId){
        return Q.Users.Web3.getContract(
            'Assets/templates/R1/Fund/contract', 
            {
                contractAddress: contract,
                readOnly: true,
                chainId: chainId
            }
        ).then(function (contract_) {
            return contract_.whitelisted(userAddress);
        });
    }
    return _getWhitelisted;
});
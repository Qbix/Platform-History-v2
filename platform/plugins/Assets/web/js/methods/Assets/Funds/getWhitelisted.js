Q.exports(function () {
    /**
     * is `userAddress` is whitelisted in fundContract with address `contractAddress`
     * @param {type} contractAddress
     * @param {type} userAddress
     * @param {type} chainId
     * @param {type} callback
     */
    return function getWhitelisted(contractAddress, userAddress, chainId, callback){
        return Q.Users.Web3.getContract(
            'Assets/templates/R1/Fund/contract', 
            {
                contractAddress: contractAddress,
                readOnly: true,
                chainId: chainId
            }
        ).then(function (contract) {
            return contract.whitelisted(userAddress);
        }).then(function (ret) {
            Q.handle(callback, null, [null, ret]);	
            return ret;
        }).catch(function(err){
            Q.handle(callback, null, [err]);
            console.warn(err);
        });
    }
    
});
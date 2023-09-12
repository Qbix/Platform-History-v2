Q.exports(function(){
    function getContract(contractAddress) {
        return Q.Users.Web3.getContract(
            'Assets/templates/R1/NFT/sales/contract',
            contractAddress
        );
    }
    return getContract;
})
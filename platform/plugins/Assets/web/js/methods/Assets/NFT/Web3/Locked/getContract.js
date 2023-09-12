Q.exports(function(){
    function getContract(contractAddress) {
        return Q.Users.Web3.getContract(
            'Assets/templates/R1/NFT/locked',
            contractAddress
        );
    }
    return getContract;
})
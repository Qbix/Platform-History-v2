Q.exports(function(){
    return function Assets_NFT_Web3_Sales_getContract(contractAddress) {
        return Q.Users.Web3.getContract(
            'Assets/templates/R1/NFT/sales/contract',
            contractAddress
        );
    }
})
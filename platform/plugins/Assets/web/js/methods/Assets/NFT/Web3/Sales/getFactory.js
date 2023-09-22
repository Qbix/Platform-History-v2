Q.exports(function(){
    return function Assets_NFT_Web3_Sales_getFactory (chainId) {
        return Q.Users.Web3.getFactory(
            'Assets/templates/R1/NFT/sales/factory',
            chainId
        );
    }
})
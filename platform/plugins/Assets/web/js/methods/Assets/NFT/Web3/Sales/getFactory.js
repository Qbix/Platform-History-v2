Q.exports(function(){
    function getFactory (chainId) {
        return Q.Users.Web3.getFactory(
            'Assets/templates/R1/NFT/sales/factory',
            chainId
        );
    }
    return getFactory;
})
Q.exports(function () {
    function getFactory(chainId, readonly, abiPath) {
        if (Q.isEmpty(abiPath)) {
            abiPath = "Assets/templates/R1/Sales/factory";
        }
        return Q.Users.Web3.getFactory(
            abiPath, 
            readonly == true 
            ?
            {
                chainId: chainId,
                readOnly: true
            }
            :
            chainId
        );
    }
    return getFactory;
});
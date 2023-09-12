Q.exports(function(){
    /**
    * Get NFT contract factory
    * @method getFactory
    * @param {Object} chainId
    * @return {Promise} to be used instead of callback
    */
    function getFactory(chainId) {
        return Q.Users.Web3.getFactory(
            'Assets/templates/R1/NFT/factory',
            chainId
        ).then(function (err, contract) {
            // commented becasue contract.on send infinite requests to publicRPC url
            //TODO: need to use some third party API to listen contract event
            /*var events = {
                InstanceCreated: "onInstanceCreated",
                OwnershipTransferred: "onInstanceOwnershipTransferred"
            };
            Q.each(contract.ABI, function (index, obj) {
                Q.each(events, function (event1, event2) {
                    if (obj.type === "event" && obj.name === event1) {
                        contract.on(event1, function () {
                            Q.handle(Assets.NFT.Web3[event2], null, Array.from(arguments))
                        });
                    }
                });
            });*/
            return contract;
            //Q.handle(callback, null, [err, contract]);
        });
    }
    
    return getFactory;
})
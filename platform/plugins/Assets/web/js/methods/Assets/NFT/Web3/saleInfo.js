Q.exports(function(){
    /**
    * Get saleInfo of NFT by tokenId and chain.
    * If wrong chain selected, suggest to switch chain.
    * @method saleInfo
    * @param {String} tokenId NFT tokenId
    * @param {Object} chain
    * @param {function} callback
    * @param {object} options
    */
    return function Assets_NFT_Web3_saleInfo(tokenId, chain, callback, options) {
       Q.Assets.NFT.Web3.getContract(chain, Q.extend({}, options, {readOnly: true}), function (err, contract) {
           if (err) {
               Q.handle(callback, null, [err]);
           }

           contract.saleInfo(tokenId).then(function (info) {
               var price = Q.getObject("1._hex", info);
               Q.handle(callback, null, [null, {
                   price: price,
                   priceDecimal: parseInt((price || 0), 16)/1e18,
                   currencyToken: Q.getObject("0", info) || null,
                   isSale: !!Q.getObject("2", info)
               }, contract]);
           }, function (err) {
               Q.handle(callback, null, [err.reason]);
           });
       });
   }
})
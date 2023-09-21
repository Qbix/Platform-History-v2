Q.exports(function(){
    /**
    * Set the info for a series
    * @method setSeriesInfo
    * @param {String} contractAddress
    * @param {String} seriesId
    * @param {Object} info Only info.price is really required
    * @param {String} info.price The price (in currency) that minting the NFTs would cost.
    * @param {String} info.fixedPointPrice The fixed-point large integer price (in currency) that minting the NFTs would cost.
    * @param {String} [info.currency] Set the ERC20 contract address, otherwise price would be in the native coin (ETH, BNB, MATIC, etc.)
    * @param {String} [info.decimals=18] set number of decimals for currencies
    * @param {String} [info.authorAddress] Give rights to this address to mintAndDistribute
    * @param {String} [info.limit] maximum number that can be minted
    * @param {String} [info.onSaleUntil] timestamp in seconds since Unix epoch
    * @param {String} [info.duration] can be used instead of onSaleUntil
    * @param {Object} [info.commission] information about commissions
    * @param {Number} [info.commission.fraction] fraction between 0 and 1
    * @param {Address} [info.commission.address] where to send commissions to
    * @param {String} [info.baseURI] to override global baseURI, if necessary
    * @param {String} [info.suffix] to override global suffix, if necessary
    * @return {Promise} promise from ethers.Contract call transaction
    */
    return function Assets_NFT_Web3_setSeriesInfo(contractAddress, seriesId, info, callback) {
        if (typeof contractAddress !== 'string'
        && !(contractAddress instanceof String)) {
            throw new Q.Error("contractAddress must be a string");
        }
        if (seriesId.toString().substr(0, 2) !== '0x') {
            throw new Q.Error("seriesId must be a string starting with 0x");
        }
        var FRACTION = 100000;
        info = info || {};
        var authorAddress = info.authorAddress || Q.Users.Web3.getSelectedXid();
        var limit = info.limit || 0;
        var onSaleUntil = info.onSaleUntil
            || (Math.floor(Date.now()/1000) + (info.duration || 60*60*24*30));
        var currency = info.currency || "0x0000000000000000000000000000000000000000";
                            var decimals = ("decimals" in info) ? info.decimals : 18;
        var price = ("fixedPointPrice" in info)
            ? String(info.fixedPointPrice)
            : ethers.utils.parseUnits(String(info.price), decimals);
        info.commission = info.commission || {};
        var commissionFraction = Math.floor((info.commission.fraction || 0) * FRACTION);
        var commissionAddress = info.commission.address || authorAddress;
        var baseURI = info.baseURI || ''; // default
        var suffix = info.suffix || ''; // default
        return Q.Users.Web3.execute(
            'Assets/templates/R1/NFT/contract',
            contractAddress, 
            "setSeriesInfo", 
            [
                seriesId,
                [
                    authorAddress, 
                    limit, 
                    [onSaleUntil, currency, price], 
                    [commissionFraction, commissionAddress], 
                    baseURI, 
                    suffix
                ], 
            ],
            callback
        );
    }
})
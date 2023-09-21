Q.exports(function () {
    /**
     * 
     * @param {type} asset
     * @param {type} symbol
     * @param {type} decimals
     * @param {type} image
     */
    return function metamask (asset, symbol, decimals, image) {
        return ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: asset,
                    symbol: symbol,
                    decimals: decimals,
                    image: image
                }
            }
        });
    }
});
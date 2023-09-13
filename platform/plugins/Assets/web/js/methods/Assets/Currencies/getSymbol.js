Q.exports(function(){
    /**
     * Use this to get symbol for currency
     * @method getSymbol
     * @static
     * @param {String} currency Currency in ISO 4217 (USD, EUR,...)
     * @param {Function} callback
     */
    function getSymbol(currency, callback) {
        Q.Assets.Currencies.load(function (err, symbols, names) {
            if (err) {
                return;
            }
            Q.handle(callback, null, [Q.getObject(currency, symbols) || currency]);
        });
    }
    return getSymbol;
})
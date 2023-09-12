Q.exports(function(){
    /**
    * Use this to load currency data into Q.Assets.Currencies.symbols and Q.Assets.Currencies.names
    * @method load
    * @static
    * @param {Function} callback Once the callback is called,
    *   Q.Assets.Currencies.symbols and Q.Assets.Currencies.names is accessible
    */
    return Q.getter(function (callback) {
        Q.req('Assets/currencies', 'load', function (err, data) {
            var msg = Q.firstErrorMessage(err, data && data.errors);
            if (msg) {
                return alert(msg);
            }

            Q.Assets.Currencies.symbols = data.slots.load.symbols;
            Q.Assets.Currencies.names = data.slots.load.names;

            Q.handle(callback, Q.Assets.Currencies, [null, Q.Assets.Currencies.symbols, Q.Assets.Currencies.names]);
         });
    });
});
Q.exports(function(priv){
    /**
    * Show a stripe dialog where the user can choose their payment profile
    * and then charge that payment profile.
    * @method stripe
    * @static
    *  @param {Object} [options] Any additional options to pass to the stripe checkout config, and also:
    *  @param {Number} options.amount the amount to pay.
    *  @param {String} [options.currency="usd"] the currency to pay in.
    *  @param {String} [options.description] Operation code which detailed text can be fetch from lang json (Assets/content/payments).
    *  @param {object} [options.metadata] Data to pass to payment gateway to get them back and save to message instructions
    *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
    */
    return function stripe(options, callback) {
        Q.Assets.Payments.checkLoaded();

        options = Q.extend({},
            Q.Assets.texts.payments,
            Q.Assets.Payments.stripe.options,
            options
        );
        if (!options.amount) {
            var err = _error("Assets.Payments.stripe: amount is required");
            return Q.handle(callback, null, [err]);
        }

        options.userId = options.userId || Q.Users.loggedInUserId();
        options.currency = (options.currency || 'USD').toUpperCase();

        if (Q.info.isCordova && (window.location.href.indexOf('browsertab=yes') === -1)) {
            priv._redirectToBrowserTab(options);
        } else {
            Q.Assets.Payments.standardStripe(options, callback);
        }
    }

})
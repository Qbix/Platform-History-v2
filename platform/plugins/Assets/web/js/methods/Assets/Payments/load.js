Q.exports(function(priv){
    /**
    * Load js libs and do some needed actions.
    * @method load
    * @static
    *  @param {Function} [callback]
    */
    return Q.getter(function (callback) {
        Q.addScript(Q.Assets.Payments.stripe.jsLibrary, function () {
            if (Q.Assets.Payments.loaded) {
                return Q.handle(callback);
            }

            Q.Assets.Payments.stripeObject = Stripe(Q.Assets.Payments.stripe.publishableKey);
            Q.Assets.Payments.loaded = true;

            Q.handle(callback);

            // check payment intent
            var clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
            if (clientSecret) {
                Q.Assets.Payments.stripeObject.retrievePaymentIntent(clientSecret).then(function ({paymentIntent}) {
                    Q.Assets.Payments.stripePaymentResult(paymentIntent);

                    // push url without query string
                    Q.Page.push(window.location.href.split('?')[0], document.title);
                }).catch(function (err) {
                    console.error(err);
                });
            }
        });
    })
});
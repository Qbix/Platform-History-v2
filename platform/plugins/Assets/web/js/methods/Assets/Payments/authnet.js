Q.exports(function(_redirectToBrowserTab){
    /**
    * Show an authnet dialog where the user can choose their payment profile,
    * then show a confirmation box to make a payment, and then charge that
    * payment profile.
    * @method authnet
    * @static
    *  @param {Object} [options] Any additional options to pass to the dialog, and also:
    *  @param {Number} options.amount the amount to pay.
    *  @param {String} [options.action] Required. Should be generated with Assets/payment tool.
    *  @param {String} [options.token] Required. Should be generated with Assets/payment tool.
    *  @param {String} [options.publisherId=Q.Users.communityId] The publisherId of the Assets/product or Assets/service stream
    *  @param {String} [options.streamName] The name of the Assets/product or Assets/service stream
    *  @param {String} [options.description] A short name or description of the product or service being purchased.
    *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
    */
    function authnet(options, callback) {
        Q.Assets.Payments.checkLoaded();

        var o = Q.extend({},
            Q.Assets.texts.payments,
            Q.Assets.Payments.authnet.options,
            options
        );
        if (!o.action || !o.token) {
            throw new Q.Error("Assets.Payments.authnet: action and token are required");
        }
        if (!o.amount) {
            throw new Q.Error("Assets.Payments.authnet: amount is required");
        }
        var $form = $('<form method="post" target="Assets_authnet" />')
            .attr('action', o.action)
            .append($('<input name="Token" type="hidden" />').val(o.token));
        var html = '<iframe ' +
            'class="Assets_authnet" ' +
            'name="Assets_authnet" ' +
            'src="" ' +
            'frameborder="0" ' +
            'scrolling="yes" ' +
            '></iframe>';
        Q.Dialogs.push(Q.extend({
            title: o.infoTitle,
            apply: true,
            onActivate: {
                "Assets": function () {
                    $form.submit();
                }
            },
            onClose: {
                "Assets": function () {
                    // TODO: don't do the payment if info wasn't added
                    Q.Assets.Currencies.load(function () {
                        var message = o.confirm.message.interpolate({
                            amount: o.amount,
                            name: o.name,
                            symbol: Q.Assets.Currencies.symbols.USD
                        });
                        Q.extend(o, Q.Assets.texts.payments.confirm);
                        Q.confirm(message, function (result) {
                            if (!result) return;
                            Q.Assets.Payments.pay('authnet', o, callback);
                        }, o);
                    });
                }
            }
        }, options, {
            content: html
        }));
    }
    
    return authnet
})
Q.exports(function(){
    /**
    * Buy credits
    * @method buy
    *  @param {object} options
    *  @param {number} [options.amount=100] Default amount of credits to buy.
    *  @param {string} [options.currency=USD] Currency ISO 4217 code (USD, EUR etc)
    *  @param {string} [options.missing=false] Whether to show text about credits missing.
    *  @param {object} [options.metadata] Data to pass to payment gateway to get them back and save to message instructions
    *  @param {function} [options.onSuccess] Callback to run when payment has completed successfully.
    *  @param {function} [options.onFailure] Callback to run when payment failed.
    */
    function buy(options) {
        options = Q.extend({
            amount: 100,
            currency: 'USD',
            missing: false
        }, options);
        var title = Q.Assets.texts.credits.BuyCredits;
        var YouMissingCredits = null;
        var templateName = 'Assets/credits/buy';
        if (options.missing) {
            templateName = 'Assets/credits/missing';
            title = Q.Assets.texts.credits.MissingCredits;
            YouMissingCredits = Q.Assets.texts.credits.YouMissingCredits.interpolate({amount: options.amount});
        }

        var bonuses = [];
        Q.each(Q.getObject("credits.bonus.bought", Q.Assets), function (credits, bonus) {
            bonuses.push(Q.Assets.texts.credits.BuyBonus.interpolate({amount: "<span class='credits'>" + credits + "</span>", bonus: "<span class='bonus'>" + bonus + "</span>"}));
        });

        Q.Template.set('Assets/credits/missing',
            '<div class="Assets_credits_buy_missing">{{YouMissingCredits}}</div>' +
            '<input type="hidden" name="amount" value="{{amount}}">' +
            '<button class="Q_button" name="buy">{{texts.PurchaseCredits}}</button>'
        );
        Q.Template.set('Assets/credits/buy',
            '{{#each bonuses}}' +
            '	<div class="Assets_credits_bonus">{{&this}}</div>' +
            '{{/each}}' +
            '<div class="Assets_credits_buy"><input name="amount" value="{{amount}}"> {{texts.Credits}}</div>' +
            '<button class="Q_button" name="buy">{{texts.PurchaseCredits}}</button>'
        );

        // indicator of payment process started
        var paymentStarted = false;

        // load payment lib and set required params
        Q.Assets.Payments.load();

        Q.Dialogs.push({
            title: title,
            className: "Assets_credits_buy",
            template: {
                name: templateName,
                fields: {
                    amount: options.amount,
                    YouMissingCredits: YouMissingCredits,
                    bonuses: bonuses,
                    texts: Q.Assets.texts.credits
                }
            },
            onActivate: function (dialog) {
                $("button[name=buy]", dialog).on(Q.Pointer.fastclick, function () {
                    paymentStarted = true;
                    var credits = parseInt($("input[name=amount]", dialog).val());
                    if (!credits) {
                        return Q.alert(Q.Assets.texts.credits.ErrorInvalidAmount);
                    }

                    var currency = options.currency;
                    var rate = Q.getObject(['exchange', currency], Q.Assets.Credits);
                    if (!rate) {
                        return Q.alert(Q.Assets.texts.credits.ErrorInvalidCurrency.interpolate({currency: currency}));
                    }

                    // apply currency rate
                    var amount = Math.ceil(credits/rate);

                    Q.Dialogs.pop();

                    Q.Assets.Payments.stripe({
                        amount: amount,
                        currency: currency,
                        description: Q.Assets.texts.credits.BuyAmountCredits.interpolate({amount: credits}),
                        metadata: options.metadata
                    }, function(err, data) {
                        if (err) {
                            return Q.handle(options.onFailure, null, [err]);
                        }
                        return Q.handle(options.onSuccess, null, [null, data]);
                    });
                });
            },
            onClose: function () {
                if (!paymentStarted) {
                    Q.handle(options.onFailure);
                }
            }
        });
    }
    
    return buy;
})
Q.exports(function(){
    /**
    * Show an authnet dialog where the user can choose their payment profile,
    * then show a confirmation box, and then start a subscription with that
    * payment profile.
    * @method authnet
    * @static
    *  @param {Object} [options] Any additional options to pass to the dialog, and also:
    *  @param {String} [options.planPublisherId=Q.Users.communityId] The publisherId of the subscription plan
    *  @param {String} [options.planStreamName="Assets/plan/main"] The name of the subscription plan's stream
    *  @param {String} [options.action] Required. Should be generated with Assets/subscription tool.
    *  @param {String} [options.token] Required. Should be generated with Assets/subscription tool.
    *  @param {Function} [callback] The function to call, receives (err, paymentSlot)
    */
    function authnet(options, callback) {
        var o = Q.extend({},
            Q.Assets.texts.subscriptions,
            Q.Assets.Subscriptions.authnet.options,
            options
        );
        Q.Streams.get(o.planPublisherId, o.planStreamName, function (err) {
            if (err) {
                return callback && callback(err);
            }
            var plan = this;
            if (!o.action || !o.token) {
                throw new Q.Error("Assets.Subscriptions.authnet: action and token are required");
            }
            var $form = $('<form  method="post" target="Assets_authnet" />')
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
                        // TODO: don't do the subscription if payment info wasn't added
                        var message = o.confirm.message.interpolate({
                            title: plan.fields.title,
                            name: o.name
                        });
                        Q.extend(o, Q.Assets.texts.subscriptions.confirm);
                        Q.confirm(message, function (result) {
                            if (!result) return;
                            Q.Assets.Subscriptions.subscribe('authnet', o, callback);
                        }, o);
                    }
                }
            }, options, {
                content: html
            }));
        });
    }
    
	authnet.options = {
		name: Q.Users.communityName
	};
    
    return authnet;
})
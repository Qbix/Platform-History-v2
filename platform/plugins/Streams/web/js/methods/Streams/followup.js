Q.exports(function(priv) {
    
    /**
     * @method followup
     * @static
     * @param {Object} options
     * @param {String} [options.show="alert"] Can be "alert" or "confirm", or empty
     * @param {Object} [options.mobile]
     * @param {Array} [options.mobile.numbers] The list of phone numbers to send to
     * @param {String} [options.mobile.text] Override template for sms body
     * @param {String} [options.mobile.alert] Override template for alert
     * @param {String} [options.mobile.confirm] Override template for confirmation dialog to continue
     * @param {Object} [options.email]
     * @param {Array} [options.email.addresses] The list of email addresses to send to
     * @param {String} [options.email.subject] Override template for subject
     * @param {String} [options.email.body] Override template for email body
     * @param {String} [options.email.alert] Override template for alert
     * @param {String} [options.email.confirm] Override template for confirmation dialog to continue
     * @param {Object} options.facebook
     * @param {Array} options.facebook.xids The facebook xids to send followup push notifications to messenger
     */
    return function Streams_followup(options, callback) {
        var o = Q.extend({}, Q.Streams.followup.options, 10, options);
        var e = o.email;
        var m = o.mobile;
        if (e && e.addresses && e.addresses.length) {
            Q.Template.render({
                subject: e.subject,
                body: e.body,
                alert: e.alert,
                confirm: e.confirm
            }, Q.info, function (params) {
                if (o.show === 'alert' && params.alert[1]) {
                    Q.alert(params.alert[1], { onClose: _emails, title: e.title, apply: true });
                } else if (o.show === 'confirm' && params.confirm[1]) {
                    Q.confirm(params.confirm[1], function (choice) {
                        choice && _emails();
                    }, { title: e.title });
                } else {
                    _emails();
                }
                function _emails() {
                    var url = Q.Links.email(
                        Q.getObject(["subject", 1], params), Q.getObject(["body", 1], params), null, null, e.addresses
                    );
                    Q.handle(callback, Q.Streams, [url, e.addresses, params]);
                    window.location = url;
                }
            });
        } else if (m && m.numbers && m.numbers.length) {
            Q.Template.render({
                text: m.text,
                alert: m.alert,
                confirm: m.confirm
            }, Q.info, function (params) {
                if (o.show === 'alert' && params.alert[1]) {
                    Q.alert(params.alert[1], { onClose: _sms, title: m.title, apply: true });
                } else if (o.show === 'confirm' && params.confirm[1]) {
                    Q.confirm(params.confirm[1], function (choice) {
                        choice && _sms();
                    }, { title: m.title });
                } else {
                    _sms();
                }
                function _sms() {
                    var url = Q.Links.sms(params.text[1], m.numbers);
                    Q.handle(callback, Q.Streams, [url, m.numbers, params]);
                    window.location = url;
                }
            });
        }
    };
})
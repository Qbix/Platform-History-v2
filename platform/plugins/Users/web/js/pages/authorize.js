Q.page('Users/authorize', function () {
    $('.Q_button').plugin('Q/clickable');
    $('#Users_login').on(Q.Pointer.click, _login);
    $('#Users_authorize').on(Q.Pointer.click, _authorize);
    if (!Q.Users.loggedInUser) {
        _login();
    } else if (Q.Users.authorize.automatic) {
        _authorize();
    }
    
    return function () {
        $('#Users_authorize').off(Q.Pointer.click);
        $('#Users_login').off(Q.Pointer.click);
    };
    
    function _login() {
        Q.plugins.Users.login({
            noClose: true,
            onSuccess: { 'Users.login': function (user, options, result, used) {
                Q.handle(window.location.href);
            }}
        });
    }
    
    function _authorize() {
        var fields = {
            authorize: 1
        };
        if ($('#Users_agree').length) {
            if (!$("#Users_agree").attr('checked')) {
                alert(Q.text.Users.authorize.mustAgree);
                return false;
            }
            fields.agree = 'yes';
        }
        $('#Users_authorize').addClass('Q_working');
        Q.each([
            'client_id', 'redirect_uri',
            'state', 'response_type'
        ], function (i, field) {
            fields[field] = Q.Users.authorize[field];
        });
        fields.scope = Q.Users.authorize.scope.join(' ');
        Q.req(Q.info.url, 'url', function (err, response) {

        }, {
            method: 'post',
            fields: fields
        });
        return false;
    }
}, 'Users/authorize');
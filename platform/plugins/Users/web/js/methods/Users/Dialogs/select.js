Q.exports(function (Users, priv) {
    /**
	 * Operates with dialogs
     * @module Users
	 * @class Users.Dialogs
	 */
    /**
     * Show a select dialog with several email addresses/phones numbers.
     * @static
     * @method select
     * @param {object} options
     * @param {Function} [callback] The function to call after dialog is activated
     */
    return function Users_Dialogs_select(options, callback) {
        var allOptions = Q.extend({}, Users.Dialogs.select.options, options);
        if (!allOptions.contacts) {
            return;
        }

        var selectedContact = null;
        Q.Dialogs.push({
            title: allOptions.text.title.interpolate({
                displayName: allOptions.displayName
            }),
            template: {
                name: allOptions.templateName,
                fields: {
                    contacts: allOptions.contacts,
                    prefix: allOptions.prefix
                }
            },
            stylesheet: '{{Users}}/css/Users/contacts.css',
            apply: true,
            onActivate: function (dialog) {
                $('td', dialog).on(Q.Pointer.fastclick, function () {
                        var $tr = $(this).closest("tr");
                        var $icon = $(".Users_contacts_dialog_buttons", $tr);

                        if($icon.hasClass('checked')) {
                            return;
                        }

                        $(dialog).find(".checked").removeClass("checked");
                        $icon.addClass("checked");
                        selectedContact = $icon.closest("td").data("contact");
                    });
            },
            onClose: function () {
                Q.handle(callback, Users, [selectedContact]);
            }
        });
    };
});
Q.exports(function (Users, priv) {
    /**
	 * Operates with dialogs
     * @module Users
	 * @class Users.Dialogs
	 */
    /**
     * Show a dialog with contacts.
     * @static
     * @method contacts
     * @param {object} [options]
     * @param {Function} [callback] The function to call after dialog is activated
     */
    return function Users_Dialogs_contacts(options, callback) {
        var allOptions = Q.extend({}, Users.Dialogs.contacts.options, options);
        var selectedContacts = allOptions.data || {};

        Q.addStylesheet('{{Users}}/css/Users/contacts.css', {slotName: 'Users'});

        var _addContact = function (options) {
            var c = {
                id: options.id,
                name: options.name,
                icon: options.icon,
                prefix: options.contactType
            };
            c[options.contactType] = options.contact;
            selectedContacts[options.id] = c;
        };
        var _removeContact = function (id, dialog) {
            $('.tr[data-rawid="'+ id +'"] .Users_contacts_dialog_' + selectedContacts[id].prefix, dialog)
                .removeClass("checked");
            delete selectedContacts[id];

            return false;
        };
        var _prepareContacts = function (dialog) {
            var $parent = $(".Q_dialog_content", dialog);
            var $sticky = $(".Users_contacts_sticky", $parent);

            for(var i in selectedContacts) {
                $('.tr[data-rawid="'+ selectedContacts[i].id +'"] .Users_contacts_dialog_' + selectedContacts[i].prefix, dialog)
                    .addClass("checked");
            }

            // adjust letters size to fit all letters to column
            var _adjustHeight = function () {
                var $letters = $("div", $sticky);
                var totalHeight = 0;

                $sticky.height($parent.height());

                Q.each($letters, function (i, element) {
                    totalHeight += $(element).height();
                });

                if (totalHeight > $parent.height()) {
                    $letters.css('font-size', parseInt($letters.css('font-size')) - 1 + 'px');
                    setTimeout(_adjustHeight, 100);
                }
            };
            setTimeout(_adjustHeight, 1000);
        };
        var _rowClick = function ($row, dialog, text) {
            var $email = $row.find(".Users_contacts_dialog_email");
            var $phone = $row.find(".Users_contacts_dialog_phone");
            var emailContact = $email.closest(".td").data("email");
            var phoneContact = $phone.closest(".td").data("phone");
            var name = $row.find(".Users_contacts_dialog_name").text();
            var rawid = $row.data("rawid");

            $row.addClass("Users_contacts_flash");
            setTimeout(function () {
                $row.removeClass("Users_contacts_flash");
            }, 1000);

            if ($row.find(".checked").length) {
                return _removeContact(rawid, dialog);
            }

            if (Q.getObject('length', emailContact)) {
                if (emailContact.length > 1) {
                    Users.Dialogs.select({
                        displayName: name,
                        contacts: emailContact,
                        prefix: "email",
                        text: text
                    }, function (data) {
                        if (!data) {
                            return;
                        }
                        $email.addClass("checked");
                        _addContact({id: rawid, name: name, icon: icon, contact: data, contactType:"email"});
                    })
                } else if (emailContact.length === 1) {
                    $email.addClass("checked");
                    _addContact({id: rawid, name: name, icon: icon, contact: emailContact[0], contactType:"email"});
                }
            } else if (Q.getObject('length', phoneContact)) {
                if (phoneContact.length > 1) {
                    Users.Dialogs.select({
                        displayName: name,
                        contacts: phoneContact,
                        prefix: "phone",
                        text: text
                    }, function (data) {
                        if (!data) {
                            return;
                        }
                        $phone.addClass("checked");
                        _addContact({id: rawid, name: name, icon: icon, contact: data, contactType: "phone"});
                    })
                } else if (phoneContact.length === 1) {
                    $phone.addClass("checked");
                    _addContact({id: rawid, name: name, icon: icon, contact: phoneContact[0], contactType: "phone"});
                }
            }
        };

        var _groupContacts = function (contacts) {
            var contactsAlphabet = {};

            // construct contactsAlphabet object: contacts grouped by first name letter
            Q.each(contacts, function (i, contact) {
                var firstLetter = contact.displayName.charAt(0).toUpperCase();

                if (!contactsAlphabet[firstLetter]) {
                    contactsAlphabet[firstLetter] = [];
                }

                contactsAlphabet[firstLetter].push(contact);
            });

            // sort contacts letters alphabet
            contactsAlphabet = Object.keys(contactsAlphabet).sort().reduce(function (acc, key) {
                acc[key] = contactsAlphabet[key];
                return acc;
            }, {});

            return contactsAlphabet;
        };

        var pipe = Q.pipe(['contacts', 'text'], function (params) {
            var contacts = params.contacts[0];
            var text = params.text[0];

            Q.Dialogs.push({
                title: text.title,
                template: {
                    name: allOptions.templateName,
                    fields: {
                        contacts: _groupContacts(contacts),
                        isCordova: Q.info.isCordova,
                        text: text
                    }
                },
                apply: true,
                onActivate: function (dialog) {
                    var $parent = $(".Q_dialog_content", dialog);

                    $($parent).on(Q.Pointer.fastclick, function (e) {
                        if (!$(e.target).hasClass("Users_contacts_input")) {
                            $(".Users_contacts_input", $parent).trigger('blur');
                        }
                    });

                    $(dialog).on(Q.Pointer.fastclick, '.Users_contacts_dialog_buttons', function () {
                        var $this = $(this);
                        var $row = $this.closest(".tr");
                        var rawid = $row.data("rawid");
                        var name = $row.find(".Users_contacts_dialog_name").text();
                        var contact = $this.closest(".td").data();
                        var contactType = Object.keys(contact)[0];
                        contact = Q.getObject(contactType, contact);
                        if (!contact || $this.hasClass("checked")) {
                            return _removeContact(rawid, dialog);
                        }

                        $row.find(".checked").removeClass("checked");
                        $this.addClass("checked");

                        if (contact.length > 1) {
                            Users.Dialogs.select({
                                displayName: name,
                                contacts: contact,
                                prefix: contactType,
                                text: text
                            }, function (data) {
                                if (!data) {
                                    $this.removeClass("checked");
                                    return;
                                }
                                _addContact({id: rawid, name: name, contact: data, contactType: contactType});
                            })
                        } else {
                            _addContact({id: rawid, name: name, contact: contact[0], contactType: contactType});
                        }

                        return false;
                    });

                    $(dialog).on(Q.Pointer.fastclick, '.tr[data-rawid]', function () {
                        var $row = $(this);

                        _rowClick($row, dialog, text);
                    });

                    // scroll to letter
                    $(dialog).on(Q.Pointer.fastclick, ".Users_contacts_sticky > div", function () {
                        var $offsetElement = $(".Users_contacts_dialog_letter .td:contains(" + $(this).text() + ")", $parent);
                        var $header = $(".Users_contacts_header", $parent);

                        $parent.animate({
                            scrollTop: $parent.scrollTop() - $header.outerHeight() + $offsetElement.position().top
                        }, 1000);
                    });

                    // filter users by name
                    $(dialog).on('change keyup input paste', ".Users_contacts_input", function () {
                        var filter = $(this).val();
                        if (filter) {
                            $parent.addClass('Users_contacts_filtering');
                        } else {
                            $parent.removeClass('Users_contacts_filtering');
                        }

                        Q.each($(".tr[data-rawId]", $parent), function () {
                            var $name = $(".td.Users_contacts_dialog_name", this);
                            var text = $name.html().replace(/\<(\/)?b\>/gi, '');

                            $name.html(text);

                            if (!filter) {
                                return;
                            }

                            if (text.toUpperCase().indexOf(filter.toUpperCase()) >= 0) {
                                $name.html(text.replace(new RegExp(filter,'gi'), function(match) {
                                    return '<b>' + match + '</b>'
                                }));
                                $(this).addClass('Users_contacts_filter_match');
                            } else {
                                $(this).removeClass('Users_contacts_filter_match');
                            }
                        });
                    });

                    // create new contact
                    $(dialog).on(Q.Pointer.fastclick, ".Users_contacts_create", function () {
                        var method = Q.getObject("Cordova.UI.create", Users);

                        if (!method) {
                            return Q.alert(text.CreateAccountNotFound);
                        }

                        method(function(contactId){
                            Users.chooseContacts(function () {
                                Q.Template.render(allOptions.templateName, {
                                    contacts: _groupContacts(this),
                                    text: text
                                }, function (err, html) {
                                    if (err) {
                                        return;
                                    }

                                    $parent.html(html);
                                    _prepareContacts(dialog);

                                    setTimeout(function () {
                                        var $row = $(".tr[data-rawid='" + contactId + "']", $parent);
                                        var $header = $(".Users_contacts_header", $parent);

                                        _rowClick($row, dialog, text);

                                        $parent.animate({
                                            scrollTop: $parent.scrollTop() - $header.outerHeight() + $row.position().top
                                        }, 1000);
                                    }, 100);
                                });
                            });
                        }, function(err){
                            console.warn(err);
                        });
                    });

                    _prepareContacts(dialog);
                },
                onClose: function () {
                    Q.handle(callback, Users, [selectedContacts]);
                }
            });
        });

        Q.Text.get("Users/content", function (err, result) {
            pipe.fill('text')(Q.getObject(["contacts", "dialog"], result));
        });

        Users.chooseContacts(function (dataType) {
            var identifierTypes = Q.getObject("identifierTypes", options);
            var contacts = this;

            // clear contacts from objects in email and phoneNumbers
            $.each(contacts, function (i, contact) {
                if (!contact || typeof contact !== "object") {
                    return;
                }

                $.each(contact, function (j, obj) {
                    if (!obj || typeof obj !== "object" || (j !== "emails" && j !== "phoneNumbers")) {
                        return;
                    }

                    var cleared = [];
                    $.each(obj, function (k, element) {
                        if (typeof element === "string") {
                            cleared.push(element);
                        }
                    });
                    contact[j] = cleared;
                });
            });

            if (!Q.isEmpty(identifierTypes) && dataType === 'browser') {
                Q.each(contacts, function (i, contact) {
                    var added = false;

                    Q.each(identifierTypes, function (j, type) {
                        if (added) {
                            return;
                        }

                        if (type === 'email' && !Q.isEmpty(contact.emails)) {
                            added = true;
                            return _addContact({
                                id: contact.id,
                                name: contact.displayName,
                                icon: contact.icon,
                                contact: contact.emails[0],
                                contactType:'email'
                            });
                        }

                        if (type === 'mobile' && !Q.isEmpty(contact.phoneNumbers)) {
                            added = true;
                            return _addContact({
                                id: contact.id,
                                name: contact.displayName,
                                icon: contact.icon,
                                contact: contact.phoneNumbers[0],
                                contactType:'phone'
                            });
                        }
                    });
                });

                return Q.handle(callback, Users, [selectedContacts]);
            }

            pipe.fill('contacts')(contacts);
        });
    };

});
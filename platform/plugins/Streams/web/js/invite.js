(function () {

var Users = Q.Users;
var Streams = Q.Streams;

Streams.Dialogs.invite._dialog = function (publisherId, streamName, callback, options) {

    var stream = null;
    var text = null;
    options = Q.extend({}, Streams.Dialogs.invite.options, options);

    var suggestion = null, data = null;
    var fields = {
        publisherId: publisherId,
        streamName: streamName
    };
    if (options.token) {
        fields.token = options.token;
    }

    // detect if cordova or Contacts Picker API available.
    var isContactsPicker = Q.info.isCordova || ('contacts' in navigator && 'ContactsManager' in window);

    Q.req('Streams/invite', ['suggestion', 'data'], function (err, response) {
        var slots = response && response.slots;
        if (slots) {
            suggestion = slots.suggestion;
            data = slots.data;
            $('.Streams_invite_dialog').addClass('Streams_suggestion_ready');
        }
    }, {
        fields: fields
    });

    var pipe = Q.pipe(['stream', 'text'], function () {
        
        var copyLinkText = text.copyLink.interpolate({ClickOrTap: Q.text.Q.words.ClickOrTap});
        if (Q.getObject("share", navigator)) {
            copyLinkText = text.shareOrCopyLink.interpolate({ClickOrTap: Q.text.Q.words.ClickOrTap});
        }

        var _renderInviteList = function (contacts, $eContacts) {
            Q.Template.render("Users/templates/contacts/display", {
                contacts: contacts,
                text: text
            }, function (err, html) {
                if (err) {
                    return;
                }

                $eContacts.html(html).activate();

                $("button.Streams_invite_submit_contact", $eContacts).on(Q.Pointer.fastclick, function () {
                    Q.each(contacts, function (identifier, obj) {
                        var inviteParams = {
                            stream: stream,
                            data: data
                        };

                        if (obj.prefix === "user") {
                            inviteParams.userId = obj["id"];
                        } else {
                            inviteParams.identifier = obj[obj.prefix];
                        }

                        var pipe = new Q.Pipe(Object.keys(obj), function (params) {
                            Q.handle(callback, Streams, [inviteParams]);
                        });

                        Q.each(obj, function (key, value) {
                            if (Q.isArrayLike(value)) {
                                value = value[0];
                            }

                            if (key === 'icon' && value) {
                                var reader = new FileReader();
                                reader.readAsDataURL(value);
                                reader.onloadend = function() {
                                    inviteParams[key] = reader.result;
                                    pipe.fill(key)();
                                }
                                return;
                            }

                            inviteParams[key] = value;
                            pipe.fill(key)();
                        });
                    });
                    Q.Dialogs.pop();
                    Q.Dialogs.pop();
                });

                $(".qp-communities-close", $eContacts).on(Q.Pointer.fastclick, function () {
                    var $this = $(this);
                    var id = $this.attr('data-id');
                    $this.closest("tr").remove();
                    delete contacts[id];

                    $eContacts.data("contacts", contacts);

                    if ($.isEmptyObject(contacts)) {
                        $("button.Streams_invite_submit_contact", $eContacts).remove();
                    }
                });
            });
        };

        if(options.templateName == 'Streams/templates/invite/classicDialog'){
            Q.Dialogs.push({
                title: options.title || text.title,
                template: {
                    name: 'Streams/templates/invite/dialog',
                    fields: {
                        isContactsPicker: isContactsPicker,
                        userChooser: options.userChooser,
                        text: text,
                        photo: (options.photo)? text.photo: options.photo,
                        to: text.to.interpolate({"Stream Title": stream.fields.title}),
                        copyLink: copyLinkText,
                        QR: text.QR.interpolate({ClickOrTap: Q.text.Q.words.ClickOrTap})
                    }
                },
                stylesheet: '{{Streams}}/css/Streams/invite.css',
                className: 'Streams_invite_dialog',
                onActivate: function (dialog) {
                    if (data) {
                        dialog.addClass('Streams_suggestion_ready');
                    }

                    var $eContacts = $(".Streams_invite_contacts", dialog);

                    var _renderInviteList = function (contacts) {
                        Q.Template.render("Users/templates/contacts/display", {
                            contacts: contacts,
                            text: text
                        }, function (err, html) {
                            if (err) {
                                return;
                            }

                            $eContacts.html(html).activate();

                            $("button.Streams_invite_submit_contact", $eContacts).on(Q.Pointer.fastclick, function () {
                                var inviteParams;
                                for(var i in contacts) {
                                    inviteParams = {
                                        stream: stream,
                                        data: data
                                    };

                                    if (contacts[i].prefix === "user") {
                                        inviteParams.userId = contacts[i]["id"];
                                    } else {
                                        inviteParams.identifier = contacts[i][contacts[i].prefix];
                                    }
                                    Q.handle(callback, Streams, [inviteParams]);
                                }
                                Q.Dialogs.pop(); // close the Dialog
                            });

                            $(".qp-communities-close", $eContacts).on(Q.Pointer.fastclick, function () {
                                var $this = $(this);
                                var id = $this.attr('data-id');
                                $this.closest("tr").remove();
                                delete contacts[id];

                                $eContacts.data("contacts", contacts);

                                if ($.isEmptyObject(contacts)) {
                                    $("button.Streams_invite_submit_contact", $eContacts).remove();
                                }
                            });
                        });
                    };

                    // invite user from registered users
                    var userChooserTool = Q.Tool.from($(".Streams_userChooser_tool", dialog), "Streams/userChooser");
                    if (userChooserTool) {
                        userChooserTool.state.resultsHeight = 180;
                        userChooserTool.stateChanged("resultsHeight");
                        userChooserTool.state.onChoose.set(function (userId, avatar) {
                            var contacts = $eContacts.data("contacts") || {};
                            contacts[userId] = {id: userId, name: avatar.displayName(), prefix: "user"}

                            _renderInviteList(contacts, $eContacts);

                            $eContacts.data("contacts", contacts);

                            /*Q.handle(callback, Streams, [{
                                userId: userId,
                                stream: stream,
                                data: data
                            }]);
                            Q.Dialogs.pop(); // close the Dialog*/

                        }, "Streams_invite_dialog");
                    }

                    // handle "choose from contacts" button
                    $('.Streams_invite_choose_contact', dialog).on(Q.Pointer.fastclick, function () {
                        var $this = $(this);
                        $eContacts.empty();

                        var params = {
                            filter: "Users",
                            data: $eContacts.data("contacts") || null,
                            identifierTypes: options.identifierTypes
                        };

                        $this.addClass('loading');

                        Users.Dialogs.contacts(params, function (contacts) {
                            $this.removeClass('loading');
                            $eContacts.data("contacts", contacts);

                            if (!contacts || Object.keys(contacts).length <= 0) {
                                return;
                            }

                            _renderInviteList(contacts, $eContacts);

                            $this.text(text.chooseAgainFromContacts).addClass("");
                        })
                    });

                    if (!Q.info.isTouchscreen) {
                        $('.Streams_invite_submit input[type=text]').focus();
                        setTimeout(function () {
                            $('.Streams_invite_submit input[type=text]').plugin('Q/clickfocus');
                        }, 300);
                    }
                    // handle go button
                    $('.Streams_invite_submit').on('submit', function (e) {
                        Q.handle(callback, Streams, [{
                            identifier: $("input[type=text]", this).val(),
                            stream: stream,
                            data: data,
                            appUrl: options.appUrl
                        }]);
                        Q.Dialogs.pop(); // close the Dialog
                        e.preventDefault();
                    });

                    // handle social buttons
                    $('.Streams_invite_social_buttons button, .Streams_invite_QR', dialog)
                        .on(Q.Pointer.fastclick, function () {
                            var sendBy = $(this).data('sendby');
                            var result = {
                                token: suggestion,
                                identifier: null,
                                sendBy: sendBy,
                                stream: stream,
                                data: data,
                                appUrl: options.appUrl
                            };
                            Q.Dialogs.pop(); // close the Dialog
                            Q.handle(callback, Streams, [result]);
                        });

                    // handle social buttons
                    $('.Streams_invite_social_buttons button, .Streams_invite_copyLink', dialog)
                        .on(Q.Pointer.fastclick, function () {
                            var sendBy = $(this).data('sendby');
                            var result = {
                                token: suggestion,
                                identifier: null,
                                sendBy: sendBy,
                                stream: stream,
                                data: data,
                                appUrl: options.appUrl
                            };
                            Q.Dialogs.pop(); // close the Dialog
                            Q.handle(callback, Streams, [result]);
                        });
                }
            });
        } else {
            Q.Dialogs.push({
                title: options.title || text.title2,
                template: {
                    name: 'Streams/templates/invite/modernDialog',
                    fields: {
                        isContactsPicker: isContactsPicker,
                        userChooser: options.userChooser,
                        showGrantRolesButton: options.showGrantRolesButton,
                        communityRolesNum:options.addLabel ? options.addLabel.length : false,
                        myLabelsNum:options.addMyLabel ? options.addMyLabel.length : false,
                        text: text,
                        photo: (options.photo)? text.photo: options.photo,
                        to: text.to.interpolate({"Stream Title": stream.fields.title}),
                        copyLink: copyLinkText,
                        QR: text.QR.interpolate({ClickOrTap: Q.text.Q.words.ClickOrTap}),
                        QRIcon: Q.url("{{Users}}/img/qr-code-scan.svg"),
                        contactBookIcon: Q.url("{{Users}}/img/contact-book.svg"),
                        shareIcon: Q.url("{{Users}}/img/share.svg")
                    }
                },
                stylesheet: '{{Streams}}/css/Streams/modern_invite.css',
                className: 'Streams_invite_dialog',
                onActivate: function (dialog) {
                    if (data) {
                        dialog.addClass('Streams_suggestion_ready');
                    }

                    // handle "choose from contacts" button
                    $('.Streams_invite_select_contacts', dialog).on(Q.Pointer.fastclick, function () {
                        var isContactsPicker = Q.info.isCordova || ('contacts' in navigator && 'ContactsManager' in window);
                        if(isContactsPicker) {
                            Q.Dialogs.push({
                                className: '',
                                title: text.chooseFromContacts,
                                content: '<div class="Streams_invite_contacts_picker">'
                                + '<div class="Streams_invite_contacts"></div>'
                                + '<div class="Streams_invite_contacts_content"></div>'
                                + '</div>',
                                onActivate: function (dialog) {
                                    var $dialogContent = $(".Streams_invite_contacts_content", dialog);
                                    var $eContacts = $(".Streams_invite_contacts", dialog);
                                    var $selectContactBtn = $('<button></button>').text(text.chooseFromContacts);
                                    $selectContactBtn.addClass('Q_button');
                                    $selectContactBtn.addClass('Streams_invite_choose_contact');
                                    $dialogContent.append($selectContactBtn);

                                    function selectContacts() {
                                        $eContacts.empty();

                                        var params = {
                                            prefix: "Users",
                                            data: $eContacts.data("contacts") || null,
                                            identifierTypes: Streams.invite.options.identifierTypes
                                        };

                                        $selectContactBtn.addClass('loading');

                                        Users.Dialogs.contacts(params, function (contacts) {
                                            $selectContactBtn.removeClass('loading');
                                            $eContacts.data("contacts", contacts);

                                            if (!contacts || Object.keys(contacts).length <= 0) {
                                                return;
                                            }

                                            _renderInviteList(contacts, $eContacts);

                                            $selectContactBtn.text(text.chooseAgainFromContacts).addClass("");
                                        })
                                    }

                                    selectContacts();
                                    $selectContactBtn.on(Q.Pointer.fastclick, selectContacts);
                                }
                            });
                        } else {
                            Q.Dialogs.push({
                                className: '',
                                title: text.inviteViaEmailOrSms,
                                content: '<div class="Streams_invite_contacts_picker">'
                                + '<div class="Streams_invite_caption"></div>'
                                + '<div class="Streams_invite_contacts"></div>'
                                + '<div class="Q_tool Streams_userChooser_tool">'
                                + 	'<input name="query" value="" type="text" class="text Streams_userChooser_input" autocomplete="off">'
                                + '</div>'
                                + '<div class="Streams_invite_caption2"></div>'
                                + '<div class="Streams_invite_contacts_content"></div>'
                                + '</div>',

                                onActivate: function (dialog) {
                                    var $dialogContent = $(".Streams_invite_contacts_content", dialog);
                                    var $eContacts = $(".Streams_invite_contacts", dialog);
                                    var $userChoserInput = $(".Streams_userChooser_input", dialog);
                                    $userChoserInput.attr({placeholder: text.userChooserPlaceholder});
                                    var $inviteCaption = $(".Streams_invite_caption", dialog);
                                    $inviteCaption.text(text.chooseFromRegistered);
                                    var $inviteCaption2 = $(".Streams_invite_caption2", dialog);
                                    $inviteCaption2.text(text.orInvite);
                                    var $selectContactForm = $('<form></form>');
                                    $selectContactForm.addClass('Q_buttons');
                                    $selectContactForm.addClass('Streams_invite_submit');
                                    var $selectContactInput = $('<input>').attr({
                                        type: 'text',
                                        placeholder: text.placeholder
                                    });
                                    var $selectContactBtn = $('<button></button>').text(text.go);
                                    $selectContactBtn.addClass('Q_button');
                                    $selectContactForm.append($selectContactInput);
                                    $selectContactForm.append($selectContactBtn);
                                    $dialogContent.append($selectContactForm);

                                    if (!Q.info.isTouchscreen) {
                                        $selectContactInput.focus();
                                        setTimeout(function () {
                                            $selectContactInput.plugin('Q/clickfocus');
                                        }, 300);
                                    }
                                    // handle go button
                                    $selectContactForm.on('submit', function (e) {
                                        Q.handle(callback, Streams, [{
                                            identifier: $("input[type=text]", this).val(),
                                            stream: stream,
                                            data: data
                                        }]);
                                        Q.Dialogs.pop();
                                        Q.Dialogs.pop();
                                        e.preventDefault();
                                    });


                                    // invite user from registered users
                                    $(".Streams_userChooser_tool", dialog).tool("Streams/userChooser", {}).activate(function () {
                                        var userChooserTool = this;
                                        userChooserTool.state.resultsHeight = 180;
                                        userChooserTool.stateChanged("resultsHeight");
                                        userChooserTool.state.onChoose.set(function (userId, avatar) {
                                            var contacts = $eContacts.data("contacts") || {};
                                            contacts[userId] = {id: userId, name: avatar.displayName(), prefix: "user"}

                                            _renderInviteList(contacts, $eContacts);

                                            $eContacts.data("contacts", contacts);
                                        }, "Streams_invite_dialog");
                                    });

                                }
                            });
                        }
                    });

                    $('.Streams_invite_scan_qr', dialog).on(Q.Pointer.fastclick, function () {
                        var sendBy = $(this).data('sendby');
                        var result = {
                            token: suggestion,
                            identifier: null,
                            sendBy: sendBy,
                            stream: stream,
                            data: data,
                            appUrl: options.appUrl
                        };
                        Q.Dialogs.pop(); // close the Dialog
                        Q.handle(callback, Streams, [result]);
                    });

                    $('.Streams_invite_share_link', dialog)
                        .on(Q.Pointer.fastclick, function () {
                            var sendBy = $(this).data('sendby');
                            var result = {
                                token: suggestion,
                                identifier: null,
                                sendBy: sendBy,
                                stream: stream,
                                data: data,
                                appUrl: options.appUrl
                            };
                            Q.Dialogs.pop(); // close the Dialog
                            Q.handle(callback, Streams, [result]);
                        });

                    $('.Streams_invite_social_buttons button', dialog).on(Q.Pointer.fastclick, function () {
                        var sendBy = $(this).data('sendby');
                        var result = {
                            token: suggestion,
                            identifier: null,
                            sendBy: sendBy,
                            stream: stream,
                            data: data,
                            appUrl: options.appUrl
                        };
                        Q.Dialogs.pop(); // close the Dialog
                        Q.handle(callback, Streams, [result]);
                    });

                    $('.Streams_invite_button_add-roles', dialog)
                        .on(Q.Pointer.fastclick, function () {
                            Q.Dialogs.pop();
                            options.showGrantRolesDialog();
                        });

                    $('.Streams_invite_button_add_rels', dialog)
                        .on(Q.Pointer.fastclick, function () {
                            Q.Dialogs.pop();
                            options.showGiveRelationshipLabelDialog();
                        });

                }
            });
        }

    });

    Q.Text.get("Streams/content", function (err, result) {
        text = Q.getObject(["invite", "dialog"], result);
        pipe.fill('text')();
    });

    Streams.get(publisherId, streamName, function(err) {
        var fem = Q.firstErrorMessage(err);
        if (fem) {
            throw new Q.Exception("Streams.invite: " + fem);
        }
        stream = this;
        pipe.fill('stream')();
    });

};

})();
Q.exports(function() {
    
    /**
     * Invite other users to a stream. Must be logged in first.
     * @static
     * @method invite
     * @param {String} publisherId The user id of the publisher of the stream
     * @param {String} streamName The name of the stream you are inviting to
     * @param {Object} [options] More options that are passed to the API, which can include:
     * @param {String|Array} [options.identifier] An email address or mobile number to invite. Might not belong to an existing user yet. Can also be an array of identifiers.
     * @param {boolean} [options.token=false] Pass true here to generate an invite
     *	which you can then send to anyone however you like. When they show up with the token
     *	and presents it via "Q.Streams.token" querystring parameter, the Streams plugin
     *	will accept this invite either right away, or as soon as they log in.
     *	They will then be added to the list of Streams_Invited for this stream, thus
     *	keeping track of who accepted whose invite.
     * @param {String|Function} [options.appUrl] Can be used to override the URL to which the invited user will be redirected and receive "Q.Streams.token" in the querystring.
     * @param {String} [options.userId] user id or an array of user ids to invite
     * @param {string} [options.platform] platform for which xids are passed
     * @param {String} [options.xid] xid or arary of xids to invite
     * @param {String} [options.label] label or an array of labels to invite, or tab-delimited string
     * @param {String|Array|true} [options.addLabel] label or an array of labels for adding publisher's contacts, or pass true to show a selector dialog
     * @param {String|Array|true} [options.addMyLabel] label or an array of labels for adding logged-in user's contacts, or pass true to show a selector dialog
     * @param {String} [options.readLevel] the read level to grant those who are invited
     * @param {String} [options.writeLevel] the write level to grant those who are invited
     * @param {String} [options.adminLevel] the admin level to grant those who are invited
     * @param {String} [options.callback] Also can be used to provide callbacks, which are called before the followup.
     * @param {Boolean} [options.followup="future"] Whether to set up a followup email or sms for the user to send. Set to true to always send followup, or false to never send it. Set to "future" to send followups only to users who haven't registered yet.
     * @param {String} [options.uri] If you need to hit a custom "Module/action" endpoint
     * @param {String} [options.title] Custom dialog title.
     * @param {String} [options.userChooser=false] If true allow to invite registered users with Streams/userChooser tool.
     * @param {Function} callback Called with (err, result) .
     *   In this way you can obtain the invite token, email addresses, etc.
     *   See Streams::invite on the PHP side for the possible return values.
     *   This is called before the followup flow.
     * @return {Q.Request} represents the request that was made if an identifier was provided
     */
    return function Streams_invite(publisherId, streamName, options, callback) {
        // TODO: start integrating this with Cordova methods to invite people
        // from your contacts or facebook flow.
        // Follow up with the Groups app, maybe! :)
        var loggedUserId = Q.Users.loggedInUserId();
        if (!loggedUserId) {
            Q.handle(callback, null, ["Streams.invite: not logged in"]);
            return false; // not logged in
        }
        var baseUrl = Q.baseUrl({
            publisherId: publisherId,
            streamName: streamName
        });
        var o = Q.extend({
            uri: 'Streams/invite'
        }, Q.Streams.invite.options, options);
        var fields = Q.take(o, [
            'appUrl', 'identifier', 
            'platform', 'xid', 
            'label', 'addLabel', 'addMyLabel',
            'readLevel', 'writeLevel', 'adminLevel'
        ]);
        fields.publisherId = publisherId;
        fields.streamName = streamName;
        if (typeof fields.appUrl === 'function') {
            fields.appUrl = fields.appUrl();
        }
        function _request() {
            return Q.req(o.uri, ['data'], function (err, response) {
                var msg = Q.firstErrorMessage(err, response && response.errors);
                if (msg) {
                    alert(msg);
                    var args = [err, response];
                    return Q.Streams.onError.handle.call(this, msg, args);
                }
                Q.Streams.Participant.get.cache.removeEach([publisherId, streamName]);
                Q.Streams.get.cache.removeEach([publisherId, streamName]);
                var rsd = response.slots.data;
                Q.handle(o && o.callback, null, [err, rsd]);
                Q.handle(callback, null, [err, rsd]);
                var emailAddresses = [];
                var mobileNumbers = [];
                var fb_xids = [];
                // The invite mechanism allows clients to know whether
                // certain identifiers are verified with the site or not,
                // but will not let clients know which userIds they correspond to.
                Q.each(rsd.statuses, function (i, s) {
                    // The invite mechanism no longer leak participant userIds to clients,
                    // so you can't match external identifiers to userIds
                    // That is why rsd.alreadyParticipating is no longer returned:
                    // if (rsd.alreadyParticipating.indexOf(userId) >= 0) {
                    // 	return;
                    // }
                    var shouldFollowup = (o.followup === true)
                        || (o.followup !== false && s === 'future');
                    if (!shouldFollowup) {
                        return; // next one
                    }
                    var identifier = rsd.identifiers[i];
                    var identifierType = rsd.identifierTypes[i];
                    switch (identifierType) {
                        case 'userId': break;
                        case 'email': emailAddresses.push(identifier); break;
                        case 'mobile': mobileNumbers.push(identifier); break;
                        case 'facebook':
                            if (shouldFollowup === true) {
                                fb_xids.push(identifier[i]);
                            }
                            break;
                        case 'label':
                        case 'newFutureUsers':
                        default:
                            break;
                    }
                });
                Q.Streams.followup({
                    mobile: {
                        numbers: mobileNumbers
                    },
                    email: {
                        addresses: emailAddresses
                    },
                    facebook: {
                        xids: fb_xids
                    }
                }, callback);
            }, { method: 'post', fields: fields, baseUrl: baseUrl });
        }
        function _sendBy(r, text) {
            // Send a request to create the actual invite
            Q.req(o.uri, ['data', 'stream'], function (err, response) {
                var msg = Q.firstErrorMessage(err, response && response.errors);
                if (msg) {
                    alert(msg);
                    var args = [err, response];
                    return Q.Streams.onError.handle.call(this, msg, args);
                }
                Q.handle(o && o.callback, null, [err, rsd]);
                Q.handle(callback, null, [err, rsd]);
            }, {
                method: 'post',
                asJSON: true,
                fields: fields,
                baseUrl: baseUrl
            });
            var rsd = r.data;
            var rss = r.stream;
            var t;
            switch (r.sendBy) {
                case "email":
                    t = Q.extend({
                        url: rsd.url,
                        title: rss.fields.title
                    }, 10, text);
                    Q.Template.render("Streams/templates/invite/email", t,
                        function (err, body) {
                            if (err) return;
                            var subject = Q.getObject(['invite', 'email', 'subject'], text);
                            var url = Q.Links.email(subject, body);
                            window.location = url;
                        });
                    break;
                case "text":
                    var content = Q.getObject(['invite', 'sms', 'content'], text)
                        .interpolate({
                            url: rsd.url,
                            title: rss.fields.title
                        });
                    t = Q.extend({
                        content: content,
                        url: rsd.url,
                        title: streamName
                    }, 10, text);
                    Q.Template.render("Streams/templates/invite/mobile", t,function (err, text) {
                        if (err) {
                            return;
                        }
    
                        window.location = Q.Links.sms(text);
                    });
                    break;
                case "facebook":
                    window.open("https://www.facebook.com/sharer/sharer.php?u=" + rsd.url, "_blank");
                    break;
                case "whatsapp":
                    var content = Q.getObject(['invite', 'sms', 'content'], text)
                        .interpolate({
                            url: rsd.url,
                            title: rss.fields.title
                        });
                    window.open(Q.Links.whatsApp(null, content), "_blank");
                    break;
                case "twitter":
                    window.open("http://www.twitter.com/share?url=" + rsd.url, "_blank");
                    break;
                case "telegram":
                    var content = Q.getObject(['invite', 'sms', 'content'], text)
                        .interpolate({
                            url: rsd.url,
                            title: rss.fields.title
                        });
                    window.open(Q.Links.telegram(null, content, rsd.url), "_blank");
                    break;
                case "copyLink":
                    if (Q.getObject("share", navigator)) {
                        navigator.share({url: rsd.url});
                    } else {
                        Q.Clipboard.copy(rsd.url);
                        Q.Text.get("Streams/content", function (err, result) {
                            var text = result && result.invite;
                            if (text) {
                                var element = Q.alert(text.youCanNowPaste, {
                                    title: ''
                                });
                                setTimeout(function () {
                                    if (element === Q.Dialogs.element()) {
                                        Q.Dialogs.pop();
                                    }
                                }, Q.Streams.invite.options.youCanNowPasteDuration);
                            }
                        });
                    }
                    break;
                case "QR":
                    Q.Dialogs.push({
                        className: 'Streams_invite_QR',
                        title: Q.getObject(['invite', 'dialog', 'QRtitle'], text),
                        content: '<div class="Streams_invite_QR_content"></div>'
                            + '<div class="Q_buttons">'
                            //+ '<button class="Q_button Streams_invite_QR_scanned">' + text.invite.dialog.scannedQR.interpolate(Q.text.Q.words) + '</button>'
                            + '<button class="Q_button Streams_invite_QR_groupPhoto">' + text.invite.dialog.TakeGroupPhoto + '<i class="streams-icon-checkmark-outline"></i></button>'
                            + '</div>',
                        onActivate: function (dialog) {
                            // fill QR code
                            Q.addScript("{{Q}}/js/qrcode/qrcode.js", function(){
                                var $qrIcon = $(".Streams_invite_QR_content", dialog);
                                new QRCode($qrIcon[0], {
                                    text: rsd.url,
                                    width: 250,
                                    height: 250,
                                    colorDark : "#000000",
                                    colorLight : "#ffffff",
                                    correctLevel : QRCode.CorrectLevel.H
                                });
                                var _setPhoto = function (data) {
                                    data = data || {};
                                    var dialogClassName = "Dialog_invite_photo_camera";
                                    var title = Q.getObject(['invite', 'dialog', 'photo'], text);
                                    var invitedUserId = data.invitedUserId;
                                    if (invitedUserId && data.displayName) {
                                        title = Q.getObject(['invite', 'dialog', 'photoOf'], text)
                                            .interpolate({"name": data.displayName});
                                    }
                                    var subpath = loggedUserId.splitId() + '/invited/' + rsd.invite.token;
                                    if (invitedUserId) {
                                        subpath = invitedUserId.splitId() + '/icon/' + Math.floor(Date.now()/1000);
                                    }

                                    if (Q.Dialogs.dialogs.length) {
                                        var lastDialog = Q.Dialogs.dialogs[Q.Dialogs.dialogs.length-1];
                                        if (lastDialog.hasClas && lastDialog.hasClass(dialogClassName)) {
                                            Q.Dialogs.pop();
                                        }
                                    }

                                    Q.Dialogs.push({
                                        title: title,
                                        apply: true,
                                        className: dialogClassName,
                                        content:
                                            '<div class="Streams_invite_photo_dialog">' +
                                            '<p>'+ Q.getObject(['invite', 'dialog', 'photoInstruction'], text) +'</p>' +
                                            '<div class="Streams_invite_photo_camera">' +
                                            '<img src="' + Q.url('{{Streams}}/img/invitations/camera.svg') + '" class="Streams_invite_photo Streams_invite_photo_pulsate"></img>' +
                                            '</div>' +
                                            '</div>',
                                        onActivate: function (dialog) {
                                            // handle "photo" button
                                            var saveSizeName = {};
                                            Q.each(Q.Users.icon.sizes, function (k, v) {
                                                saveSizeName[k] = v;
                                            });
                                            $('.Streams_invite_photo', dialog).plugin('Q/imagepicker', {
                                                path: 'Q/uploads/Users',
                                                save: 'Users/icon',
                                                subpath: subpath,
                                                saveSizeName: saveSizeName,
                                                maxStretch: Q.Users.icon.maxStretch,
                                                onFinish: function () {
                                                    Q.Dialogs.close(dialog);
                                                }
                                            });

                                            if (invitedUserId) {
                                                Q.Streams.get(invitedUserId, "Streams/user/icon", function (err) {
                                                    if (err) {
                                                        return;
                                                    }

                                                    var userIconStream = this;
                                                    userIconStream.observe();
                                                    var eventKey = "invite_icon_changed_" + invitedUserId;
                                                    var event = userIconStream.onMessage("Streams/changed");
                                                    event.set(function (err, msg) {
                                                        Q.Dialogs.close(dialog);
                                                        userIconStream.neglect();
                                                        event.remove(eventKey);
                                                    }, eventKey);
                                                });
                                            }
                                        }
                                    });
                                };

                                var inviteAcceptKey = 'Streams_invite_QR_content';
                                var igpStreamName = "Streams/image/invite/" + rsd.invite.token;
                                var subpath = `invitations/${loggedUserId.splitId()}/${igpStreamName}`;
                                //$('.Q_button.Streams_invite_QR_scanned', dialog).plugin('Q/clickable').on(Q.Pointer.click, _setPhoto);
                                var $groupPhotoButton = $('.Q_button.Streams_invite_QR_groupPhoto', dialog);
                                $groupPhotoButton.plugin('Q/imagepicker', {
                                    saveSizeName: Q.Streams.invite.groupPhoto.sizes,
                                    maxStretch: Q.Streams.invite.groupPhoto.maxStretch,
                                    //showSize: state.icon || $img.width(),
                                    path: 'Q/uploads/Streams',
                                    subpath: subpath,
                                    save: "Streams/invite/groupPhoto",
                                    onSuccess: function (data, key, file) {
                                        $groupPhotoButton.attr("data-loaded", true);
                                        Q.req("Streams/invite", ["groupPhoto"], function () {

                                        }, {
                                            method: "put",
                                            fields: {
                                                publisherId: loggedUserId,
                                                streamName: igpStreamName,
                                                subpath: subpath,
                                                relate: {
                                                    publisherId: fields.publisherId,
                                                    streamName: fields.streamName
                                                }
                                            }
                                        });
                                    },
                                    onFinish: function () {
                                        // as we toke group photo no need to listen for accept to take individual photo
                                        Q.Users.Socket.onEvent('Streams/invite/accept').remove(inviteAcceptKey);
                                    }
                                });

                                // listen for Streams/invite/accept event to show imagepicker
                                Q.Users.Socket.onEvent('Streams/invite/accept')
                                    .set(function _Streams_invite_accept_handler (data) {
                                        console.log('Users.Socket.onEvent("Streams/invite/accept")');
                                        if (!Q.Users.isCustomIcon(data.icon, true)) {
                                            _setPhoto(data);
                                        }
                                    }, inviteAcceptKey);
                            });
                        }
                    });
                    break;
            }
            return true;
        }
        if (o.identifier || o.token || o.xids || o.userIds || o.label) {
            return _request();
        }
        Q.Text.get('Streams/content', function (err, text) {
            _getCanGrantRoles().then(function (response) {
                var canGrantRoles = Q.getObject('slots.canGrant', response);
                var canRevokeRoles = Q.getObject('slots.canRevoke', response);

                var addLabel = o.addLabel;
                if(!Q.isEmpty(canGrantRoles) && addLabel !== false) {
                    //show button if user has any grant permissions
                    if(fields.addLabel === true) {
                        fields.addLabel = [];
                    }
                    if (!Q.isArrayLike(fields.addLabel)) {
                        fields.addLabel = [fields.addLabel];
                    }
                    o.showGrantRolesButton = true;
                } else {
                    //do not show button if o.addLabel: false OR user has no grant permissions
                    o.showGrantRolesButton = false;
                    fields.addLabel = [];
                }

                var addMyLabel = o.addMyLabel;
                if (addMyLabel !== false) {
                    if(fields.addMyLabel === true) {
                        fields.addMyLabel = [];
                    }
                    if (!Q.isArrayLike(o.addMyLabel) && typeof o.addMyLabel != 'boolean') {
                        fields.addMyLabel = [o.addMyLabel];
                    }
                    o.showGrantRelationshipsButtonButton = true;
                } else {
                    o.showGrantRelationshipsButtonButton = false;
                    o.addMyLabel = [];
                }

                _showInviteDialog();

                // Commented out because now we check the server every time
                // var canGrantRoles = Q.getObject('Q.plugins.Users.Label.canGrant') || [];
                // var canRevokeRoles = Q.getObject('Q.plugins.Users.Label.canRevoke') || [];
                // var canHandleRoles = Array.from(new Set(canGrantRoles.concat(canRevokeRoles))); // get unique array from merged arrays
                // if (!canHandleRoles.length) {
                // 	_showInviteDialog();
                // }

                function _showGrantRolesDialog(callback) {
                    Q.Dialogs.push({
                        title: text.invite.roles.title,
                        content: Q.Tool.setUpElementHTML('div', 'Users/labels', {
                            userId: Q.Users.communityId,
                            filter: canGrantRoles
                        }),
                        className: 'Streams_invite_labels_dialog',
                        apply: true,
                        onClose: callback,
                        onActivate: function (dialog) {
                            var labelsTool = Q.Tool.from($(".Users_labels_tool", dialog), "Users/labels");
                            if (Q.typeOf(labelsTool) !== 'Q.Tool') {
                                return;
                            }

                            if(fields.addLabel && fields.addLabel.length != 0) {
                                labelsTool.state.onRefresh.add(function () {
                                    for(var i in fields.addLabel) {
                                        var lavelEl = labelsTool.element.querySelector('[data-label="' + fields.addLabel[i] + '"]');
                                        if(lavelEl) {
                                            lavelEl.classList.add('Q_selected');
                                        }
                                    }
                                });
                            }
                            labelsTool.state.onClick.set(function (tool, label, title, wasSelected) {
                                if (!wasSelected && !canGrantRoles.includes(label)) {
                                    Q.alert(text.invite.roles.NotAuthorizedToGrantRole.alert, {
                                        title: text.invite.roles.NotAuthorizedToGrantRole.title
                                    })
                                    return false;
                                }
                                if (wasSelected && !canRevokeRoles.includes(label)) {
                                    Q.alert(text.invite.roles.NotAuthorizedToRemovetRole.alert, {
                                        title: text.invite.roles.NotAuthorizedToRemoveRole.title
                                    })
                                    return false;
                                }

                                if (wasSelected) {
                                    var index = fields.addLabel.indexOf(label);
                                    if (index > -1) {
                                        fields.addLabel.splice(index, 1)
                                    }
                                } else {
                                    fields.addLabel.push(label);
                                }
                            }, labelsTool);
                        }
                    });
                }

                function _showGiveRelationshipLabelDialog(callback) {
                    Q.Dialogs.push({
                        title: text.invite.labels.title,
                        content: Q.Tool.setUpElementHTML('div', 'Users/labels', {
                            userId: Q.Users.loggedInUserId(),
                            filter: 'Users/',
                            canAdd: true
                        }),
                        className: 'Streams_invite_labels_dialog',
                        apply: true,
                        onClose: callback,
                        onActivate: function (dialog) {
                            var labelsTool = Q.Tool.from($(".Users_labels_tool", dialog), "Users/labels");
                            if (Q.typeOf(labelsTool) !== 'Q.Tool') {
                                return;
                            }

                            if(o.addMyLabel && o.addMyLabel.length != 0) {
                                labelsTool.state.onRefresh.add(function () {
                                    for(var i in o.addMyLabel) {
                                        var lavelEl = labelsTool.element.querySelector('[data-label="' + o.addMyLabel[i] + '"]');
                                        if(lavelEl) {
                                            lavelEl.classList.add('Q_selected');
                                        }
                                    }
                                });
                            }

                            labelsTool.state.onClick.set(function (tool, label, title, wasSelected) {
                                if (wasSelected) {
                                    var index = o.addMyLabel.indexOf(label);
                                    if (index > -1) {
                                        o.addMyLabel.splice(index, 1)
                                    }
                                } else {
                                    o.addMyLabel.push(label);
                                }
                            }, labelsTool);
                        }
                    });
                }

                function _showInviteDialog() {
                    var dialogOptions = Q.take(o, [
                        'title', 'identifierTypes', 'userChooser',
                        'appUrl', 'showGrantRolesButton', 'showGrantRelationshipsButton',
                        'addLabel', 'addMyLabel'
                    ]);
                    dialogOptions.showGrantRolesDialog = function() {
                        _showGrantRolesDialog(_showInviteDialog);
                    };
                    dialogOptions.showGiveRelationshipLabelDialog = function() {
                        _showGiveRelationshipLabelDialog(_showInviteDialog);
                    };
                    if (o.templateName) {
                        fields.templateName = o.templateName;
                    }
                    Q.Streams.Dialogs.invite(publisherId, streamName, function (r) {
                        if (Q.isEmpty(r)) {
                            return;
                        }
                        for (var f in r) {
                            fields[f] = r[f];
                        }
                        if (r.sendBy) {
                            _sendBy(r, text);
                        } else {
                            _request();
                        }
                    }, dialogOptions);
                }

            });

            function _getCanGrantRoles() {
                return new Promise(function (resolve, reject) {
                    Q.req('Users/roles', ['canGrant', 'canRevoke', 'canSee'], function (err, response) {
                        resolve(response);
                    }, {
                        communityId: Q.Users.communityId
                    });
                });
            }

        });
        return null;
    };
})


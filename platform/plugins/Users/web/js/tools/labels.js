(function (Q, $, window, undefined) {
	
var Users = Q.Users;

/**
 * Users Labels
 * @module Users-labels
 * @main
 */

/**
 * Tool for viewing, and possibly managing, a user's contact labels
 * @class Users labels
 * @constructor
 *  @param {Object} [options] options for the tool(both of them are fixes on backend side)
 *   @param {String} [options.userId=Q.Users.loggedInUserId()] You can set the user id whose labels are being edited, instead of the logged-in user
 *   @param {String|Array} [options.filter="Users/"] Pass any prefix here, to filter labels by this prefix
 *   	Alternatively pass an array of label names here, to filter by.
 *   @param {Array} [exclude] - array of labels needed to exclude from result
 *   @param {String} [options.contactUserId] Pass a user id here to var the tool add/remove contacts with the various labels, between userId and contactUserId
 *   @param {Boolean|String} [options.canAdd=false] Pass true here to allow the user to add a new label, or a string to override the title of the command.
 *   @param {String|Object} [options.all] To show "all labels" option, whose value is "*", pass here its title or object with "title" and "icon" properties.
 *   @param {String} options.abiPath="Users/templates/R1/Community/contract". 
 *      ABI for community contract
 *   @param {String} options.addToPhonebook true if run from mobile 
 *   @param {String} options.icon showsize for icons
 *   @param {String} options.editable if true then available interface to add WEB3 roles
 *      keep in mind that to add web3 need to:
 *      - `editeable` option turn to true
 *      - `userId` option should have a valid xid. and should be a valid commnity address
 *      - `loggedin user` shoudl be an owner of community described above
 *      - and finally have a some coins to do transaction
 *   @param {Array} options.imagepicker
 *   @param {Boolean} options.cacheBust
 *   @param {String} options.cacheBustOnUpdate=false
 *   @param {Q.Event} [options.onRefresh] occurs after the tool is refreshed
 *   @param {Q.Event} [options.onClick] occurs when the user clicks or taps a label. 
 *      Is passed (element, label, title, wasSelected). Handlers may return 
 *      false to cancel the default behavior of toggling the label.
 *      Also keep in mind that if editable = true, tool disabled this handler and do `onClickHandler` instead
 */
Q.Tool.define("Users/labels", function Users_labels_tool(options) {
    var tool = this
    var state = tool.state;
    if (state.userId == null) {
            state.userId = Users.loggedInUserId();
    }
    if (state.canAdd === true) {
    //state.canAdd = tool.text.addLabel2;
    state.canAdd = Users.isCommunityId(state.userId) ?
        tool.text.newRole
        :
        tool.text.addLabel
        ;    

    }

    if (Users.isCommunityId(state.userId)) {
            tool.element.addClass('Users_labels_communityRoles');
            state.addToPhonebook = false;
    }
    
    if (state.contactUserId){
        Q.Streams.get(state.contactUserId, 'Streams/user/xid/web3', function(err, stream){
            if (!Q.isEmpty(stream.fields.content)) {
                state.contactUserId_xid = stream.fields.content;
            }
            tool.refresh();    
        });
    } else {
        tool.refresh();
//        
//        if (state.editable) {
//            tool.refresh();
//        } else {
//            
//        }
        
    }

    $(tool.element).on(Q.Pointer.fastclick, '.Users_labels_label:not(.Q_selected_permanently)', function () {
        var $this = $(this);
        var label = $this.attr('data-label');
        var wasSelected = $this.hasClass('Q_selected');
        var title = $this.text();
        if (state.editable) {
            tool.onClickHandler($this);
        } else {

            if (false === Q.handle(state.onClick, tool, [this, label, title, wasSelected])) {
                return;
            }
            tool.element.addClass('Q_loading');        
            tool.onSelect(wasSelected, label, function(err, ret, develop_error){
                tool.element.removeClass('Q_loading');        
                if (develop_error) {
                    console.warn(develop_error);
                    return;
                }
                if (err) {
                    Q.alert(err);
                    return;
                }
                if (wasSelected) {
                    $this.removeClass('Q_selected');    
                } else {
                    $this.addClass('Q_selected');    
                }
            });

        }
    });
},

{
    userId: null,
    filter: ['Users/', '<<< web3/' + Q.Assets.Web3.defaultChain.chainId + '/'],
    exclude: null,
    excludeStartsWith: null,
    contactUserId: null,
    contactUserId_xid: null,
    canAdd: false,
    labels: false, // filled on refresh
    //web3: {
    abiPath: "Users/templates/R1/Community/contract",
    canAddWeb3: null, // filled on backend side
    //},
    addToPhonebook: Q.info.isMobile,
    icon: 200,
    editable: false,
    imagepicker: {},
    cacheBust: null,
    cacheBustOnUpdate: 1000,
    onRefresh: new Q.Event(),
    onClick: new Q.Event()
    
},

{
    /**
     * 
     * @param {String} title label's title
     * @param {String} label label. can be null, then back-side genererate like Users/+normalize($title)
     */
    _addWeb2: function(title, label, closeHandler) {
        var tool = this;
		var state = this.state;

        Users.Label.add(state.userId, title, label, function (err, obj) {
            if (err) return;
            Q.handle(closeHandler, null, []);
            
            tool.refresh(function(){
                var $newlyAdded = $('.Users_labels_label', tool.element).filter(function(){ 
                    return $(this).data('label') === obj.label
                });
                if ($newlyAdded.length != 0) {
                    tool.onClickHandler($newlyAdded);
                }
            });
        });
    },
    _getCommunityAddress: function(chainId) {
        var tool = this;
        var state = tool.state;

        var status = false;
        var communityAddress = false;
        //Q.Users.web3.communityContracts[chainId]
        if (!Q.isEmpty(Q.Users.web3.communityContracts[chainId])) {
            status = true;
            communityAddress = Q.Users.web3.communityContracts[chainId];
        }
//        Q.each(state.canAddWeb3, function (i, item) {
//            
//            if (item["chainId"] == chainId && item["userId"] == state.userId) {
//                status = true;
//                communityAddress = item['communityAddress'];
//            }
//            //delete(labels[label]);
//        });
            
        return [status, communityAddress];
    },
    /**
     * if first argument is present and isntance of $  - it's editing
     * overwise - add new label
     * @return {undefined}
     */
    onClickHandler: function($item) {

        var isEdit = ($item instanceof $) ? true : false;

        var tool = this;
		var state = this.state;
        
        Q.Dialogs.push(
            Q.extend(
                isEdit 
                ?
                    {
                        title: tool.text.editLabel,
                        template: {
                            name: "Users/labels/manage/edit",
                            fields: {
                                editable: state.editable,
                                src: Users.iconUrl($item.data('icon'), 200),
                                label: $item.data('label'),
                                title: $item.data('title'),
                                description:$item.data('description')
                                
                            }
                        }
                    }
                :
                    {
                        title: state.canAdd ? state.canAdd : tool.text.newLabel,
                        template: {
                            name: "Users/labels/manage/add",
                            fields: {
                                editable: state.editable,
                                src: Q.url("{{Users}}/img/icons/default/200.png"),
                                canAddWeb3: state.canAddWeb3,
                            }
                        }
                    }
                ,
                {
					className: 'Q_alert',
                    fullscreen: false,
                    hidePrevious: true, 
                    onActivate: function ($dialog) {
                        var $img = $('img', $dialog);
                        var $addButton = $("button[name=addLabel]", $dialog);
                        var $updateButton = $("button[name=editLabel]", $dialog);
                        var $canManageButton = $("button[name=canManageLabel]", $dialog);
                        var $inputTitle = $("input[name=title]", $dialog);
                        var $rolePlace = $("select[name=rolePlace]", $dialog);

                        var subpath;

                        if ($addButton.length == 1) {
                            $addButton.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {

                                var title = $inputTitle.val();
                                if (!title) return;
                                var chainId = $rolePlace.val();
                                tool.element.addClass('Q_loading');
                                Q.Dialogs.pop();
                                if (chainId === undefined || chainId == 'native') {
                                    tool._addWeb2(title, null, function(){
                                        tool.element.removeClass('Q_loading');
                                    })

                                } else if (chainId.substring(0,2) === '0x') {
                                    
                                    var st, communityAddress;
                                    [st, communityAddress] = tool._getCommunityAddress(chainId);
                                    if (!st) return;
                                    
        
                                    Q.Communities.Web3.Roles.add(communityAddress, chainId, null, title, function (err, status) {

                                        if (err) {
                                            tool.element.removeClass('Q_loading');
                                            Q.alert(err);
                                            return;
                                        }

                                        Q.Communities.Web3.Roles.getIndex(communityAddress, chainId, null, title, function (err, index) {
                                            var web3Label = Q.Communities.Web3.Roles.labelPattern(chainId, index);
                                            tool._addWeb2(title, web3Label, function(){
                                                tool.element.removeClass('Q_loading');
                                            })
                                        });

                                    });
                                } else {
                                    console.warn('unknown format `chainId`');
                                }

                            });
                        }
                        if ($updateButton.length == 1) {
                            $updateButton.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
                                tool.element.addClass('Q_loading');

                                //Users.Label.update(.....)
                                //{{baseUrl}}/Q/uploads/Users/subpath

                                var label = $item.data('label');
                                var title = $inputTitle.val();
                                var iconUrlBeforeEdit = $item.data('icon');
                                var iconUrl;
                                var description = '';

                                if (subpath) {
                                    iconUrl = '{{baseUrl}}/Q/uploads/Users/'+subpath;
                                } else {
                                    iconUrl = iconUrlBeforeEdit;
                                }
                                
                                // web2 update callback
                                function _labelUpdate(label, title, iconUrl, description) {
                                    Users.Label.update(state.userId, label, title, iconUrl, description, function (err, obj) {
                                        if (err) {
                                            tool.element.removeClass('Q_loading');
                                            Q.alert(err);
                                            return;
                                        }

                                        Q.Dialogs.pop();
                                        tool.element.removeClass('Q_loading');
                                        tool.refresh();
                                    });
                                }
                                
                                // web3 processing
                                if (Q.Users.Label.isExternal(label)) {
                                    if (iconUrlBeforeEdit == 'labels/default') {
                                        // then try to set URI json
                                        var chainId, roleIndex;
                                        [chainId, roleIndex] = Q.Communities.Web3.Roles.parsePattern(label);
                                        // http://itr.localhost/URI/ITR/0x13881/19.json
                                        var uri = Q.url("{{baseUrl}}/URI/"+state.userId+"/"+chainId+"/"+roleIndex+".json");
                                        
                                        var parsedData = tool._getCommunityAddress(chainId);
                                        var st = parsedData[0]
                                        var communityAddress = parsedData[1];

                                        if (!st) return;
                                        Q.Communities.Web3.Roles.setRoleURI(communityAddress, chainId, null, roleIndex, uri, function (err, status) {
                                            if (err) {
                                                tool.element.removeClass('Q_loading');
                                                Q.alert(err);
                                                return;
                                            }
                                            _labelUpdate(label, title, iconUrl, description);
                                        });
                                    } else {
                                        _labelUpdate(label, title, iconUrl, description);
                                    }
                                } else {
                                    // else web2 processsing
                                    _labelUpdate(label, title, iconUrl, description);
                                }
                            });

                        }
                        
                        if ($canManageButton.length == 1) {
                            $canManageButton.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
                                tool.element.addClass('Q_working');
                                
                                var label = $canManageButton.data('label')
                                
                                Q.Dialogs.push({
                                    title: tool.text.canManageDialogTitle,
                                    apply: true,
                                    content: Q.Tool.setUpElementHTML('div', 'Users/labels', {
                                        userId: state.userId,
                                        contactUserId: false,
                                        editable: false,
                                         // web3 for web3, web2 for web2
                                        excludeStartsWith: Q.Users.Label.isExternal(label) ? [] : ['<<< web3/'],
                                        filter: Q.Users.Label.isExternal(label) ? {"replace": ['<<< web3/']} : {}
                                        //----
                                    }),
                                    onClose: function ($dialog2) {
                                        tool.element.addClass('Q_working');
                                        //$dialog2.addClass('Q_working');
                                        var iChainId, 
                                            iRoleIndex,
                                            iLabel,
                                            iParsedData;

                                        Promise.allSettled([
                                            tool.getWeb2Permissions(label, function (err, response){}),
//                                            new Promise(function(resolve, reject) {
//                                                resolve(tool.permissions.selectedLabels);
//                                            }),
                                            tool.getWeb3Permissions(label, function (err, response){})

                                        ]).then(function(resp){

                                            var itWasWeb3 = [], 
                                                itBecameWeb3 = [], 
                                                tograntWeb3 = [], 
                                                torevokeWeb3 = [],
                                                itWasWeb2 = [],
                                                itBecameWeb2 = [],
                                                tograntWeb2 = [], 
                                                torevokeWeb2 = [];
                                            

                                            if (resp[0]['status'] == "fulfilled") {
                                                // labels that not include locked
                                                itWasWeb2 = (resp[0].value.labels).filter(n => !(resp[0].value.locked).includes(n));
                                                // also exclude external labels(but they shouldn't exist here )
                                                itWasWeb2 = (itWasWeb2).filter(n => !(n.startsWith('<<< web3')));
                                                
                                                // minus filter
                                                //itBecameWeb2 = [];
                                            }

                                            if (resp[1]['status'] == "fulfilled" && resp[1].value.status) {
                                                itWasWeb3 = Object.keys(resp[1].value.ret);
                                                //itBecameWeb3 = [];
                                            }

                                            var selected = $dialog2.find('li.Q_selected'); 
                                            for(var i of selected) {
                                                iLabel = $(i).data('label');
                                                if (Q.Users.Label.isExternal(iLabel)) {
                                                    iParsedData = Q.Communities.Web3.Roles.parsePattern(iLabel);
                                                    iChainId = iParsedData[0];
                                                    iRoleIndex = iParsedData[1];
                                                    
                                                    if (!itBecameWeb3.includes(iRoleIndex)) { 
                                                        itBecameWeb3.push(iRoleIndex);
                                                    }
                                                } else {
                                                    if (!itBecameWeb2.includes(iLabel)) { 
                                                        itBecameWeb2.push(iLabel);
                                                    }
                                                }
                                            }

                                            if (resp[1].value.status) {
                                                tograntWeb3 = itBecameWeb3.filter( function( el ) {return !itWasWeb3.includes(el);});
                                                torevokeWeb3 = itWasWeb3.filter( function( el ) {return !itBecameWeb3.includes(el);});
                                            }

                                            tograntWeb2 = itBecameWeb2.filter( function( el ) {return !itWasWeb2.includes(el);});
                                            torevokeWeb2 = itWasWeb2.filter( function( el ) {return !itBecameWeb2.includes(el);});

                                            Promise.allSettled([
                                                Q.Users.managePermissions(state.userId, label, tograntWeb2, torevokeWeb2, function (err, result) {}),
                                                (
                                                (Q.isEmpty(tograntWeb3) && Q.isEmpty(torevokeWeb3))
                                                ?
                                                new Promise(function(resolve, reject) {resolve(true)})
                                                :
                                                Q.Communities.Web3.Roles.manage(
                                                    {
                                                        communityAddress: resp[1].value.opt['communityAddress'], 
                                                        chainId: resp[1].value.opt['chainId'], 
                                                        roleIndex: resp[1].value.opt['roleIndex']
                                                    }, 
                                                    tograntWeb3, 
                                                    torevokeWeb3, 
                                                    function(err, ret){}
                                                )
                                                )
                                            ]).then(function(resp){
                                                tool.element.removeClass('Q_working');

                                            }).catch(function(err){
                                                tool.element.removeClass('Q_working');
                                            });
                                        }).catch(function(err){
                                            tool.element.removeClass('Q_working');
                                        });;

                                    },
                                    onActivate: function ($dialog2) {
                                        var labelsTool = Q.Tool.from($(".Users_labels_tool", $dialog2), "Users/labels");
                                        if (Q.typeOf(labelsTool) !== 'Q.Tool') {
                                            return;
                                        }
                                        
                                        labelsTool.state.onRefresh.add(function (/*tool, label, title, wasSelected*/) {
                                            //tool.element.addClass('Q_working');

                                            //var label = $canManageButton.data('label');

                                            Promise.allSettled([
                                                tool.getWeb2Permissions(label, function (err, response){}),
                                                tool.getWeb3Permissions(label, function (err, response){})
                                            ]).then(function(resp){
                                                
                                                if (resp[0]['status'] == "fulfilled") {
                                                    for (var i of resp[0].value.labels) {
                                                        $dialog2.find("[data-label='"+i+"']").addClass('Q_selected');
                                                    }

                                                    for (var i of resp[0].value.locked) {
                                                        $dialog2.find("[data-label='"+i+"']").removeClass('Q_selected').addClass('Q_selected_permanently');
                                                    }
                                                }
                                                if (resp[1]['status'] == "fulfilled") {

                                                    var ret = resp[1].value.ret;
                                                    var opt = resp[1].value.opt;

                                                    if (resp[1].value.status) {
                                                        for (var i in ret) {
                                                            if (ret[i] >=2) {
                                                                $dialog2.find("[data-label='"+Q.Communities.Web3.Roles.labelPattern(opt['chainId'], i)+"']").addClass('Q_selected');
                                                            }
                                                        }
                                                    }

                                                }
                                            })

                                        }, labelsTool);
                                        

                                    }
                                })
                                
                                
                            });
                        }

                        var saveSizeName = {};
                        Q.each(Users.icon.sizes, function (k, v) {
                            saveSizeName[k] = v;
                        });
                        var options = Q.extend({
                            saveSizeName: saveSizeName,
                            maxStretch: Users.icon.maxStretch,
                            showSize: state.icon || $img.width(),
                            path: 'Q/uploads/Users',
                            preprocess: function (callback) {
                                subpath = state.userId.splitId()+'/labels/'+ Math.floor(Date.now()/1000);
                                callback({
                                    subpath: subpath,
                                    save: "Users/labels"
                                });
                            },
                            cacheBust: state.cacheBust
                        }, state.imagepicker);
                        $img.plugin('Q/imagepicker', options, function () {

                        });

                    }
                }
            )
        );
        
    },
    getWeb2Permissions: Q.promisify(function _getWeb2Permissions(label, callback) {
        var tool = this;
        var state = tool.state;
        
        return Q.Users.getPermissions(state.userId, label, function (err, result) {
            Q.handle(callback, null, [err, result]);
        });

    }),
    getWeb3Permissions: Q.promisify(function _getWeb3Permissions(label, callback) {

        if (!Users.Label.isExternal(label)) {
            console.warn('label is not external');
            return Q.handle(callback, null, [null, {status: false, ret:{}, opt:{}}]);
        }
        
//Q.handle(callback, null, [false, {'foo': 'bar'}]);
//return true;
        var tool = this,
            st, 
            communityAddress,
            configChains = Q.Users.apps.web3,
            ret = {};
        var parsed = Q.Communities.Web3.Roles.parsePattern(label);
        var chainId = parsed[0];
        var roleIndex = parsed[1];
        
        for (var chain in configChains){

            if (!configChains[chain]['appId'] || configChains[chain]['appIdForAuth'] == 'all') {
                continue;
            }
            
            var parsedData = tool._getCommunityAddress(configChains[chain]['appId']);
            var st = parsedData[0];
            var communityAddress = parsedData[1];
            if (!st || chainId != configChains[chain]['appId']) {
                continue;
            }

            ///-------------------
            Q.req("Users/web3", ["allLabels"], function (err, response) {

                var iRolesIndex;

                iRolesIndex = response.slots.allLabels.array_1.findIndex(function(x){return x == roleIndex}); //correct way
                if (iRolesIndex == -1) {
                    // happens when clicked for old external label after changing contract
                    Q.handle(callback, null, ['role index not found']);
                    
                }

                for(var iGrant of response.slots.allLabels.array_4[iRolesIndex]) {
                    if (Q.isEmpty(ret[iGrant])) { 
                        ret[iGrant] = 0;
                    }
                    ret[iGrant] +=1;
                }
                for(var iRevoke of response.slots.allLabels.array_5[iRolesIndex]) {
                    if (Q.isEmpty(ret[iRevoke])) { 
                        ret[iRevoke] = 0;
                    }
                    ret[iRevoke] +=1;
                }

                Q.handle(callback, null, [err, {
                    status: true,
                    ret: ret,
                    opt: {
                        communityAddress: communityAddress, 
                        roleIndex: roleIndex, 
                        chainId: chainId
                    }
                }]);
                
            }, {
                method: "get",
                fields: {
                    communityAddress: communityAddress,
                    chainId: configChains[chain]['appId']
                }
            });
        }        
    }),
	/**
     * Handler happens when user clicking by label when editable option == false
     * @param {type} wasSelected was select or no before user click
     * @param {type} label label
     * @param {type} _callback Expects err, ret, develop_error
     */
    onSelect: function(wasSelected, label, _callback){
        var tool = this;
		var state = this.state;
        
        if (Q.isEmpty(state.contactUserId)) {
            return Q.handle(_callback, tool, [null, null, null]);
        }
        
        if (Q.Users.Label.isExternal(label)) {
            
            // web3
            if (Q.isEmpty(state.contactUserId_xid)) {
                return Q.handle(_callback, tool, [null, null, 'contactUserId_xid is empty']);
            }
            
            var web3validated = $(tool.element)
                                    .find('.Users_labels_label[data-label="'+label+'"]')
                                    .data('web3validated');
            if (Q.isEmpty(web3validated)) {
                return Q.handle(_callback, tool, [null, null, 'this web3 label was not find in that community']);
            }
            
            var chainId, roleIndex, st, communityAddress, parsedData;
            //<<< web3_0x123123/24
            //<<< web3_0x123/24
            
            parsedData = Q.Communities.Web3.Roles.parsePattern(label);
            chainId = parsedData[0];
            roleIndex = parsedData[1];
            if (Q.isEmpty(chainId) || Q.isEmpty(roleIndex)) {
                return Q.handle(_callback, tool, [null, null, 'chainId and/or roleIndex are empty']);
            }
            
            parsedData = tool._getCommunityAddress(chainId);
            st = parsedData[0];
            communityAddress = parsedData[1];
            if (!st || !communityAddress) {
                return Q.handle(_callback, tool, [null, null, 'communityAddress is empty']);
            }

            // users (not communities) have only web3_all xid, their private key can sign on any chain
            if (wasSelected) {
                Q.Communities.Web3.Roles.revokeRole(communityAddress, chainId, null, state.contactUserId_xid, roleIndex, _callback);
            } else {
                Q.Communities.Web3.Roles.grantRole(communityAddress, chainId, null, state.contactUserId_xid, roleIndex, _callback);
            }
        } else {
            // web2
            if (wasSelected) {
                Users.Contact.remove(state.userId, label, state.contactUserId, _callback);
            } else {
                Users.Contact.add(state.userId, label, state.contactUserId, _callback);
            }
        }
        
    },
    /**
    * Refresh the tool's contents
    * @method refresh
    */
    refresh: function (callback) {

        var tool = this;
        var state = this.state;
        tool.element.addClass('Q_loading');
        var all = state.all;
        if (typeof all === 'string') {
            all = {
                title: all,
                icon: Q.url("{{Users}}/img/icons/labels/all/200.png")
            };
        }
        var selectedLabels = [];
        tool.$('li.Q_selected').each(function () {
            selectedLabels.push($(this).attr('data-label'));
        });

        Q.Users.getLabels(state.userId, state.filter, function (err, labels) {

            // exclude labels if state.exclude not empty
            Q.each(state.exclude, function (i, label) {
                delete(labels[label]);
            });
            
            var labelsAsArray = Object.entries(labels);
            Q.each(state.excludeStartsWith, function (i, pattern) {
                labelsAsArray = labelsAsArray.filter( function( el ) {
                    return !el[0].startsWith(pattern);
                });
            });
            labels = Object.fromEntries(labelsAsArray);

            tool.state.labels = labels;

            Q.Template.render("Users/labels", {
                labels: labels,
                all: all,
                canAdd: Q.Users.loggedInUser && state.canAdd,
                canAddIcon: Q.url('{{Q}}/img/actions/add.png'),
                phoneBookIcon: Q.url('{{Q}}/img/actions/add_to_phonebook.png'),
                addToPhonebook: state.contactUserId && state.addToPhonebook && tool.text.addToPhonebook
            }, function (err, html) {
                tool.element.removeClass('Q_loading');
                Q.replace(tool.element, html);

                tool.$('li').each(function () {
                    if (selectedLabels.indexOf($(this).attr('data-label')) >= 0) {
                        $(this).addClass('Q_selected');
                    }
                });

                Q.handle(state.onRefresh, tool, []);
                
                if (typeof callback !== 'undefined') {
                    Q.handle(callback, tool, []);    
                }

                if (state.userId && state.contactUserId) {
                    // selecting web2 labels
                    $(tool.element)
                    .addClass('Users_labels_active')
                    .find('.Users_labels_label')
                    .addClass('Q_selectable');
                    Users.getContacts(state.userId, null, state.contactUserId,
                    function (err, contacts) {
                        Q.each(contacts, function () {
                            var label = this.label;
                            $(tool.element)
                            .find('.Users_labels_label')
                            .each(function () {
                                var $this = $(this);
                                if ($this.attr('data-label') === label) {
                                    $this.addClass('Q_selected');
                                    return false;
                                }
                            });
                        });
                    });

                    // checks and selecting web3 labels
                    if (!Q.isEmpty(state.contactUserId_xid)) {

                        var configChains = Q.Users.apps.web3;
                        var communityAddress, st, parsedData;
                        for(var chain in configChains){

                            if (!configChains[chain]['appId'] || configChains[chain]['appIdForAuth'] == 'all') {
                                continue;
                            }

                            parsedData = tool._getCommunityAddress(configChains[chain]['appId']);

                            st = parsedData[0];
                            communityAddress = parsedData[1];
                                
                            if (!st) {
                                continue;
                            }
                            ///-------------------
                            tool.element.addClass('Q_loading');
                            Q.req("Users/web3", ["labels"], function (err, response) {
                                tool.element.removeClass('Q_loading');
                                var msg = Q.firstErrorMessage(err, response && response.errors);
                                if (msg) {
                                    return console.error(msg);
                                }

                                // mark all web3 roles as validated(means exists on contract)
                                var allWeb3RoleIds = response.slots.labels.allRoles.array_1;
                                
                                for(var index in allWeb3RoleIds){
                                    $(tool.element)
                                    .find('.Users_labels_label[data-label="'+Q.Communities.Web3.Roles.labelPattern(configChains[chain]['appId'], allWeb3RoleIds[index])+'"]')
                                    .data('web3validated', true);
                                }   
                                // mark as selected if user belong to roles
                                var allWeb3RoleIdsByUser = response.slots.labels.userRoles;
                                for(var i in allWeb3RoleIdsByUser) {
                                    $(tool.element)
                                    .find('.Users_labels_label[data-label="'+Q.Communities.Web3.Roles.labelPattern(configChains[chain]['appId'], allWeb3RoleIdsByUser[i])+'"]')
                                    .addClass('Q_selected');
                                }
                                
                            }, {
                                method: "get",
                                fields: {
                                    communityAddress: communityAddress,
                                    chainId: configChains[chain]['appId'],
                                    walletAddress: state.contactUserId_xid
                                }
                            })
                            /*
                            // left for way that need to check on frontend side
                            Q.Communities.Web3.Roles.getAll(communityAddress, configChains[chain]['appId'], null, function (err, response) {

                                if (err) {return;}
                                var allWeb3RoleIds = response.indexes;

                                // additional valdiation preventing adding nonexistion role
                                // happens when label exists in base but contract produce from the scratch.
                                // ideal way delete labels when reinstall contract(community)
                                for(var index in allWeb3RoleIds){
                                    $(tool.element)
                                    .find('.Users_labels_label[data-label="'+Q.Communities.Web3.Roles.labelPattern(configChains[chain]['appId'], allWeb3RoleIds[index])+'"]')
                                    .data('web3validated', true);
                                }        
                            });
                            Q.Communities.Web3.Roles.byUser(communityAddress, configChains[chain]['appId'], null, state.contactUserId_xid, function (err, ret) {
                                for(var i in ret) {
                                    $(tool.element)
                                    .find('.Users_labels_label[data-label="'+Q.Communities.Web3.Roles.labelPattern(configChains[chain]['appId'], ret[i])+'"]')
                                    .addClass('Q_selected');
                                }

                            });
                            */
                        };

                    }
                }

                if (state.canAdd) {

                    $(tool.element)
                        .find('.Users_labels_add')
                        .off(Q.Pointer.fastclick)
                        .on(Q.Pointer.fastclick, function () {
                            tool.onClickHandler();
                        });
                }

                var $addToPhonebook = tool.$('.Users_labels_add_phonebook');
                if (state.addToPhonebook) {
                    $addToPhonebook
                        .on(Q.Pointer.fastclick, function () {
                            location.href = Q.url("{{baseUrl}}/Users/" + state.contactUserId + ".vcf");
                        });
                }

                var elems = $('.Users_labels_title');
                var length = elems.length;
                var shownHint;
                $('.Users_labels_title', $(tool.element)).each(function(i){
                    if (i == length -1){
                        return;
                    }
                    if(i == 0) {
                        shownHint = Q.Users.hint('Communities/profile/addContact', $addToPhonebook, {
                            dontStopBeforeShown: true,
                            show: { delay: 500 }
                        });
                        return;
                    }
                    if (!shownHint) {
                        return;
                    }
                    var labelName = i;
                    var label = this.dataset.label;
                    if(label) {
                        var labelNameArr = label.split('/');
                        if(labelNameArr.length > 1) labelName = labelNameArr[1];
                    }
                    Q.Visual.hint('Users/labels/' + labelName, this, {
                        hotspot: {x: i % 2 ? 0 : 0.3, y: 0},
                        dontStopBeforeShown: true,
                        dontRemove: true,
                        show: {delay: 1000 + (100 * i)},
                        hide: {after: 1000},
                        styles: {
                            opacity: 1 - (i / length / 2)
                        }
                    })
                })
            });
        });
    }
});

Q.Template.set('Users/labels', `
<ul>
{{#if addToPhonebook}}
    <li class="Users_labels_action Users_labels_add_phonebook">
      <img class="Users_labels_icon" src="{{phoneBookIcon}}">
      <div class="Users_labels_title">{{addToPhonebook}}</div>
    </li>
{{/if}}
{{#if all}}
    <li class="Users_labels_label" data-label="*">
      <img class="Users_labels_icon" src="{{all.icon}}" alt="all">
      <div class="Users_labels_title">{{all.title}}</div>
    </li>
{{/if}}
{{#each labels}}
    <li class="Users_labels_label" data-label="{{this.label}}" data-icon="{{this.icon}}" data-title="{{this.title}}" data-description="{{this.description}}">
      <img class="Users_labels_icon" src="{{call "iconUrl" 80}}" alt="label icon">
      <div class="Users_labels_title">{{this.title}}</div>
    </li>
{{/each}}
{{#if canAdd}}
    <li class="Users_labels_action Users_labels_add">
      <img class="Users_labels_icon" src="{{canAddIcon}}">
      <div class="Users_labels_title">{{canAdd}}</div>
    </li>
{{/if}}
</ul>
`,
{text: ["Users/content", "Users/labels"]}
);


Q.Template.set('Users/labels/manage/add', `
<div class="Q_messagebox Q_big_prompt">
    <div class="form-group">
        <input name="title" type="text" placeholder="{{titlePlaceholder}}" class="form-control">
    </div>
    {{#if editable}}
    <div class="form-group">
        <select name="rolePlace" class="form-control">
            <option value="native">{{selectOptionTitle_web2}}</option>
            {{#if canAddWeb3}}
            {{#each canAddWeb3}}
            <option 
                value="{{this.chainId}}" 
                {{#if this.isOwner}}{{else}}disabled{{/if}}
                class="{{#if this.isOwner}}{{else}}Q_disabled{{/if}}"
            >
            {{this.name}}
            </option>
            {{/each}}
            {{/if}}
        </select>
    </div>
    {{/if}}
    <button name="addLabel" class="Q_button">{{addBtn}}</button>
</div>
`,
{text: ["Users/content", "Users/labels"]}
);

Q.Template.set('Users/labels/manage/edit', `
<div class="Users_labels_editdialog Q_messagebox Q_big_prompt">
    <div class="Users_labels_form_group">
        <img src={{src}}>
    </div>
    <div class="form-group">
        <div class="Users_labels_manage_description">{{description}}</div>
    </div>
    <div class="form-group">
        <input name="title" type="text" value="{{title}}" placeholder="{{titlePlaceholder}}" class="form-control">
    </div>
    <button name="editLabel" class="Q_button">{{editBtn}}</button>
    <div class="form-group">
        <button name="canManageLabel" data-label="{{label}}" class="Q_button">{{canManageBtn}}</button>
    </div>
</div>
`,
{text: ["Users/content", "Users/labels"]}
);

})(Q, Q.$, window);

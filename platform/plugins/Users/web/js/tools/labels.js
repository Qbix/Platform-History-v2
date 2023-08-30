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
 *   @param {String} options.chainId chainId chain id in which tool try to create(and view) new web3 roles
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
		state.canAdd = Q.text.Users.labels.addLabel;
	}
    
	if (Users.isCommunityId(state.userId)) {
		tool.element.addClass('Users_labels_communityRoles');
		state.addToPhonebook = false;
	}
    
	tool.refresh();

	var _callback = function(err, res){
		if (err) {
			return Q.alert(err);
		}
	};

	$(tool.element).on(Q.Pointer.fastclick, '.Users_labels_label', function () {

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
            if (wasSelected) {
                $this.removeClass('Q_selected');
                if (state.contactUserId) {
                    Users.Contact.remove(state.userId, label, state.contactUserId, _callback);
                }
            } else {
                $this.addClass('Q_selected');
                if (state.contactUserId) {
                    Users.Contact.add(state.userId, label, state.contactUserId, _callback);
                }
            }
        
        }
	});
},

{
	userId: null,
	filter: ['Users/'],
	exclude: null,
	contactUserId: null,
	canAdd: false,
    //web3: {
    chainId: null,
    abiPath: "Users/templates/R1/Community/contract",
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
                                src: Users.iconUrl($item.data('icon'), 200),
                                title: $item.data('title'),
                                description:$item.data('description')
                            }
                        }
                    }
                :
                    {
                        title: tool.text.newLabel,
                        template: {
                            name: "Users/labels/manage/add",
                            fields: {
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
                        var $inputTitle = $("input[name=title]", $dialog);
                        var $rolePlace = $("select[name=rolePlace]", $dialog);

                        var subpath;

                        if ($addButton.length == 1) {
                            $addButton.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {

                                var title = $inputTitle.val();
                                if (!title) return;
                                var valRolePlace = $rolePlace.val();
                                tool.element.addClass('Q_loading');
                                Q.Dialogs.pop();
                                if (valRolePlace == 'native') {
                                    tool._addWeb2(title, null, function(){
                                        tool.element.removeClass('Q_loading');
                                    })

                                } else if (valRolePlace == 'web3') {
                                    Q.Communities.Web3.Roles.add(state.communityAddress, state.chainId, null, title, function (err, status) {

                                        if (err) {
                                            tool.element.removeClass('Q_loading');
                                            Q.alert(err);
                                            return;
                                        }

                                        Q.Communities.Web3.Roles.getIndex(state.communityAddress, state.chainId, null, title, function (err, index) {
                                            var web3Label = Q.Communities.Web3.Roles.labelPattern(state.chainId, index);
                                            tool._addWeb2(title, web3Label, function(){
                                                tool.element.removeClass('Q_loading');
                                            })
                                        });

                                    });

                                } else {
                                    console.warn('nothing todo');
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

                                // web3 processing
                                if (Q.Communities.Web3.Roles.isLabelMatch(label)) {
                                    if (iconUrlBeforeEdit == 'labels/default') {
                                        // then try to set URI json 

                                        var roleIndex = Q.Communities.Web3.Roles.getRoleIdByPattern(label);
                                        // http://itr.localhost/URI/ITR/0x13881/19.json
                                        var uri = Q.url("{{baseUrl}}/URI/"+state.userId+"/"+state.chainId+"/"+roleIndex+".json");
                                        Q.Communities.Web3.Roles.setRoleURI(state.communityAddress, state.chainId, null, roleIndex, uri, function (err, status) {

                                            if (err) {
                                                tool.element.removeClass('Q_loading');
                                                Q.alert(err);
                                                return;
                                            }

                                            Users.Label.update(state.userId, label, title, iconUrl, description, function (err, obj) {
                                                Q.Dialogs.pop();
                                                tool.element.removeClass('Q_loading');
                                                tool.refresh();
                                            });

                                        });

                                    } else {

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
                                }
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
                                subpath = state.userId.splitId()+'/icon/'+Math.floor(Date.now()/1000);
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
        
        // uncomments if need to synch
//        Q.Communities.Web3.Roles.getAll(state.communityAddress, state.chainId, null, function (err, roles) {
//            console.log("roles");
//            console.log(roles);
//        });
		Q.Users.getLabels(state.userId, state.filter, function (err, labels) {

			// exclude labels if state.exclude not empty
			Q.each(state.exclude, function (i, label) {
				delete(labels[label]);
			})

			Q.Template.render("Users/labels", {
				labels: labels,
				all: all,
				canAdd: Q.Users.loggedInUser && state.canAdd,
				canAddIcon: Q.url('{{Q}}/img/actions/add.png'),
				phoneBookIcon: Q.url('{{Q}}/img/actions/add_to_phonebook.png'),
                addToPhonebook: state.contactUserId && state.addToPhonebook && Q.text.Users.labels.addToPhonebook
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
    <div class="form-group">
        <select name="rolePlace" class="form-control">
            <option value="native">{{selectOptionTitle_web2}}</option>
            {{#if canAddWeb3}}
            <option value="web3">{{selectOptionTitle_web3}}</option>
            {{/if}}
        </select>
    </div>
    <button name="addLabel" class="Q_button">{{addBtn}}</button>
</div>
`,
{text: ["Users/content", "Users/labels"]}
);

Q.Template.set('Users/labels/manage/edit', `
<div class="Q_messagebox Q_big_prompt">
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
</div>
`,
{text: ["Users/content", "Users/labels"]}
);

})(Q, Q.$, window);

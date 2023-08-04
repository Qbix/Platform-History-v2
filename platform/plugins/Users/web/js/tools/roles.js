(function (Q, $, window, undefined) {
	
var Users = Q.Users;

/**
 * Users Roles
 * @module Users-roles
 * @main
 */

/**
 * Tool for viewing, and possibly managing, a community's roles
 * @class Users roles
 * @constructor
 * @param {Object} [options] options for the tool
 * @param {String} [options.userId=Q.Users.loggedInUserId()]
 * @param {String} [options.chainId]
 * @param {String} [options.communityAddress]
 * @param {Boolean} [options.canAddWeb2] able to add Web2 role.
 * @param {Boolean} [options.canAddWeb3] able to add Web3 role. just pre-check option. if user can add role, tx will reject and inform in a error msg
 * @param {String} [options.abiPath='Users/templates/R1/Community/contract'] abi path to CommunityContract
 * @param {Boolean} [options.updateCache] caching
 */
Q.Tool.define("Users/roles", function Users_labels_tool(options) {
	var tool = this
	var state = tool.state;
	if (state.userId == null) {
		state.userId = Users.loggedInUserId();
	}
    
    if (Q.isEmpty(state.chainId)) {
        console.warn("`chainId` are incorrect");
        return;
    }
    if (Q.isEmpty(state.communityAddress)) {
        console.warn("`communityAddress` are incorrect");
        return;
    }
    
    tool.refresh();
},

{
	userId: null,
    chainId: null,
    communityAddress: null,
    canAddWeb2: null, 
    canAddWeb3: null,
    abiPath: "Users/templates/R1/Community/contract",
    updateCache: null,
	onRefresh: new Q.Event(),
	onClick: new Q.Event()
},

{
    loading: function(state) {
        var tool = this;
        state 
        ?
        tool.element.addClass('Q_loading')
        :
        tool.element.removeClass('Q_loading')
        ;
    },
	/**
	 * Refresh the tool's contents
	 * @method refresh
	 */
	refresh: function () {
		var tool = this;
		var state = this.state;
		tool.loading(true);

        Q.Communities.Web3.Roles.getAll(state.communityAddress, state.chainId, null, function (err, roles) {
			
			Q.Template.render("Users/Roles", {
                addIcon: Q.url('{{Q}}/img/actions/add.png'),
				roles: roles,
                canAddWeb2: state.canAddWeb2,
                canAddWeb3: state.canAddWeb3
                
			}, function (err, html) {
				tool.loading(false);
				Q.replace(tool.element, html);
                
                $('.Users_roles_addweb3').on(Q.Pointer.fastclick, function () {
                    tool.loading(true);
					Q.prompt(Q.text.Communities.roles.prompt, function (title) {
						if (!title) return;
						Q.Communities.Web3.Roles.add(state.communityAddress, state.chainId, null, title, function (err, status) {
                            tool.loading(false);
                            if (err) {
                                Q.Notices.add({
                                    content: err,
                                    timeout: 5
                                });
                            } else {
                                tool.refresh();
                            }
						});
					}, { 
						title: Q.text.Communities.roles.title,//state.canAdd, 
						hidePrevious: true,
						maxLength: 63
					});
				});
                
            });
            
        });
    }
});

Q.Template.set('Users/roles', 
`
<ul>
{{#each roles}}
    <li class="Users_roles_role" data-roleid="{{this.roleId}}">
        {{#if this.uri}}
        <img class="Users_roles_icon" src="{{this.uri}}" alt="label icon">
        {{/if}}
        <div class="Users_roles_title">{{this.name}}</div>
    </li>
{{/each}}
{{#if canAddWeb2}}
    <li class="Users_roles_action Users_roles_addweb2">
        <img class="Users_roles_icon" src="{{addIcon}}">
        <div class="Users_roles_title">{{btns.web2Role}}</div>
    </li>
{{/if}}
{{#if canAddWeb3}}
    <li class="Users_roles_action Users_roles_addweb3">
        <img class="Users_roles_icon" src="{{addIcon}}">
        <div class="Users_roles_title">{{btns.web3Role}}</div>
    </li>
{{/if}}
</ul>
`,
{text: ["Users/roles"]}
);

})(Q, Q.$, window);
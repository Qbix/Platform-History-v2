(function (window, Q, $, undefined) {
	/**
	* Adding user for group in FundContract.
	* @constructor
	* @param {Object} options Override various options for this tool
	* @param {String} [options.abiPath] optional(see default value) ABI path for FundContract contract
	* @param {String} [options.chainId] chainId
	* @param {String} [options.fund]. FundContract's address 
	*/
	Q.Tool.define("Assets/web3/coin/presale/manage", function (options) {
		var tool = this;
		var state = this.state;
		
		var loggedInUser = Q.Users.loggedInUser;
		if (!loggedInUser) {
			return console.warn("user not logged in");
		}

		tool.loggedInUserXid = Q.Users.Web3.getLoggedInUserXid();
	
		if (Q.isEmpty(tool.loggedInUserXid)) {
			return console.warn("user not found");
		}
		
		if (Q.isEmpty(state.chainId)) {
			return console.warn("chainId required!");
		}
		
		if (Q.isEmpty(state.fund)) {
			return console.warn("fund required!");
		}
		
	   
		tool.text = {
			placeholders: {
				address:'User Address',
				groupName: 'Desired Group Name'
			},
            errs: {
                address:'Invalid user addresses',
				groupName: 'Invalid Group Name'
            },
            btns: {
                add: "Add"
            }
		};
				
		tool.refresh();
	},
	{ // default options here
		abiPath: "Assets/templates/R1/Fund/contract",
		chainId: null,
		fund: null
	},
	{ // methods go here
		refresh: function() {
			var tool = this;
			var state = tool.state;
			var $toolElement = $(this.element);
	
			Q.Template.render("Assets/web3/coin/presale/manage", {
				text: tool.text
			}, function (err, html) {
				Q.replace(tool.element, html);
                
                $("button[name=add]", $toolElement).off(Q.Pointer.click).on(Q.Pointer.click, function (e) {

                    $toolElement.addClass("Q_working");
                    
                    var addr = $('input[name=address]', $toolElement).val();
                    var groupName = $('input[name=groupName]', $toolElement).val();
                    
                    var validated = true;
                    
                    if (
                        !Q.Users.Web3.validate.notEmpty(addr) || 
                        !Q.Users.Web3.validate.address(addr)
                    ) {
                        Q.Notices.add({
                            content: tool.text.errs.address,
                            timeout: 5
                        });
                        validated = false;
                    }
                    
                    if (
                        !Q.Users.Web3.validate.notEmpty(groupName)
                    ) {
                        Q.Notices.add({
                            content: tool.text.errs.groupName,
                            timeout: 5
                        });
                        validated = false;
                    }

                    if (!validated) {
                        $toolElement.removeClass("Q_working");
                        return;
                    }
                    
                    var fundContract;
                    
                    Q.Users.Web3.getContract(
                        state.abiPath, 
                        {
                            contractAddress: state.fund,
                            chainId: state.chainId
                        }
                    ).then(function (fund) {
                        fundContract = fund;

                        return fund.setGroup([addr], groupName);
                    }).then(function (tx) {
                        return tx.wait();
                    }).then(function (receipt) {
                        if (receipt.status == 0) {
                            throw 'Smth unexpected when approve';
                        }

                    }).catch(function (err) {

                        Q.Notices.add({
                            content: Q.Users.Web3.parseMetamaskError(err, [fundContract]),
                            timeout: 5
                        });
                    }).finally(function(){
                        $toolElement.removeClass("Q_working");
                    });
                    
                });
			});			

		}
	});
	
	Q.Template.set("Assets/web3/coin/presale/manage",
	`
	<div class="form-inline">
		<div class="form-group">
			<input name="address" type="text" class="form-control" value="" placeholder="{{text.placeholders.address}}">
		</div>
		<div class="form-group">
			<input name="groupName" type="text" class="form-control" value="" placeholder="{{text.placeholders.groupName}}">
		</div>
		<button class="Q_button" name="add">{{text.btns.add}}</button>
	</div>
	`,
		{
			text: ["Assets/content"]
		}
	);

})(window, Q, jQuery);
		
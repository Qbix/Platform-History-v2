
(function (Q, $, window, undefined) {

if (Q.isEmpty(Q["isAddress"])) {
    Q.isAddress = function _Q_isAddress(address) {
        // https://github.com/ethereum/go-ethereum/blob/aa9fff3e68b1def0a9a22009c233150bf9ba481f/jsre/ethereum_js.go#L2295-L2329
        if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
            // check if it has the basic requirements of an address
            return false;
        } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
            // If it's all small caps or all all caps, return true
            return true;
        } else {
            // Otherwise check each case
//            address = address.replace('0x','');
//            var addressHash = Web3.utils.sha3(address.toLowerCase());
//            for (var i = 0; i < 40; i++ ) {
//                // the nth letter should be uppercase if the nth digit of casemap is 1
//                if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
//                    return false;
//                }
//            }
            return true;
        }
        
    }
}

var Users = Q.Users;



/**
 * Users Tools
 * @module Users-tools
 * @main
 */

/**
 * Tool that provide a way to produce new community instance
 * @param {Object} [options]
 *   @param {Object} options.chains list of chains in which toll will trying to create community
 *   @param {String} options.defaultChain default chain in hexstring (will be choosen in select field)
 *   @param {String} options.communityId communityId
 *   @param {Object} options.contractParams fields that describe community.
 *     @param {String} [options.contractParams.hook] hook address. can be zero-address. if value present, form will hide input field
 *     @param {String} [options.contractParams.name] community nft name. if value present, form will hide input field
 *     @param {String} [options.contractParams.symbol] community nft symbol. if value present, form will hide input field
 *     @param {String} [options.contractParams.contractURI] community contract URI. if value present, form will hide input field
 */
Q.Tool.define("Users/web3/community", function Users_web3_community_tool(options) {
	if (this.element.childNodes.length) {
		return;
	}
	var tool = this;
	var state = this.state;
	tool.refresh();
},

{
	chains: null,
	defaultChain: null,
	communityId: null,
	contractParams: {
	    hook: null,
	    name: null,
	    symbol: null,
	    contractURI: null,
	}
	
},

{
	/**
	 * Refresh the avatar's display
	 * @method refresh
	 */
	refresh: function () {
		var tool = this;
		var state = this.state;
		var $toolElement = $(tool.element);
		
		Q.Template.render('Users/web3/community/composer', {
		    chains: state.chains,
		    defaultChain: state.defaultChain,
		    contractParams: state.contractParams
		}, (err, html) => {
		    
		    Q.replace(tool.element, html);
		
		    $("button[name=produce]", $toolElement).off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function(){
				var $this = $(this);

				var $fields = {
					selectedChainId: $toolElement.find('select[name=chain]'),
					hook: $toolElement.find('input[name=hook]'),
					name: $toolElement.find('input[name=name]'),
					symbol: $toolElement.find('input[name=symbol]'),
					contractURI: $toolElement.find('input[name=contractURI]')
				}
				var userParams = {
					selectedChainId: $fields.selectedChainId.val(),
					hook: state.contractParams.hook || $fields.hook.val(),
					name: state.contractParams.name || $fields.name.val(),
					symbol: state.contractParams.symbol || $fields.symbol.val(),
					contractURI: state.contractParams.contractURI || $fields.contractURI.val()
				};

				var factoryAddress = Users.web3.contracts.Community.factory[userParams.selectedChainId];
				if (typeof factoryAddress === 'undefined') {
					throw new Q.Error('Cant find factoryAddress');
				}

				// simple validation.
				// if error send notice and add class Q_error to input field
				var validated = true;
				if (Q.isEmpty(userParams.hook) || !Q.isAddress(userParams.hook)) {
					validated = false;
//					Q.Notices.add({
//						content: '<b>Hook</b> invalid',
//						timeout: 5
//					});
					$("<span/>").addClass('error').html('<b>Hook</b> invalid').insertBefore($fields.hook);
					$fields.hook.addClass('Q_error').addClass('fieldErrorBox');
				} else {
					$fields.hook.removeClass('Q_error').removeClass('fieldErrorBox');
				}
				
				if (Q.isEmpty(userParams.name)) {
					validated = false;
//					Q.Notices.add({
//						content: '<b>Name</b> invalid',
//						timeout: 500
//					});
					$("<span/>").addClass('error').html('<b>Name</b> invalid').insertBefore($fields.name);
					$fields.name.addClass('Q_error').addClass('fieldErrorBox');
				} else {
					$fields.name.removeClass('Q_error').removeClass('fieldErrorBox');
				}
				
				if (Q.isEmpty(userParams.symbol)) {
					validated = false;
//					Q.Notices.add({
//						content: '<b>Symbol</b> invalid',
//						timeout: 500
//					});
					$("<span/>").addClass('error').html('<b>Symbol</b> invalid').insertBefore($fields.symbol);
					$fields.symbol.addClass('Q_error').addClass('fieldErrorBox');
				} else {
					$fields.symbol.removeClass('Q_error').removeClass('fieldErrorBox');
				}
				if (Q.isEmpty(userParams.contractURI)) {
					validated = false;
					
//					Q.Notices.add({
//						content: '<b>contractURI</b> invalid',
//						timeout: 5000
//					});
					$("<span/>").addClass('error').html('<b>contractURI</b> invalid').insertBefore($fields.contractURI);

					$fields.contractURI.addClass('Q_error').addClass('fieldErrorBox');
				} else {
					$fields.contractURI.removeClass('Q_error').removeClass('fieldErrorBox');
					$fields.contractURI.find('.error');
				}

				if (validated) {

					var txData = {};
					$this.addClass("Q_working");
					Q.Users.Web3.getContract(
						'Users/templates/R1/Community/factory',
						{
						chainId: userParams.selectedChainId,
						contractAddress: factoryAddress,
						readOnly: false
						}
					).then(function (communityFactory) {
						return communityFactory.produce(
							userParams.hook,
							userParams.name,
							userParams.symbol,
							userParams.contractURI
						);
					}).then(function (tx) {

						var produceParams = { ...userParams };
						delete produceParams['selectedChainId'];

						Q.req("Users/transaction", ["result"], function (err, response) {

							var fem = Q.firstErrorMessage(err, response);
							if (fem) {return console.warn(fem);}

						}, {
							method: "post",
							fields: {
								communityId: state.communityId,
								chainId: tx.chainId == 0 ? userParams.selectedChainId : tx.chainId,
								transactionId: tx.hash,
								fromAddress: tx.from,
								contract: factoryAddress,
								methodName: "produce",
								params: JSON.stringify(produceParams)
							}
						});
						txData["tx"] = tx;

						return tx.wait();
					}).then(function (receipt) {

						// additionally try to get instace address when transaction will be mine. 
						// it can be processing by cron job
						if (receipt.status == 1) {
							let event = receipt.events.find(event => event.event === 'InstanceCreated');
							let instance;
							[instance, /*instancesCount*/] = event.args;
							Q.req("Users/transaction", ["result"], function (err, response) {

								var fem = Q.firstErrorMessage(err, response);
								if (fem) {return console.warn(fem);}

							}, {
								method: "put",
								fields: {
									communityId: state.communityId,
									chainId: txData["tx"].chainId == 0 ? userParams.selectedChainId : txData["tx"].chainId,
									transactionId: txData["tx"].hash,
									status: "mined",
									contract: instance,
									result: JSON.stringify(receipt)
								}
							});

							Q.Dialogs.pop();
						} else {
							$this.removeClass("Q_working");
							Q.alert("Transaction failed");
						}


					}).catch(function (err) {
						var msg = Q.getObject("message", err);

						if (msg) {
						Q.alert(msg);
						} else {
						Q.alert("Something went wrong");
						}

						$this.removeClass("Q_working");
					});
				}

		    });
		});
		
	}
}

);

Q.Template.set('Users/web3/community/composer',
	`<div class="form">
		<div class="form-group row">
		    <label class="col-sm-3 col-form-label">Chain:</label>
		    <div class="col-sm-9">
        		<select class="form-control" name="chain">
        		{{#each chains}}
        		    <option value="{{this.chainId}}" {{#if this.default}}selected{{/if}}>{{this.name}}</option>
        		{{/each}}
        		</select>
		    </div>
		</div>
	{{#if contractParams.hook}}
	{{else}}
		<div class="form-group row">
		    <label class="col-sm-3 col-form-label">Hook</label>
		    <div class="col-sm-9">
			<input type="text" class="form-control" name="hook" placeholder="0x0000000000000000000000000000000000000000">
			<small>hook address of contract implemented ICommunityHook interface. Can be address(0)</small>
		    </div>
		</div>
	{{/if}}
	{{#if contractParams.name}}
	{{else}}
		<div class="form-group row">
		    <label class="col-sm-3 col-form-label">Name</label>
		    <div class="col-sm-9">
			<input type="text" class="form-control" name="name" placeholder="erc721 name">
			<small>erc721 name</small>
		    </div>
		</div>
	{{/if}}
	{{#if contractParams.symbol}}
	{{else}}
		<div class="form-group row">
		    <label class="col-sm-3 col-form-label">Symbol</label>
		    <div class="col-sm-9">
			<input type="text" class="form-control" name="symbol" placeholder="erc721 symbol">
			<small>erc721 symbol</small>
		    </div>
		</div>
	{{/if}}
	{{#if contractParams.contractURI}}
	{{else}}
		<div class="form-group row">
		    <label class="col-sm-3 col-form-label">contractURI</label>
		    <div class="col-sm-9">
			<input type="text" class="form-control" name="contractURI" placeholder="contractURI">
			<small>contract URI</small>
		    </div>
		</div>
	{{/if}}
		<div class="form-group row">
		    <div class="col-sm-10">
			<button type="submit" name="produce" class="Q_button">Produce</button>
		    </div>
		</div>
	</div>`
);

})(Q, Q.$, window);
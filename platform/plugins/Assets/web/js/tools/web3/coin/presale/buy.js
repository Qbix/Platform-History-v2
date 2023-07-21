(function (window, Q, $, undefined) {
	
	/**
	 * @module Assets
	 */
	var Assets = Q.Assets;
	/**
	 * @module Users
	 */
	var Users = Q.Users;
	
	Q.Tool.define("Assets/web3/coin/presale/buy", function (options) {
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
		
		tool.refresh();
	},
	{ // default options here
		abiPathF: "Assets/templates/R1/Fund/factory",
		abiPath: "Assets/templates/R1/Fund/contract",
		chainId: null,
	},
	{ // methods go here
		refresh: function() {
			var tool = this;
			var state = tool.state;
			
			Assets.Funds._getAll(
				state.chainId, 
				state.abiPathF, 
			).then(function(instances){
				var p = [];
				for (var i in instances) {
					p.push(Assets.Funds._getFundConfig(instances[i].value, state.chainId, ethers.utils.getAddress(tool.loggedInUserXid)));
				}
				return Promise.allSettled(p);
			}).then(function(configsData){
				var adjustFundConfig = [];
				
				for (var i in configsData) {
					adjustFundConfig.push(Assets.Funds.adjustFundConfig(configsData[i].value));
				}
				
				Q.Template.render("Assets/web3/coin/presale/buy", {data: adjustFundConfig}, function (err, html) {
					Q.replace(tool.element, html);
					
					$("button[name=buy]", tool.element).off(Q.Pointer.click).on(Q.Pointer.click, function (e) {
									
						var invokeObj = Q.invoke({
							title: tool.text.coin.staking.start.stake,
							template: {
								name: "Assets/web3/coin/presale/buyForm",
							},
							className: 'Assets_web3_coin_presale_buyform',

							trigger: tool.element,
							onActivate: function ($element) {
								if (!($element instanceof $)) {
									$element = $(arguments[2]);
								}
								
								$("button[name=execute]", $element).off(Q.Pointer.click).on(Q.Pointer.click, function (e) {		
									var fundSelected = $('select[name=funds]', tool.element).val();
									var sellingERC20 = $('select[name=funds] option[value='+fundSelected+']', tool.element).data('erc20token');
									var amount = $('input[name=amount]', $element).val();
									alert(amount);
									
									var validated = true;

									if (
										Q.Users.Web3.validate.notEmpty(fundSelected) && 
										Q.Users.Web3.validate.address(fundSelected)
									) {
									//
									} else {
										Q.Notices.add({
											content: "Fund invalid",
											timeout: 5
										});
										validated = false;
									}
									if (
										Q.Users.Web3.validate.notEmpty(sellingERC20) && 
										Q.Users.Web3.validate.address(sellingERC20)
									) {
									//
									} else {
										Q.Notices.add({
											content: "Token invalid",
											timeout: 5
										});
										validated = false;
									}

									if (
										Q.Users.Web3.validate.notEmpty(amount)
									) {
									//
									} else {
										Q.Notices.add({
											content: "Amount invalid",
											timeout: 5
										});
										validated = false;
									}
									
									if (validated) {
										
										var fundContract;
												
										Q.Users.Web3.getContract(
											state.abiPath, 
											{
												contractAddress: fundSelected,
												chainId: state.chainId
											}
										).then(function (fund) {
											fundContract = fund;

											return fund.buy({value: ethers.utils.parseUnits(amount)});
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

											invokeObj.close();
										});
										
									} else {
										invokeObj.close();
									}
								});
								
							}
							
						});
//						
//						
//						
//						Users.Web3.transaction(contractSelected, 0.00014, function (err, transactionRequest, transactionReceipt) {
//                            //Q.handle(state.onSubmitted, tool, [err, transactionRequest, transactionReceipt]);
//
//                            if (err) {
//                                Q.alert(Users.Web3.parseMetamaskError(err));
//                                
//                            }
//
//                          //  _transactionSuccess();
//                        }, {
//                            wait: 1,
//                            chainId: state.chainId
//                        });
//                        return;
						
					});
					
						
				});
			});
	

		}
	});
	
	Q.Template.set("Assets/web3/coin/presale/buy",
	`
	<div>
	<select name="funds">
	{{#each data}}
	<option value="{{this.fundContract}}" data-erc20token="{{this._sellingToken}}">{{this.erc20TokenInfo.name}}({{this.erc20TokenInfo.symbol}}) Price = ({{this.currentPrice}})</option>
	{{/each}}
	</select>
	
	<button class="Q_button" name="buy">{{coin.presale.buy.btns.buy}}</button>
	</div>
	`,
		{text: ["Assets/content"]}
	);
	
	Q.Template.set("Assets/web3/coin/presale/buyForm",
	`
	<div class="form">
	
		<div class="form-group">
			<label>{{coin.presale.buy.form.labels.amount}}</label>
			<input name="amount" type="text" class="form-control" value="">
			<small class="form-text text-muted">{{coin.presale.buy.form.small.amount}}</small>
		</div>
	
		<button class="Q_button" name="execute">{{coin.presale.buy.btns.execute}}</button>
	</div>
	`,
		{text: ["Assets/content"]}
	);
	
	Q.Template.set("Assets/web3/coin/presale/buy/interface",
	`
		You should need to execute two transactions:<br>

		<table class="table table-stripe">
			<tr>
			<td>Approve {{token_amount}} {{token_symbol}} to the FundContract {{fundname}}</td>
			<td class="steps step1">
				{{> "Assets/web3/coin/presale/buy/interface/asterisk"}}
			</td>
			</tr>
			<tr>
			<td>staking</td>
			<td class="steps step2">
				{{> "Assets/web3/coin/presale/buy/interface/asterisk"}}
			</td>
			</tr>
		</table>
	`,
		{
			text: ["Assets/content"],
			partials:[
				"Assets/web3/coin/presale/buy/interface/check",
				"Assets/web3/coin/presale/buy/interface/asterisk"
			]
		}
	);
	
	Q.Template.set("Assets/web3/coin/presale/buy/interface/check",
	`
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
			<path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
		</svg>
	`,
		{text: ["Assets/content"]}
	);
	
	Q.Template.set("Assets/web3/coin/presale/buy/interface/asterisk",
	`
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-asterisk" viewBox="0 0 16 16">
			<path d="M8 0a1 1 0 0 1 1 1v5.268l4.562-2.634a1 1 0 1 1 1 1.732L10 8l4.562 2.634a1 1 0 1 1-1 1.732L9 9.732V15a1 1 0 1 1-2 0V9.732l-4.562 2.634a1 1 0 1 1-1-1.732L6 8 1.438 5.366a1 1 0 0 1 1-1.732L7 6.268V1a1 1 0 0 1 1-1z"/>
		</svg>
	`,
		{text: ["Assets/content"]}
	);
})(window, Q, jQuery);
		
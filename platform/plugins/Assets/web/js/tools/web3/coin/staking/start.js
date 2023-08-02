
(function (window, Q, $, undefined) {

	/**
	 * @module Assets
	 */
	var Assets = Q.Assets;
	/**
	 * @module Users
	 */
	var Users = Q.Users;

//	/**
//	* creation and viewing stakings pools
//	* @class Assets Community Coin Admin
//	* @constructor
//	* @param {Object} options Override various options for this tool
//	* @param {String} [options.abiPath] ABI path for CommunityCoin contract
//	* @param {String} [options.abiPathPoolF] ABI path for CommunityStakingPoolFactory contract
//	* @param {String} [options.chainId] chainId
//	* @param {String} [options.communityCoinAddress] address od CommunityCoin contract
//	*/
	Q.Tool.define("Assets/web3/coin/staking/start", function (options) {
		
		var tool = this;
		var state = this.state;
		
		var defaultsValidate = {
            notEmpty: "<b>%key%</b> cannot be empty", 
            integer: "<b>%key%</b> must be an integer", 
            address: "<b>%key%</b> invalid"
        };
		
		var loggedInUser = Q.Users.loggedInUser;
		if (!loggedInUser) {
			return console.warn("user not logged in");
		}
		
		tool.loggedInUserXid = Q.Users.Web3.getLoggedInUserXid();
		
		if (Q.isEmpty(state.communityCoinAddress)) {
			return console.warn("communityCoinAddress required!");
		}
		
		if (Q.isEmpty(state.chainId)) {
			return console.warn("chainId required!");
		}

        var pipe = Q.pipe(["text"], function () {});
        Q.Text.get('Assets/web3/coin/staking/start', function(err, text) {
            tool.text = {
                ...tool.text,
                ...text
            }
            // "Assets/web3/coin/staking/start" have priority of "Assets/content"
            pipe.fill('text')();
        }, {
            ignoreCache: true
        });
        
		tool.refresh();

	},

	{ // default options here
		abiPathCommunityCoin: "Assets/templates/R1/CommunityCoin/contract",
		abiPathCommunityStakingPool: "Assets/templates/R1/CommunityStakingPool/contract",
		chainId: null,
		communityCoinAddress: null,
	},

	{ // methods go here
		refresh: function () {
			var tool = this;
			var state = tool.state;
			
			Q.Template.render("Assets/web3/coin/staking/start", {
				chainId: state.chainId,
				communityCoinAddress: state.communityCoinAddress,
				chains: Assets.Web3.chains
			}, function (err, html) {
				Q.replace(tool.element, html);
				///

				tool.fillPoolSelect();
					
				// !!
				// stake
				$("button[name=stake]", tool.element).off(Q.Pointer.click).on(Q.Pointer.click, function (e) {
					e.preventDefault();
					e.stopPropagation();

					//$(this).addClass("Q_working");
					
					var tmp = tool._getUserChoose();
					
					var stake_amount = tmp[0];
					var data = tmp[1].instancedata;
					var optionSelected = tmp[2];


					var validated = true;

					if (
						Q.validate.notEmpty(optionSelected.val()) && 
						Q.validate.address(optionSelected.val())
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
						Q.validate.notEmpty(stake_amount)
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
						var invokeObj = Q.invoke({
							title: tool.text.coin.staking.start.stake,
							template: {
								name: 'Assets/web3/coin/staking/start/stake/interface',
								fields: {
//									token_amount: 123123123,
//									poolname: "AABBBCCC"
								},
							},
							className: 'Assets_web3_coin_staking_start_stake',

							trigger: tool.element,
							onActivate: function ($element) {
								if (!($element instanceof $)) {
									$element = $(arguments[2]);
								}


								var erc20Contract;
								var poolContract;
								Q.Users.Web3.getContract(
									"Assets/templates/ERC20", 
									{
										contractAddress: optionSelected.val(),
										chainId: state.chainId
									}
								).then(function (contract) {
									erc20Contract = contract;
									$($element).find('.step1 .bi-asterisk').addClass('animate');

									return contract.approve(
										data.communityPoolAddress,
										ethers.utils.parseUnits(stake_amount)
									);
								}).then(function (tx) {
									return tx.wait();
								}).then(function (receipt) {
									if (receipt.status == 0) {
										throw 'Smth unexpected when approve';
									}
									Q.Template.render("Assets/web3/coin/staking/start/stake/interface/check", {}, function (err, html) {
										$($element).find('.step1').html(html);
										$($element).find('.step2 .bi-asterisk').addClass('animate');
									});
								}).then(function () {	
									return tool._getStakingPoolContract(data.communityPoolAddress);
								}).then(function (pool) {
									poolContract = pool;

									return pool.stake(
										ethers.utils.parseUnits(stake_amount),
										tool.loggedInUserXid
									);
								}).then(function (tx) {
									return tx.wait();
								}).then(function (receipt) {
									if (receipt.status == 0) {
										throw 'Smth unexpected when stake';
									}
									Q.Template.render("Assets/web3/coin/staking/start/stake/interface/check", {}, function (err, html) {
										$($element).find('.step2').html(html);
									});
								}).catch(function (err) {

									Q.Notices.add({
										content: Q.Users.Web3.parseMetamaskError(err, [erc20Contract, poolContract]),
										timeout: 5
									});
								}).finally(function(){
									
									invokeObj.close();
									
									tool.fillPoolSelect(optionSelected.val());
									tool._historyRefresh();
								});

							}
						});
					}
					
				});		
				
				///
			});
		},
		_getCommunityCoinContract: function() {
			var tool = this;
			var state = tool.state;
			
			return Q.Users.Web3.getContract(
				state.abiPathCommunityCoin, 
				{
					contractAddress: state.communityCoinAddress,
					chainId: state.chainId
				}
			)
		},
		_getStakingPoolContract: function(communityStakingPoolAddress) {
			var tool = this;
			var state = tool.state;
			
			return Q.Users.Web3.getContract(
				state.abiPathCommunityStakingPool, 
				{
					contractAddress: communityStakingPoolAddress,
					chainId: state.chainId
				}
			)
		},
		_historyRefresh: function(){
			var tool = this;

			var historyTool = Q.Tool.from($(tool.element).find('.Assets_web3_coin_staking_history_tool')[0], "Assets/web3/coin/staking/history");
			historyTool.refresh();
		},
		_getUserChoose: function() {
			var tool = this;
			var $selectEl = $(tool.element).find('select[name=reserveToken]');
			var $inputEl = $(tool.element).find('input[name=amount]');

			var optionSelected = $selectEl.find('option:selected');
			var data = optionSelected.data();
			var stake_amount = $inputEl.val();			
			
			return [stake_amount, data, optionSelected];
		},
		_renderPoolInfo: function(){
			var tool = this;

			var optionSelected;
			var data;
			var stake_amount;
			
			[stake_amount, data, optionSelected] = tool._getUserChoose();
			
			Q.Template.render("Assets/web3/coin/staking/start/poolInfo", {
				selectValue:optionSelected.val(),
				selectTitle:optionSelected.html(),
				//data: data,
				data: Q.isEmpty(data.instancedata) ? {} : data.instancedata,
				stake_amount: Q.isEmpty(stake_amount) ? 0 : stake_amount,
				stake_amount_max: Q.isEmpty(data.instancedata.erc20TokenInfo.balance) ? '-' : ethers.utils.formatUnits(data.instancedata.erc20TokenInfo.balance, 18),
			}, function (err, html) {
				Q.replace($(tool.element).find('.infoContainer')[0], html);
			});
		},
		fillPoolSelect: function(setValAfterFill){
			var tool = this;
			var state = tool.state;
			
			var $selectElement = $(tool.element).find('select[name=reserveToken]');
			var $amountElement = $(tool.element).find('input[name=amount]');
			var $infoContainer = $(tool.element).find('.infoContainer');
			//var contract;
			$selectElement.addClass("Q_working");
			$infoContainer.addClass("Q_working");
			
			//get from cache or retrieve
			var poolsList;
			if (!Q.isEmpty(state.cache) && !Q.isEmpty(state.cache.poolsList)) {
				poolsList = state.cache.poolsList;
			}
			
			Assets.CommunityCoins.Pools.getAllExtended(
				poolsList,
				state.communityCoinAddress, 
				null, 
				state.chainId, 
				ethers.utils.getAddress(tool.loggedInUserXid),
				function (err, instanceInfos) {
					if (err) {
						return console.warn(err);
					}
					$selectElement.html('');
					
					instanceInfos.forEach(function(i, index){
			
						var selectTitle;
						var selectVal = i.tokenErc20;
						if (Q.isEmpty(i.erc20TokenInfo.name) && Q.isEmpty(i.erc20TokenInfo.symbol)) {
							selectTitle = Assets.NFT.Web3.minimizeAddress(selectVal, 20, 3);
						} else {
							selectTitle = i.erc20TokenInfo.name + "("+i.erc20TokenInfo.symbol+")";
						}
						
						$selectElement.append(`
						<option 
							data-instancedata='${JSON.stringify(i)}'
							value="${selectVal}">${selectTitle}
						</option>
						`);
						
					});
					
					$selectElement.removeClass("Q_working");
					$amountElement.removeClass("Q_working");
					
					var __renderOnchange = function (e) {
						tool._renderPoolInfo();
						$infoContainer.removeClass("Q_working");
					};

					$selectElement.off("change").on("change", __renderOnchange).trigger('change');
					$amountElement.off("keyup").on("keyup", __renderOnchange);
					if (typeof setValAfterFill !== "undefined") {
						$selectElement.val(setValAfterFill).trigger("change");
					}
				}
			);

		}
	});

	Q.Template.set("Assets/web3/coin/staking/start",
	`
	<div>
		<div class="row">
			<div class="col-sm-4">
				<div class="form Assets_web3_coin_staking_start_form">
					<div class="form-group">
						<label>{{coin.staking.start.form.labels.reserveToken}}</label>
						<select class="form-control" name="reserveToken">
						{{#each chains}}
							<option value="{{this.chainId}}" {{#if this.default}}selected{{/if}}>{{this.name}}</option>
						{{/each}}
						</select>
						<small class="form-text text-muted">{{coin.staking.start.form.small.reserveToken}}</small>
					</div>

					<div class="form-group">
						<label>{{coin.staking.start.form.labels.amount}}</label>
						<input name="amount" type="text" class="form-control" placeholder="{{coin.staking.start.placeholders.amount}}">
						<small class="form-text text-muted">{{coin.staking.start.form.small.amount}}</small>
					</div>

					<button name="stake" class="Assets_web3_coin_staking_start_stake Q_button">{{coin.staking.start.btns.stake}}</button>	

				</div>
			</div>
			<div class="col-sm-4 infoContainer" >
				Loading
			</div>
		</div>
		<div class="row">
			<div class="col-sm-12 Assets_web3_coin_staking_start_historyContainer">
				{{&tool "Assets/web3/coin/staking/history" chainId=chainId communityCoinAddress=communityCoinAddress}}
			</div>
		</div>
	</div>
	`,
		{
			text: ["Assets/content", "Assets/web3/coin/staking/start"]
		}
	);
	
	Q.Template.set("Assets/web3/coin/staking/start/poolInfo",
	`
		Stake {{selectTitle}} in {{data.communityCoinInfo.name}}<br>
		
		{{#if data.donations}}
		Donating % to [[avatarbyxid]]<br>
		{{/if}} 
		Staking pool duration: {{data.duration}}:<br>
		{{stake_amount}} {{stake_amount_max}}
	`,
		{text: ["Assets/content", "Assets/web3/coin/staking/start"]}
	);
	
	Q.Template.set("Assets/web3/coin/staking/start/stake/interface",
	`
		You should need to execute two transactions:<br>

		<table class="table table-stripe">
			<tr>
			<td>Approve {{token_amount}} to the pool {{poolname}}</td>
			<td class="steps step1">
				{{> "Assets/web3/coin/staking/start/stake/interface/asterisk"}}
			</td>
			</tr>
			<tr>
			<td>staking</td>
			<td class="steps step2">
				{{> "Assets/web3/coin/staking/start/stake/interface/asterisk"}}
			</td>
			</tr>
		</table>
	`,
		{
			text: ["Assets/content", "Assets/web3/coin/staking/start"],
			partials:[
				"Assets/web3/coin/staking/start/stake/interface/check",
				"Assets/web3/coin/staking/start/stake/interface/asterisk"
			]
		}
	);
				    
	Q.Template.set("Assets/web3/coin/staking/start/stake/interface/check",
	`
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
			<path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
		</svg>
	`,
		{text: ["Assets/content", "Assets/web3/coin/staking/start"]}
	);
	
	Q.Template.set("Assets/web3/coin/staking/start/stake/interface/asterisk",
	`
		<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-asterisk" viewBox="0 0 16 16">
			<path d="M8 0a1 1 0 0 1 1 1v5.268l4.562-2.634a1 1 0 1 1 1 1.732L10 8l4.562 2.634a1 1 0 1 1-1 1.732L9 9.732V15a1 1 0 1 1-2 0V9.732l-4.562 2.634a1 1 0 1 1-1-1.732L6 8 1.438 5.366a1 1 0 0 1 1-1.732L7 6.268V1a1 1 0 0 1 1-1z"/>
		</svg>
	`,
		{text: ["Assets/content", "Assets/web3/coin/staking/start"]}
	);

})(window, Q, jQuery);
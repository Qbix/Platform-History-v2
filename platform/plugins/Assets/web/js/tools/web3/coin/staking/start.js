/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


(function (window, Q, $, undefined) {
	
	if (Q.isEmpty(Q.grabMetamaskError)) {

        // see https://github.com/MetaMask/eth-rpc-errors/blob/main/src/error-constants.ts
        // TODO need to handle most of them
        Q.grabMetamaskError = function _Q_grabMetamaskError(err, contracts) {

            if (err.code == '-32603') {
                if (!Q.isEmpty(err.data)) {
                    if (err.data.code == 3) {
                        //'execution reverted'

                        var str = '';
                        contracts.every(function (contract) {
                            try {
                                var customErrorDescription = contract.interface.getError(ethers.utils.hexDataSlice(err.data.data, 0, 4)); // parsed
                                if (customErrorDescription) {

                                    var decodedStr = ethers.utils.defaultAbiCoder.decode(
                                        customErrorDescription.inputs.map(obj => obj.type),
                                        ethers.utils.hexDataSlice(err.data.data, 4)
                                    );
                                    str = `${customErrorDescription.name}(${(decodedStr.length > 0) ? '"' + decodedStr.join('","') + '"' : ''})`;
                                    return false;
                                }
                                return true;
                            } catch (error) {
                                return true;
                            }

                        });

                        if (Q.isEmpty(str)) {
                            // handle: revert("here string message")
                            return (err.data.message)
                        } else {
                            return (str);
                        }
                    } else {
                        //handle "Internal JSON-RPC error."
                        return (err.data.message);
                    }
                }
            }

            // handle revert and grab custom error
            return (err.message);
        }
    }
	
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
//	* @param {String} [options.fields] array of defaults for the values
//	*  @param {String} [options.fields.tokenErc20.value]
//	*  @param {Integer} [options.fields.bonusTokenFraction.value]
//	*  @param {String} [options.fields.popularToken.value]
//	*  @param {String} [options.fields.donations.value] array of tuple like [[address, fraction], ...]
//	*  @param {Integer} [options.fields.rewardsRateFraction.value]
//	*  @param {Integer} [options.fields.numerator.value]
//	*  @param {Integer} [options.fields.denominator.value]
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
		
		if (Q.isEmpty(state.communityStakingPoolAddress)) {
			return console.warn("communityStakingPoolAddress required!");
		}
		if (Q.isEmpty(state.communityCoinAddress)) {
			return console.warn("communityCoinAddress required!");
		}
		
		if (Q.isEmpty(state.chainId)) {
			return console.warn("chainId required!");
		}

		tool.refresh();

	},

	{ // default options here
		abiPathCommunityCoin: "Assets/templates/R1/CommunityCoin/contract",
		abiPathCommunityStakingPool: "Assets/templates/R1/CommunityStakingPool/contract",
		chainId: null,
		communityStakingPoolAddress: null,
		communityCoinAddress: null,
		fields: {
			
			// key validate is optional
			// value can be :
			// - plain array
			//  validate: ["isEmpty", "isInteger", ...] and try to call Q methods: Q.isEmpty, Q.isInteger ...
			// - object  like {key => errormessage}
			//  validate: {"isEmpty": "err msg here to key %key%, "isInteger": "invalid key %key%, ...} and try to call Q methods: Q.isEmpty, Q.isInteger ...
//			tokenErc20: {value: "", hide: false, validate: ["notEmpty", "address"]},
//			duration: {value: "", hide: false, validate: ["notEmpty", "integer"]},
//			bonusTokenFraction: {value: "", hide: false, validate: ["notEmpty", "integer"]},
//			popularToken: {value: "", hide: false, validate: ["notEmpty", "address"]},
//			donations: {value: "", hide: false, validate: ["notEmpty"]},
//			rewardsRateFraction: {value: "", hide: false, validate: ["notEmpty", "integer"]},
//			numerator: {value: "", hide: false, validate: ["notEmpty", "integer"]},
//			denominator: {value: "", hide: false, validate: ["notEmpty", "integer"]}
		},
	},

	{ // methods go here
		refresh: function () {
			var tool = this;
			var state = tool.state;
			`
			Stake {{ ReserveSymbol }} in {{ CommunityCoinSymbol }}
Donating 80% to {{avatar by xid}} <-- show only if donation > 0%
Staking pool duration: {{ duration }}:
[ stake amount ] _Max_ [[ Stake ]]
`
			
			Q.Template.render("Assets/web3/coin/staking/start", {
				chainId: state.chainId,
				chains: Assets.Web3.chains
			}, function (err, html) {
				Q.replace(tool.element, html);
				///
				
				//activate history tool
//				var $historyContainer = $(tool.element).find('.Assets_web3_coin_staking_start_historyContainer');
//				$('<div />')
//				.tool('Assets/web3/coin/staking/history', {})
//				.appendTo($historyContainer).activate(function () {
//				  // called after tool was activated
//				});


				tool.fillPoolSelect();
			
				// !!
				
				///
			});
		},
		_getCommunityCoinContract: function() {
			return Q.Users.Web3.getContract(
				state.abiPathCommunityCoin, 
				{
					contractAddress: state.communityCoinAddress,
					chainId: state.chainId
				}
			)
		},
		_getStakingPoolContract: function() {
			return Q.Users.Web3.getContract(
				state.abiPathCommunityStakingPool, 
				{
					contractAddress: state.communityStakingPoolAddress,
					chainId: state.chainId
				}
			)
		},
		_historyRefresh: function(){
			var tool = this;

			var historyTool = Q.Tool.from($(tool.element).find('.Assets_web3_coin_staking_history_tool'), "Assets/web3/coin/staking/history");
			historyTool.refresh();
		},
		_renderPoolInfo: function(optionSelected, data){
			var tool = this;
			
			var stake_amount = $(tool.element).find('input[name=amount]').val();
			
			Q.Template.render("Assets/web3/coin/staking/start/poolInfo", {
				selectValue:optionSelected.val(),
				selectTitle:optionSelected.html(),
				//data: data,
				data: data,
				stake_amount: Q.isEmpty(stake_amount) ? 0 : stake_amount
			}, function (err, html) {
				Q.replace($(tool.element).find('.infoContainer')[0], html);
			});
		},
		fillPoolSelect: function(){
			var tool = this;
			var state = tool.state;
			
			var $selectElement = $(tool.element).find('select[name=reserveToken]');
			var $infoContainer = $(tool.element).find('.infoContainer');
			//var contract;
			$selectElement.addClass("Q_working");
			$infoContainer.addClass("Q_working");
			Assets.CommunityCoins.Pools.getAllExtended(
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
					/*
		<td>{{i.tokenErc20}}</td>
		<td>{{i.duration}}</td>
		<td>{{i.bonusTokenFraction}}</td>
		<td>{{i.popularToken}}</td>

		<td>{{i.rewardsRateFraction}}</td>
		<td>{{i.numerator}}</td>
		<td>{{i.denominator}}</td>
					*/
				   $selectElement.removeClass("Q_working");
				   $selectElement.off("change").on("change", function (e) {
						var optionSelected = $("option:selected", this);
						//var valueSelected = this.value;
						var data = optionSelected.data();
						
						tool._renderPoolInfo(optionSelected, data.instancedata);
						
						$infoContainer.removeClass("Q_working");
				
				   }).trigger('change');
					
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
				{{&tool "Assets/web3/coin/staking/history"}}
	<!--  salesAddress=salesAddress abiPath=abiNFTSales -->
			</div>
		</div>
	</div>
	`,
		{text: ["Assets/content"]}
	);
	
	Q.Template.set("Assets/web3/coin/staking/start/poolInfo",
	`
		Stake {{selectTitle}} in {{data.communityCoinInfo.name}}<br>
		
		{{#if data.donations}}
		Donating % to [[avatarbyxid]]<br>
		{{/if}} 
		Staking pool duration: {{data.duration}}:<br>
		{{stake_amount}} _Max_ 
	`,
		{text: ["Assets/content"]}
	);

})(window, Q, jQuery);
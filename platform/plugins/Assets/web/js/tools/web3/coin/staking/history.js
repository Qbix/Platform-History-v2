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
//	* creation and viewing history stakes
//	* @class Assets Community Coin Admin
//	* @constructor
//	* @param {Object} options Override various options for this tool
//	* @param {String} [options.chainId] chainId
//	* @param {String} [options.communityCoinAddress] address od CommunityCoin contract
//	*/
	Q.Tool.define("Assets/web3/coin/staking/history", function (options) {
		
		var tool = this;
		var state = this.state;
		
		tool.loggedInUserXid = Q.Users.Web3.getLoggedInUserXid();
		if (!tool.loggedInUserXid) {
			return console.warn("user not logged in");
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
		communityCoinAddress: null
	},

	{ // methods go here
		refresh: function () {
			var tool = this;
			var state = tool.state;
			
			Q.Users.Web3.getContract(
				state.abiPathCommunityCoin, 
				{
					contractAddress: state.communityCoinAddress,
					chainId: state.chainId
				}
			).then(function(contract){
				return contract.viewLockedWalletTokensList(ethers.utils.getAddress(tool.loggedInUserXid))
			}).then(function (data) {

				state.stakesList = tool._adjustValues(data[0]);
				state.bonuseslist = tool._adjustValues(data[1]);

			}).finally(function(){
				Q.Template.render("Assets/web3/coin/staking/history", {
					stakesList: state.stakesList,
					bonuseslist: state.bonuseslist
				}, function (err, html) {
					Q.replace(tool.element, html);
					
					 $("[data-timestamp]", tool.element).each(function () {
                        $(this).tool("Q/countdown").activate();
                    });
					
				});
			});
			
			
		},
		_adjustValues: function(data){
			var ret = [];
			data.forEach(function(i, index){
				if (!Q.isEmpty(i)) {
					ret.push({
						0:ethers.utils.formatUnits(i[0].toString(), 18), 
						1:parseInt(i[1]),
					});
				}
			})
			return ret;
		}
	});
	Q.Template.set("Assets/web3/coin/staking/history",
	`
	<div class="Assets_web3_coin_staking_history">
	<table class="table table-stripe">
	<tr>
	<th>amount</th>
	<th>time left</th>
	</tr>
	{{#each stakesList}}
	<tr>
	<td>{{this.[0]}}</td>
	<td>
		<div data-timestamp="{{this.[1]}}">
			{{> Assets/web3/coin/staking/history/countdown/interface}}
		</div>
	</td>
	</tr>
	{{/each}}
	{{#each bonuseslist}}
	<tr>
	<td>{{this.[0]}}</td>
	<td>{{this.[1]}}</td>
	</tr>
	{{/each}}
	</table>
	</div>
	`,
		{
			text: ["Assets/content"],
			partials:[
				"Assets/web3/coin/staking/history/countdown/interface"
			]
		}
	);
	
	Q.Template.set("Assets/web3/coin/staking/history/countdown/interface",
	`
		<span class="Q_days"></span>&nbsp;&nbsp;<span class="Q_hours"></span>:<span class="Q_minutes"></span>:<span class="Q_seconds"></span>
	`,
		{text: ["Assets/content"]}
	);

})(window, Q, jQuery);
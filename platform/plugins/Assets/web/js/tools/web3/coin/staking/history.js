/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
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
	Q.Tool.define("Assets/web3/coin/staking/history", function (options) {
		
		var tool = this;
		var state = this.state;
	/*	
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
*/
		tool.refresh();
		setInterval(function(){tool.refresh();},5000);

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
				
			Q.Template.render("Assets/web3/coin/staking/history", {
				chainId: state.chainId,
				chains: Assets.Web3.chains
			}, function (err, html) {
				Q.replace(tool.element, html);
				///
				
				$(tool.element).find('.lastTsupdated').html(new Date(Date.now()).toLocaleTimeString("en-US"));
			
			
				// !!
				
				///
			});
		}
	});

	Q.Template.set("Assets/web3/coin/staking/history",
	`
	<div class="Assets_web3_coin_staking_history">
	
	Template: "Assets/web3/coin/staking/history"<br>
	Update at: <div class="lastTsupdated"></div>
	</div>
	`,
		{text: ["Assets/content"]}
	);

})(window, Q, jQuery);
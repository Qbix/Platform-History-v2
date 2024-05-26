
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
		
//		var defaultsValidate = {
//            notEmpty: "<b>%key%</b> cannot be empty", 
//            integer: "<b>%key%</b> must be an integer", 
//            address: "<b>%key%</b> invalid"
//        };
		
		var loggedInUser = Users.loggedInUser;
		if (!loggedInUser) {
			return console.warn("user not logged in");
		}
		
		tool.loggedInUserXid = Users.Web3.getLoggedInUserXid();
		
        if (Q.isEmpty(tool.loggedInUserXid)) {
            return console.warn("user xid required!");
        }
        
		if (Q.isEmpty(state.communityCoinAddress)) {
			return console.warn("communityCoinAddress required!");
		}
		
		if (Q.isEmpty(state.chainId)) {
			return console.warn("chainId required!");
		}
        
        // We try to obtain the poolsList from the following cases:
        // 1. From the cache. This occurs when the tool has started from the backend.
        // 2. From a request to the backend and fetching from the cache. 
        //  This happens when the tool is initiated only from JS. 
        //  So, we will make a request to the backend, create a cache, and then refer to point 1.
        // 3. If something unexpected happens (backend returns false), 
        //  we will pass false to the JS method Assets.CommunityCoins.Pools.getAllExtended.
        //  and this will be from js context and RPC(through metamask for example) 
        //  
        // regardless WE get poll list or not, we will send it in getAllExtended 
        // and trying to get ERC20 token info like name and symbol
        // appending returned object with the data
        //  {
        //      "erc20TokenInfo": {name:"", symbol:"", balance:""},
        //      "communityCoinInfo": {name:"", symbol:"", balance:""},
        //  }
             
        tool.poolsList = false;
        if (!Q.isEmpty(state.cache) && !Q.isEmpty(state.cache.poolsList)) {
            tool.poolsList = state.cache.poolsList;
            tool.refresh();
        } else {
            Q.req("Assets/web3/coin/staking/start", ["start"], function(err, response){
                if (!err) {
                    tool.poolsList = response.slots.start;
                }
                tool.refresh();
            }, {
                fields: state
            });
        }

	},

	{ // default options here
		abiPathCommunityCoin: "Assets/templates/R1/CommunityCoin/contract",
		abiPathCommunityStakingPool: "Assets/templates/R1/CommunityStakingPool/contract",
        abiPathCommunityStakingPoolFactory: "Assets/templates/R1/CommunityStakingPool/factory",
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
                
                tool.$slider = $('input[name=Assets_web3_coin_staking_start_slider', tool.element);
                tool.$sliderDatalist = $('.Assets_web3_coin_staking_start_slider_datalist', tool.element);
                tool.$selectElement = $('select[name=reserveToken]', tool.element);
                tool.$amountElement = $('input[name=amount]', tool.element);
                tool.$durationElement = $('input[name=duration]', tool.element);
                tool.$infoContainer = $('.Assets_web3_coin_staking_start_infoContainer', tool.element);
                tool.$btnContinue = $('button[name=continue]', tool.element);
                tool.$btnAllow = $('button[name=allow]', tool.element);
                tool.$btnBuyAndStake = $('button[name=buyAndStake]', tool.element);
				///
                //tool.$slider.attr('disabled', 'disabled');
                //
				tool.fillPoolSelect();
					
				// buy and stake in single iterations.
                // interfaces will provide a case with allowing tokens and then staking
				tool.$btnBuyAndStake.off(Q.Pointer.click).on(Q.Pointer.click, function (e) {
					e.preventDefault();
					e.stopPropagation();

					//$(this).addClass("Q_working");
					var validated, userInputObj;
                    [validated, userInputObj] = tool._userInputValidate(true);
                    var stake_amount = userInputObj.stake_amount;
                    		
					if (validated) {
						var invokeObj = Q.invoke({
							title: tool.text.coin.staking.start.stake,
							template: {
								name: 'Assets/web3/coin/staking/start/stake/interface',
								fields: {},
							},
							className: 'Assets_web3_coin_staking_start_stake',

							trigger: tool.element,
							onActivate: function (element) {
								var erc20Contract;
								var poolContract;
								Users.Web3.getContract(
									"Assets/templates/ERC20", 
									{
										contractAddress: userInputObj.tokenERC20Address,
										chainId: state.chainId
									}
								).then(function (contract) {
									erc20Contract = contract;
									$('.step1 .bi-asterisk', element).addClass('animate');

									return contract.approve(
										userInputObj.poolAddress,
										ethers.utils.parseUnits(stake_amount)
									);
								}).then(function (tx) {
									return tx.wait();
								}).then(function (receipt) {
									if (receipt.status == 0) {
										throw 'Smth unexpected when approve';
									}
									Q.Template.render("Assets/web3/coin/staking/start/stake/interface/check", {}, function (err, html) {
										$('.step1', element).html(html);
										$('.step2 .bi-asterisk', element).addClass('animate');
									});
								}).then(function () {	
									return tool._getStakingPoolContract(userInputObj.poolAddress);
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
										$('.step2', element).html(html);
									});
								}).catch(function (err) {

									Q.Notices.add({
										content: Users.Web3.parseMetamaskError(err, [erc20Contract, poolContract]),
										timeout: 5
									});
								}).finally(function(){
									invokeObj.close();
									tool._historyRefresh();
								});
							}
						});
					}
				});		
				///
                // allowing tokens for coontract. can be disable after allowing and if amount < then allowed before
                tool.$btnAllow.off(Q.Pointer.click).on(Q.Pointer.click, function (e) {
                    e.preventDefault();
					e.stopPropagation();
                    
                    $(tool.element).addClass("Q_working");
                    
                    var validated, userInputObj;
                    [validated, userInputObj] = tool._userInputValidate(true);
                    
                    if (!validated) {
                        $(tool.element).removeClass("Q_working");
                        return;
                    }

                    var erc20Contract;
                    Users.Web3.getContract(
                        "Assets/templates/ERC20", 
                        {
                            contractAddress: userInputObj.tokenERC20Address,
                            chainId: state.chainId
                        }
                    ).then(function (contract) {
                        erc20Contract = contract;
                        return contract.approve(
                            userInputObj.poolAddress,
                            ethers.utils.parseUnits(userInputObj.stake_amount)
                        );
                    }).then(function (tx) {
                        return tx.wait();
                    }).then(function (receipt) {
                        if (receipt.status == 0) {
                            throw 'Smth unexpected when approve';
                        }
                        tool._allowCheck();
                    }).catch(function (err) {
                        Q.Notices.add({
                            content: Users.Web3.parseMetamaskError(err, [erc20Contract]),
                            timeout: 5
                        });
                    }).finally(function(){
                        $(tool.element).removeClass("Q_working");
                    });

                });
                
                // staking. 
                tool.$btnContinue.off(Q.Pointer.click).on(Q.Pointer.click, function (e) {
                    e.preventDefault();
					e.stopPropagation();
                    
                    $(tool.element).addClass("Q_working");
                    
                    var validated, userInputObj;
                    [validated, userInputObj] = tool._userInputValidate(true);
                    
                    if (!validated) {
                        $(tool.element).removeClass("Q_working");
                        return;
                    }
                    
                    var poolContract;
                    tool._getStakingPoolContract(userInputObj.poolAddress).then(function (pool) {
                        poolContract = pool;    
                        return pool.stake(
                            ethers.utils.parseUnits(userInputObj.stake_amount),
                            tool.loggedInUserXid
                        );
                    }).then(function (tx) {
                        return tx.wait();
                    }).then(function (receipt) {
                        if (receipt.status == 0) {
                            throw 'Smth unexpected when stake';
                        }
                    }).catch(function (err) {
                        Q.Notices.add({
                            content: Users.Web3.parseMetamaskError(err, [poolContract]),
                            timeout: 5
                        });
                    }).finally(function(){
                        $(tool.element).removeClass("Q_working");
                    });
                    
                });
			});
		},
        // checks user allowance. if not successfull - we will disable continue button overwise transaction will revert
        _allowCheck: function() {
            var tool = this;
            var validated, userInputObj;
            [validated, userInputObj] = tool._userInputValidate();
            if (!validated) {
                tool.$btnContinue.attr('disabled','disabled').addClass('Q_disabled');    
                return;
            }
            if (userInputObj.stake_amount) {
                tool.$btnContinue.attr('disabled','disabled').addClass('Q_disabled');    
                var erc20contract;
                Users.Web3.getContract(
                    "Assets/templates/ERC20", 
                    {
                        contractAddress: userInputObj.tokenERC20Address,
                        chainId: tool.state.chainId
                    }
                ).then(function (contract) {
                    erc20contract = contract
                    return contract.allowance(
                        tool.loggedInUserXid,
                        userInputObj.poolAddress
                    );
                }).then(function (allowance) {
                    if (
                            allowance.gte(ethers.utils.parseUnits(userInputObj.stake_amount))
                        ) {
                        tool.$btnContinue.removeAttr('disabled').removeClass('Q_disabled');
                    } else {
                        tool.$btnContinue.attr('disabled','disabled').addClass('Q_disabled');
                    }
                    
                }).catch(function (err) {
                    Q.Notices.add({
                        content: Users.Web3.parseMetamaskError(err, [erc20contract]),
                        timeout: 5
                    });
                    tool.$btnContinue.removeAttr('disabled');
                });
            }
        },
        // validation user unput and if showNotices == true then show notices.
        //showNotices == false useful when need chack userinput on keyup handler and disable "continue" button
        _userInputValidate: function(showNotices) {
            if (typeof showNotices ==='undefined') {
                showNotices = false;
            }
            var tool = this;
            var tmp = tool._getUserChoose();
            var validated = true;
            if (
                Users.Web3.validate.notEmpty(tmp.poolAddress) && 
                Users.Web3.validate.address(tmp.poolAddress)
            ) {
            //
            } else {
                if (showNotices) {
                    Q.Notices.add({
                        content: "Token invalid",
                        timeout: 5
                    });
                }
                validated = false;
            }

            if (
                Users.Web3.validate.notEmpty(tmp.stake_amount)
            ) {
            //
            } else {
                if (showNotices) {
                    Q.Notices.add({
                        content: "Amount invalid",
                        timeout: 5
                    });
                }
                validated = false;
            }
            
            return [validated, tmp];
        },
		_getCommunityCoinContract: function() {
			var tool = this;
			var state = tool.state;
			
			return Users.Web3.getContract(
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
			
			return Users.Web3.getContract(
				state.abiPathCommunityStakingPool, 
				{
					contractAddress: communityStakingPoolAddress,
					chainId: state.chainId
				}
			)
		},
        // if tool "Assets/web3/coin/staking/history" are exists inside tool.element we will try to refresh it
		_historyRefresh: function(){
			var tool = this;

			var historyTool = Q.Tool.from($(tool.element).find('.Assets_web3_coin_staking_history_tool')[0], "Assets/web3/coin/staking/history");
            if (historyTool) {
    			historyTool.refresh();
            }
		},
        // collect user input from fields
		_getUserChoose: function() {
			var tool = this;
			var $selectEl = $(tool.element).find('select[name=reserveToken]');
            var $durationEl = $(tool.element).find('input[name=duration]');
			var $inputEl = $(tool.element).find('input[name=amount]');

			var optionSelected = $selectEl.find('option:selected');
			var data = optionSelected.data();
            
            var durationVal = $durationEl.val();
			//return [stake_amount, data, optionSelected];
            
            var obj;
            tool.poolsList.forEach(function(i, index){
                if (
                    i.duration == durationVal &&
                     i.tokenErc20.toLowerCase() == data.instancedata.tokenErc20.toLowerCase()
                    ) {
                        obj = i;
                }
            })
            return {
                stake_amount: $inputEl.val() || 0,
                stake_duration: $durationEl.val(),
                tokenERC20Address: obj.tokenErc20,
                poolAddress: obj.communityPoolAddress,
                optionSelected: optionSelected,
                data: data
            }
		},
        // if in template we will define infoContainer - toll will diplay info about transaction
        // how much, how long, in which pool we will stake, and user balance of choosen stake tokens
		_renderPoolInfo: function(){
			var tool = this;

            var tmp = tool._getUserChoose();
            
			var optionSelected = tmp.optionSelected;
			var data = tmp.data;
			
			Q.Template.render("Assets/web3/coin/staking/start/poolInfo", {
				selectValue:optionSelected.val(),
				selectTitle:optionSelected.html(),
				//data: data,
				data: Q.isEmpty(data.instancedata) ? {} : data.instancedata,
                stake_duration: Q.isEmpty(tmp.stake_duration) ? 0 : tmp.stake_duration,
				stake_amount: Q.isEmpty(tmp.stake_amount) ? 0 : tmp.stake_amount,
				stake_amount_max: Q.isEmpty(data.instancedata.erc20TokenInfo.balance) ? '-' : ethers.utils.formatUnits(data.instancedata.erc20TokenInfo.balance, 18),
			}, function (err, html) {
				Q.replace($(tool.element).find('.Assets_web3_coin_staking_start_infoContainer')[0], html);
			});
		},
        // Rendering slider with durations.
        // Here, we use "input type=range" and link it with a datalist.
        // We can't use the input as is and specify a step, because the duration can be any value, such as 1, 20, 34, 260.
        // Instead, we set up the range from 0 to the total duration amount, and the labels move via CSS opposite to the marks.
        _renderSliderMarkers: function() {
            
            var tool = this;
            
            var tmp = tool._getUserChoose();
            
			//var stake_amount = tmp.stake_amount;
            var stake_duration = tmp.stake_duration;
            var tokenERC20Address = tmp.tokenERC20Address;

            tool.$slider.attr('disabled', 'disabled');
            tool.$slider.attr('values', []);
            
            tool.$sliderDatalist.html('');
            
            var durationList = [];
            tool.poolsList.forEach(function(i, index){
                if (tokenERC20Address == i.tokenErc20) {
                    durationList.push(parseInt(i.duration));
                }
            });

            var durationListSorted = durationList.toSorted((a, b) => a - b);
            
            tool.$slider.attr({
                max: durationListSorted.length-1,
                min: 0,
                step: 1
            })

            durationListSorted.forEach(function(i, index){
                tool.$sliderDatalist.append(
                    $('<option>').attr('value', index).attr('label', i).text(i)
                );
            });
            
            var tmp = [
                0,
                100,
                189,
                142,
                126,
                117,
                114,
                111,
                108,
                106
            ];
            var calcWidth = durationListSorted.length+2 > tmp.length ? 100 : tmp[durationListSorted.length];
            
            tool.$sliderDatalist.css('width', calcWidth+'%');
            
            tool.$slider.removeAttr('disabled');

            tool.$durationElement.val(stake_duration);
            
          //  tool.$slider.removeAttr('disabled');
        },
        // rendering select with pools and handle input fields
        _renderSelectPool: function(instanceInfos) {
            var tool = this;
            
            tool.$selectElement.html('');
            
            tool.$selectElement.removeClass("Q_working");
            tool.$amountElement.removeClass("Q_working");
            tool.$durationElement.removeClass("Q_working");

            var tokensList=[];
            instanceInfos.forEach(function(i, index){

                var selectTitle;
                var selectVal = i.tokenErc20;
                if (Q.isEmpty(i.erc20TokenInfo.name) && Q.isEmpty(i.erc20TokenInfo.symbol)) {
                    selectTitle = Assets.NFT.Web3.minimizeAddress(selectVal, 20, 3);
                } else {
                    selectTitle = i.erc20TokenInfo.name + "("+i.erc20TokenInfo.symbol+")";
                }

                if (tokensList.includes(selectVal)) {

                } else {
                    tool.$selectElement.append(`
                    <option 
                        data-instancedata='${JSON.stringify(i)}'
                        value="${index}">${selectTitle}
                    </option>
                    `);
                    tokensList.push(selectVal);
                }
            });
            	
            tool.$selectElement.off("change").on("change", function (e) {
                var optionSelected = $(this).find('option:selected');
                var data = optionSelected.data();
                tool.$durationElement.val(data.instancedata.duration);
                tool._renderPoolInfo();
                tool._renderSliderMarkers();
                tool._allowCheck();
                tool.$infoContainer.removeClass("Q_working");
            }).trigger('change');
            tool.$amountElement.off("keyup").on("keyup", function(e){
                tool._renderPoolInfo();
            });
            tool.$amountElement.off("change").on("change", function(e){
                tool._allowCheck();
            });
            tool.$slider.off("change").on("change", function(e){
                var option = tool.$sliderDatalist.find('option[value="'+$(this).val()+'"]');
                tool.$durationElement.val(option.attr('label'));
                tool._renderPoolInfo();
                tool._allowCheck();
            });
            tool.$durationElement.off("change").on("change", function(e){
                var val = $(this).val();
                var oldSliderIndex = tool.$slider.val();
                var exists = tool.$sliderDatalist.find('option[label="'+val+'"]');
                if (exists.length) {
                    tool.$slider.val(exists.attr('value'));
                } else {
                    //set previous
                    $(this).val(tool.$sliderDatalist.find('option[value='+oldSliderIndex+']').text());
                }
                tool._renderPoolInfo();
                tool._allowCheck();
            });
        },
        // filling select with pools after refresh of getting data from blockchain
		fillPoolSelect: function(){

			var tool = this;
			var state = tool.state;

			tool.$selectElement.addClass("Q_working");
            tool.$amountElement.addClass("Q_working");
            tool.$durationElement.addClass("Q_working");
			
			//get from cache or retrieve
			var poolsList = tool.poolList;

			Assets.CommunityCoins.Pools.getAllExtended(
				tool.poolsList,
				state.communityCoinAddress, 
				null, 
				state.chainId, 
				ethers.utils.getAddress(tool.loggedInUserXid),
				function (err, instanceInfos) {
					if (err) {
						return console.warn(err);
					}
                    if (!tool.poolsList) {
                        tool.poolsList = instanceInfos;
                    }
                    tool._renderSelectPool(instanceInfos);
				}
			);
		}
	});

    Q.Template.set("Assets/web3/coin/staking/start",
    `
        <div class="row">
            <div class="col-sm-4">
                <div class="form-group">
                    <select id="Assets_web3_coin_staking_start_form_reserveToken" class="form-control" name="reserveToken">
                    {{#each chains}}
                        <option value="{{this.chainId}}" {{#if this.default}}selected{{/if}}>{{this.name}}</option>
                    {{/each}}
                    </select>
                </div>
            </div>
            <div class="col-sm-4">
                <div class="form-group">
                    <input name="amount" type="text" id="Assets_web3_coin_staking_start_form_amount" class="form-control" placeholder="{{coin.staking.start.placeholders.amount}}">
                </div>
            </div>
            <div class="col-sm-4">
                <div class="form-group">
                    <input name="duration" type="text" id="Assets_web3_coin_staking_start_form_duration" class="form-control" placeholder="{{coin.staking.start.placeholders.duration}}">
                </div>
            </div>
        </div>
        <div class="row">
            <div class="sliderContainer">
                <input type="range" name="Assets_web3_coin_staking_start_slider" class="Assets_web3_coin_staking_start_slider" list="Assets_web3_coin_staking_start_slider_datalist" />
                <datalist id="Assets_web3_coin_staking_start_slider_datalist" class="Assets_web3_coin_staking_start_slider_datalist"></datalist>
            </div>
        </div>
        <div class="row" style="display:none">
            <div class="col-sm-12 Assets_web3_coin_staking_start_infoContainer">Loading</div>
        </div>
        <div class="row" style="display:none">
            <div class="col-sm-12">
                <button name="buyAndStake" class="Q_button">Buy And Stake</button>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-6 Assets_web3_coin_staking_start_btnsContainer">
                <button name="continue" class="Q_button">Continue</button>
            </div>
            <div class="col-sm-6 Assets_web3_coin_staking_start_btnsContainer">
                <button name="allow" class="Q_button">Allow</button>
            </div>
        </div>
    `,
        {text: ["Assets/content", "Assets/web3/coin/staking/start"]}
    );
	
	Q.Template.set("Assets/web3/coin/staking/start/poolInfo",
	`
		Stake {{selectTitle}} in {{data.communityCoinInfo.name}}<br>
		
		{{#if data.donations}}
		Donating % to [[avatarbyxid]]<br>
		{{/if}} 
		Staking pool duration: {{stake_duration}}:<br>
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

})(window, Q, Q.jQuery);
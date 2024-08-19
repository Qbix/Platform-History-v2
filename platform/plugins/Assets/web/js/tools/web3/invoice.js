(function (window, Q, $, undefined) {

/**
 * @module Assets
 */

/**
 * 
 * @class Assets/web3/invoice
 * @constructor
 * @param {Object} options Override various options for this tool
 */
Q.Tool.define("Assets/web3/invoice", function (options) {
    var tool = this;
    var state = this.state;
    var $toolElement = $(this.element);
    
    if (Q.isEmpty(state.publisherId)) {
        $toolElement.remove();
        return console.warn("Assets/web3/invoice", "publisherId required!");
    }
    
    Q.Streams.get(state.publisherId, state.streamName, function(err, stream){
        if (err) { return; }
        tool.streamRecipientData = stream.getAttribute('recipients');
        tool.stream = this;
        
        var handler = function(chainId) {
            tool._chainChanged(chainId, function(success, chainId){
                Q.handle(tool.refresh, tool, [success, chainId])    
            });
        }
        Q.Users.Web3.onChainChanged.set(handler, tool);
        Q.Users.Web3.getChainId().then(function(chainId){
            handler(chainId);
        });
        
    });
    
    $toolElement.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function(){
       Q.handle(state.onInvoke, tool, []);
    });
    //LiquidityLib = 0x1eA4C4613a4DfdAEEB95A261d11520c90D5d6252

//    tool.streamRecipientData = [
//        {
//            "chainId": "0x1", // unsupported chain
//            "wallet": "0x4aC71bd9f784fA6090E9dC3EE0e61dC085e22Ef4",
//            "token": "0x2eb46420d682c12fe88245f48af504639636b7f1", // MTK on mumbai
//            "accept": ["0x4aC71bd9f784fA6090E9dC3EE0e61dC085e22Ef4", "0x2eb46420d682c12fe88245f48af504639636b7f1"],//<{ filled by backend}>,
//            "uniswapRouter": "0x4aC71bd9f784fA6090E9dC3EE0e61dC085e22Ef4"//<filled by backend>
//        },
//        {
//            "chainId": "0x13881", // supported:  mumbai
//            "wallet": "0x4aC71bd9f784fA6090E9dC3EE0e61dC085e22Ef4",
//            "token": "0x2eb46420d682c12fe88245f48af504639636b7f1", // MTK on mumbai
//            "amount": 2,
//            "accept": ["0x2e5f9AC05b344095a94DfEb6f277770b8019a0c5"], //MPTK  on mumbai
//            "uniswapRouter": "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"//<filled by backend>
//        },
//        {
//            "chainId": "0x89", // supported:  polygon matic
//            "wallet": "0x4aC71bd9f784fA6090E9dC3EE0e61dC085e22Ef4",
//            "token": "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", // usdt on polygon
//            "amount": 2,
//            "accept": [
//            "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", // USDC on polygon
//            "0x692597b009d13c4049a947cab2239b7d6517875f"
//            ], 
//            "uniswapRouter": "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff"//<filled by backend>
//        }
//    ];
    
    Q.Users.Web3.onAccountsChanged.set(function () {
        tool.refresh(true, tool.recipient.chainId);
    }, tool);
    
    
},

{ // default options here
    publisherId: null,
    streamName: "Assets/invoices",
    onInvoke:  new Q.Event(function(){
        //console.log("onInvoke:  new Q.Event(function(){");
        
        var tool = this;
        var state = this.state;
        if (state.allowToolInvoke) {
            //console.log("onInvoke:  allowed");    
            //tool.refresh();
            Q.Users.Web3.getChainId().then(function(chainId) {
                tool._chainChanged(chainId, function(success, chainId){
                    tool.refresh(success, chainId);
                });
            });
        } else {
            //console.log("onInvoke: not allowed");    
        }
    }),
    onChainChanged: new Q.Event(),
    payTitle: null,
    successfullMsg: "Transaction was successfully",
    // variables below used and filled when tool works
    swapDeadlineTs: '2524611661', // uint deadline (GMT): Saturday, January 1, 2050 1:01:01 AM
    allowToolInvoke: true,
    timeoutID: null,
    needToPayAmount: null, // amount calculated already with decimal places
    needToPayPath: null,
    needToPayToken: null,
    wrappedToken: null
},

{ // methods go here
    Q: {
		beforeRemove: function () {
            //var tool = this;
            var state = this.state;
            if (state.timeoutID !== null) {
                clearTimeout(state.timeoutID);
                state.timeoutID = null;
            }
		}
	},
    
    //_chainChanged: 
    _getUniswapRouter: function() {
        var tool = this;
        return Q.Users.Web3.getContract(
            "Assets/templates/Uniswap/V2/Router", 
            {
                contractAddress: tool.recipient.uniswapRouter,
                chainId: tool.recipient.chainId
            }
        );
    },
    
    _chainChanged: function(chainId, callback) {
        //console.log("_chainChanged", chainId);
        var tool = this;
        //var state = this.state;

        var success = false;
        Q.each(tool.streamRecipientData, function (i, item) {

            if (item.chainId.toString() === chainId.toString()) {
                tool.recipient = item;
                // adjust addresses in tool.recipient to lowercase
                tool.recipient.token = tool.recipient.token.toLowerCase();
                tool.recipient.accept = tool.recipient.accept.map(x => x.toLowerCase());
                //console.log("_chainChanged");

                success = true;
            }
        });
        Q.handle(callback, tool, [success, chainId]);
        
    },
    _updateInfo: function (tokenToPayAddress, tokenToPayBalance) {

        var tool = this;
        var state = this.state;
        var $info = $(".Assets_web3_invoice_info", tool.element);
        
        var uniswapRouter;
        var amountOut = tool.recipient.amount;
        var tokenOut = tool.recipient.token;
        var dpl = tool.recipient.tokendpl;

        state.tokenToPayAddress = tokenToPayAddress;
        if (
            typeof tokenToPayAddress === 'undefined' ||
            typeof tokenToPayBalance === 'undefined'
        ) {
            $info.html('');
            return;
        }
        if (tokenOut.toLowerCase() == tokenToPayAddress.toLowerCase()) {
            state.needToPayAmount = ethers.utils.parseUnits(amountOut.toString, dpl);
            //state.needToPayPath = [tokenOut, tokenOut];
            state.needToPayPath = [tokenOut];
            $info.html(
                tool.text.msgs.need_to_pay.replace("{{amountOut}}",amountOut)
            );
            return;
        }
        
        tool._getUniswapRouter().then(function (contract) {
            uniswapRouter = contract;
            return contract.WETH();
        }).then(function (weth_) {
            
            //console.log("amountOut", amountOut);
            state.wrappedToken = weth_;
    
            return uniswapRouter.getAmountsIn(
                ethers.utils.parseUnits(amountOut.toString(), tool.recipient.tokendpl), 
                [
                    Q.Assets.Web3.constants.zeroAddress == tokenToPayAddress ? state.wrappedToken : tokenToPayAddress, 
                    tokenOut
                ]
            );
        }).then(function (amount) {
            
            state.needToPayAmount = amount[0];
            state.needToPayPath = [
                tokenToPayAddress, 
                tokenOut
            ];
            $info.html(
                //'Need to pay "'+ ethers.utils.formatUnits(amount[0], 18) + '" tokens'
                //'Need to pay "'+ tool._parseAmount(amount[0]) + '" tokens'
                tool.text.msgs.need_to_pay.replace("{{amountOut}}",tool._parseAmount(amount[0]))
            );
        }).catch(function (e) {
            console.log(e);
            state.needToPayAmount = null;
            $info.html('');
        });

    },
    _parseAmount: function (amount) {
        return parseFloat(parseFloat(ethers.utils.formatUnits(amount)).toFixed(8));
    },
    refresh: function (success, chainId) {
        var tool = this;
        var state = tool.state;
        if (success) {
            state.allowToolInvoke = false;
            tool._refresh();
        } else {
            state.allowToolInvoke = true;
            if (state.timeoutID !== null) {
                clearTimeout(state.timeoutID);
                state.timeoutID = null;
            }
            Q.invoke({
                title: 'Error',
                template: {
                    name: "Assets/web3/invoice/disabledState",
                    fields: {
                        msg: (tool.text.errmsgs.chain_is_not_supported).replace("{{chainId}}", chainId)
                        
                    }
                },
                onActivate: function(obj){
                    //obj.close();
                }
            });
        }
    },
    _refresh: function () {

        var tool = this;
        var $toolElement = $(tool.element);
        var state = this.state;

        $toolElement.addClass("Q_working");

        Q.Template.render("Assets/web3/invoice", {
            payTitle: state.payTitle,
            recipient: tool.recipient,
            //minimizedWallet: Q.Assets.NFT.Web3.minimizeAddress(owner, 20, 3)
            minimizedWallet: (tool.recipient.wallet).substring(0, 20 - 3 - 3) + "..." + (tool.recipient.wallet).slice(-3)
        }, function (err, html) {
            if (err) {
                return;
            }

            Q.replace(tool.element, html);
            //Q.activate(tool.element);

            var uniswapRouter;
            var uniswapRouterFactory;
            var recipientToken;
            
            // replace invoice token address to the tokenname
            Q.Users.Web3.getContract(
                "Assets/templates/ERC20", 
                {
                    contractAddress: tool.recipient.token,
                    chainId: tool.recipient.chainId
                }
            ).then(function (contract) {
                var p = [];
                p.push(contract.decimals());
                p.push(contract.name());
                return Promise.allSettled(p);
            }).then(function (_ref) {
//                var dpl = _ref[0].value;
//                var name = _ref[1].value;
                tool.recipient.tokendpl = _ref[0].value;
                var $token = $(".Assets_web3_invoice_token", tool.element);
                if ($token.length != 0) {
                    Q.replace($token[0], _ref[1].value);
                }
            }).catch(function(err){
                if (err) {
                    console.warn(err);
                }
            });
            
            tool._getUniswapRouter().then(function (contract) {
                uniswapRouter = contract;
                return uniswapRouter.factory();
            }).then(function (factoryAddr) {
                return Q.Users.Web3.getContract(
                    "Assets/templates/Uniswap/V2/Factory", 
                    {
                        contractAddress: factoryAddr,
                        chainId: tool.recipient.chainId
                    }
                )
            }).then(function (obj) {
                uniswapRouterFactory = obj;
                return uniswapRouter.WETH();
            }).then(function (weth_) {
                state.WrapCoin = weth_;
                return Q.Users.Web3.getWalletAddress();
            }).then(function (walletAddress) {
                
                return Q.Assets.Currencies.balanceOf(walletAddress, tool.recipient.chainId);
            }).then(function (balances) {

                var p = [];
                var balances_res = [];
                
                
                //p.push(new Promise(function (resolve, reject) {resolve(balances)}));
                
                Q.each(balances, function (i, item) {
                    if (
                        item.token_address == Q.Assets.Web3.constants.zeroAddress ||
                        item.token_address == tool.recipient.token ||
                        tool.recipient.accept.includes(item.token_address)
                    ) {
                
                        p.push(
                            uniswapRouterFactory.getPair(
                                (
                                    (item.token_address == Q.Assets.Web3.constants.zeroAddress)
                                    ?
                                    state.WrapCoin
                                    :
                                    item.token_address
                                )
                                ,
                                tool.recipient.token
                            )
                        );
                        balances_res.push(item)
                    }
                });
                p.unshift(new Promise(function (resolve, reject) {resolve(balances_res)}))

                return Promise.allSettled(p);
            }).then(function (_ref) {

                var balances = _ref.shift(0);

                var ret = [];
                _ref.forEach(function(i, index){
                    // if pair exists the pair address should be not zero
                    // except the case whn both pairs are identical -> so no need to swap 
                    if (
                            (balances.value[index].token_address.toLowerCase() == tool.recipient.token.toLowerCase())
                            ||
                            (i.status == 'fulfilled' && i.value != Q.Assets.Web3.constants.zeroAddress)
                        ) {
                        ret.push({
                            tokenAmount: tool._parseAmount(balances.value[index].balance),
                            tokenName: balances.value[index].name,
                            tokenAddress: balances.value[index].token_address,
                            decimals: balances.value[index].decimals
                        });
                    }
                })
                return ret;
            }).then(function (selectOptions) {
                
                $toolElement.removeClass("Q_working");
                
                Q.Template.render("Assets/web3/invoice/select", {
                    results: selectOptions
                }, function (err, html) {
                    if (err) {
                        return;
                    }

                    Q.replace($(".Assets_web3_invoice_select", tool.element)[0], html);

                    state.$selectTokens = $("select[name=tokens]", tool.element);

                    state.$selectTokens.off("change").on("change", function () {
                        tool._updateInfo(
                            state.$selectTokens.find(':selected').data('address'),//"Parameter 1", 
                            state.$selectTokens.find(':selected').data('amount')//"Parameter 2"
                        )
                        if (state.timeoutID !== null) {
                            clearTimeout(state.timeoutID);
                            state.timeoutID = null;
                        }
                        state.timeoutID = setTimeout(function run() {
                            tool._updateInfo(
                                state.$selectTokens.find(':selected').data('address'),//"Parameter 1", 
                                state.$selectTokens.find(':selected').data('amount')//"Parameter 2"
                            )
                            state.timeoutID = setTimeout(run, 15000);
                        }, 15000);
                    }).trigger('change');
                      
                    ////////////////////////
                    $("button[name=pay]", tool.element).off(Q.Pointer.click).on(Q.Pointer.click, function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        var invokeObj = Q.invoke({
                            title: tool.text.title,
                            template: {
                                name: 'Assets/web3/invoice/interface',
                                fields: {},
                            },
                            className: 'Assets_web3_invoice_interface',

                            trigger: tool.element,
                            onActivate: function (element) {

                                var erc20Contract;
                                var uniswapRouter;

                                var fixedNeedToPayAmount = state.needToPayAmount;
                                // add 5%
                                fixedNeedToPayAmount = fixedNeedToPayAmount.add(fixedNeedToPayAmount.mul(5).div(100));

                                var fixedNeedToPayPath = state.needToPayPath;

                                var p = [];
                                p.push(tool._getUniswapRouter());
                                p.push(Q.Users.Web3.getContract(
                                    "Assets/templates/ERC20", 
                                    {
                                        contractAddress: state.needToPayPath[0],
                                        chainId: tool.recipient.chainId
                                    }
                                ));
                        
                                Promise.allSettled(p).then(function(d){

                                    uniswapRouter = d[0].value;
                                    erc20Contract = d[1].value;

                                    var p = [];
                                    var way = 0;
 
                                    if (state.needToPayPath[0] == Q.Assets.Web3.constants.zeroAddress) {
                                        // send eth to uniswap
                                        way = 1;
                                        return way;
                                    } else if (state.needToPayPath[0] == tool.recipient.token) {
                                        // just direct send tokens without approve
                                        way = 2;
                                        return way;
                                    } else {
                                        // else check allowance.
                                        // if enough = make onestep form =  just swap // way 3
                                        // if enough = make two step form = approve and swap  // way 4

                                        return erc20Contract.allowance(
                                            Q.Users.Web3.getSelectedXid(),
                                            tool.recipient.uniswapRouter
                                        ).then(function(allowance){

                                            if (allowance.gte(fixedNeedToPayAmount)) {
                                                return 3; //way=3
                                            } else {
                                                return 4; //way=4
                                            }
                                        }).catch(function (err) {
                                            console.log(err);
                                        });
                                    }
                                }).then(function (way) {

                                    var steps, title;
                                    if (way == 0) {
                                        reject("cant find the way");
                                    } else if (way == 1) {
                                        steps = [{"title": tool.text.steps.sending_native_coins}];
                                        title = tool.text.steps.one_tx;
                                    } else if (way == 2) {
                                        steps = [{"title": tool.text.steps.sending_tokens}];
                                        title = tool.text.steps.one_tx;
                                    } else if (way == 3) {
                                        steps = [{"title": tool.text.steps.swap}];
                                        title = tool.text.steps.one_tx;
                                    } else if (way == 4) {
                                        steps = [{"title": tool.text.steps.approve}, {"title": tool.text.steps.swap}];
                                        title = tool.text.steps;
                                    }

                                    Q.replace($(".Assets_web3_invoice_interface_title", element)[0], title);

                                    Q.Template.render("Assets/web3/invoice/interface/steps", {
                                        steps: steps
                                    }, function (err, html) {
                                        if (err) {
                                            return;
                                        }
                                        Q.replace($(".Assets_web3_invoice_interface_steps", element)[0], html);
                                    });

                                    return way;
                                }).then(function (way) {    
                                    $('.step0 .bi-asterisk', element).addClass('animate');
                                    if (way == 1) {
                                        // state.wrappedToken
                                        // first address are zero  this means that swap must be from native coins
                                        // so replaces it on wrapped
                                        fixedNeedToPayPath[0] = state.wrappedToken;

                                        return uniswapRouter.swapETHForExactTokens(
                                            ethers.utils.parseUnits(tool.recipient.amount.toString(),tool.recipient.tokendpl), // uint amountOut,
                                            fixedNeedToPayPath,// address[] calldata path,
                                            tool.recipient.wallet,// address to,
                                            tool.state.swapDeadlineTs, //'2524611661', // uint deadline (GMT): Saturday, January 1, 2050 1:01:01 AM
                                            { value: fixedNeedToPayAmount }
                                        ).then(function (tx) {
                                            return tx.wait();
                                        }).then(function (receipt) {
                                            if (receipt.status == 0) {
                                                throw 'Smth unexpected';
                                            }
                                            Q.Template.render("Assets/web3/invoice/interface/check", {}, function (err, html) {
                                                $('.step0', element).html(html);
                                            });
                                        });

                                    }
                                    if (way == 2) {
                                        return erc20Contract.transfer(
                                            tool.recipient.wallet, 
                                            ethers.utils.parseUnits(tool.recipient.amount.toString(),tool.recipient.tokendpl)
                                        ).then(function (tx) {
                                            return tx.wait();
                                        }).then(function (receipt) {
                                            if (receipt.status == 0) {
                                                throw 'Smth unexpected';
                                            }
                                            Q.Template.render("Assets/web3/invoice/interface/check", {}, function (err, html) {
                                                $('.step0', element).html(html);
                                            });
                                        });
                                    }
                                    if (way == 3) {
                                        return uniswapRouter.swapTokensForExactTokens(
                                            ethers.utils.parseUnits(tool.recipient.amount.toString(),tool.recipient.tokendpl), // uint amountOut,
                                            fixedNeedToPayAmount, // uint amountInMax,
                                            fixedNeedToPayPath,// address[] calldata path,
                                            tool.recipient.wallet,// address to,
                                            tool.state.swapDeadlineTs, //'2524611661' // uint deadline (GMT): Saturday, January 1, 2050 1:01:01 AM
                                        ).then(function (tx) {
                                            return tx.wait();
                                        }).then(function (receipt) {
                                            if (receipt.status == 0) {
                                                throw 'Smth unexpected';
                                            }
                                            Q.Template.render("Assets/web3/invoice/interface/check", {}, function (err, html) {
                                                $('.step0', element).html(html);
                                            });
                                        });
                                    }

                                    if (way == 4) {
                                        return erc20Contract.approve(
                                            tool.recipient.uniswapRouter,
                                            fixedNeedToPayAmount
                                        ).then(function (tx) {
                                            return tx.wait();
                                        }).then(function (receipt) {
                                            if (receipt.status == 0) {
                                                throw 'Smth unexpected';
                                            }
                                            Q.Template.render("Assets/web3/invoice/interface/check", {}, function (err, html) {
                                                $('.step0', element).html(html);
                                                $('.step1 .bi-asterisk', element).addClass('animate');
                                            });
                                        }).then(function () {	
                                            return uniswapRouter.swapTokensForExactTokens(
                                                ethers.utils.parseUnits(tool.recipient.amount.toString(),tool.recipient.tokendpl), // uint amountOut,
                                                fixedNeedToPayAmount, // uint amountInMax,
                                                fixedNeedToPayPath,// address[] calldata path,
                                                tool.recipient.wallet,// address to,
                                                tool.state.swapDeadlineTs, //'2524611661' // uint deadline (GMT): Saturday, January 1, 2050 1:01:01 AM
                                              ); // external returns (uint[] memory amounts);
                                        }).then(function (tx) {
                                            return tx.wait();
                                        }).then(function (receipt) {
                                            if (receipt.status == 0) {
                                                throw 'Smth unexpected';
                                            }
                                            Q.Template.render("Assets/web3/invoice/interface/check", {}, function (err, html) {
                                                $('.step1', element).html(html);
                                            });
                                        })
                                    }
                                }).then(function () { 
                                    Q.replace($(".Assets_web3_invoice_interface_title", element)[0], "Successfull");
                                    Q.replace($(".Assets_web3_invoice_interface_steps", element)[0], tool.state.successfullMsg);
                                    return new Promise((resolve, reject) => {
                                        setTimeout(resolve, 5000); // 5 sec
                                    });
                                }).catch(function (err) {

                                    Q.Notices.add({
                                        content: Q.Users.Web3.parseMetamaskError(err, [erc20Contract, uniswapRouter]),
                                        timeout: 5
                                    });
                                }).finally(function(){
                                    invokeObj.close();
                                    tool._refresh();
                                });
                            }
                        });

                    });
                        
                });
          
            }).catch(function (e) {
                console.warn(e);
//                if (!state.chainId) {
//                    
//                    tool.refresh();
//                }
            });

        });
    },
});
    
Q.Template.set("Assets/web3/invoice",
    `
    
    <div class="form-group row">
        <div class="col-sm-12">
            {{#if payTitle}}
                {{payTitle}}
            {{else}}
            Pay {{recipient.amount}} <span class="Assets_web3_invoice_token">{{recipient.token}}</span>  to {{minimizedWallet}}
            {{/if}}
        </div>
    </div>
    <div class="form-group row">
        <div class="col-sm-12">
            <div class="Assets_web3_invoice_select"></div>
        </div>
    </div>
    <!--
    <div class="form-group row">
        <label class="col-sm-5 col-form-label">{{form.fields.labels.funds_to_pay}}</label>
        <div class="col-sm-7">
            <div class="Assets_web3_invoice_select"></div>
        </div>
    </div>
    -->
    <div class="form-group row">
        <div class="col-sm-12 Assets_web3_invoice_info"></div>
    </div>
    <div class="row Assets_web3_invoice_btnContainer">
        <div class="col-sm-3"></div>
        <div class="col-sm-6">
            <button type="submit" name="pay" class="Q_button Assets_web3_invoice_btnPay">{{form.btns.pay}}</button>
        </div>
    </div>
        `,
    {text: ['Assets/content', "Assets/web3/invoice"]}
);
Q.Template.set('Assets/web3/invoice/disabledState',
`
<div class="row">
    <div class="col-sm-12">
        {{msg}}
    </div>
</div>
`,
    {text: ['Assets/content']}
);

Q.Template.set('Assets/web3/invoice/select',
`<select name="tokens" data-count="{{results.length}}">
	{{#each results}}
		<option data-amount="{{this.tokenAmount}}" data-name="{{this.tokenName}}" data-address="{{this.tokenAddress}}" data-decimals="{{this.decimals}}">{{this.tokenName}} {{this.tokenAmount}}</option>
	{{/each}}
</select>`);

Q.Template.set("Assets/web3/invoice/interface",`
    <div class="Assets_web3_invoice_interface">
        <div class="Assets_web3_invoice_interface_title">
        </div>
        <div class="Assets_web3_invoice_interface_steps">
        </div>
    </div>
`,{text: ["Assets/content"]});

Q.Template.set("Assets/web3/invoice/interface/steps",
`
    <table class="table table-stripe">
        {{#each steps}}
            <tr>
            <td>{{this.title}}</td>
            <td class="steps step{{@index}}">
                {{> "Assets/web3/invoice/interface/asterisk"}}
            </td>
            </tr>
        {{/each}}
    </table>
`,
    {
        text: ["Assets/content"],
        partials:[
            "Assets/web3/invoice/interface/check",
            "Assets/web3/invoice/interface/asterisk"
        ]
    }
);

Q.Template.set("Assets/web3/invoice/interface/check",
`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
        <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
    </svg>
`,
    {text: ["Assets/content"]}
);

Q.Template.set("Assets/web3/invoice/interface/asterisk",
`
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-asterisk" viewBox="0 0 16 16">
        <path d="M8 0a1 1 0 0 1 1 1v5.268l4.562-2.634a1 1 0 1 1 1 1.732L10 8l4.562 2.634a1 1 0 1 1-1 1.732L9 9.732V15a1 1 0 1 1-2 0V9.732l-4.562 2.634a1 1 0 1 1-1-1.732L6 8 1.438 5.366a1 1 0 0 1 1-1.732L7 6.268V1a1 1 0 0 1 1-1z"/>
    </svg>
`,
    {text: ["Assets/content"]}
);
    
})(window, Q, Q.jQuery);
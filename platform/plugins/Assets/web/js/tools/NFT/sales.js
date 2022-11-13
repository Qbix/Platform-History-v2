(function (window, Q, $, undefined) {
	
/**
 * @module Assets
 */
	
/**
 * YUIDoc description goes here
 * @class Assets cool
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.publisherId] user id of the publisher of the stream
 *  @param {String} [options.streamName] the stream's name
 *  @param {Q.Event} [options.onMove] Event that fires after a move
 */

Q.Tool.define("Assets/NFT/sales", function (options) {
	var tool = this;
	var state = tool.state;
        
        // fill missed attr fields
        for (var i in state.fields) {
            
            if (typeof(state.fields[i]) === "string") {
                state.fields[i] = {
                    value: state.fields[i],
                    hide: false
                }
            } else if (typeof(state.fields[i]) === "object") {
                if (Q.isEmpty(state.fields[i]["value"])) {
                    state.fields[i]["value"] = "";
                }
                if (Q.isEmpty(state.fields[i]["hide"])) {
                    state.fields[i]["hide"] = false;
                }
            }
        }
        
        if (Q.isEmpty(state.nftSaleAddress)) {
            return console.warn("nftSaleAddress required!");
        }
        if (Q.isEmpty(state.contractAddress)) {
            return console.warn("contractAddress required!");
        }
        
	var p = Q.pipe(['stylesheet', 'text'], function (params, subjects) {
		tool.text = params.text[1];
                
                Q.Users.Web3.onAccountsChanged.set(function () {
                    tool.refresh();
                }, tool);
                
		tool.refresh();
	});
        Q.addStylesheet("{{Assets}}/css/tools/NFT/sales.css", p.fill('stylesheet'), { slotName: 'Assets' });
	Q.Text.get('Assets/content', p.fill('text'));
},

{ // default options here
    fields: {
        account: {value: "", hide: false},
        amount: {value: "", hide: false}
    },
    nftSaleAddress: '',
    contractAddress: '',
    abiNftSales: "Assets/templates/R1/NFT/sales/contract",
    abiNft: "Assets/templates/R1/NFT/contract",
    onMove: new Q.Event() // an event that the tool might trigger
},

{ // methods go here
    specialPurchase: function(
        account,
        amount,
        callback
    ) {
        let contract;
        Q.Users.Web3.getContract(state.abiNftSales, this.state.nftSaleAddress)
        .then(function (_contract) {
            contract = _contract;
            if (state.paymentCurrency != "0x0000000000000000000000000000000000000000") {
                Q.alert("not supported yet");
                // need approve before.  we can do it here 
            }
            let calculateTotalAmount = (state.paymentPrice).mul(amount);
            //ethers.utils.parseEther("0.1")
            return contract.specialPurchase(account,amount, {value: calculateTotalAmount});
        }).then(function () {
            //                        err,  data, contract
            Q.handle(callback, null, [null, null, contract])
        }).catch(function (err) {
            console.warn(err);
            Q.handle(callback, null, [err.reason || err]);
        });
    },
    getSeriesId: function (callback) {
        
        var state = this.state;
        
        return Q.Users.Web3.getContract(state.abiNftSales, state.nftSaleAddress)
        .then(function (contract) {
           return contract.seriesId();
        }).catch(function(err) {
            console.warn(err);
            Q.handle(callback, null, [err.reason || err]);
        });
    },
    getSeriesPrice: function (seriesId, callback) {
        
        var state = this.state;

        return Q.Users.Web3.getContract(state.abiNft, state.contractAddress)
        .then(function (contract) {
            return contract.seriesInfo(seriesId);
        }).catch(function(err) {
            console.warn(err);
            Q.handle(callback, null, [err.reason || err]);
        });
    },
    purchase: function(
        account, // address
        amount, // uint256
        callback
    ) {
        var tool = this;
        var state = this.state;
        
       
        tool.getSeriesId().then((seriesId) => {
            return tool.getSeriesPrice(seriesId).then((data) => {
                if (data.saleInfo.currency != "0x0000000000000000000000000000000000000000") {
                    Q.alert("not supported yet");    
                    return;
                } else {
                    let calculateTotalAmount = (data.saleInfo.price).mul(amount);
                    
                    let contract;
                    return Q.Users.Web3.getContract(state.abiNftSales, state.nftSaleAddress)
                    .then(function (_contract) {
                        contract = _contract;
                        //ethers.utils.parseEther("0.1")
                        return contract.purchase(account,amount, {value: calculateTotalAmount});
                    }).then(function () {
                        //                        err,  data, contract
                        Q.handle(callback, null, [null, null, contract])
                    }).catch(function (err) {
                        
                        Q.Notices.add({
                            content: `SeriesID #${seriesId}" is not on sale. Or Metamask error happens`,
                            timeout: 5
                        });
                        console.warn(err);
                        Q.handle(callback, null, [err.reason || err]);
                    });

                }
            }).catch(function (err) {
                console.warn(err);
                Q.handle(callback, null, [err.reason || err]);
            });
        })

        
        
        
            
    },
    
    //isInWhitelist: function(account) {},

    /**
     * Refreshes the appearance of the tool completely
     * @method getMyStream
     * @param {Function} callback receives arguments (err) with this = stream
     */
    refresh: function () {
        
        var tool = this;
        var state = tool.state;

        // if user login then 
        Q.Template.render(
            "Assets/NFT/sales", 
            {
                fields:state.fields,
                nftSaleAddress: state.nftSaleAddress
            },
            function(err, html){
                
                tool.element.innerHTML = html;

                var state = tool.state;
                
                Q.activate(tool.element, function(){
                    
                });
                    
                Q.Users.Web3.getContract(state.abiNftSales, state.nftSaleAddress)
                .then(function (contract) {
                    contract.isWhitelisted(Q.Users.Web3.getSelectedXid()).then(function (isInWhitelist) {
                        let specialPurchaseBtn = $(tool.element).find(".Assets_sales_specialPurchase");
                        if (isInWhitelist) {
                            specialPurchaseBtn.removeClass("Q_disabled");
                        } else {
                            specialPurchaseBtn.addClass("Q_disabled");
                        }

                        //Q.handle(callback, null, [null, tokensAmount]);
                    }, function (err) {

                        Q.handle(null, null, [err.reason]);
                    });
                    
                    contract.owner().then(function (ownerAddress) {
   
                        if (Q.Users.Web3.getSelectedXid() == ownerAddress) {
                            Q.Template.render(
                                "Assets/NFT/sales/whitelist", 
                                {},
                                function(err, html){}
                            );
                        }

                        //Q.handle(callback, null, [null, tokensAmount]);
                    }, function (err) {

                        Q.handle(null, null, [err.reason]);
                    });

                    // get specialPrice
                    contract.price().then(function (currency) {
                       state.paymentPrice = currency;
                    }, function (err) {
                        Q.handle(null, null, [err.reason]);
                    });
                    // 
                    // get paymentToken
                    contract.currency().then(function (currency) {
                       state.paymentCurrency = currency;
                    }, function (err) {
                        Q.handle(null, null, [err.reason]);
                    });
                });
                
                        
                $('.Assets_sales_purchase', tool.element).on(Q.Pointer.fastclick, function(){

                    //collect form
                    let account = $(tool.element).find("[name='account']").val();
                    account = account || state.fields.account.value || Q.Users.Web3.getLoggedInUserXid();
                    
                    let amount = $(tool.element).find("[name='amount']").val();
                   
                    // call 
                    tool.purchase(account, amount);

                });
                
                $('.Assets_sales_specialPurchase', tool.element).on(Q.Pointer.fastclick, function(){

                    //collect form
                    let account = $(tool.element).find("[name='account']").val();
                    account = account || state.fields.account.value || Q.Users.Web3.getLoggedInUserXid();
                    
                    let amount = $(tool.element).find("[name='amount']").val();
                   
                    // call 
                    tool.specialPurchase(account, amount);

                });
            }
        );

	}
	
});

Q.Template.set("Assets/NFT/sales", 
    `<div>
        <div class="form">
            <div class="form-group">
                <label>{{NFT.sales.instance.form.labels.account}}</label>
                <input name="account" type="text" class="form-control" placeholder="{{NFT.sales.instance.placeholders.account}} {{NFT.sales.instance.placeholders.optional}}">
                <small class="form-text text-muted">{{NFT.sales.instance.form.small.account}}</small>
            </div>
            <div class="row">
                <div class="col-sm-6">
                    <div class="form-group">
                        <label>{{NFT.sales.instance.form.labels.amount}}</label>
                        <input name="amount" type="text" class="form-control" placeholder="{{NFT.sales.instance.placeholders.integer}}">
                        <small class="form-text text-muted">{{NFT.sales.instance.form.small.amount}}</small>
                    </div>
                </div>
            </div>
    
            <button class="Assets_sales_purchase Q_button">{{NFT.sales.instance.btn.Purchase}}</button>
            <button class="Assets_sales_specialPurchase Q_button">{{NFT.sales.instance.btn.SpecialPurchase}}</button>
            
            <div class="form-group">
                {{&tool "Assets/NFT/sales/whitelist" nftSaleAddress=nftSaleAddress abiPath=abiNftSales}}
            </div>
        </div>
    
    </div>
    
    `,
{ text: ["Assets/content"] }
);

})(window, Q, jQuery);
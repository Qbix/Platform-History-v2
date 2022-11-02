
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

Q.Tool.define("Assets/sales", function (options) {
	var tool = this;
	var state = tool.state;
        
        if (Q.isEmpty(state.abiPath)) {
            return console.warn("abiPath required!");
        }
        if (Q.isEmpty(state.nftSaleAddress)) {
            return console.warn("nftSaleAddress required!");
        }
        
	var p = Q.pipe(['stylesheet', 'text'], function (params, subjects) {
		tool.text = params.text[1];
                
		tool.refresh();
	});
        Q.addStylesheet("{{Assets}}/css/tools/NFT/sales.css", p.fill('stylesheet'), { slotName: 'Assets' });
	Q.Text.get('Assets/content', p.fill('text'));
},

{ // default options here
    nftSaleAddress: '',
    abiPath: '',    
    onMove: new Q.Event() // an event that the tool might trigger
},

{ // methods go here
    specialPurchase: function(
        seriesId,
        account,
        amount
    ) {
    },

    purchase: function(
        seriesId, // uint64
        account, // address
        amount // uint256
    ) {
          /*  
            Q.Assets.NFT.Web3.checkProvider(
                Q.Assets.NFT.defaultChain, 
                function (err, contract) { 
                    contract.produce(NFTContract, owner, currency, price, beneficiary, autoindex, duration, rateInterval, rateAmount).then(function () {
                        console.log("#2"); 
                        //Q.handle(callback, null, [null, tokensAmount]);
                    }, function (err) {
                        console.log("#2-err", err); 
                        //Q.handle(callback, null, [err.reason]);
                    });
                }, 
                {
                    contractAddress: Q.Assets.NFT.sales.factory[Q.Assets.NFT.defaultChain.chainId], 
                    abiPath: "TokenSociety/templates/NFTSales"
                }
            );
             */          
    },
    /**
     * Refreshes the appearance of the tool completely
     * @method getMyStream
     * @param {Function} callback receives arguments (err) with this = stream
     */
    refresh: function () {
        
        var tool = this;
        var state = tool.state;

        state.a = Date.now();

        //var t = tool.getMultiple(3,5);

        // if user login then 
        Q.Template.render(
            "Assets/sales", 
            {
                TestParam: "Lorem ipsum dolor sit amet",
                test: state.a
            },
            function(err, html){
                
                tool.element.innerHTML = html;

                //var $form = $("form[name=whiteList]");
                /*
                $('.jsProduce', tool.element).on(Q.Pointer.fastclick, function(){

                    //collect form
                    let NFTContract = $(tool.element).find("[name='NFTContract']").val();
                    NFTContract = NFTContract ? NFTContract : TokenSociety.NFT.contract.address;

                    let owner = $(tool.element).find("[name='owner']").val();
                    owner = owner ? owner : Q.Users.Web3.getLoggedInUserXid();

                    let currency = $(tool.element).find("[name='currency']").val();
                    let price = ethers.utils.parseEther(
                        $(tool.element).find("[name='price']").val()
                    );
                    let beneficiary = $(tool.element).find("[name='beneficiary']").val();
                    let autoindex = $(tool.element).find("[name='autoindex']").val();
                    let duration = $(tool.element).find("[name='duration']").val();
                    let rateInterval = $(tool.element).find("[name='rateInterval']").val();
                    let rateAmount = $(tool.element).find("[name='rateAmount']").val();
                    // call produce
                    tool.produce(NFTContract, owner, currency, price, beneficiary, autoindex, duration, rateInterval, rateAmount);

                });

                $('.jsTestFill', tool.element).on(Q.Pointer.fastclick, function(){
                    $(tool.element).find("[name='NFTContract']").val('0x7AfF6E4A3B7071E17F5dFe9883c1511d22127B7A');
                    $(tool.element).find("[name='owner']").val('0x4aC71bd9f784fA6090E9dC3EE0e61dC085e22Ef4');
                    //$(tool.element).find("[name='owner']").val('0xb2dC1610f021E2a92d531fd6e60f1E01b372eC36');

                    $(tool.element).find("[name='currency']").val('0x0000000000000000000000000000000000000000');
                    $(tool.element).find("[name='price']").val("1");
                    $(tool.element).find("[name='beneficiary']").val('0x4aC71bd9f784fA6090E9dC3EE0e61dC085e22Ef4');
                    $(tool.element).find("[name='autoindex']").val(3);
                    $(tool.element).find("[name='duration']").val(4);
                    $(tool.element).find("[name='rateInterval']").val(0);
                    $(tool.element).find("[name='rateAmount']").val(0);
                });

                $('.jsInstancesList', tool.element).on(Q.Pointer.fastclick, function(){
                    //owner = owner ? owner : Q.Users.Web3.getLoggedInUserXid();
                    tool.whitelistByNFT(TokenSociety.NFT.contract.address, function(err, data){

                        let obj = $(tool.element).find(".list");
                        obj.html('');
                        obj.append("<h3>List by NFT</h3>");

                        for (var i in data.list) {
                            obj.append(`<div class="col-sm-12"><a href="/test2/${data.list[i]}">${data.list[i]}</a></div>`);
                        }

                    });

                });
                */
            }
        );


            // if not 
            // Q.Template.render("error template");
//            
//           factoryaddress
//           nft contract
//           
	}
	
});

Q.Template.set("Assets/sales", 
    `<div>
        <div class="form">
            <div class="form-group">
                <label>{{NFT.sales.factory.form.labels.duration}}</label>
                <input name="amount" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.uint64}}">
                <small class="form-text text-muted">{{NFT.sales.factory.form.small.duration}}</small>
            </div>
    
            <button class="jsProduce Q_button">{{NFT.sales.form.qq}}</button>
            <button class="jsProduce Q_button">{{NFT.sales.factory.produce}}</button>
            <button class="jsInstancesList Q_button">[instances list]</button>
            <div class="list row">
            </div>
        </div>
    
    </div>
    
    `,
{ text: ["Assets/content"] }
);

})(window, Q, jQuery);
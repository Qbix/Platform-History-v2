(function (window, Q, $, undefined) {
	
/**
 * @module TokenSociety
 */
	
/**
 * YUIDoc description goes here
 * @class TokenSociety cool
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.fields] array of values by default. 
 *  @param {String} [options.abiPath] ABI for NFTSalesFactory
 *  @param {Q.Event} [options.onMove] Event that fires after a move
 */

Q.Tool.define("Assets/NFT/sales/factory", function (options) {
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

        if (Q.isEmpty(state.abiPath)) {
            return console.warn("abiPath required!");
        }
        
	var p = Q.pipe(['stylesheet', 'text'], function (params, subjects) {
		tool.text = params.text[1];
		tool.refresh();
	});
        
	Q.addStylesheet("{{Assets}}/css/tools/NFT/sales/factory.css", p.fill('stylesheet'), { slotName: 'Assets' });
	Q.Text.get('Assets/content', p.fill('text'));
},

{ // default options here
    fields: {
        NFTContract: {value: "", hide: false},
        seriesId: {value: "", hide: false},
        owner: {value: "", hide: false},
        currency: {value: "", hide: false},
        price: {value: "", hide: false},
        beneficiary: {value: "", hide: false},
        autoindex: {value: "", hide: false},
        duration: {value: "", hide: false},
        rateInterval: {value: "", hide: false},
        rateAmount: {value: "", hide: false}
    },
    abiPath: "",
    onMove: new Q.Event() // an event that the tool might trigger
},

{ // methods go here
    whitelistByNFT: function(NFTContract, callback){
        Q.Assets.NFT.Web3.checkProvider(
                Q.Assets.NFT.defaultChain, 
                function (err, contract) { 
                    contract.whitelistByNFT(NFTContract).then(function (instancesList) {
                        Q.handle(callback, null, [null, {list: instancesList}, contract]);
                    }, function (err) {
                        Q.handle(callback, null, [err.reason]);
                    });
                }, 
                {
                    contractAddress: Q.Assets.NFT.sales.factory[Q.Assets.NFT.defaultChain.chainId], 
                    abiPath: "TokenSociety/templates/NFTSalesFactory"
                }
            );
    },
    /**
     * @notice create NFTSales instance
     * @param NFTContract NFTcontract's address that allows to mintAndDistribute for this factory
     * @param seriesId series ID in which tokens will be minted
     * @param owner owner's adddress for newly created NFTSales contract
     * @param currency currency for every sale NFT token
     * @param price price amount for every sale NFT token
     * @param beneficiary address where which receive funds after sale
     * @param autoindex from what index contract will start autoincrement from each series(if owner doesnot set before) 
     * @param duration locked time when NFT will be locked after sale
     * @param rateInterval interval in which contract should sell not more than `rateAmount` tokens
     * @param rateAmount amount of tokens that can be minted in each `rateInterval`
     * @return instance address of created instance `NFTSales`
     */
    produce: function(
        NFTContract, //address 
        seriesId, //uint256         
        owner, //address 
        currency, //address 
        price, //uint256 
        beneficiary, //address 
        autoindex, //uint192 
        duration, //uint64 
        rateInterval, //uint32 
        rateAmount //uint16 
        ) {

            var state = this.state;

            Q.Assets.NFT.Web3.checkProvider(
                Q.Assets.NFT.defaultChain, 
                function (err, contract) {

                    contract.produce(NFTContract, seriesId, owner, currency, price, beneficiary, autoindex, duration, rateInterval, rateAmount).then(function () {

                        //console.log("#2"); 
                        //Q.handle(callback, null, [null, tokensAmount]);
                    }, function (err) {
                        console.log(err); 
                        //Q.handle(callback, null, [err.reason]);
                    });
                }, 
                {
                    contractAddress: Q.Assets.NFT.sales.factory[Q.Assets.NFT.defaultChain.chainId], 
                    abiPath: state.abiPath
                }
            );
        },
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
                "Assets/NFT/sales/factory", 
                {
                    TestParam: "Lorem ipsum dolor sit amet",
                    fields:state.fields,
                    chainId: Q.Assets.NFT.defaultChain.chainId
                },
                function(err, html){
                    
                    tool.element.innerHTML = html;
                    Q.activate(tool.element, function(){
                        $(tool.element).find("select").addClass("form-control");
                    });

                    tool.currency = null;
                    /*
                    $(tool.element).find(".Assets_web3_currencies").tool("Assets/web3/currencies", {
                        chainId: Q.Assets.NFT.defaultChain.chainId
                    }).activate(function(){
                        this.state.onChoose.add(function(err, obj){
                            
                            tool.currency = obj;
                            
                        }, tool);
                    });
                    */
                    //var $form = $("form[name=whiteList]");
                    
                    $('.jsProduce', tool.element).on(Q.Pointer.fastclick, function(){
                        
                        //collect form
                        let NFTContract = $(tool.element).find("[name='NFTContract']").val();
                        
                        NFTContract = state.fields.NFTContract.value || NFTContract;// || TokenSociety.NFT.contract.address;
                        
                        let owner = $(tool.element).find("[name='owner']").val();
                        owner = owner || state.fields.owner.value || Q.Users.Web3.getSelectedXid();
                        
                        let seriesId   = state.fields.seriesId.value || $(tool.element).find("[name='seriesId']").val();
                        
                        let currency = state.fields.currency.value || $(tool.element).find("[name='currency']").val();
                        let price = $(tool.element).find("[name='price']").val()
                        price = 
                                price 
                                ? 
                                ethers.utils.parseUnits(price,18)
                                :
                                state.fields.price.value
                                ;
                        let beneficiary = $(tool.element).find("[name='beneficiary']").val();
                        beneficiary = beneficiary || state.fields.beneficiary.value || Q.Users.Web3.getSelectedXid();
                        
                        let autoindex   = state.fields.autoindex.value || $(tool.element).find("[name='autoindex']").val();
                        let duration    = state.fields.duration.value || $(tool.element).find("[name='duration']").val();
                        let rateInterval= state.fields.rateInterval.value || $(tool.element).find("[name='rateInterval']").val();
                        let rateAmount  = state.fields.rateAmount.value || $(tool.element).find("[name='rateAmount']").val();
                        // call produce
                        tool.produce(NFTContract, seriesId, owner, currency, price, beneficiary, autoindex, duration, rateInterval, rateAmount);
                        
                    });
                     
                    $('.jsTestFill', tool.element).on(Q.Pointer.fastclick, function(){
                        $(tool.element).find("[name='NFTContract']").val('0x7AfF6E4A3B7071E17F5dFe9883c1511d22127B7A');
                        $(tool.element).find("[name='owner']").val('0x4aC71bd9f784fA6090E9dC3EE0e61dC085e22Ef4');
                        $(tool.element).find("[name='seriesId']").val('3');
                        
                        $(tool.element).find("[name='currency']").val('0x0000000000000000000000000000000000000000');
                        $(tool.element).find("[name='price']").val("1");
                        $(tool.element).find("[name='beneficiary']").val('0x4aC71bd9f784fA6090E9dC3EE0e61dC085e22Ef4');
                        $(tool.element).find("[name='autoindex']").val(3);
                        $(tool.element).find("[name='duration']").val(4);
                        $(tool.element).find("[name='rateInterval']").val(0);
                        $(tool.element).find("[name='rateAmount']").val(0);
                    });
                    
                    $('.jsInstancesList', tool.element).on(Q.Pointer.fastclick, function(){
                        //owner = owner ? owner : Q.Users.Web3.getSelectedXid();
                        tool.whitelistByNFT(TokenSociety.NFT.contract.address, function(err, data){
                            
                            let obj = $(tool.element).find(".list");
                            obj.html('');
                            obj.append("<h3>List by NFT</h3>");

                            if (Q.isEmpty(data.list)) {
                                obj.append(`<div class="col-sm-12">There are no instances</div>`);
                            } else {
                                for (var i in data.list) {
                                    obj.append(`<div class="col-sm-12"><a href="/test2/${data.list[i]}">${data.list[i]}</a></div>`);
                                }

                            }
                            
                        });
                    
                    });
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

Q.Template.set("Assets/NFT/sales/factory", 
    `<div>
        <div class="form">

            {{#unless fields.NFTContract.hide}}
            <!-- address NFTContract, -->
            <div class="form-group">
                <label>{{NFT.sales.factory.form.labels.NFTContract}}</label>
                <input name="NFTContract" type="text" class="form-control" value="{{fields.NFTContract.value}}" placeholder="{{NFT.sales.factory.placeholders.address}} {{NFT.sales.factory.placeholders.optional}}">
                <small class="form-text text-muted">{{NFT.sales.factory.form.small.NFTContract}}</small>
            </div>
            {{/unless}}
    
            {{#unless fields.owner.hide}}
            <div class="form-group">
                <label>{{NFT.sales.factory.form.labels.owner}}</label>
                <input name="owner" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.address}} {{NFT.sales.factory.placeholders.optional}}">
                <small class="form-text text-muted">{{NFT.sales.factory.form.small.owner}}</small>
            </div>
            {{/unless}}
            
            {{#unless fields.seriesId.hide}}
            <div class="form-group">
                <label>{{NFT.sales.factory.form.labels.seriesId}}</label>
                <input name="seriesId" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.number}}">
                <small class="form-text text-muted">{{NFT.sales.factory.form.small.seriesId}}</small>
            </div>
            {{/unless}}
    
            <!-- uint256 price, -->
            <div class="row">
                <div class="col-sm-6">
                    {{#unless fields.price.hide}}
                    <div class="form-group">
                        <label>{{NFT.sales.factory.form.labels.price}}</label>
                        <input name="price" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.uint256}}">
                        <small class="form-text text-muted">{{NFT.sales.factory.form.small.price}}</small>
                    </div>
                    {{/unless}}
                </div>
                <div class="col-sm-6">
                    {{#unless fields.currency.hide}}
                    <label>{{NFT.sales.factory.form.labels.currency}}</label>
                    <div class="form-group">
                    {{&tool "Assets/web3/currencies" chainId=chainId }}
                    </div>
                    {{/unless}}
                </div>
            </div>
            {{#unless fields.beneficiary.hide}}
            <!-- address beneficiary, -->
            <div class="form-group">
                <label>{{NFT.sales.factory.form.labels.beneficiary}}</label>
                <input name="beneficiary" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.address}} {{NFT.sales.factory.placeholders.optional}}">
                <small class="form-text text-muted">{{NFT.sales.factory.form.small.beneficiary}}</small>
            </div>
            {{/unless}}
            <div class="row">
                <div class="col-sm-6">
                    {{#unless fields.autoindex.hide}}
                    <!-- uint192 autoindex, -->
                    <div class="form-group">
                        <label>{{NFT.sales.factory.form.labels.autoindex}}</label>
                        <input name="autoindex" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.uint192}}">
                        <small class="form-text text-muted">{{NFT.sales.factory.form.small.autoindex}}</small>
                    </div>
                    {{/unless}}
                    {{#unless fields.duration.hide}}
                    <!-- uint64 duration, -->
                    <div class="form-group">
                        <label>{{NFT.sales.factory.form.labels.duration}}</label>
                        <input name="duration" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.uint64}}">
                        <small class="form-text text-muted">{{NFT.sales.factory.form.small.duration}}</small>
                    </div>
                    {{/unless}}
                </div>
                <div class="col-sm-6">
                    {{#unless fields.rateInterval.hide}}
                    <!-- uint32 rateInterval, -->
                    <div class="form-group">
                        <label>{{NFT.sales.factory.form.labels.rateInterval}}</label>
                        <input name="rateInterval" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.uint32}}">
                        <small class="form-text text-muted">{{NFT.sales.factory.form.small.rateInterval}}</small>
                    </div>
                    {{/unless}}
                    {{#unless fields.rateAmount.hide}}
                    <!-- uint16 rateAmount -->
                    <div class="form-group">
                        <label>{{NFT.sales.factory.form.labels.rateAmount}}</label>
                        <input name="rateAmount" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.uint16}}">
                        <small class="form-text text-muted">{{NFT.sales.factory.form.small.rateAmount}}</small>
                    </div>
                    {{/unless}}
                </div>
            </div>
    
            <a class="jsTestFill" href="javascript:void(0)">[test fill]</a>
            <button class="jsProduce Q_button">{{NFT.sales.factory.produce}}</button>
            <button class="jsInstancesList Q_button">{{NFT.sales.factory.viewInstancesList}}</button>
            <div class="list row"></div>
        </div>
    
    </div>
    
    `,
{ text: ["Assets/content"] }
);

})(window, Q, jQuery);
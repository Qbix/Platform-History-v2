if (Q.isEmpty(Q["isAddress"])) {
    Q.isAddress = function _Q_isAddress(address) {
        // https://github.com/ethereum/go-ethereum/blob/aa9fff3e68b1def0a9a22009c233150bf9ba481f/jsre/ethereum_js.go#L2295-L2329
        if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
            // check if it has the basic requirements of an address
            return false;
        } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
            // If it's all small caps or all all caps, return true
            return true;
        } else {
            // Otherwise check each case
//            address = address.replace('0x','');
//            var addressHash = Web3.utils.sha3(address.toLowerCase());
//            for (var i = 0; i < 40; i++ ) {
//                // the nth letter should be uppercase if the nth digit of casemap is 1
//                if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
//                    return false;
//                }
//            }
            return true;
        }
        
    }
}

if (Q.isEmpty(Q["validate"])) {
    Q.validate = function _Q_validate(address) {
    
    }
    Q.validate.notEmpty = function _Q_validate_notEmpty(input) {
        return !Q.isEmpty(input)
    }
    Q.validate.integer = function _Q_validate_integer(input) {
        return Q.isInteger(input)
    }
    Q.validate.address = function _Q_validate_address(input) {
        return Q.isAddress(input)
    }
}
(function (window, Q, $, undefined) {
	
/**
 * @module Assets
 */
	
/**
 * Interface for working with Assets.NFT.Web3.Sales factories
 * and producing instances of Assets.NFT.Web3.Sales contracts.
 * @class Assets factory
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.fields] array of defaults for the values
 *  @param {String} [options.NFTcontract] pass the address of the NFT contract, to get the list of instances
 *  @param {String} [options.fields.NFTcontract.value] only if options.NFTcontract is not set
 *  @param {String} [options.fields.seriesId.value]
 *  @param {String} [options.fields.currency.value]
 *  @param {Number} [options.fields.price.value]
 *  @param {String} [options.fields.beneficiary.value]
 *  @param {Integer} [options.fields.autoindex.value]
 *  @param {String} [options.fields.duration.value]
 *  @param {String} [options.fields.rateInterval.value]
 *  @param {Integer} [options.fields.rateAmount.value]
 *  @param {Function} [options.fields.salesLinkTitle] Receives address and callacbk, and should call the callback with the title
 */

Q.Tool.define("Assets/NFT/sales/factory", function (options) {
	var tool = this;
	var state = tool.state;
        
        var defaultsValidate = {
            notEmpty: "<b>%key%</b> cannot be empty", 
            integer: "<b>%key%</b> must be an integer", 
            address: "<b>%key%</b> invalid"
        };
        
        // fill missed attr fields
        for (var i in state.fields) {
            
            if (typeof(state.fields[i]) === "string") {
                state.fields[i] = {
                    value: state.fields[i],
                    hide: false
                }
            } else if (typeof(state.fields[i]) === "object") {
                let arr;
                if (Q.isEmpty(state.fields[i]["value"])) {
                    state.fields[i].value = "";
                }
                if (Q.isEmpty(state.fields[i]["hide"])) {
                    state.fields[i].hide = false;
                }
                if (i === 'NFTcontract' && state.NFTcontract) {
                    state.fields[i].value = state.NFTcontract;
                }

                if (Q.isEmpty(state.fields[i]["validate"])) {
                    state.fields[i]["validate"] = {};
                } else if (Array.isArray(state.fields[i]["validate"])) {
                    
                    arr = {};
                    for (var j in state.fields[i]["validate"]) {
                        let k = state.fields[i]["validate"][j];
                        if (Q.isEmpty(defaultsValidate[k])) {
                            console.warn(`validate expr "${k}" have not supported yet`);
                        } else {
                            arr[k] = defaultsValidate[k];
                        }
                    }
                    state.fields[i]["validate"] = Object.assign({}, arr);
                    
                } else if (typeof(state.fields[i]["validate"]) === "object") {
                    for (var j in state.fields[i]["validate"]) {
                        if (Q.isEmpty(defaultsValidate[j])) {
                            console.warn(`validate expr "${j}" have not supported yet`);
                        } else {
                            state.fields[i]["validate"][j] = state.fields[i]["validate"][j];
                        }
                    }
                }
            }
        }
        
	var p = Q.pipe(['stylesheet', 'text'], function (params, subjects) {
		tool.text = params.text[1];
		tool.refresh();
	});
        
	Q.addStylesheet("{{Assets}}/css/tools/NFT/sales/factory.css", p.fill('stylesheet'), { slotName: 'Assets' });
	Q.Text.get('Assets/content', p.fill('text'));
},

{ // default options here
    NFTcontract: null,
    fields: {
        // key validate is optional
        // value can be :
        // - plain array
        //  validate: ["isEmpty", "isInteger", ...] and try to call Q methods: Q.isEmpty, Q.isInteger ...
        // - object  like {key => errormessage}
        //  validate: {"isEmpty": "err msg here to key %key%, "isInteger": "invalid key %key%, ...} and try to call Q methods: Q.isEmpty, Q.isInteger ...
        NFTContract: {value: "", hide: false, validate: ["notEmpty", "address"]},
        seriesId: {value: "", hide: false, validate: ["notEmpty", "integer"]},
        owner: {value: "", hide: false, validate: ["notEmpty", "address"]},
        currency: {value: "", hide: false, validate: ["notEmpty", "address"]},
        price: {value: "", hide: false, validate: ["notEmpty"]},
        beneficiary: {value: "", hide: false, validate: ["notEmpty", "address"]},
        autoindex: {value: "", hide: false, validate: ["notEmpty", "integer"]},
        duration: {value: "", hide: false, validate: ["notEmpty", "integer"]},
        rateInterval: {value: "", hide: false, validate: ["notEmpty", "integer"]},
        rateAmount: {value: "", hide: false, validate: ["notEmpty", "integer"]}
    },
    salesLinkTitle: function (address, callback) {
        callback && callback(address);
    },
    salesLinkPattern: "sales/{{address}}",
    onMove: new Q.Event() // an event that the tool might trigger
},

{ // methods go here
    whitelistByNFT: function(NFTContract, callback){
        let contract;
        Q.Assets.NFT.Web3.Sales.getFactory()
        .then(function(_contract){
            contract = _contract;
            return  contract.whitelistByNFTContract(NFTContract).then(function(res){return res});
        }).then(function (instancesList) {
            Q.handle(callback, null, [null, {list: instancesList}, contract])
        }).catch(function (err) {
            Q.handle(callback, null, [err.reason || err]);
        })

    },
    _whitelistPush: function(item){
        var tool = this;
        let obj = $(tool.element).find(".Assets_NFT_sales_factory_instancesTableList");
        if (obj.find('tr.Assets_NFT_sales_factory_item').length == 0) {
            obj.find('tr').hide();    // all defaults  like "there are no data  etc"
        }
        obj.prepend(`<tr class="Assets_NFT_sales_factory_item"><td><a href="/test2/${item}">${item}</a></td></tr>`);
    },
    _whitelistRefresh: function(){
        var tool = this;
        var state = this.state;
        let obj = $(tool.element).find(".Assets_NFT_sales_factory_instancesTableList");
        obj.find('tr').hide();
        obj.find('tr.Assets_NFT_sales_factory_loading').show();
        tool.whitelistByNFT(state.NFTcontract, function(err, data){
            obj.find('tr.Assets_NFT_sales_factory_loading').hide();    
            obj.find('tr').not('.Assets_NFT_sales_factory_loading').remove();    
            if (!data || Q.isEmpty(data.list)) {
                obj.append(`<tr><td>There are no instances</td></tr>`);
            } else {
                for (var i in data.list) {
                    state.salesLinkTitle(data.list[i], function (title) {
                        var href = Q.url(tool.state.salesLinkPattern.interpolate({
                            address: data.list[i]
                        }));
                        var link = $('<a />', {href: href}).html(title);
                        var tr = $('<tr class="Assets_NFT_sales_factory_item" />')
                            .append(link);
                        obj.prepend(tr);
                    });
                }
            }
        });
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
        rateAmount, //uint16 
        callback
    ) {
        var tool = this;
        var state = this.state;
            
        return Q.Users.Web3.getFactory('Assets/templates/R1/NFT/sales/factory')
        .then(function (contract) {
            return contract.produce(
                NFTContract, 
                seriesId, 
                owner, 
                currency, 
                price, 
                beneficiary, 
                autoindex, 
                duration, 
                rateInterval, 
                rateAmount
            ).then(function(txResponse){
                txResponse.wait().then(function(receipt){
                    let event = receipt.events.find(event => event.event === 'InstanceCreated');
                    [instance] = event.args;
                    Q.Notices.add({
                        content: `Instance "${instance}" was created successfully`,
                        timeout: 5
                    });
                    tool._whitelistPush(instance);
                    Q.handle(callback, null, [null, instance]);
                }, function(err){
                    console.log("err::txResponce.wait()");
                    Q.handle(callback, null, [err.reason || err]);
                });
            });
        }).catch(function (err) {
            console.warn(err);
            Q.handle(callback, null, [err.reason || err]);
        });
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
                fields: state.fields,
                chainId: Q.Assets.NFT.defaultChain.chainId
            },
            function(err, html){

                tool.element.innerHTML = html;

                for (var fieldName in state.fields) {
                    var $input = tool.$('input[name='+fieldName+']');
                    if (state.fields[fieldName].hide) {
                        var $formGroup = $input.closest('.form-group');
                        $formGroup.add($formGroup.prev('label'))
                            .remove();
                    } else {
                        $input.val(
                            state.fields[fieldName].value
                        );
                    }
                }

                Q.activate(tool.element);
                tool.currency = null;
                
                $('.Assets_NFT_sales_factory_produce', tool.element).on(Q.Pointer.fastclick, function(){

                    
                    let objToolElement = $(tool.element);
                    // clone state fields
                    let fields = Object.assign({}, state.fields);
                    //collect form
                    for (let key in fields) {
                        // get field values
                        fields[key].userValue = objToolElement.find(`[name='${key}']`).val();
                        // use default values if present
                        fields[key].userValue = fields[key].userValue || fields[key].value;
                    }
                    fields.owner.userValue = fields.owner.userValue || Q.Users.Web3.getSelectedXid();
                    
                    fields.beneficiary.userValue = fields.beneficiary.userValue || Q.Users.Web3.getSelectedXid();

                    // validate (after user input and applied defaults value)
                    var validated = true;
                    for (let key in fields) {
                        for (let validateMethod in fields[key].validate) {
                            if (!Q.validate[validateMethod](fields[key].userValue)) {
                                validated = false;
                                Q.Notices.add({
                                    content: fields[key].validate[validateMethod].replace('%key%', key),
                                    timeout: 5
                                });
                                break;
                            }
                        }
                    }

                    // call produce
                    if (validated) {
                        // adjust values
                        
                        fields.price.userValue = ethers.utils.parseUnits(fields.price.userValue,18);
                        
                        tool.produce(
                            fields.NFTContract.userValue,
                            fields.seriesId.userValue,
                            fields.owner.userValue,
                            fields.currency.userValue,
                            fields.price.userValue,
                            fields.beneficiary.userValue,
                            fields.autoindex.userValue,
                            fields.duration.userValue,
                            fields.rateInterval.userValue,
                            fields.rateAmount.userValue,
                            function(err, obj, contract){
                                //console.log("tool.produce callback [arguments]= ",arguments)
                            }
                        );
                    }

                });
                
                $(".Assets_NFT_sales_factory_instancesList", tool.element).on(Q.Pointer.fastclick, function(){
                    tool._whitelistRefresh();
                });
                tool._whitelistRefresh();
                    
            }
        );
    }
    
});

Q.Template.set("Assets/NFT/sales/factory", 
    `<div>
        <div class="form">

            <!-- address NFTContract, -->
            <div class="form-group">
                <label>{{NFT.sales.factory.form.labels.NFTContract}}</label>
                <input name="NFTContract" type="text" class="form-control" value="{{fields.NFTContract.value}}" placeholder="{{NFT.sales.factory.placeholders.address}} {{NFT.sales.factory.placeholders.optional}}">
                <small class="form-text text-muted">{{NFT.sales.factory.form.small.NFTContract}}</small>
            </div>
    
            <div class="form-group">
                <label>{{NFT.sales.factory.form.labels.owner}}</label>
                <input name="owner" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.address}} {{NFT.sales.factory.placeholders.optional}}">
                <small class="form-text text-muted">{{NFT.sales.factory.form.small.owner}}</small>
            </div>
            
            <div class="form-group">
                <label>{{NFT.sales.factory.form.labels.seriesId}}</label>
                <input name="seriesId" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.number}}">
                <small class="form-text text-muted">{{NFT.sales.factory.form.small.seriesId}}</small>
            </div>
    
            <!-- uint256 price, -->
            <div class="row">
                <div class="col-sm-6">
                    <div class="form-group">
                        <label>{{NFT.sales.factory.form.labels.price}}</label>
                        <input name="price" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.fraction}}">
                        <small class="form-text text-muted">{{NFT.sales.factory.form.small.price}}</small>
                    </div>
                </div>
                <div class="col-sm-6">
                    <label>{{NFT.sales.factory.form.labels.currency}}</label>
                    <div class="form-group">
                    {{&tool "Assets/web3/currencies" className="form-control" }}
                    </div>
                </div>
            </div>
            <!-- address beneficiary, -->
            <div class="form-group">
                <label>{{NFT.sales.factory.form.labels.beneficiary}}</label>
                <input name="beneficiary" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.address}} {{NFT.sales.factory.placeholders.optional}}">
                <small class="form-text text-muted">{{NFT.sales.factory.form.small.beneficiary}}</small>
            </div>
            <div class="row">
                <div class="col-sm-6">
                    <!-- uint192 autoindex, -->
                    <div class="form-group">
                        <label>{{NFT.sales.factory.form.labels.autoindex}}</label>
                        <input name="autoindex" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.integer}}">
                        <small class="form-text text-muted">{{NFT.sales.factory.form.small.autoindex}}</small>
                    </div>
                    <!-- uint64 duration, -->
                    <div class="form-group">
                        <label>{{NFT.sales.factory.form.labels.duration}}</label>
                        <input name="duration" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.seconds}}">
                        <small class="form-text text-muted">{{NFT.sales.factory.form.small.duration}}</small>
                    </div>
                </div>
                <div class="col-sm-6">
                    <!-- uint32 rateInterval, -->
                    <div class="form-group">
                        <label>{{NFT.sales.factory.form.labels.rateInterval}}</label>
                        <input name="rateInterval" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.seconds}}">
                        <small class="form-text text-muted">{{NFT.sales.factory.form.small.rateInterval}}</small>
                    </div>
                    <!-- uint16 rateAmount -->
                    <div class="form-group">
                        <label>{{NFT.sales.factory.form.labels.rateAmount}}</label>
                        <input name="rateAmount" type="text" class="form-control" placeholder="{{NFT.sales.factory.placeholders.integer}}">
                        <small class="form-text text-muted">{{NFT.sales.factory.form.small.rateAmount}}</small>
                    </div>
                </div>
            </div>
    
            <button class="Assets_NFT_sales_factory_produce Q_button">{{NFT.sales.factory.produce}}</button>
            <button class="Assets_NFT_sales_factory_instancesList Q_button">{{NFT.sales.factory.viewInstancesList}}</button>
            <div>
                <h3>List by NFT</h3>
                <table class="Assets_NFT_sales_factory_instancesTableList">
                <tr class="Assets_NFT_sales_factory_loading" style="display:none"><td>Loading ...</td></tr>
                </table>
            </div>
        </div>
    
    </div>
    
    `,
{ text: ["Assets/content"] }
);

})(window, Q, jQuery);
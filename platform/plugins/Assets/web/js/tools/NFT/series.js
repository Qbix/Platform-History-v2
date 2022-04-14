(function (window, Q, $, undefined) {
    /**
     * @module Assets
     */

    var Assets = Q.Assets;
    var NFT = Assets.NFT;
    var Web3 = NFT.Web3;

    /**
     * YUIDoc description goes here
     * @class Assets NFT/series
     * @constructor
     * @param {Object} [options] Override various options for this tool
     *  @param {string} userId - owner user id
     *  @param {string} chainId - chain id
     *  @param {string} [seriesId] - if null calculated from userId
     *  @param {string} [contractAddress] - If defined use this contract address instead default for this chainId
     *  @param {Q.Event} [options.onInvoke] Event occur when user click on tool element.
     *  @param {Q.Event} [options.onAvatar] Event occur when click on Users/avatar tool inside tool element.
     *  @param {Q.Event} [options.onCreated] Event occur when series created.
     */
    Q.Tool.define("Assets/NFT/series/preview", ["Streams/preview"],function(options, preview) {
        var tool = this;
        var state = tool.state;
        var $toolElement = $(this.element);
        tool.preview = preview;
        var previewState = tool.preview.state;
        var loggedInUserId = Q.Users.loggedInUserId();

        // is admin
        var roles = Object.keys(Q.getObject("roles", Q.Users) || {});
        tool.isAdmin = (roles.includes('Users/owners') || roles.includes('Users/admins'));

        if (Q.isEmpty(state.chainId)) {
            return console.warn("chain id required!");
        }
        if (Q.isEmpty(state.userId)) {
            return console.warn("user id required!");
        }

        state.seriesId = state.seriesId || Q.Streams.toHexString(state.userId).replace(/0+$/, '');

        // remove trailing zeros
        $toolElement.attr("data-seriesid", state.seriesId);

        state.chain = NFT.chains[state.chainId];

        // <set Streams/preview imagepicker settings>
        previewState.imagepicker.showSize = state.imagepicker.showSize;
        previewState.imagepicker.fullSize = state.imagepicker.fullSize;
        previewState.imagepicker.save = state.imagepicker.save;
        // </set Streams/preview imagepicker settings>

        var pipe = Q.pipe(["stylesheet", "text"], function (params, subjects) {
            if (previewState.streamName) {
                $toolElement.attr("data-publisherId", previewState.publisherId);
                $toolElement.attr("data-streamName", previewState.streamName);
                $toolElement.attr("data-chainId", state.chainId);

                previewState.onRefresh.add(tool.refresh.bind(tool), tool);
            } else {
                if ((loggedInUserId && state.userId === loggedInUserId) || tool.isAdmin) {
                    previewState.onComposer.add(tool.composer.bind(tool), tool);
                } else {
                    Q.Tool.remove(tool.element, true, true);
                }
            }
        });

        Q.addStylesheet("{{Assets}}/css/tools/NFT/series.css", pipe.fill('stylesheet'), { slotName: 'Assets' });
        Q.Text.get('Assets/content', function(err, text) {
            tool.text = text;
            pipe.fill('text')();
        }, {
            ignoreCache: true
        });
    },

    { // default options here
        seriesId: null,
        userId: null,
        chainId: null,
        contractAddress: null,
        onMarketPlace: true,
        imagepicker: {
            showSize: "200.png",
            save: "Streams/image"
        },
        onInvoke: new Q.Event(),
        onAvatar: new Q.Event(),
        onCreated: new Q.Event()
    },

    {
        /**
         * Refreshes the appearance of the tool completely
         * @method refresh
         * @param {Streams_Stream} stream
         */
        refresh: function (stream) {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);
            var authorUserId = stream.getAttribute("authorId") || stream.fields.publisherId;
            var untilTime = parseInt(stream.getAttribute("untilTime"));

            $toolElement.attr("data-onSale", untilTime*1000 > Date.now());

            Q.Template.render('Assets/NFT/series/view', {
                price: stream.getAttribute("price"),
                currency: stream.getAttribute("currency"),
                untilTime: untilTime
            }, (err, html) => {
                tool.element.innerHTML = html;

                $toolElement.activate();

                $(".Assets_NFT_series_avatar", tool.element).tool("Users/avatar", {
                    userId: authorUserId,
                    icon: 40,
                    contents: false,
                    editable: false
                }).activate(function () {
                    $(this.element).on(Q.Pointer.fastclick, function (e) {
                        Q.handle(state.onAvatar, this, [e]);
                    });
                });

                //var $icon = $("img.NFT_series_icon", tool.element);
                //tool.preview.icon($icon[0]);

                // handle with days, hours, minutes visibility
                $("[data-timestamp]", tool.element).each(function () {
                    var $this = $(this);
                    $this.tool("Q/countdown", {
                        onRefresh: function () {
                            var $currentElement = $(this.element);
                            $(".Q_days:visible, .Q_hours:visible, .Q_minutes:visible, .Q_seconds:visible", $currentElement).each(function () {
                                var $this = $(this);
                                if (($this.hasClass("Q_days") || $this.hasClass("Q_hours") || $this.hasClass("Q_minutes")) && $this.text() === "0") {
                                    var $parent = $this.parent();
                                    var $prevSpan = $parent.prev("span:visible");
                                    if (!$prevSpan.length) {
                                        $parent.hide();
                                    }
                                }

                                Q.each(["day", "hour", "minute"], function(i, val) {
                                    if (val === 'day') {
                                        if ($this.hasClass("Q_" +val + "s") && $this.text() === "1") {
                                            $this.next("." + val + "sText").text(tool.text.NFT[val.toCapitalized()]);
                                        } else {
                                            $this.next("." + val + "sText").text(tool.text.NFT[(val + "s").toCapitalized()]);
                                        }
                                    } else {
                                        $this.next("." + val + "sText").text(':');
                                    }

                                });
                            });
                        }
                    }).activate();
                });

                // set onInvoke event
                $toolElement.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
                    tool.update(stream);
                    Q.handle(state.onInvoke, tool, [stream]);
                });
            });
        },
        /**
         * Create series
         * @method composer
         */
        composer: function () {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);
            var previewState = tool.preview.state;
            var relatedTool = Q.Tool.from($toolElement.closest(".Streams_related_tool")[0], "Streams/related");

            $toolElement.addClass("Assets_NFT_series_new");

            Q.Template.render('Assets/NFT/series/newItem', {
                iconUrl: Q.url("{{Q}}/img/actions/add.png")
            }, function(err, html) {
                tool.element.innerHTML = html;
                $toolElement.off("click.NFTcomposer").on("click.NFTcomposer", function () {
                    $toolElement.addClass("Q_working");

                    Q.req("Assets/NFTseries", "newItem", function (err, response) {
                        if (err) {
                            return $toolElement.removeClass("Q_working");
                        }

                        var newItem = response.slots.newItem;
                        previewState.publisherId = newItem.publisherId;
                        previewState.streamName = newItem.streamName;

                        // this need for Streams/related tool to avoid appear composer twice
                        Q.setObject("options.streams_preview.publisherId", newItem.publisherId, tool.element);
                        Q.setObject("options.streams_preview.streamName", newItem.streamName, tool.element);

                        // get a stream by data got from "newItem" request
                        Q.Streams.get.force(previewState.publisherId, previewState.streamName, function (err) {
                            if (err) {
                                return;
                            }

                            tool.update(this);
                        });
                    }, {
                        fields: {
                            category: {
                                publisherId: relatedTool ? relatedTool.state.publisherId : state.userId
                            },
                            userId: state.userId,
                            chainId: state.chainId
                        }
                    });
                });
            });
        },
        update: function (stream) {
            var tool = this;
            var $toolElement = $(tool.element);
            var state = this.state;
            var selectedCurrency = stream.getAttribute("currency");
            var untilTime = parseInt(stream.getAttribute("untilTime"));
            var isNew = !untilTime; // if untilTime undefined - this is composer stream
            var onMarketPlace = state.onMarketPlace;
            if (untilTime) {
                onMarketPlace = untilTime*1000 > Date.now();
            }

            var currencies = NFT.currencies.map(function (item) {
                return item[state.chainId] ? {symbol: item.symbol, selected: item.symbol===selectedCurrency} : false;
            }).filter(function (item) { return item});

            var _format = function (val) { return val >= 10 ? val : '0' + val; };
            var nowDate = new Date();
            nowDate.setTime((untilTime || 0)*1000 || nowDate.setDate(nowDate.getDate() + (onMarketPlace ? 365 : -365)));
            var year = nowDate.getFullYear();
            var month = _format((nowDate.getMonth()+1));
            var day = _format(nowDate.getDate());
            var hours = _format(nowDate.getHours());
            var minutes = _format(nowDate.getMinutes());
            var seconds = _format(nowDate.getSeconds());
            var formattedDate = [year, month, day].join("-") + "T" + [hours, minutes, seconds].join(":");
            var secondsInYear = 60*60*24*365;

            $toolElement.addClass("Q_working");

            stream.onFieldChanged("icon").set(function (modFields, field) {
                //modFields[field]
                /*this.refresh(function () {
                    tool.preview.icon($icon[0]);
                }, {
                    evenIfNotRetained: true
                });*/
            }, tool);

            Q.Dialogs.push({
                title: isNew ? tool.text.NFT.series.CreateSeries : tool.text.NFT.series.UpdateSeries,
                className: "Assets_NFT_series_composer",
                template: {
                    name: "Assets/NFT/series/Create",
                    fields: {
                        isAdmin: tool.isAdmin,
                        currencies: currencies,
                        buttonText: isNew ? tool.text.NFT.Create : tool.text.NFT.Update,
                        price: stream.getAttribute("price"),
                        onMarketPlace: onMarketPlace,
                        baseUrl: Q.baseUrl(),
                        untilTime: formattedDate
                    }
                },
                onActivate: function (dialog) {
                    //var $icon = $("img.NFT_series_icon", dialog);

                    // apply Streams/preview icon behavior
                    //tool.preview.icon($icon[0]);

                    // upload image button
                    //$(".Assets_nft_upload_button", dialog).on(Q.Pointer.fastclick, function (event) {
                    //    event.preventDefault();
                    //    $icon.trigger("click");
                    //});

                    // switch onMarketPlace
                    var $onMarketPlace = $(".Assets_nft_check", dialog);
                    var $assetsNFTformDetails = $(".Assets_nft_form_details", dialog);
                    var $untilTime = $("input[name=untilTime]", $assetsNFTformDetails);
                    $onMarketPlace.click(function() {
                        var checked = $onMarketPlace.prop('checked');
                        var untilTime = new Date($untilTime.val()).getTime();
                        if (checked) {
                            if (untilTime < Date.now()) {
                                $untilTime.val(new Date(Date.now() + secondsInYear*1000).toISOString().replace(/\..*/, ''));
                            }
                        } else {
                            if (untilTime > Date.now()) {
                                $untilTime.val(new Date(Date.now() - secondsInYear*1000).toISOString().replace(/\..*/, ''));
                            }
                        }
                    });
                    $untilTime.on("change", function () {
                        var checked = $onMarketPlace.prop('checked');
                        var untilTime = new Date($untilTime.val()).getTime();
                        if (untilTime <= Date.now()) {
                            checked && $onMarketPlace.prop('checked', false);
                        } else {
                            !checked && $onMarketPlace.prop('checked', true);
                        }
                    });

                    // create NFT
                    $("button[name=save]", dialog).on(Q.Pointer.fastclick, function (event) {
                        event.preventDefault();

                        dialog.addClass("Q_disabled");

                        var price = parseFloat($("input[name=price]:visible", dialog).val());
                        if (!price) {
                            dialog.removeClass("Q_disabled");
                            Q.alert(tool.text.errors.PriceInvalid);
                            return;
                        }
                        var currencySymbol = $("select[name=currency]", dialog).val();
                        var currency = {};
                        Q.each(NFT.currencies, function (i, c) {
                            if (c.symbol !== currencySymbol) {
                                return;
                            }

                            currency = c;
                            currency.token = c[state.chainId];
                        });

                        var attributes = {
                            currency: currencySymbol,
                            seriesId: state.seriesId,
                            price: price,
                            untilTime: new Date($untilTime.val()).getTime()/1000
                        };

                        // activate series in blockchain
                        try {
                            Web3.setSeriesInfo(state.chainId, state.seriesId, {
                                authorAddress: stream.getAttribute("author"),
                                price: price,
                                currency: currency.token,
                                onSaleUntil: untilTime,
                                contractAddress: state.contractAddress
                            }, function (err) {
                                if (err) {
                                    return dialog.removeClass("Q_disabled");
                                }

                                Q.req("Assets/NFTseries",function (err) {
                                    if (err) {
                                        return;
                                    }

                                    Q.Dialogs.pop();

                                    Q.Streams.get.force(stream.fields.publisherId, stream.fields.name, function () {
                                        Q.Dialogs.pop();
                                        tool.refresh(this);
                                    });

                                    Q.handle(state.onCreated, tool, [stream.fields.publisherId, stream.fields.name]);
                                }, {
                                    method: "post",
                                    fields: {
                                        streamName: stream.fields.name,
                                        userId: state.userId,
                                        chainId: state.chainId,
                                        attributes: attributes
                                    }
                                });
                            });
                        } catch (err) {
                            console.error(err);
                            dialog.removeClass("Q_disabled");
                            Q.alert(Q.firstErrorMessage(err));
                        }
                    });
                },
                onClose: function () {
                    $toolElement.removeClass("Q_working");
                }
            });
        }
    });

    Q.Template.set('Assets/NFT/series/newItem',
`<img src="{{iconUrl}}" alt="new" class="Streams_preview_add">
        <h3 class="Streams_preview_title">{{NFT.series.NewItem}}</h3>`, {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/series/Create',
`<form>
        <div class="Assets_nft_form_group">
            <div class="Assets_nft_market">
                <div>
                    <label>{{NFT.series.OnSale}} :</label>
                </div>
                <label class="switch">
                    <input type="checkbox" {{#if onMarketPlace}}checked{{/if}} class="Assets_nft_check">
                    <span class="slider round"></span>
                </label>
            </div>
            <div class="Assets_nft_form_details">
                <div class="Assets_nft_form_price">
                    <label>{{NFT.Price}}</label>
                    <input type="text" name="price" class="Assets_nft_form_control" placeholder="{{NFT.EnterPrice}}" value="{{price}}">
                    <select name="currency">
                        {{#each currencies}}
                            <option {{#if this.selected}}selected{{/if}}>{{this.symbol}}</option>
                        {{/each}}
                    </select>
                </div>
                <div class="Assets_nft_form_date">
                    <label>{{NFT.ExpirationDate}}</label>
                    <input type="datetime-local" name="untilTime" value="{{untilTime}}">
                </div>
            </div>
        </div>
        <button class="Q_button" name="save">{{buttonText}}</button>
    </form>`, {text: ['Assets/content']});

    Q.Template.set('Assets/NFT/series/view',
`<div class="Assets_NFT_series_avatar"></div>
        <div class="Assets_NFT_series_sale">
            <div class="onSale">{{NFT.series.OnSale}}</div>
            <div class="offSale">{{NFT.series.OffSale}}</div>
        </div>
        <div class="Assets_NFT_series_info">
            <div class="Assets_NFT_series_price"><span class="Assets_NFT_series_price_value">{{price}}</span> {{currency}}</div>
            {{#if untilTime}}
            <div class="Assets_NFT_series_ending"><span>{{NFT.series.EndingIn}}</span></div>
            <div class="Assets_NFT_series_untilTime" data-timestamp="{{untilTime}}">
                <span class="dateDays"><span class="Q_days"></span> <span class="daysText">{{NFT.Days}}</span></span>
                <span class="dateHours"><span class="Q_hours"></span>:</span>
                <span class="dateMinutes"><span class="Q_minutes"></span>:</span>
                <span class="dateSeconds"><span class="Q_seconds"></span></span>
            </div>
            {{/if}}
        </div>`,
        {text: ['Assets/content']}
    );
})(window, Q, jQuery);
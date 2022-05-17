(function (window, Q, $, undefined) {
    /**
     * @module Assets
     */

    var Users = Q.Users;
    var Streams = Q.Streams;
    var Assets = Q.Assets;
    var NFT = Assets.NFT;

    /**
     * YUIDoc description goes here
     * @class Assets NFT/series
     * @constructor
     * @param {Object} [options] Override various options for this tool
     *  @param {Q.Event} [options.onInvoke] - Event occur when user click on tool element.
     *  @param {Q.Event} [options.onCreated] - Event occur when series created.
     *  @param {Q.Event} [options.onIconChanged] - Event occur when icon changed.
     *  @param {Q.Event} [options.onClose] Event occur when series stream closed
     */
    Q.Tool.define("Assets/NFT/series/preview", ["Streams/preview"],function(options, preview) {
        var tool = this;
        var state = tool.state;
        var $toolElement = $(this.element);
        tool.preview = preview;
        var previewState = tool.preview.state;

        // is admin
        var roles = Object.keys(Q.getObject("roles", Users) || {});
        tool.isAdmin = (roles.includes('Users/owners') || roles.includes('Users/admins'));

        // <set Streams/preview imagepicker settings>
        previewState.imagepicker.showSize = state.imagepicker.showSize;
        //previewState.imagepicker.fullSize = state.imagepicker.fullSize;
        previewState.imagepicker.save = state.imagepicker.save;
        // </set Streams/preview imagepicker settings>

        var pipe = Q.pipe(["stylesheet", "text"], function (params, subjects) {
            if (previewState.streamName) {
                $toolElement.attr("data-publisherId", previewState.publisherId);
                $toolElement.attr("data-streamName", previewState.streamName);

                previewState.onRefresh.add(tool.refresh.bind(tool), tool);
            } else {
                previewState.onComposer.add(tool.composer.bind(tool), tool);
            }
        });

        Q.addStylesheet("{{Assets}}/css/tools/NFT/seriesPreview.css", pipe.fill('stylesheet'), { slotName: 'Assets' });
        Q.Text.get('Assets/content', function(err, text) {
            tool.text = text;
            pipe.fill('text')();
        }, {
            ignoreCache: true
        });

        // onClose series
        preview.state.onClose.set(function () {
            Q.handle(state.onClose, preview);
        }, tool);
    },

    { // default options here
        imagepicker: {
            showSize: "300x.png",
            save: "NFT/series/icon"
        },
        onInvoke: new Q.Event(),
        onCreated: new Q.Event(),
        onIconChanged: new Q.Event(),
        onClose: new Q.Event()
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
            tool.stream = stream;

            var seriesId = tool.stream.getAttribute("seriesId");
            $toolElement.attr("data-seriesid", seriesId);
            var isEditable = tool.preview.state.editable && tool.stream.testWriteLevel('edit');
            $toolElement.attr("data-editable", isEditable);

            Q.Template.render('Assets/NFT/series/view', {
                name: tool.stream.fields.title || ""
            }, (err, html) => {
                tool.element.innerHTML = html;

                $(".Assets_NFT_series_icon", $toolElement).css("background-image", "url(" + stream.iconUrl("x") + ")");

                if (isEditable) {
                    setTimeout(function () {
                        $toolElement.plugin('Q/actions', {
                            alwaysShow: true,
                            actions: {
                                edit: function () {
                                    tool.update();
                                },
                                delete: function () {
                                    Q.confirm(tool.text.NFT.series.AreYouSure, function(result) {
                                        if (!result) {
                                            return;
                                        }

                                        tool.preview.delete();
                                    });
                                }
                            }
                        });
                    }, 100);
                }

                //var $icon = $("img.NFT_series_icon", tool.element);
                //tool.preview.icon($icon[0]);

                // set onInvoke event
                $toolElement.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
                    Q.handle(state.onInvoke, tool, [tool.stream]);
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

            $toolElement.addClass("Assets_NFT_series_new");

            Q.Template.render('Assets/NFT/series/newItem', {
                iconUrl: Q.url("{{Q}}/img/actions/add.png")
            }, function(err, html) {
                tool.element.innerHTML = html;
                $toolElement.off("click.nftSeriesComposer").on("click.nftSeriesComposer", function () {
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
                        Streams.get.force(previewState.publisherId, previewState.streamName, function (err) {
                            $toolElement.removeClass("Q_working");
                            if (err) {
                                return;
                            }

                            tool.stream = this;
                            tool.update();
                        });
                    }, {
                        fields: {
                            userId: previewState.publisherId
                        }
                    });
                });
            });
        },
        /**
         * Update series
         * @method update
         */
        update: function () {
            var tool = this;
            var $toolElement = $(this.element);
            var state = this.state;
            var isNew = !tool.stream.fields.title;

            tool.stream.onFieldChanged("icon").set(function (modFields, field) {
                Streams.get.force(tool.stream.fields.publisherId, tool.stream.fields.name, function () {
                    tool.stream = this;
                    Q.handle(state.onIconChanged, tool, [tool.stream]);
                });
            }, tool);

            Q.Dialogs.push({
                title: isNew ? tool.text.NFT.series.CreateSeries : tool.text.NFT.series.UpdateSeries,
                className: "Assets_NFT_series_composer",
                template: {
                    name: "Assets/NFT/series/Create",
                    fields: {
                        name: tool.stream.fields.title,
                        buttonText: isNew ? tool.text.NFT.Create : tool.text.NFT.Update
                    }
                },
                onActivate: function (dialog) {
                    var $icon = $("img.NFT_series_icon", dialog);

                    var overrides = NFT.icon.defaultSize ? {
                        "overrideShowSize": {
                            '': (state.imagepicker.showSize || NFT.series.icon.defaultSize)
                        }
                    } : {};

                    // apply Streams/preview icon behavior
                    tool.preview.icon($icon[0], null, overrides);

                    // upload image button
                    $("button[name=upload_icon]", dialog).on(Q.Pointer.fastclick, function (event) {
                        event.preventDefault();
                        $icon.trigger("click");
                    });

                    $(".series_name_inplace", dialog).tool("Streams/inplace", {
                        publisherId: tool.stream.fields.publisherId,
                        streamName: tool.stream.fields.name,
                        field: 'title',
                        inplaceType: "text"
                    }).activate();

                    $("button[name=save]", dialog).on(Q.Pointer.fastclick, function (event) {
                        event.preventDefault();

                        var name = $("input[name=name]", dialog).val();

                        if (!name) {
                            return Q.alert(tool.text.errors.NameRequired);
                        }

                        Q.Dialogs.pop();

                        Q.req("Assets/NFTseries",function (err) {
                            if (err) {
                                return;
                            }

                            var relatedTool = Q.Tool.from($toolElement.closest(".Streams_related_tool")[0], "Streams/related");
                            if (relatedTool) {
                                relatedTool.refresh();
                            }

                            /*Streams.get.force(stream.fields.publisherId, stream.fields.name, function () {
                                Q.Dialogs.pop();
                                $toolElement.removeClass("Assets_NFT_series_new");

                                tool.refresh(this);

                                $("<div>").insertAfter($toolElement).tool("Streams/preview", {
                                    publisherId: previewState.publisherId
                                }).tool("Assets/NFT/series/preview", {
                                    userId: previewState.publisherId
                                }).activate();
                            });*/

                            Streams.get.force(tool.stream.fields.publisherId, tool.stream.fields.name, function () {
                                tool.stream = this;
                                Q.handle(state.onCreated, tool, [tool.stream]);
                            });

                        }, {
                            method: "post",
                            fields: {
                                title: name,
                                publisherId: tool.stream.fields.publisherId,
                                streamName: tool.stream.fields.name
                            }
                        });

                        return false;
                    });
                }
            });
        }
    });

    Q.Template.set('Assets/NFT/series/newItem',
        `<img src="{{iconUrl}}" alt="new" class="Streams_preview_add">
        <h3 class="Streams_preview_title">{{NFT.series.NewItem}}</h3>`, {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/series/Create',
`<div class="Assets_nft_form_group Assets_nft_series_name">
            <label>{{NFT.Name}}:</label>
            <input type="text" name="name" value="{{name}}">
        </div>
        <div class="Assets_nft_form_group Assets_nft_series_icon">
            <label>{{NFT.series.CoverImage}}:</label>
            <div class="Assets_nft_form_details">
                <img class="NFT_series_icon">
                <button name="upload_icon">{{NFT.series.UploadCoverImage}}</button>
            </div>
        </div>
        <button class="Q_button" name="save">{{buttonText}}</button>
        `, {text: ['Assets/content']});

    Q.Template.set('Assets/NFT/series/view',
`<div class="Assets_NFT_series_icon"></div>
        <div class="Assets_NFT_series_info">
            <div class="Assets_NFT_series_name">{{name}}</div>
        </div>`,
        {text: ['Assets/content']}
    );
})(window, Q, jQuery);
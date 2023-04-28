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
     * @class Assets NFT/collections
     * @constructor
     * @param {Object} [options] Override various options for this tool
     *  @param {Q.Event} [options.onInvoke] - Event occur when user click on tool element.
     *  @param {Q.Event} [options.onCreated] - Event occur when collection created.
     *  @param {Q.Event} [options.onIconChanged] - Event occur when icon changed.
     *  @param {Q.Event} [options.onClose] Event occur when collection stream closed
     */
    Q.Tool.define("Assets/NFT/collection/preview", ["Streams/preview"],function(options, preview) {
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

        Q.addStylesheet("{{Assets}}/css/tools/NFT/collectionPreview.css", pipe.fill('stylesheet'), { slotName: 'Assets' });
        Q.Text.get('Assets/content', function(err, text) {
            tool.text = text;
            pipe.fill('text')();
        }, {
            ignoreCache: true
        });

        // onClose collection
        preview.state.onClose.set(function () {
            Q.handle(state.onClose, preview);
        }, tool);
    },

    { // default options here
        imagepicker: {
            showSize: "200.png",
            save: "Users/icon"
        },
        editable: false,
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

            var collectionId = tool.stream.getAttribute("collectionId");
            $toolElement.attr("data-collectionid", collectionId);

            Q.Template.render('Assets/NFT/collection/view', {
                stream: tool.stream,
                editable: state.editable
            }, (err, html) => {
                Q.replace(tool.element, html);
                Q.activate(tool.element);
                tool.preview.icon($("img.Assets_NFT_collection_icon", $toolElement)[0]);

                // set onInvoke event
                $toolElement.off(Q.Pointer.fastclick).on(Q.Pointer.fastclick, function () {
                    Q.handle(state.onInvoke, tool, [tool.stream]);
                });
            });
        },
        /**
         * Create collection
         * @method composer
         */
        composer: function () {
            var tool = this;
            var state = tool.state;
            var $toolElement = $(this.element);
            var previewState = tool.preview.state;

            $toolElement.addClass("Assets_NFT_collection_new");

            Q.Template.render('Assets/NFT/collection/newItem', {
                iconUrl: Q.url("{{Q}}/img/actions/add.png")
            }, function(err, html) {
                Q.replace(tool.element, html);
                $toolElement.off("click.nftCollectionComposer").on("click.nftCollectionComposer", function () {
                    $toolElement.addClass("Q_working");
                    Q.req("Assets/NFTcollections", "newItem", function (err, response) {
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
                    });
                });
            });
        },
        /**
         * Update collection
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
                title: isNew ? tool.text.NFT.collections.CreateCollection : tool.text.NFT.collections.UpdateCollection,
                className: "Assets_NFT_collection_composer",
                template: {
                    name: "Assets/NFT/collection/Create",
                    fields: {
                        title: tool.stream.fields.title,
                        content: tool.stream.fields.content,
                        buttonText: isNew ? tool.text.NFT.Create : tool.text.NFT.Update
                    }
                },
                onActivate: function (dialog) {
                    var $icon = $("img.NFT_collection_icon", dialog);

                    var overrides = NFT.icon.defaultSize ? {
                        "overrideShowSize": {
                            '': (state.imagepicker.showSize || NFT.collections.icon.defaultSize)
                        }
                    } : {};

                    // apply Streams/preview icon behavior
                    tool.preview.icon($icon[0], null, overrides);

                    // upload image button
                    $("button[name=upload_icon]", dialog).on(Q.Pointer.fastclick, function (event) {
                        event.preventDefault();
                        $icon.trigger("click");
                    });

                    $(".collection_name_inplace", dialog).tool("Streams/inplace", {
                        publisherId: tool.stream.fields.publisherId,
                        streamName: tool.stream.fields.name,
                        field: 'title',
                        inplaceType: "text"
                    }).activate();

                    $("button[name=save]", dialog).on(Q.Pointer.fastclick, function (event) {
                        event.preventDefault();

                        var title = $("input[name=title]", dialog).val();

                        if (!title) {
                            return Q.alert(tool.text.errors.NameRequired);
                        }

                        Q.Dialogs.pop();

                        Q.req("Assets/NFTcollections",function (err) {
                            if (err) {
                                return;
                            }

                            var relatedTool = Q.Tool.from($toolElement.closest(".Streams_related_tool")[0], "Streams/related");
                            if (relatedTool) {
                                relatedTool.refresh();
                            }

                            Streams.get.force(tool.stream.fields.publisherId, tool.stream.fields.name, function () {
                                tool.stream = this;
                                Q.handle(state.onCreated, tool, [tool.stream]);
                            });

                        }, {
                            method: "post",
                            fields: {
                                title: title,
                                content: $("textarea[name=content]", dialog).val(),
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

    Q.Template.set('Assets/NFT/collection/newItem',
        `<img src="{{iconUrl}}" alt="new" class="Streams_preview_add">
        <h3 class="Streams_preview_title">{{NFT.collections.NewItem}}</h3>`, {text: ['Assets/content']}
    );

    Q.Template.set('Assets/NFT/collection/Create',
`<input type="text" name="title" value="{{title}}" placeholder="{{NFT.collections.EnterTitle}}">
        <textarea type="text" name="content" placeholder="{{NFT.collections.EnterDescription}}">{{content}}</textarea>
        <div class="Assets_nft_form_group Assets_nft_collection_icon">
            <label>{{NFT.collections.UploadIcon}}:</label>
            <div class="Assets_nft_form_details">
                <img class="NFT_collection_icon">
                <button name="upload_icon">{{NFT.collections.UploadIcon}}</button>
            </div>
        </div>
        <button class="Q_button" name="save">{{buttonText}}</button>`,
        {text: ['Assets/content']});

    Q.Template.set('Assets/NFT/collection/view',
`{{&tool "Users/avatar" userId=stream.fields.publisherId icon=40}}
        <img class="Assets_NFT_collection_icon" />
        <div class="Assets_NFT_collection_info">
            {{&tool "Streams/inplace" "title" field="title" inplaceType="text" editable=editable publisherId=stream.fields.publisherId streamName=stream.fields.name}}
            {{&tool "Streams/inplace" "content" field="content" inplaceType="textarea" editable=editable publisherId=stream.fields.publisherId streamName=stream.fields.name}}
        </div>`,
        {text: ['Assets/content']}
    );
})(window, Q, jQuery);
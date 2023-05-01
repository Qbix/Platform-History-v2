"use strict";
(function(Q, $, undefined) {
Q.exports(function (options, index, column, data) {
    Q.addStylesheet('{{Assets}}/css/columns/NFTcollections.css');

    var userId = Q.Users.loggedInUserId();
    var $column = $(column);
    var columnsTool = Q.Tool.from($column.closest(".Q_columns_tool"), "Q/columns");
    var pendingRelation = "Assets/NFT/series/pending";

    Q.Text.get('Assets/content', function (err, text) {
        column.forEachTool("Assets/NFT/collection/preview", function () {
            var collectionPreview = this;
            this.state.onInvoke.set(function () {
                var min = parseInt($column.data('index')) || 0;
                min++;
                columnsTool.close({min: min}, null, {animation: {duration: 0}});
                columnsTool.push({
                    title: collectionPreview.stream.fields.title,
                    template: 'Assets/NFT/collection/column',
                    fields: {
                        stream: collectionPreview.stream,
                        userId: userId
                    },
                    name: 'NFTcollection'
                }, function (options, index, column, data) {
                    $(".Assets_NFT_collection", column).tool("Streams/preview", {
                        publisherId: collectionPreview.stream.fields.publisherId,
                        streamName: collectionPreview.stream.fields.name,
                        closeable: false,
                        imagepicker: {showSize: '200'}
                    }).tool("Assets/NFT/collection/preview", {
                        editable: true
                    }).activate();

                    var $collectionRelation = $(".Assets_NFT_collection_relation", column);
                    var seriesRegistered = false;
                    $collectionRelation[0].forEachTool("Assets/NFT/series/preview",function () {
                        if (userId === this.preview.state.publisherId) {
                            seriesRegistered = true;
                        }
                        this.state.onInvoke.set(function (seriesStream) {
                            var publisherId = seriesStream.fields.publisherId;
                            var streamName = seriesStream.fields.name;
                            Q.handle(Q.url("{{baseUrl}}/Assets/NFTprofile/" + publisherId + "?selectedSeriesId=" + streamName.split("/").pop()));
                        }, this);
                    }, true);
                    var collectionRelationTool = null;
                    $collectionRelation.tool("Streams/related", {
                        publisherId: collectionPreview.stream.fields.publisherId,
                        streamName: collectionPreview.stream.fields.name,
                        relationType: pendingRelation,
                        isCategory: true,
                        realtime: true,
                        previewOptions: {
                            closeable: false
                        },
                        specificOptions: {
                            editable: false
                        }
                    }).activate(function () {
                        collectionRelationTool = this;
                    });

                    $("button[name=enter]", column).on(Q.Pointer.fastclick, function () {
                        if (seriesRegistered) {
                            return Q.alert("You already registered series!");
                        }

                        Q.Dialogs.push({
                            title: "Select series",
                            className: "Assets_NFT_collection_series",
                            content: $("<div>").tool("Streams/related", {
                                publisherId: userId,
                                streamName: "Assets/NFT/series",
                                relationType: "Assets/NFT/series",
                                isCategory: true,
                                previewOptions: {
                                    closeable: false
                                },
                                specificOptions: {
                                    editable: false
                                }
                            }),
                            onActivate: function ($dialog) {
                                $dialog[0].forEachTool("Assets/NFT/series/preview", function () {
                                    this.state.onInvoke.set(function (seriesStream) {
                                        Q.confirm("Series will be finalized, and entered into the contest. You won’t be able to make any more changes. Proceed?", function (result) {
                                            if (!result){
                                                return;
                                            }

                                            seriesStream.setAttribute("frozen", true);
                                            seriesStream.save();

                                            seriesStream.relateTo(pendingRelation, collectionPreview.stream.fields.publisherId, collectionPreview.stream.fields.name, function () {
                                                if (collectionRelationTool) {
                                                    collectionRelationTool.refresh();
                                                    collectionPreview.stream.join();
                                                    Q.Dialogs.pop();
                                                }
                                            });
                                        }, {
                                            title: "Good luck!"
                                        });
                                    }, this);
                                }, true);
                            }
                        });
                    });
                });
            }, true);
        });
    });
});

Q.Template.set('Assets/NFT/collection/column',
    `<div class="Assets_NFT_collection"></div>
        <div class="Assets_NFT_collection_relation"></div>
        {{#if userId}}
            <button class="Q_button" name="enter">{{NFT.collections.SubmitSeries}}</button>
        {{/if}}
        {{&tool "Streams/participants" maxShow=10 showSummary=false showControls=true publisherId=stream.fields.publisherId streamName=stream.fields.name}}
    </div>`,
    {text: ['Assets/content']}
);
})(Q, jQuery);
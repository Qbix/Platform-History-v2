Q.exports(function(priv){
    /**
    * Show a dialog with subscription plans the stream related to
    * @method showPlansRelated
    * @static
    *  @param {Streams_Stream} stream - the stream which related to subscription plans
    *  @param {function} [callback] - called after subscribed to a plan
    */
    return function showPlansRelated(stream, callback) {
        var canPayForStreams = stream.fields["Assets/canPayForStreams"];
        if (Q.isEmpty(canPayForStreams)) {
            return Q.alert("Error: Not enough permissions to view this content.");
        }

        var plansRelatedDialog = Q.Dialogs.push({
            title: "Please subscribe",
            className: "Assets_subscriptions_showPlansRelated",
            onActivate: function (dialog) {
                var $content = $(".Q_dialog_content", dialog);

                Q.each(canPayForStreams, function (i, streamData) {
                    Q.Assets.Subscriptions.getPlansRelated(streamData, function (err, streams) {
                        if (err) {
                            return;
                        }

                        Q.each(streams, function (i, stream) {
                            $("<div>").tool("Streams/preview", {
                                publisherId: stream.fields.publisherId,
                                streamName: stream.fields.name
                            }).tool("Assets/plan/preview").appendTo($content).activate(function () {
                                var assetsPlanPreview = this;
                                this.state.onInvoke.set(function () {
                                    var planDialog = Q.Dialogs.push({
                                        title: "Please subscribe",
                                        className: "Assets_subscriptions_showPlansRelated_plan",
                                        content: $("<div>").tool("Assets/plan", {
                                            publisherId: stream.fields.publisherId,
                                            streamName: stream.fields.name
                                        }),
                                        onActivate: function (dialog) {
                                            var assetsPlan = Q.Tool.from($(".Assets_plan_tool", dialog)[0], "Assets/plan");
                                            assetsPlan.state.onSubscribe.set(function () {
                                                Q.Dialogs.close(plansRelatedDialog);
                                                Q.Dialogs.close(planDialog);
                                                Q.handle(callback);
                                            }, assetsPlanPreview);
                                        }
                                    });
                                }, assetsPlanPreview);
                            });
                        });
                    });
                });
            }
        });
    }
})
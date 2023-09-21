Q.exports(function() {
    /**
	 * Show a dialog to manage "subscription" related stuff in a stream.
	 * @static
	 * @method subscription
	 * @param {String} publisherId id of publisher which is publishing the stream
	 * @param {String} streamName the stream's name
	 * @param {Object} options Some options to pass to the dialog
	 */
    return function Streams_Dialogs_subscription(publisherId, streamName, options) {
        Q.Dialogs.push(Q.extend(options, {
            url: Q.action(
                'Streams/subscription', 
                {
                    publisherId: publisherId,
                    streamName : streamName
                }
            ),
            removeOnClose: true,
            className: 'Streams_subscription_tool_dialog_container',
            apply: true
        }));
	}
});
Q.exports(function() {
    /**
	 * Show a dialog to manage "access" related stuff in a stream.
	 * @static
	 * @method access
	 * @param {String} publisherId id of publisher which is publishing the stream
	 * @param {String} streamName the stream's name
	 * @param {Object} options Some options to pass to the dialog
	 */
    return function Streams_Dialogs_access(publisherId, streamName, options) {
        Q.Dialogs.push(Q.extend(options, {
            url: Q.action(
                'Streams/access', {
                    publisherId: publisherId,
                    streamName: streamName
                }
            ),
            removeOnClose: true,
            className: 'Streams_access_tool_dialog_container',
            apply: true
        }));
	}
});
Q.exports(function() {
    /**
	 * Show a dialog to invite others to a stream.
	 * @static
	 * @method invite
	 * @param {String} publisherId id of publisher which is publishing the stream
	 * @param {String} streamName the stream's name
	 * @param {Function} [callback] The function to call after dialog is activated.
	 *  It is passed an object with keys "suggestion", "stream", "data"
	 * @param {object} [options] Different options
	 * @param {string} [options.title] Custom dialog title
	 * @param {string} [options.token] Use to set the invite token, if you have enough permissions
	 * @param {String} [options.userChooser=false] If true allow to invite registered users with Streams/userChooser tool.
	 */
    return function Streams_Dialogs_invite(publisherId, streamName, callback, options) {
		Q.addScript('{{Streams}}/js/invite.js', function () {
			Q.Streams.Dialogs.invite._dialog(publisherId, streamName, callback, options);
		});
    }
});
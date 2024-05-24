Q.exports(function() {
    /**
	 * Get stream and find appropriate tool name for this stream (Streams/audio or Q/audio) and activate this tool on hidden element.
	 * @static
	 * @method preloadByStream
	 * @param {String} publisherId
	 * @param {Object} streamName
	 * @param {Element|jQuery} container html element to append to
	 */
    return function Streams_Tool_preloadByStream(publisherId, streamName, container=document.body) {
		Q.Streams.get(publisherId, streamName, function (err, stream) {
			if (err) {
				return;
			}

			var streamType = stream.fields.type;

			// possible tool names like ["Streams/audio", "Q/audio"]
			var possibleToolNames = [streamType, streamType.replace(/(.*)\//, "Q/")];
			var toolName = null;
			for (var i=0, l=possibleToolNames.length; i<l; ++i) {
				if (Q.Tool.defined(possibleToolNames[i])) {
					toolName = possibleToolNames[i];
					break;
				}
			}

			var fields = Q.extend({}, stream.getAllAttributes(), {
				publisherId: stream.fields.publisherId,
				streamName: stream.fields.name,
				url: stream.fileUrl() || stream.iconUrl(Q.largestSize(Q.image.sizes[streamType] || Q.image.sizes['Streams/image']))
			});

			Q.Streams.Tool.preload(toolName, fields, container);
		});
	}
});
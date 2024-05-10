Q.exports(function() {
    /**
	 * For each related stream find appropriate tool name and activate this tool on hidden element.
	 * @static
	 * @method preloadRelated
	 * @param {String} publisherId
	 * @param {Object} streamName
	 * @param {Element|jQuery} container html element to append to
	 */
    return function Streams_Tool_preloadRelated(publisherId, streamName, container=document.body) {
		Q.req('Streams/related', ["relations"], function (err, data) {
			var msg = Q.firstErrorMessage(err, data);
			if (msg) {
				return;
			}

			Q.each(data.slots.relations, function (i, relation) {
				Q.Streams.Tool.preloadByStream(relation.fromPublisherId, relation.fromStreamName, container);
			});
		}, {
			fields: {
				publisherId, streamName, omitRedundantInfo: true, isCategory: true
			},
			baseUrl: Q.baseUrl({publisherId, streamName})
		});
	}
});
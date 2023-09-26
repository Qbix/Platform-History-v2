Q.exports(function(priv, Streams, Stream, Participant) {
    /**
     * Constructs a participant from fields, which are typically returned from the server.
     * @class Streams.Participant
     * @constructor
     * @param {Object} fields
     */

    /**
     * Get one or more participants, sorted by insertedTime
     *
     * @static
     * @method get
     * @param {String} publisherId
     * @param {String} streamName
     * @param {String|Object} userId Can be the id of the participant user, or an object containing one or more of:
     *   "limit": The maximum number of participants to retrieve.
     *   "offset": The offset of the participants to retrieve. If it is -1 or lower, then participants are sorted by descending insertedTime.
     *   "state": The state of the participants to filter by, if any. Can be one of ('invited', 'participating', 'left')
     * @param {Function} callback This receives two parameters. The first is the error.
     *   If userId was a String, then the second parameter is the Streams.Participant, as well as the "this" object.
     *   If userId was an Object, then the second parameter is a hash of { userId: Streams.Participant } pairs
     */
    return Q.getter(function _Participant_get(publisherId, streamName, userId, callback) {
        var slotName, criteria = {"publisherId": publisherId, "name": streamName};
        if (Q.typeOf(userId) === 'object') {
            slotName = 'participants';
            criteria.limit = userId.limit;
            criteria.offset = userId.offset;
            if ('state' in userId) criteria.state = userId.state;
            if ('userId' in userId) criteria.userId = userId.userId;
        } else {
            slotName = 'participant';
            criteria.userId = userId;
        }
        var func = Streams.batchFunction(Q.baseUrl({
            publisherId: publisherId,
            streamName: streamName
        }));
        func.call(this, 'participant', slotName, publisherId, streamName, criteria, function (err, data) {
            var participants = {};
            var msg = Q.firstErrorMessage(err, data);
            if (msg) {
                var args = [err, data];
                Streams.onError.handle.call(this, msg, args);
                Participant.get.onError.handle.call(this, msg, args);
                return callback && callback.call(this, msg, args);
            }
            if ('participants' in data) {
                participants = data.participants;
            } else if ('participant' in data) {
                participants[userId] = data.participant;
            }
            Q.each(participants, function (userId, p) {
                var participant = participants[userId] = p && new Participant(p);
                Participant.get.cache.set(
                    [publisherId, streamName, userId],
                    0, participant, [err, participant]
                );
            });
            if (Q.isPlainObject(userId)) {
                callback && callback.call(this, err, participants || null);
            } else {
                var participant = Q.first(participants);;
                callback && callback.call(participant, err, participant || null);
            }
        });
    }, {
        throttle: 'Streams.Participant.get',
        prepare: function (subject, params, callback, args) {
            if (params[0]) {
                return callback(this, params);
            }
            if (Q.isPlainObject(args[2])) {
                var p1 = params[1];
                Q.each(p1, function (userId, participant) {
                    participant = participant && new Participant(participant);
                    p1[userId] = participant;
                });
            } else {
                params[1] = subject && new Participant(subject);
            }
            callback(params[1], params);
        }
    });

});
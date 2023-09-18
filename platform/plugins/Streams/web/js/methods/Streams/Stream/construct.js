Q.exports(function(priv){
    /**
    * This function is similar to _activateTools in Q.js
    * That one is to create "controllers" on the front end,
    * and this one is to create "models" on the front end.
    * They have very similar conventions.
    * @static
    * @method construct
    * @param {Object} fields Provide any stream fields here. Requires at least the "type" of the stream.
    * @param {Object} [extra={}] Can include "messages" and "participants"
    * @param {Function} [callback] The function to call when all constructors and event handlers have executed
    *  The first parameter is an error, in case something went wrong. The second one is the stream object.
    * @param {Boolean} [updateCache=false] Whether to update the Streams.get cache after constructing the stream
    * @return {Q.Stream}
    */
    return function _Stream_construct(fields, extra, callback, updateCache) {

       if (typeof extra === 'function') {
           callback = extra;
           extra = null;
       }

       if (Q.typeOf(fields) === 'Q.Streams.Stream') {
           fields = Q.extend({}, fields.fields, {
               access: fields.access,
               participant: fields.participant,
               messageTotals: fields.messageTotals,
               relatedToTotals: fields.relatedToTotals,
               relatedFromTotals: fields.relatedFromTotals,
               isRequired: fields.isRequired
           });
       }

       if (Q.isEmpty(fields)) {
           Q.handle(callback, this, ["Streams.Stream constructor: fields are missing"]);
           return false;
       }

       var type = Q.normalize(fields.type);
       var streamFunc = Q.Streams.defined[type];
       if (!streamFunc) {
           streamFunc = Q.Streams.defined[type] = function StreamConstructor(fields) {
               streamFunc.constructors.apply(this, arguments);
               // Default constructor. Copy any additional fields.
               if (!fields) return;
               for (var k in fields) {
                   if ((k in this.fields)
                       || k === 'messageTotals'
                       || k === 'relatedToTotals'
                       || k === 'relatedFromTotals'
                       || k === 'participant'
                       || k === 'access'
                       || k === 'isRequired') continue;
                   this.fields[k] = Q.copy(fields[k]);
               }
           };
       }
       if (typeof streamFunc === 'function') {
           return _doConstruct();
       } else if (typeof streamFunc === 'string') {
           Q.addScript(streamFunc, function () {
               // TODO 0: `streamName` undefiend. How it should be?
               streamFunc = Q.Streams.defined[streamName];
               if (typeof streamFunc !== 'function') {
                   throw new Q.Error("Stream.construct: streamFunc cannot be " + typeof(streamFunc));
               }
               return _doConstruct();
           });
           return true;
       } else if (typeof streamFunc !== 'undefined') {
           throw new Q.Error("Stream.construct: streamFunc cannot be " + typeof(streamFunc));
       }
       function _doConstruct() {
           if (!streamFunc.streamConstructor) {
               streamFunc.streamConstructor = function Streams_Stream(fields) {
                   // run any constructors
                   streamFunc.streamConstructor.constructors.apply(this, arguments);

                   var f = this.fields;
                   if (updateCache) { // update the Streams.get cache
                       if (f.publisherId && f.name) {
                            Q.Streams.get.cache
                               .removeEach([f.publisherId, f.name])
                               .set(
                                   [f.publisherId, f.name], 0,
                                   this, [null, this]
                               );
                       }
                   }

                   // call any onConstruct handlers
                   Q.handle(priv._constructHandlers[f.type], this, []);
                   Q.handle(priv._constructHandlers[''], this, []);
                   if (f.publisherId && f.name) {
                       Q.handle(Q.getObject([f.publisherId, f.name], priv._streamConstructHandlers), this, []);
                       Q.handle(Q.getObject([f.publisherId, ''], priv._streamConstructHandlers), this, []);
                       Q.handle(Q.getObject(['', f.name], priv._streamConstructHandlers), this, []);
                       Q.handle(Q.getObject(['', ''], priv._streamConstructHandlers), this, []);
                   }
               };
               Q.mixin(streamFunc, Q.Streams.Stream);
               Q.mixin(streamFunc.streamConstructor, streamFunc);
               streamFunc.streamConstructor.isConstructorOf = 'Q.Streams.Stream';
           }
           var stream = new streamFunc.streamConstructor(fields);
           var messages = {}, participants = {};

           priv.updateMessageTotalsCache(fields.publisherId, fields.name, stream.messageTotals);

           if (extra && extra.messages) {
               Q.each(extra.messages, function (ordinal, message) {
                   if (!(message instanceof Q.Streams.Message)) {
                       message = Q.Streams.Message.construct(message, true);
                   }
                   messages[ordinal] = message;
               });
           }
           if (extra && extra.participants) {
               Q.each(extra.participants, function (userId, participant) {
                   if (!(participant instanceof Q.Streams.Participant)) {
                       participant = new Q.Streams.Participant(participant);
                   }
                   participants[userId] = participant;
                   Q.Streams.Participant.get.cache.set(
                       [fields.publisherId, fields.name, participant.userId], 0,
                       participant, [null, participant]
                   );
               });
           }

           Q.handle(callback, stream, [null, stream, {
               messages: messages,
               participants: participants
           }]);
           return stream;
       }
   };
})
Q.exports(function(priv){
    /**
    * Subscribe to a stream, to start getting offline notifications
    * May call Streams.subscribe.onError if an error occurs.
    *
    * @static
    * @method subscribe
    * @param {String} publisherId id of publisher which is publishing the stream
    * @param {String} streamName name of stream to join
    * @param {Function} [callback] receives (err, participant) as parameters
    * @param {Object} [options] optional object that can include:
    *   @param {bool} [options.device] Whether to subscribe device when user subscribed to some stream
    */
    return function _Stream_subscribe (publisherId, streamName, callback, options) {
       if (!Q.plugins.Users.loggedInUser) {
           throw new Q.Error("Streams.Stream.subscribe: Not logged in.");
       }

       options = Q.extend({}, Stream.subscribe.options, options);

       var slotName = "participant";
       var fields = {"publisherId": publisherId, "name": streamName};
       var baseUrl = Q.baseUrl({
           "publisherId": publisherId,
           "streamName": streamName,
           "Q.clientId": Q.clientId()
       });
       Q.req('Streams/subscribe', [slotName], function (err, data) {
           var msg = Q.firstErrorMessage(err, data);
           if (msg) {
               var args = [err, data];
               Q.Streams.onError.handle.call(this, msg, args);
               Q.Streams.Stream.subscribe.onError.handle.call(this, msg, args);
               return callback && callback.call(this, msg, args);
           }
           var participant = new Q.Streams.Participant(data.slots.participant);
           Q.Streams.Participant.get.cache.set(
               [participant.publisherId, participant.streamName, participant.userId],
               0, participant, [err, participant]
           );
           callback && callback.call(participant, err, participant || null);
           priv._refreshUnlessSocket(publisherId, streamName);

           // check whether subscribe device and subscribe if yes
           if (Q.getObject(["device"], options) === true) {
               Q.Users.Device.subscribe(function(err, subscribed){
                   var fem = Q.firstErrorMessage(err);
                   if (fem) {
                       console.error("Device registration: " + fem);
                       return false;
                   }

                   if(subscribed) {
                       console.log("device subscribed");
                   } else {
                       console.log("device subscription fail!!!");
                   }
               });
           }
       }, { method: 'post', fields: fields, baseUrl: baseUrl });
   };

})
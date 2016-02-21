module.exports = function (Q, Users) {
	
	/*
	 * Creates a Users.Client object
	 */
 	return function () {
		
		/*
		 * @param publisherId
		 *  The id of the stream's publisher
		 * @param streamName
		 *  The name of the stream to post to
		 * @param content String
		 *  The content to post
		 * @param options Object
		 *  Optional. May include the following keys:
		 *  "type": the type of the message, see message.type
		 */
		this.postMessage = function (publisherId, content, options) {
			
		};
		
	};
	
};
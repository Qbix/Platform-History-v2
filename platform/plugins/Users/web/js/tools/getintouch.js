(function (Q, $) {

/**
 * Users Tools
 * @module Users-tools
 */

/**
 * Renders an interface for getting in touch with the given user via email or mobile
 * @class Users getintouch
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} [options.emailSubject] The default subject of the email, if any
 *   @param {String} [options.emailAddress] The email address.
 *   @param {String} [options.emailBody] The default body of the email, if any
 *   @param {String} [options.mobileNumber] The mobile number.
 *   @param {String} [options.key='blah'] The obfuscation key
 */
Q.Tool.define("Users/getintouch", function(options) {

	function preventDefault(e) {
		e.preventDefault();
	}
	var key = this.state.key;
	$('#'+this.prefix+'email').on(Q.Pointer.fastclick, this, function () {
		var url = '', qp = [];
		url = "mailto:"+options.emailAddress.deobfuscate(key);
		if (options.emailSubject) {
			qp.push('subject='+encodeURIComponent(options.emailSubject.deobfuscate(key)));
		}
		if (options.emailBody) {
			qp.push('body='+encodeURIComponent(options.emailBody.deobfuscate(key)));
		}
		if (qp.length) {
			url += '?'+qp.join('&');
		}
		window.location = url;
	}).click(preventDefault);
	$('#'+this.prefix+'sms').on(Q.Pointer.fastclick, this, function () {
		window.location = "sms:"+options.mobileNumber.deobfuscate(key);
	}).click(preventDefault);
	$('#'+this.prefix+'call').on(Q.Pointer.fastclick, this, function () {
		window.location = "tel:"+options.mobileNumber.deobfuscate(key);
	}).click(preventDefault);
});

})(Q, Q.jQuery);
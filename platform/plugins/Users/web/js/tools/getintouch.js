(function (Q, $) {

/**
 * Users Tools
 * @module Users-tools
 * @main
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
 */
Q.Tool.define("Users/getintouch", function(options) {

	function preventDefault(e) {
		e.preventDefault();
	}
	function deobfuscate(str) {
		var l = str.length, result = '';
		for (var i=0; i<l; ++i) {
			result += String.fromCharCode(str.charCodeAt(i)+1);
		}
		return result;
	}
	$('#'+this.prefix+'email').on(Q.Pointer.fastclick, this, function () {
		var url = '', qp = [];
		url = "mailto:"+deobfuscate(options.emailAddress);
		if (options.emailSubject) {
			qp.push('subject='+encodeURIComponent(deobfuscate(options.emailSubject)));
		}
		if (options.emailBody) {
			qp.push('body='+encodeURIComponent(deobfuscate(options.emailBody)));
		}
		if (qp.length) {
			url += '?'+qp.join('&');
		}
		window.location = url;
	}).click(preventDefault);
	$('#'+this.prefix+'sms').on(Q.Pointer.fastclick, this, function () {
		window.location = "sms:"+deobfuscate(options.mobileNumber);
	}).click(preventDefault);
	$('#'+this.prefix+'call').on(Q.Pointer.fastclick, this, function () {
		window.location = "tel:"+deobfuscate(options.mobileNumber);
	}).click(preventDefault);
});

})(Q, jQuery);
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
	function deobfuscate(str, key) {
		key = key || 'blah';
		var len1 = Math.floor(str.length / 2);
		var len2 = key.length;
		var result = '';
		for (var i=0; i<len1; ++i) {
			var j = i % len2;
			var diff = str.charCodeAt(i*2+1);
			if (str.charAt(i*2) == '1') {
				diff = -diff;
			}
			result += String.fromCharCode(key.charCodeAt(j)+diff);
		}
		return result;
	}
	var key = this.state.key;
	$('#'+this.prefix+'email').on(Q.Pointer.fastclick, this, function () {
		var url = '', qp = [];
		url = "mailto:"+deobfuscate(options.emailAddress, key);
		if (options.emailSubject) {
			qp.push('subject='+encodeURIComponent(deobfuscate(options.emailSubject), key));
		}
		if (options.emailBody) {
			qp.push('body='+encodeURIComponent(deobfuscate(options.emailBody), key));
		}
		if (qp.length) {
			url += '?'+qp.join('&');
		}
		window.location = url;
	}).click(preventDefault);
	$('#'+this.prefix+'sms').on(Q.Pointer.fastclick, this, function () {
		window.location = "sms:"+deobfuscate(options.mobileNumber, key);
	}).click(preventDefault);
	$('#'+this.prefix+'call').on(Q.Pointer.fastclick, this, function () {
		window.location = "tel:"+deobfuscate(options.mobileNumber, key);
	}).click(preventDefault);
});

})(Q, jQuery);
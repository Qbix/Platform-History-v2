module.exports = function (options, callback) {
	var Q = require('Q');

	options.url = this.getInstruction("inviteUrl");
	options.icon = Q.url("{{Streams}}/img/icons/Streams/invited/80.png");
	callback();
}
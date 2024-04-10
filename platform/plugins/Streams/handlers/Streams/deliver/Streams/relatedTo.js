module.exports = function (options, callback) {
	var Q = require('Q');
	var p, f = options.fields;
	options.fields.streamTitleEmojiPrefix = Q.Config.get([
		'Streams', 'types', f.stream.fields.type, 'emoji'
	], null) || '';
	var p = options.fields.fromTitleEmojiPrefix = Q.Config.get([
		'Streams', 'types', f.fromType, 'emoji'
	], null) || '';
	options.subject = p + this.getInstruction('description') || this.fields.content;
	callback();
}
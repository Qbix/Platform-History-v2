module.exports = function (options, callback) {
	var Q = require('Q');
	var f = options.fields;
	f.streamTitleEmojiPrefix = Q.Config.get([
		'Streams', 'types', f.stream.fields.type, 'emoji'
	], null) || '';
	f.fromTitleEmojiPrefix = Q.Config.get([
		'Streams', 'types', f.fromType, 'emoji'
	], null) || '';
	if (f.streamTitleEmojiPrefix) {
		f.streamTitleEmojiPrefix += ' ';
	}
	if (f.fromTitleEmojiPrefix) {
		f.fromTitleEmojiPrefix += ' ';
	}
	options.subject = f.fromTitleEmojiPrefix
		+ (this.getInstruction('description') || this.fields.content);
	callback();
}
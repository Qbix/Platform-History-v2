module.exports = function (options, callback) {
	options.subject = this.getInstruction('description') || this.fields.content;
	callback();
}
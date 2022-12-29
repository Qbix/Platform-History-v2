(function (Q, $, window, document, undefined) {

var Users = Q.Users;
var Streams = Q.Streams;

Q.setObject("Q.text.Streams.import", {
	linkTitle: "Fill Out This Spreadsheet",
	fileLabel: "Upload Spreadsheet",
	smsText: "Hey, I just sent you a link to {{communityName}}. Please check it out.",
	emailSubject: "Just sent you a link",
	emailBody: "Hey, I just sent you an invitation to {{communityName}}. Please check it out."
});

/**
 * Streams Tools
 * @module Streams-tools
 */

/**
 * Allows $app/admins in a community o download of sample csv and upload a filled-out csv.
 * The upload starts a Streams/task where Streams/import handler runs and creates
 * users from the csv, inviting them to certain Streams/experience streams in the community.
 * It also listens to Streams/task/progress messages on the task, displays progress
 * and provides a way to send mass messages to follow up the invitation messages.
 * @class Streams import
 * @constructor
 * @param {array} [options] this array contains function parameters
 *   @param {String} [options.link] Required. URL to the csv file to download, if any.
 *    Can be a full url, "{{Module}}/path/file.csv" or one of "university.csv" or "building.csv".
 *   @param {String} [options.linkTitle="Fill Out This Spreadsheet"] The content of the link to the csv, if csv is set
 *   @param {String} [options.fileLabel="Upload Spreadsheet"] The content of the link to the csv, if csv is set
 *   @param {String} [options.smsText] The text to send in SMS followups
 *   @param {String} [options.emailSubject] The subject of the email in followups
 *   @param {String} [options.emailBody] The body of the email, as HTML
 *   @param {String} [options.smsBatchSize=99] The size of followup sms batches
 *   @param {String} [options.emailBatchSize=99] The size of followup email batches
 *   @param {String} [options.communityId=Users::communityId] For Streams/import/post
 *   @param {String} [options.taskStreamName] For Streams/import/post
 */
Q.Tool.define("Streams/import", function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	var container = $('.Q_import_tool_container', $te);
	
	if (!tool.element.innerHTML) {
		var fields = Q.extend({
			action: Q.action('Streams/import')
		}, Q.text.Streams.import, state);
		if (state.link) {
			fields.href = state.link.isUrl() || state.link[0] === '{'
				? state.link
				: Q.url('{{Streams}}/importing/' + state.link);
		}
		fields.communityId = Q.Users.communityId;
		fields.communityName = Q.Users.communityName;
		fields.communitySuffix = Q.Users.communitySuffix;
		Q.Template.render('Streams/import/tool', fields, function (err, html) {
			Q.replace(tool.element, html);;
			_continue();
		});
	} else {
		_continue();
	}
	function _continue() {
		var $input = tool.$('.Streams_import_file')
		.click(function (event) {
			event.stopPropagation();
		}).change(_change);
		// for browsers taht don't support the change event, have an interval
		this.ival = setInterval(function () {
			if ($input.val()) {
				_change();
			}
		}, 100);
	}
	
	function _change() {
		if (!this.value) {
			return; // it was canceled
		}
		var $this = $(this);
		var form = $this.closest('form').get(0);
		Q.request(form.action, ['taskStreamName'], function (e) {
			Q.Streams.followup({
				mobile: {
					numbers: ['+17181234567', '+17181212121']
				}
			});
		}, {
			form: form
		});
		event && event.preventDefault();
		form.reset();
	}
},

{
	link: null,
	linkTitle: 'Fill Out This Spreadsheet',
	fileLabel: 'Upload Spreadsheet:',
	smsBatchSize: 99,
	emailBatchSize: 99
},

{
	Q: {
		beforeRemove: function () {
			if (this.ival) {
				clearInterval(this.ival);
			}
		}
	}
}

);

Q.Template.set('Streams/import/tool', 
	  '{{#if href}}<a href="{{href}}">{{linkTitle}}</a>{{/if}}'
	+ '<form action="{{action}}" enctype="multipart/form-data" class="Streams_import_form">'
	+   '<label for="{{prefix}}file">{{fileLabel}}</label>'
	+   '<input type="file" id="{{prefix}}file">'
	+   '{{#if communityId}}'
	+     '<input type="hidden" name="communityId" value="{{communityId}}">'
	+   '{{/if}}'
	+   '{{#if taskStreamName}}'
	+     '<input type="hidden" name="taskStreamName" value="{{taskStreamName}}">'
	+   '{{/if}}'
	+ '</form>'
);

})(Q, Q.$, window, document);

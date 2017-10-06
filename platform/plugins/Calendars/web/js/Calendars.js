/**
 * Calendars plugin's front end code
 *
 * @module Calendars
 * @class Calendars
 */
"use strict";
/* jshint -W014 */
(function(Q, $) {

var Calendars = Q.Calendars = Q.plugins.Calendars = {

}

Calendars.Event = {
	weekdays: [
		'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
	],
	going: function (stream, callback) {
		var going = 'no';
		if (!Q.Users.loggedInUser) {
			return callback(false);
		}
		stream.getParticipant(Q.Users.loggedInUser.id,
		function (err, participant) {
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				console.warn(msg);
				callback(null);
			} else {
				callback(participant && participant.getExtra('going'));
			}
		});
	}
};

Q.Tool.define({
	"Calendars/event": "{{Calendars}}/js/tools/event.js",
	"Calendars/event/preview": "{{Calendars}}/js/tools/event/preview.js",
	"Calendars/event/composer": "{{Calendars}}/js/tools/event/composer.js"
});

})(Q, jQuery);

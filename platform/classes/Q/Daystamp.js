/**
 * @module Q
 */
var Q = require('../Q');
/**
 * Like a timestamp, but works with number of Gregorian Calendar 
 * days since fictional epoch year=0, month=0, day=1.
 * You can store daystamps and do arithmetic with them.
 * @class Daystamp
 * @namespace Q
 */
Q.Daystamp = {
	fromTimestamp: function (timestamp) {
		return Math.round(
			(timestamp - Q.Daystamp.epoch) / Q.Daystamp.msPerDay
		);
	},
	fromDate: function (date) {
		return Q.Daystamp.fromTimestamp(date.getTime());
	},
	fromDateTime: function (datetime) {
		var time = Date.parse(datetime + ' UTC');
		return Math.round(
			(new Date(time).getTime() - Q.Daystamp.epoch) / Q.Daystamp.msPerDay
		);
	},
	fromYMD: function (y, m, d) {
		var date = new Date();
		date.setUTCFullYear(y, m+1, d);
		date.setUTCHours(0, 0, 0);
		return Math.round(
			(date.getTime() - Q.Daystamp.epoch) / Q.Daystamp.msPerDay
		);
	},
	toTimestamp: function (daystamp) {
		return Q.Daystamp.epoch + Q.Daystamp.msPerDay * daystamp;
	},
	toDate: function (daystamp) {
		return new Date(Q.Daystamp.toTimestamp(daystamp));
	},
	toDateTime(daystamp, separator) {
		var date = Q.Daystamp.toDate(daystamp);
		if (separator === undefined) {
			separator = ' ';
		}
		return String(date.getUTCFullYear()).padStart(4, 0)
			+ '-' + String(date.getUTCMonth()+1).padStart(2, 0)
			+ '-' + String(date.getUTCDate()).padStart(2, 0)
			+ separator + '00:00:00';
	},
	toYMD: function (daystamp) {
		var date = Q.Daystamp.toDate(daystamp);
		return [
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate()
		];
	}
};

Object.defineProperty(Q.Daystamp, 'epoch', {
	value: -62167219200000,
	configurable: false,
	writable: false,
	enumerable: true
});

Object.defineProperty(Q.Daystamp, 'msPerDay', {
	value: 8.64e7,
	configurable: false,
	writable: false,
	enumerable: true
});
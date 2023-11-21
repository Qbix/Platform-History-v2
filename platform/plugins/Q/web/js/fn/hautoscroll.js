(function (Q, $, window, document, undefined) {

/**
 * Plugin for Animated moving Element content inside it from let to right
 * @method hautoscroll
 * @param {Object} [options] options object containing parameters for function
 * @param {Number} [options.scrollTime] scrollTime number of interval for content right movement in milliseconds
 * @default 2000
 * @param {Number} [options.pauseBefore] pauseBefore is a number for interval before animation starts in milliseconds
 * @default 1000
 * @param {Number} [options.pauseAfter] pauseAfter number of interval for content left movement to margin-left: 0 in milliseconds
 * @default 1000
*/
Q.Tool.jQuery('Q/hautoscroll',

function _Q_hautoscroll() {
	return this.each(function() {
		var $this = $(this);
		$this.addClass('Q_hautoscroll');
		$this.html('<span>' + $this.html() + '</span>');
		var text = $this.children('span');
		var widthsDiff = $this.width() - text.width();
		
		if (widthsDiff < 0) {
			var intervalName = 'Q.hautoscroll_' + p.currentId;
			$this.data('Q_hautoscroll_interval', intervalName);
			p.currentId++;
			Q.Interval.set(function() {
				text.animate({ 'margin-left': widthsDiff }, o.scrollTime, function() {
					setTimeout(function() {
						text.css({ 'margin-left': 0 });
					}, o.pauseAfter);
				});
			}, o.scrollTime + o.pauseBefore + o.pauseAfter, intervalName);
		}
	});
},

{
	'scrollTime': 2000,
	'pauseBefore': 1000,
	'pauseAfter': 1000
},

{
	remove: function () {
		return this.each(function() {
			var $this = $(this);
			$this.removeClass('Q_hautoscroll');
			if ($this.children('span').length > 0) {
				$this.html($this.children('span').html());
			}
			var intervalId = $this.data('Q_hautoscroll_interval');
			if (intervalId && Q.Interval.exists(intervalId)) {
				Q.Interval.clear($this.data('Q_hautoscroll_interval'));
			}
		});
	}
}

);

var p = {
	currentId: 0
};

})(Q, Q.jQuery, window, document);
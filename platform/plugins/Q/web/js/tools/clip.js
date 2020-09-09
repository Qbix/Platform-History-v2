(function (window, Q, $, undefined) {
	
/**
 * @module Q
 */
	
/**
 * Render tool to select clip start/end time
 * @class Q clip
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String|Integer} [options.start] String in format hh:mm:ss or integeer seconds
 *  @param {String|Integer} [options.end] String in format hh:mm:ss or integeer seconds
 *  @param {Q.Event} onStart event trigger when clip start time defined
 *  @param {Q.Event} onEnd event trigger when clip end time defined
 */
Q.Tool.define("Q/clip", function (options) {
	var tool = this;

	var p = Q.pipe(['stylesheet', 'text'], tool.refresh.bind(tool));
	
	Q.addStylesheet("{{Q}}/css/clip.css", p.fill('stylesheet'), { slotName: 'Q' });
	Q.Text.get('Q/content', function (err, text) {
		tool.text = text.clip;
		p.fill('text')();
	});
},

{ // default options here
	start: null,
	end: null,
	onStart: new Q.Event(),
	onEnd: new Q.Event()
},

{ // methods go here
	/**
	 * Refreshes the appearance of the tool completely
	 * @method refresh
	 */
	refresh: function () {
		var tool = this;
		var $toolElement = $(this.element);
		var state = tool.state;

		Q.Template.render('Q/clip', {
			startTimeString: tool.convertToString(state.start),
			endTimeString: tool.convertToString(state.end),
			startTimeMilliseconds: state.start,
			endTimeMilliseconds: state.end,
			startFixed: state.start !== null ? 'Q_clip_fixed' : '',
			endFixed: state.end !== null ? 'Q_clip_fixed' : '',
			text: tool.text
		}, function (err, html) {
			$toolElement.html(html);

			$("button", $toolElement).on(Q.Pointer.fastclick, function () {
				var $this = $(this);
				var name = $this.prop("name");
				// capitalize first letter
				name = name.charAt(0).toUpperCase() + name.slice(1);

				$this.toggleClass("Q_clip_fixed");

				if ($this.hasClass('Q_clip_fixed')) {
					var time = $(".Q_clip_time_milliseconds", $this).text();
					Q.handle(state["on" + name], tool, [time]);
				} else {
					Q.handle(state["on" + name], tool, [null]);
				}
			});
		});
	},
	/**
	 * Set new time of start/end clip time
	 * @method setTime
	 * @param {int} time Time in milliseconds
	 * @param {string} which Can be 'start' or 'end'
	 */
	setTime: function (time, which) {
		if (!/^\d+$/.test(time)) {
			time = null;
		}

		$("button[name=" + which + "]:not(.Q_clip_fixed) .Q_clip_time_milliseconds", this.element).text(time);
		$("button[name=" + which + "]:not(.Q_clip_fixed) .Q_clip_time_string", this.element).text(this.convertToString(time));
	},
	/**
	 * Get time of start/end clip time
	 * @method getTime
	 * @param {string} which Can be 'start' or 'end'
	 * @return {integer} time in milliseconds
	 */
	getTime: function (which) {
		var time = $("button[name=" + which + "].Q_clip_fixed .Q_clip_time_milliseconds", this.element).text();

		if (!/^\d+$/.test(time)) {
			time = null;
		}

		return time;
	},
	/**
	 * Convert time from milliseconds to hh:mm:ss string
	 * @method convertToString
	 * @param {int} time Time in milliseconds
	 * @return {string} formatted string
	 */
	convertToString: function (time) {
		time = Math.trunc(time);
		var timeString = new Date(time).toISOString().substr(11, 8);

		// ommit hh if 00
		timeString = timeString.replace(/^00:/, '');

		return timeString;
	}
});

Q.Template.set('Q/clip',
	'<button name="start" class="{{startFixed}}" type="button">' +
	'	<span class="Q_clip_defined">{{text.ClipStart}}: </span>' +
	'	<span class="Q_clip_set">{{text.SetClipStart}}</span>' +
	'	<span class="Q_clip_time_string">{{startTimeString}}</span>' +
	'	<span class="Q_clip_time_milliseconds">{{startTimeMilliseconds}}</span>' +
	'</button>' +
	'<button name="end" class="{{endFixed}}" type="button">' +
	'	<span class="Q_clip_defined">{{text.ClipEnd}}: </span>' +
	'	<span class="Q_clip_set">{{text.SetClipEnd}}</span>' +
	'	<span class="Q_clip_time_string">{{endTimeString}}</span>' +
	'	<span class="Q_clip_time_milliseconds">{{endTimeMilliseconds}}</span>' +
	'</button>'
);

})(window, Q, jQuery);
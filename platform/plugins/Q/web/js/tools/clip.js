(function (window, Q, $, undefined) {
	
/**
 * @module Q
 */
	
/**
 * Render tool to select clip start/end time
 * @class Q clip
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {String} [options.mode] Can be 'composer' or 'editor'
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
	mode: 'composer',
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

		var startTime = String(state.start).match(/^\d+$/) ? tool.convertToString(state.start) : state.start;
		var endTime = String(state.end).match(/^\d+$/) ? tool.convertToString(state.end) : state.end;

		Q.Template.render('Q/clip/' + state.mode, {
			startTime: startTime,
			endTime: endTime,
			startFixed: startTime ? 'Q_clip_fixed' : '',
			endFixed: endTime ? 'Q_clip_fixed' : '',
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
					var time = tool.convertToMilliseconds($(".Q_clip_edit", $this).text());

					Q.handle(state["on" + name], tool, [time]);
				}
			});

			$("input", $toolElement).on("input", function () {
				var $this = $(this);
				var time = $this.val();
				var name = $this.prop("name");
				// capitalize first letter
				name = name.charAt(0).toUpperCase() + name.slice(1);

				if (!tool.validFormat(time)) {
					return;
				}

				time = tool.convertToMilliseconds(time);
				Q.handle(state["on" + name], tool, [time]);
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
		var tool = this;
		time = tool.convertToString(time);

		if (!tool.validFormat(time)) {
			return Q.alert("Invalid time format");
		}

		$("button[name=" + which + "]:not(.Q_clip_fixed) .Q_clip_edit", tool.element).text(time);
		$("input[name=" + which + "]:not(.Q_clip_fixed)", tool.element).val(time);
	},
	/**
	 * Get time of start/end clip time
	 * @method getTime
	 * @param {string} which Can be 'start' or 'end'
	 * @return {integer} time in milliseconds
	 */
	getTime: function (which) {
		var tool = this;
		var state = this.state;
		var time = null;

		if (state.mode === 'editor') {
			time = $("button[name=" + which + "].Q_clip_fixed .Q_clip_edit", tool.element).text();
		} else if (state.mode === 'composer') {
			time = $("input[name=" + which + "]", tool.element).val();
		}

		if (time && !tool.validFormat(time)) {
			Q.alert("Invalid time format");
			return null;
		}

		return time ? tool.convertToMilliseconds(time) : null;
	},
	/**
	 * Convert time from milliseconds to hh:mm:ss string
	 * @method convertToString
	 * @param {int} time Time in milliseconds
	 * @return {string} formatted string
	 */
	convertToString: function (time) {
		return new Date(time).toISOString().substr(11, 8);
	},
	/**
	 * Convert time from seconds or hh:mm:ss to miliseconds
	 * @method convertToMilliseconds
	 * @param {int|string} time Time in seonds or string hh:mm:ss
	 * @return {string} formatted string
	 */
	convertToMilliseconds: function (time) {
		// time in format hh:mm:ss
		if (this.validFormat(time)) {
			var parts = time.split(':');
			var hours = parseInt(parts[0], 10);
			var minutes = parseInt(parts[1], 10);
			var seconds = parseInt(parts[2], 10);

			time = hours * 3600 + minutes * 60 + seconds;
		}

		return time * 1000;
	},
	/**
	 * Check if string match format hh:mm:ss
	 * @method validFormat
	 * @param {string} time
	 * @return {boolean}
	 */
	validFormat: function (time) {
		return !!time.match(/\d{1,2}:\d{1,2}:\d{1,2}/);
	}
});

Q.Template.set('Q/clip/composer',
	'<input name="start" placeholder="{{text.SetClipStart}} hh:mm:ss">'
	+ '<input name="end" placeholder="{{text.SetClipEnd}} hh:mm:ss">'

);
Q.Template.set('Q/clip/editor',
	'<button name="start" class="{{startFixed}}" type="button">{{text.ClipStart}}: <span class="Q_clip_edit">{{startTime}}</span></button>'
	+	'<button name="end" class="{{endFixed}}" type="button">{{text.ClipEnd}}: <span class="Q_clip_edit">{{endTime}}</button>'
);

})(window, Q, jQuery);
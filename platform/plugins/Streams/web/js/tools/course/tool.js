(function (Q, $, window, undefined) {

/**
 * JGR/course tool.
 * Renders a course tool
 * @class JGR/course
 * @constructor
 * @param {Object} [options] options to pass
 */
Q.Tool.define("JGR/course", function(options) {
	var tool = this;
	var state = this.state;
	var $toolElement = $(tool.element);

	Q.Streams.get(state.publisherId, state.streamName, function (err) {
		if (err) {
			return;
		}

		var stream = this;

		$toolElement.on(Q.Pointer.fastclick, ".JGR_course_conversation", function () {
			Q.invoke({
				title: "Conversation",
				content: $("<div>").tool("Streams/chat", {
					publisherId: stream.fields.publisherId,
					streamName: stream.fields.name
				}),
				trigger: tool.element,
				callback: function (options, index, div, data) {

				}
			});
		});

		Q.handle(tool.refresh, tool, [stream]);
	});
},

{
	publisherId: null,
	streamName: null
},

{
	refresh: function (stream) {
		var tool = this;
		var state = tool.state;
		var $toolElement = $(this.element);
		tool.stream = stream;

		var fields = {
			src: stream.fields.icon,
			title: stream.fields.title,
			content: stream.fields.content,
			topics: [],
			text: tool.text
		};

		Q.Template.render('JGR/course/tool', fields, function (err, html) {
			if (err) return;

			$toolElement.html(html);

			$(".participantsTool", $toolElement).tool('Streams/participants', {
				publisherId: stream.fields.publisherId,
				streamName: stream.fields.name,
				max: stream.getAttribute('peopleMax') || 10,
				maxShow: 10,
				showControls: true,
				onRefresh: function () {
					$(".Users_avatar_tool", this.element).first().tool("Q/badge", {
						br: {
							bottom: '15px',
							icon: "{{JGR}}/img/icon_lamp.png",
						}
					}).activate();
				}
			}).activate();

			$(".JGR_course_topics", $toolElement).tool("Streams/related", {
				publisherId: stream.fields.publisherId,
				streamName: stream.fields.name,
				relationType: "Streams/topic",
				creatable: {
					'Streams/topic': {title: "Add topic"}
				}
			}).activate();
			/*$(".JGR_course_enroll_calendar", $toolElement).pickadate({
				showMonthsShort: true,
				format: 'ddd, mmm d, yyyy',
				formatSubmit: 'yyyy/mm/dd',
				hiddenName: true,
				min: new Date()
			});*/
		});
	}
});

Q.Template.set('JGR/course/tool',
`<h1 class="JGR_course_title">{{title}}</h1>
	<div class="JGR_course_image" style="background-image: url({{src}})">
		<div class="JGR_course_front">
			{{content}}
		</div>
	</div>
	<div class="participantsTool"></div>
	<div class="JGR_course_enroll">
		<div class="JGR_course_enroll_calendar">
			<div class="item">MON<div class="time">2PM-3PM</div></div>
			<div class="item">MON<div class="time">2PM-3PM</div></div>
			<div class="item">SERIES<div class="time">10</div></div>
		</div>
		<button class="Q_button" name="enroll">{{text.course.Enroll}}</button>
	</div>
	<div class="JGR_course_conversation" ><h2>Conversation</h2></div>
	<div class="JGR_course_topics"></div>`
);

})(Q, Q.$, window);
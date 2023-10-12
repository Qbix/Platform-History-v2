(function (Q, $, window, undefined) {

/**
 * Streams/topic tool.
 * Renders a topic tool
 * @class Streams/topic
 * @constructor
 * @param {Object} [options] options to pass
 */
Q.Tool.define("Streams/topic", function(options) {
	var tool = this;
	var state = this.state;

	Q.Streams.get(state.publisherId, state.streamName, function (err) {
		var msg = Q.firstErrorMessage(err);
		if (msg) {
			return;
		}

		Q.handle(tool.refresh, tool, [this]);
	});

},

{
	publisherId: null,
	streamName: null,
	onConversation: new Q.Event()
},

{
	refresh: function (stream) {
		var tool = this;
		var state = tool.state;
		var $te = $(this.element);

		Q.Template.render('Streams/topic/tool', {
				src: stream.iconUrl(50),
				title: stream.fields.title,
				content: stream.fields.content
		}, function (err, html) {
			if (err) {
				return;
			}

			Q.replace(tool.element, html);

			// relations
			$(".Streams_topic_relations", tool.element).tool("Streams/related", {
				publisherId: stream.fields.publisherId,
				streamName: stream.fields.name,
				relationType: "Streams/subtopic",
				sortable: true,
				creatable: {
					'Streams/video': {title: "Add video"},
					'Streams/audio': {title: "Add audio"},
					'Streams/pdf': {title: "Add PDF"},
					//TODO: make topics browser in topic preview tool and use it instead composer to select already created topic
					//'Streams/topic': {title: "Add topic"}
				}

			}).activate();
		});
	}
});

Q.Template.set('Streams/topic/tool',
`<div class="Streams_topic_bg">
		<div class="Streams_topic_front">
			<div class="Streams_topic_image" style="background-image: url({{src}})"></div>
			<div class="Streams_topic_text">{{content}}</div>
		</div>
	</div>
	<div class="Streams_topic_conversation"><h2>{{topic.Conversation}}</h2></div>
	<div class="Streams_topic_relations"></div>`,
	{text: ['Streams/content']}
);

})(Q, Q.$, window);
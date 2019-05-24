Q.page("Streams/participating", function () {

	$(".Streams_participating_stream_checkmark").on("change", function () {
		var $this = $(this);
		var publisherId = $this.attr('data-publisherId');
		var name = $this.prop('name');

		if ($this.prop('checked')) {
			Q.Streams.Stream.subscribe(publisherId, name);
		} else {
			Q.Streams.Stream.unsubscribe(publisherId, name);
		}
	});

	return function () {

	};

}, 'Communities');

Q.Tool.onActivate("Q/expandable").set(function () {
	this.state.beforeExpand.set(function () {
		// create Streams/participants tools
		$(".Streams_participating_stream td[data-type=participants][data-processed=0]", this.element).each(function () {
			$("<div>").tool("Streams/participants", {
				'publisherId': this.getAttribute("data-publisherId"),
				'streamName': this.getAttribute("data-streamName"),
				'showSummary': true,
				'showBlanks': false,
				'showControls': true,
				'maxShow': 100
			}).appendTo(this).activate();

			this.setAttribute("data-processed", 1);
		});
	});
}, true);

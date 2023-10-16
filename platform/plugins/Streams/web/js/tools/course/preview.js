(function (Q, $, window, undefined) {

/**
 * Streams/course/preview tool.
 * Renders a tool to preview courses
 * @class Streams/course/preview
 * @constructor
 * @param {Object} [options] options to pass besides the ones to Streams/preview tool
 */
Q.Tool.define("Streams/course/preview", ["Streams/preview"], function(options, preview) {
	var tool = this;
	var $toolElement = $(tool.element);
	var state = this.state;
	tool.preview = preview;

	preview.state.imagepicker = Q.extend(preview.state.imagepicker, state.imagepicker);
	preview.state.onRefresh.add(tool.refresh.bind(tool));
	preview.state.creatable.preprocess = tool.composer.bind(tool);

	if (preview.state.streamName) {
		$toolElement.on(Q.Pointer.fastclick, function () {
			Q.handle(state.onInvoke, tool, [tool.stream]);
		});
	}
},

{
	publisherId: null,
	streamName: null,
	imagepicker: {
		showSize: "x400",
		fullSize: "x400",
		save: "Streams/course"
	},
	onInvoke: new Q.Event(function (stream) {
		Q.invoke({
			title: stream.fields.title,
			url: Q.url('course/' + stream.fields.publisherId + '/' + stream.fields.name.split('/').pop()),
			columnClass: 'Streams_column_course',
			trigger: this.element,
			onActivate: function (options, index, div, data) {

			}
		});
	})
},

{
	refresh: function (stream) {
		var tool = this;
		var state = this.state;
		var $toolElement = $(tool.element);
		var previewState = tool.preview.state;
		tool.stream = stream;

		var fields = {
			src: stream.iconUrl(state.imagepicker.showSize),
			title: stream.fields.title,
			content: stream.fields.content
		};
		Q.Template.render('Streams/course/preview', fields, function (err, html) {
			if (err) return;

			Q.replace(tool.element, html);

			$(".Streams_course_preview_title", tool.element).tool("Streams/inplace", {
				editable: false,
				field: "title",
				inplaceType: "text",
				publisherId: previewState.publisherId,
				streamName: previewState.streamName,
			}, "course_preview_title_" + stream.fields.name.split("/").pop())
			.activate();
			$(".Streams_course_preview_content", tool.element).tool("Streams/inplace", {
				editable: false,
				field: "content",
				inplaceType: "text",
				publisherId: previewState.publisherId,
				streamName: previewState.streamName,
			}, "course_preview_description_" + stream.fields.name.split("/").pop())
			.activate();

			$(".Streams_course_preview_participants", $toolElement).tool('Streams/participants', {
				publisherId: stream.fields.publisherId,
				streamName: stream.fields.name,
				max: stream.getAttribute('peopleMax') || 10,
				invite: false,
				maxShow: 10,
				onRefresh: function () {
					/*$(".Users_avatar_tool", this.element).first().tool("Q/badge", {
						br: {
							bottom: '15px',
							icon: "{{Streams}}/img/icon_lamp.png",
						}
					}).activate();*/
				}
			}).activate();

			if (stream.testWriteLevel('edit')) {
				previewState.actions.actions = previewState.actions.actions || {};
				if (!previewState.actions.actions.edit) {
					previewState.actions.actions.edit = function () {
						tool.update(function () {
							stream.refresh(function () {
								$(".Streams_course_preview_background", tool.element).css("background-image", "url("+stream.iconUrl(state.imagepicker.showSize)+")");
							}, {
								changed: {icon: true},
								messages: true,
								evenIfNotRetained: true
							});
						});
					};
				}
			}
		});
	},
	/**
	 * Create Course
	 * @method composer
	 */
	composer: function () {
		var tool = this;
		var $toolElement = $(this.element);
		var previewState = tool.preview.state;

		$toolElement.addClass("Q_working");
		Q.req("Streams/course", "newItem", function (err, response) {
			if (err) {
				return;
			}

			var newItem = response.slots.newItem;
			previewState.publisherId = newItem.publisherId;
			previewState.streamName = newItem.streamName;
			Q.Streams.get(previewState.publisherId, previewState.streamName, function (err) {
				if (err) {
					return;
				}

				$toolElement.removeClass("Q_working");
				tool.stream = this;
				tool.update();
			});
		}, {
			fields: {
				publisherId: previewState.publisherId,
				category: previewState.related
			}
		});
	},
	/**
	 * Update course
	 * @method update
	 */
	update: function (callback) {
		var tool = this;
		var $toolElement = $(this.element);
		var isNew = $toolElement.hasClass("Streams_preview_composer");
		var previewState = this.preview.state;
		var publisherId = previewState.publisherId;
		var streamName = previewState.streamName;
		previewState.editable = true; // we need to upload icon

		// need to update tool.stream
		// actually on this stage stream should be cached, so Streams.get is just reading stream from cache, hence it can be used as synchronous
		Q.Streams.get(publisherId, streamName, function () {
			tool.stream = this;
		});

		Q.Dialogs.push({
			title: isNew ? tool.text.course.NewCourse : tool.text.course.UpdateCourse,
			className: "Streams_course_preview_composer",
			template: {
				name: "Streams/course/composer",
				fields: {
					title: Q.getObject("stream.fields.title", tool) || "",
					content: Q.getObject("stream.fields.content", tool) || "",
					saveButtonText: isNew ? tool.text.course.CreateCourse : tool.text.course.UpdateCourse
				}
			},
			onActivate: function ($dialog) {
				var $icon = $("img.Streams_course_preview_icon", $dialog);
				var $save = $("button[name=save]", $dialog);

				// apply Streams/preview icon behavior
				tool.preview.icon($icon[0]);

				// create course
				$save.on(Q.Pointer.fastclick, function (event) {
					event.preventDefault();
					$save.addClass("Q_working");

					var pipe = new Q.pipe(["save", "unrelate", "relate"], function () {
						var relatedTool = Q.Tool.from($toolElement.closest(".Streams_related_tool"), "Streams/related");
						if (relatedTool) {
							relatedTool.refresh();
						}
						Q.handle(callback);
						$save.removeClass("Q_working");
						Q.Dialogs.pop();
					});
					tool.stream.set('title', $("input[name=title]", $dialog).val());
					tool.stream.set('content', $("textarea[name=description]", $dialog).val());
					tool.stream.save({
						onSave: pipe.fill("save")
					});

					if (isNew) {
						tool.stream.unrelateFrom(previewState.related.publisherId, previewState.related.streamName, "new", pipe.fill("unrelate"));
						tool.stream.relateTo(previewState.related.type, previewState.related.publisherId, previewState.related.streamName, pipe.fill("relate"));
					} else {
						pipe.fill("unrelate")();
						pipe.fill("relate")();
					}
				});
			}
		});
	}
});

Q.Template.set('Streams/course/preview',
`<div class="Streams_course_preview_background" style="background-image:url({{src}})">
		<div class="Streams_course_preview_foreground">
			<div class="Streams_course_preview_title">{{title}}</div>
			<div class="Streams_course_preview_content">{{content}}</div>
		</div>
	</div>
	<div class="Streams_course_preview_participants"></div>`
);
Q.Template.set('Streams/course/composer',
	`<form class="Streams_course_composer">
	<div class="Streams_course_composer_form_group">
		<input type="text" name="title" value="{{title}}" class="Streams_course_composer_form_control" placeholder="{{course.TitlePlaceholder}}">
	</div>
	<div class="Streams_course_composer_form_group">
		<textarea name="description" class="Streams_course_composer_form_control" placeholder="{{course.DescribeCourse}}">{{content}}</textarea>
	</div>
	<div class="Streams_course_composer_form_group" data-type="icon">
		<div class="Streams_course_composer_container">
			<img class="Streams_course_preview_icon">
		</div>
		<label>{{course.CourseIcon}}</label>
	</div>
	<button class="Q_button" name="save" type="button">{{saveButtonText}}</button>
</form>`, {text: ['Streams/content']});

})(Q, Q.$, window);
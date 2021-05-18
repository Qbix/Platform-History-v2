(function (window, Q, $, undefined) {
	
/**
 * @module Q
 */
	
/**
 * YUIDoc description goes here
 * @class Q pdf
 * @constructor
 * @param {Object} [options] Override various options for this tool
 *  @param {string} [options.url] Source to get pdf from. Can be remote url or "blob:" for local files
 *  @param {string} [options.clipStart] Clip start position in percents
 *  @param {string} [options.clipEnd] Clip end position in percents
 *  @param {Float} [options.scale=0.5] Page scale. More
 *  @param {Q.Event} [options.onSuccess] Call when save or upload action successfully ended.
 *  @param {Q.Event} [options.onFinish] Call when save or upload action ended.
 *  @param {Q.Event} [options.onError] Call when error occur.
 *  @param {Q.Event} [options.onScroll] Call when pdf scrolled.
 *  @param {Q.Event} [options.onRender] Call when pdf rendered.
 *  @param {Q.Event} [options.onEnded] Call when pdf scrolled to the end.
 *
 */
Q.Tool.define("Q/pdf", function (options) {
	var tool = this;
	var state = tool.state;

	if (state.url) {
		state.url = state.url.interpolate({ "baseUrl": Q.info.baseUrl });
	}

	var p = Q.pipe(['stylesheet', 'text'], function (params, subjects) {
		tool.text = params.text[1].pdf;

		tool.implement();
	});

	Q.addStylesheet(["{{Q}}/css/pdf.css"], p.fill('stylesheet'), { slotName: 'Q' });
	// we specially don' wait pdfjs lib loading, because it too big
	// it will load during user actions
	Q.addScript("{{Q}}/js/pdfjs/build/pdf.js");
	Q.Text.get('Q/content', p.fill('text'));

	tool.Q.onStateChanged('clipStart').set(function () {
		tool.setClip("start")
	});
	tool.Q.onStateChanged('clipEnd').set(function () {
		tool.setClip("end")
	});
},

{
	url: null,
	currentPosition: 0,
	clipStart: null,
	clipEnd: null,
	scale: 0.5,
	pdfInfo: {},
	onSuccess: new Q.Event(),
	onError: new Q.Event(function (message) {
		Q.alert('File upload error' + (message ? ': ' + message : '') + '.');
	}, 'Q/audio'),
	onFinish: new Q.Event(),
	/* </Q/audio jquery plugin states> */
	onRender: new Q.Event(function (numPages, element) {
		// remove preloader
		this.$preloader && this.$preloader.remove();

		this.state.stuffHeight = this.element.scrollHeight;

		this.setClip("start");
		this.setClip("end");
	}),
	onEnded: new Q.Event()
},

{
	/**
	 * Check clip borders and pause if outside
	 * @method checkClip
	 */
	checkClip: function () {
		var tool = this;
		var elementHeight = $(tool.element).height();
		var elementScrollTop = tool.element.scrollTop;
		var topClipLimit = tool.getClip("start");
		var bottomClipLimit = tool.getClip("end");

		// check if selected clip gap less than element height
		if (topClipLimit && bottomClipLimit && bottomClipLimit - topClipLimit < elementHeight) {
			return tool.setCurrentPosition(topClipLimit - (elementHeight - (bottomClipLimit - topClipLimit))/2);
		}

		// check clipStart border
		if (topClipLimit && topClipLimit && elementScrollTop < topClipLimit) {
			tool.setCurrentPosition(topClipLimit);
		}

		// check clipEnd border
		if (bottomClipLimit && bottomClipLimit && (elementScrollTop + elementHeight) > bottomClipLimit) {
			tool.setCurrentPosition(bottomClipLimit - elementHeight);
		}
	},
	/**
	 * Refreshes the appearance of the tool completely
	 * @method implement
	 */
	implement: function () {
		var tool = this;
		var state = this.state;
		var $toolElement = $(tool.element);

		// add preloader to cover up tool.element till pdf rendered (state.onRender)
		if (!tool.$preloader) {
			tool.$preloader = $("<div class='Q_pdf_preloader'><img src='" + Q.url("{{Q}}/img/throbbers/loading.gif") + "'></div>").appendTo(tool.element);
		}

		// wait till lib loaded
		if (Q.typeOf(window.pdfjsLib) === "undefined") {
			return setTimeout(tool.implement.bind(tool), 500);
		}

		// listen scroll event of preview element
		$toolElement.on("scroll", function () {
			state.currentPosition = ($toolElement.scrollTop()/state.stuffHeight * 100).toPrecision(3);
			tool.checkClip();
		});

		var loadingTask = pdfjsLib.getDocument(state.url);

		loadingTask.promise.then(function(pdf) {
			state.pdf = pdf;

			pdf.getMetadata().then(function(stuff) {
				state.pdfInfo.title = Q.getObject("info.Title", stuff) || Q.getObject("contentDispositionFilename", stuff);
				state.pdfInfo.description = Q.getObject("info.Subject", stuff);
				state.pdfInfo.author = Q.getObject("info.Author", stuff);
			}).catch(function(err) {
				console.log('Q/pdf: Error getting meta data');
				console.log(err);
			});

			tool.renderPage();
		});
	},
	/**
	 * Render pdf page
	 * @method renderPage
	 * @param {object} page
	 */
	renderPage: function (page) {
		var tool = this;
		var state = this.state;
		var pdf = state.pdf;
		var $toolElement = $(tool.element);

		if (!page) {
			return pdf.getPage(1).then(tool.renderPage.bind(tool));
		}

		//This gives us the page's dimensions at full scale
		var viewport = page.getViewport({
			scale: $toolElement.width()/page.getViewport({scale: state.scale}).width
		});

		//We'll create a canvas for each page to draw it on
		var canvas = document.createElement("canvas");
		canvas.height = viewport.height;
		canvas.width = viewport.width;

		var context = canvas.getContext('2d');

		//Draw it on the canvas
		page.render({
			canvasContext: context,
			viewport: viewport
		});

		//Add it to the web page
		tool.element.appendChild(canvas);

		var currPage = page.pageNumber + 1;

		//Move to next page
		if (pdf !== null && currPage <= pdf.numPages) {
			pdf.getPage(currPage).then(tool.renderPage.bind(tool));
		} else if (currPage >= pdf.numPages) {
			Q.handle(state.onRender, tool, [pdf.numPages, tool.element]);
		}
	},
	/**
	 * @method setCurrentPosition
	 * @param {number} position in pixels related to top
	 */
	setCurrentPosition: function (position) {
		var element = this.element;
		element.scrollTo(element.scrollLeft, position);
	},
	/**
	 * @method setClip
	 * @param {string} which Which side to setup, "start" or "end"
	 */
	setClip: function (which) {
		var tool = this;
		var state = this.state;
		var className = "Q_pdf_clip_" + which;
		var clipValue = tool.getClip(which);

		var $element = $("." + className, tool.element);

		if (clipValue === null) {
			return $element.remove();
		}

		if (!$element.length) {
			$element = $("<div>").addClass(className).appendTo(tool.element);
		}

		var height = 0;
		var top = 0;
		switch (which) {
			case "start":
				height = clipValue;
				break;
			case "end":
				height = state.stuffHeight - clipValue;
				top = clipValue;
				break;
		}

		$element.css({
			height: height,
			top: top,
			width: tool.element.scrollWidth
		});

		// scroll doc to clipStart
		if (which === "start") {
			$(tool.element).scrollTop(clipValue);
		}
	},
	/**
	 * Get clip border in pixels related to top
	 * @method getClip
	 * @param {string} which Which side to setup, "start" or "end"
	 */
	getClip: function (which) {
		var clipValue = this.state["clip" + which.toCapitalized()] || null;

		if (clipValue === null) {
			return null;
		}

		return this.state.stuffHeight * clipValue / 100;
	}
});

})(window, Q, jQuery);
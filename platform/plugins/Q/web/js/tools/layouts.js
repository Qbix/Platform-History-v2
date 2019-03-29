(function (Q, $) {
/**
 * @module Q-tools
 */
	
/**
 * Implements a common way to manage layouts for elements on desktop, mobile, etc.
 * @class Q layouts
 * @constructor
 * @param {Object} [options] Override various options for this tool
 * @param {Function} [options.filter] Gets passed an element, returns true if it should be processed
 * @return {Q.Tool}
 */
Q.Tool.define('Q/layouts', function (options) {

	var tool = this;
	var state = this.state;
	if (!tool.state.total) {
		throw new Q.Error("options.total is required");
	}

},

{
	filter: null,
	key: null,
	onLayout: new Q.Event()
}, 

{
	/**
	 * Sets a function to generate a layout
	 * @method setLayoutGenerator
	 * @param {String} key
	 * @param {Function} generator takes a number and returns array of DOMRect
	 */
	setLayoutGenerator: function (key, generator) {
		_generators[key] = generator;
	},
	/**
	 * Gets a layout generator that was added
	 * @method getLayoutGenerator
	 */
	getLayoutGenerator: function (key) {
		return _generators[key];
	},
	/**
	 * Applies a layout
	 * @method layout
	 * @param {String} key the key of the alyout
	 * @param {Number} count How many elements
	 */
	layout: function (key, count) {
        console.log('_generators[key]', key, count, _generators[key])
        var layout = _generators[key];;
		return layout != null
			? layout(this.element, count)
			: false;
	},
	/**
	 * Animates given elements to a layout
	 * @method layout
	 * @param {String|Function} generator The name of the layout generator, or a function
	 * @param {Array|jQuery} elements An array of elements, in order to fit the layout rectangles
	 * @param {Number} [duration=0] Number of milliseconds
	 * @param {String|Function} ease
	 *  The key of the ease function in Q.Animation.ease object, or another ease function
	 * @return {Boolean} Whether the layout generator existed
	 */
	animate: function (generator, elements, duration, ease) {
		console.log('elements', elements)
		var g = (typeof generator === 'function')
			? generator
			: _generators[generator];
		if (!g) {
			return false;
		}
		var tool = this;
		var container = tool.element;
		var layout = g(container, elements.length);
		if (container.computedStyle('position') === 'static') {
			container.style.position = 'relative';
		}
		console.log('animate layout', layout)
		var rects = [];
		var i, element;
		for(i = 0; element = elements[i]; i++){
            console.log('this element', element, i)

            if (!container.contains(element)) {
                if (element.style.position != 'absolute') {
                    element.style.position = 'absolute';
                }
                container.appendChild(element);
            }
            console.log('this.getBoundingClientRect()', element.getBoundingClientRect())
            rects.push(element.getBoundingClientRect());


		}
		console.log('this.animation', this.animation);
		if (this.animation) {
			this.animation.pause();
		}
		this.animation = Q.Animation.play(function (x, y) {
            var rects = [];
            var i, element;
            for(i = 0; element = elements[i]; i++){
                rects.push(element.getBoundingClientRect());
            }

			Q.each(elements, function (i) {
				var rect1 = rects[i];
				var rect2 = layout[i];
				var ts = elements[i].style;

                var currentLeft = parseInt(ts.left, 10);
                var currentTop = parseInt(ts.top, 10);
                var currentWidth = parseInt(ts.width, 10);
                var currentHeight = parseInt(ts.height, 10);

                if(currentLeft != rect2.left) ts.left = rect1.left + (rect2.left - rect1.left) * y + 'px';
                if(currentTop != rect2.top) ts.top = rect1.top + (rect2.top - rect1.top) * y + 'px';
                if(currentWidth != rect2.width) ts.width = rect1.width + (rect2.width - rect1.width) * y + 'px';
                if(currentHeight != rect2.height) ts.height = rect1.height + (rect2.height - rect1.height) * y + 'px';
			});
		}, 500, ease)
	}
});

var _generators = {
	tiledVertical: function (container, count) {
		// TODO: implement based on element.clientWidth and element.clientHeight
		// see the photos I sent you, layout is different depending on count
		// The container may have margins, depending on the CSS of the app.
		// What we care about here is the client width and client height.
		var w = container.clientWidth;
		var h = container.clientHeight;
		var rects = [];
		var rect = new DOMRect(1, 2, 3, 4);
		rects.push(rect);
		return rects;
	},
	tiledHorizontal: function (container, count) {
	
	},
	maximizedVertical: function (container, count) {
	
	},
	maximizedHorizontal: function (container, count) {
	
	},

	tiledVerticalMobile: function (container, count) {
		var containerRect = container.getBoundingClientRect()
		var size = {parentWidth:containerRect.width, parentHeight:containerRect.height};

		switch (count) {
            case 1:
                return simpleGrid(count, 1, size);
            case 2:
                return simpleGrid(count, 1, size);
                break;
            case 3:
                return simpleGrid(count, 1, size);
                break;
            case 4:
                return simpleGrid(count, 2, size);
                break;
            case 5:
                return simpleGridBasedOnRowsNum(count, 3, size)
                break;
            case 6:
                return simpleGrid(count, 2, size);
                break;
            default:
                return simpleGrid(count, 2, size);

        }
	},
	tiledHorizontalMobile: function (container, count) {
        var containerRect = container.getBoundingClientRect()
        var size = {parentWidth:containerRect.width, parentHeight:containerRect.height};

        switch (count) {
            case 1:
                return simpleGrid(count, 1, size);
            case 2:
                return simpleGrid(count, 1, size);
                break;
            case 3:
                return simpleGrid(count, 1, size);
                break;
            case 4:
                return simpleGrid(count, 2, size);
                break;
            case 5:
                return simpleGridBasedOnRowsNum(count, 3, size)
                break;
            case 6:
                return simpleGrid(count, 2, size);
                break;
            default:
                return simpleGrid(count, 2, size);

        }
	},
	maximizedVerticalMobile: function (container, count) {
        var containerRect = container.getBoundingClientRect()
        var size = {parentWidth:containerRect.width, parentHeight:containerRect.height};

        return maximizedMobile(count, size);
        },

	maximizedHorizontalMobile: function (container, count) {
        var containerRect = container.getBoundingClientRect()
        var size = {parentWidth:containerRect.width, parentHeight:containerRect.height};

        return maximizedHorizontalMobile(count, size);
	}
}


    function maximizedMobile(count, size) {

        var rects = [];

        var mainScreenRect = new DOMRect(0, 0, size.parentWidth, size.parentHeight);
        rects.push(mainScreenRect);

        var rectWidth = 100;
        var rectHeight = 100;
        var spaceBetween = 10;
        var perCol = Math.floor((size.parentHeight - 66) / (rectHeight + spaceBetween));
        var perRow =  Math.floor(size.parentWidth / (rectWidth + spaceBetween));

        console.log('perCol', perCol)
        var isNextNewLast = false;
        var colItemCounter = 1;
        var i;
        for (i = 1; i <= count; i++) {
            //var firstRect = new DOMRect(size.parentWidth - (rectWidth + spaceBetween), size.parentHeight - (rectHeight + spaceBetween), rectWidth, rectHeight)
            var firstRect = new DOMRect(size.parentWidth, size.parentHeight - 66, rectWidth, rectHeight)
            var prevRect = rects.length > 1 ? rects[rects.length - 1] : firstRect;
            console.log('prevRect', prevRect, firstRect)
            var currentCol = isNextNewLast  ? perRow : Math.ceil(i/perCol);
            var isNextNewCol  = colItemCounter  == perCol;
            isNextNewLast = isNextNewLast == true ? true : isNextNewCol && currentCol + 1 == perRow;

            console.log('currentCol',i, currentCol, perCol, perRow, isNextNewCol, isNextNewLast)

            var x,y;
            if(colItemCounter == 1) {
                y = (size.parentHeight - 60) - (rectHeight + spaceBetween);
                x = prevRect.x - (rectWidth + spaceBetween);
            } else {
                y = prevRect.y - (rectHeight + spaceBetween);
                x = prevRect.x;
            }
            var rect = new DOMRect(x, y, rectWidth, rectHeight);

            rects.push(rect);

            if(isNextNewCol) {
                colItemCounter = 1;
            } else colItemCounter++
        }

        return rects;
    }


    function maximizedHorizontalMobile(count, size) {

        var rects = [];

        var mainScreenRect = new DOMRect(0, 0, size.parentWidth, size.parentHeight);
        rects.push(mainScreenRect);

        var rectWidth = 100;
        var rectHeight = 100;
        var spaceBetween = 10;
        var perCol = Math.floor((size.parentHeight - 66) / (rectHeight + spaceBetween));
        var perRow =  Math.floor(size.parentWidth / (rectWidth + spaceBetween));

        console.log('perCol', perCol)
        var isNextNewLast = false;
        var rowItemCounter = 1;
        var i;
        for (i = 1; i <= count; i++) {
            //var firstRect = new DOMRect(size.parentWidth - (rectWidth + spaceBetween), size.parentHeight - (rectHeight + spaceBetween), rectWidth, rectHeight)
            var firstRect = new DOMRect(size.parentWidth, size.parentHeight, rectWidth, rectHeight)
            var prevRect = rects.length > 1 ? rects[rects.length - 1] : firstRect;
            console.log('prevRect', prevRect, firstRect)
            var currentRow = isNextNewLast  ? perRow : Math.ceil(i/perRow);
            var isNextNewRow  = rowItemCounter  == perRow;
            isNextNewLast = isNextNewLast == true ? true : isNextNewRow && currentRow + 1 == perRow;

            console.log('currentCol',i, currentRow, perCol, perRow, isNextNewRow, isNextNewLast)

            var x,y;
            if(rowItemCounter == 1) {

                if(currentRow == 1) {
                    y = (size.parentHeight - 60) - (rectHeight + spaceBetween);
                } else y =  prevRect.y - (rectHeight + spaceBetween);
                x = size.parentWidth - (rectWidth + spaceBetween);
            } else {
                y = prevRect.y;
                x = prevRect.x - (rectHeight + spaceBetween);
            }
            var rect = new DOMRect(x, y, rectWidth, rectHeight);

            rects.push(rect);

            if(isNextNewRow) {
                rowItemCounter = 1;
            } else rowItemCounter++
        }

        return rects;
    }

    function simpleGrid(count, perRow, size) {
        var rects = [];
        var rectWidth = size.parentWidth / perRow;
        var rectHeight = size.parentHeight / (count / perRow);
        var i;
        for (i = 0; i < count; i++) {
            var prevRect = rects[rects.length - 1] ? rects[rects.length - 1] : new DOMRect(0, 0, 0, 0) ;
            var isNewRow  = (i % perRow == 0);
            var currentRow = Math.ceil(i/perRow);
            if(isNewRow) {
                var y = prevRect.height * Math.ceil(i/perRow);
                var x = 0;
            } else {
                var y = prevRect.y;
                var x = prevRect.x + prevRect.width;
            }
            var rect = new DOMRect(x, y, rectWidth, rectHeight);
            rects.push(rect);
        }

        return rects;
    }

    function simpleGridBasedOnRowsNum(count, rowsNum, size) {
        var rects = []
        var perRow = Math.floor(count / rowsNum);

        var rectWidth = size.parentWidth / perRow;
        var rectHeight = size.parentHeight / rowsNum;
        var isNextNewLast   = false;
        var rowItemCounter = 1;
        var i;
        for (i = 1; i <= count; i++) {
            var prevRect = rects[rects.length - 1] ? rects[rects.length - 1] : new DOMRect(0, 0, 0, 0) ;
            var currentRow = isNextNewLast  ? rowsNum : Math.ceil(i/perRow);
            var isNextNewRow  = rowItemCounter == perRow;
            isNextNewLast = isNextNewLast == true ? true : isNextNewRow && currentRow + 1 == rowsNum;

            console.log('currentRow',i, currentRow, rowsNum, isNextNewRow, isNextNewLast)


            if(rowItemCounter == 1) {
                var y = prevRect.height * (currentRow - 1);
                var x = 0;
            } else {
                var y = prevRect.y;
                var x = prevRect.x + prevRect.width;
            }
            var rect = new DOMRect(x, y, rectWidth, rectHeight);

            if(isNextNewRow && isNextNewLast) {
                console.log(rectWidth, perRow)
                perRow = count - i;
                rectWidth = parentWidth / perRow;
                console.log(rectWidth, perRow)
            }


            rects.push(rect);

            if(isNextNewRow) {
                rowItemCounter = 1;
            } else rowItemCounter++
        }

        return rects;
    }

})(Q, jQuery);
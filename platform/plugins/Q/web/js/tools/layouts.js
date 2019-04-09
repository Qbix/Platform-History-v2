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

},

{
	elementToWrap: null,
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
		var rects = [];
		var i, element;
		for(i = 0; element = elements[i]; i++){
			var layoutRect = layout[i];
			console.log('animate layoutRect', layoutRect, element);


			if(layoutRect.width == 0 &&  layoutRect.height == 0) {
				element.style.height = 'auto';
				element.style.width = 'auto';
			}

            if (!container.contains(element)) {
                container.appendChild(element);
            }

            if (element.style.position != 'absolute') {
                element.style.position = 'absolute';
            }
            var elementRect = element.getBoundingClientRect();
			/*if(elementRect.width != 0 && elementRect.height != 0 && layoutRect.width != 0 && layoutRect.height != 0 && element.style.height == 'auto') {
				element.style.height = '';
				element.style.width = '';
			}*/
            rects.push(elementRect);


		}
		if (this.animation) {
			this.animation.pause();
		}

		this.animation = Q.Animation.play(function (x, y) {
			Q.each(elements, function (i) {
				var rect1 = rects[i];
				var rect2 = layout[i];
				var ts = elements[i].style;

                var currentLeft = parseFloat(ts.left);
                var currentTop = parseFloat(ts.top);
                var currentWidth = parseFloat(ts.width);
                var currentHeight = parseFloat(ts.height);

                //console.log('animation', currentWidth, currentHeight);
                if(currentLeft !== rect2.left) ts.left = rect1.left + (rect2.left - rect1.left) * y + 'px';
                if(currentTop !== rect2.top) ts.top = rect1.top + (rect2.top - rect1.top) * y + 'px';
                if((rect2.width != 0 && currentWidth != rect2.width) && currentWidth !== rect2.width) ts.width = rect1.width + (rect2.width - rect1.width) * y + 'px';
                if((rect2.height != 0 && currentWidth != rect2.height) && currentHeight !== rect2.height) ts.height = rect1.height + (rect2.height - rect1.height) * y + 'px';
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
	maximizedHorizontal: function (container, count, elementToWrap) {

	},

	tiledVerticalMobile: function (container, count) {
		var containerRect = container.getBoundingClientRect()
		var size = {parentWidth:containerRect.width, parentHeight:containerRect.height};

		switch (count) {
            case 1:
                return simpleGrid(count, size, 1);
            case 2:
                return simpleGrid(count, size, 1);
            case 3:
                return simpleGrid(count, size, 1, 2);
            case 4:
                return simpleGrid(count, size, 2);
            case 5:
                return simpleGridBasedOnRowsNum(count, 3, size)
            case 6:
                return simpleGrid(count, size, 2);
            default:
                return simpleGrid(count, size, 2);

        }
	},
	tiledHorizontalMobile: function (container, count) {
        var containerRect = container.getBoundingClientRect()
        var size = {parentWidth:containerRect.width, parentHeight:containerRect.height};

        switch (count) {
            case 1:
                return simpleGrid(count, size, 1);
            case 2:
                return simpleGrid(count, size, 2);
            case 3:
                return simpleGrid(count, size, 3);
            case 4:
                return simpleGrid(count, size, 2);
            case 5:
                return simpleGridBasedOnRowsNum(count, 3, size)
            case 6:
                return simpleGrid(count, size, 2);
            default:
                return simpleGrid(count, size, 2);

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
};


    function maximizedMobile(count, size) {

        var rects = [];


	    var mainScreenRect = new DOMRect(0, 0, size.parentWidth, size.parentHeight);
	    rects.push(mainScreenRect);

	    var rectWidth = 100;
	    var rectHeight = 100;
	    var spaceBetween = 10;
	    var totalRects = (size.parentWidth * (size.parentHeight - 66)) / ((rectWidth + spaceBetween) * (rectHeight + spaceBetween));
	    console.log('totalRects',totalRects)
	    var perCol = Math.floor((size.parentHeight - 66) / (rectHeight + spaceBetween));
	    var perRow =  Math.floor(size.parentWidth / (rectWidth + spaceBetween));
	    console.log('totalRects2', perCol * perRow)
	    if((perCol * perRow) < count) {

	    }


	    var side = 'right'
	    var isNextNewLast = false;
	    var createNewColOnRight = null;
	    var createNewColOnLeft = null;
	    var latestRightRect = null;
	    var latestLeftRect = null;
	    var colItemCounter = 1;
	    var leftSideCounter = 0;
	    var rightSideCounter = 0;
	    var i;
	    for (i = 1; i <= count; i++) {
		    var firstRect = new DOMRect(size.parentWidth, size.parentHeight - 66, rectWidth, rectHeight)
		    var prevRect = rects.length > 1 ? rects[rects.length - 2] : firstRect;
		    var currentCol = isNextNewLast  ? perRow : Math.ceil(i/perCol);
		    var isNextNewCol = colItemCounter  == perCol;
		    isNextNewLast = isNextNewLast == true ? true : isNextNewCol && currentCol + 1 == perRow;

		    var x, y, rect, prevRect;
		    if(side == "right") {
			    prevRect = latestRightRect;
			    if (rightSideCounter > 0 && !createNewColOnRight) {
				    y = prevRect.y - (rectHeight + spaceBetween);
				    x = prevRect.x;
			    } else if(createNewColOnRight) {
				    y = (size.parentHeight - 66) - (rectHeight + spaceBetween);
				    x = prevRect.x - (rectWidth + spaceBetween);
				    createNewColOnRight = false;
			    } else {
				    y = (size.parentHeight - 66) - (rectHeight + spaceBetween);
				    x = size.parentWidth - (rectWidth + spaceBetween);
			    }
			    rightSideCounter++;

			    rect = new DOMRect(x, y, rectWidth, rectHeight);
			    latestRightRect = rect;

			    side = 'left';

			    if(rightSideCounter % perCol == 0) {
				    createNewColOnRight = true;
			    }
		    } else {
			    prevRect = latestLeftRect;
			    if (leftSideCounter > 0 && !createNewColOnLeft) {
				    y = prevRect.y - (rectHeight + spaceBetween);
				    x = prevRect.x;
			    } else if(createNewColOnLeft) {
				    y = (size.parentHeight - 66) - (rectHeight + spaceBetween);
				    x = prevRect.x + prevRect.width + spaceBetween;
				    createNewColOnLeft = false;
			    } else {
				    y = (size.parentHeight - 66) - (rectHeight + spaceBetween);
				    x = spaceBetween;
			    }
			    leftSideCounter++;

			    rect = new DOMRect(x, y, rectWidth, rectHeight);
			    latestLeftRect = rect;

			    side = 'right';

			    if(leftSideCounter % perCol == 0) {
				    createNewColOnLeft = true;
			    }
		    }

		    rects.push(rect);

		    if(isNextNewCol) {
			    colItemCounter = 1;
		    } else colItemCounter++;
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
	    var totalRects = (size.parentWidth * (size.parentHeight - 66)) / ((rectWidth + spaceBetween) * (rectHeight + spaceBetween));
	    console.log('totalRects',totalRects)
	    var perCol = Math.floor((size.parentHeight - 66) / (rectHeight + spaceBetween));
	    var perRow =  Math.floor(size.parentWidth / (rectWidth + spaceBetween));
	    console.log('totalRects2', perCol * perRow)
	    if((perCol * perRow) < count) {

	    }


	    var side = 'right'
	    var isNextNewLast = false;
	    var createNewColOnRight = null;
	    var createNewColOnLeft = null;
	    var latestRightRect = null;
	    var latestLeftRect = null;
	    var colItemCounter = 1;
	    var leftSideCounter = 0;
	    var rightSideCounter = 0;
	    var i;
	    for (i = 1; i <= count; i++) {
		    var firstRect = new DOMRect(size.parentWidth, size.parentHeight - 66, rectWidth, rectHeight)
		    var prevRect = rects.length > 1 ? rects[rects.length - 2] : firstRect;
		    var currentCol = isNextNewLast  ? perRow : Math.ceil(i/perCol);
		    var isNextNewCol = colItemCounter  == perCol;
		    isNextNewLast = isNextNewLast == true ? true : isNextNewCol && currentCol + 1 == perRow;

		    var x, y, rect, prevRect;
		    if(side == "right") {
			    prevRect = latestRightRect;
			    if (rightSideCounter > 0 && !createNewColOnRight) {
				    y = prevRect.y - (rectHeight + spaceBetween);
				    x = prevRect.x;
			    } else if(createNewColOnRight) {
				    y = (size.parentHeight - 66) - (rectHeight + spaceBetween);
				    x = prevRect.x - (rectWidth + spaceBetween);
				    createNewColOnRight = false;
			    } else {
				    y = (size.parentHeight - 66) - (rectHeight + spaceBetween);
				    x = size.parentWidth - (rectWidth + spaceBetween);
			    }
			    rightSideCounter++;

			    rect = new DOMRect(x, y, rectWidth, rectHeight);
			    latestRightRect = rect;

			    side = 'left';

			    if(rightSideCounter % perCol == 0) {
				    createNewColOnRight = true;
			    }
		    } else {
			    prevRect = latestLeftRect;
			    if (leftSideCounter > 0 && !createNewColOnLeft) {
				    y = prevRect.y - (rectHeight + spaceBetween);
				    x = prevRect.x;
			    } else if(createNewColOnLeft) {
				    y = (size.parentHeight - 66) - (rectHeight + spaceBetween);
				    x = prevRect.x + prevRect.width + spaceBetween;
				    createNewColOnLeft = false;
			    } else {
				    y = (size.parentHeight - 66) - (rectHeight + spaceBetween);
				    x = spaceBetween;
			    }
			    leftSideCounter++;

			    rect = new DOMRect(x, y, rectWidth, rectHeight);
			    latestLeftRect = rect;

			    side = 'right';

			    if(leftSideCounter % perCol == 0) {
				    createNewColOnLeft = true;
			    }
		    }

		    rects.push(rect);

		    if(isNextNewCol) {
			    colItemCounter = 1;
		    } else colItemCounter++;
	    }


	    return rects;
    }

    function simpleGrid(count, size, perRow, rowsNum) {
        var rects = [];
        var rectHeight;
        var rectWidth = size.parentWidth / perRow;
        if(rowsNum == null) {
	        rectHeight = size.parentHeight / Math.ceil(count / perRow);
	        rowsNum = Math.floor(size.parentHeight / rectHeight);
        } else {
	        rectHeight = size.parentHeight / rowsNum;
        }


	    var isNextNewLast = false;
	    var rowItemCounter = 1;
        var i;
        for (i = 1; i <= count; i++) {
	        var prevRect = rects[rects.length - 1] ? rects[rects.length - 1] : new DOMRect(0, 0, 0, 0) ;
	        var currentRow = isNextNewLast  ? rowsNum : Math.ceil(i/perRow);
	        var isNextNewRow  = rowItemCounter == perRow;
	        isNextNewLast = isNextNewLast == true ? true : isNextNewRow && currentRow + 1 == rowsNum;

	        if(rowItemCounter == 1) {
		        var y = prevRect.height * (currentRow - 1);
                var x = 0;
            } else {
                var y = prevRect.y;
                var x = prevRect.x + prevRect.width;
            }

            var rect = new DOMRect(x, y, rectWidth, rectHeight);

	        if (isNextNewRow && isNextNewLast) {
		        perRow = count - i;
		        rectWidth = size.parentWidth / perRow;

	        }
            rects.push(rect);

	        if (isNextNewRow) {
		        rowItemCounter = 1;
	        } else rowItemCounter++;
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

            if(rowItemCounter == 1) {
                var y = prevRect.height * (currentRow - 1);
                var x = 0;
            } else {
                var y = prevRect.y;
                var x = prevRect.x + prevRect.width;
            }
            var rect = new DOMRect(x, y, rectWidth, rectHeight);

            if(isNextNewRow && isNextNewLast) {
                perRow = count - i;
                rectWidth = size.parentWidth / perRow;
            }


            rects.push(rect);

            if(isNextNewRow) {
                rowItemCounter = 1;
            } else rowItemCounter++
        }

        return rects;
    }

})(Q, jQuery);
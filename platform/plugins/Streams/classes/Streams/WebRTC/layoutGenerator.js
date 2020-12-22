'use strict';

function layoutGenerator(layoutName, numberOfRects) {

    var _size = {width: 1280, height:768}
    var Rect = function (x, y, width, height) {
        this.x = x !== null ? x : null;
        this.y = y !== null ? y : null;
        this.width = width !== null ? width : null;
        this.height = height !== null ? height : null;
    };
    var layouts = {
        tiledHorizontalMobile: function (container, count) {
            var size = {parentWidth: _size.width, parentHeight: _size.height};

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
        screenSharing: function (container, count) {
            var size = {parentWidth: _size.width, parentHeight: _size.height};

            return screenSharingLayout(count, size, true);
        }
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
            var prevRect = rects[rects.length - 1] ? rects[rects.length - 1] : new Rect(0, 0, 0, 0) ;
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

            var rect = new Rect(x, y, rectWidth, rectHeight);

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
            var prevRect = rects[rects.length - 1] ? rects[rects.length - 1] : new Rect(0, 0, 0, 0) ;
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
            var rect = new Rect(x, y, rectWidth, rectHeight);

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

    function screenSharingLayout(count, size, maximized) {
        var rects = [];

        if(maximized) {
            var mainScreenRect = new Rect(0, 0, size.parentWidth, size.parentHeight);
            rects.push(mainScreenRect);
            count--;
        }

        var rectWidth, rectHeight;
        if(_size.width > _size.height) {
            rectHeight = _size.height / 100 * 15.5;
            rectWidth = rectHeight / 9 * 16;
        } else {
            rectWidth = _size.width / 100 * 16.5;
            rectHeight = rectWidth / 16 * 9;
        }
        var spaceBetween = 10;
        var totalRects = (size.parentWidth * (size.parentHeight - 66)) / ((rectWidth + spaceBetween) * (rectHeight + spaceBetween));
        var perCol = Math.floor((size.parentHeight - 66) / (rectHeight + spaceBetween));
        var perRow =  Math.floor(size.parentWidth / (rectWidth + spaceBetween));

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
            var firstRect = new Rect(size.parentWidth, size.parentHeight - 66, rectWidth, rectHeight)
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

                rect = new Rect(x, y, rectWidth, rectHeight);
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

                rect = new Rect(x, y, rectWidth, rectHeight);
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

    return layouts[layoutName]({width: _size.width, height: _size.height}, numberOfRects);
}

module.exports = layoutGenerator;

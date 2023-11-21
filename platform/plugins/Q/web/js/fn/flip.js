(function (Q, $, window, document, undefined) {

/**
 * This plugin Makes a flip animation using two block elements. The html structure must be a container with two nested block elements.
 * @example
 * <div>
 *	 <div>Front side</div>
 *	 <div>Back side</div>
 * </div>
 * @method flip
 * @param {Object} [options] options is an Object with function parameters
 * @param {String} [options.direction] direction May be 'h' (horizontal) or 'v' (vertical) . Optional.
 * @default 'h'
 * @param {Number} [options.duration] duration is a Duration of animation in milliseconds
 * @default 500
 * @param {Q.Event} [options.onFinish] onFinish  Q.Event to call when flipping is finished. Optional.
 */
Q.Tool.jQuery('Q/flip',

function (o) {
	return this.each(function(index)
	{
		var $this = $(this);
		if (!$this.data('Q_flipping'))
		{
			$this.data('Q_flipping', true);
			$this.css({ '-webkit-perspective': '1000px' });
		
			var frontSide = $($this.children()[0]);
			var backSide = $($this.children()[1]);
			if (frontSide.attr('data-side') && backSide.attr('data-side'))
			{
				frontSide = $this.children('[data-side="front"]');
				backSide = $this.children('[data-side="back"]');
			}
			if (frontSide.data('flip-animation') || backSide.data('flip-animation'))
				return; // already animating
			frontSide.data('flip-animation', true);
			backSide.data('flip-animation', true);
			var axisRotate = o.direction == 'h' ? 'Y' : 'X';
			var axisScale = o.direction == 'h' ? 'X' : 'Y';
			
			var curSide = frontSide;
			var startTime = new Date().getTime();
			var time = 0;
			Q.Interval.set(function()
			{
				if (time == -1)
					return;
					
				time = (new Date().getTime() - startTime) / o.duration;
				if (time <= 1)
					{
						var angle = Math.round((curSide == frontSide ? 0 : -180) + 180 * Q.Animation.ease.inOutQuintic(time));
					if (angle > 90)
						angle = 90;
					var scaleFactor = Math.round(Math.cos(Math.PI * angle / 180) * 1000) / 1000;
					curSide.css({
						'-webkit-transform': Q.info.platform == 'android' ? 'scale' + axisScale + '(' + scaleFactor + ')'
																															: 'rotate' + axisRotate + '(' + angle + 'deg)',
						'-moz-transform': 'scale' + axisScale + '(' + scaleFactor + ')',
						'-o-transform': 'scale' + axisScale + '(' + scaleFactor + ')',
						'filter': 'progid:DXImageTransform.Microsoft.Matrix(sizingMethod="auto expand", ' +
						(o.direction == 'h' ? 'M11=' + scaleFactor + ', M12=0, M21=0, M22=1' : 'M11=1, M12=0, M21=0, M22=' + scaleFactor) + ')'
					});
					if (curSide == frontSide && angle >= 90)
					{
						frontSide.hide();
						curSide = backSide;
						curSide.css({
							'-webkit-transform': Q.info.platform == 'android' ? 'scale' + axisScale + '(0)'
																																: 'rotate' + axisRotate + '(-90deg)',
							'-moz-transform': 'scale' + axisScale + '(0)',
							'-o-transform': 'scale' + axisScale + '(0)',
							'filter': 'progid:DXImageTransform.Microsoft.Matrix(sizingMethod="auto expand", ' +
							(o.direction == 'h' ? 'M11=0, M12=0, M21=0, M22=1' : 'M11=1, M12=0, M21=0, M22=0') + ')'
						}).show();
					}
					}
				else
				{
					time = -1;
					
					Q.Interval.clear('Q_flip_update');
					
					if (curSide == frontSide)
					{
						frontSide.hide();
						curSide = backSide;
						curSide.show();
					}
					
					$this.css({ '-webkit-perspective': '' });
					
					frontSide.css({
						'-webkit-transform': '',
						'-moz-transform': '',
						'-o-transform': '',
						'-ms-transform': '',
						'filter': ''
					});
					backSide.css({
						'-webkit-transform': '',
						'-moz-transform': '',
						'-o-transform': '',
						'-ms-transform': '',
						'filter': ''
					});
					frontSide.attr('data-side', 'back').data('flip-animation', false);
					backSide.attr('data-side', 'front').data('flip-animation', false);
					
					$this.data('Q_flipping', false);
					
					Q.handle(o.onFinish);
				}
			}, 20, 'Q_flip_update');
		}
	});
},

{
	'direction': 'h',
	'duration': 500,
	'onFinish': new Q.Event(function() {})
}

);

})(Q, Q.jQuery, window, document);
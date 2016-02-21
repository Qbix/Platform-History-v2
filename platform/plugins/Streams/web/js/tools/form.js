(function (Q, $, window, document, undefined) {

/**
 * @module Streams-tools
 */
	
/**
 * Generates a form with inputs that modify various streams
 * @class Streams form
 * @constructor
 * @param {array} options
 *  An associative array of parameters, containing:
 * @param {array} [options.fields] an associative array of {id: fieldinfo} pairs,
 *   where id is the id to append to the tool's id, to generate the input's id,
 *   and fieldinfo is either an associative array with the following fields,
 *   or a regular array consisting of fields in the following order:
 *     "publisherId" => Required. The id of the user publishing the stream
 *     "streamName" => Required. The name of the stream
 *     "field" => The stream field to edit, or "attribute:$attributeName" for an attribute.
 *     "type" => The type of the input (@see Q_Html::smartTag())
 *     "attributes" => Additional attributes for the input
 *     "value" => The initial value of the input
 *     "options" => options for the input (if type is "select", "checkboxes" or "radios")
 */
Q.Tool.define("Streams/form", function (options) {
	var tool = this;
	var state = tool.state;

	var $inputs = tool.$('input, select').not('[type="hidden"]');
	var $hidden = tool.$('input[name=inputs]');
	$inputs.on('change', function () {
		var $this = $(this);
		var $parent = $this.parent();
		var name = null;
		var value = null;
		var $inputs = $this;
		if ($parent.attr('data-type') === 'date') {
			var notReady = false;
			var y, m, d;
			$inputs = $parent.find('select').each(function () {
				var $this = $(this);
				switch ($this.attr('name').split('_').pop()) {
					case 'year': y = $this.val(); break;
					case 'month': m = $this.val(); break;
					case 'day': d = $this.val(); break;
				}
				var value = $this.val();
				if (!value || value == '0') {
					notReady = true;
					return false;
				}
			});
			var parts = $this.attr('name').split('_');
			name = parts.slice(0, parts.length-1).join('_');
			value = y + '-' + m + '-' + d;
		} else {
			name = $this.attr('name');
			value = $this.val();
		}
		if (notReady) {
			return;
		}
		var fields = {};
		fields[name] = value;
		fields.inputs = $hidden.val();
		$inputs.addClass('Q_uploading');
		Q.req('Streams/form', 'streams', function () {
			$inputs.removeClass('Q_uploading');
		}, {method: 'post', fields: fields});
	});

},

{
	
}

);

})(Q, jQuery, window, document);
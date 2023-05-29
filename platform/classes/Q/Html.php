<?php

/**
 * @module Q
 */
/**
 * This class lets you output various HTML markup tags
 * @class Q_Html
 */
class Q_Html
{
	/**
	 * Generates a querystring based on the current $_GET
	 * @method query
	 * @static
	 * @param {array} $fields Associative array. The keys are the fields to take 
	 *  from $_GET, the values are the defaults.
	 * @param {array} [$more_fields=array()] The array to merge over the query array before building the querystring.
	 * @return {string} The resulting querystring.
	 */
	static function query(
	 $fields,
	 $more_fields = array())
	{
		$query_array = array();
		foreach ($fields as $field => $default) {
			$query_array[$field] = array_key_exists($field, $_GET)
			 ? $_GET[$field]
			 : $default;
		}
		$query_array = array_merge($query_array, $more_fields);
		$query = http_build_query($query_array, '', '&');
	}
	
	/**
	 * Generates a link for sending an sms message
	 * @static
	 * @method sms
	 * @param {string} [$body]
	 * @param {string|array} [$mobileNumbers]
	 * @return {string}
	 */
	function sms ($body, $mobileNumbers) {
		$ios = (Q_Request::platform() === 'ios');
		if (is_array($mobileNumbers)) {
			$temp = array();
			foreach ($mobileNumbers as $mobileNumber) {
				$temp[] = urlencode($mobileNumber);
			}
			$mobileNumbers = ($ios ? '/open?addresses=' : '') . implode(',', $temp);
		}
		$url = "sms:$mobileNumbers";
		$char = $ios ? '?' : '&';
		return $url . $char . 'body=' . urlencode($body);
	}
	
	/**
	 * Generates a link for sending an email message
	 * @static
	 * @method email
	 * @param {string} [subject]
	 * @param {string} [body]
	 * @param {string|array} [to]
	 * @param {string|array} [cc]
	 * @param {string|array} [bcc]
	 * @return {string}
	 */
	function email($subject, $body, $to, $cc, $bcc) {
		$ios = (Q_Request::platform() === 'ios');
		$to = $to ? $to : (is_array($to) ? implode(',', $to) : $to);
		$cc = $cc ? $cc : (is_array($cc) ? implode(',', $cc) : $cc);
		$bcc = $bcc ? $bcc : (is_array($bcc) ? implode(',', $bcc) : $bcc);
		$names = array('cc', 'bcc', 'subject', 'body');
		$parts = array($cc, $bcc, $subject, $body);
		$url = "mailto:" . urlencode($to ? $to : '');
		$char = '?';
		for ($i=0, $l=count($names); $i<$l; ++$i) {
			if ($parts[$i]) {
				$url .= $char . $names[$i] . '=' . urlencode($parts[$i]);
				$char = '&';
			}
		}
		return $url;
	}
	
	/**
	 * Generates markup for a link element
	 * @method a
	 * @static
	 * @param {string|Q_Uri} $href Could be a URL string, a Q_Uri object, or a string
	 *  representing a Q_Uri object.
	 * @param {array} [$attributes=array()] An associative array of additional attributes.
	 * @param {string} [$contents=null] If null, only the opening tag is generated. 
	 *  If a string, also inserts the contents and generates a closing tag.
	 *  If you want to do escaping on the contents, you must do it yourself.
	 *  If true, auto-closes the tag.
	 * @return {string} The generated markup
	 */
	static function a(
	 $href, 
	 $attributes = array(),
	 $contents = null)
	{
		if (!is_array($attributes)) {
			if (isset($attributes)) {
				$contents = $attributes;
			}
			$attributes = array();
		}
		$tag_params = array_merge(
			@compact('href'),
			$attributes
		);
		return self::tag('a', $tag_params, $contents);
	}
	
	/**
	 * Renders a form
	 * @method form
	 * @static
	 * @param {string|Q_Uri} [$action=''] Could be a URL string, a Q_Uri object, or a string representing a Q_Uri object.
	 * @param {string} [$method='post'] The method for the form submission.
	 * @param {array} [$attributes=array()] An associative array of additional attributes. (say that 4 times fast)
	 * @param {string} [$contents=null] If null, only the opening tag is generated. 
	 *  If a string, also inserts the contents and generates a closing tag.
	 *  If you want to do escaping on the contents, you must do it yourself.
	 * @return {string} The generated markup
	 * @throws {Exception}
	 */
	static function form(
	 $action = '',
	 $method = 'POST',
	 $attributes = array(),
	 $contents = null)
	{
		if (isset($method) and !is_string($method)) {
			throw new Exception("form method is not a string");
		}
		if (!is_array($attributes)) {
			if (isset($attributes)) {
				$contents = $attributes;
			}
			$attributes = array();
		}
		$input = null;
		$method = strtoupper($method);
		if ($method != 'GET' and $method != 'POST') {
			$input = Q_Html::hidden(array('Q.method' => $method));
			$method = 'POST';
		}
		if (!isset($method)) {
			unset($method);
		}
		$tag_params = array_merge(
			@compact('action', 'method'),
			$attributes
		);
		if (isset($contents)) {
			$contents = $input . $contents;
		}
		$form = self::tag('form', $tag_params, $contents);
		return isset($contents) ? $form : $form.$input;
	}
	
	/**
	 * Renders Q-specific information for a form
	 * @method formInfo
	 * @static
	 * @param {string} $onSuccess The URI or URL to redirect to in case of success
	 *  If you put "true" here, it uses Q_Request::special('onSuccess', $uri),
	 *  or if it's not there, then `Q_Dispatcher::uri()`
	 * @param {string} [$onErrors=null] The URI or URL to redirect to in case of errors
	 *  If you put "true" here, it uses Q_Request::special('onErrors', $uri),
	 *  or if it's not there, then `Q_Dispatcher::uri()`
	 * @return {string} The generated markup
	 */
	static function formInfo(
	 $onSuccess,
	 $onErrors = null)
	{
		$uri = Q_Dispatcher::uri();
		if ($onSuccess === true) {
			$onSuccess = Q_Request::special('onSuccess', $uri);
		}
		if ($onErrors === true) {
			$onErrors = Q_Request::special('onErrors', $uri);
		}
		$hiddenFields = array();
		if (isset($onSuccess)) {
			$hiddenFields['Q.onSuccess'] = Q_Uri::url($onSuccess);
		}
		if (isset($onErrors)) {
			$hiddenFields['Q.onErrors'] = Q_Uri::url($onErrors);
		}
		if ($nonce = Q_Session::calculateNonce()) {
			$hiddenFields['Q.nonce'] = $nonce;
		}
		return self::hidden($hiddenFields);
	}
	
	/**
	 * Renders a bunch of hidden inputs
	 * @method hidden
	 * @static
	 * @param {array} [$list=array()] An associative array of fieldname => fieldvalue pairs.
	 * @param {array|string} [$keys=null] An array of keys to precede the keys in the associative array.
	 *  If a string is passed, it becomes the name of the field (array).
	 *  Defaults to empty. Used mainly during recursion.
	 * @param {boolean} [$class_attributes=true] Defaults to true. If true, generates the class attribute from the name of each field.
	 */
	static function hidden (
	 array $list = array(), 
	 $keys = null,
	 $class_attributes = true)
	{
		if (!isset($keys)) {
			$keys = array();
		} else if (is_string($keys)) {
			$keys = array($keys);
		}
	
		$hiddenFields = array();

		$name = '';
		foreach ($keys as $key) {
			if (!$name) {
				$name = $key;
			} else {
				$name .= "[$key]";
			}
		}

		foreach ($list as $key => $value) {
			$name2 = $name ? $name.'['.$key.']' : $key;
			$class = ($class_attributes === true)
				? preg_replace('/[^A-Za-z0-9]/', '_', $name2)
				: null;
			if (!is_array($value)) {
				$hiddenFields[] = self::tag('input', array(
					'type' => 'hidden', 
					'name' => $name2, 
					'value' => $value,
					'class' => $class
				));
			}
		}
		$html = implode('', $hiddenFields);
		foreach ($list as $key => $value) {
			if (is_array($value)) {
				$keys2 = $keys;
				$keys2[] = $key;
				$html .= self::hidden($value, $keys2);
			}
		}
		return $html;
	}
	
	/**
	 * Renders a form input
	 * @method input
	 * @static
	 * @param {string} $name The name of the input. Will be sanitized.
	 * @param {string} $value The value of the input. Will be sanitized.
	 * @param {array} [$attributes=array()] An array of additional attributes to render. 
	 *  Consists of name => value pairs.
	 * @return {string} The generated markup
	 */
	static function input (
		$name, 
		$value, 
		$attributes = array())
	{
		if (!isset($attributes)) {
			$attributes = array();
		}
		$type = 'text';
		$tag_params = array_merge(@compact('name', 'value', 'type'), $attributes);
		return self::tag('input', $tag_params, null);
	}
	
	/**
	 * Renders a textarea in a form
	 * @method textarea
	 * @static
	 * @param {string} $name The name of the input. Will be sanitized.
	 * @param {string} $rows The number of rows in the textarea.
	 * @param {string} $cols The number of columns in the textarea.
	 * @param array [$attributes=array()] An array of additional attributes to render. Consists of name => value pairs.
	 * @param {string} [$contents=null] If null, only the opening tag is generated. 
	 *  If a string, also inserts the contents and generates a closing tag.
	 *  If you want to do escaping on the contents, you must do it yourself.
	 * @return {string} The generated markup
	 */
	static function textarea (
		$name, 
		$rows, 
		$cols,
		$attributes = array(), 
		$contents = null)
	{
		if (!is_array($attributes)) {
			if (isset($attributes)) {
				$contents = $attributes;
			}
			$attributes = array();
		}
		$tag_params = array_merge(@compact('name', 'rows', 'cols'), $attributes);
		return self::tag('textarea', $tag_params, $contents);
	}
	
	/**
	 * Renders a select tag
	 * @method select
	 * @static
	 * @param {string} $name The name of the input. Will be sanitized..
	 * @param {array} [$attributes=array()] An array of additional attributes to render. 
	 *  Consists of name => value pairs.
	 * @param {string} $contents Defaults to null, but you can place the output of Q_Html::options here.
	 * @return {string} The generated markup
	 */
	static function select (
		$name,  
		$attributes = array(),
		$contents = null)
	{
		if (!isset($attributes))
			$attributes = array();
		$tag_params = array_merge(@compact('name'), $attributes);
		return self::tag('select', $tag_params, $contents);
	}
	
	/**
	 * Renders a series of options for a select tag from an associative array we already have
	 * @method options
	 * @static
	 * @param {array} $list Associative array of value => caption.
	 * @param {array} [$ids=''] Either an associative array of key => id (in the HTML element sense) pairs, or
	 *   a prefix to which autogenerated ids will be appended
	 * @param {string|integer} [$selected=null] The name of a single key, or an array indicating which options are selected. If a key from $list 
	 *  is present as a key in this array, that option is selected.
	 * @param {string} [$includeBlank=null] If null, don't include a blank option. 
	 *  Otherwise, make a blank item (with value="") and 
	 *  caption=$includeBlank if it's a string, or "" otherwise.
	 * @param {string} [$between=''] The text to insert in the markup between the generated elements.
	 *  Since this text won't be shown in the browser, it's just for source formatting purposes.
	 * @param {array} [$attributes=array()] An array of additional attributes to render. Consists of name => value pairs.
	 * @return {string} The generated markup
	 */
	static function options (
		$list, 
		$ids = '',
		$selected = null, 
		$includeBlank = null, 
		$between = '',
		$attributes = array())
	{
		if (! is_array($list))
			return '</select><div class="Q_error">The list for Q_Html::options must be an array.</div>';
		if (!isset($attributes))
			$attributes = array();	
		if (empty($ids))
			$ids = null;

		$i = 0;
		$html_parts = array();
		foreach ($list as $key => $value) {
			if (is_array($value)) {
				$html_parts[] = self::tag('optgroup', array('label' => $key), null);
				foreach ($value as $k => $v) {
					if (is_string($ids)) {
						$id = $ids . '_' . $i;
					} else if (is_array($ids)) {
						$id = isset($ids[$k]) ? $ids[$k] : reset($ids) . '_' . $i;
					} else {
						$id = null;
					}
					$attributes2 = self::copyAttributes($attributes, $k);
					$attributes2['value'] = $k;
					if (isset($id)) {
						$attributes2['id'] = $id;
					}
					if (is_array($selected) and array_key_exists($k, $selected)) {
						$attributes2['selected'] = 'selected';
					} else if ("$k" === "$selected") {
						$attributes2['selected'] = 'selected';
					}
					$html_parts[] = self::tag('option', $attributes2, $v);
					++ $i;
				}
				$html_parts[] = "</optgroup>";
			} else {
				if (is_string($ids)) {
					$id = $ids . '_' . $i;
				} else if (is_array($ids)) {
					$id = isset($ids[$key]) ? $ids[$key] : reset($ids) . '_' . $i;
				} else {
					$id = null;
				}
				$attributes2 = self::copyAttributes($attributes, $key);
				$attributes2['value'] = $key;
				if (isset($id)) {
					$attributes2['id'] = $id;
				}
				if (is_array($selected) and array_key_exists($key, $selected)) {
					$attributes2['selected'] = 'selected';
				} else if ("$key" === "$selected") {
					$attributes2['selected'] = 'selected';
				}
				$html_parts[] = self::tag('option', $attributes2, $value);
				++ $i;
			}
		}
		
		$blank_option_html = '';
		if (isset($includeBlank) and $includeBlank !== false) {
			$blankCaption = is_string($includeBlank) ? $includeBlank : '';
			if (! isset($selected) or $selected === '') {
				$blank_option_html = '<option value="" selected="selected" disabled="disabled">' 
				 . self::text($blankCaption) .
				 '</option>';
			} else {
				$blank_option_html = '<option value="" disabled="disabled">' . $blankCaption . '</option>';
			}
		}
		
		return $blank_option_html . implode($between, $html_parts);
	}

	/**
	 * Renders a series of checkboxes from an associative array we already have
	 * @method checkboxes
	 * @static
	 * @param {string} $name The name of the input
	 * @param {array} $list Associative array of value => caption.
	 * @param {array} [$ids=''] Either an associative array of key => id (in the HTML element sense) pairs, or
	 *  a string. If a string, then a counter (1, 2, 3) is appended to each subsequent id.
	 * @param {array|string} [$checked=array()] The name of a single key, or an array indicating which checkboxes are checked. If a key from $list 
	 *  is present as a key in this array, that checkbox is checked.
	 * @param {string} [$between=''] The text to insert in the markup between the generated elements
	 * @param {array} [$attributes=array()] An array of additional attributes to render. 
	 *  Consists of name => value pairs.
	 * @return {string} The generated markup
	 */
	static function checkboxes (
		$name, 
		$list, 
		$ids = '',
		$checked = array(), 
		$between = '', 
		$attributes = array())
	{
		if (! is_array($list))
			return '<div class="Q_error">The list for checkboxes must be an array.</div>';
		if (!isset($checked))
			$checked = array();
		if (!isset($attributes))
			$attributes = array();	
		if (empty($ids))
			$ids = 'checkboxes'.mt_rand(100, 1000000);
		if (is_string($checked)) {
			$checked = array($checked => true);
		}

		$i = 0;
		$html_parts = array();
		foreach ($list as $key => $value) {
			if (is_string($ids)) {
				$id = $ids . '_' . $i;
			} else if (is_array($ids)) {
				$id = isset($ids[$key]) ? $ids[$key] : reset($ids) . '_' . $i;
			}
			$attributes2 = self::copyAttributes($attributes, $key);
			$attributes2['type'] = 'checkbox';
			$attributes2['name'] = $name;
			$attributes2['value'] = $key;
			$attributes2['id'] = $id;
			if (array_key_exists($key, $checked)) {
				$attributes2['checked'] = 'checked';
			}
			$html_parts[] = self::tag('input', $attributes2, true)
				. self::tag('label', array('for' => $id), self::text($value));
			++ $i;
		}
		return implode($between, $html_parts);
	}

	/**
	 * Renders a series of radio buttons from an associative array we already have
	 * @method radios
	 * @static
	 * @param {string} $name The name of the input
	 * @param {array} $list Associative array of value => caption.
	 * @param {array|string} [$ids=''] Either an associative array of key => id (in the HTML element sense) pairs, or a string prefix for ids
	 * @param {string} [$selectedKey=null] Basically the value of the selected radiobutton
	 * @param {string} [$between=''] The text to insert in the markup between the generated elements
	 * @param {array} [$attributes=array()] An array of additional attributes to render. Consists of name => value pairs.
	 * @return {string} The generated markup
	 */
	static function radios (
		$name, 
		$list, 
		$ids = '', 
		$selectedKey = null, 
		$between = '', 
		$attributes = array())
	{
		if (! is_array($list))
			return '<div class="Q_error">The list for radios must be an array.</div>';
		if (!isset($attributes))
			$attributes = array();
		if (empty($ids))
			$ids = 'radios'.mt_rand(100, 1000000);

		$i = 0;
		$html_parts = array();
		foreach ($list as $key => $value) {
			if (is_string($ids)) {
				$id = $ids . '_' . $i;
			} else if (is_array($ids)) {
				$id = isset($ids[$key]) ? $ids[$key] : reset($ids) . '_' . $i;
			}
			$attributes2 = $attributes;
			$attributes2['type'] = 'radio';
			$attributes2['name'] = $name;
			$attributes2['value'] = $key;
			$attributes2['id'] = $id;
			if ($key == $selectedKey) {
				$attributes2['checked'] = 'checked';
			}
			$html_parts[] = self::tag('input', $attributes2, true)
				. self::tag('label', array('for' => $id), self::text($value));
			++ $i;
		}
		return implode($between, $html_parts);
	}
	
	/**
	 * Renders a series of buttons from an associative array we already have
	 * @method buttons
	 * @static
	 * @param {string} $name The name of the input
	 * @param {array} $list Associative array of value => caption.
	 * @param {array} [$ids=''] Either an associative array of key => id (in the HTML element sense) pairs, or
	 * @param {string} [$between=''] The text to insert in the markup between the generated elements
	 * @param {array} [$attributes=array()] An array of additional attributes to render. Consists of name => value pairs.
	 * @return {string} The generated markup
	 */
	static function buttons (
		$name, 
		$list, 
		$ids = '', 
		$between = '', 
		$attributes = array())
	{
		if (! is_array($list))
			return '<div class="Q_error">The list for buttons must be an array.</div>';
		if (!isset($attributes))
			$attributes = array();
		if (empty($ids))
			$ids = 'buttons'.mt_rand(100, 1000000);

		$i = 0;
		$html_parts = array();
		foreach ($list as $key => $value) {
			if (is_string($ids)) {
				$id = $ids . '_' . $i;
			} else if (is_array($ids)) {
				$id = isset($ids[$key]) ? $ids[$key] : reset($ids) . '_' . $i;
			}
			$attributes2 = self::copyAttributes($attributes, $key);
			$attributes2 = array_merge(
				array(
					'type' => 'submit',
					'name' => $name,
					'value' => $key,
					'id' => $id
				), 
				$attributes2
			);
			$html_parts[] = self::tag('button', $attributes2, $value);
			++ $i;
		}
		return implode($between, $html_parts);
	}
	
	/**
	 * Renders an img tag
	 * @method img
	 * @static
	 * @param {string} $src The source of the image. Will be subjected to theming before being rendered.
	 * @param {string} [$alt='image'] The alternative text to display in place of the image.
	 * @param {array} [$attributes=array()] An array of additional attributes to render. Consists of name => value pairs.
	 * @param {array} [$attributes.cacheBust] Optionally pass milliseconds, to use Q_Uri::cacheBust on the src.
	 * @param {array} [$attributes.dontLazyload] Optionally pass true, to skip doing any potential lazyload
	 * @return {string} The generated markup
	 */
	static function img (
		$src, 
		$alt = 'image',
		$attributes = array())
	{
		if (is_array($alt)) {
			$attributes = $alt;
			$alt = "image";
		}
		if (!is_string($alt)) {
			$alt = 'not a string';
		}
		$tag_params = array_merge(@compact('src', 'alt'), $attributes);
		$lazyload = Q_Config::get('Q', 'images', 'lazyload', array());
		$dontLazyload = Q::ifset($attributes, 'dontLazyload', null);
		unset($attributes['dontLazyload']);
		if ($lazyload and !$dontLazyload
		and !empty($tag_params['src'])) {
			if (!self::$environmentWithoutJavascript
			and !self::$lazyloadWithoutJavascript) {
				$src = Q_Html::themedUrl($tag_params['src']);
				$tag_params['data-lazyload-src'] = $src;
				$tag_params['src'] = self::themedUrl(
					!empty($lazyload['loadingSrc'])
						? $lazyload['loadingSrc']
						: "{{Q}}/img/throbbers/transparent.gif"
				);
			} else {
				$tag_params['loading'] = 'lazy';
			}
		}
		return self::tag('img', $tag_params);
	}
	
	/**
	 * Renders a div with some id and classes
	 * @method div
	 * @static
	 * @param {string} $id The id of the div. It will be prefixed with the current id prefix.
	 * @param {string} [$class='']The classes of the div. Could be a string or an array of strings.
	 * @param {array} [$attributes=array()] An array of additional attributes to render. Consists of name => value pairs.
	 * @param {string} [$content=null] The content of the label
	 * @return {string} The generated markup
	 */
	static function div (
		$id, 
		$class = '',
		$attributes = array(), 
		$contents = null)
	{
		if (!is_array($attributes)) {
			if (isset($attributes)) {
				$contents = $attributes;
			}
			$attributes = array();
		}
		$tag_params = array_merge(@compact('id', 'class'), $attributes);
		return self::tag('div', $tag_params, $contents);
	}
	
	/**
	 * Renders a label for some element
	 * @method label
	 * @static
	 * @param {string} $for The id of the element the label is tied to. It will be prefixed with the current id prefix
	 * @param {array} [$attributes=array()] An array of additional attributes to render. Consists of name => value pairs.
	 * @param {string} [$contents=null] The contents of the label
	 * @return {string} The generated markup
	 */
	static function label (
		$for, 
		$attributes = array(),
		$contents = null)
	{
		if (!is_array($attributes)) {
			if (isset($attributes)) {
				$contents = $attributes;
			}
			$attributes = array();
		}
		$tag_params = array_merge(@compact('for'), $attributes);
		return self::tag('label', $tag_params, $contents);
	}
	
	/**
	 * Renders a date selector
	 * @method date
	 * @static
	 * @param {string} $name The name of the input
	 * @param {string} [$value=null] You can put a date here, as a string
	 * @param {array} [$options=null] Options include the following:
	 *
	 * * "year_from" => the first year in the selector
	 * * "year_to" => the last year in the selector
	 *
	 * @param {array} [$attributes=array()] An array of additional attributes to render. Consists of name => value pairs.
	 * @return {string} The generated markup
	 */
	static function date(
		$name,
		$value = null,
		$options = null,
		$attributes = array())
	{
		if (empty($value)) {
			$value = null;
		}
		$id = isset($attributes['id']) ? $attributes['id'] : '';
		$year_from = isset($options['year_from'])
		 ? $options['year_from']
		 : 1900;
		$year_to = isset($options['year_to'])
		 ? $options['year_to']
		 : date('Y');
		for ($i=$year_to; $i>=$year_from; --$i) {
			$years[$i] = (string)$i;
		}
		$months = array(
			"01" => 'January', "02" => 'February', "03" => 'March', "04" => 'April',
			"05" => 'May', "06" => 'June', "07" => 'July', "08" => 'August',
			"09" => 'September', "10" => 'October', "11" => 'November', "12" => 'December'
		);
		$days = array();
		for ($i=1; $i<=31; ++$i) {
			$days[sprintf("%02d", $i)] = (string)$i;
		}
		if (!isset($value)) {
			$year = $month = $day = null;
		} else {
			$v = is_numeric($value) ? $value : strtotime($value);
			$dp = getdate($v);
			$year = (isset($dp['year'])) ? sprintf("%02d", $dp['year']) : null;
			$month = (isset($dp['mon'])) ? sprintf("%02d", $dp['mon']) : null;
			$day = (isset($dp['mday'])) ? sprintf("%02d", $dp['mday']) : null;
		}
		$attributes['name'] = $name . '_year';
		if ($id) $attributes['id'] = $id . '_year';
		$year_select = self::tag('select', $attributes) 
		 . self::options($years, $id, $year, Q::t('year'))
		 . "</select>";
		$attributes['name'] = $name . '_month';
		if ($id) $attributes['id'] = $id . '_month';
		$month_select = self::tag('select', $attributes) 
		 . self::options($months, $id,  $month, Q::t('month'))
		 . "</select>";
		$attributes['name'] = $name . '_day';
		if ($id) $attributes['id'] = $id . '_day';
		$day_select = self::tag('select', $attributes) 
		 . self::options($days, $id, $day, Q::t('day'))
		 . "</select>";
		$language = Q::ifset($_SERVER, 'HTTP_ACCEPT_LANGUAGE', 'en-US');
		$mdy_countries = array('en-us', 'en-bz');
		if (in_array(strtolower(substr($language, 0, 5)), $mdy_countries) !== false) {
			return "$month_select$day_select$year_select";
		} else {
			$ymd_countries = array('ch', 'ko', 'hu', 'fa', 'ja', 'lt', 'mn');
			if (in_array(strtolower(substr($language, 0, 2)), $ymd_countries) !== false) {
				return "$year_select$day_select$month_select";
			} else {
				return "$day_select$month_select$year_select";
			}
		}
	}

	/**
	 * Renders a different tag based on what you specified.
	 * @method smartTag
	 * @static
	 * @param {string} $type The type of the tag. Could be one of
	 *  'static', 'boolean', 'text', 'email', 'tel', 
	 *  'textarea', 'password', 'select', 
	 *  'radios', 'checkboxes', 'buttons', 'submit_buttons',
	 *  'submit', 'hidden', 'image', 'file', or the name of a tag.
	 * @param {array|string} [$attributes=array()] The attributes for the resulting element. Should at least include the name. You can also just pass the name as a string here.
	 * @param {array} [$value=null] The value to start out with in the resulting element. If there are options present, this should be the value of one of the options.
	 * @param {array} [$options=null] Associative array of options, used if the tag type is 'select', 'radios' or 'checkboxes'.
	 * @param {array} [$params=array()] Additional parameters to pass to the corresponding function,
	 *   such as array(4 => $includeBlank)
	 * @return {string} The generated markup
	 */
	static function smartTag(
		$type, 
		$attributes = array(), 
		$value = null, 
		$options = null,
		$params = array())
	{
		if (!isset($type)) {
			throw new Q_Exception_RequiredField(array('field' => 'type'));
		}
		if (is_string($attributes)) {
			$attributes = array('name' => $attributes);
		}
		if (!is_array($attributes)) {
			$attributes = array();
		}

		$id = isset($attributes['id']) ? $attributes['id'] : null;

		switch ($type) {
			case 'hidden':
				return self::hidden(
					$value, 
					isset($attributes['name']) ? $attributes['name'] : null,
					isset($params[0]) ? $params[0] : true
				);
				
			case 'static':
				unset($attributes['name']);
				if (empty($options['date'])) {
					$display = isset($options[$value]) ? $options[$value] : $value;
				} else {
					$v = is_numeric($value) ? $value : strtotime($value);
					$display = (!empty($v) and substr($v, 0, 4) !== '0000')
						? date($options['date'], $v)
						: '';
					Q::log("\n\n$v\n$display\n\n");
				}
			 	return self::tag('span', $attributes, $display);
			
			case 'boolean':
				$attributes['type'] = 'checkbox';
				if (!empty($value))
					$attributes['checked'] = 'checked';
				return self::tag('input', $attributes);
				
			case 'text':
			case 'submit':
			case 'email':
			case 'tel':
				$attributes['type'] = $type;
				$attributes['value'] = $value;
				return self::tag('input', $attributes);
			
			case 'textarea':
				if (!isset($attributes['rows']))
					$attributes['rows'] = 5;
				if (!isset($attributes['cols']))
					$attributes['cols'] = 20;
				return self::tag('textarea', $attributes, self::text($value));
	
			case 'password':
				$attributes['type'] = 'password';
				$attributes['maxlength'] = 64;
				$attributes['value'] = ''; // passwords should be cleared
				return self::tag('input', $attributes);
	
			case 'select':
				return self::tag('select', $attributes)
				. self::options(
					$options, $id, $value,
					isset($params[0]) ? $params[0] : null,
					isset($params[1]) ? $params[1] : '',
					isset($params[2]) ? $params[2] : array()
				) . "</select>";
				
			case 'radios':
				unset($attributes['value']);
				return "<div>"
				. self::radios(
					$attributes['name'], 
					$options, $id, $value, "</div><div>", $attributes,
					isset($params[0]) ? $params[0] : array()
				) . "</div>";

			case 'checkboxes':
				unset($attributes['value']);
				return "<div>"
				. self::checkboxes(
					$attributes['name'],
					$options, $id, $value, "</div><div>", $attributes
				) . "</div>";
				
			case 'buttons':
				unset($attributes['value']);
				return "<div>"
				. self::buttons($attributes['name'], $options, $id, '', $attributes)
				. "</div>";
				
			case 'submit_buttons':
				unset($attributes['value']);
				$attributes['type'] = 'submit';
				return "<div>"
				. self::buttons($attributes['name'], $options, $id, '', $attributes)
				. "</div>";
				
			case 'image':
				$attributes['src'] = $value;
				$attributes['alt'] = $type;
				return self::tag('img', $attributes);
				
			case 'date':
				return self::date($attributes['name'], $value, $options, $attributes);

			case 'file':
				$attributes['type'] = 'file';
				return self::tag('input', $attributes, $value);
				
			default:
				return self::tag($type, $attributes, $value);
		}
	}
	
	/**
	 * @method render
	 * @static
	 * @param {mixed} $object
	 * @return {string}
	 */
	static function render($object)
	{
		if (is_callable($object, "__toMarkup")) {
			return $object->__toMarkup();
		} else {
			return (string)$object;
		}
	}
	
	
	/**
	 * Renders an swf object using the standard &lt;object> tag, which 
	 * hopefully all new modern browsers already support.
	 * @method swf
	 * @static
	 * @param {string} $movie_url The (relative or absolute) url of the movie
	 * @param {array} [$flash_params=array()] An array of additional &lt;param> elements to render within the &lt;object> element.
	 *  Consists of name => value pairs. Note that the parameter with name="movie" is always rendered.
	 * @param {array} [$attributes=array()] An array of additional attributes to render. Consists of name => value pairs.
	 *  Don't forget to include "codebase", "width", "height" and "classid"
	 *  Can also contain "cacheBust" => milliseconds, to use Q_Uri::cacheBust on the src.
	 * @return {string} The resulting markup
	 */
	static function swf (
		$movie_url,
		$flash_params = array(),
		$attributes = array())
	{		
		$contents = '';
		$flash_params['movie'] = self::text($movie_url);
		foreach ($flash_params as $name => $value) {
			$contents .= self::tag('param', @compact('name', 'value'));
		}
		
		// Here, we'll only render the object tag
		// Most modern browsers should see it.
		if (!is_array($attributes))
			$attributes = array();
		$tag_params = array_merge(@compact('data'), $attributes);
		return self::tag('object', $tag_params, $contents);
	}
	
	/**
	 * Renders a script (probably a javascript)
	 * @method script
	 * @static
	 * @param {string} $script The actual script, as text
	 * @param {array} [$attributes=null] Any additional attributes. Also can include:
	 *  "cdata" => Defaults to true. Whether to enclose in CDATA tags.
	 *  "comment" => Whether to enclose in HTML comments
	 *  "raw" => Set to true to skip HTML encoding even if cdata and comment are false
	 *  "cacheBust" => milliseconds, to use Q_Uri::cacheBust on the src.
	 * @return {string} The generated markup.
	 */
	static function script (
		$script, 
		$attributes = array())
	{
		if (empty($attributes['type'])) {
			$attributes['type'] = 'text/javascript';
		}
		if (!isset($attributes['cdata'])) {
			$attributes['cdata'] = true;
		}
		$cdata = !empty($attributes['cdata']);
		unset($attributes['cdata']);
		$comment = !empty($attributes['comment']);
		unset($attributes['comment']);
		$raw = !empty($attributes['raw']);
		unset($attributes['raw']);
		$return = "\n".self::tag('script', $attributes);
		if ($cdata) {
			$return .= "\n// <![CDATA[\n";
		} else if ($comment) {
			$return .= "<!-- \n"; 
		} else {
			$return .= "\n";
			if (!$raw) {
				$script = self::text($script);
			}
		}
		$return .= $script;
		if ($cdata) {
			$return .= "\n// ]]> \n"; 
		} else if ($comment) {
			$return .= "\n//-->";
		} else {
			$return .= "\n";
		}
		$return .= "</script>\n";
		
		return $return;
	}
	
	/**
	 * Renders an arbitrary HTML tag
	 * @method tag
	 * @static
	 * @param {string} $tag The tag name of the element
	 * @param {array} [$attributes=array()] An array of additional attributes to render. Consists of name => value pairs.
	 *  Can also contain "cacheBust" => milliseconds, to use Q_Uri::cacheBust on the src.
	 * @param {string} [$contents=null] If null, only the opening tag is generated. 
	 *  If a string, also inserts the contents and generates a closing tag.
	 *  If you want to do escaping on the contents, you must do it yourself.
	 *  If true, auto-closes the tag.
	 * @param {array} [$options=array()]
	 * @param {boolean} [$options.ignoreEnvironment=false] If true, doesn't apply environment transformations
	 * @param {string} [$options.hash=null] If URL was already processed with cachedUrlAndCache, set hash here to avoid calling it again
	 * @return {string}
	 */
	static function tag (
		$tag, 
		$attributes = array(), 
		$contents = null,
		$options = array())
	{
		if (!is_string($tag)) {
			throw new Exception('tag name is not a string');
		}

		if (!is_array($attributes)) {
			if (isset($attributes)) {
				$contents = $attributes;
			}
			$attributes = array();
		}
			
		$attributes = self::attributes(
			$attributes, ' ', true, $tag, $options
		);
		if (is_numeric($contents)) {
			$contents = (string)$contents;
		}
		if (is_string($contents)) {
			$contents = Q::t($contents);
			$return = "<$tag $attributes>$contents</$tag>";
		} else if ($contents === true) {
			$return = "<$tag $attributes />";
		} else {
			$return = "<$tag $attributes>";
		}
		return $return;
	}
	
	/**
	 * Escapes a string, converting all HTML entities
	 * into plain text equivalents.
	 * @method text
	 * @static
	 * @param {string} $content The string to escape
	 * @param {string} [$convert=array()] An array of additional characters to convert. Can include "\n" and " ".
	 * @param {string} [$unconvert=array()] An array of from => to pairs to unconvert back.
	 * @return {string}
	 */
	static function text(
	 $content,
	 $convert = array(),
	 $unconvert = array())
	{
		if (!is_array($convert)) {
			$convert = array();
		}
		$result = htmlentities(Q::t($content), ENT_QUOTES, 'UTF-8');
		if ($convert or $unconvert) {
			$conversions = array(
				"\n" => "<br>",
				" " => "&nbsp;",
			);
			foreach ($convert as $c) {
				$convert_to[] = $conversions[$c];
			}
			foreach ($unconvert as $from => $to) {
				$convert[] = $from;
				$convert_to[] = $to;
			}
			$result = str_replace($convert, $convert_to, $result);
		}
		return $result;
	}
	
	/**
	 * Escapes a string, so it can be outputted within
	 * javascript. Note that this can be used within
	 * js files as well as inline scripts. However,
	 * inline scripts should be html-escaped or
	 * enclosed within &lt;![CDATA[ ... ]]>
	 * So use Html::script().
	 * @method json
	 * @static
	 * @param {string} $content The string to escape
	 * @return {string}
	 */
	static function json(
	 $content)
	{
		self::text(Q::json_encode($content));
	}	
	
	/**
	 * Returns an HTML element ID, constrained to alphanumeric
	 * characters with dashes and underscores, and possibly prefixed.
	 * @method id
	 * @static
	 * @param {string} $id Any string
	 * @param {string} [$prefix] To override the default prefix
	 * @return {string}
	 */
	static function id($id, $prefix = null)
	{
		$id = preg_replace('/[^A-Za-z0-9-]/', '_', $id);
		$prefix = isset($prefix) ? $prefix : self::getIdPrefix();
		return $prefix ? $prefix.$id : $id;
	}
	
	/**
	 * Generates a string from an attribute array
	 * @method attributes
	 * @static
	 * @protected
	 * @param {array} $attributes Associative array of name => value pairs.
	 * @param {string} [$between=' '] The text to insert between the attribute="value"
	 * @param {string} [$escape=true] Whether to escape the attribute names and values.
	 * @param {string} [$tag='']
	 * @param {array} [$options=array()]
	 * @param {boolean} [$options.ignoreEnvironment=false] If true, doesn't apply environment transformations
	 * @param {string} [$options.hash=null] If URL was already processed with cachedUrlAndCache, set hash here to avoid calling it again
	 * @return {string}
	 */
	public static function attributes (
		array $attributes, 
		$between = ' ', 
		$escape = true, 
		$tag = '',
		$options = array())
	{
		$cacheBust = null;
		if (isset($attributes['cacheBust'])) {
			$cacheBust = $attributes['cacheBust'];
			unset($attributes['cacheBust']);
		}
		if (Q_Config::get('Q', 'html', 'w3c', true)) {
			$defaults = array(
				'img' => array(
					'src' => null,
					'alt' => 'image'
				),
				'a' => array(
					'href' => '#missing_href'
				),
				'form' => array(
					'action' => ''
				),
				'textarea' => array(
					'rows' => 5,
					'cols' => 20
				),
				'meta' => array(
					'content' => ''
				),
				'applet' => array(
					'width' => '300px',
					'height' => '100px'
				),
				'optgroup' => array(
					'label' => 'group'
				),
				'map' => array(
					'name' => 'map'
				),
				'param' => array(
					'name' => '_Q_missing'
				),
				'basefont' => array(
					'size' => '100'
				),
				'bdo' => array(
					'dir' => '/'
				),
				'script' => array(
					'type' => 'text/javascript'
				),
				'style' => array(
					'type' => 'text/css'
				),
				'object' => array(
					'classid' => "_Q_missing", 
					'codebase' => "http://download.macromedia.com/pub/shockwave /cabs/flash/swflash.cab#version=9,0,115,0", 
					'width' => '550',
					'height' => '400'
				),
			);
			if (isset($defaults[$tag]) and is_array($defaults[$tag])) {
				$attributes = $attributes + $defaults[$tag];
			}
		}
		
		$result = '';
		$i = 0;
		foreach ($attributes as $name => $value) {
			if (!isset($value)) {
				continue; // skip null attributes
			}
			$name2 = $name;
			$ltag = strtolower($tag);
			$lname = strtolower($name);
			if (strpos($ltag, 'frame') !== false and $lname == 'src') {
				$name2 = 'href'; // treat the src as href
			}
			if ($ltag == 'link' and $lname == 'href') {
				$name2 = 'src'; // treat the href as src
			}

			$isUrl = false;
			switch (mb_strtolower($name2, 'UTF-8')) {
				case 'href': // Automatic unrouting of this attribute
					$href = true;
				case 'action': // Automatic unrouting of this attribute
					$value = Q_Uri::url($value);
					if ($value === false) {
						$value = '#_Q_bad_url';
					}
					$isUrl = true;
					break;
				case 'src': // Automatically prefixes theme url if any
					list ($value, $filename, $hash) = self::themedUrlFilenameAndHash($value, $options);
					$isUrl = true;
					break;
				case 'id': // Automatic prefixing of this attribute
				case 'for': // For labels, too
					if ($prefix = self::getIdPrefix()) {
						$value = $prefix . $value;
					}
					$isUrl = true;
					break;
			}
			if ($isUrl and isset($cacheBust)) {
				$value = Q_Uri::cacheBust($value, $cacheBust);
			}
			if ($escape) {
				$name = self::text($name);
				$value = self::text($value);
			}
			$result .= ($i > 0 ? $between : '') . $name . '="' . $value . '"';
			++ $i;
		}
		if (!empty($hash) and ($ltag === 'link' or $ltag === 'script')) {
			if (empty($attributes['rel']) or $attributes['rel'] !== 'preload') {
				$result .= ' integrity="sha256-' . $hash . '"';
			}
		}
		return $result;
	}
	
	/**
	 * Copies attributes from a given array. Traverses the $attributes array.
	 * If the value is a string, copies it over. If it is an array, checks
	 * whether it contains $key and if it does, copies the value over.
	 * @method copyAttributes
	 * @static
	 * @protected
	 * @param {array} $attributes An associative array of attributes
	 * @param {string} $key The key of the field being considered. 
	 * @return {array}
	 */
	protected static function copyAttributes($attributes, $key)
	{
		$result = array();
		foreach ($attributes as $k => $v) {
			if (is_array($v)) {
				if (array_key_exists($key, $v)) {
					$result[$k] = $v[$key];
				}
			} else {
				$result[$k] = $v;
			}
		}
		return $result;
	}

	/**
	 * Sets a new id prefix to prefix all ids rendered by Html.
	 * It gets pushed on top of the stack and can be pieped later.
	 * @method pushIdPrefix
	 * @static
	 * @param {string} $id_prefix The prefix to apply to all ids rendered by Html after this
	 * @param {array} $tool_ids The ids of tools rendered on this element
	 * @return {string|null} The prefix previously on top of the stack, if any
	 */
	static function pushIdPrefix ($id_prefix, $tool_ids = null)
	{
		$prev_prefix = self::$id_prefix;
		array_push(self::$tool_ids, $tool_ids);
		array_push(self::$id_prefixes, $id_prefix);
		self::$id_prefix = $id_prefix;
		return $prev_prefix;
	}

	/**
	 * Pops the last id prefix.
	 * Now all ids rendered by Q_Html will be prefixed with the
	 * id previously on top of the stack, if any.
	 * @method popIdPrefix
	 * @static
	 * @return {string|null} The prefix that has been popped, if any
	 */
	static function popIdPrefix ()
	{
		if (count(self::$id_prefixes) <= 1) {
			throw new Exception("Nothing to pop from prefix stack");
		}
		array_pop(self::$tool_ids);
		$popped_prefix = array_pop(self::$id_prefixes);
		self::$id_prefix = end(self::$id_prefixes);
		return $popped_prefix;
	}

	/**
	 * The current prefix that will be applied to all ids
	 * rendered by Q_Html.
	 * @method getIdPrefix
	 * @param {string} toolName Optional name of the tool that is being rendered
	 * @static
	 * @return {string|null} The prefix that is currently at the top of the prefix stack.
	 */
	static function getIdPrefix ($tool_name = null)
	{
		$tool_name = $tool_name ? $tool_name : Q::$toolName;
		return is_string(self::$id_prefix)
			? self::$id_prefix
			: (isset(self::$id_prefix[$tool_name]) ? self::$id_prefix[$tool_name] : null);
	}
	
	/**
	 * The ids of tools rendered on this element
	 * @method getToolIds
	 * @static
	 * @return {array} The tool ids array that is currently at the top of the prefix stack.
	 */
	static function getToolIds ()
	{
		return end(self::$tool_ids);
	}

	/**
	 * Pushes a new theme url to the end of the cascade -- 
	 * if a theme file doesn't exist, we go backwards through the cascade
	 * and if we locate it under a previous theme url, we use that one.
	 * NOTE: If your webserver supports .htaccess files, you can implement
	 * cascading themes much more efficiently: simply push ONE theme url
	 * using this function, and implement the cascade using .htaccess files.
	 * @method pushThemeUrl
	 * @static
	 * @param {string} $theme The url to be prepended to all non-absolute "src" attributes 
	 * (except for iframes) rendered by Q_Html
	 * @return {array} The new list of themes
	 */
	static function pushThemeUrl ($theme)
	{
		if (!self::$theme) {
			self::$theme = Q_Config::get('Q', 'theme', null);
		}
		self::$theme = Q_Valid::url($theme)
			? $theme
			: Q_Request::baseUrl().'/'.$theme;
		self::$themes[] = self::$theme;
		return self::$themes;
	}

	/**
	 * The current theme url applied to all "src" attributes (except for iframes)
	 * rendered by Q_Html.
	 * @method themeUrl
	 * @static
	 * @return {string|null} The theme url that is currently at the end of the cascade, i.e. was pushed last.
	 */
	static function themeUrl ()
	{
		return isset(self::$theme) ? self::$theme : Q_Request::baseUrl();
	}
	
	/**
	 * Gets the url and filename of a themed file
	 * @method themedUrlFilenameAndHash
	 * @static
	 * @param {string} $filePath  Basically the subpath of the file underneath the web or theme
	 *  directory. You can also pass a URL here, but it's not ideal.
	 * @param {array} [$options=array()]
	 * @param {boolean} [$options.ignoreEnvironment=false] If true, doesn't apply environment transformations
	 * @param {string} [$options.hash=null] If URL was already processed with cachedUrlAndHash, set hash here to avoid calling it again
	 * @param {boolean} [$options.baseUrlPlaceholder=false] Pass true to have {{baseUrl}} placeholder instead of base URL in the string
	 * @return {array} A three-element array containing the url, filename, hash
	 */
	static function themedUrlFilenameAndHash ($filePath, $options = array())
	{
		/**
		 * @event Q/themedUrlFilenameAndHash {before}
		 * @param {string} file_path
		 * @return {array}
		 */
		$result = Q::event('Q/themedUrlFilenameAndHash', @compact('file_path'), 'before');
		if ($result) {
			return $result;
		}

		$filePath2 = Q_Uri::interpolateUrl($filePath);
		
		$baseUrl = Q_Request::baseUrl();
		if (Q::startsWith($filePath2, $baseUrl)) {
			$filePath2 = substr($filePath2, strlen($baseUrl) + 1);
		}
		
		if (empty($options['ignoreEnvironment'])
		and $environment = Q_Config::get('Q', 'environment', '')) {
			if ($info = Q_Config::get('Q', 'environments', $environment, false)) {
				if (!empty($info['files'][$filePath])) {
					$filePath2 = $info['files'][$filePath];
				} else if (!empty($info['files'][$filePath2])) {
					$filePath2 = $info['files'][$filePath2];
				}
			}
		}
		
		$filename = false;
		if (Q_Valid::url($filePath2)) {
			$url = $filePath2;
		} else {
			if (Q::startsWith($filePath2, APP_WEB_DIR)) {
				$filePath2 = substr($filePath2, strlen(APP_WEB_DIR . DS));
			}
			$theme = Q_Uri::url(self::themeUrl());
			$themes = self::$themes;
			$c = count($themes);
			if ($c > 1) {
				// At least two theme URLs have been loaded
				// Do the cascade
				for ($i = $c - 1; $i >= 0; -- $i) {
					try {
						$filename = Q_Uri::filenameFromUrl(
							$themes[$i] . '/' . $filePath2
						);
					} catch (Exception $e) {
						continue;
					}
					if ($filename and file_exists($filename)) {
						$theme = $themes[$i];
						break;
					}
				}
			}
			$url = $theme . ($filePath2 ? '/'.$filePath2 : '');
		}

		if (!empty($options['baseUrlPlaceholder'])) {
			if (Q::startsWith($url, $baseUrl)) {
				$url = '{{baseUrl}}' . substr($url, strlen($baseUrl));
			}
		}
		
		if (!empty($options['hash'])) {
			$hash = $options['hash'];
		} else {
			if (empty($filename)) {
				try {
					$filename = Q_Uri::filenameFromUrl($url);	
				} catch (Exception $e) {
					$filename = null;
				}
			}
			list($url, $hash) = Q_Uri::cachedUrlAndHash($url);
		}
		$url = Q_Uri::proxySource($url);
		return array($url, $filename, $hash);
	}
	
	/**
	 * Gets the url of a themed file
	 * @method themedUrl
	 * @static
	 * @param {string} $filePath Basically the subpath of the file underneath the web or theme directory
	 * @param {array} [$options=array()]
	 * @param {boolean} [$options.ignoreEnvironment=false] If true, doesn't apply environment transformations
	 * @param {string} [$options.hash=null] If URL was already processed with cachedUrlAndCache, set hash here to avoid calling it again
	 * @param {boolean} [$options.baseUrlPlaceholder=false] Pass true to have {{baseUrl}} placeholder instead of base URL in the string
	 * @return {string} The themed url.
	 */
	static function themedUrl($filePath, $options = array())
	{
		if ($options === true) { // for backwards compatibility
			$options = array('ignoreEnvironment' => true);
		}
		list($url, $filename) = self::themedUrlFilenameAndHash($filePath, $options);
		return $url;
	}
	
	/**
	 * Gets the filename of a themed file
	 * @method themedFilename
	 * @static
	 * @param {string} $filePath Basically the subpath of the file underneath the web or theme directory
	 * @param {array} [$options=array()]
	 * @param {boolean} [$options.ignoreEnvironment=false] If true, doesn't apply environment transformations
	 * @param {string} [$options.hash=null] If URL was already processed with cachedUrlAndCache, set hash here to avoid calling it again
	 */
	static function themedFilename($filePath, $options = array())
	{
		list($url, $filename) = self::themedUrlFilenameAndHash($filePath, $options);
		return $filename;
	}
	
	/**
	 * Truncates some text to a length, returns result
	 * @method truncate
	 * @static
	 * @param {string} $text The text to truncate
	 * @param {integer} [$length=20] Length to truncate to. Defaults to 20
	 * @param {string} [$replace='...'] String to replace truncated text. Defaults to three dots.
	 * @param {integer} [$last_word_max_length=0] The maximum length of the last word.
	 *  If a positive number, adds the last word up to this length,
	 *  truncating the text before it.
	 * @param {string} [$guarantee_result_length=true] If true, then the result will definitely
	 *  have a string length <= $length. If false, then it might
	 *  be longer, as the length of $replace is not factored in.
	 * @return {string}
	 */
	static function truncate(
		$text, 
		$length = 20, 
		$replace = '...',
		$last_word_max_length = 0,
		$guarantee_result_length = true)
	{
		$text_len = strlen($text);
		$replace_len = strlen($replace);
		if ($text_len <= $length)
			return $text;
			
		if ($last_word_max_length > $text_len)
			$last_word_max_length = 0;
		$length_to_use = $length;
		if ($text_len > $length and $guarantee_result_length)
			 $length_to_use = $length - $replace_len;
		$last_word_len = 0;
		if ($last_word_max_length > 0) {
			$last_word_starts_at = strrpos($text, ' ', -2) + 1;
			$last_word_len = ($last_word_starts_at !== false)
				? $text_len - $last_word_starts_at
				: $text_len;
			if ($last_word_len > $last_word_max_length)
				$last_word_len = $last_word_max_length;
		}
		
		$text_truncated = substr($text, 0, $length_to_use - $last_word_len);
		if ($text_len > $length)
			$text_truncated .= $replace;
		if ($last_word_len)
			$text_truncated .= substr($text, -$last_word_len);
		return $text_truncated;
	}

	/**
	 * Set to true to use native HTML for lazyloading images instead of JS.
	 * Works in most modern browsers.
	 * @property $lazyloadWithoutJavascript
	 * @type boolean
	 * @static
	 * @public
	 */
	public static $lazyloadWithoutJavascript = false;

	/**
	 * Set to true temporarily in order to avoid features
	 * such as lazyloading
	 * @property $environmentWithoutJavascript
	 * @type boolean
	 * @static
	 * @public
	 */
	public static $environmentWithoutJavascript = false;
		
	/**
	 * The theme url to be used in various methods of this class.
	 * @property $theme
	 * @type string
	 * @static
	 * @protected
	 */
	protected static $theme = null;
	
	/**
	 * The cascade of theme urls
	 * @property $themes
	 * @type array
	 * @static
	 * @protected
	 */
	protected static $themes = array(null);
	
	/**
	 * The id prefix to be prepended to all ids passed in
	 * @property $id_prefix
	 * @type string
	 * @static
	 * @protected
	 */
	protected static $id_prefix = null;
	
	/**
	 * The stack of id prefixes
	 * @property $id_prefixes
	 * @type array
	 * @static
	 * @protected
	 */
	protected static $id_prefixes = array(null);
	
	/**
	 * The stack of tool id arrays
	 * @property $id_prefixes
	 * @type array
	 * @static
	 * @protected
	 */
	protected static $tool_ids = array(null);
	
	static $preloadAs = array(
		'ttf' => 'font',
		'ottf' => 'font',
		'woff' => 'font',
		'woff2' => 'font',
		'eot' => 'font',
		'mp3' => 'audio',
		'ogg' => 'audio',
		'png' => 'image',
		'gif' => 'image',
		'jpg' => 'image',
		'jpeg' => 'image',
		'tiff' => 'image',
		'webm' => 'image',
		'mp4' => 'video',
		'wmv' => 'video',
		'mov' => 'video',
		'avi' => 'video',
		'flv' => 'video'
	);

}

<?php

/**
 * @module Q
 */
/**
 * This class deals with returning a response
 * @class Q_Response
 */
class Q_Response
{
	/**
	 * Sets the content of a slot
	 * @method setSlot
	 * @static
	 * @param {string} $slotName The name of the slot.
	 * @param {string} $content The content to set
	 * @return {string} returns the content again
	 */
	static function setSlot(
	 $slotName,
	 $content)
	{
		self::$slots[$slotName] = $content;
		if (!self::$_fillingSlot) {
			self::$_slotsWereSet[$slotName] = true;
		}
		return $content;
	}
	
	/**
	 * Gets the content of a slot, or null if it wasn't filled
	 * @method getSlot
	 * @static
	 * @param {string} $slotName The name of the slot.
	 * @return {string|null}
	 */
	static function getSlot(
	 $slotName)
	{
		return isset(self::$slots[$slotName]) ? self::$slots[$slotName] : null;
	}

	/**
	 * Gets the current content of a slot, if any.
	 * If slot content is null, then raises an event
	 * to try to fill the slot. If it is filled,
	 * returns the content. Otherwise, returns null.
	 * @method fillSlot
	 * @static
	 * @param {string|array} $slotName The name of the slot.
	 * @param {boolean} [$default_slotName=null] If the slot named in $slotName returns null,
	 *  the handler corresponding to the default slot will be called,
	 *  passing it the requested slot's name in the 'slotName' parameter,
	 *  and its value will be returned instead.
	 *  Note: this does not fill the slot named $default_slotName!
	 *  That is to say, the computed value is not saved, so that
	 *  the slot's handler is called again if it is ever consulted again.
	 * @param {string} [$prefix=null] Sets a prefix for the HTML ids of all the elements in the slot.
	 * @return {string|null}
	 */
	static function fillSlot(
	 $slotName,
	 $default_slotName = null,
	 $prefix = null)
	{
		if (isset(self::$slots[$slotName])) {
			return self::$slots[$slotName];
		}
		$prev_slotName = self::$slotName;
		self::$slotName = $slotName;
		if (isset($prefix)) {
			Q_Html::pushIdPrefix($prefix);
		}
		try {
			if (isset($default_slotName)) {
				if (!Q::canHandle("Q/response/$slotName")) {
					/**
					 * @event Q/response/$default_slotName
					 * @param {string} slotName
					 * @return {string}
					 */
					$result = Q::event(
						"Q/response/$default_slotName",
						@compact('slotName')
					);
					if (isset(self::$slots[$slotName])) {
						// The slot was already filled, while we were rendering it
						// so discard the $result and return the slot's contents
						return self::$slots[$slotName];
					}
					return self::$slots[$slotName] = $result;
				}
			}
			/**
			 * @event Q/response/$slotName
			 * @return {string}
			 */
			$result = Q::event("Q/response/$slotName");
		} catch (Exception $e) {
			self::$slotName = $prev_slotName;
			if (isset($prefix)) {
				Q_Html::popIdPrefix();
			}
			throw $e;
		}
		self::$slotName = $prev_slotName;
		if (isset($prefix)) {
			Q_Html::popIdPrefix();
		}
		if (isset(self::$slots[$slotName])) {
			// The slot was already filled, while we were rendering it
			// so discard the $result and return the slot's contents
			return self::$slots[$slotName];
		}
		if (isset($result)) {
			self::$_fillingSlot = true;
			self::setSlot($slotName, $result);
			self::$_fillingSlot = false;
			return $result;
		}

		// Otherwise, render default slot
		if (!isset($default_slotName)) {
			return null;
		}
		/**
		 * @event Q/response/$default_slotName
		 * @param {string} slotName
		 * @return {string}
		 */
		return Q::event(
			"Q/response/$default_slotName",
			@compact('slotName')
		);
	}


	/**
	 * Clears a slot, so the next call to Q_Response::fillSlot would fill it again
	 * @method clearSlot
	 * @static
	 * @param {string} $slotName The name of the slot.
	 */
	static function clearSlot(
		$slotName)
	{
		self::$slots[$slotName] = null;
	}

	/**
	 * Gets all the slots that have been set
	 * @method getAllSlots
	 * @static
	 * @return {array}
	 */
	static function getAllSlots()
	{
		return self::$slots;
	}

	/**
	 * Gets all the requested slots using Q_Request::slotNames()
	 * @method getRequestedSlots
	 * @static
	 * @return {array}
	 */
	static function getRequestedSlots()
	{
		$return = array();
		$slotNames = Q_Request::slotNames(true);
		foreach ($slotNames as $sn) {
			$sn_parts = explode('.', $sn);
			$slotName = end($sn_parts);
			$return[$slotName] = self::fillSlot($slotName);
		}
		return $return;
	}

	/**
	 * Used to fill multiple slots from Q/response and other events
	 * @method fillSlots
	 * @static
	 * @param {array} $slotNames array of slot name to fill
	 * @param {array} [$idPrefixes] array of ($slotName => $idPrefix) pairs
	 */
	static function fillSlots($slotNames, $idPrefixes = array())
	{
		self::$_slotsWereSet = array();
		foreach ($slotNames as $sn) {
			Q_Response::fillSlot($sn, 'default', Q::ifset($idPrefixes, $sn, null));
		}
		if (!empty(self::$_slotsWereSet)) {
			// Go through the slots again, because other handlers may have overwritten
			// their contents using Q_Response::setSlot()
			foreach ($slotNames as $sn) {
				Q_Response::fillSlot($sn, 'default', Q::ifset($idPrefixes, $sn, null));
			}
		}
	}

	/**
	 * Adds an error to the response
	 * @method addError
	 * @static
	 * @param {Q_Exception|array} $exception Either a Q_Exception or an array of them
	 */
	static function addError(
	 $exception)
	{
		if (is_array($exception)) {
			self::$errors = array_merge(self::$errors, $exception);
		} else {
			self::$errors[] = $exception;
		}
	}

	/**
	 * Returns all the errors added so far to the response.
	 * @method getErrors
	 * @static
	 * @return {array}
	 */
	static function getErrors()
	{
		return self::$errors;
	}

	/**
	 * Adds a notice
	 * @method setNotice
	 * @static
	 * @param {string} $key The key for the notices
	 * @param {string} $notice The HTML content of the notice
	 * @param {array} [$options=array] Different options
	 * @param {boolean} [$options.persistent=false] If false, save notice in the session to show again if page reloaded.
	 * @param {boolean} [$options.closeable=true] If true, add cross icon to close notice.
	 * @param {boolean} [$options.handler=null] URL to redirect to, or name of function to call, when notice is clicked.
	 * @param {Boolean|Number} [$options.timeout=false] Time in seconds after which to remove notice.
	 * @param {Boolean|Number} [$options.persistent=false] Whether to save this notice to session to show after page refresh.
	 */
	static function setNotice($key, $notice, $options = array())
	{
		if (empty($notice)) {
			return;
		}

		if (!is_array($options)) {
			$options = array();
		}

		if (!isset($options['closeable'])) {
			$options['closeable'] = true;
		}
		$notice = @compact('notice', 'options');
		self::$notices[$key] = $notice;
		if (!empty($options['persistent']) and Q_Session::id()) {
			$_SESSION['Q']['notices'][$key] = Q::t($notice);
		}
		unset(self::$removedNotices[$key]);
	}

	/**
	 * Removes a notice
	 * @method removeNotice
	 * @static
	 * @param {string} $key
	 * @return {boolean} true if notice has been deleted, false otherwise
	 */
	static function removeNotice($key)
	{
		if (!isset(self::$notices[$key])) {
			return false;
		}
		unset(self::$notices[$key]);
		if (Q_Session::id()) {
			$_SESSION['Q']['notices'][$key] = null;
		}
		self::$removedNotices[$key] = true;
		return true;
	}

	/**
	 * Get or set the layout view that should be used in the response
	 * @method layoutView
	 * @static
	 * @param {string} $newView optionally set the new view, or unset it by passing false
	 * @return {string}
	 */
	static function layoutView($newView = null)
	{
		if (isset($newView)) {
			return Q_Response::$layoutView = $newView;
		}
		if (Q_Response::$layoutView) {
			return Q_Response::$layoutView;
		}
		$app = Q::app();
		$layout_view = Q_Config::get('Q', 'response', 'layout', 'html', "$app/layout/html.php");
		$desktop_layout_view = Q_Config::get('Q', 'response', 'layout', 'desktop', false);
		if ($desktop_layout_view) {
			$layout_view = $desktop_layout_view;
		}
		if (Q_Request::isTablet()) {
			$tablet_layout_view = Q_Config::get('Q', 'response', 'layout', 'tablet', false);
			if ($tablet_layout_view) {
				$layout_view = $tablet_layout_view;
			}
		} else if (Q_Request::isMobile()) {
			$mobile_layout_view = Q_Config::get('Q', 'response', 'layout', 'mobile', false);
			if ($mobile_layout_view) {
				$layout_view = $mobile_layout_view;
			}
		}
		return $layout_view;
	}

	/**
	 * Returns all the notices added so far to the response.
	 * @method getNotices
	 * @static
	 * @return {array}
	 */
	static function getNotices()
	{
		return self::$notices;
	}

	/**
	 * Returns all the notices removed so far during this request
	 * @method getRemovedNotices
	 * @static
	 * @return {array}
	 */
	static function getRemovedNotices()
	{
		return self::$removedNotices;
	}

	/**
	 * Sets one of the attributes of a style to a value.
	 * @method setStyle
	 * @static
	 * @param {string|array} $keys Can be a key or array of keys in the style of Q_Tree->set
	 * @param {mixed} [$value=null]
	 * @param {string} [$slotName=null]
	 */
	static function setStyle($keys, $value = null, $slotName = null)
	{
		if (Q::isAssociative($keys)) {
			foreach ($keys as $k => $v) {
				self::setStyle($k, $v, $value);
			}
			return;
		}
		$args = is_array($keys) ? $keys : array($keys);
		$args[] = $value;
		$p = new Q_Tree(self::$styles);
		call_user_func_array(array($p, 'set'), $args);

		// Now, for the slot
		if (!isset($slotName)) {
			$slotName = isset(self::$slotName) ? self::$slotName : '';
		}
		if (!isset(self::$stylesForSlot[$slotName])) {
			self::$stylesForSlot[$slotName] = array();
		}
		$p = new Q_Tree(self::$stylesForSlot[$slotName]);
		call_user_func_array(array($p, 'set'), $args);
	}

	/**
	 * Return the array of styles added so far
	 * @method stylesArray
	 * @static
	 * @param {string} [$slotName=null] If provided, returns only the styles set while filling this slot.
	 *  If you leave this empty, you get styles information for the "right" slots.
	 *  If you pass false here, you will just get the entire $styles array without any processing.
	 * @param {string} [$urls=true] If true, transforms all the 'src' values into URLs before returning.
	 * @return {array} if $slotName is an array or empty, returns array of $slotName => $styles, otherwise returns $styles
	 */
	static function stylesArray ($slotName = null, $urls = true)
	{
		if ($slotName === false) {
			return is_array(self::$styles) ? self::$styles : array();
		}
		if (!isset($slotName) or $slotName === true) {
			$slotName = self::allSlotNames();
		}
		if (is_array($slotName)) {
			$styles = array();
			foreach ($slotName as $sn) {
				$styles[$sn] = self::stylesArray($sn, $urls);
			}
			return $styles;
		}
		if (!isset(self::$stylesForSlot[$slotName])) {
			return array();
		}
		$styles = self::$stylesForSlot[$slotName];
		return is_array($styles) ? $styles : array();
	}
	
	/**
	 * Returns text describing all the styles inline which have been added with setStyle()
	 * @method styles
	 * @static
	 * @param {string} [$slotName=null] If provided, returns only the styles set while filling this slot.
	 * @param {string} [$between=''] Optional text to insert between the &lt;style&gt; tags or blocks of text.
	 * @param {boolean} [$tags=true] Whether to return the text already wrapped in <style> tags. Defaults to true.
	 * @return {string}
	 */
	static function styles($slotName = null, $between = '', $tags = true)
	{
		$styles = self::stylesArray($slotName);
		if (!is_array($styles)) {
			return '';
		}

		$texts = array();
		if (is_string($slotName)) {
			$styles = array($slotName => $styles);
		}
		foreach ($styles as $sn => $s) {
			$result = '';
			if (is_string($s)) {
				$result = $s;
			} else {
				foreach ($s as $selector => $style) {
					$result .= "\n\t\t$selector {\n\t\t\t";
					if (is_string($style)) {
						$result .= $style;
					} else if (is_array($style)) {
						foreach ($style as $property => $value) {
							$result .= "$property: $value;   ";
						}
					}
					$result .= "\n\t\t}\n\t";
				}
			}
			if ($result) {
				$texts[$sn] = $result;
			}
		}
		if (!$tags) {
			return implode("\n", $texts);
		}
		$tags = array();

		foreach ($texts as $sn => $text) {
			$tags[] = Q_Html::tag('style', array('type' => 'text/css', 'data-slot' => $sn), $texts[$sn]);
		}
		return implode($between, $tags);
	}

	/**
	 * Returns text describing all the styles inline which have been added with setStyle(),
	 * to be included between &lt;style&gt;&lt;/style&gt; tags.
	 * @method stylesInline
	 * @static
	 * @param {string} [$slotName=null] If provided, returns only the styles set while filling this slot.
	* @param {string} [$between=''] Optional text to insert between the blocks of style text
	 * @return {string}
	 */
	static function stylesInline($slotName = null, $between = "\n")
	{
		return self::styles($slotName, $between, false);
	}
	
	/**
	 * Sets a particular meta tag
	 * @method setMeta
	 * @static
	 * @param {array} $params
	 * @param {string} [$params.attrName=name] Attribute name of the meta tag
	 * @param {string} $params.attrValue Attribute value of the meta tag
	 * @param {mixed} [$params.content=null] The content of the meta tag
	 * @param {string} [$slotName=null]
	 */
	static function setMeta($params, $slotName = null)
	{
		$argList = func_get_args();
		if (count($argList) > 1) { // backward compatibility
			$params = array(
				'attrName' => 'name',
				'attrValue' => Q::ifset($argList, 0, ''),
				'content' => Q::ifset($argList, 1, '')
			);
		} elseif (isset($params[0]) and is_array($params[0])) {
			foreach ($params as $v) {
				if (is_array($v)) {
					self::setMeta($v);
				}
			}
			return;
		}

		$params = array_merge(array(
			'attrName' => 'name',
			'content' => ''
		), $params);

		// remove from content new lines and html tags
		$params['content'] = preg_replace("/\r|\n/", "", strip_tags($params['content']));

		if ($params['attrValue'] == 'og:image') {
			$filename = Q_Uri::filenameFromUrl($params['content']);
			$size = $filename ? getimagesize($filename) : null;

			// if remote image try to get size
			if (!is_array($size) && Q_Valid::url($params['content'])) {
				$size = getimagesize($params['content']);
			}

			if (is_array($size) && !empty($size[0]) && !empty($size[1])) {
				self::setMeta(array(
					array('attrName' => 'property', 'attrValue' => 'og:image:width', 'content' => $size[0]),
					array('attrName' => 'property', 'attrValue' => 'og:image:height', 'content' => $size[1]),
					array('attrName' => 'property', 'attrValue' => 'og:image:secure_url', 'content' => $params['content']),
					array('attrName' => 'property', 'attrValue' => 'og:image:type', 'content' => $size['mime'])
				));
			}
		}

		$key = $params['attrName'].':'.$params['attrValue'];
		self::$metas[$key] = $params;

		// Now, for the slot
		if (!isset($slotName)) {
			$slotName = isset(self::$slotName) ? self::$slotName : '';
		}
		self::$metasForSlot[$slotName][$key] = $params;
	}

	/**
	 * Return the array of metas added so far
	 * @method metasArray
	 * @static
	 * @param {string} [$slotName=null] If provided, returns only the metas set while filling this slot.
	 *  If you leave this empty, you get metas information for the "right" slots.
	 *  If you pass false here, you will just get the entire $metas array without any processing.
	 * @param {string} [$urls=true] If true, transforms all the 'src' values into URLs before returning.
	 * @return {array} if $slotName is an array or true, returns array of $slotName => $metas, otherwise returns $metas
	 */
	static function metasArray ($slotName = null, $urls = true)
	{
		if ($slotName === false) {
			return is_array(self::$metas) ? self::$metas : array();
		}
		if (!isset($slotName) or $slotName === true) {
			$slotName = self::allSlotNames();
		}
		if (is_array($slotName)) {
			$metas = array();
			foreach ($slotName as $sn) {
				$metas[$sn] = self::metasArray($sn, $urls);
			}
			return $metas;
		}
		if (!isset(self::$metasForSlot[$slotName])) {
			return array();
		}
		$metas = self::$metasForSlot[$slotName];
		return is_array($metas) ? $metas : array();
	}
	
	/**
	 * Returns text describing all the metas inline which have been added with setMeta()
	 * @method metas
	 * @static
	 * @param {string} [$slotName=null] If provided, returns only the metas set while filling this slot.
	 * @param {string} [$between=''] Optional text to insert between the &lt;meta&gt; tags or blocks of text.
	 * @return {string}
	 */
	static function metas($slotName = null, $between = "\n")
	{
		$metas = self::metasArray($slotName);
		if (!is_array($metas)) {
			return '';
		}

		$tags = array();
		foreach ($metas as $sn => $m) {
			foreach ($m as $meta) {
				$tags[] = Q_Html::tag('meta', array(
					$meta['attrName'] => $meta['attrValue'],
					'content' => $meta['content'],
					'data-slot' => $sn
				));
			}
		}
		return implode($between, $tags);
	}

	/**
	 * Adds a line of script to be echoed in a layout
	 * @method addScriptLine
	 * @static
	 * @param {string} $line The line of script
	 * @param {array} [$replace=array()] Keys in this array are globally replaced in the $line
	 *  with the json_encoded values, before the line is added.
	 * @param {array} [$slotName=null] A way to override the slot name. Pass "" here to
	 *  have the script lines be returned first by Q_Response::scriptLines.
	 *  The other special value, "Q", is intended for internal use.
	 */
	static function addScriptLine($line, $replace = array(), $slotName = null)
	{
		if (is_string($replace)) {
			$slotName = $replace;
			$replace = array();
		} else if (empty($replace)) {
			$replace = array();
		}
		if (!isset($slotName)) {
			$slotName = isset(self::$slotName) ? self::$slotName : '';
		}
		if (!isset(self::$scriptLinesForSlot[$slotName])) {
			self::$scriptLinesForSlot[$slotName] = array();
		}
		foreach ($replace as $k => $v) {
			$line = str_replace($k, Q::json_encode($v), $line);
		}
		self::$scriptLinesForSlot[$slotName][] = $line;
		self::$scriptLines[] = $line;
	}

	/**
	 * Sets some data for the script
	 * @method setScriptData
	 * @param {string|array} $path The path to the variable where the data will be saved, such as "Q.info" or "MyApp.foo.bar".
	 * @param {array} $data The data to set. It will be JSON-encoded and stored in the specified variable.
	 * @param {array} [$slotName=null] A way to override the slot name. Pass "" here to
	 *  have the script lines be returned first by Q_Response::scriptLines.
	 *  The other special value, "Q", is intended for internal use.
	 */
	static function setScriptData($path, $data, $slotName = null)
	{
		if (!isset($slotName)) {
			$slotName = isset(self::$slotName) ? self::$slotName : '';
		}
		self::$scriptDataForSlot[$slotName][$path] = $data;
		if (self::$captureScriptDataForSession) {
			self::$sessionData[$path] = $data;
			self::$sessionDataPaths[] = $path;
		}
	}

	/**
	 * Return the array of script lines added so far
	 * @method scriptLinesArray
	 * @static
	 * @param {string} [$slotName=null] Pass a slot name here to return only the script lines added while filling this slot.
	 *  You can also pass an array of slot names here.
	 *  Pass false here to return the script lines in the order they were added.
	 * @param {boolean} [$without_script_data=false] By default, a few script lines are prepended
	 *  to insert the script data, for backward compatibility with apps that were built before
	 *  scriptData was introduced. Pass true here if you don't want to include them in the result.
	 * @return {array} if $slotName is an array or true, returns array of $slotName => $lines, otherwise returns $lines
	 */
	static function scriptLinesArray ($slotName = null, $without_script_data = false)
	{
		if ($slotName === false) {
			return is_array(self::$scriptLines) ? self::$scriptLines : array();
		}
		if (!isset($slotName) or $slotName === true) {
			$slotName = self::allSlotNames();
		}
		if (is_array($slotName)) {
			$scriptLines = array();
			foreach ($slotName as $sn) {
				$scriptLines[$sn] = self::scriptLinesArray($sn, $without_script_data);
			}
			$json = Q::json_encode(self::$sessionDataPaths);
			$scriptLines[] = "Q.Session.paths = $json;";
			return $scriptLines;
		}
		$scriptLines = isset(self::$scriptLinesForSlot[$slotName])
			? self::$scriptLinesForSlot[$slotName]
			: array();
		$scriptDataLines = array();
		if (!$without_script_data) {
			$tested = array();
			if ($data = self::scriptData($slotName)) {
				$extend = array();
				foreach ($data as $k => $v) {
					$parts = explode(".", $k);
					$e = &$extend;
					foreach ($parts as $p) {
						$e = &$e[$p]; // inserts null under key if nothing was there
					}
					$e = $v;
				}
				$options = Q_Config::get('Q', 'javascript', 'prettyPrintData', true)
					? JSON_PRETTY_PRINT
					: 0;
				if (!empty($extend['Q'])) {
					$json = Q::json_encode($extend['Q'], $options);
					$scriptDataLines[] = "Q.extend(Q, 100, $json);";
					unset($extend['Q']);
				}
				if (!empty($extend)) {
					$json = Q::json_encode($extend, $options);
					$scriptDataLines[] = "Q.extend(window, 100, $json);";
				}
			}
		}
		$scriptLines = array_merge($scriptDataLines, $scriptLines);
		return is_array($scriptLines) ? $scriptLines : array();
	}

	/**
	 * Returns text describing all the scripts lines that have been added,
	 * to be included between &lt;script&gt;&lt;/script&gt; tags.
	 * @method scriptLines
	 * @static
	 * @param {string} [$slotName=null] By default, returns all the lines in their intended order.
	 *  Pass a slot name here to return only the script lines added while filling this slot.
	 *  Pass false here to return the script lines in the order they were added.
	 * @param {boolean} [$without_script_data=false] By default, a few script lines are prepended
	 *  to insert the script data, for backward compatibility with apps that were built before
	 *  scriptData was introduced. Pass true here if you don't want to include them in the result.
	 * @param {string} [$between=''] Optional text to insert between the &lt;style&gt; tags or blocks of text.
	 * @param {boolean} [$tags=true] Whether to return the text already wrapped in <style> tags. Defaults to true.
	 * @return {string}
	 */
	static function scriptLines($slotName = null, $without_script_data = false, $between = "\n", $tags = true)
	{
		if ($slotName === true) {
			$slotName = null; // for backward compatibility
		}

		$lines = self::scriptLinesArray($slotName, $without_script_data);
		if (!$lines or !is_array($lines)) {
			return '';
		}
		if (!$tags) {
			$parts = array();
			foreach ($lines as $sn => $ls) {
				$parts[] = is_array($ls) ? implode($between, $ls) : $ls;
			}
			return "\n".implode($between, $parts)."\n";
		}
		$tags = array();
		foreach ($lines as $sn => $ls) {
			if (!$ls) continue;
			$tags[] = Q_Html::script(
				is_array($ls) ? implode($between, $ls) : $ls, 
				array('data-slot' => $sn)
			);
		}
		return implode($between, $tags);
	}

	/**
	 * Returns json describing all the script data that has been added to various slots
	 * @method scriptData
	 * @static
	 * @param {string} [$slotName=null] By default, returns all the lines in their intended order.
	 *  Pass a slot name here to return only the script lines added while filling this slot.
	 *  Pass false here to return the script lines in the order they were added.
	 * @return {string}
	 */
	static function scriptData($slotName = null)
	{
		if (is_string($slotName)) {
			return isset(self::$scriptDataForSlot[$slotName])
				? self::$scriptDataForSlot[$slotName]
				: null;
		}
		return self::$scriptDataForSlot;
	}

	/**
	 * Set the options for a tool to be rendered, on top of those possibly already added.
	 * @method setToolOptions
	 * @static
	 * @param {string|array} $name The name of the option. Can also pass an array
	 *  of ($name => $value) pairs here here -- in this case leave $value blank.
	 * @param {mixed} [$value=null] The value of the option
	 */
	static function setToolOptions($name, $value = null)
	{
		$tool_name = Q::$toolName;
		$idPrefix = Q_Html::getIdPrefix($tool_name);
		$to_set = is_array($name) ? $name : array($name => $value);
		foreach ($to_set as $k => $v) {
			if (substr($k, 0, 2) == 'Q_') {
				continue;
			}
			self::$toolOptions[$idPrefix][$tool_name][$k] = $v;
		}
	}

	/**
	 * Get all the options set for a tool so far
	 * @method getToolOptions
	 * @static
	 * @param {string} toolName Optional name of the tool that is being rendered
	 * @return {array} The options for the tool currently being rendered
	 */
	static function getToolOptions($tool_name = null)
	{
		if (!isset($tool_name)) {
			$tool_name = Q::$toolName;
		}
		$idPrefix = Q_Html::getIdPrefix($tool_name);
		return isset(self::$toolOptions[$idPrefix][$tool_name])
			? self::$toolOptions[$idPrefix][$tool_name]
			: null;
	}
	
	/**
	 * Indicate whether to retain a tool
	 * @method toolRetain
	 * @static
	 * @param {boolean} [$toRetain=true] Defaults to true. Whether to cache the tool being rendered.
	 */
	static function toolRetain($toRetain = true)
	{
		$idPrefix = Q_Html::getIdPrefix();
		self::$toolRetain[$idPrefix] = $toRetain;
	}
	
	/**
	 * Indicate whether to replace a tool
	 * @method toolReplace
	 * @static
	 * @param {boolean} [$toReplaceWith=true] Defaults to true. Whether to replace the tool being rendered.
	 */
	static function toolReplace($toRetain = true)
	{
		$idPrefix = Q_Html::getIdPrefix();
		self::$toolReplace[$idPrefix] = $toRetain;
	}
	
	/**
	 * @method shouldRetainTool
	 * @static
 	 * @param {string} The id prefix of the tool
	 * @return {boolean} Whether to cache the tool with this idPrefix
	 */
	static function shouldRetainTool($idPrefix)
	{
		return !empty(self::$toolRetain[$idPrefix]);
	}
	
	/**
	 * @method shouldReplaceWithTool
	 * @static
 	 * @param {string} The id prefix of the tool
	 * @return {boolean} Whether to cache the tool with this idPrefix
	 */
	static function shouldReplaceWithTool($idPrefix)
	{
		return !empty(self::$toolReplace[$idPrefix]);
	}
	
	/**
	 * @method retainSlot
	 * @static
	 * @param {boolean} [$toRetain=true] Defaults to true. Whether to cache the slot being rendered.
	 */
	static function retainSlot($toRetain = true)
	{
		if (!isset(self::$slotName)) {
			throw new Q_Exception("Q_Response::retainSlot can only be called while rendering a slot");
		}
		self::setScriptData(
			'Q.loadUrl.options.retainSlots.'.self::$slotName,
			$toRetain,
			''
		);
		$slotName = self::$slotName;
		self::addScriptLine(
			"Q.loadUrl.retainedSlots.$slotName = document.getElementById('{$slotName}_slot');"
		);
		self::$retainSlot[self::$slotName] = $toRetain;
	}
	
	/**
	 * The slot currently being rendered
	 * @return {string}
	 */
	static function slotName()
	{
		return self::$slotName;
	}

	/**
	 * The names of all the slot names for scripts, stylesheets, etc. to load in order.
	 * You can use any of these names in your addScript(), addStylesheet(),
	 * setStyle(), setScriptData(), addTemplate(), etc.
	 * They are "@start", "", "Q", then the plugin names, the app name, then the slot names and finally '@end'
	 * @return {array}
	 */
	static function allSlotNames()
	{
		$modules = array_keys(Q_Bootstrap::plugins());
		$modules[] = Q::app();
		return array_merge(
			array('@start'),
			$modules,
			Q_Request::slotNames(true),
			array('', '@end')
		);
	}

	/**
	 * Adds a script reference to the response
	 * @method addScript
	 * @static
	 * @param {string} $src
	 * @param {string} [$slotName=null]
	 * @param {string} [$type='application/javascript']
	 * @return {boolean} returns false if script was already added, else returns true
	 */
	static function addScript ($src, $slotName = null, $type = 'application/javascript')
	{
		/**
		 * @event Q/response/addScript {before}
		 * @param {string} src
		 * @param {string} type
		 * @return {array}
		 */
		$modify = Q::event('Q/response/addScript', @compact('src', 'type'), 'before');
		if ($modify) {
			extract($modify);
		}

		foreach (self::$scripts as $script) {
			if ($script['src'] == $src && $script['type'] == $type) {
				return false; // already added
			}
		}
		self::$scripts[] = @compact('src', 'type');
		// Now, for the slot
		if (!isset($slotName)) {
			// By default, scripts won't be added "to a slot"
			// because it is more likely they should be executed only one time in the document.
			$slotName = ''; // isset(self::$slotName) ? self::$slotName : '';
		}
		if (!isset(self::$scriptsForSlot[$slotName])) {
			self::$scriptsForSlot[$slotName] = array();
		}
		foreach (self::$scriptsForSlot[$slotName] as $script) {
			if ($script['src'] == $src && $script['type'] == $type)
				return false; // already added
		}
		self::$scriptsForSlot[$slotName][] = @compact('src', 'type');

		return true;
	}

	/**
	 * Adds inline template to the response
	 * @method addTemplate
	 * @static
	 * @param {string} $name The location of the template file relative to the "views" folder
	 * @param {array} [$slotName=null] A way to override the slot name. Pass "" here to
	 *  have the script lines be returned first by Q_Response::scriptLines.
	 *  The other special value, "Q", is intended for internal use.
	 * @param {string} [$type="handlebars"] The type of the template, such as "php" or "handlebars".
	 * @param {array} [$params=array()] Optional array of parameters to pass to PHP
	 * @return {boolean} returns false if template was already added, else returns true
	 */
	static function addTemplate (
		$name, 
		$slotName = null,
		$type = 'handlebars', 
		$params = array())
	{
		self::$templates[] = @compact('name', 'type');
		// Now, for the slot
		if (!isset($slotName)) {
			$slotName = isset(self::$slotName) ? self::$slotName : '';
		}
		if (!isset(self::$inlineTemplates[$slotName])) {
			self::$inlineTemplates[$slotName] = array();
		}
		foreach (self::$inlineTemplates[$slotName] as $template) {
			if ($template['name'] == $name && $template['type'] == $type) {
				return false; // already added
			}
		}
		$filename = "views/$name.$type";
		$realpath = Q::realPath($filename);

		if (!$realpath) {
			throw new Q_Exception_MissingFile(@compact('filename'));
		}
		if ($type === 'php') {
			$ob = new Q_OutputBuffer();
			Q::includeFile($realpath, $params, false);
			$content = $ob->getClean();
		} else {
			$config = Q_Config::get('Q', 'templates', array());
	        $content = Q::readFile($realpath, Q::take($config, array(
				'ignoreCache' => true,
				'dontCache' => true,
				'duration' => 3600
			)));
		}
		if (!$content) {
			throw new Q_Exception("Failed to load template '$name'");
		}
		if ($fields = Q_Config::get('Q', 'views', 'fields', null)) {
			$params = array_merge($fields, $params);
		}
		$parts = explode('/', "$name.$type");
		$text = array_merge($params, Q_Text::sources($parts));
		self::$inlineTemplates[$slotName][] = @compact(
			'name', 'content', 'type', 'text'
		);

		return true;
	}

	/**
	 * Return the array of templates added so far
	 * @method templatesArray
	 * @static
	 * @param {string} [$slotName=null] If provided, returns only the templates added while filling this slot.
	 *  If you leave this empty, you get templates information for the "right" slots.
	 *  If you pass false here, you will just get the entire $inlineTemplates array
	 * @return {array} the array of templates added so far
	 */
	static function templatesArray ($slotName = null)
	{
		if ($slotName === false) {
			$slotName = array_keys(self::$inlineTemplates);
		}
		if (!isset($slotName) or $slotName === true) {
			$slotName = array_merge(array(''), Q_Request::slotNames(true));
		}
		if (is_array($slotName)) {
			$templates = array();
			foreach ($slotName as $sn) {
				foreach (self::templatesArray($sn) as $b)  {
					foreach ($templates as $a) {
						if ($a['name'] === $b['name']
						&& $a['type'] === $b['type']) {
							break 2;
						}
					}
					$b['slot'] = $sn;
					$templates[] = $b; // a unique new template to add to the list
				}
			}
		} else {
			if (!isset(self::$inlineTemplates[$slotName])) {
				return array();
			}
			$templates = self::$inlineTemplates[$slotName];
		}

		if (!is_array($templates))
			return array();

		return $templates;
	}

	/**
	 * Returns json describing all the templates that has been added to various slots
	 * @method scriptData
	 * @static
	 * @param {string} [$slotName=null] By default, returns all the lines in their intended order.
	 *  Pass a slot name here to return only the templates added while filling this slot.
	 *  Pass false here to return the templates in the order they were added.
	 * @return {string}
	 */
	static function templateData($slotName = null) {
		return self::templatesArray($slotName);
	}

	/**
	 * Returns the HTML markup for referencing all the templates added so far
	 * @method templates
	 * @static
	 * @param {string} [$slotName=null] If provided, returns only the templates added while filling this slot.
	 * @param {string} [$between=''] Optional text to insert between the &lt;link&gt; tags.
	 * @return {string} the HTML markup for referencing all the templates added so far
	 */
	static function templates ($slotName = null, $between = "\n")
	{
		$templates = self::templatesArray($slotName);
		if (empty($templates)) return '';

		$tags = array();
		foreach ($templates as $template) {
			$attributes = array(
				'data-type' => $template['type'], 
				'id' => Q_Utils::normalize($template['name']),
				'data-slot' => $template['slot']
			);
			foreach (array('text', 'partials', 'helpers') as $aspect) {
				if (!empty($template[$aspect])) {
					$attributes["data-$aspect"] = Q::json_encode($template[$aspect]);
				}
			}
			$tags[] = Q_Html::tag('template', $attributes, $template['content']);
		}
		return implode($between, $tags);
	}

	/**
	 * Return the array of scripts added so far
	 * @method scriptsArray
	 * @static
	 * @param {string} [$slotName=null] If provided, returns only the scripts added while filling this slot.
	 *  You can also pass an array of slot names here.
	 *  If you pass the boolean constant true here, slotName is set to Q_Request::slotNames(true)
	 * @param {string} [$urls=true] If true, transforms all the 'src' values into URLs before returning.
	 * @return {array} the array of scripts added so far
	 */
	static function scriptsArray ($slotName = null, $urls = true)
	{
		if (isset($slotName)) {
			if ($slotName === true) {
				$slotName = self::allSlotNames();
			}
			if (is_array($slotName)) {
				$scripts = array();
				$srcs = array();
				foreach ($slotName as $sn) {
					foreach (self::scriptsArray($sn, $urls) as $b)  {
						$key = $b['src'];
						if (!empty($srcs[$key])) {
							continue;
						}
						$b['slot'] = $sn;
						$scripts[] = $b; // a unique new script to add to the list
						$srcs[$key] = true;
					}
				}
				return $scripts;
			} else {
				if (!isset(self::$scriptsForSlot[$slotName])) {
					return array();
				}
				$scripts = self::$scriptsForSlot[$slotName];
			}
		} else {
			$scripts = self::$scripts;
		}
		if (!is_array($scripts))
			return array();
		$srcs = array();
		$result = array();
		foreach ($scripts as $k => $b) {
			if ($urls) {
				list($src, $filename, $hash) = Q_Html::themedUrlFilenameAndHash($b['src']);
				$b['src'] = $src;
				$b['hash'] = $hash;
			}
			if (!empty($srcs[ $b['src'] ])) {
				continue;
			}
			$result[] = $b; // a unique new script to add to the list
			$srcs[ $b['src'] ] = true;
		}
		return $result;
	}

	/**
	 * Returns markup for referencing all the scripts added so far
	 * @method scriptsInline
	 * @static
	 * @param {string} [$slotName=null] If provided, returns only the scripts added while filling this slot.
	 * @return {string} the script tags and their contents inline
	 */
	static function scriptsInline ($slotName = null)
	{
		$scripts = self::scriptsArray($slotName, false);
		if (empty($scripts))
			return '';

		$scripts_for_slots = array();
		foreach ($scripts as $script) {
			$src = '';
			extract($script, EXTR_IF_EXISTS);

			$ob = new Q_OutputBuffer();
			if (Q_Valid::url($src)) {
				try {
					include($src);
				} catch (Exception $e) {}
			} else {
				list ($src, $filename) = Q_Html::themedUrlFilenameAndHash($src);
				try {
					Q::includeFile($filename);
				} catch (Exception $e) {}
			}
			$scripts_for_slots[$script['slot']][] = "\n/* Included inline from $src */\n"
			 . $ob->getClean();
		}
		$parts = array();
		foreach ($scripts_for_slots as $slot => $texts) {
			$parts[] = Q_Html::script(implode("\n\n", $texts), array('data-slot' => $slot));
		}
 		return implode("", $parts);
	}

	/**
	 * Returns the HTML markup for referencing all the scripts added so far
	 * @method scripts
	 * @static
	 * @param {string} [$between=''] Optional text to insert between the &lt;link&gt; tags.
	 * @param {string} [$slotName=null] If provided, returns only the scripts added while filling this slot.
	 *  If you pass the boolean constant true here, slotName is set to Q_Request::slotNames(true)
	 * @return {string} the HTML markup for referencing all the scripts added so far
	 */
	static function scripts ($slotName = null, $between = "\n")
	{
		$scripts = self::scriptsArray($slotName);
		if (empty($scripts))
			return '';

		$tags = array();
		foreach ($scripts as $script) {
			$src = '';
			// $media = 'screen,print';
			$type = 'text/css';
			$hash = null;
			extract($script, EXTR_IF_EXISTS);
			$tags[] = Q_Html::tag(
				'script',
				array('type' => $type, 'src' => $src, 'data-slot' => $script['slot']),
				null,
				@compact('hash')
			) . '</script>';
		}
		return implode($between, $tags);
	}

	/**
	 * Adds a stylesheet
	 * @method addStylesheet
	 * @static
	 * @param {string} $href
	 * @param {string} [$slotName=null]
	 * @param {string} [$media='screen,print']
	 * @param {string} [$type='text/css']
	 * @return {boolean} returns false if a stylesheet with exactly the same parameters has already been added, else true.
	 */
	static function addStylesheet ($href, $slotName = null, $media = 'screen,print', $type = 'text/css')
	{
		/**
		 * @event Q/response/addStylesheet {before}
		 * @param {string} href
		 * @param {string} media
		 * @param {string} type
		 * @return {array}
		 */
		$modify = Q::event('Q/response/addStylesheet', @compact('href', 'media', 'type'), 'before');
		if ($modify) {
			extract($modify);
		}

		foreach (self::$stylesheets as $stylesheet) {
			if ($stylesheet['href'] == $href
			&& $stylesheet['media'] == $media
			&& $stylesheet['type'] == $type) {
				// already added
				return false;
			}
		}
		self::$stylesheets[] = @compact('href', 'media', 'type');

		// Now, for the slot
		if (!isset($slotName)) {
			$slotName = isset(self::$slotName) ? self::$slotName : '';
		}
		if (!isset(self::$stylesheetsForSlot[$slotName])) {
			self::$stylesheetsForSlot[$slotName] = array();
		}
		foreach (self::$stylesheetsForSlot[$slotName] as $stylesheet) {
			if ($stylesheet['href'] == $href
			&& $stylesheet['media'] == $media
			&& $stylesheet['type'] == $type) {
				// already added
				return false;
			}
		}
		self::$stylesheetsForSlot[$slotName][] = @compact('href', 'media', 'type');
		return true;
	}

	/**
	 * Returns array of stylesheets that have been added so far
	 * @method stylesheetsArray
	 * @static
	 * @param {string} [$slotName=null] If provided, returns only the stylesheets added while filling this slot.
	 *  If you leave this empty, you get stylesheets information for the "right" slots.
	 *  If you pass false here, you will just get the entire $stylesheets array without any processing.
	 * @param {string} [$urls=true] If true, transforms all the 'src' values into URLs before returning.
	 * @return {array} the array of stylesheets that have been added so far
	 */
	static function stylesheetsArray ($slotName = null, $urls = true)
	{
		if ($slotName === false) {
			return $sheets = self::$stylesheets;
		}
		if (!isset($slotName) or $slotName === true) {
			$slotName = self::allSlotNames();
		}
		if (is_array($slotName)) {
			$sheets = array();
			$saw = array();
			foreach ($slotName as $sn) {
				foreach (self::stylesheetsArray($sn, $urls) as $b)  {
					$key = $b['href'].' '.$b['media'];
					if (!empty($saw[$key])) {
						continue;
					}
					$b['slot'] = $sn;
					$sheets[] = $b; // a unique new script to add to the list
					$saw[$key] = true;
				}
			}
			return $sheets;
		} else {
			if (!isset(self::$stylesheetsForSlot[$slotName])) {
				return array();
			}
			$sheets = self::$stylesheetsForSlot[$slotName];
		}
		if (!is_array($sheets)) {
			return array();
		}
		$result = array();
		$saw = array();
		foreach ($sheets as $b)  {
			if ($urls) {
				list($href, $filename, $hash) = Q_Html::themedUrlFilenameAndHash($b['href']);
				$b['href'] = $href;
				$b['hash'] = $hash;
			}
			$key = $b['href'].' '.$b['media'];
			if (!empty($saw[$key])) {
				continue;
			}
			$result[] = $b; // a unique new script to add to the list
			$saw[$key] = true;
		}
		return $result;
	}

	/**
	 * Returns a &lt;style&gt; tag with the content of all the stylesheets included inline
	 * @method stylesheetsInline
	 * @static
	 * @param {array} [$styles=array()] If not empty, this associative array contains styles which will be
	 * included at the end of the generated &lt;style&gt; tag.
	 * @param {string} [$slotName=null] If provided, returns only the stylesheets added while filling this slot.
	 * @return {string} the style tags and their contents inline
	 */
	static function stylesheetsInline ($styles = array(), $slotName = null)
	{
		if (empty(self::$stylesheets)) {
			return '';
		}

		$sheets = self::stylesheetsArray($slotName, false);
		$sheets_for_slots = array();
		if (!empty($sheets)) {
			foreach ($sheets as $stylesheet) {
				$href = '';
				$media = 'screen,print';
				$type = 'text/css';
				extract($stylesheet, EXTR_IF_EXISTS);

				$ob = new Q_OutputBuffer();
				if (Q_Valid::url($href)) {
					try {
						include($href);
					} catch (Exception $e) {}
				} else {
					list ($href, $filename) = Q_Html::themedUrlFilenameAndHash($href);
					try {
						Q::includeFile($filename);
					} catch (Exception $e) {}
				}
				$sheets_for_slots[$stylesheet['slot']][] = "\n/* Included inline from $href */\n"
				 . $ob->getClean();
			}
		}
		$parts = array();
		foreach ($sheets_for_slots as $slot => $texts) {
			$parts[] = Q_Html::tag('style', array('data-slot' => $slot), implode("\n\n", $texts));
		}
 		return implode("", $parts);
	}

	/**
	 * Returns the HTML markup for referencing all the stylesheets added so far
	 * @method stylesheets
	 * @static.
	 * @param {string} [$slotName=null] If provided, returns only the stylesheets
	 *   added while filling this slot.
	 * @param {string} [$between=''] Optional text to insert between the &lt;link&gt; tags
	 * @param {boolean} [$skipPreloads=false] Whether to skip automatically also adding
	 *   <link> tags informing the client on what to preload.
	 * @return {string} the HTML markup for referencing all the stylesheets added so far
	 */
	static function stylesheets ($slotName = null, $between = "\n", $skipPreloads = false)
	{
		$stylesheets = self::stylesheetsArray($slotName);
		if (empty($stylesheets))
			return '';
		$baseUrl = Q_Request::baseUrl();
		$tags = array();
		foreach ($stylesheets as $stylesheet) {
			$rel = 'stylesheet';
			$href = '';
			$media = 'screen,print';
			$type = 'text/css';
			$hash = null;
			extract($stylesheet, EXTR_IF_EXISTS);
			if (Q::startsWith($href, $baseUrl)) {
				$tail = substr($href, strlen($baseUrl)+1);
				if (!$skipPreloads) {
					if (!empty(Q_Uri::$preload[$tail])) {
						foreach (Q_Uri::$preload[$tail] as $preload) {
							$parts = explode('.', $preload);
							$ext = array_pop($parts);
							if (empty(Q_Html::$preloadAs[$ext])) {
								continue;
							}
							$tags[] = Q_Html::tag('link', array(
								'rel' => 'preload',
								'href' => $preload,
								'as' => Q_Html::$preloadAs[$ext]
							));
						}
					}
				}
			}
			$attributes = @compact('rel', 'type', 'href', 'media');
			$attributes['data-slot'] = $stylesheet['slot'];
			$tags[] = Q_Html::tag('link', $attributes, null, @compact('hash'));
		}
		return implode($between, $tags);
	}
	
	/**
	 * Add <link> tag with some attributes
	 * @method addLink
	 * @static
	 * @param {string} $rel the rel attribute
	 * @param {sting} $href the href attributes
	 * @param {array} [$attributes=array()] any other attributes
	 * @param {string} [$slotName=null]
	 */
	static function addLink($rel, $href, array $attributes = array(), $slotName = null)
	{
		$attributes = array_merge(@compact('rel', 'href'), $attributes);
		if (!isset($slotName)) {
			$slotName = isset(self::$slotName) ? self::$slotName : '';
		}
		self::$links[$slotName][] = $attributes;
	}
	
	/**
	 * Return the array of links added so far
	 * @method linksArray
	 * @static
	 * @param {string} [$slotName=null] If provided, returns only the links set while filling this slot.
	 *  If you leave this empty, you get links information for the "right" slots.
	 *  If you pass false here, you will just get the entire $links array without any processing.
	 * @param {string} [$urls=true] If true, transforms all the 'src' values into URLs before returning.
	 * @return {array} if $slotName is an array or true, returns array of $slotName => $links, otherwise returns $links
	 */
	static function linksArray ($slotName = null, $urls = true)
	{
		if ($slotName === false) {
			return is_array(self::$links) ? self::$links : array();
		}
		if (!isset($slotName) or $slotName === true) {
			$slotName = self::allSlotNames();
		}
		if (is_array($slotName)) {
			$links = array();
			foreach ($slotName as $sn) {
				$links[$sn] = self::linksArray($sn, $urls);
			}
			return $links;
		}
		if (!isset(self::$linksForSlot[$slotName])) {
			return array();
		}
		$links = self::$linksForSlot[$slotName];
		return is_array($links) ? $links : array();
	}
	
	/**
	 * Returns text describing all the links inline which have been added with setLink()
	 * @method links
	 * @static
	 * @param {string} [$slotName=null] If provided, returns only the links set while filling this slot.
	 * @param {string} [$between=''] Optional text to insert between the <link> tags or blocks of text.
	 * @return {string}
	 */
	static function links($slotName = null, $between = "\n")
	{
		$links = self::linksArray($slotName);
		if (!is_array($links)) {
			return '';
		}

		$tags = array();
		foreach ($links as $sn => $l) {
			foreach ($l as $link) {
				$tags[] = Q_Html::tag('link', $link);
			}
		}
		return implode($between, $tags);
	}
	
	/**
	 * Call this method to add a css class to the HTML element in the layout
	 * @method addHtmlCssClass
	 * @static
	 * @param {string} $className
	 */
	static function addHtmlCssClass($className)
	{
		self::$htmlCssClasses[$className] = true;
	}
	/**
	 * Call this method to add attribute to the HTML element in the layout
	 * @method addHtmlAttribute
	 * @static
	 * @param {string} $name
	 * @param {string} $value
	 */
	static function addHtmlAttribute($name, $value)
	{
		self::$htmlAttributes[$name] = $value;
	}
	/**
	 * Used to get or set the language (two-letter lowercase ISO code)
	 * of the output page. Defaults to "en". It is used in htmlAttributes method.
	 * @method language
	 * @static
	 * @param {string} [$language] Set a new code here to change the language
	 * @return {string}
	 */
	static function language($language = null)
	{
		if (isset($language)) {
			self::$language = $language;
		}
		return self::$language;
	}
	
	/**
	 * Returns the string containing all the html attributes
	 * @method htmlAttributes
	 * @static
	 * @return {string}
	 */
	static function htmlAttributes()
	{
		$touchscreen = Q_Request::isTouchscreen() ? 'Q_touchscreen' : 'Q_notTouchscreen';
		$mobile = Q_Request::isMobile() ? 'Q_mobile' : 'Q_notMobile';
		$cordova = Q_Request::isCordova() ? 'Q_cordova': 'Q_notCordova';
		$platform = 'Q_'.Q_Request::platform();
		$ie = Q_Request::isIE() ? 'Q_ie' : 'Q_notIE';
		$ie8 = Q_Request::isIE(0, 8) ? 'Q_ie8OrBelow' : 'Q_notIE8OrBelow';
		$uri = Q_Dispatcher::uri();
		$classes = "{$uri->module} {$uri->module}_{$uri->action}";
		foreach (self::$htmlCssClasses as $k => $v) {
			$classes .= Q_Html::text(" $k");
		}
		$attributes = array();
		foreach (self::$htmlAttributes as $k => $v) {
			$attributes[] = Q_Html::text("$k").'='.Q_Html::text("$v");
		}
		$language = self::language();
		Q::event('Q/Response/htmlAttributes', array(
			'touchscreen' => &$touchscreen,
			'mobile' => &$mobile,
			'cordova' => &$cordova,
			'platform' => &$platform,
			'ie' => &$ie,
			'ie8' => &$ie8,
			'uri' => &$uri,
			'classes' => &$classes,
			'attributes' => &$attributes,
			'language' => &$language
		), 'before');
		return 'lang="' . $language . '" '
			. 'prefix="og:http://ogp.me/ns# object:http://ogp.me/ns/object# website:http://ogp.me/ns/website# fb:http://ogp.me/ns/fb#" '
			. 'itemscope itemtype="https://schema.org/WebPage" '
			. "class='$touchscreen $mobile $cordova $platform $ie $ie8 $classes' "
			.implode(' ', $attributes);
	}

	/**
	 * Gets/sets the favicon url
	 * @method faviconUrl
	 * @static
	 * @param {string} [$new_url=null]
	 * @return {string}
	 */
	static function faviconUrl($new_url=null)
	{
		if (!isset(self::$faviconUrl)) {
			self::$faviconUrl = Q_Request::baseUrl().'/favicon.ico';
		}
		$old_url = self::$faviconUrl;
		if (isset($new_url)) {
			self::$faviconUrl = $new_url;
		}
		return $old_url;
	}

	/**
	 * Gets or sets whether the response is buffered.
	 * @method isBuffered
	 * @static
	 * @param {boolean|string} [$new_value=null] If not present,
	 *  just returns the current value of this setting.
	 *  If true or false, sets the setting to this value,
	 *  and returns the setting's old value.
	 * @return {boolean|string}
	 */
	static function isBuffered($new_value = null)
	{
		$old_value = self::$isBuffered;
		if (isset($new_value)) {
			self::$isBuffered = $new_value;
		}
		return $old_value;
	}

	/**
	 * Used mostly internally, to determine whether or not we should be firing the
	 * Q/responseExtras handlers, to add information to the loaded web environment.
	 * This is true when rendering a static page, but false during a regular AJAX call,
	 * because typically these things are already loaded by then.
	 * @method processResponseExtras
	 * @param {string} $hookType can be "before" or "after"
	 * @static
	 * @return {boolean} true if the Q/responseExtras was processed
	 */
	static function processResponseExtras($hookType)
	{
		if (self::$skipResponseExtras or !Q_Request::shouldLoadExtras('response')) {
			return false;
		}
		Q::event('Q/responseExtras', array(), $hookType);
		return true;
	}
	
	/**
	 * Used mostly internally, to determine whether or not we should be firing the
	 * Q/sessionExtras handlers, to add information specific to the user's session.
	 * This is false when rendering a static page, or just a regular AJAX call.
	 * @method processSessionExtras
	 * @param {string} $hookType can be "before" or "after"
	 * @static
	 * @return {boolean} true if the Q/sessionExtras was processed
	 */
	static function processSessionExtras($hookType)
	{
		if (self::$skipSessionExtras or !Q_Request::shouldLoadExtras('session')) {
			return false;
		}
		if (Q_Request::isAjax()) {
			Q_Valid::nonce((bool)Users::loggedInUser(false, false)); // SECURITY: prevent CSRF attacks
		}
		Q::event('Q/sessionExtras', array(), $hookType);
		return true;
	}

	/**
	 * Returns array of all the slots that have been filled
	 * @method slots
	 * @static
	 * @param {boolean} [$requestedOnesOnly=true] Set to true in order to return only the slots that were requested
	 * @return {array}
	 */
	static function slots($requestedOnesOnly = true)
	{
		if (!$requestedOnesOnly) {
			return self::$slots;
		}
		$result = array();
		$slotNames = Q_Request::slotNames(true);
		foreach ($slotNames as $sn) {
			$result[$sn] = isset(self::$slots[$sn]) ? self::$slots[$sn] : null;
		}
		return $result;
	}

	/**
	 * Sets a header to redirect to a given URI or URL.
	 * @method redirect
	 * @static
	 * @param {string} $uri The URL or internal URI to redirect to
	 * @param {array} $options An array of options that can include:
	 * @param {boolean} [$options.loop=false] If false, and current URL is the same as the new one, skips setting the redirect header and just returns false. Set to true to avoid this.
	 * @param {boolean} [$options.permanently=false] If true, sets response code as 301 instead of 302
	 * @param {boolean} [$options.noProxy=false] If true, doesn't use the proxy mapping to determine URL
	 * @param {boolean} [$options.querystring=true] If true, attach all existing GET params to redirect url.
	 * @throws Q_Exception_BadValue
	 * @return {boolean}
 	 *  Return whether the redirect header was set.
	 */
	static function redirect($uri, $options = array())
	{
		extract($options);
		$url = Q_Uri::url($uri, null, !empty($noProxy));
		if ($url === Q_Uri::unreachableUri()) {
			throw new Q_Exception_BadValue(array(
				'internal' => 'uri',
				'problem' => 'no url routes to it'
			));
		}
		$level = ob_get_level();
		for ($i=0; $i<$level; ++$i) {
			ob_clean();
		}
		/**
		 * @event Q/response {before}
		 * @param {string} permanently
		 * @param {string} uri
		 * @param {string} url
		 * @param {string} loop
		 * @return {boolean}
		 */
		$result = Q::event(
			'Q/redirect',
			@compact('uri', 'url', 'loop', 'permanently', 'noProxy', 'level'),
			'before'
		);
		if (isset($result)) {
			return $result;
		}
		if (empty($loop) and Q_Request::url() === $url) {
			return false;
		}
		if (!empty($querystring) and !empty($_SERVER['QUERY_STRING'])) {
			$url = Q_Uri::fixUrl($url . '?' . $_SERVER['QUERY_STRING']);
		}
		if (!Q_Request::isAjax()) {
			if (!empty($permanently)) {
				header("HTTP/1.1 301 Moved Permanently");
			}
			header("Location: $url");
		}
		self::$redirected = $uri;
		return true;
	}

	/**
	 * Used to get/set output that the Q/response handler should consult.
	 * @method output
	 * @static
	 * @param {string} [$new_output=null] Pass a string here to return as output,
	 *  instead of the usual layout.
	 *  Or, pass true here to indicate that we have already returned the output,
	 *  and to skip rendering a layout.
	 * @param {boolean} [$override=false] If an output string is already set, 
	 *  calling this method wouldn't override it unless you pass true here.
	 * @return {string} Returns the output that was set, if any
	 */
	static function output($new_output = null, $override = false)
	{
		static $output = null;
		if (isset($new_output)) {
			if (!isset($output) or $override === true) {
				$output = $new_output;
			}
		}
		return $output;
	}

	/**
	 * @method setCookie
	 * @static
	 * @param {string} $name The name of the cookie
	 * @param {string} $value The value of the cookie
	 * @param {string} [$expires=0] The number of seconds since the epoch, 0 means expire when browser session ends
	 * @param {string} [$path=null] The path to set for the cookie. Defaults to path from Q_Request::baseUrl()
	 * @param {string} [$domain=null] Set true here to set domain to ".hostname" or pass a string.
	 *  If you leave it null, then the cookie will be set as a host-only cookie, meaning
	 *  that subdomains won't get it.
	 * @param {boolean} [$secure=false] Making the cookie secure
	 * @param {boolean} [$httponly=false] Make the cookie http only
	 * @return {string}
	 */
	static function setCookie(
		$name, $value, $expires = 0,
		$path = null, $domain = null,
		$secure = false, $httponly = false
	) {
		if (empty($_SERVER['HTTP_HOST'])) {
			Q::log('Warning: Ignoring call to Q_Response::setCookie() without $_SERVER["HTTP_HOST"]'.PHP_EOL);
			return false;
		}
		if (isset($_COOKIE[$name]) and $_COOKIE[$name] === $value) {
			return;
		}
		if (Q_Dispatcher::$startedResponse) {
			throw new Q_Exception("Q_Response::setCookie must be called before Q/response event");
		}
		$baseUrl = Q_Request::baseUrl();
		if (!isset($path)) {
			$path = parse_url($baseUrl, PHP_URL_PATH);
		}
		if ($domain === null) {
			// remove any possibly conflicting cookies from .hostname, with same path
			$host = parse_url($baseUrl, PHP_URL_HOST);
			$d = (strpos($host, '.') !== false ? '.' : '').$host;
			self::$cookiesToRemove[$name] = array($path, $d, $secure, $httponly);
		}
		// see https://bugs.php.net/bug.php?id=38104
		self::$cookies[$name] = array($value, $expires, $path, $domain, $secure, $httponly);
		$_COOKIE[$name] = $value;
		return $value;
	}
	
	/**
	 * @method clearCookie
	 * @static
	 * @param {string} $name
	 * @param {string} [$path=null]
	 * @return {string}
	 */
	static function clearCookie($name, $path = null)
	{
		self::setCookie($name, '', 1, $path);
		unset($_COOKIE[$name]);
	}
	
	/**
	 * Outputs all the headers for effecting changes in cookies set by Q_Response::setCookies.
	 * This is called automatically by the dispatcher before the Q/response event.
	 * @method sendCookieHeaders
	 * @static
	 */
	static function sendCookieHeaders()
	{
		if (empty(self::$cookies)) {
			return;
		}

		foreach (self::$cookiesToRemove as $name => $args) {
			list($path, $domain, $secure, $httponly) = $args;
			self::_cookie($name, '', 1, $path, $domain, $secure, $httponly);
		}
		foreach (self::$cookies as $name => $args) {
			list($value, $expires, $path, $domain, $secure, $httponly) = $args;
			self::_cookie($name, $value, $expires, $path, $domain, $secure, $httponly);
		}
		$header = '';
		$header = Q::event('Q/Response/sendCookieHeaders',
			@compact('name', 'value', 'expires', 'path', 'domain', 'secure', 'httponly', 'header'),
			'after', false, $header
		);
		if ($header) {
			header($header);
		}
		self::$cookies = array();
		self::$cookiesToRemove = array();
	}

	static function flushAndContinue($timeLimit = 30)
	{
		self::setIgnoreUserAbort(true);
		set_time_limit($timeLimit);
		ob_start();
		header('Connection: close');
		header('Content-Length: '.ob_get_length());
		ob_end_flush();
		$level = ob_get_level();
		while (--$level >= 0) {
			ob_flush();
		}
		flush();
	}
	
	protected static function _cookie($name, $value, $expires, $path, $domain, $secure, $httponly)
	{
		$parts = parse_url(Q_Request::baseUrl());
		$path = $path ? $path : (!empty($parts['path']) ? $parts['path'] : '/');
		if ($domain === true) {
			$domain2 = (strpos($parts['host'], '.') !== false ? '.' : '').$parts['host'];
		} else {
			$domain2 = $domain ? $domain : '';
		}
		setcookie($name, $value, $expires, $path, $domain2, $secure, $httponly);
	}

	/**
	 * Call this to support CORS
	 * @method supportCORS
	 * @param {string} [$from='*']
	 */
	static function supportCORS($from = '*')
	{
		header("Access-Control-Allow-Origin: $from");
		header("Access-Control-Allow-Credentials: true");
	}

	/**
	 * @method setIgnoreUserAbort
	 * @static
	 * @param {boolean} [$value=null]
	 */
	static function setIgnoreUserAbort($value = null)
	{
		if (!isset($value)) {
			$value = Q_Config::get('Q', 'web', 'ignoreUserAbort', null);
		}
		if (isset($value)) {
			ignore_user_abort($value);
		}
	}

	/**
	 * @property $batch
	 * @type boolean
	 * @static
	 */
	public static $batch = false;
	/**
	 * @property $redirected
	 * @type boolean
	 * @static
	 */
	public static $redirected = false;

	/**
	 * @property $slots
	 * @static
	 * @type array
	 */
	protected static $slots = array();
	
	/**
	 * For internal use
	 * @property $_slotsWereSet
	 * @static
	 * @type array
	 */
	protected static $_slotsWereSet = array();
	
	/**
	 * For internal use
	 * @property $_fillingSlot
	 * @static
	 * @type array
	 */
	protected static $_fillingSlot = array();

	/**
	 * @property $scripts
	 * @static
	 * @type array
	 */
	protected static $scripts = array();
	/**
	 * @property $stylesheets
	 * @static
	 * @type array
	 */
	protected static $stylesheets = array();
	/**
	 * @property $styles
	 * @static
	 * @type array
	 */
	protected static $styles = array();
	/**
	 * @property $scriptLines
	 * @static
	 * @type array
	 */
	protected static $scriptLines = array();
	/**
	 * @property $metas
	 * @static
	 * @type array
	 */
	protected static $metas = array();
	/**
	 * @property $links
	 * @static
	 * @type array
	 */
	protected static $links = array();
	/**
	 * @property $templates
	 * @static
	 * @type array
	 */
	protected static $templates = array();
	/**
	 * @property $inlineTemplates
	 * @static
	 * @type array
	 */
	protected static $inlineTemplates = array();
	/**
	 * @property $errors
	 * @static
	 * @type array
	 */
	protected static $errors = array();
	/**
	 * @property $notices
	 * @static
	 * @type array
	 */
	protected static $notices = array();
	/**
	 * @property $removedNotices
	 * @static
	 * @type array
	 */
	protected static $removedNotices = array();

	/**
	 * @property $slotName
	 * @static
	 * @type array
	 */
	protected static $slotName = null;
	/**
	 * @property $scriptsForSlot
	 * @static
	 * @type array
	 */
	protected static $scriptsForSlot = array();
	/**
	 * @property $stylesheetsForSlot
	 * @static
	 * @type array
	 */
	protected static $stylesheetsForSlot = array();
	/**
	 * @property $stylesForSlot
	 * @static
	 * @type array
	 */
	protected static $stylesForSlot = array();
	/**
	 * @property $scriptLinesForSlot
	 * @static
	 * @type array
	 */
	protected static $scriptLinesForSlot = array();
	/**
	 * @property $scriptDataForSlot
	 * @static
	 * @type array
	 */
	protected static $scriptDataForSlot = array();
	/**
	 * @property $metasForSlot
	 * @static
	 * @type array
	 */
	protected static $metasForSlot = array();
	/**
	 * @property $linksForSlot
	 * @static
	 * @type array
	 */
	protected static $linksForSlot = array();
	/**
	 * @property $toolOptions
	 * @static
	 * @type array
	 */
	protected static $toolOptions = array();
	/**
	 * @property $toolRetain
	 * @static
	 * @type array
	 */
	protected static $toolRetain = array();
	/**
	 * @property $toolRetain
	 * @static
	 * @type array
	 */
	protected static $toolReplace = array();
	/**
	 * @property $retainSlot
	 * @static
	 * @type array
	 */
	protected static $retainSlot = array();
	/**
	 * @property $faviconUrl
	 * @static
	 * @type string
	 */
	protected static $faviconUrl = null;
	/**
	 * @property $layout_view
	 * @static
	 * @type string
	 */
	protected static $layoutView = null;
	/**
	 * @property $isBuffered
	 * @static
	 * @protected
	 * @type boolean
	 */
	protected static $isBuffered = true; // buffer responses by default
	/**
	 * @property $cookies
	 * @static
	 * @type array
	 */
	public static $cookies = array();
	/**
	 * @property $cookiesToRemove
	 * @static
	 * @type array
	 */
	protected static $cookiesToRemove = array();
	/**
	 * @property $htmlCssClasses
	 * @static
	 * @type array
	 */
	public static $htmlCssClasses = array();
	/**
	 * @property $htmlAttributes
	 * @static
	 * @type array
	 */
	public static $htmlAttributes = array();
	/**
	 * @property $language
	 * @static
	 * @type string
	 */
	public static $language = "en";

	static public $skipResponseExtras = false;
	static public $skipSessionExtras = false;
	
	static protected $captureScriptDataForSession = false;
	
	static public $sessionData = array();
	static public $sessionDataPaths = array();
}


// http_response_code shim for PHP < 5.4
if (!function_exists('http_response_code')) {
    function http_response_code($code = NULL) {    
        $prev_code = (isset($GLOBALS['http_response_code']) ? $GLOBALS['http_response_code'] : 200);

        if ($code === NULL) {
            return $prev_code;
        }

        switch ($code) {
            case 100: $text = 'Continue'; break;
            case 101: $text = 'Switching Protocols'; break;
            case 200: $text = 'OK'; break;
            case 201: $text = 'Created'; break;
            case 202: $text = 'Accepted'; break;
            case 203: $text = 'Non-Authoritative Information'; break;
            case 204: $text = 'No Content'; break;
            case 205: $text = 'Reset Content'; break;
            case 206: $text = 'Partial Content'; break;
            case 300: $text = 'Multiple Choices'; break;
            case 301: $text = 'Moved Permanently'; break;
            case 302: $text = 'Moved Temporarily'; break;
            case 303: $text = 'See Other'; break;
            case 304: $text = 'Not Modified'; break;
            case 305: $text = 'Use Proxy'; break;
            case 400: $text = 'Bad Request'; break;
            case 401: $text = 'Unauthorized'; break;
            case 402: $text = 'Payment Required'; break;
            case 403: $text = 'Forbidden'; break;
            case 404: $text = 'Not Found'; break;
            case 405: $text = 'Method Not Allowed'; break;
            case 406: $text = 'Not Acceptable'; break;
            case 407: $text = 'Proxy Authentication Required'; break;
            case 408: $text = 'Request Time-out'; break;
            case 409: $text = 'Conflict'; break;
            case 410: $text = 'Gone'; break;
            case 411: $text = 'Length Required'; break;
            case 412: $text = 'Precondition Failed'; break;
            case 413: $text = 'Request Entity Too Large'; break;
            case 414: $text = 'Request-URI Too Large'; break;
            case 415: $text = 'Unsupported Media Type'; break;
            case 500: $text = 'Internal Server Error'; break;
            case 501: $text = 'Not Implemented'; break;
            case 502: $text = 'Bad Gateway'; break;
            case 503: $text = 'Service Unavailable'; break;
            case 504: $text = 'Gateway Time-out'; break;
            case 505: $text = 'HTTP Version not supported'; break;
            default:
                trigger_error('Unknown http status code ' . $code, E_USER_ERROR); // exit('Unknown http status code "' . htmlentities($code) . '"');
                return $prev_code;
        }

        $protocol = (isset($_SERVER['SERVER_PROTOCOL']) ? $_SERVER['SERVER_PROTOCOL'] : 'HTTP/1.0');
        header($protocol . ' ' . $code . ' ' . $text);
        $GLOBALS['http_response_code'] = $code;

        // original function always returns the previous or current code
        return $prev_code;
    }
}
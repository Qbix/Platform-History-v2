<?php

/**
 * @module Q
 */

/**
 * Functions for validating stuff
 * @class Q_Valid
 */
class Q_Valid
{	
	/**
	 * Says whether the first parameter is an absolute URL or not.
	 * @method url
	 * @static
	 * @param {string} $url The string to test.
	 * @param {string} [$check_domain=false] Whether to check the domain, too
	 * @param {&string} [$fixed_url=null]
	 * @return {boolean}
	 */
	static function url(
	 $url,
	 $check_domain = false,
	 &$fixed_url = null)
	{
		if (!is_string($url)) {
			return false;
		}
		if (!filter_var($url, FILTER_VALIDATE_URL)) {
			return false;
		}
		if ($check_domain) {
			$url_parts = parse_url($url);
			if (!self::domain($url_parts['host'])) {
				return false;
			}
		}
		// If we are here, it's a URL
		$pieces = explode('?', $url);
		$fixed_url = $pieces[0];
		if (isset($pieces[1])) {
			$fixed_url .= '?' . implode('&', array_slice($pieces, 1));
		}
		return true;
	}
	
	/**
	 * Checks for a valid domain
	 * @method domain
	 * @static
	 * @param {array} [$options=array()]
	 * Optional. An array that can contain the following keys:
	 * 
	 * * "checkMX" => if true, will check mx records
	 * * "allowIP" => if true, allows IP addresses
	 * @return {boolean}
	 */
	static function domain (
	 $domain, 
	 $options = array())
	{
		if (ip2long($domain) === false or empty($options['allowIP'])) { 
			// Check if domain is IP. If not, it should be valid domain name
			$domain_array = explode(".", $domain);
			$count = count($domain_array);
			if ($count < 2)
				return false; // Not enough parts to domain
			for ($i = 0; $i < $count - 1; $i ++) {
				if (! preg_match(
					"/^(([A-Za-z0-9][A-Za-z0-9-]{0,61}[A-Za-z0-9])|([A-Za-z0-9]+))$/", 
					$domain_array[$i]))
					return false;
			}
			if (! preg_match("/^[A-Za-z]{2,10}$/", $domain_array[$count - 1]))
				return false;
		}
		
		if (empty($options['checkMX']))
			return true;
			
		// checks for if MX records in the DNS
		$mxhosts = array();
		if (! self::getmxrr($domain, $mxhosts)) {
			// no mx records, ok to check domain
			if (! fsockopen($domain, 25, $errno, $errstr, 30))
				return false;
			return true;
		} else {
			// mx records found
			foreach ($mxhosts as $host)
				if (fsockopen($host, 25, $errno, $errstr, 30))
					return true;
			return false;
		}
	}
	
	/**
	 * Checks both files and folders for writability
	 * @method writeable
	 * @static
	 * @param {string} $path
	 * @return {boolean}
	 */
	static function writable ($path)
	{
		// From PHP.NET
		// Checks both files and folders for writability
		//will work in despite of Windows ACLs bug
		//NOTE: use a trailing slash for folders!!!
		//see http://bugs.php.net/bug.php?id=27609
		//see http://bugs.php.net/bug.php?id=30931
		

		if ($path{strlen($path) - 1} == '/') { // recursively return a temporary file path
			return self::writable($path . uniqid(mt_rand()) . '.tmp');
		} else if (dir($path)) {
			return self::writable($path . '/' . uniqid(mt_rand()) . '.tmp');
		}
			
		// check tmp file for read/write capabilities
		$rm = file_exists($path);
		$f = @fopen($path, 'a');
		if ($f === false)
			return false;
		fclose($f);
		if (! $rm)
			unlink($path);
		return true;
	}

	/**
	 * Determines whether a string represents a valid date
	 * You might want to use checkdate after this, to validate
	 * this date against the Gregorian calendar.
	 * @method date
	 * @static
	 * @param {string} $date_string The string to test
	 * @return {boolean|array} Returns false if can't be parsed. Otherwise, an associative array.
	 */
	static function date ($date_string)
	{
		$parsed = date_parse($date_string);
		if ($parsed['error_count'] > 0)
			return false;
		return array(
			'year' => $parsed['year'],
			'month' => $parsed['month'],
			'day' => $parsed['day'],
			'hour' => $parsed['hour'],
			'minute' => $parsed['minute'],
			'second' => $parsed['second']
		);
	}

	/**
	 * Checks for a valid email address
	 * @method email
	 * @static
	 * @param {string} $address The email address to test
	 * @param {&string} [$normalized_address=null] Will be filled with the string representing the normalized email address
	 * @param {array} [$options=array()] An array that can contain the following keys:
	 * 
	 * * "check_mx" => if true, will check mx records
	 * * "allowIP" => if true, accepts IP addresses after the @
	 * @return {boolean} Whether the email address seems valid
	 */
	static function email ($address, &$normalized_address = null, $options = array())
	{
		$normalized_address = null;
		// First, we check that there's one @ symbol, and that the lengths are right
		if (! preg_match("/^[^@]{1,64}@[^@]{1,255}$/", $address)) {
			// Email invalid because wrong number of characters in one section, or wrong number of @ symbols.
			return false;
		}
		// Split it into sections to make life easier
		$normalized_address = mb_strtolower($address, 'UTF-8');
			// NOTE: strictly speaking, two emails with different case are different,
			// but in practice, users are much more likely to mess up the case of an email
			// than an ISP is to create two different accounts that differ only by the case.
		$address_array = explode("@", $normalized_address, 2);
		$local_array = explode(".", $address_array[0]);
		for ($i = 0; $i < sizeof($local_array); $i ++) {
			if (! preg_match(
				"@^(([A-Za-z0-9!#$%&'*+/=?^_`{|}~-][A-Za-z0-9!#$%&'*+/=?^_`{|}~\.-]{0,63})|(\"[^(\\|\")]{0,62}\"))$@", 
				$local_array[$i])) {
				return false;
			}
		}
		if (! self::domain($address_array[1], $options))
			return false;
		return true;
	}
	
	/**
	 * @method getmxrr
	 * @static
	 * @private
	 * @param {string} $hostname
	 * @param {&array} $mxhosts
	 * @return {boolean}
	 */
	private static function getmxrr ($hostname, &$mxhosts)
	{
		$mxhosts = array();
		exec('%SYSTEMDIRECTORY%\\nslookup.exe -q=mx ' . escapeshellarg($hostname), $result_arr);
		foreach ($result_arr as $line) {
			if (preg_match("/.*mail exchanger = (.*)/", $line, $matches))
				$mxhosts[] = $matches[1];
		}
		return (count($mxhosts) > 0);
	}

	/**
	 * Checks for a valid phone number
	 * @method phone
	 * @static
	 * @beta
	 * @param {string} $number The phone number to test
	 * @param {&string} [$normalized_number=null] Will be filled with the string representing the normalized phone number
	 * @return {boolean} Whether the phone number seems like it could be valid
	 */
	static function phone ($number, &$number_normalized = null)
	{
		$number_normalized = null;
		if (empty($number)) {
			return false;
		}
		
		// Strip all non numeric, non plus characters from the phone number
		$num = "$number";
		$stripped = preg_replace('/[^\d\+]+/', '', $num);
		if (empty($stripped) or !preg_match('/^\+?\d{5,15}$/', $stripped)) {
			return false;
		}
		
		if ($stripped[0] !== '+' and strlen($stripped) === 10) {
			// we will assume that this number is in north america and has a trunk code of 1
			if ($stripped[0] === '1') {
				return false;
			}
			$number_normalized = '1'.$stripped;
		} else {
			// otherwise, we require the person to input the e.164 of the number themselves
			// TODO: replace this with a more extensive way to convert
			// inputted numbers into e.164 format
			$number_normalized = ($stripped[0] !== '+')
				? $stripped
				: substr($stripped, 1);
		}
		$number_normalized = '+' . $number_normalized; // make this function idempotent!
		
		return true;
	}

	/**
	 * Use this for validating the nonce
	 * @method nonce
	 * @static
	 * @param {boolean} [$throwIfInvalid=false] If true, throws an exception if the nonce is invalid.
	 * @param {boolean} [$missingIsValid=false] If true, returns true if request body is missing nonce.
	 * @throws {Q_Exception_FailedValidation}
	 */
	static function nonce(
	 $throwIfInvalid = false,
	 $missingIsValid = false)
	{
		$nonce1 = Q::ifset($_SESSION['Q']['nonce']);
		$nonce2 = Q_Session::calculateNonce();
		if (!$nonce1 and !$nonce2) {
			return true;
		}
		$snf = Q_Config::get('Q', 'session', 'nonceField', 'nonce');
		$sn = Q_Request::special($snf, null);
		if ($missingIsValid and !isset($sn)) {
			return true;
		}
		$gp = array_merge($_GET, $_POST);
		$rn = Q_Request::special($snf, null, $gp);
		if (!isset($sn) or ($rn !== $nonce1 and $rn !== $nonce2)) {
			if (!$throwIfInvalid) {
				return false;
			}
			Q_Session::throwInvalidSession();
		}
		return true;
	}
	
	/**
	 * Validates the signature of the request (from Q_Request::special('sig', null))
	 * @method signature
	 * @static
	 * @param {boolean} [$throwIfInvalid=false] If true, throws an exception if the nonce is invalid.
	 * @param {array} [$data=$_REQUEST] The data to check the signature of
	 * @param {array|string} [$fieldKeys] Path of the key under which signature is stored
	 * @param {string} [$secret] A different secret to use for generating the signature
	 * @return {boolean} Whether the phone number seems like it could be valid
	 * @throws {Q_Exception_FailedValidation}
	 */
	static function signature (
		$throwIfInvalid = false, 
		$data = null, 
		$fieldKeys = null, 
		$secret = null)
	{
		if (!isset($data)) {
			$data = $_REQUEST;
		}
		if (!isset($secret)) {
			$secret = Q_Config::get('Q', 'internal', 'secret', null);
		}
		if (!isset($secret)) {
			return true;
		}
		$invalid = true;
		if (is_array($fieldKeys)) {
			$ref = &$data;
			foreach ($fieldKeys as $k) {
				if (!isset($k)) {
					break;
				}
				$ref2 = &$ref;
				$ref = &$ref[$k];
			}
			if ($ref) {
				$signature = $ref;
				unset($ref2[$k]);
				$calculated = Q_Utils::signature($data, $secret);
				if ($calculated === $signature) {
					$invalid = false;
				} else { // try with null
					$ref2[$k] = null;
					$calculated = Q_Utils::signature($data, $secret);
					if ($calculated === $signature) {
						$invalid = false;
					}
				}
			}
		} else {
			if (is_string($fieldKeys)) {
				$signature = $fieldKeys;
			} else {
				$sgf = Q_Config::get('Q', 'internal', 'sigField', 'sig');
				$signature = Q_Request::special($sgf, null, $data);
			}
			if ($signature) {
				$invalid = false;
				$req = $data;
				unset($req["Q.$sgf"]);
				unset($req["Q_$sgf"]);
				if (Q_Utils::signature($req, $secret) !== $signature) {
					$invalid = true;
				}
			}
		}
		if (!$invalid) {
			return true;
		}
		if ($throwIfInvalid) {
			header("HTTP/1.0 403 Forbidden");
			$message = Q_Config::get('Q', 'internal', 'sigMessage', "The signature did not match.");
			throw new Q_Exception_FailedValidation(compact('message'), array("Q.$sgf", "_[$sgf]"));
		}
		return false;
	}
	
	/**
	 * Convenience method to require certain fields to be present in an array,
	 * and generate errors otherwise.
	 * @method requireFields
	 * @static
	 * @param {array} $fields Array of strings or nested arrays of strings, naming fields that are required
	 * @param {array} [$source=$_REQUEST] Where to look for the fields
	 * @param {boolean} [$throwIfMissing=false] Whether to throw an exception
	 *    on the first violation, or add them to a list.
	 * @return {array} The resulting list of exceptions
	 */
	static function requireFields($fields, $source = null, $throwIfMissing = false)
	{
		if (!isset($source)) {
			$source = $_REQUEST;
		}
		$result = array();
		foreach ($fields as $fieldname) {
			$missing = false;
			$field = '';
			if (is_array($fieldname)) {
				$t = $source;
				foreach ($fieldname as $f) {
					if (!isset($t[$f])) {
						$missing = true;
						break;
					}
					$t = $t[$f];
				}
				if ($missing) {
					foreach ($fieldname as $f) {
						$field = $field ? $field.'['.$f.']' : $f;
					}
				}
			} else {
				if (!isset($source[$fieldname])) {
					$missing = true;
				}
				$field = $fieldname;
			}
			if ($missing) {
				$exception = new Q_Exception_RequiredField(compact('field'), $field);
				if ($throwIfMissing) {
					throw $exception;
				}
				$result[] = $exception;
			}
		}
		return $result;
	}
}

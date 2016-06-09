<?php

/**
 * @module Q
 */

/**
 * Functions for doing various things
 * @class Q_Utils
 */

define('Q_UTILS_CONNECTION_TIMEOUT', 30);
define('Q_UTILS_INTERNAL_TIMEOUT', 1);

class Q_Utils
{
	/**
	 * Generates signature for the data
	 * @method signature
	 * @static
	 * @param {array|string} $data
	 * @param {string} $secret
	 * @return {string}
	 */
	static function signature($data, $secret)
	{
		if (!isset($secret)) {
			throw new Q_Exception("Q_Utils::signature is expecting a \$secret");
		}
		if (is_array($data)) {
			ksort($data);
			$data = http_build_query($data);
		}
		return self::hmac('md5', $data, $secret);
	}

	/**
	 * Sign the data
	 * @method sign
	 * @static
	 * @param {array} $data
	 * @param {array} $field_keys
	 * @return {array}
	 */
	static function sign($data, $field_keys = null) {
		$secret = Q_Config::get('Q', 'internal', 'secret', null);
		if (isset($secret)) {
			if (!$field_keys) {
				$sf = Q_Config::get('Q', 'internal', 'sigField', 'sig');
				$field_keys = array("Q.$sf");
			}
			$ref = &$data;
			for ($i=0, $c = count($field_keys); $i<$c-1; ++$i) {
				if (!array_key_exists($field_keys[$i], $ref)) {
					$ref[ $field_keys[$i] ] = array();
				}
				$ref = &$ref[ $field_keys[$i] ];
			}
			$ref[ end($field_keys) ] = Q_Utils::signature($data, $secret);
		}
		return $data;
	}
	
	/**
	 * Calculates hmac
	 * @method hmac
	 * @static
	 * @param {string} $algo
	 * @param {string} $data
	 * @param {string} $key
	 * @param {boolean} [$raw_output=false]
	 * @return {string}
	 */
	static function hmac($algo, $data, $key, $raw_output = false)
	{
		$algo = strtolower($algo);
		$pack = 'H'.strlen(call_user_func($algo, 'test'));
		$size = 64;
		$opad = str_repeat(chr(0x5C), $size);
		$ipad = str_repeat(chr(0x36), $size);

		if (strlen($key) > $size) {
			$key = str_pad(pack($pack, call_user_func($algo, $key)), $size, chr(0x00));
		} else {
			$key = str_pad($key, $size, chr(0x00));
		}

		for ($i = 0; $i < strlen($key) - 1; $i++) {
			$opad[$i] = $opad[$i] ^ $key[$i];
			$ipad[$i] = $ipad[$i] ^ $key[$i];
		}

		$output = call_user_func(
			$algo, 
			$opad.pack($pack, call_user_func($algo, $ipad.$data))
		);

		return ($raw_output) ? pack($pack, $output) : $output;
	}

	/**
	 * Generates random letter sequence
	 * @method unique
	 * @static
	 * @param {integer} [$len=8]
	 * @param {string} [$characters='abcdefghijklmnopqrstuvwxyz'] All the characters from which to construct possible ids
	 * @return {string}
	 */
	static function unique(
		$len = 8, 
		$characters = 'abcdefghijklmnopqrstuvwxyz')
	{
		$characters_len = strlen($characters);
		$result = str_repeat(' ', $len);
		for ($i=0; $i<$len; ++$i) {
			$result[$i] = $characters[mt_rand(0, $characters_len-1)];
		}
		return $result;
	}

	/**
	 * Calculates a hash code from a string, to match String.prototype.hashCode() in Q.js
	 * @static
	 * @param {string} $text
	 * @return {integer}
	 */
	static function hashCode($text)
	{
		$hash = 0;
		$len = strlen($text);
		if (!$len) {
			return $hash;
		}
		for ($i=0; $i<$len; ++$i) {
			$c = ord($text[$i]);
			$hash = $hash % 16777216;
			$hash = (($hash<<5)-$hash)+$c;
			$hash = $hash & $hash; // Convert to 32bit integer
		}
		return $hash;
	}
	
	/**
	 * Some basic obfuscation to thwart scrapers from getting emails, phone numbers, etc.
	 * @static
	 * @param {string} $text
	 * @return {text}
	 */
	static function obfuscate($text)
	{
		$len = strlen($text);
		$result = '';
		for ($i=0; $i<$len; ++$i) {
			$result .= chr(ord($text[$i])-1);
		}
		return $result;
	}

	/**
	 * Normalizes text by converting it to lower case, and
	 * replacing all non-accepted characters with underscores.
	 * @method normalize
	 * @static
	 * @param {string} $text The text to normalize
	 * @param {string} [$replacement='_'] A string to replace one or more unacceptable characters.
	 *  You can also change this default using the config Db/normalize/replacement
	 * @param {string} [$characters=null] Defaults to '/[^A-Za-z0-9]+/'. A regexp characters that are not acceptable.
	 *  You can also change this default using the config Db/normalize/characters
	 * @param {integer} [$numChars=200] Defaults to 200, maximum length of normalized string
	 */
	static function normalize(
		$text,
		$replacement = '_',
		$characters = null,
		$numChars = 200)
	{
		if (!isset($characters)) {
			$characters = '/[^A-Za-z0-9]+/';
			if (class_exists('Q_Config')) {
				$characters = Q_Config::get('Db', 'normalize', 'characters', $characters);
			}
		}
		if (!isset($replacement)) {
			$replacement = '_';
			if (class_exists('Q_Config')) {
				$replacement = Q_Config::get('Db', 'normalize', 'replacement', $replacement);
			}
		}
		$result = preg_replace($characters, $replacement, strtolower($text));
		if (strlen($text) > $numChars) {
			$result = substr($result, 0, $numChars - 11) . '_' 
					  . self::hashCode(substr($result, $numChars - 11));
		}
		return $result;
	}
	
	/**
	 * Hashes text in a standard way.
	 * @method hash
	 * @static
	 * @param {string} $test
	 * @return {string}
	 */
	static function hash($text)
	{
		return md5(Db::normalize($text));
	}

	/**
	 * @brief Generates a Universally Unique IDentifier, version 4.
	 *
	 * This function generates a truly random UUID. The built in CakePHP String::uuid() function
	 * is not cryptographically secure. You should uses this function instead.
	 *
	 * @see http://tools.ietf.org/html/rfc4122#section-4.4
	 * @see http://en.wikipedia.org/wiki/UUID
	 * @return {string} A UUID, made up of 32 hex digits and 4 hyphens.
	 */
	static function uuid() {
		
		if (!self::$urand) {
			self::$urand = @fopen ( '/dev/urandom', 'rb' );
		}

		$pr_bits = false;
		if (is_resource ( self::$urand )) {
			$pr_bits .= @fread ( self::$urand, 16 );
		}
		if (! $pr_bits) {
			$fp = @fopen ( '/dev/urandom', 'rb' );
			if ($fp !== false) {
				$pr_bits .= @fread ( $fp, 16 );
				@fclose ( $fp );
			} else {
				// If /dev/urandom isn't available (eg: in non-unix systems), use mt_rand().
				$pr_bits = "";
				for($cnt = 0; $cnt < 16; $cnt ++) {
					$pr_bits .= chr ( mt_rand ( 0, 255 ) );
				}
			}
		}
		$time_low = bin2hex ( substr ( $pr_bits, 0, 4 ) );
		$time_mid = bin2hex ( substr ( $pr_bits, 4, 2 ) );
		$time_hi_and_version = bin2hex ( substr ( $pr_bits, 6, 2 ) );
		$clock_seq_hi_and_reserved = bin2hex ( substr ( $pr_bits, 8, 2 ) );
		$node = bin2hex ( substr ( $pr_bits, 10, 6 ) );
		
		/**
		 * Set the four most significant bits (bits 12 through 15) of the
		 * time_hi_and_version field to the 4-bit version number from
		 * Section 4.1.3.
		 * @see http://tools.ietf.org/html/rfc4122#section-4.1.3
		 */
		$time_hi_and_version = hexdec ( $time_hi_and_version );
		$time_hi_and_version = $time_hi_and_version >> 4;
		$time_hi_and_version = $time_hi_and_version | 0x4000;
		
		/**
		 * Set the two most significant bits (bits 6 and 7) of the
		 * clock_seq_hi_and_reserved to zero and one, respectively.
		 */
		$clock_seq_hi_and_reserved = hexdec ( $clock_seq_hi_and_reserved );
		$clock_seq_hi_and_reserved = $clock_seq_hi_and_reserved >> 2;
		$clock_seq_hi_and_reserved = $clock_seq_hi_and_reserved | 0x8000;
		
		return sprintf ( '%08s-%04s-%04x-%04x-%012s', $time_low, $time_mid, $time_hi_and_version, $clock_seq_hi_and_reserved, $node );
	}
	
	/**
	 * Takes parts of a string
	 * @method parts
	 * @static
	 * @param {string} $source the string to split by the separator
	 * @param {integer} $ofset just like in array_slice
	 * @param {integer} $length just like in array_slice
	 * @param {string} $separator the separator, defaults to '/'
	 * @return {string} the extracted parts, joined together again by the separator
	 */
	static function parts($source, $offset, $length = null, $separator = '/')
	{
		return implode($separator, array_slice(explode($separator, $source), $offset, $length));
	}
	
	/**
 	 * Sends a post and returns right away.
 	 * In the url being called, make sure it ignores user aborts.
	 * For example, in PHP call ignore_user_abort(true) at the top of that script.
	 * @method postAsync
	 * @static
	 * @param {string|array} $uri The url to post to
	 * @param {array} $params An associative array of params
	 * @param {string} [$user_agent=null] The user-agent string to send. 
	 *  If null, is replaced by default of "Mozilla/5.0 ..."
	 *  If false, not sent.
	 * @param {integer} [$timeout=Q_UTILS_CONNECTION_TIMEOUT]
	 * @param {boolean} [$throwIfRefused=false] Pass true here to throw an exception whenever Node process is not running or refuses the request
	 * @return {boolean} Returns whether the post succeeded.
	 */
	static function postAsync(
		$uri,
		$params,
		$user_agent = null,
		$timeout = Q_UTILS_CONNECTION_TIMEOUT,
		$throwIfRefused = false)
	{
		if (!is_array($params)) {
			throw new Exception("\$params must be an array");
		}
		$post_string = http_build_query($params);
		
		$headers = array();
		$ip = null;
		if (is_array($uri)) {
			$url = $uri[0];
			if (isset($uri[1])) {
				$ip = $uri[1];
			}
		} else {
			$url = $uri;
		}
		$parts = parse_url($url);		
		$host = $parts['host'];
		if (!isset($ip)) $ip = $host;
		$request_uri = isset($parts['path']) ? $parts['path'] : '';
		if (!empty($parts['query'])) $request_uri .= "?".$parts['query'];
		$port = $parts['port'] ? ':'.$parts['port'] : '';
		$url = $parts['scheme']."://".$ip.$port.$request_uri;

		if (empty($parts['path'])) $parts['path'] = '/';
		$headers[] = "POST " . $parts['path'] . " HTTP/1.1";
		$headers[] = "Host: ".$host;
		$headers[] = "Content-Type: application/x-www-form-urlencoded";
		$headers[] = "Content-Length: " . strlen($post_string) . "";
		if ($user_agent !== false) {
			if (is_null($user_agent)) {
				$user_agent = 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.9) Gecko/20071025 Firefox/2.0.0.9';
			}
			$headers[] ="User-Agent: $user_agent";
		}
		$out = implode("\r\n", $headers);
		$out .= "\r\nConnection: Close\r\n\r\n";
		if (isset($post_string))
			$out .= $post_string;

		$fp = @fsockopen($ip, isset($parts['port']) ? $parts['port'] : 80, $errno, $errstr, $timeout);
		if (!$fp) {
			if ($throwIfRefused) {
				$app = Q_Config::expect('Q', 'app');
				throw new Q_Exception("PHP couldn't open a socket to " . $url . " (" . $errstr . ") Go to scripts/$app and run node $app.js");
			}
			return false;
		}
		$result = (fwrite($fp, $out) !== false);
		$result = $result && fflush($fp);
		$result = $result && fclose($fp);
		return $result;
	}

	/**
	 * Issues a POST request, and returns the response
	 * @method post
	 * @static
	 * @param {string|array} $url The URL to post to
	 *  This can also be an array of ($url, $ip) to send the request
	 *  to a particular IP, while retaining the hostname and request URI
	 * @param {array|string} $data The data content to post or an array of ($field => $value) pairs
	 * @param {string} [$user_agent=null] The user-agent string to send. Defaults to Mozilla.
	 * @param {string} [$follow_redirects=true] Whether to follow redirects when getting a response.
	 * @param {string} [$header=null] Optional string to replace the entire POST header
	 * @return {string} The response.
	 * 
	 * **NOTE:** *The function waits for it, which might take a while!*
	 */
	static function post ($url, $data, $user_agent = null, $follow_redirects = true, $header = null, $conn_t = 120, $res_t = 120)
	{
		return Q_Utils::request('POST', $url, $data, $user_agent, $follow_redirects, $header, $conn_t, $res_t);
	}

	/**
	 * Issues a GET request, and returns the response
	 * @method get
	 * @static
	 * @param {string|array} $url The URL to post to
	 *  This can also be an array of ($url, $ip) to send the request
	 *  to a particular IP, while retaining the hostname and request URI
	 * @param {string} [$user_agent=null] The user-agent string to send. Defaults to Mozilla.
	 * @param {string} [$follow_redirects=true] Whether to follow redirects when getting a response.
	 * @param {string} [$header=null] Optional string to replace the entire GET header
	 * @return {string} The response.
	 * 
	 * **NOTE:** *The function waits for it, which might take a while!*
	 */
	static function get ($url, $user_agent = null, $follow_redirects = true, $header = null)
	{
		return Q_Utils::request('GET', $url, null, $user_agent, $follow_redirects, $header);
	}

	/**
	 * Issues an http request, and returns the response
	 * @method request
	 * @static
	 * @private
	 * @param {string} $method The http method to use
	 * @param {string|array} $url The URL to request
	 *  This can also be an array of ($url, $ip) to send the request
	 *  to a particular IP, while retaining the hostname and request URI
	 * @param {array|string} $data The data content to post or an array of ($field => $value) pairs
	 * @param {string} [$user_agent=null] The user-agent string to send. Defaults to Mozilla.
	 * @param {string} [$follow_redirects=true] Whether to follow redirects when getting a response.
	 * @param {string} [$header=null] Optional string to replace the entire header
	 * @return {string} The response.
	 * 
	 * **NOTE:** *The function waits for it, which might take a while!*
	 */
	private static function request($method, $uri, $data, $user_agent = null, $follow_redirects = true, $header = null, $conn_t = 120, $res_t = 120)
	{
		$method = strtoupper($method);
		if (!isset($user_agent))
			$user_agent = 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.9) Gecko/20071025 Firefox/2.0.0.9';

		$ip = null;
		if (is_array($uri)) {
			$url = $uri[0];
			if (isset($uri[1])) $ip = $uri[1];
		} else $url = $uri;
		$parts = parse_url($url);		
		$host = $parts['host'];
		if (!isset($ip)) $ip = $host;
		$request_uri = $parts['path'];
//		if (!empty($parts['query'])) $request_uri .= "?".$parts['query'];
		$port = isset($parts['port']) ? ':'.$parts['port'] : '';
		$url = $parts['scheme']."://".$ip.$port.$request_uri;

		// NOTE: this works for http(s) only
		$headers = array("Host: ".$host);

		if (is_array($data)) {
			$data = http_build_query($data, null, '&');
		}
		if (!is_string($data)) {
			$data = '';
		}

		if (function_exists('curl_init')) {
			// Use CURL if installed...
			$ch = curl_init();
			curl_setopt_array($ch, array(
				CURLOPT_USERAGENT => $user_agent,

				CURLOPT_RETURNTRANSFER => true,	 // return web page
				CURLOPT_HEADER		 => false,	// don't return headers
				CURLOPT_FOLLOWLOCATION => true,	 // follow redirects
				CURLOPT_ENCODING	   => "",	   // handle all encodings
				CURLOPT_AUTOREFERER	=> true,	 // set referer on redirect
				CURLOPT_CONNECTTIMEOUT => $conn_t,	  // timeout on connect
				CURLOPT_TIMEOUT		=> $res_t,	  // timeout on response
				CURLOPT_MAXREDIRS	  => 10,	   // stop after 10 redirects
			));
			switch ($method) {
				case 'POST':
					curl_setopt_array($ch, array(
						CURLOPT_URL => $url,
						CURLOPT_POSTFIELDS => $data,
						CURLOPT_POST => true
					));
					break;
				case 'GET':
					// default method for cURL
					curl_setopt($ch, CURLOPT_URL, "$url?$data");
					break;
				case 'PUT':
					// not supported
				case 'DELETE':
					// not supported
				default:
					throw new Q_Exception("Unknown request method '$method'");
			}
			if (!empty($headers)) {
				curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
			}
			$result = curl_exec($ch);
			curl_close($ch);
		} else {
			// Non-CURL based version...
			if (!isset($header)) {
				if ($with_data) $headers[] = "Content-type: application/x-www-form-urlencoded";
				$headers[] = "User-Agent: $user_agent";
				if ($with_data) $headers[] = "Content-length: " . strlen($data);
				$header = implode("\r\n", $headers);
			}
			$context = stream_context_create(array(
				'http' => array(
					'method' => $method,
					'header' => $header,
					'content' => $data,
					'max_redirects' => 10,
					'timeout'	   => $res_t
			)));
			$sock = fopen($url, 'rb', false, $context);
			if ($sock) {
				$result = '';
				while (! feof($sock))
					$result .= fgets($sock, 4096);
				fclose($sock);
			}
		}
		return $result;
	}

	/**
	 * Queries a server externally to the specified handler. Expects json array with 
	 * either ['slots']['data'] or ['error'] fields filled
	 * @method queryExternal
	 * @static
	 * @param {string} $handler the handler to call
	 * @param {array} [$data=array()] Associative array of data of the message to send.
	 * @param {string|array} [$url=null] and url to query. Default to 'Q/web/appRootUrl' config value
	 * @return {mixed} The response from the server
	 */
	static function queryExternal($handler, $data = array(), $url = null)
	{
		if (!is_array($data)) {
			throw new Q_Exception_WrongType(array('field' => 'data', 'type' => 'array'));
		}
		$data['Q.ajax'] = 'json';
		$data['Q.slotNames'] = 'data';

		if ((!isset($url)) && !($url = Q_Config::get('Q', 'web', 'appRootUrl', false)))
			throw new Q_Exception("Root URL is not defined in Q_Utils::queryExternal");

		if (is_array($url)) {
			$server = array();
			$server[] = "{$url[0]}/action.php/$handler";
			if (isset($url[1])) $server[] = $url[1];
		} else {
			$server = "$url/action.php/$handler";
		}

		$result = json_decode(self::post($server, self::sign($data)), null, true, null, Q_UTILS_CONNECTION_TIMEOUT, Q_UTILS_CONNECTION_TIMEOUT, true);
		
		// TODO: check signature of returned data

		if (isset($result['errors'])) {
			throw new Q_Exception($result['errors']);
		}
		return isset($result['slots']['data']) ? $result['slots']['data'] : null;
	}

	/**
	 * Sends a query to Node.js internal server and gets the response
	 * This method shall make communications behind firewal
	 * @method queryInternal
	 * @static
	 * @param {string} $handler is used as 'Q/method' while querying $url 
	 * @param {array} [$data=array()] Associative array of data of the message to send.
	 * @param {string|array} [$url=null] and url to query. Default to 'Q/nodeInternal' config value and path '/Q_Utils/query'
	 * @return {mixed} The response from the server
	 */
	static function queryInternal($handler, $data = array(), $url = null)
	{
		if (!is_array($data)) {
			throw new Q_Exception_WrongType(array('field' => 'data', 'type' => 'array'));
		}

		if (!isset($url)) {
			$nodeh = Q_Config::get('Q', 'nodeInternal', 'host', null);
			$nodep = Q_Config::get('Q', 'nodeInternal', 'port', null);
			$url = $nodep && $nodeh ? "http://$nodeh:$nodep" : false;
		}

		if (!$url) {
			throw new Q_Exception("Q_Utils::queryInternal: the nodeInternal config is missing");
		}
		
		if (is_array($url)) {
			$server = array();
			$server[] = "{$url[0]}/$handler";
			if (isset($url[1])) $server[] = $url[1];
		} else {
			$server = "$url/$handler";
		}

		$result = json_decode(self::post(
			$server, self::sign($data), null, true, null, 
			Q_UTILS_INTERNAL_TIMEOUT, Q_UTILS_INTERNAL_TIMEOUT
		), true);

		// TODO: check signature of returned data

		// delete the above line to throw on error
		if (isset($result['errors'])) {
			throw new Q_Exception(reset($result['errors']));
		}
		return isset($result['data']) ? $result['data'] : null;
	}
	
	/**
	 * Sends asynchronous internal message to Node.js
	 *  If "Q.clientId" is in $_REQUEST, adds it into the data
	 * @method sendToNode
	 * @static
	 * @param {array} $data Associative array of data of the message to send.
	 *  It should contain the key "Q/method" so Node can decide what to do with the message.
	 * @param {string|array} [$url=null] and url to query. Default to 'Q/nodeInternal' config value and path '/Q/node'
	 * @param {boolean} [$throwIfRefused=false] Pass true here to throw an exception whenever Node process is not running or refuses the request
	 */
	static function sendToNode($data, $url = null, $throwIfRefused = false)
	{
		if (!is_array($data)) {
			throw new Q_Exception_WrongType(array('field' => 'data', 'type' => 'array'));
		}
		if (empty($data['Q/method'])) {
			throw new Q_Exception_RequiredField(array('field' => 'Q/method'));
		}
		
		$clientId = Q_Request::special('clientId', null);
		if (isset($clientId)) {
			$data['Q.clientId'] = $clientId;
		}
		
		// The following hook may modify the url
		/**
		 * @event Q/Utils/sendToNode {before}
		 * @param {array} data
		 * @param {string|array} 'url'
		 */
		Q::event('Q/Utils/sendToNode', array('data' => $data, 'url' => $url), 'before');

		if (!$url) {
			$nodeh = Q_Config::get('Q', 'nodeInternal', 'host', null);
			$nodep = Q_Config::get('Q', 'nodeInternal', 'port', null);
			$url = $nodep && $nodeh ? "http://$nodeh:$nodep/Q/node" : false;
		}

		if (!$url) {
			$result = false;
		} else {
			// Should we switch to sending JSON over TCP?
			$result = Q_Utils::postAsync(
				$url, self::sign($data), null, 
				Q_UTILS_INTERNAL_TIMEOUT, $throwIfRefused
			);
		}
		return $result;
//		if (!$result) {
//			throw new Q_Exception_SendingToNode(array('method' => $data['Q/method']));
//		}
	}
	
	/**
	 * Unserializes session stored in PHP 5.2 and 5.3 format
	 * @method unserializeSession
	 * @static
	 * @param {string} $val
	 * @return {array}
	 */
	static function unserializeSession($val)
	{
		$result = array();

		// prefixing with semicolon to make it easier to write the regular expression
		$val = ';' . $val;

		// regularexpression to find the keys
		$keyreg = '/;([^|{}"]+)\|/';

		// find all keys
		$matches = array();
		preg_match_all($keyreg, $val, $matches);

		// only go further if we found some keys
		if (isset($matches[1])) {
			$keys = $matches[1];

			// find the values by splitting the input on the key regular expression
			$values = preg_split($keyreg, $val);

			// unshift the first value since it's always empty (due to our semicolon prefix)
			if (count($values) > 1) {
				array_shift($values);
			}

			// combine the $keys and $values
			$result = array_combine($keys, $values);
		}

		return $result;
	}

	/**
	 * Returns base url for socket.io connection
	 * @method nodeUrl
	 * @static
	 * @throws {Q_Exception_MissingConfig} If node host or port are not defined
	 */
	static function nodeUrl () {
		$url = Q_Config::get('Q', 'node', 'url', null);
		if (isset($url)) {
			return Q::interpolate($url, array(
				'baseUrl' => Q_Request::baseUrl()
			));
		}
		$host = Q_Config::get('Q', 'node', 'host', null);
		$port = Q_Config::get('Q', 'node', 'port', null);
		if (!isset($port) || !isset($host)) return null;
		return "http://$host:$port";
	}

	/**
	 * Copies a file or directory from path to another. May overwrite existing files.
	 * @method copy
	 * @static
	 * @param {string} $source
	 * @param {string} $dest
	 * @throws {Q_Exception_MissingConfig} If node host or port are not defined
	 */
	static function copy($source, $dest) {
		
		if (file_exists($dest) and (is_dir($source) xor is_dir($dest))) {
			throw new Q_Exception("Q_Utils::copy doesn't work if one parameter is a file and one is a directory");
		}

		$dir = opendir($source);
		@mkdir($dest);
		while (false !== ( $file = readdir($dir)) ) {
			if (($file != '.') && ($file != '..')) {
				if ( is_dir($source.DS.$file) ) {
					self::copy($source.DS.$file, $dest.DS.$file);
				} else {
					copy($source . DS . $file,$dest.DS.$file);
				}
			}
		}
		closedir($dir);
		
	}

	/**
	 * Checks whether the path can be used for writing files by the current session
	 * @method canWriteToPath
	 * @static
	 * @param {string} $path The path to check
	 * @param {mixed} [$throwIfNotWritable=false] Defaults to false.
	 * Set to true to throw a Q_Exception_NotWriteablePath if no user is logged in.
	 * Set to null to skip firing the "before" event, thereby skipping custom access checks.
	 * The null value is useful for when the filename is generated by the app, not the user.
	 * @param {boolean} [$mkdirIfMissing] Defaults to false.
	 * Pass true here to make a directory at the specified path, if it's writeable but missing.
	 * Pass a string here to override the umask before making the directory.
	 * @return {Users_User}
	 */
	static function canWriteToPath(
		$path, 
		$throwIfNotWritable = false, 
		$mkdirIfMissing = false
	) {
		if (isset($throwIfNotWritable)) {
			$result = Q::event(
				"Q/Utils/canWriteToPath",
				compact('path', 'throwIfNotWritable', 'mkdirIfMissing'),
				'before'
			);
			if (isset($result)) {
				return $result;
			}
		}
		$paths = array(APP_FILES_DIR);
		foreach (Q_Config::get('Q', 'plugins', array()) as $plugin) {
			$c = strtoupper($plugin).'_PLUGIN_FILES_DIR';
			if (defined($c)) {
				$paths[] = constant($c);
			}
		}
		$paths[] = Q_FILES_DIR;
		if (strpos($path, "../") === false
		and strpos($path, "..".DS) === false) {
			foreach ($paths as $p) {
				$len = strlen($p);
				if (strncmp($path, $p, $len) === 0) {
					// we can write to this path
					if ($mkdirIfMissing and !file_exists($path)) {
						$mask = is_string($mkdirIfMissing)
							? umask($mkdirIfMissing)
							: umask(0000);
						if (!@mkdir($path, 0777, true)) {
							throw new Q_Exception_FilePermissions(array(
								'action' => 'create',
								'filename' => $path,
								'recommendation' => ' Please set your files directory to be writable.'
							));
						}
						umask($mask);
					}
					return true;
				}
			}
		}
		if ($throwIfNotWritable) {
			throw new Q_Exception_CantWriteToPath();
		}
		return false;
	}
	
	static function colored($text, $foreground_color = null, $background_color = null)
	{
		if (!$foreground_color and !$background_color) {
			return $text;
		}
		static $foreground_colors = array(
			'black' => '0;30',
			'dark_gray' => '1;30',
			'blue' => '0;34',
			'light_blue' => '1;34',
			'green' => '0;32',
			'light_green' => '1;32',
			'cyan' => '0;36',
			'light_cyan' => '1;36',
			'red' => '0;31',
			'light_red' => '1;31',
			'purple' => '0;35',
			'light_purple' => '1;35',
			'brown' => '0;33',
			'yellow' => '1;33',
			'light_gray' => '0;37',
			'white' => '1;37'
		);
		static $background_colors = array(
			'black' => '40',
			'red' => '41',
			'green' => '42',
			'yellow' => '43',
			'blue' => '44',
			'magenta' => '45',
			'cyan' => '46',
			'light_gray' => '47'
		);
		$colored_string = "";
		if (isset($foreground_colors[$foreground_color])) {
			$colored_string .= "\033[" . $foreground_colors[$foreground_color] . "m";
		}
		if (isset($background_colors[$background_color])) {
			$colored_string .= "\033[" . $background_colors[$background_color] . "m";
		}
		return $colored_string .  $text . "\033[0m";
	}
	
	static function cp ($src, $dest)
	{
		if (is_file($src)) {
			return copy($src, $dest);
		}
		if (!is_dir($src)) {
			return false;
		}
		@mkdir($dest);
		foreach(scandir($src) as $file) {
			if( $file == "." || $file == ".." ) {
				continue;
			}
			if( is_dir( $src.DS.$file ) ) {
				self::cp( $src.DS.$file, $dest.DS.$file );
			} else {
				copy( $src.DS.$file, $dest.DS.$file );
			}
		}
		return true;
	}
	
	/**
	 * Create a symlink
	 * @method symlink
	 * @static
	 * @param {string} $target
	 * @param {string} $link
	 * @throws Q_Exception if link could not be created
	 */
	static function symlink($target, $link)
	{
		// Make sure destination directory exists
		if(!file_exists(dirname($link))) {
			$mask = umask(Q_Config::get('Q', 'internal', 'umask', 0000));
			mkdir(dirname($link), 0777, true);
			umask($mask);
		}

		$is_win = (substr(strtolower(PHP_OS), 0, 3) === 'win');

		if(is_dir($link) && !$is_win && !is_link($link)) {
			echo Q_Utils::colored(
				"[WARN] Symlink '$link' (target: '$target') was not created".PHP_EOL, 
				'red', 'yellow'
			);
			return;
		}

		if (file_exists($target)) {
			if ($is_win && is_dir($link)) {
				rmdir($link);
			} else if (is_link($link)) {
				unlink($link);
			}
		}

		if($is_win) {
			exec('mklink /j "' . $link . '" "' . $target . '"');
		} else {
			@symlink($target, $link);
		}
		
		if(!file_exists($link)) {
			throw new Q_Exception("Link $link to target $target' was not created");
		}
	}
	
	/**
	 * Used to split ids into one or more segments, in order to store millions
	 * of files under a directory, without running into limits of various filesystems
	 * on the number of files in a directory.
	 * Consider using Amazon S3 or another service for uploading files in production.
	 * @method splitId
	 * @static
	 * @param {string} $id the id to split
	 * @param {integer} [$lengths=3] the lengths of each segment (the last one can be smaller)
	 * @param {string} [$delimiter=DIRECTORY_SEPARATOR] the delimiter to put between segments
	 * @return {string} the segments, delimited by the delimiter
	 */
	static function splitId($id, $lengths = 3, $delimiter = DIRECTORY_SEPARATOR)
	{
		return implode($delimiter, str_split($id, $lengths));
	}
	
	protected static $urand;
}
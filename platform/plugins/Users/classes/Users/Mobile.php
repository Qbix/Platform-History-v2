<?php

/**
 * @module Users
 */
/**
 * Class representing 'Mobile' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a mobile row in the Users database.
 *
 * @class Users_Mobile
 * @extends Base_Users_Mobile
 */
class Users_Mobile extends Base_Users_Mobile
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
	}
	/**
	 * @method sendMessage
	 * @param {string} $view
	 *  The name of a view for the message. Fields are passed to this array.
	 * @param {array} $fields=array()
	 *  The fields referenced in the subject and/or view
	 * @param {array} [$options=array()]
	 * @param {string} [$options.delay] A delay, in milliseconds, to wait until sending email. Only works if Node server is listening.
	 * @param {string} [$options.language] Preferred language
	 * @return {boolean}
	 * @throws {Q_Exception_WrongType}
	 *	If phone number is invalid
	 */
	function sendMessage(
		$view,
		$fields = array(),
		$options = array())
	{
		if (!Q_Valid::phone($this->number, $number)) {
			throw new Q_Exception_WrongType(array(
				'field' => '$this->number',
				'type' => 'mobile number',
				'mobileNumber' => $this->number
			));
		}

		// set language if didn't defined yet
		if (!isset($options['language'])) {
			$options['language'] = isset($this->userId) ? Users::getLanguage($this->userId) : null;
		}

		$app = Q::app();
		$body = Q::view($view, $fields, array('language' => $options['language']));
		
		/**
		 * @event Users/mobile/sendMessage {before}
		 * @param {string} view
		 * @param {array} fields
		 * @param {array} options
		 * @return {boolean}
		 */
		$result = Q::event('Users/mobile/sendMessage', @compact('view', 'body', 'fields', 'options'), 'before');
		if (isset($result)) {
			return $result;
		}

		$sent = false;
		if (!empty($options['delay'])) {
			// Try to use Node.js to send the message
			$sent = Q_Utils::sendToNode(array(
				"Q/method" => "Users/sendMessage",
				"delay" => $options['delay'],
				"mobileNumber" => $number,
				"body" => $body,
				"options" => $options
			));
		}
		
		if (!$sent) {
			$from = Q::ifset($options, 'from', Q_Config::get('Users', 'mobile', 'from', null));
			if (!isset($from)) {
				// deduce from base url
				$url_parts = parse_url(Q_Request::baseUrl());
				$domain = $url_parts['host'];
				$from = array("notifications@$domain", $domain);
			}

			$sid = Q_Config::get('Users', 'mobile', 'twilio', 'sid', null);
			$token = Q_Config::get('Users', 'mobile', 'twilio', 'token', null);

			if ($sid and $token) {
				$client = new Twilio\Rest\Client($sid, $token);
				/**
				 * @event Users/mobile/sendMessage/twilio {before}
				 * @param {string} view
				 * @param {array} fields
				 * @param {array} options
				 * @param {Services_Twilio} client You can call methods on this before sending sms
				 * @return {boolean}
				 */
				$result = Q::event('Users/mobile/sendMessage/twilio', @compact('view', 'body', 'fields', 'options', 'client'), 'before');
				if (isset($result)) {
					return $result;
				}
				$message = $client->messages->create(
					$number, // Text this number
					compact('body', 'from') // a valid Twilio number
				);
			} else {
				if(!Q_Config::get('Users', 'email', 'smtp', null)){
					Q_Response::setNotice("Q/mobile", "Please set up transport in Users/mobile/twilio as in docs", false);
					if ($key = Q_Config::get('Users', 'mobile', 'log', 'key', 'mobile')) {
						$logMessage = "Would have sent message to $number:\n$body";
						Q::log($logMessage, $key);
					}
					return true;
				}

				$from = Q::ifset($options, 'from', Q_Config::get('Users', 'email', 'from', null));
				if (!isset($from)) {
					// deduce from base url
					$url_parts = parse_url(Q_Request::baseUrl());
					$domain = $url_parts['host'];
					$from = array("notifications@$domain", $domain);
				}

				// Set up the default mail transport
				$smtp = Q_Config::get('Users', 'email', 'smtp', array('host' => 'sendmail'));
				$host = Q::ifset($smtp, 'host', null);
				if ($host === 'sendmail') {
					$transport = new Zend_Mail_Transport_Sendmail('-f'.reset($from));
				} else {
					if (is_array($smtp)) {
						$host = $smtp['host'];
						unset($smtp['host']);
					} else if (is_string($smtp)) {
						$host = $smtp;
						$smtp = array();
					}
					if (isset($host)) {
						$transport = new Zend_Mail_Transport_Smtp($host, $smtp);
					} else {
						$transport = null;
					}
				}
				
				if ($key = Q_Config::get('Users', 'mobile', 'log', 'key', 'mobile')) {
					$logMessage = "Sent message to $number:\n$body";
					if (!isset($transport)) {
						Q_Response::setNotice("Q/mobile", "Please set up Twilio in Users/mobile/twilio as in docs.", false);
						$logMessage = "Would have $logMessage";
					}
					Q::log($logMessage, $key);
				}

				if ($transport) {
					$email = new Zend_Mail();
					$email->setFrom(reset($from), next($from));
					$gateways = Q_Config::get('Users', 'mobile', 'gateways', array(
						'at&t' => 'txt.att.net',
						'sprint' => 'messaging.sprintpcs.com',
						'verizon' => 'vtext.com',
						't-mobile' => 'tmomail.net'
					));
					$number2 = substr($this->number, 2);
					foreach ($gateways as $k => $v) {
						$email->addTo($number2.'@'.$v);
					}
					$email->setBodyText($body);
					try {
						/**
						 * @event Users/mobile/sendMessage/gateway {before}
						 * @param {string} view
						 * @param {array} fields
						 * @param {array} options
						 * @param {Zend_Mail} email You can call methods on this before sending sms
						 * @return {boolean}
						 */
						$result = Q::event('Users/mobile/sendMessage/gateway', @compact('view', 'body', 'fields', 'options', 'email'), 'before');
						if (isset($result)) {
							return $result;
						}
						$email->send($transport);
					} catch (Exception $e) {
						throw new Users_Exception_MobileMessage(array('error' => $e->getMessage()));
					}	
				}
			}
		}
		
		/**
		 * @event Users/mobile/sendMessage {after}
		 * @param {string} view
		 * @param {array} fields
		 * @param {array} options
		 * @param {string} mail
		 */
		Q::event(
			'Users/mobile/sendMessage', 
			@compact('view', 'fields', 'options', 'mail', 'app', 'message', 'mail'),
			'after'
		);
		return true;
	}
	
	function resendActivationMessage(
		$view = null,
		$fields = array(),
		$options = array())
	{
		if (!isset($view)) {
			$view = Q_Config::get('Users', 'transactional', 'resend', 'sms', Q_Config::get(
				'Users', 'transactional', 'resend', 'sms', 'Users/sms/activation.php'
			));
		}
		$user = $this->get('user', null);
		if (!$user) {
			$user = new Users_User();
			$user->id = $this->userId;
			if (!$user->retrieve()) {
				throw new Q_Exception_NotVerified(array(
					'type' => 'mobile number'
				), 'mobileNumber');
			}
		}
		$minutes = Q_Config::get('Users', 'activation', 'expires', 60*24*7);
		$this->activationCode = strtolower(Q_Utils::randomString(7));
		$this->activationCodeExpires = new Db_Expression(
			"CURRENT_TIMESTAMP + INTERVAL $minutes MINUTE"
		);
		$this->authCode = sha1(microtime() . mt_rand());
		$number = $this->number;
		if (substr($number, 0, 2) == '+1') {
			$number = substr($number, 2);
		}
		$link = Q_Uri::url('Users/activate?p=1&code='.urlencode($this->activationCode)
			. ' mobileNumber='.urlencode($number));
		Users::$cache['Users/activate link'] = $link;
		$unsubscribe = Q_Uri::url('Users/unsubscribe?mobileNumber='.urlencode($number));
		$communityName = Users::communityName();
		$communitySuffix = Users::communitySuffix();
		$mobile = $this;
		/**
		 * @event Users/resend {before}
		 * @param {Users_User} user
		 * @param {Users_Mobile} mobile
		 */
		Q::event('Users/resend', @compact('user', 'mobile', 'link', 'unsubscribe'), 'before');
		$this->save();
		$baseUrl = Q_Request::baseUrl();
		$fields2 = array_merge($fields, array(
			'user' => $user,
			'mobile' => $this,
			'app' => Q::app(),
			'communityName' => $communityName,
			'communitySuffix' => $communitySuffix,
			'baseUrl' => Q_Request::baseUrl(),
			'link' => $link,
			'code' => $this->activationCode,
			'domain' => parse_url($baseUrl, PHP_URL_HOST),
			'unsubscribe' => $unsubscribe
		));
		$this->sendMessage( 
			$view, 
			$fields2,
			$options
		); // may throw exception if badly configured
		/**
		 * @event Users/resend {after}
		 * @param {string} user
		 * @param {string} mobile
		 */
		Q::event('Users/resend', @compact('user', 'mobile', 'communityName'), 'after');
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Mobile} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Mobile();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};
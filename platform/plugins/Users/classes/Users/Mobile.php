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
	 * @param {array} $options=array()
	 *  Array of options. Can include:<br/>
	 *  "delay" => A delay, in milliseconds, to wait until sending email. Only works if Node server is listening.
	 * @return {boolean}
	 * @throws {Q_Exception_WrongType}
	 *	If phone number is invalid
	 */
	function sendMessage(
		$view,
		$fields = array(),
		$options = array())
	{
		/**
		 * @event Users/sms/sendMessage {before}
		 * @param {string} view
		 * @param {array} fields
		 * @param {array} options
		 * @return {boolean}
		 */
		$result = Q::event('Users/sms/sendMessage', compact('view', 'fields', 'options'), 'before');
		if (isset($result)) {
			return $result;
		}
		if (!Q_Valid::phone($this->number, $number)) {
			throw new Q_Exception_WrongType(array(
				'field' => '$this->number',
				'type' => 'mobile number',
				'mobileNumber' => $this->number
			));
		}
		
		$app = Q_Config::expect('Q', 'app');
		$body = Q::view($view, $fields);

		$overrideLog = Q::event(
			'Users/mobile/log', 
			compact('mobileNumber', 'body'), 
			'before'
		);
		if(is_null($overrideLog)
		and $key = Q_Config::get('Users', 'mobile', 'log', 'key', null)) {
			Q::log("\nSent mobile message to {$this->number}:\n$body", $key);
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
					$client = new Services_Twilio($sid, $token);
					$message = $client->account->sms_messages->create(
						$from, // From a valid Twilio number
						$number, // Text this number
						Q::view($view, $fields)
					);

			} else {
				if(!Q_Config::get('Users', 'email', 'smtp', null)){
					Q_Response::setNotice("Q/mobile", "Please set up transport in Users/mobile/twilio as in docs", false);
					return true;
				}
				
				if (!is_array($from)) {
					$from = array($from, "$app activation");
				}

				// Set up the default mail transport
				$host = Q_Config::get('Users', 'email', 'smtp', 'host', 'sendmail');
				if ($host === 'sendmail') {
					$transport = new Zend_Mail_Transport_Sendmail('-f'.reset($from));
				} else {
					if (is_array($host)) {
						$smtp = $host;
						$host = $smtp['host'];
						unset($smtp['host']);
					} else {
						$smtp = null;
					}
					$transport = new Zend_Mail_Transport_Smtp($host, $smtp);
				}

				$mail = new Zend_Mail();
				$from_name = reset($from);
				$mail->setFrom(next($from), $from_name);
				$gateways = Q_Config::get('Users', 'mobile', 'gateways', array(
					'at&t' => 'txt.att.net',
					'sprint' => 'messaging.sprintpcs.com',
					'verizon' => 'vtext.com',
					't-mobile' => 'tmomail.net'
				));
				$number2 = substr($this->number, 2);
				foreach ($gateways as $k => $v) {
					$mail->addTo($number2.'@'.$v);
				}
				$mail->setBodyText($body);
				try {
					$mail->send($transport);
				} catch (Exception $e) {
					throw new Users_Exception_MobileMessage(array('error' => $e->getMessage()));
				}	
			}
		}
		
		/**
		 * @event Users/sms/sendMessage {after}
		 * @param {string} view
		 * @param {array} fields
		 * @param {array} options
		 * @param {string} mail
		 */
		Q::event(
			'Users/email/sendMessage', 
			compact('view', 'fields', 'options', 'mail', 'app'),
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
		$this->activationCode = strtolower(Q_Utils::unique(7));
		$this->activationCodeExpires = new Db_Expression(
			"CURRENT_TIMESTAMP + INTERVAL $minutes MINUTE"
		);
		$this->authCode = md5(microtime() + mt_rand());
		$number = $this->number;
		if (substr($number, 0, 2) == '+1') {
			$number = substr($number, 2);
		}
		$link = 'Users/activate?p=1&code='.urlencode($this->activationCode)
			. ' mobileNumber='.urlencode($number);
		$unsubscribe = 'Users/unsubscribe?mobileNumber='.urlencode($number);
		$communityName = Users::communityName();
		$communitySuffix = Users::communitySuffix();
		/**
		 * @event Users/resend {before}
		 * @param {string} user
		 * @param {string} mobile
		 */
		Q::event('Users/resend', compact('user', 'mobile', 'link', 'unsubscribe'), 'before');
		$this->save();
		$fields2 = array_merge($fields, array(
			'user' => $user,
			'mobile' => $this,
			'app' => Q_Config::expect('Q', 'app'),
			'communityName' => $communityName,
			'communitySuffix' => $communitySuffix,
			'baseUrl' => Q_Request::baseUrl(),
			'link' => $link,
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
		Q::event('Users/resend', compact('user', 'mobile', 'communityName'), 'after');
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
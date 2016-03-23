<?php
/**
 * @module Users
 */
/**
 * Class representing 'Email' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a email row in the Users database.
 *
 * @class Users_Email
 * @extends Base_Users_Email
 */
class Users_Email extends Base_Users_Email
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
	 * Send e-mail message
	 * @method sendMessage
	 * @param {string} $subject
	 *  The subject. May contain variable references to members
	 *  of the $fields array.
	 * @param {string} $view
	 *  The name of a view for the body. Fields are passed to it.
	 * @param {array} $fields=array()
	 *  The fields referenced in the subject and/or view
	 * @param {array} [$options=array()] Array of options. Can include:
	 * @param {array} [$options.html] Defaults to false. Whether to send as HTML email.
	 * @param {array} [$options.name] A human-readable name in addition to the address to send to.
	 * @param {array} [$options.from] An array of (emailAddress, humanReadableName)
	 * @param {array} [$options.delay] A delay, in milliseconds, to wait until sending email. Only works if Node server is listening.
	 */
	function sendMessage(
		$subject,
		$view,
		$fields = array(),
		$options = array())
	{
		/**
		 * @event Users/email/sendMessage {before}
		 * @param {string} subject
		 * @param {string} view
		 * @param {array} fields
		 * @param {array} options
		 * @return {boolean}
		 */
		$result = Q::event(
			'Users/email/sendMessage', 
			compact('subject', 'view', 'fields', 'options'), 
			'before'
		);
		if (isset($result)) {
			return $result;
		}
		if (!Q_Valid::email($this->address, $emailAddress)) {
			throw new Q_Exception_WrongType(array(
				'field' => '$this->address',
				'type' => 'email address',
				'emailAddress' => $this->address
			));
		}
		
		$app = Q_Config::expect('Q', 'app');
		$subject = Q_Handlebars::renderSource($subject, $fields);
		$body = Q::view($view, $fields);
		
		if(!Q_Config::get('Users', 'email', 'smtp', 'sendmail')) {
			Q_Response::setNotice("Q/email", "Please set up SMTP in Users/email/smtp as in docs.", false);
			return true;
		}
		$overrideLog = Q::event(
			'Users/email/log', 
			compact('emailAddress', 'subject', 'body'),
			'before'
		);
		if(!isset($overrideLog)
		and $key = Q_Config::get('Users', 'email', 'log', 'key', null)) {
			Q::log("\nSent email message to $emailAddress:\n$subject\n$body", $key);
		}

		$from = Q::ifset($options, 'from', Q_Config::get('Users', 'email', 'from', null));
		if (!isset($from)) {
			// deduce from base url
			$url_parts = parse_url(Q_Request::baseUrl());
			$domain = $url_parts['host'];
			$from = array("email@$domain", $domain);
		}
		if (!is_array($from)) {
			throw new Q_Exception_WrongType(array(
				'field' => '$options["from"]',
				'type' => 'array'
			));
		}
		
		$sent = false;
		if (!empty($options['delay'])) {
			// Try to use Node.js to send the message
			$sent = Q_Utils::sendToNode(array(
				"Q/method" => "Users/sendMessage",
				"delay" => $options['delay'],
				"emailAddress" => $emailAddress,
				"subject" => $subject,
				"body" => $body,
				"options" => $options
			));
		}
		
		if (!$sent) {
			// Set up the default mail transport
			$smtp = Q_Config::get('Users', 'email', 'smtp', array('host' => 'sendmail'));
			$host = Q::ifset($smtp, 'host', 'sendmail');
			if ($host === 'sendmail') {
				$transport = new Zend_Mail_Transport_Sendmail('-f'.reset($from));
			} else {
				if (is_array($smtp)) {
					$host = $smtp['host'];
					unset($smtp['host']);
				} else if (is_string($smtp)) {
					$host = $smtp;
					$smtp = null;
				}
				$transport = new Zend_Mail_Transport_Smtp($host, $smtp);
			}

			$mail = new Zend_Mail();
			$mail->setFrom(reset($from), next($from));
			if (isset($options['name'])) {
				$mail->addTo($emailAddress, $options['name']);
			} else {
				$mail->addTo($emailAddress);
			}
			$mail->setSubject($subject);
			if (empty($options['html'])) {
				$mail->setBodyText($body);
			} else {
				$mail->setBodyHtml($body);
			}
			try {
				$mail->send($transport);
			} catch (Exception $e) {
				throw new Users_Exception_EmailMessage(array('error' => $e->getMessage()));
			}
		}
		
		/**
		 * @event Users/email/sendMessage {after}
		 * @param {string} subject
		 * @param {string} view
		 * @param {array} fields
		 * @param {array} options
		 * @param {string} mail
		 */
		Q::event(
			'Users/email/sendMessage', 
			compact('subject', 'view', 'fields', 'options', 'mail', 'app'),
			'after'
		);
		return true;
	}
	
	function resendActivationMessage(
		$subject = null,
		$view = null,
		$fields = array(),
		$options = array())
	{
		if (!isset($subject)) {
			$subject = Q_Config::get('Users', 'transactional', 'resend', 'subject', Q_Config::get(
				'Users', 'transactional', 'activation', 'subject', 'Did you forget your passphrase?'
			));
		}
		if (!isset($view)) {
			$view = Q_Config::get('Users', 'transactional', 'resend', 'body', Q_Config::get(
				'Users', 'transactional', 'activation', 'body', 'Users/email/activation.php'
			));
		}
		if (!isset($options['html'])) $options['html'] = true;
		$user = $this->get('user', null);
		if (!$user) {
			$user = new Users_User();
			$user->id = $this->userId;
			if (!$user->retrieve()) {
				throw new Q_Exception_NotVerified(array(
					'type' => 'email address'
				), 'emailAddress');
			}
		}
		$minutes = Q_Config::get('Users', 'activation', 'expires', 60*24*7);
		$this->activationCode = strtolower(Q_Utils::unique(7));
		$this->activationCodeExpires = new Db_Expression(
			"CURRENT_TIMESTAMP + INTERVAL $minutes MINUTE"
		);
		$this->authCode = md5(microtime() + mt_rand());
		$link = 'Users/activate?p=1&code='.urlencode($this->activationCode)
			. ' emailAddress='.urlencode($this->address);
		$unsubscribe = 'Users/unsubscribe?' . http_build_query(array(
			'authCode' =>  $this->authCode, 
			'emailAddress' => $this->address
		));
		$communityName = Users::communityName();
		$communitySuffix = Users::communitySuffix();
		/**
		 * @event Users/resend {before}
		 * @param {string} user
		 * @param {string} email
		 */
		Q::event('Users/resend', compact('user', 'email', 'link', 'unsubscribe'), 'before');
		$this->save();
		$email = $this;
		$fields2 = array_merge($fields, array(
			'user' => $user,
			'email' => $this,
			'app' => Q_Config::expect('Q', 'app'),
			'communityName' => $communityName,
			'communitySuffix' => $communitySuffix,
			'baseUrl' => Q_Request::baseUrl(),
			'link' => $link,
			'unsubscribe' => $unsubscribe
		));
		$this->sendMessage(
			$subject, 
			$view, 
			$fields2,
			$options
		); // may throw exception if badly configured
		/**
		 * @event Users/resend {after}
		 * @param {string} user
		 * @param {string} email
		 */
		Q::event('Users/resend', compact('user', 'email'), 'after');
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Email} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Email();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};

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
	 * @param {string|array} $subject
	 *  The subject. May contain variable references to members of the $fields array.
	 *  You can also pass an array($source, array($key1, ...)) to use Q_Text to obtain
	 *  the subject.
	 * @param {string} $view
	 *  The name of a view for the body. Fields are passed to it.
	 * @param {array} $fields=array()
	 *  The fields referenced in the subject and/or view
	 * @param {array} [$options=array()] Array of options. Can include:
	 * @param {array} [$options.name] A human-readable name in addition to the address to send to.
	 * @param {array} [$options.from] An array of (emailAddress, humanReadableName)
	 * @param {array} [$options.delay] A delay, in milliseconds, to wait until sending email. Only works if Node server is listening.
	 * @param {string} [$options.language] Preferred language to be used for the view
	 * @param {array} [$options.html="Q/layout/email.php"] Preferred view file to use for HTML layout. Pass true to send HTML without a layout. Pass false for no HTML.
	 * @param {array} [$options.title] Optionally set a different title for an HTML email, otherwise subject is used.
	 * @param {array} [$options.head] Optionally any other text to insert into the HTML head, such as <style> tags etc.
	 * @throws Q_Exception_WrongType
	 * @return {bool} True if success or throw exception
	 */
	function sendMessage(
		$subject, 
		$view,
		$fields = array(),
		$options = array())
	{
		if (!Q_Valid::email($this->address, $emailAddress)) {
			throw new Q_Exception_WrongType(array(
				'field' => '$this->address',
				'type' => 'email address',
				'emailAddress' => $this->address
			));
		}
		
		if (!isset($options['html'])) {
			$options['html'] = Q_Config::get('Q', 'views', $view, 'html', 'Q/layout/email.php');
		}

		// set language if didn't defined yet
		if (!isset($options['language'])) {
			$options['language'] = isset($this->userId) ? Users::getLanguage($this->userId) : null;
		}

		if (is_array($subject)) {
			$source = $subject[0];
			$keys = $subject[1];
			$texts = Q_Text::get($source, array('language' => $options['language']));
			$tree = new Q_Tree($texts);
			$keyPath = implode('/', $keys);
			$args = array_merge($keys, array("Missing $keyPath in $source"));
			$subject = call_user_func_array(array($tree, 'get'), $args);
		}
		
		$app = Q::app();
		$subject = Q_Handlebars::renderSource($subject, $fields);
		$prevValue = Q_Html::$environmentWithoutJavascript;
		Q_Html::$environmentWithoutJavascript = true;
		try {
			$body = Q::view($view, $fields, array('language' => $options['language']));
			Q_Html::$environmentWithoutJavascript = $prevValue;
		} catch (Exception $e) {
			Q_Html::$environmentWithoutJavascript = $prevValue;
			throw $e;
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
			@compact('view', 'fields', 'options', 'subject', 'body', 'from'), 
			'before'
		);
		if (isset($result)) {
			return $result;
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

			if ($transport) {
				$email = new Zend_Mail();
				$email->setFrom(reset($from), next($from));
				if (isset($options['name'])) {
					$email->addTo($emailAddress, $options['name']);
				} else {
					$email->addTo($emailAddress);
				}
				$email->setSubject($subject);
				if (empty($options['html'])) {
					$email->setBodyText($body);
				} else {
					if (is_string($options['html'])){
						$title = Q::interpolate(Q::ifset($options, 'title', $subject));
						$head = Q::ifset($options, 'head', Q_Config::get('Users', 'email', 'head', ''));
						$body = Q::view($options['html'], compact('body', 'title', 'head'));
					}
					$email->setBodyHtml($body);
				}
				/**
				 * @event Users/email/sendMessage/email {before}
				 * @param {string} subject
				 * @param {string} view
				 * @param {array} fields
				 * @param {array} options
				 * @param {Zend_Mail} email You can use this object's methods to add bcc and more.
				 * @return {boolean}
				 */
				$result = Q::event(
					'Users/email/sendMessage/email', 
					@compact('view', 'fields', 'options', 'subject', 'body', 'from', 'email'), 
					'before'
				);
				if (isset($result)) {
					return $result;
				}
				try {
					$email->send($transport);
				} catch (Exception $e) {
					throw new Users_Exception_EmailMessage(array('error' => $e->getMessage()));
				}
			}

			if ($key = Q_Config::get('Users', 'email', 'log', 'key', 'email')) {
				$logMessage = "Sent message to $emailAddress:\n$subject\n$body";
				if (!isset($transport)) {
					Q_Response::setNotice("Q/email", "Please set up SMTP in Users/email/smtp as in docs.", false);
					$logMessage = "Would have $logMessage";
				}
				Q::log($logMessage, $key);
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
			@compact('subject', 'view', 'fields', 'options', 'mail', 'app'),
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
				'Users', 'transactional', 'activation', 'subject', 
				'Did you forget your passphrase?'
			));
		}
		if (!isset($view)) {
			$view = Q_Config::get('Users', 'transactional', 'resend', 'body', Q_Config::get(
				'Users', 'transactional', 'activation', 'body', 'Users/email/activation.php'
			));
		}
		$user = $this->get('user', null);
		if (!$user) {
			$user = new Users_User();
			$user->id = $this->userId;
			if (!$user->retrieve()) {
				throw new Users_Exception_NotVerified(array(
					'type' => 'email address'
				), 'emailAddress');
			}
		}
		$minutes = Q_Config::get('Users', 'activation', 'expires', 60*24*7);
		$this->activationCode = strtolower(Q_Utils::randomString(7));
		$this->activationCodeExpires = new Db_Expression(
			"CURRENT_TIMESTAMP + INTERVAL $minutes MINUTE"
		);
		$this->authCode = sha1(microtime() . mt_rand());
		$link = Q_Uri::url('Users/activate?p=1&code='.urlencode($this->activationCode)
			. ' emailAddress='.urlencode($this->address));
		Users::$cache['Users/activate link'] = $link;
		$unsubscribe = Q_Uri::url('Users/unsubscribe?' . http_build_query(array(
			'authCode' =>  $this->authCode, 
			'emailAddress' => $this->address
		)));
		$communityName = Users::communityName();
		$communitySuffix = Users::communitySuffix();
		$email = $this;
		/**
		 * @event Users/resend {before}
		 * @param {Users_User} user
		 * @param {Users_Email} email
		 */
		Q::event('Users/resend', @compact('user', 'email', 'link', 'unsubscribe'), 'before');
		$this->save();
		$baseUrl = Q_Request::baseUrl();
		$fields2 = array_merge($fields, array(
			'user' => $user,
			'email' => $this,
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
		Q::event('Users/resend', @compact('user', 'email'), 'after');
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

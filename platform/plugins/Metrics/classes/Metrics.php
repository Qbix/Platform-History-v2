<?php
/**
 * Metrics model
 * @module Metrics
 * @main Metrics
 */
/**
 * Static methods for the Metrics models.
 * @class Metrics
 * @extends Base_Metrics
 */
abstract class Metrics extends Base_Metrics
{
	/*
	 * This is where you would place all the static methods for the models,
	 * the ones that don't strongly pertain to a particular row or table.
	 
	 * * * */
	/**
	 * @property $tables
	 * @static
	 */
	static $tables = array(
		'publisher' => 'publisher',
		'session' => 'session',
		'hostname_session' => 'hostname_session',
		'share' => 'share',
		'visit' => 'visit',
		'domain' => 'domain'
	);

	/**
	 * @property $results
	 * @static
	 */
	static $results = array(
		'too_soon' => 21
	);

	/**
	 * @property $defaults
	 * @static
	 */
	static $defaults = array(
		'min_wait' => 86400, // one day
		'session_name' => 'sessionId'
	);
	/**
	 * @property $publisher
	 * @static
	 */
	/**
	 * @property $domain
	 * @static
	 */
	/**
	 * @property $session
	 * @static
	 */
	/**
	 * @property $hostname_session
	 * @static
	 */
	/**
	 * @property $visit
	 * @static
	 */
	/**
	 * @property $share
	 * @static
	 */
	static $publisher, $domain, $session, $hostname_session, $visit, $share;
	/**
	 * @property $session_name
	 * @static
	 */
	static $session_name;
	/**
	 * @property $db
	 * @static
	 */
	static $db;
	/**
	 * @property $new_hostname_session
	 * @static
	 */
	static $new_hostname_session = false;
	/**
	 * @property $last_visit
	 * @static
	 */
	static $last_visit = false;

	/**
	 * @method respond
	 * @static
	 * @param {string} $json
	 */
	static function respond($json)
	{
		if(null !== Q_Request::special('callback', null)) {
			header('Content-Type: application/x-javascript');
			echo 'Metrics.callback(' . Q_Request::special('callback', null) . ", $json);";
		} else {
			echo $json;
		}
	}

	/**
	 * Handles a request that is sent by our javascript when the user
	 * visits a URL.
	 * @method handleRequest
	 * @static
	 */
	static function handleRequest()
	{
		try {
			$result = 'success';
			
			self::validateRequest();
			list(self::$domain, self::$publisher) = self::domainAndPublisherFromRequest();
			$min_wait = self::getFields(self::$publisher, 'min_wait');
			self::$last_visit = false;
			
			$sessionId = self::sessionIdFromRequest();
			if (empty($sessionId)) {
				// This is a new global session
				$new_session = true;
				$sessionId = self::newSession();
			} else {
				// This is an existing global session,
				// but we may have to make a new hostname session
				$new_session = false;
				self::$hostname_session = self::hostnameSessionFromId($sessionId);
				if (!self::$new_hostname_session) {
					// See when was the last time we visited this hostname
					self::$last_visit = self::getLastVisit($sessionId);
				}
			}

			if (!self::$last_visit) {
				// This is our first visit, so definitely insert it
				self::$visit = self::insertVisitFromRequest();
				$visit_id = self::$visit['id'];
			} else {
				// There has been a previous visit
				$elapsed_seconds = time() - self::$last_visit['insertedTime'];
				if ($elapsed_seconds >= $min_wait) {
					// Time to insert a new visit
					self::$visit = self::insertVisitFromRequest();
					$visit_id = self::$visit['id'];
				} else {
					// Okay, why did you contact us? It is not time to insert a new visit.
					$from_share_id = self::shareIdFromRequest();
					if ($from_share_id) {
						// Maybe because this user has followed a new share!
						if(self::dbSelect('visit', compact('from_share_id', 'sessionId'))) {
							// Nope, looks like they have already followed this share.
							$result = 'already_followed';
							$visit_id = self::$last_visit['id'];
							self::respond(Q::json_encode(compact('result', 'sessionId', 'visit_id', 'min_wait')));
							return;
						}
						// If we are here, that means we were contacted for a reason.
						// A new share was just followed by the user.
						// We are going to record the share information below.
						// For now, start a new visit, from this share.
						self::$visit = self::insertVisitFromRequest();
						$visit_id = self::$visit['id'];
					} else {
						// There is no reason for you to contact us until min_wait is up.
						$result = 'too_soon';
						// Here is your current visit id. Now wait min_wait seconds
						// unless you see #from_share_id
						$visit_id = self::$last_visit['id'];
						$min_wait = $min_wait - $elapsed_seconds;
						self::respond(Q::json_encode(compact('result', 'sessionId', 'visit_id', 'min_wait')));
						return;
					}
				}
			}
			
			if ($share_id = self::shareIdFromRequest()) {
				// This visit comes from someone sharing through our system
				if (self::$share = self::dbSelect('share', compact('share_id'))) {
					// Share already exists in the database
					if (self::$new_hostname_session) {
						self::dbIncrement(
							'share', 
							array('visit_count', 'session_count'),
							compact('share_id')
						);
					} else {
						self::dbIncrement(
							'share', 
							array('visit_count'),
							compact('share_id')
						);
					}
				} else if ($share_id) {
					// Share has not yet been recorded in the database
					self::$share = self::insertShareFromRequest();
					$id = self::$visit['id'];
					self::dbIncrement('visit', array('share_count'), compact('id'));
				}
				// Okay, you had a reason to contact us. We updated the share.
				self::respond(Q::json_encode(compact('result', 'sessionId', 'visit_id', 'min_wait')));
			} else {
				self::respond(Q::json_encode(compact('result', 'sessionId', 'visit_id', 'min_wait')));
			}
		} catch (Exception $e) {
			self::respond(Q::json_encode(array('errors' => array($e->getMessage()))));
		}
	}

	/**
	 * Validates the request sent by the javascript
	 * @method validateRequest
	 * @static
	 */
	static function validateRequest()
	{
		if (empty($_REQUEST['url'])) {
			self::respond(Q::json_encode(array('errors'=>'url is missing')));
			exit;
		}
	}
	
	/**
	 * A utility function used to get fields from arrays or database rows
	 * @method getFields
	 * @static
	 * @param {array} $row
	 * @param {string} $field_name
	 * @return {mixed}
	 */
	static function getFields($row, $field_name)
	{
		if (is_array($field_name)) {
			$result = array();
			foreach ($field_name as $fn) {
				$result[] = self::getFields($row, $fn);
			}
			return $result;
		}
		if ($row and array_key_exists($field_name, $row[$field_name])) {
			return $row[$field_name];
		} else {
			return isset(self::$defaults[$field_name]) ? self::$defaults[$field_name] : null;
		}
	}

	/**
	 * Returns the domain and publisher, if any have been set up,
	 * based on the request. 
	 * @method domainAndPublisherFromRequest
	 * @static
	 * @return {array}
	 */
	static function domainAndPublisherFromRequest()
	{
		static $domain, $publisher;
		if (isset($domain) or isset($publisher)) {
			return array($domain, $publisher);
		}
		$hostname = self::hostnameFromRequest();
		$status = 'verified';
		$row = self::dbSelect(
			'domain', 
			compact('hostname', 'status'), 
			'publisher', 
			'publisher.id = domain.publisherId'
		);
		if ($row) {
			$domain = self::getFields($row, array('hostname', 'publisherId', 'status'));
			$publisher = self::getFields($row, array('id', 'insertedTime', 'name', 'secret', 'session_name'));
		} else {
			$domain = $publisher = false;
		}
		return array($domain, $publisher);
	}
	
	/**
	 * Obtains the session id from the request, either from our
	 * native 3rd party cookie, or their 1st party cookie sent to us
	 * in the body of the request.
	 * @method sessionIdFromRequest
	 * @static
	 * @return {string}
	 */
	static function sessionIdFromRequest()
	{
		static $sessionId;
		if (isset($sessionId)) {
			return $sessionId;
		}
		
		self::$session_name = self::getFields(self::$publisher, 'session_name');		
		if (isset($_GET[self::$session_name])) {
			return $_GET[self::$session_name];
		}
		if (isset($_POST[self::$session_name])) {
			return $_POST[self::$session_name];
		}
		if (isset($_COOKIE[self::$session_name])) {
			return $_COOKIE[self::$session_name];
		}
		return null;
	}
	
	/**
	 * Gets the url field of the request.
	 * This is the URL being visited, without the stuff that our analytics
	 * appended to it for the share link.
	 * @method urlFromRequest
	 * @static
	 * @return {string}
	 */
	static function urlFromRequest()
	{
		static $url;
		if (isset($url)) {
			return $url;
		}
		$url = $_REQUEST['url'];
		return $url;
	}
	
	/**
	 * Gets the hostname from the URL field of the request.
	 * @method hostnameFromRequest
	 * @static
	 * @return {string}
	 */
	static function hostnameFromRequest()
	{
		static $hostname;
		if (isset($hostname)) {
			return $hostname;
		}
		$url_parts = parse_url(self::urlFromRequest());
		if (!isset($url_parts['host'])) {
			throw new Exception("url hostname can't be parsed");
		}
		$hostname = $url_parts['host'];
		return $hostname;
	}
	
	/**
	 * Gets the array of tags, if any, sent in the request
	 * @method tagsFromRequest
	 * @static
	 * @return {array}
	 */
	static function tagsFromRequest()
	{
		static $tags;
		if (isset($tags)) {
			return $tags;
		}
		$tags = array();
		if (empty($_REQUEST['tags'])) {
			return $tags;
		}
		$temp = $_REQUEST['tags'];
		sort($temp);
		$i = 0;
		foreach ($temp as $tag) {
			$tags[++$i] = $tag;
		}
		return $tags;
	}
	
	/**
	 * Computes the share id from the request
	 * This is used to find if the share has already been inserted
	 * @method shareIdFromRequest
	 * @static
	 * @return {string}
	 */
	static function shareIdFromRequest()
	{
		static $share_id;
		if (isset($share_id)) {
			return $share_id;
		}
		
		if (empty($_REQUEST['from_visit_id'])) {
			return null;
		}
		$url = $_REQUEST['url'];
		$visit_id = $_REQUEST['from_visit_id'];
		$share_id = $visit_id."\t".md5($url);
		if ($tags = self::tagsFromRequest()) {
			$share_id .= "\t".implode("\t", $tags);
		}
 		return $share_id;
	}
	
	/**
	 * Inserts a share that must have brought the user to this page.
	 * Often, shares are inserted only after the first visit from the share occurs.
	 * @method insertShareFromRequest
	 * @static
	 * @param {integer} $shared_time=0
	 * @return {array}
	 */
	static function insertShareFromRequest($shared_time = 0)
	{
		$share_id = self::shareIdFromRequest();
		if (!$share_id) {
			return false;
		}
		$share = array(
			'share_id' => $share_id,
			'url' => $_REQUEST['url'],
			'visit_id' => $_REQUEST['from_visit_id'],
			'visit_count' => 1,
			'session_count' => self::$new_hostname_session ? 1 : 0,
			'insertedTime' => time(),
			'shared_time' => $shared_time
		);
		if ($tags = self::tagsFromRequest()) {
			foreach ($tags as $i => $tag) {
				$share["tag$i"] = $tag;
			}
		}
		return self::dbInsert('share', $share);
	}

	/**
	 * Generates an ID that is guaranteed to be unique
	 * by the time this function returns.
	 * @method uniqueId
	 * @static
	 * @param {string} $table_name
	 *  This is the logical name of the table for which to generate the id
	 * @param  {string} $field_name
	 *  This is the name of the field to check for id clashes
	 * @return {string}
	 */
	static function uniqueId($table, $field)
	{
		$chars = 'abcdefghijklmnopqrstuvwxyz';
		$count = strlen($chars);
		do {
			$id = '';
			for ($i=0; $i<8; ++$i) {
				$id .= $chars[mt_rand(0, $count-1)];
			}
			$rows = self::dbSelect($table, array($field => $id));
		} while ($rows);
		return $id;
	}

	/**
	 * Generate new session ID
	 * @method newSession
	 * @static
	 * @return {string} Session ID
	 */
	static function newSession()
	{
		$sessionId = self::uniqueId('session', 'id', self::$publisher['id']);
		$id = $sessionId;
		$insertedTime = time();
		self::$session = self::dbInsert('session', compact('id', 'insertedTime'));
		$seconds = 60*60*24*365;
		setcookie(self::$session_name, $sessionId, time()+$seconds);

		$hostname = self::hostnameFromRequest();
		self::$hostname_session = self::dbInsert(
			'hostname_session', 
			compact('sessionId', 'hostname', 'insertedTime')
		);
		self::$new_hostname_session = true;
		return $sessionId;
	}

	/**
	 * Get hostname for session Id
	 * @method hostnameSessionFromId
	 * @static
	 * @param {string} $sessionId Session Id
	 * @return {string}
	 */
	static function hostnameSessionFromId($sessionId)
	{
		$hostname = self::hostnameFromRequest();
		$hs = self::dbSelect('hostname_session', compact('hostname', 'sessionId'));
		if (!$hs) {
			self::$new_hostname_session = true;
			$hs = self::dbInsert('hostname_session', compact('hostname', 'sessionId'));
		}
		return $hs;
	}

	/**
	 * Get last visit record from database
	 * @method getLastVisit
	 * @static
	 * @param {string} $sessionId
	 * @return {array}
	 */
	static function getLastVisit($sessionId)
	{
		$hostname = self::hostnameFromRequest();
		$criteria = compact('sessionId', 'hostname');
		return self::dbSelect('visit', $criteria, null, null, '', 'ORDER BY insertedTime DESC LIMIT 1');
	}

	/**
	 * Record new visit
	 * @method insertVisitFromRequest
	 * @static
	 * @return {array} Visit information
	 */
	static function insertVisitFromRequest()
	{
		$share_id = self::shareIdFromRequest();
		$visit = array(
	 		'id' => self::uniqueId('visit', 'id'),
			'sessionId' => self::$hostname_session['sessionId'],
	 		'url' => self::urlFromRequest(),
			'hostname' => self::hostnameFromRequest(),
			'from_share_id' => $share_id ? $share_id : '',
			'share_count' => 0,
			'insertedTime' => time()
		);
		self::dbInsert('visit', $visit);
		self::$visit = $visit;

		return $visit;
	}

	/**
	 * Connect to database
	 * @method dbConnect
	 * @static
	 * @return {boolean}
	 */
	static function dbConnect()
	{
		if (isset(self::$db)) {
			return false;
		}
		
		$driver_options = array('3' => 2);
		$arr = Pie_Config::get('db', 'connections', 'rs', false);
		if (!$arr) {
			throw new Exception("Missing connection details for rs");
		}
		extract($arr);
        self::$db = new PDO($dsn, $username, $password, $driver_options);
		if (!self::$db) {
			throw new Exception("Could not connect to db");
		}
		return true;
	}

	/**
	 * Insert row to table
	 * @method dbInsert
	 * @static
	 * @param {string} $table
	 * @param {array} $row
	 * @return {array}
	 */
	static function dbInsert($table, $row)
	{
		self::dbConnect();
		$values = array();
		foreach ($row as $k => $v) {
			$values[] = "$k = :$k";
		}
		$q = "INSERT INTO ".self::$tables[$table]." SET \n".implode(", \n", $values);
		$stmt = self::$db->prepare($q);
		foreach ($row as $k => $v) {
			$stmt->bindValue(":$k", $v);
		}
		$stmt->execute();
		return $row;
	}

	/**
	 * Select row from table
	 * @method dbSelect
	 * @static
	 * @param {string} $table
	 * @param {array} $criteria
	 * @param {string} [$join_table=null]
	 * @param {array} [$join_criteria=null]
	 * @param {array} [$clauses_before_where='']
	 * @param {array} [$clauses_after_where='']
	 * @return {array}
	 */
	static function dbSelect(
		$table, 
		$criteria, 
		$join_table = null, 
		$join_criteria = null,
		$clauses_before_where = '',
		$clauses_after_where = '')
	{
		self::dbConnect();
		$values = array();
		foreach ($criteria as $k => $v) {
			$values[] = "$k = :$k";
		}
		$q = "SELECT * FROM ".self::$tables[$table];
		if ($join_table) {
			$q .= " JOIN " . self::$tables[$join_table];
			if ($join_criteria) {
				if (is_array($join_criteria)) {
					$join_values = array();
					foreach ($criteria as $k => $v) {
						$join_values[] = "$k = :$k";
					}
					$q .= " ON \n".implode("\n AND ", $join_values);
				} else {
					$q .= " ON $join_criteria";
				
				}
			}
		}
		$q .= "\n $clauses_before_where\n WHERE \n"
			. implode("\n AND ", $values)
			. "\n $clauses_after_where";
		$stmt = self::$db->prepare($q);
		foreach ($criteria as $k => $v) {
			$stmt->bindValue(":$k", $v);
		}
		if ($join_table and $join_criteria and is_array($join_criteria)) {
			foreach ($join_criteria as $k => $v) {
				$stmt->bindValue(":$k", $v);
			}
		}
		$stmt->execute();
		return $stmt->fetch(PDO::FETCH_ASSOC);
	}
	
	/**
	 * Increment fields
	 * @method dbIncrement
	 * @static
	 * @param {string} $table
	 * @param {array} $fields
	 * @param {array} [$criteria=null]
	 */ 
	static function dbIncrement($table, $fields, $criteria = null)
	{
		self::dbConnect();
		$clauses = array();
		foreach ($fields as $f) {
			$clauses[] = "$f = $f + 1";
		}
		$q = "UPDATE " . self::$tables[$table] . " SET " . implode(", \n", $clauses);
		if ($criteria) {
			$values = array();
			foreach ($criteria as $k => $v) {
				$values[] = "$k = :$k";
			}
			$q .= "\n WHERE " . implode("\n AND ", $values);
			$stmt = self::$db->prepare($q);
			foreach ($criteria as $k => $v) {
				$stmt->bindValue(":$k", $v);
			}
		} else {
			$stmt = self::$db->prepare($q);
		}
		$stmt->execute();
	}
	/* * * */
};
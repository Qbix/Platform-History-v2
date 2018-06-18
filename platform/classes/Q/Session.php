<?php

/**
 * @module Q
 */
/**
 * Session-related functionality
 * @class Q_Session
 */
class Q_Session
{
	/**
	 * @property $session_save_path
	 * @type string
	 * @static
	 * @protected
	 */
	static protected $session_save_path;
	/**
	 * @property $session_db_connection
	 * @type Db
	 * @static
	 * @protected
	 */
	static protected $session_db_connection;
	/**
	 * @property $session_db_table
	 * @type string
	 * @static
	 * @protected
	 */
	static protected $session_db_table;
	/**
	 * @property $session_db_data_field
	 * @type string
	 * @static
	 * @protected
	 */
	static protected $session_db_data_field;
	/**
	 * @property $session_db_id_field
	 * @type string
	 * @static
	 * @protected
	 */
	static protected $session_db_id_field;
	/**
	 * @property $session_db_updated_field
	 * @type string
	 * @static
	 * @protected
	 */
	static protected $session_db_updated_field;
	/**
	 * @property $session_db_duration_field
	 * @type string
	 * @static
	 * @protected
	 */
	static protected $session_db_duration_field;
	/**
	 * @property $session_db_platform_field
	 * @type string
	 * @static
	 * @protected
	 */
	static protected $session_db_platform_field;
	/**
	 * @property $session_db
	 * @type boolean
	 * @static
	 * @protected
	 */
	static protected $session_db;
	/**
	 * @property $session_db_row
	 * @type Db_Row
	 * @static
	 * @protected
	 */
	static protected $session_db_row;
	/**
	 * @property $session_db_row_class
	 * @type string
	 * @static
	 * @protected
	 */
	static protected $session_db_row_class;
	/**
	 * @property $sess_data
	 * @type boolean
	 * @static
	 */
	static protected $sess_data;
	
	/**
	 * @method name
	 * @static
	 * @param {string} [$name=null]
	 * @return {string}
	 */
	static function name($name = null)
	{
		/**
		 * @event Q/session/name {before}
		 * @param {string} name
		 * @return {string}
		 */
		if ($name2 = Q::event('Q/session/name', compact('name'), 'before')) {
			return $name2;
		}
		if (isset($name)) {
			return session_name($name);
		}
		return session_name();
	}
	
	/**
	 * @method id
	 * @static
	 * @param {string} [$id=null] Pass a new session id, if you want to change it
	 * @return {string} The current session id
	 */
	static function id ($id = null)
	{
		/**
		 * @event Q/session/id {before}
		 * @param {string} id
		 * @return {string}
		 */
		$id = Q::event('Q/session/id', array(), 'before', false, $id);
		if (isset($id)) {
			return session_id($id);
		}
		return session_id();
	}
	
	/**
	 * @method savePath
	 * @static
	 * @param {string} [$savePath=null]
	 * @return {string}
	 */
	static function savePath ($savePath = null)
	{
		/**
		 * @event Q/session/savePath {before}
		 * @param {string} savePath
		 * @return {string}
		 */
		if ($savePath2 = Q::event('Q/session/savePath', compact('savePath'), 'before')) {
			return $savePath2;
		}
		if (isset($savePath)) {
			return session_save_path($savePath);
		}
		$sp = session_save_path();
		// A workaround for some systems:
		if (empty($sp)) {
			$sp = Q_FILES_DIR.DS.'Q'.DS.'sessions';
			session_save_path($sp);
		}
		return $sp;
	}
	
	/**
	 * @method init
	 * @static
	 */
	static function init()
	{
		if (self::$inited) {
			return false;
		}
		
		ini_set("session.entropy_file", "/dev/urandom");
		ini_set("session.entropy_length", "512");
		ini_set("session.hash_function", "1");
		$name = Q_Config::get('Q', 'session', 'name', 'Q_sessionId');
		$durationName = self::durationName();
		$duration = Q_Config::get('Q', 'session', 'durations', $durationName, 0);
		$baseUrl = Q_Request::baseUrl();
		$parts = parse_url($baseUrl);
		$path = !empty($parts['path']) ? $parts['path'] : '/';
		$domain = '.'.$parts['host'];

		Q::event('Q/session/init', array(
			'name' => &$name,
			'duration' => &$duration,
			'path' => &$path,
			'domain' => &$domain
		), 'before');

		Q_Session::name($name);
		session_set_cookie_params($duration, $path, $domain, false, false);
		
		if (Q_Config::get('Q', 'session', 'appendSuffix', false)
		or isset($_GET[$name])) {
			if (self::id()) {
				$s = "?$name=".self::id();
				$suffix = Q_Uri::suffix();
				$suffix[$baseUrl] = isset($suffix[$baseUrl])
					? $suffix[$baseUrl].$s
					: $s;
				Q_Uri::suffix($suffix);
			}
		}
		
		self::$inited = true;
		return true;
	}
	
	/**
	 * @method start
	 * @static
	 * @return {boolean}
	 */
	static function start()
	{
		if (self::id()) {
			// Session has already started
			return false;
		}
		/**
		 * @event Q/session/start {before}
		 * @return {false}
		 *	Return false to cancel session start
		 */
		if (false === Q::event('Q/session/start', array(), 'before')) {
			return false;
		}
		if (Q_Config::get('Q', 'session', 'custom', true)) {
			session_set_save_handler(
				array(__CLASS__, 'openHandler'), 
				array(__CLASS__, 'closeHandler'), 
				array(__CLASS__, 'readHandler'), 
				array(__CLASS__, 'writeHandler'), 
				array(__CLASS__, 'destroyHandler'),
				array(__CLASS__, 'gcHandler')
			);
		}
		if (!empty($_SESSION)) {
			$pre_SESSION = $_SESSION;
		}
		self::init();
		$name = Q_Session::name();
		$id = isset($_REQUEST[$name])
			? $_REQUEST[$name]
			: isset($_COOKIE[$name])
				? $_COOKIE[$name]
				: null;

		$isNew = false;
		if (!self::isValidId($id)) {
			// The session id was probably not generated by us, generate a new one
			/**
			 * This hook is called before a new session id is generated.
			 * You can return false to cancel starting the session.
			 * @event Q/session/generate {before}
			 * @param {string} id An invalid id, if any, that was passed by the client
			 * @return {boolean}
			 */
			if (false === Q::event('Q/session/generate', compact('id'), 'before')) {
				return false;
			}
			$id = self::generateId();
			$isNew = true;
		}

		try {
			if ($id) {
				self::processDbInfo();
				if (self::$session_db_connection) {
					$id_field = self::$session_db_id_field;
					$data_field = self::$session_db_data_field;
					$updated_field = self::$session_db_updated_field;
					$duration_field = self::$session_db_duration_field;
					$platform_field = self::$session_db_platform_field;
					$class = self::$session_db_row_class;
					$row = new $class();
					$row->$id_field = $id;
					if ($row->retrieve()) {
						self::$session_db_row = $row;
					} else {
						// Start a new session with our own id
						$id = $row->$id_field = self::generateId();
						$row->$data_field = "";
						$row->$updated_field = date('Y-m-d H:i:s');
						$row->$duration_field = Q_Config::get(
							'Q', 'session', 'durations', Q_Request::formFactor(),
							Q_Config::expect('Q', 'session', 'durations', 'session')
						);
						if ($platform_field) {
							$platform = Q_Request::platform();
							$row->$platform_field = $platform ? $platform : null;
						}
						if (false !== Q::event(
							'Q/session/save',
							array(
								'row' => $row,
								'id_field' => $id_field,
								'data_field' => $data_field,
								'updated_field' => $updated_field,
								'duration_field' => $duration_field,
								'platform_field' => $platform_field,
								'inserting' => true
							),
							'before'
						)) {
							$row->save();
							self::$session_db_row = $row;
						}
					}
				}
				self::id($id);
			}
			if (!empty($_SERVER['HTTP_HOST'])) {
				$durationName = self::durationName();
				$duration = Q_Config::get('Q', 'session', 'durations', $durationName, 0);
				Q_Response::setCookie(self::name(), $id, $duration ? time()+$duration : 0);
			} else if (empty($_SESSION)) {
				$_SESSION = array();
			}
			ini_set('session.use_cookies', 0); // we are gonna handle the cookies, thanks
			session_cache_limiter(''); // don't send the cache limiter headers either
			session_start();
		} catch (Exception $e) {
			$app = Q_Config::get('Q', 'app', null);
			$prefix = $app ? "$app/" : '';
			if (empty($_SERVER['HTTP_HOST'])) {
				echo "Warning: Ignoring Q_Session::start() called before running {$prefix}scripts/Q/install.php --all".PHP_EOL;
				$message = $e->getMessage();
				$file = $e->getFile();
				$line = $e->getLine();
				if (is_callable(array($e, 'getTraceAsStringEx'))) {
					$trace_string = $e->getTraceAsStringEx();
				} else {
					$trace_string = $e->getTraceAsString();
				}
				echo "$message\n(in $file line $line)\n$trace_string".PHP_EOL;
			} else {
				Q_Cache::clear(true);
				Q::log($e);
				throw new Q_Exception("Please run {$prefix}scripts/Q/install.php --all");
			}
		}
		// merge in all the stuff that was added to $_SESSION
		// before we started it.
		if (isset($pre_SESSION)) {
			foreach ($pre_SESSION as $k => $v) {
				$_SESSION[$k] = $v;
			}
		}
		if (isset($_SESSION['Q']['notices'])) {
			foreach ($_SESSION['Q']['notices'] as $k => $v) {
				Q_Response::setNotice($k, $v);
			}
		}
		if (!empty($_SESSION['Q']['terminated'])) {
			throw new Q_Exception_SessionTerminated(array(
				'id' => Q_Session::id()
			));
		}
		$original = null;
		$changed = array();
		if (Q_Config::get('Q', 'session', 'userAgentInfo', null)) {
			$arr = isset($_SESSION['Q']) ? $_SESSION['Q'] : array();
			$userAgentInfo = Q_Request::userAgentInfo();
			foreach ($userAgentInfo as $k => $v) {
				if (isset($arr[$k])) {
					$original[$k] = $arr[$k];
					if ($arr[$k] !== $v) {
						$changed[$k] = $v;
					}
				}
			}
			$_SESSION['Q'] = array_merge($arr, $userAgentInfo);
		}
		/**
		 * This is a hook for after the session starts.
		 * You may want to do extra security checks here.
		 * @event Q/session/start {after}
		 * @param {array} $original The userAgentInfo values that were in the session originally
		 * @param {array} $changed Whether any of the userAgentInfo values changed.
		 * @param {boolean} $isNew Whether a new session has just been started
		 * @param {string} $id The id of the session
		 */
		Q::event('Q/session/start', array('original', 'changed', 'isNew', 'id'), 'after');
		return true;
	}
	
	/**
	 * You can call this function to clear out the contents of 
	 * a session, but keep its ID.
	 * @method clear
	 * @static
	 */
	static function clear()
	{
		session_unset();
		$_SESSION = array();
	}
	
	static function destroy()
	{
		session_destroy();
		self::clear();
		if (ini_get("session.use_cookies")) {
		    // note - we no use session_get_cookie_params();
		    Q_Response::clearCookie(self::name());
		}
	}
	
	/**
	 * You should use this instead of simply calling session_regenerate_id().
	 * Generates a new session id signed with "Q"/"external"/"secret", and
	 * clones the current session data into it.
	 * @method regenerateId
	 * @static
	 * @param {boolean} [$destroy_old_session=false] Set to true if you want to get rid
	 *  of the old session (to save space or for security purposes).
	 * @param {integer|string} [$duration=null] Set the duration of the regenerated session,
	 *  otherwise it will use the default duration for Q_Session::durationName().
	 *  See Q/session/durations config field. Pass 0 to expire at the end of browser session.
	 * @return {string} The new session id.
	 */
	static function regenerateId($destroy_old_session = false, $duration = null)
	{
		$old_SESSION = $_SESSION;
		if ($destroy_old_session) {
			self::destroy();
		}

		// we have to re-set all the handlers, due to a bug in PHP 5.2
		if (Q_Config::get('Q', 'session', 'custom', true)) {
			session_set_save_handler(
				array(__CLASS__, 'openHandler'), 
				array(__CLASS__, 'closeHandler'), 
				array(__CLASS__, 'readHandler'), 
				array(__CLASS__, 'writeHandler'), 
				array(__CLASS__, 'destroyHandler'),
				array(__CLASS__, 'gcHandler')
			);
		}
		session_id($sid = self::generateId()); // generate a new session id
		session_start(); // start a new session
		if (!empty($_SERVER['HTTP_HOST'])) {
			// set the new cookie
			if (!isset($duration)) {
				$duration = self::durationName();
			}
			if (is_string($duration)) {
				$duration = Q_Config::get('Q', 'session', 'durations', $duration, 0);
			};
			Q_Response::setCookie(self::name(), $sid, $duration ? time()+$duration : 0);
		}
		$_SESSION = $old_SESSION; // restore $_SESSION, which will be saved when session closes

		return $sid;
	}

	//
	// Session handling functions
	//
	
	/**
	 * @method openHandler
	 * @static
	 * @param {string} $save_path
	 * @param {string} $session_name
	 * @return {boolean}
	 * @throws {Q_Exception_WrongType}
	 */
	static function openHandler ($save_path, $session_name)
	{
		$db_info = self::processDbInfo();
		
		/**
		 * @event Q/session/open {before}
		 * @param {string} save_path
		 * @param {string} session_name
		 * @param {Db_Interface} session_db_connection
		 */
		Q::event('Q/session/open', 
			compact('save_path', 'session_name', 'db_info'), 
			'before'
		);

		self::$session_save_path = $save_path;
		/**
		 * @event Q/session/open {after}
		 * @param {string} save_path
		 * @param {string} session_name
		 * @param {Db_Interface} session_db_connection
		 */
		Q::event('Q/session/open', 
			compact('save_path', 'session_name', 'session_db_connection'), 
			'after'
		);
		return true;
	}

	/**
	 * @method closeHandler
	 * @static
	 */
	static function closeHandler ()
	{
		/**
		 * @event Q/session/close {before}
		 */
		if (false === Q::event('Q/session/close', array(), 'before')) {
			return false;
		}
		return true;
	}

	/**
	 * @method readHandler
	 * @static
	 * @param {string} $id
	 * @return {string}
	 */
	static function readHandler ($id)
	{
		/**
		 * @event Q/session/read {before}
		 * @param {string} 'save_path'
		 * @param {Db_Interface} 'session_db_connection'
		 * @return {string}
		 */
		$result = Q::event('Q/session/read', 
			array(
				'save_path' => self::$session_save_path,
				'session_db_connection' => self::$session_db_connection
			), 
			'before'
		);
		if (isset($result)) {
			return $result;
		}
		if (empty(self::$session_save_path)) {
			self::$session_save_path = self::savePath();
		}
		if (! empty(self::$session_db_connection)) {
			$id_field = self::$session_db_id_field;
			$data_field = self::$session_db_data_field;
			if (!self::$session_db_row
			or self::$session_db_row->$id_field != $id) {
				$class = self::$session_db_row_class;
				$row = new $class();
				$row->$id_field = $id;
				$row->retrieve();
				self::$session_db_row = $row;
			}
			$result = isset(self::$session_db_row->$data_field)
				? self::$session_db_row->$data_field : '';
		} else {
			$duration_name = self::durationName();
			$id1 = substr($id, 0, 4);
			$id2 = substr($id, 4);
			$sess_file = self::$session_save_path . DS . "$duration_name/$id1/$id2";
			if (!file_exists($sess_file)) {
				$result = '';
			} else {
				$result = (string) file_get_contents($sess_file);
			}
		}
		self::$sess_data = $result;
		/**
		 * @event Q/session/read {after}
		 * @param {string} 'save_path'
		 * @param {Db_Interface} 'session_db_connection'
		 * @return {string}
		 */
		$result = Q::event('Q/session/read', 
			array(
				'save_path' => self::$session_save_path,
				'session_db_connection' => self::$session_db_connection,
				'sess_data' => $result
			), 
			'after',
			false,
			$result
		);
		return $result;
	}

	/**
	 * @method writeHandler
	 * @static
	 * @param {string} $id
	 * @param {string} $sess_data
	 * @return {boolean}
	 */
	static function writeHandler ($id, $sess_data)
	{
		try {
			// if the request is AJAX request that came without session cookie, then do not write session, ignore it
			if (Q_Request::isAjax() && !isset($_COOKIE[self::name()])) {
				return false;
			}

			// don't save sessions when running from command-line (cli)
			if(php_sapi_name() == 'cli') {
				return false;
			}

			if (self::$preventWrite) {
				return false;
			}
			
			$our_SESSION = $_SESSION;
			$old_data = self::$sess_data;
			$changed = ($sess_data !== $old_data);
			$result = false;

			/**
			 * @event Q/session/write {before}
			 * @param {string} id
			 * @param {string} sess_data
			 * @param {string} old_data
			 * @param {boolean} changed
			 * @return {boolean}
			 */
			if (false === Q::event(
				'Q/session/write', 
				compact('id', 'sess_data', 'old_data', 'changed'), 
				'before'
			)) {
				return false;
			}
			if (empty(self::$session_save_path)) {
				self::$session_save_path = self::savePath();
			}
			if (!empty(self::$session_db_connection)) {
				// Create a new row to be saved in the session table
				$db_row_class = self::$session_db_row_class;
				// Make sure it has a primary key!
				if (count(self::$session_db_row->getPrimaryKey()) != 1) {
					throw new Q_Exception(
						"The primary key of " . self::$session_db_row_class 
						. " has to consist of exactly 1 field!"
					);
				}
				$id_field = self::$session_db_id_field;
				$data_field = self::$session_db_data_field;
				$updated_field = self::$session_db_updated_field;
				$duration_field = self::$session_db_duration_field;
				$platform_field = self::$session_db_platform_field;
				$row = self::$session_db_row;
				$row->$id_field = $id;
			} else {
				$duration_name = self::durationName();
				$id1 = substr($id, 0, 4);
				$id2 = substr($id, 4);
				$ssp = self::$session_save_path;
				$sess_file = $ssp . DS . "$duration_name/$id1/$id2";
				$dir = $ssp . DS . "$duration_name/$id1/";
			}
			if ($changed) {
				// Apparently, we want to save some changes.
				// The convention to avoid locking is that everything
				// stored in sessions must be mergeable using the
				// Q_Tree merge algorithm.
				// So we will retrieve the latest session data again,
				// merge our changes over it, and save.
				$params = array(
					'changed' => $changed,
					'sess_data' => $sess_data,
					'old_data' => $old_data
				);
				if (!empty(self::$session_db_connection)) {
					$row->retrieve(null, false, array(
						'begin' => true,
						'ignoreCache' => true
					));
					$existing_data = Q::ifset($row, $data_field, "");
					$params = array_merge($params, array(
						'id_field' => $id_field,
						'data_field' => $data_field,
						'duration_field' => $duration_field,
						'platform_field' => $platform_field,
						'updated_field' => $updated_field,
						'row' => $row
					));
				} else {
					if (!is_dir($dir)) {
						mkdir($dir, fileperms($ssp), true);
					}
					if (!is_writable($dir)) {
						// alert the developer to this problem
						Q::log("$sess_file is not writable", 'fatal');
						die("$sess_file is not writable");
					}
					if (file_exists($sess_file)) {
						$file = fopen($sess_file, "r+");
						flock($file, LOCK_EX);
						$maxlength = Q_Config::get('Q', 'session', 'maxlength', 4095);
						$existing_data = fread($file, $maxlength);
					} else {
						$file = fopen($sess_file, "w");
						flock($file, LOCK_EX);
						$existing_data = '';
					}
				}
				$_SESSION = self::unserialize($existing_data);
				$t = new Q_Tree($_SESSION);
				$t->merge($our_SESSION);
				$_SESSION = $t->getAll();
				$params['existing_data'] = $existing_data;
				$params['merged_data'] = $merged_data = session_encode();
				/**
				 * @event Q/session/save {before}
				 * @param {string} sess_data
				 * @param {string} old_data
				 * @param {string} existing_data
				 * @param {string} merged_data
				 * @param {boolean} changed
				 * @param {Db_Row} row
				 * @return {boolean}
				 */
				Q::event('Q/session/save', $params, 'before');
				if (! empty(self::$session_db_connection)) {
					$row->$data_field = $merged_data;
					$row->$duration_field = Q_Config::get(
						'Q', 'session', 'durations', Q_Request::formFactor(),
						Q_Config::expect('Q', 'session', 'durations', 'session')
					);
					if ($platform_field) {
						$platform = Q_Request::platform();
						$row->$platform_field = $platform ? $platform : null;
					}
					$row->save(false, true);
					$result = true;
				} else {
					if (!$file) {
						throw new Q_Exception_MissingFile(array('filename' => $sess_file));
					}
					ftruncate($file, 0);
					rewind($file);
					$result = fwrite($file, $merged_data);
					flock($file, LOCK_UN);
					fclose($file);
				}
			} else {
				$result = true;
			}
			/**
			 * @event Q/session/write {after}
			 * @param {string} id
			 * @param {boolean} changed
			 * @param {string} sess_data
			 * @param {string} old_data
			 * @param {string} existing_data
			 * @param {string} merged_data
			 * @param {string} data_field
			 * @param {string} updated_field
			 * @param {string} duration_field
			 * @param {string} platform_field
			 * @param {string} sess_file
			 * @param {integer} row
			 * @return {mixed}
			 */
			$result = Q::event(
				'Q/session/write', 
				compact(
					'id', 'data_field', 'updated_field', 'duration_field', 'platform_field',
					'sess_file', 'row',
					'changed', 'sess_data', 'old_data', 'existing_data', 'merged_data'
				), 
				'after',
				false,
				$result
			);
			return $result;
		} catch (Exception $e) {
			Q::log("Exception when writing session $id: " . $e->getMessage());
			throw $e;
		}
	}

	/**
	 * @method destroyHandler
	 * @static
	 * @param {string} $id
	 * @return {boolean}
	 */
	static function destroyHandler ($id)
	{
		/**
		* @event Q/session/destroy {before}
		* @param {string} id
		* @return {false}
		*/
		if (false === Q::event(
			'Q/session/destroy', 
			compact('id'), 
			'before'
		)) {
			return false;
		}
		self::clearNonce();
		if (! empty(self::$session_db_connection)) {
			self::$session_db
				->delete(self::$session_db_table)
				->where(array(self::$session_db_id_field => $id))
				->execute();
			$result = true;
		} else {
			$sess_file = self::$session_save_path . DS . "$id";
			if (!file_exists($sess_file)) {
				return false;
			}
			$result = unlink($sess_file);
		}
		/**
		 * @event Q/session/destroy {after}
		 * @param {string} id
		 * @return {mixed}
		 */
		$result = Q::event(
			'Q/session/destroy',
			compact('id'),
			'after',
			false,
			$result
		);
		return $result;
	}

	/**
	 * @method gcHandler
	 * @static
	 * @param {integer} $max_duration
	 */
	static function gcHandler ($max_duration)
	{
		$proceed = Q_Config::get('Q', 'session', 'gc', true);
		if ($proceed) {
			self::gc($max_duration);
		}
	}
	
	/**
	 * @method gc
	 * @static
	 * @param {integer} $max_duration
	 */
	static function gc($max_duration)
	{
		$id = self::id();
		/**
		 * @event Q/session/gc {before}
		 * @param {string} id
		 * @param {integer} max_duration
		 * @return {false}
		 */
		if (false === Q::event(
			'Q/session/gc', 
			compact('id', 'max_duration'), 
			'before'
		)) {
			return false;
		}
		$durations = Q_Config::get('Q', 'session', 'durations', array());
		foreach ($durations as $k => $v) {
			if ($v === null) {
				$v = $max_duration;
			}
			if (!$v) {
				continue;
			}
			$since_time = time() - $v;
			if (! empty(self::$session_db_connection)) {
				$datetime = date('Y-m-d H:i:s', $since_time);
				self::$session_db
					->delete(self::$session_db_table)
					->where(array(
						self::$session_db_updated_field . '<' => $datetime,
						self::$session_db_duration_field => $v
					))->execute();
			} else {
				foreach (glob(self::$session_save_path . "/$k/*/*") as $filename) {
					$mtime = filemtime($filename);
					if ($mtime < $since_time) {
						unlink($filename);
					}
				}
			}
		}
		/**
		 * @event Q/session/gc {after}
		 * @param {string} id
		 * @param {integer} max_duration
		 * @param {integer} since_time
		 */
		Q::event(
			'Q/session/gc', 
			compact('id', 'max_duration', 'since_time'), 
			'after'
		);
		return true;
	}
	
	/**
	 * Gets nonce from the session
	 * @method getNonce
	 * @return {string}
	 */
	static function getNonce()
	{
		return isset($_SESSION['Q']['nonce'])
			? $_SESSION['Q']['nonce']
			: null;
	}
	
	/**
	 * Sets a nonce in the session ['Q']['nonce'] field and in cookie 'Q_nonce'
	 * @method setNonce
	 * @param {boolean} [$overwrite=false] If true, sets a new nonce even if one is already there.
	 */
	static function setNonce($overwrite = false)
	{
		self::start();
		if ($overwrite or !isset($_SESSION['Q']['nonce'])) {
			if (is_callable('random_bytes')) {
				$_SESSION['Q']['nonce'] = bin2hex(random_bytes(32));
			} else {
				$_SESSION['Q']['nonce'] = sha1(mt_rand().microtime());
			}
		}
		if (!empty($_SERVER['HTTP_HOST'])) {
			$durationName = self::durationName();
			$duration = Q_Config::get('Q', 'session', 'durations', $durationName, 0);
			Q_Response::setCookie('Q_nonce', $_SESSION['Q']['nonce'], $duration ? time()+$duration : 0);
		}
		Q_Session::$nonceWasSet = true;
	}
	
	/**
	 * Clears the nonce in the session ['Q']['nonce'] field and in cookie 'Q_nonce'
	 * @method clearNonce
	 */
	static function clearNonce($overwrite = false)
	{
		self::start();
		$_SESSION['Q']['nonce'] = null;
		if (!empty($_SERVER['HTTP_HOST'])) {
			Q_Response::clearCookie('Q_nonce');
		}
	}
	
	static function durationName()
	{
		$ff = Q_Request::formFactor();
		$duration = Q_Config::get('Q', 'session', 'durations', $ff, null);
		return isset($duration) ? $ff : 'session';
	}
	
	static function processDbInfo()
	{
		static $db_info = null;
		
		if ($db_info) {
			return $db_info;
		}
		if (!$db_info) {
			$db_info = Q_Config::get('Q', 'session', 'db', null);
		}
		if (!$db_info) {
			return null;
		}
		
		$session_db_connection = isset($db_info['connection']) ? $db_info['connection'] : null;

		// use the DB for session
		$session_db_data_field = isset($db_info['dataField']) ? $db_info['dataField'] : null;
		if (empty($session_db_data_field)) {
			throw new Q_Exception_WrongType(array(
				'field' => 'session_db_data_field', 
				'type' => 'string'
			));
		}
		$session_db_id_field = isset($db_info['idField']) ? $db_info['idField'] : null;
		if (empty($session_db_id_field)) {
			throw new Q_Exception_WrongType(array(
				'field' => 'session_db_id_field', 
				'type' => 'string'
			));
		}
		$session_db_updated_field = isset($db_info['updatedField']) ? $db_info['updatedField'] : null;
		if (empty($session_db_updated_field)) {
			throw new Q_Exception_WrongType(array(
				'field' => 'session_db_updated_field', 
				'type' => 'string'
			));
		}
		$session_db_duration_field = isset($db_info['durationField']) ? $db_info['durationField'] : null;
		if (empty($session_db_duration_field)) {
			throw new Q_Exception_WrongType(array(
				'field' => 'session_db_duration_field', 
				'type' => 'string'
			));
		}
		$session_db_platform_field = isset($db_info['platformField']) ? $db_info['platformField'] : null;
		$session_db_row_class = isset($db_info['rowClass']) ? $db_info['rowClass'] : null;
		if (empty($session_db_row_class)
		or ! class_exists($session_db_row_class)) {
			throw new Q_Exception_WrongType(array(
				'field' => 'session_db_row_class', 
				'type' => 'a class name'
			));
		}
		$session_db_table = call_user_func(array($session_db_row_class, 'table'));
		$class = $session_db_row_class;
		$ancestors = array($class);
		while ($class = get_parent_class($class))
			$ancestors[] = $class;
		if (! in_array('Db_Row', $ancestors)) {
			throw new Q_Exception_WrongType(array(
				'field' => 'session_db_row_class', 
				'type' => 'name of a class that extends Db_Row'
			));
		}

		self::$session_db_connection = $session_db_connection;
		self::$session_db_table = $session_db_table;
		self::$session_db_data_field = $session_db_data_field;
		self::$session_db_id_field = $session_db_id_field;
		self::$session_db_updated_field = $session_db_updated_field;
		self::$session_db_duration_field = $session_db_duration_field;
		self::$session_db_platform_field = $session_db_platform_field;
		self::$session_db_row_class = $session_db_row_class;
		self::$session_db = Db::connect(self::$session_db_connection);
		
		return $db_info;
	}
	
	/**
	 * Get the session Db_Row, if it has been retrieved, otherwise null
	 * @method row
	 * @static
	 * @return {Db_Row|null}
	 */
	static function row()
	{
		return self::$session_db_row;
	}

	/**
	 * Generates a session id, signed with "Q"/"external"/"secret"
	 * so that the web server won't have to deal with session ids we haven't issued.
	 * @return {string}
	 */
	static function generateId()
	{
		if (is_callable('random_bytes')) {
			$id = bin2hex(random_bytes(16));
		} else {
			$id = str_replace('-', '', Q_Utils::uuid());
		}
		$secret = Q_Config::get('Q', 'external', 'secret', null);
		if (isset($secret)) {
			$sig = Q_Utils::signature($id, "$secret");
			$id .= substr($sig, 0, 32);
		}
		$id = base64_encode(pack('H*', $id));
		return str_replace(
			array('z', '+', '/', '='), 
			array('zz', 'za', 'zb', 'zc'), 
			$id
		);
	}
	/**
	 * @param string $id
	 *
	 * @return array
	 * @throws Q_Exception
	 * @throws TypeError
	*/
	protected static function decodeId($id)
	{
		if (!$id) {
			return array(false, '', '');
		}
		$result = '';
		$len = strlen($id);
		$i = 0;
		$replacements = array(
			'z' => 'z',
			'a' => '+',
			'b' => '/',
			'c' => '='
		);
		while ($i < $len-1) {
			$r = $id[$i];
			$c1 = $id[$i];
			++$i;
			if ($c1 == 'z') {
				$c2 = $id[$i];
				if (isset($replacements[$c2])) {
					$r = $replacements[$c2];
					++$i;
				}
			}
			$result .= $r;
		}
		if ($i < $len) {
			$result .= $id[$i];
		}
		$result = bin2hex(base64_decode($result));
		$a = substr($result, 0, 32);
		$b = substr($result, 32, 32);
		$secret = Q_Config::get('Q', 'external', 'secret', null);
		$c = isset($secret)
			? Q_Utils::hashEquals($b, substr(Q_Utils::signature($a, $secret), 0, 32))
			: true;
		return array($c, $a, $b);
	}
	
	/**
	 * Verifies a session id, that it was correctly signed with "Q"/"external"/"secret"
	 * so that the web server won't have to deal with session ids we haven't issued.
	 * @param {string} $id
	 * @return {boolean}
	 */
	static function isValidId($id)
	{
		$results = self::decodeId($id);
		return $results[0];
	}
	
	/**
	 * Unserialize a session string stored by PHP using the same
	 * session.serialize_handler as the current one.
	 * @param {string} $session_data
	 * @return {array} The session data
	 */
    static function unserialize($session_data) {
        $method = ini_get("session.serialize_handler");
        switch ($method) {
            case "php":
                return self::unserialize_php($session_data);
                break;
            case "php_binary":
                return self::unserialize_phpbinary($session_data);
                break;
            default:
                throw new Exception("Unsupported session.serialize_handler: " . $method . ". Supported: php, php_binary");
        }
    }

    protected static function unserialize_php($session_data) {
        $return_data = array();
        $offset = 0;
        while ($offset < strlen($session_data)) {
            if (!strstr(substr($session_data, $offset), "|")) {
                throw new Exception("invalid data, remaining: " . substr($session_data, $offset));
            }
            $pos = strpos($session_data, "|", $offset);
            $num = $pos - $offset;
            $varname = substr($session_data, $offset, $num);
            $offset += $num + 1;
            $data = unserialize(substr($session_data, $offset));
            $return_data[$varname] = $data;
            $offset += strlen(serialize($data));
        }
        return $return_data;
    }

    protected static function unserialize_phpbinary($session_data) {
        $return_data = array();
        $offset = 0;
        while ($offset < strlen($session_data)) {
            $num = ord($session_data[$offset]);
            $offset += 1;
            $varname = substr($session_data, $offset, $num);
            $offset += $num;
            $data = unserialize(substr($session_data, $offset));
            $return_data[$varname] = $data;
            $offset += strlen(serialize($data));
        }
        return $return_data;
    }
	
	/**
	 * @property $inited
	 * @type boolean
	 * @static
	 * @protected
	 */
	protected static $inited = false;
	
	/**
	 * @property $nonceWasSet
	 * @type boolean
	 * @static
	 * @public
	 */
	public static $nonceWasSet = false;

	/**
	 * Set this to true to prevent writing the session to disk
	 * @property $preventWrite
	 * @type boolean
	 * @static
	 * @public
	 */
	public static $preventWrite = false;
}

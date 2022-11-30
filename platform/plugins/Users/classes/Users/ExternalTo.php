<?php

/**
 * @module Users
 */

/**
 * Interface that an adapter must support to extend the Users_ExternalFrom class.
 * @class Users_ExternalFrom_Interface
 * @static
 */

interface Users_ExternalTo_Interface
{
	/**
	 * Takes an array of roleIds in externalLabels,
	 * and queries the external platform or cache.
	 * Returns an array of (externalLabel => xids) pairs.
	 * @method fetchXids
	 * @param {array} $roleIds
	 * @param {array} [$options=array()]
	 * @param {string} [$options.pathABI] optionally override the default ABI
	 * @return {array} externalLabel => array(xid, xid, ...)
	 */
	function fetchXids(array $roleIds, array $options = array());
}

/**
 * Class representing 'ExternalTo' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a external_to row in the Users database.
 *
 * @class Users_ExternalTo
 * @extends Base_Users_ExternalTo
 */
class Users_ExternalTo extends Base_Users_ExternalTo
{
	/**
	 * @method getAllExtras
	 * @return {array} The array of all extras set in the stream
	 */
	function getAllExtras()
	{
		return empty($this->extra) 
			? array()
			: json_decode($this->extra, true);
	}
	
	/**
	 * @method getExtra
	 * @param {string} $extraName The name of the extra to get
	 * @param {mixed} $default The value to return if the extra is missing
	 * @return {mixed} The value of the extra, or the default value, or null
	 */
	function getExtra($extraName, $default = null)
	{
		$attr = $this->getAllExtras();
		return isset($attr[$extraName]) ? $attr[$extraName] : $default;
	}
	
	/**
	 * @method setExtra
	 * @param {string} $extraName The name of the extra to set,
	 *  or an array of $extraName => $extraValue pairs
	 * @param {mixed} $value The value to set the extra to
	 * @return Users_ExternalTo
	 */
	function setExtra($extraName, $value = null)
	{
		$attr = $this->getAllExtras();
		if (is_array($extraName)) {
			foreach ($extraName as $k => $v) {
				$attr[$k] = $v;
			}
		} else {
			$attr[$extraName] = $value;
		}
		$this->extra = Q::json_encode($attr);

		return $this;
	}
	
	/**
	 * @method clearExtra
	 * @param {string} $extraName The name of the extra to remove
	 */
	function clearExtra($extraName)
	{
		$attr = $this->getAllExtras();
		unset($attr[$extraName]);
		$this->extra = Q::json_encode($attr);
	}
	
	/**
	 * @method clearAllExtras
	 */
	function clearAllExtras()
	{
		$this->extra = '{}';
	}
	
	/**
	 * Called by various Db methods to get a custom row object
	 * @param {array} $fields Any fields to set in the row
	 * @param {string} [$stripPrefix=null] Any prefix to strip from the fields
	 * @return Users_Device
	 */
	static function newRow($fields, $stripPrefix = null)
	{
		Q_Valid::requireFields(array('platform', 'appId'), $fields, true);
		$platform = ucfirst(strtolower($fields['platform']));
		$className = "Users_ExternalTo_$platform";
		$row = new $className();
		return $row->copyFrom($fields, $stripPrefix, false, false);
	}

	/**
	 * Fetch xids from external platforms, 
	 * @method fetchXidsByLabels
	 * @static
	 * @param {string} $userId
	 * @param {string|array|Db_Range} $labels Optionally filter by external labels
	 * @param {array} [$options=array()]
	 * @param {string|array} [$options.contactUserId=null] Optionally filter by contactUserId
	 * @param {&array} [$userIdsByXids=array()] pass a reference to an array that will be filled with ($contactXid => $userId) pairs
	 * @return {array} An array of (label => array(xid, xid, ...)) pairs
	 */
	static function fetchXidsByLabels($userId, $labels = null, $options = array(), &$userIdsByXids = array())
	{
		if (isset($labels)
		&& !is_string($labels)
		&& !is_array($labels)
		&& !($labels instanceof Db_Range)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'label',
				'range' => 'string, array or Db_Range',
				'value' => $labels
			));
		}
		// $user = Users_User::fetch($userId, true);
		// $xid = $user->getXid($platformApp);
		$queries = array();
		if ($labels instanceof Db_Range) {
			list($platform, $appId, $min) = Users_Label::parseExternalLabel($labels->min);
			list($p2, $a2, $max) = Users_Label::parseExternalLabel($labels->max);
			if ($platform !== $p2 or $appId !== $a2) {
				throw new Q_Exception_WrongValue(array(
					'field' => 'labels',
					'range' => 'min and max have same prefix',
					'value' => (string)$labels
				));
			}
			if ($min and $max
			and is_numeric($min) and is_numeric($max)) {
				$min = $labels->includeMin ? $min : $min + 1;
				$max = $labels->includeMax ? $max : $max - 1;;
				for ($i = $min; $i <= $max; ++$i) {
					$queries[$platform][$appId][] = $i;
				}
			}
		}
		if (is_string($labels)) {
			$labels = array($labels);
		}
		$primaryKeyValues = array();
		$contactUserIds = !empty($options['contactUserId'])
			? (is_array($options['contactUserId'])
				? $options['contactUserId']
				: array($options['contactUserId'])
			) : null;
		if (is_array($labels)) {
			$labels = array_unique($labels);
			foreach ($labels as $label) {
				list($platform, $appId, $roleId) = Users_Label::parseExternalLabel($label);
				if (isset($appId) and isset($roleId)) {
					foreach ($contactUserIds as $contactUserId) {
						$primaryKeyValues[] = array($contactUserId, $platform, $appId);
						if ($secondAppId = Users_ExternalTo::secondAppId($platform, $appId)) {
							$primaryKeyValues[] = array($contactUserId, $platform, $secondAppId);
						}
					}
					$queries[$platform][$appId][] = $roleId;
				}
			}
		}
		$primaryKeyValues = Q_Utils::arrayUnique($primaryKeyValues);
		$xidsByUserIds = array();
		$userIdsByXids = array();
		if (!empty($options['contactUserId'])) {
			$externalTos = Users_ExternalTo::select()
			->where(array(
				'userId,platform,appId' => $primaryKeyValues
			))->fetchDbRows();
			foreach ($externalTos as $externalTo) {
				$xidsByUserIds[$externalTo->platform][$externalTo->appId][$externalTo->userId] = $externalTo->xid;
				$userIdsByXids[$externalTo->platform][$externalTo->appId][$externalTo->xid] = $externalTo->userId;
			}
		}
		$results = array();
		foreach ($queries as $platform => $platformQueries) {
			foreach ($platformQueries as $appId => $roleIds) {
				$secondAppId = Users_ExternalTo::secondAppId($platform, $appId);
				$externalTos = Users_ExternalTo::select()
				->where(array(
					'userId' => $userId,
					'platform' => $platform,
					'appId' => array($appId, $secondAppId)
				))->limit(1)->fetchDbRows();
				if (!$externalTos) {
					continue;
				}
				$externalTo = reset($externalTos);
				try {
					if (empty($xidsByUserIds[$platform][$appId])) {
						// get xids from labels
						$results[$platform][$appId] = $externalTo->fetchXids($roleIds);
					} else {
						// get labels from xids
						$r = $externalTo->fetchExternalLabels($userIdsByXids[$platform][$appId]);
						foreach ($r as $contactXid => $externalLabels) {
							foreach ($externalLabels as $externalLabel) {
								$results[$platform][$appId][$externalLabel][] = $contactXid;
							}
						}
					}
				} catch (Exception $e) {
					continue; // for the purposes of this method, silently ignore errors on external platforms
				}
			}
		}
		return $results;
	}
	
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
	 * Assign 'xid' field if not set
	 * @method beforeSave
	 * @param {array} $modifiedFields
	 * @return {array}
	 */
	function beforeSave($updatedFields)
	{
		if (!$this->retrieved) {
			if (!isset($updatedFields['xid'])) {
				$this->xid = $updatedFields['xid'] = 
				self::db()->uniqueId(self::table(), 'xid', null);
			}
		}
		return parent::beforeSave($updatedFields);
	}
	
	function processPlatformResponse($data)
	{
		$this->accessToken = $data['access_token'];
		$this->expires = new Db_Expression("CURRENT_TIMESTAMP + INTERVAL $data[expires_in] SECOND");
		if (!empty($data['refreshToken'])) {
			$this->setExtra('refreshToken', $data['refreshToken']);
		}
		if (empty($this->xid)) {
			$this->xid = '';
		}
		if (!empty($scope)) {
			$this->setExtra('scope', $data['scope']);
		}
		$this->save();
	}
	
	function refreshToken()
	{
		$token = $this->getExtra('refreshToken');
		if (!$token) {
			throw new Q_Exception_MissingObject(array('name' => 'refreshToken'));
		}
		$params = array(
			'grant_type' => 'refresh_token',
			'refresh_token' => $token,
			'platform' => $this->platform,
			'client_id' => $this->appId
		);
		$response = Q_Utils::post($tokenUri, $params);
		$data = Q::json_decode($response, true);
		$this->processPlatformResponse($data);
	}

	static function secondAppId($platform, $appId)
	{
		$secondAppId = Q_Config::get('Users', 'apps', $platform, '*', 'appIdForAuth', null);
		if (!$secondAppId) {
			list($secondAppId) = Users::appInfo($appId);
		}
		return $secondAppId;
	}
	
	/**
	 * Inserts or updates a corresponding Users_ExternalFrom row
	 * @method afterSaveExecute
	 * @param {Db_Result} $result
	 * @return {array}
	 */
	function afterSaveExecute($result)
	{
		if (empty($this->xid)) {
			// don't save it if xid is empty
			Users_ExternalFrom::insert($this->fields)
				->onDuplicateKeyUpdate($this->fields)
				->execute();
		}
		return $result;
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_ExternalTo} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_ExternalTo();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};
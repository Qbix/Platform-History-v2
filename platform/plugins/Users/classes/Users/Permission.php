<?php
/**
 * @module Users
 */
/**
 * Class representing 'Permission' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a permission row in the Users database.
 *
 * @class Users_Permission
 * @extends Base_Users_Permission
 */
class Users_Permission extends Base_Users_Permission
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
		// INSERT YOUR CODE HERE
		// e.g. $this->hasMany(...) and stuff like that.
	}
	
	/**
	 * Gets permissions of community, in the form of Users_Permissions rows
	 * @method ofCommunity
	 * @static
	 * @param {string} $communityId
	 * @param {boolean} [$skipGlobalPermissions=false]
	 *   Set to false to not also return the permissions for "" community
	 * @return {array} of Users_Permission rows
	 */
	static function ofCommunity($communityId, $skipGlobalPermissions = false)
	{
		return Users_Permission::select()
        ->where(array(
            'userId' => $skipGlobalPermissions
				? $communityId
				: array('', $communityId),
            'permission' => 'Users/communities/roles'
        ))->orderBy('label')
		->fetchDbRows();
	}
	
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
	 * @return Streams_Invite
	 */
	function setExtra($extraName, $value = null)
	{
		$attr = $this->getAllExtras();
		if (is_array($extraName)) {
			foreach ($extraName as $k => $v) {
				$tmp = (!is_array($v)) ? array($v) : $v;
				$attr[$k] = (empty($attr[$k]) ? $tmp : array_unique(array_merge($attr[$k], $tmp)));
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
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @static
	 * @param {array} $array
	 * @return {Users_Permission} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Permission();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
    
    /**
     * 
     * @param type $userId
     * @param type $label
     * @param type $permission
     */
    static function getPermissions($userId, $label, $permission)
    {
        $perm = new Users_Permission();
		$perm->userId = $userId;
		$perm->label = $label;
		$perm->permission = $permission;
		$result = $perm->retrieve();
        
        return $perm->getAllExtras();
        
    }
    
};
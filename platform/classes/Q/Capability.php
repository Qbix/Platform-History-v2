<?php

/**
 * @module Q
 */
class Q_Capability
{
	/**
	 * Represents a capability signed by our server
	 * @class Q_Capability
	 * @constructor
	 * @param {array} $permissions Array of strings
	 * @param {integer} $startTime a timestamp
	 * @param {integer} $endTime a timestamp
	 */
	function __construct($permissions, $startTime, $endTime)
	{
		$this->permissions = $permissions;
		$this->startTime = $startTime;
		$this->endTime = $endTime;
	}
	
	function addPermission($permission)
	{
		$permissions = self::_permissions($permission);
		$this->permissions = array_unique(
			array_merge($this->permissions, $permissions)
		);
		return $this;
	}
	
	function removePermission($permission)
	{
		$permissions = self::_permissions($permission);
		$this->permissions = array_diff($this->permissions, array($permission));
	}

	function validate($permissions)
	{
		return Q_Valid::capability($this, $permissions);
	}
	
	function setData($key, $value)
	{
		$this->data[$key] = $value;
	}
	
	function exportArray()
	{
		$permissions = array();
		$arr = array('permissions' => $this->permissions);
		if (isset($this->startTime)) {
			$arr['startTime'] = $this->startTime;
		}
		if (isset($this->endTime)) {
			$arr['endTime'] = $this->endTime;
		}
		return Q_Utils::sign(array_merge($arr, $this->data));
	}

	function __toString() {
		$arr = $this->exportArray();
		// "uv,120398907,123980989,z09098z0c98z9c0z283947234"
	}

	private function _permissions($permission) {
		$config = Q_Config::get('Q', 'capability', 'permissions', array());
		$permissions = is_array($permission)
			? $permission
			: array($permission);
		foreach ($permission as $i => $p) {
			$k = array_search($p, $config);
			if ($k !== false) {
				$permissions[$i] = $k;
			}
		}
		return $permissions;
	}
	
	public $permissions = array();
	public $startTime = null;
	public $endTime = null;
	public $data = array();
}

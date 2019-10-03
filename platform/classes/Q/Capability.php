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
		var_export($this->permissions);
		if (is_array($permission)) {
			$this->permissions = $b = array_merge($this->permissions, $permission);
		} else {
			$this->permissions[] = $permission;
		}
		var_export($this->permissions);
		$this->permissions = array_unique($this->permissions);
	}
	
	function removePermission($permission)
	{
		$this->permissions = array_diff($this->permissions, array($permission));
	}
	
	function setData($key, $value)
	{
		$this->data[$key] = $value;
	}
	
	function exportArray()
	{
		return Q_Utils::sign(array(
			'permissions' => $this->permissions,
			'startTime' => $this->startTime,
			'endTime' => $this->endTime
		));
	}
	
	public $permissions = array();
	public $startTime = null;
	public $endTime = null;
}

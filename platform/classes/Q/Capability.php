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
	 * @param {string} $userId id of logged in user (null if not logged in)
	 */
	function __construct($permissions, $startTime, $endTime, $userId)
	{
		$this->permissions = $permissions;
		$this->startTime = $startTime;
		$this->endTime = $endTime;
		$this->userId = $userId;
	}
	
	function addPermission($permission)
	{
		if (is_array($permission)) {
			$this->permissions = $b = array_merge($this->permissions, $permission);
		} else {
			$this->permissions[] = $permission;
		}
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
			'endTime' => $this->endTime,
			'userId' => $this->userId
		));
	}
	
	public $permissions = array();
	public $startTime = null;
	public $endTime = null;
	public $data = array();
}

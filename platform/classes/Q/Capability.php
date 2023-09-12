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
	 * @param {integer} [$startTime=0] a timestamp
	 * @param {integer} [$endTime=0] a timestamp
	 * @param {array} [$data] Can pass extra data here
	 */
	function __construct($permissions, $startTime = 0, $endTime = 0, $data = array())
	{
		$this->permissions = $permissions;
		$this->startTime = $startTime;
		$this->endTime = $endTime;
		if (is_array($data)) {
			$this->data = $data;
		}
	}
	
	function addPermission($permission)
	{
		if (is_array($permission)) {
			$this->permissions = array_merge($this->permissions, $permission);
		} else {
			$this->permissions[] = $permission;
		}
		$this->permissions = array_unique($this->permissions);
		return $this;
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
		// the capability array will be flat, so the data can't use
		// any of the reserved keys "permissions", "startTime", en"dTime
		return Q_Utils::sign(array_merge(array(
			'permissions' => $this->permissions,
			'startTime' => $this->startTime ? $this->startTime : 0,
			'endTime' => $this->endTime ? $this->startTime : 0
		), $this->data));
	}

	function serialize()
	{
		return Q::json_encode($this->exportArray());
	}

	static function unserialize($serialized)
	{
		$requiredFields = array('signature');
		$arr = Q::json_decode($serialized, true);
		if (!Q_Valid::requireFields($requiredFields, $arr)
		or !Q_Valid::capability($arr)) {
			return false;
		}
		$f = Q::take($arr, array(
			'permissions' => array(),
			'startTime' => 0,
			'endTime' => 0
		));
		extract($fields);
		$data = $arr;
		unset($data['permissions']);
		unset($data['startTime']);
		unset($data['endTime']);
		return new Q_Capability(
			$f['permissions'], $f['startTime'], $f['endTime'], $data
		);
	}

	function isValid()
	{
		return Q_Valid::capability($this);
	}
	
	public $permissions = array();
	public $startTime = null;
	public $endTime = null;
	public $data = array();
}

<?php

/**
 * @module Users
 */

/**
 * Class representing Web3 app user.
 *
 * @class Users_ExternalTo_Web3
 * @extends Users_ExternalTo
 */
class Users_ExternalTo_Web3 extends Users_ExternalTo implements Users_ExternalTo_Interface
{

	/**
	 * Calls getAddresses(roleIds) on CommunityContract
	 * located at $this->xid
	 * @method fetchXids
	 * @param {array} $suffixes
	 * @param {array} [$options=array()]
	 * @param {string} [$options.pathABI] optionally override the default ABI
	 * @return {array} an array of (externalLabel => xids) pairs
	 */
	function fetchXids($suffixes, $options = array())
	{
		$roleIds = array();
		foreach ($suffixes as $s) {
			$roleIds = (int)$s;
		}
		$pathABI = Q::ifset($options, 'pathABI', 'Users/templates/R1/Community/contract');
		$results = Users_Web3::execute($pathABI, $this->xid, 'getAddresses', array($roleIds));
		foreach ($results as $suffix => $xids) {
			$externalLabel = Users_Label::external($this->platformId, $this->appId, $suffix);
			$results[$externalLabel] = $xids;
		}
		return $results;
	}

}
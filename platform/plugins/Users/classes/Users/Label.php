<?php
/**
 * @module Users
 */
/**
 * Class representing 'Label' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a label row in the Users database.
 *
 * @class Users_Label
 * @extends Base_Users_Label
 */
class Users_Label extends Base_Users_Label
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
	 * Add a contact label
	 * @method {boolean} addLabel
	 * @static
	 * @param {string|array} $label A label or array of labels
	 * @param {string} [$userId=null] user current user if not provided
	 * @param {string} [$title=''] specify the title, otherwise a default one is generated
	 * @param {string} [$icon='default']
	 * @param {string} [$asUserId=null] The user to do this operation as.
	 *   Defaults to the logged-in user. Pass false to skip access checks.
	 * @param boolean [$unlessExists=false] If true, skips adding label if it already exists
	 *   in the database.
	 * @return {Users_Label}
	 */
	static function addLabel(
		$label, 
		$userId = null, 
		$title = '', 
		$icon = 'default',
		$asUserId = null,
		$unlessExists = false)
	{
		if (is_array($label)) {
			foreach ($label as $l) {
				self::addLabel($l, $userId, $title, $icon, $asUserId, $unlessExists);
			}
			return;
		}
		if (!isset($title)) {
			$title = '';
		}
		if (!isset($icon)) {
			$icon = 'default';
		}
		if (!isset($userId)) {
			$user = Users::loggedInUser(true);
			$userId = $user->id;
		}
		Users::canManageLabels($asUserId, $userId, $label, true);
		if (empty($title)) {
			$parts = explode("/", $label);
			$title = ucfirst(end($parts));
		}
		$l = new Users_Label();
		$l->label = $label;
		$l->userId = $userId;
		if ($l->retrieve() and $unlessExists) {
			return $l;
		}
		self::_icon($l, $icon, $userId);
		$l->title = $title;
		$l->icon = $icon;
		$l->save(true); 
		return $l;
	}
	
	/**
	 * Update labels
	 * @method updateLabel
	 * @static
	 * @param {string} $label
	 * @param {array} $updates Can contain one or more of "title", "icon"
	 * @param {string} [$userId=null] User that owns the label, current user if not provided
	 * @param {string} [$asUserId=null] The user to do this operation as.
	 *   Defaults to the logged-in user. Pass false to skip access checks.
	 * @throws {Users_Exception_NotAuthorized}
	 * @return {Db_Query_Mysql}
	 */
	static function updateLabel($label, $updates, $userId = null, $asUserId = null)
	{
		foreach (array('userId', 'label', 'updates') as $field) {
			if (empty($$field)) {
				throw new Q_Exception_RequiredField(compact($field));
			}
		}
		if (!isset($userId)) {
			$user = Users::loggedInUser(true);
			$userId = $user->id;
		}
		Users::canManageLabels($asUserId, $userId, $label, true);
		$l = new Users_Label();
		$l->userId = $userId;
		$l->label = $label;
		if (!$l->retrieve()) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'Label',
				'criteria' => json_encode($l->fields)
			));
		}
		if (isset($updates['title'])) {
			$l->title = $title;
		}
		$icon = Q::ifset($updates, 'icon', null);
		self::_icon($l, $icon, $userId);
		$l->save();
		return $l;
	}

	/**
	 * Remove label
	 * @method removeLabel
	 * @static
	 * @param {string} $label
	 * @param {string|null} [$userId=null]
	 *   The user whose label is to be removed
	 * @param {string} [$asUserId=null] The user to do this operation as.
	 *   Defaults to the logged-in user. Pass false to skip access checks.
	 * @return {Db_Query_MySql}
	 */
	static function removeLabel($label, $userId = null, $asUserId = null)
	{
		if (!isset($userId)) {
			$user = Users::loggedInUser(true);
			$userId = $user->id;
		}
		Users::canManageLabels($asUserId, $userId, $label, true);
		$label = new Users_Label();
		$label->userId = $userId;
		$label->label = $label;
		$label->remove();
	}
	
	/**
	 * Fetch an array of labels. By default, returns all the labels.
	 * @method fetch
	 * @param {string} [$userId=null] The id of the user whose contact labels should be fetched
	 * @param {string|Db_Expression} [$filter=''] Pass a string prefix such as "Users/", or some db expression, to get only a particular subset of labels.
	 * @param {boolean} [$checkContacts=false] Whether to also look in the Users_Contact table and only return labels that have at least one contact.
	 * @return {array} An array of array(label => title) pairs
	 */
	static function fetch($userId = null, $filter = '', $checkContacts = false)
	{
		if (!isset($userId)) {
			$user = Users::loggedInUser(true);
			$userId = $user->id;
		}
		$criteria = array('userId' => $userId);
		if ($filter) {
			$criteria['label'] = is_string($filter)
				? new Db_Range($filter, true, false, null)
				: $filter;
		}
		if ($checkContacts) {
			$contact_array = Users_Contact::select('*')
				->where($criteria)
				->groupBy('userId, label')
				->fetchDbRows();
		}
		$labels = Users_Label::select('*')
			->where($criteria)
			->fetchDbRows(null, null, 'label');
		$icons = array();
		if (!$checkContacts) {
			return $labels;
		}
		$contacts = array();
		foreach ($contact_array as $contact) {
			$contacts[$contact->label] = $contact->label;
		}
		foreach ($labels as $label) {
			if (!isset($contacts[$label->label])) {
				unset($labels[$label->label]);
			}
		}
		return $labels;
	}
	
	static function _icon($l, $icon, $userId)
	{
		if (!is_array($icon)) {
			if ($icon) {
				$l->icon = $icon;
			}
			return;
		}
		// Process any icon data
		$icon['path'] = 'uploads/Users';
		$icon['subpath'] = "$userId/label/$label/icon";
		$data = Q::event("Q/image/post", $icon);
		Q_Response::setSlot('icon', $data);
		$l->icon = Q_Request::baseUrl().'/'.$data[''];
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Label} Class instance
	 */
	static function __set_state(array $array)
	{
		$result = new Users_Label();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};
<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Stream' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a stream row in the Streams database.
 *
 * @class Streams_Stream
 * @extends Base_Streams_Stream
 */
class Streams_Stream extends Base_Streams_Stream
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		$this->hasMany('categories', array(
			'rt' => 'Streams_RelatedTo',
			'c' => 'Streams_Stream'
		), array(
			'{$this}.publisherId' => 'rt.fromPublisherId',
			'{$this}.name' => 'rt.fromStreamName'
		), array(
			'rt.toPublisherId' => 'c.publisherId',
			'rt.toStreamName' => 'c.name'
		));
		parent::setUp();
	}


	/**
	 * Defaults for stream
	 * @property $DEFAULTS
	 * @type {array}
	 * @static
	 */
	/**
	 * @config $DEFAULTS['type']
	 * @type string
	 * @default 'chat'
	 * @final
	 */
	/**
	 * @config $DEFAULTS['title']
	 * @type string
	 * @default empty
	 * @final
	 */
	/**
	 * @config $DEFAULTS['icon']
	 * @type string
	 * @default empty
	 * @final
	 */
	/**
	 * @config $DEFAULTS['content']
	 * @type string
	 * @default empty
	 * @final
	 */
	/**
	 * @config $DEFAULTS['attributes']
	 * @type string
	 * @default empty
	 * @final
	 */
	/**
	 * @config $DEFAULTS['readLevel']
	 * @type string
	 * @default Streams::$READ_LEVEL['messages']
	 * @final
	 */
	/**
	 * @config $DEFAULTS['writeLevel']
	 * @type string
	 * @default Streams::$WRITE_LEVEL['join']
	 * @final
	 */
	/**
	 * @config $DEFAULTS['adminLevel']
	 * @type string
	 * @default Streams::$ADMIN_LEVEL['invite']
	 * @final
	 */
	/**
	 * @config $DEFAULTS['messageCount']
	 * @type integer
	 * @default 0
	 * @final
	 */
	/**
	 * @config $DEFAULTS['invitedCount']
	 * @type integer
	 * @default 0
	 * @final
	 */
	/**
	 * @config $DEFAULTS['participatingCount']
	 * @type integer
	 * @default 0
	 * @final
	 */
	/**
	 * @config $DEFAULTS['leftCount']
	 * @type integer
	 * @default 0
	 * @final
	 */
	public static $DEFAULTS = array(
		'type' => 'Streams/text',
		'title' => 'Untitled',
		'icon' => 'default',
		'content' => '',
		'attributes' => '',
		'readLevel' => 40,
		'writeLevel' => 10,
		'adminLevel' => 20,
		'messageCount' => 0,
		'invitedCount' => 0,
		'participatingCount' => 0,
		'leftCount' => 0
	);

	/**
	 * Fetches one stream from the database.
	 * @method fetch
	 * @static
	 * @param {string} $asUserId
	 *  Set this to the user for which you are fetching the streams.
	 *  If this matches the publisherId, just returns the streams.
	 *  If this is '', only returns the streams anybody can see.
	 *  Otherwise, return the streams joined with the calculated access settings.
	 *  If you pass null here, then either the logged-in user's id or '' will be used.
	 * @param {string} $publisherId
	 *  The id of the user publishing these streams
	 * @param {string|array|Db_Range} $name
	 *  The name of the stream to fetch. Can end in "/" for template streams.
	 *  Also it can be an array of stream names, or a custom Db_Range for stream names
	 * @param {string|boolean} $fields='*'
	 *  Must include "publisherId" and "name" fields, since they
	 *  make up the primary key of the stream table.
	 *  Pass true here to throw an exception if the stream is missing.
	 * @param {array} $options=array()
	 *  Provide additional query options like 'limit', 'offset', 'orderBy', 'where' etc.
	 *  See Db_Query_Mysql::options().
	 *  @param {boolean|string} [$options.begin] This can be used to begin a transaction,
	 *   it is passed to Db_Row->retrieve() but only when fetching one stream.
	 *   Later on, you should tell $stream->save() or $stream->changed() to commit the transaction.
	 *  @param {boolean} [$options.refetch] Ignore cache of previous calls to fetch, 
	 *   and save a new cache if necessary.
	 *  @param {boolean} [$options.dontCache] Do not cache the results of
	 *   fetching the streams
	 *  @param {boolean} [$options.withParticipant] Additionally call ->set('participant', $p)
	 *   on the stream object, with the participant object corresponding to $asUserId, if any.
	 *  @param {array} [$options.withMessageTotals]
	 *   Pass an array of arrays ($streamName => $messageTypes) here
	 *   to additionally call ->set('messageTotals', $t) on the stream objects.
	 *  @param {array} [$options.withRelatedToTotals]
	 *	 pass array('withRelatedToTotals' => array('streamName' => true)) for all rows
	 *	 pass array('withRelatedToTotals' => array('streamName' => array('relationType', ...))) for particular rows
	 *   to additionally call ->set('relatedToTotals', $t) on the stream objects.
	 *  @param {array} [$options.withRelatedFromTotals]
	 *	 pass array('withRelatedFromTotals' => array('streamName' => true)) for all rows
	 *	 pass array('withRelatedFromTotals' => array('streamName' => array('relationType', ...))) for particular rows
	 *   to additionally call ->set('relatedFromTotals', $t) on the stream objects.
	 *  @param {reference} $results=array()
	 *   pass an array here, to be filled with intermediate results you might want to use
	 * @return {Streams_Stream|null}
	 *  Returns a Streams_Stream object with access info calculated
	 *  specifically for $asUserId . Make sure to call the methods 
	 *  testReadLevel(), testWriteLevel() and testAdminLevel()
	 *  on these streams before using them on the user's behalf.
	 * @throws {Q_Exception_MissingRow} If the stream is missing and $fields == true
	 */
	static function fetch(
		$asUserId,
		$publisherId,
		$name,
		$fields = '*',
		$options = array(),
		&$results = array())
	{
		$options['limit'] = 1;
		$throwIfMissing = false;
		if ($fields === true) {
			$throwIfMissing = true;
			$fields = '*';
		}
		$streams = Streams::fetch(
			$asUserId, $publisherId, $name, 
			$fields, $options, $results
		);
		if (empty($streams)) {
			if ($throwIfMissing) {
				throw new Q_Exception_MissingRow(array(
					'table' => 'Stream', 
					'criteria' => Q::json_encode(@compact('publisherId', 'name'))
				));
			}
			return null;
		}
		return reset($streams);
	}

	/**
	 * Fetch and return a stream if it is already in the database,
	 * otherwise create it in the database and then return it.
	 * May throw Users_Exception_NotAuthorized if stream doesn't exist
	 * and asUserId is not authorized to create this stream.
	 * @method fetchOrCreate
	 * @static
	 * @param {string} $asUserId used for fetchOne and create functions
	 * @param {string} $publisherId used for fetchOne and create functions
	 * @param {string} $name used for fetchOne and create functions
	 * @param {array} [$options] to pass to fetchOne. Also the following options to be used with stream creation:
	 * @param {boolean|array} [$options.subscribe] pass true to autosubscribe 
	 *   to the stream right after creating it. You can also pass an array of options 
	 *   that will be passed to the subscribe function.
	 * @param {array} [$options.fields] to pass to create function,
	 *   if you want to set some fields besides "name".
	 * @param {array} [$options.relate] to pass to create function,
	 *   if you want to relate the newly created stream to a category
	 * @param {array} [$options.type] to pass to create function,
	 *   not required if the stream is described in Streams::userStreams (streams.json files)
	 * @param {reference} [$results=array()] pass an array to fill with intermediate results
	 *   such as "created" => boolean
	 * @return {Streams_Stream|null} Returns the created stream, if any
	 * @throws {Users_Exception_NotAuthorized}
	 */
	static function fetchOrCreate(
		$asUserId,
		$publisherId,
		$name,
		$options = array(),
		&$results = array())
	{
		$stream = Streams::fetchOne($asUserId, $publisherId, $name, '*', $options, $results);
		$results['created'] = false;
		if ($stream) {
			return $stream;
		}
		$fields = Q::ifset($options, 'fields', array());
		$fields['name'] = $name;
		$stream = Streams::create($asUserId, 
			$publisherId, 
			Q::ifset($options, 'type', Q::ifset($options, 'fields', 'type', null)),
			$fields, 
			Q::ifset($options, 'relate', null),
			$relateResults
		);
		if (!$stream) {
			return null;
		}
		if (is_array($results)) {
			$results['related'] = $relateResults;
		}
		if (!empty($options['subscribe'])) {
			$so = is_array($options['subscribe'])
				? $options['subscribe']
				: array('skipAccess' => true);
			$so['userId'] = $asUserId;
			$results['participant'] = $stream->subscribe($so);
		}
		$results['created'] = true;
		return $stream;
	}
	
	/**
	 * Whether stream was published by fetcher
	 * @property $publishedByFetcher
	 * @type {boolean}
	 * @protected
	 */
	protected $publishedByFetcher = false;
	
	/**
	 * Invites a user (or a future user) to this stream
	 * @method invite
	 * @static
	 * @param {array} $who Array that can contain the following keys:
	 * @param {string|array} [$who.userId] user id or an array of user ids
	 * @param {string} [$who.platform] platform for which xids are passed
	 * @param {string} [$who.appId] id of platform app for which xids are passed
	 * @param {string|array} [$who.xid]  platform xid or array of xids
	 * @param {string|array} [$who.label]  label or an array of labels, or tab-delimited string
	 * @param {string|array} [$who.identifier]  identifier or an array of identifiers, or tab-delimited string
	 * @param {integer} [$who.newFutureUsers] the number of new Users_User objects to create via Users::futureUser in order to invite them to this stream. This typically is used in conjunction with passing the "html" option to this function.
	 * @param {boolean} [$who.token=false] pass true here to save a Streams_Invite row
	 *  with empty userId, which is used whenever someone shows up with the token
	 *  and presents it via "Q.Streams.token" querystring parameter.
	 *  See the Streams/before/Q_objects.php hook for more information.
	 * @param {array} [$options=array()]
	 *  @param {string|array} [$options.addLabel] label or an array of ($label => array($title, $icon)) for adding publisher's contacts
	 *  @param {string|array} [$options.addMyLabel] label or an array of ($label => array($title, $icon)) for adding asUserId's contacts
	 *  @param {string|integer} [$options.readLevel] the read level to grant those who are invited
	 *  @param {string|integer} [$options.writeLevel] the write level to grant those who are invited
	 *  @param {string|integer} [$options.adminLevel] the admin level to grant those who are invited
	 *  @param {array} [$options.permissions] array of additional permissions to grant
	 *	@param {string} [$options.displayName] the display name to use to represent the inviting user
	 *  @param {string} [$options.appUrl] Can be used to override the URL to which the invited user will be redirected and receive "Q.Streams.token" in the querystring.
	 *	@param {array} [$options.html] an array of ($template, $batchName) such as ("MyApp/foo.handlebars", "foo") for generating html snippets which can then be viewed from and printed via the action Streams/invitations?batchName=$batchName&invitingUserId=$asUserId&limit=$limit&offset=$offset
	 * @param {string} [$options.asUserId=Users::loggedInUser(true)->id] Invite as this user id, defaults to logged-in user
	 * @param {boolean} [$options.skipAccess] whether to skip access checks when adding labels and contacts
	 * @see Users::addLink()
	 * @return {array} Returns array with keys 
	 *  "success", "userIds", "statuses", "identifierTypes", "alreadyParticipating".
	 *  The userIds array contains userIds from "userId" first, then "identifiers", "xids", "label",
	 *  then "newFutureUsers". The statuses is an array of the same size and in the same order.
	 *  The identifierTypes array is in the same order as well.
	 *  If the "token" option was set to true, the array also contains the "invite"
	 *  key pointing to a Streams_Invite object that was saved in the database
	 *  (whose userId field is empty because anyone with the token may accept this invite).
	 */
	function invite($who, $options = array())
	{
		return Streams::invite($this->publisherId, $this->name, $who, $options);
	}

	private static function sortTemplateTypes(
		$templates, 
		$userField, 
		&$templateType, 
		$nameField = 'streamName'
	) {
		$returnAll = ($templateType === true);
		$ret = array(array(), array(), array(), array());
		if (!$templates) {
			$templateType = -1;
			return $returnAll ? $ret : null;
		}
		// The order of the templates will be from most specific to most generic:
		// 	0. exact stream name and exact publisher id - this would be the row itself
		//	1. generic stream name and exact publisher id
		//	2. exact stream name and generic publisher
		//	3. generic stream name and generic publisher
		// Note: Only -1, 1 and 3 are possible values stored in $templateType
		// since templates are always selected ending in "/"
		foreach ($templates as $t) {
			$name = $t->$nameField;
			$pos = strlen($name) - 1;
			if ($t->$userField === '') {
				$key = ($name[$pos] === '/' ? 3 : 2); // generic publisher;
			} else {
				$key = ($name[$pos] === '/' ? 1 : 0); // $userId
			}
			$ret[$key][] = $t;
		}

		if ($returnAll) {
			// we are looking for all templates
			return $ret;
		}
		// we are looking for exactly one template
		for ($i=0; $i<4; $i++) {
			if (!empty($ret[$i][0])) {
				$templateType = $i;
				return $ret[$i][0];
			}
		}
		return null;
	}

	/**
	 * Retrieves one Streams_Stream based on a hexString previously generated by
	 * Streams::toHexString
	 * @param {string} $asUserId Fetch stream as this user
	 * @param {string} $hexString Should start with "0x"
	 * @param {bool} [$hasSeriesId=false] Set to true if it was produced with a seriesId,
	 *  so streamId will be recovered in the form "34/abcdef"
	 * @return {Streams_Stream|null} Returns the stream, or null if not found
	 */
	static function fromHexString($asUserId, $hexString, $hasSeriesId = false)
	{
		if (substr($hexString, 0, 2) === '0x') {
			$hexString = substr($hexString, 2);
		}
		if ($hasSeriesId) {
			$publisherHex = substr($hexString, 0, 14);
			$seriesHex = substr($hexString, 14, 2);
			$seriesId = hexdec($seriesHex);
		} else {
			$publisherHex = substr($hexString, 0, 16);
		}
		$streamHex = substr($hexString, 16);
		$publisherId = Q_Utils::hex2asc($publisherHex);
		$streamIdPrefix = Q_Utils::hex2asc($streamHex);
		if ($hasSeriesId) {
			$streamIdPrefix = "$seriesId/$streamIdPrefix";
		}
		return Streams_Stream::fetch($asUserId, $publisherId, new Db_Range(
			$streamIdPrefix, true, false, true
		));
	}

	/**
	 * Converts the publisherId and the first 24 characters of
	 * an ID that is typically used as the final segment in a streamName
	 * to a hex string starting with "0x" representing a uint256 type.
	 * Both inputs are padded by 0's on the right in the hex string.
	 * For example Streams::toHexString("abc", "def") returns
	 * 0x6162630000000000646566000000000000000000000000000000000000000000
	 * while Streams::toHexString("abc", "123/def") returns
	 * 0x616263000000007b646566000000000000000000000000000000000000000000
	 * @param {string} $publisherId Takes the first 8 ASCII characters
	 * @param {string|integer} $streamId Takes the first 24 ASCII characters, or an unsigned integer up to PHP_INT_MAX
	 *  If the $streamId contains a slash, then the first part is interpreted as an unsigned integer up to 255,
	 *  and determines the 15th and 16th hexit in the string. This is typically used for "seriesId" under a publisher.
	 * @param {boolean} [$isNotNumeric=null] Set to true to encode $streamId as an ASCII string, even if it is numeric
	 * @return {string} A hex string starting with "0x..." followed by 16 hexits and then 24 hexits.
	 */
	function toHexString($isNotNumeric = null)
	{
		$parts = explode('/', $this->name);
		$streamId = end($parts);
		$c = count($parts);
		if (!$isNotNumeric
		and $c > 2 and is_numeric($parts[$c-2])
		and floor($parts[$c-2]) == $parts[$c-2]) {
			// second-to-last segment is an integer
			$streamId = $parts[$c-2] . '/' . $streamId;
		}
		return Streams::toHexString($this->publisherId, $this->name, $isNotNumeric);
	}

	/**
	 * @method getStreamTemplate
	 * @static
	 * @param {string} $publisherId The publisher of the stream
	 * @param {string} $streamType The type of the stream
	 * @param {string} $className The class extending Db_Row to fetch from the database
	 * @param {&integer} [$templateType=null] Gets filled with the template type 0-4. 
	 *   Set to true to return all templates.
	 * @return {Streams_Stream|array} Returns the template stream, 
	 *   or an array if $templateType is true
	 */
	static function getStreamTemplate(
		$publisherId, 
		$streamType, 
		$className, 
		&$templateType = null
	) {
		// fetch template for stream's PK - publisher & name
		// if $templateType == true return all found templates sorted by type,
		// otherwise return one template and its type
		$field = ($className === 'Streams_Stream' ? 'name' : 'streamName');
		$rows = call_user_func(array($className, 'select'))
			->where(array(
				'publisherId' => array('', $publisherId), // generic or specific publisher
				$field => $streamType.'/'
			))->fetchDbRows();
		return self::sortTemplateTypes($rows, 'publisherId', $templateType, $field);
	}
	
	/**
	 * @method getSubscriptionTemplate
	 * @static
	 * @param {string} $publisherId The publisher of the stream
	 * @param {string} $streamType The type of the stream
	 * @param {string} $className The class extending Db_Row to fetch from the database
	 * @param {string} $ofUserId The id of the possible subscriber
	 * @param {&integer} [$templateType=null] Gets filled with the template type 0-4. 
	 *   Set to true to return all templates.
	 * @return {Streams_Subscription|array} Returns the template subscription, 
	 *   or an array if $templateType is true
	 */
	static function getSubscriptionTemplate(
		$publisherId, 
		$streamType, 
		$className, 
		$ofUserId, 
		&$templateType = null
	) {
		// fetch template for subscription's PK - publisher, name & user
		$rows = call_user_func(array($className, 'select'))
			->where(array(
				'publisherId' => $publisherId,
				'streamName' => $streamType.'/', // generic or specific stream name
				'ofUserId' => array('', $ofUserId) // generic or specific subscriber user
			))->fetchDbRows();
		return self::sortTemplateTypes($rows , 'ofUserId', $templateType, 'streamName');
	}

	/**
	 * Does necessary preparations for saving a stream in the database.
	 * @method beforeSave
	 * @param {array} $modifiedFields
	 *	The array of fields
	 * @return {array}
	 * @throws {Exception}
	 *	If mandatory field is not set
	 */
	function beforeSave($modifiedFields)
	{
		if (empty($this->attributes)) {
			$this->attributes = null;
		}
		if (empty($this->permissions)) {
			$this->permissions = null;
		}
		if (isset($this->attributes)
		and !is_string($this->attributes)) {
			throw new Q_Exception_WrongType(array(
				'field' => 'attributes',
				'type' => 'string'
			));
		}

		/**
		 * @event Streams/Stream/save/$streamType {before}
		 * @param {Streams_Stream} stream
		 * @param {array} modifiedFields reference to modifiedFields array
		 * @return {false} To cancel further processing
		 */
		$params = array('stream' => $this, 'modifiedFields' => &$modifiedFields);
		if (false === Q::event(
			"Streams/Stream/save/{$this->type}", $params, 'before'
		)) {
			return false;
		}

		// Generate a unique name for the stream
		if (!isset($modifiedFields['name']) and !isset($this->name)) {
			$this->name = $modifiedFields['name'] = Streams::db()->uniqueId(
				Streams_Stream::table(), 'name',
				array('publisherId' => $this->publisherId),
				array('prefix' => $this->type.'/Q')
			);
		}

		if (isset($this->title) and is_array($this->title)) {
			$this->title = Q::interpolate($this->title); // fetch from text files
		}
		if (isset($this->content) and is_array($this->content)) {
			$this->content = Q::interpolate($this->content); // fetch from text files
		}

		if (!$this->retrieved) {
			foreach (array('messageCount', 'invitedCount', 'participatingCount') as $f) {
				if (!isset($this->$f)) {
					$this->$f = 0;
				}
			}
			// we don't want user to update private fields but will set initial values to them
			$privateFieldNames = self::getConfigField($this->type, 'private', array());
			// magic fields are handled by parent method
			$magicFieldNames = array('insertedTime', 'updatedTime', 'name');
			$privateFieldNames = array_diff($privateFieldNames, $magicFieldNames);

			$streamTemplate = self::getStreamTemplate(
				$this->publisherId, $this->type, 'Streams_Stream'
			);
			$fieldNames = Streams_Stream::fieldNames();

			if ($streamTemplate) {
				// if template exists copy all non-PK and non-magic fields from template
				foreach (array_diff(
					$fieldNames,
					$this->getPrimaryKey(),
					$magicFieldNames
				) as $field) {
					if (in_array($field, $privateFieldNames)
					|| !array_key_exists($field, $modifiedFields)) {
						$this->$field = $modifiedFields[$field] = $streamTemplate->$field;
					}
				}
			} else {
				// otherwise (no template) set all private fields to defaults
				foreach ($privateFieldNames as $field) {
					$defaults = self::getConfigField(
						$this->type, 'defaults', Streams_Stream::$DEFAULTS
					);
					$this->$field = $modifiedFields[$field]
						= Q::ifset($defaults, $field, null);
				}
			}

			// Assign default values to fields that haven't been set yet
			foreach (array_diff($fieldNames, $magicFieldNames) as $field) {
				if (!array_key_exists($field, $this->fields)
				and !array_key_exists($field, $modifiedFields)) {
					$defaults = self::getConfigField(
						$this->type, 'defaults', Streams_Stream::$DEFAULTS
					);
					$this->$field = $modifiedFields[$field]
						= Q::ifset($defaults, $field, null);
				}
			}

			// Get all access templates and save corresponding access
			$templateType = true;
			$accessTemplates = self::getStreamTemplate(
				$this->publisherId, $this->type, 'Streams_Access', $templateType
			);
			for ($i=1; $i<=3; ++$i) {
				foreach ($accessTemplates[$i] as $template) {
					$access = new Streams_Access();
					$access->copyFrom($template->toArray());
					$access->publisherId = $this->publisherId;
					$access->streamName = $this->name;
					if (!$access->save(true)) {
						return false; // JUNK: this leaves junk in the database, but preserves consistency
					}
				}
			}

			/**
			 * @event Streams/create/$streamType {before}
			 * @param {Streams_Stream} stream
			 */
			Q::event("Streams/create/{$this->type}", array(
				'stream' => $this,
			), 'before', false, $this);
		}
		
		foreach ($this->fields as $name => $value) {
			if (!empty($this->fieldsModified[$name])) {
				$modifiedFields[$name] = $value;
			}
		}

		// any remaining unset fields are filled with config defaults for this stream type
		$fieldNames = Streams::getExtendFieldNames($this->type);
		$defaults = Streams_Stream::getConfigField(
			$this->type, 'defaults', Streams_Stream::$DEFAULTS
		);
		foreach ($fieldNames as $f) {
			if (!isset($this->$f) && array_key_exists($f, $defaults)) {
				$this->$f = $defaults[$f];
			}
		}

		$this->beforeSaveExtended($modifiedFields);
		return parent::beforeSave($modifiedFields);
	}

	function afterFetch($result)
	{		
		/**
		 * @event Streams/Stream/retrieve/$streamType {before}
		 * @param {Streams_Stream} stream
		 * @return {false} To cancel further processing
		 */
		$params = array('stream' => $this, 'result' => $result);
		if (false === Q::event(
			"Streams/Stream/fetch/{$this->type}", $params, 'after'
		)) {
			return false;
		}
	}
	
	/**
	 * @method afterSaveExecute
	 * @param {Db_Result} $result
	 * @param {Db_Query} $query
	 * @return {Db_Result}
	 */
	function afterSaveExecute($result, $query, $modifiedFields, $where)
	{
		$stream = $this;

		$asUserId = $stream->get('asUserId', $stream->get('createdAsUserId', null));
		if (!$asUserId) {
			$user = Users::loggedInUser(false, false);
			$asUserId = $user ? $user->id : '';
		}

		$stream->calculateAccess($asUserId);
		$stream->updateRelations($asUserId);
		
		if ($stream->inserted) {
			// The stream was just saved
			Q_Utils::sendToNode(array(
				"Q/method" => "Streams/Stream/create",
				"stream" => Q::json_encode($stream->toArray())
			));

			/**
			 * @event Streams/create/$streamType {after}
			 * @param {Streams_Stream} stream
			 * @param {string} asUserId
			 */
			Q::event("Streams/create/{$stream->type}",
				@compact('stream', 'asUserId'), 'after', false, $stream);
		}

		/**
		 * @event Streams/Stream/save/$streamType {after}
		 * @param {Streams_Stream} stream
		 * @param {string} 'asUserId'
		 */
		$params = array('stream' => $this);
		Q::event("Streams/Stream/save/{$this->type}", $params, 'after');
		
		// Assume that the stream's name is not being changed
		$fields = array(
			'Streams/user/firstName' => false,
			'Streams/user/lastName' => false,
			'Streams/user/gender' => false,
			'Streams/user/username' => 'username',
			'Streams/user/icon' => 'icon'
		);
		if (!isset($fields[$this->name])) {
			return $result;
		}
		$field = ($this->name === 'Streams/user/icon')
			? 'icon'
			: 'content';
		$wasModified = !empty($this->fieldsModified[$field])
			or !empty($this->fieldsModified['readLevel']);
		if (!$wasModified) {
			return $result;
		}
		
		$publicField = $fields[$this->name];
		if ($publicField = $fields[$this->name]
		and !Q::eventStack('Db/Row/Users_User/saveExecute')) {
			Streams::$beingSaved[$publicField] = $this;
			try {
				$user = Users_User::fetch($this->publisherId, true);
				$user->$publicField = $modifiedFields[$field];
				$user->save(false, false, true);
			} catch (Exception $e) {
				Streams::$beingSaved[$publicField] = array();
				throw $e;
			}
			Streams::$beingSaved[$publicField] = array();
			return Streams::$beingSavedQuery;
		}

		if ($this->retrieved and !$publicField) {
			// Update all avatars corresponding to access rows for this stream
			$taintedAccess = Streams_Access::select()
				->where(array(
					'publisherId' => $this->publisherId,
					'streamName' => $this->name
				))->fetchDbRows();
			Streams_Avatar::updateAvatars($this->publisherId, $taintedAccess, $this, true);
		}

		return $result;
	}
	
	/**
	 * Get the max size of a field in the stream or extended row
	 * @param {string} $field The name of the field
	 * @return {integer} The maximum size that a value of that field can take
	 */
	function maxSizeExtended($field)
	{
		$fieldNames = $this->fieldNames();
		if (in_array($field, $fieldNames)) {
			if (method_exists($this, "maxSize_$field")) {
				return call_user_func(array($this, "maxSize_$field"));
			}
		}
		$classes = Streams::getExtendClasses($this->type);
		foreach ($classes as $k => $v) {
			foreach ($v as $f) {
				if ($f === $field and method_exists($this->rows[$k], "maxSize_$field")) {
					return call_user_func(array($this->rows[$k], "maxSize_$field"));
				}
			}
		}
		return null;
	}
	
	/**
	 * @method afterRemoveExcecute
	 * @param {Db_Result} $result
	 * @param {Db_Query} $query
	 * @return {Db_Result}
	 */
	function afterRemoveExecute($result, $query)
	{
		$stream = $this;

		// if the above call threw an exception, then we will not be doing the following.
		Q_Utils::sendToNode(array(
			"Q/method" => "Streams/Stream/remove",
			"stream" => Q::json_encode($stream->toArray())
		));

		/**
		 * @event Streams/remove/$streamType {after}
		 * @param {Streams_Stream} stream
		 * @param {string} asUserId
		 */
		Q::event("Streams/remove/{$stream->type}", @compact('stream', 'result'), 'after');

		if ($this->name !== 'Streams/user/firstName'
		and $this->name !== 'Streams/user/lastName'
		and $this->name !== 'Streams/user/gender') {
			return $result;
		}
		
		// Update all avatars corresponding to access rows for this stream
		$taintedAccess = Streams_Access::select()
			->where(array(
				'publisherId' => $this->publisherId,
				'streamName' => $this->name
			))->fetchDbRows();
		Streams_Avatar::updateAvatars($this->publisherId, $taintedAccess, $this, true);

		return $result;
	}
	
	protected function beforeSaveExtended($modifiedFields)
	{
		$type = $this->type;
		$classes = Streams::getExtendClasses($type);
		$modified = array();
		foreach ($classes as $k => $v) {
			foreach ($v as $f) {
				if (!empty($this->fieldsModified[$f])) {
					$modified[$k] = true;
					break;
				}
			}
		}
		$retrieved = $this->wasRetrieved();
		$rows = array();
		foreach ($modified as $k => $v) {
			$row = $this->get($k, null);
			if (!$row) {
				$row = new $k;
				$row->publisherId = $this->publisherId;
				$row->streamName = $this->name;
			}
			if ($retrieved) {
				// re-fetch the extending row
				$row->retrieve(null, null, array('ignoreCache' => true));
			}
			foreach ($classes[$k] as $f) {
				if (!isset($modifiedFields[$f])) continue;
				if (isset($row->$f) and $row->$f === $modifiedFields[$f]) continue;
				$row->$f = $modifiedFields[$f];
				$this->$f = $row->$f;
			}
			$rows[$k] = $row;
		}
		$stream = $this;
		Q::event("$type/save", @compact('stream', 'rows'), 'before');
		foreach ($rows as $row) {
			$row->save();
		}
	}

	protected function _verifyUser ($options, &$user = null) {
		if (isset($options['userId'])) {
			$user = Users_User::fetch($options['userId'], true);
		} else {
			$user = Users::loggedInUser(true);
		}
		$stream = Streams_Stream::fetch($user->id, 
			$this->publisherId, $this->name, true, array('refetch' => true)
		);
		return $user->id;
	}
	
	/**
	 * @method getAllAttributes
	 * @param {boolean} $original whether to look in fieldsOriginal['attributes'] instead
	 * @return {array} The array of all attributes set in the stream
	 */
	function getAllAttributes($original = false)
	{
		$arr = $original ? $this->fieldsOriginal : $this->fields;
		return empty($arr['attributes']) 
			? array()
			: Q::json_decode($arr['attributes'], true);
	}
	
	/**
	 * @method getAttribute
	 * @param {string} $attributeName The name of the attribute to get
	 * @param {mixed} $default The value to return if the attribute is missing
	 * @param {boolean} $original whether to look in fieldsOriginal['attributes'] instead
	 * @return {mixed} The value of the attribute, or the default value, or null
	 */
	function getAttribute($attributeName, $default = null, $original = false)
	{
		$attr = $this->getAllAttributes($original);
		return isset($attr[$attributeName]) ? $attr[$attributeName] : $default;
	}
	
	/**
	 * @method setAttribute
	 * @param {string|array} $attributeName The name of the attribute to set,
	 *  or an array of $attributeName => $attributeValue pairs
	 * @param {mixed} $value The value to set the attribute to
	 * @return Streams_Stream
	 */
	function setAttribute($attributeName, $value = null)
	{
		$attr = $this->getAllAttributes();
		if (is_array($attributeName)) {
			foreach ($attributeName as $k => $v) {
				$attr[$k] = $v;
			}
		} else {
			$attr[$attributeName] = $value;
		}
		$this->attributes = Q::json_encode($attr);

		return $this;
	}

	/**
	 * @method clearAttribute
	 * @param {string} $attributeName The name of the attribute to remove
	 */
	function clearAttribute($attributeName)
	{
		$attr = $this->getAllAttributes();
		unset($attr[$attributeName]);
		$this->attributes = Q::json_encode($attr);
		return $this;
	}
	
	/**
	 * @method clearAllAttributes
	 */
	function clearAllAttributes()
	{
		$this->attributes = '{}';
		return $this;
	}
	
	/**
	 * @method getAllPermissions
	 * @return {array}
	 */
	function getAllPermissions()
	{
		if ($permissions = $this->permissions) {
			return Q::json_decode($permissions, true);
		}
		return array();
	}
	
	/**
	 * @method hasPermission
	 * @param {string} $permission
	 * @return {boolean}
	 */
	function hasPermission($permission)
	{
		return in_array($permission, $this->getAllPermissions());
	}
	
	/**
	 * @method addPermission
	 * @param {string} $permissions
	 */
	function addPermission($permission)
	{
		$permissions = $this->getAllPermissions();
		if (!in_array($permission, $permissions)) {
			$permissions[] = $permission;
			$this->permissions = Q::json_encode($permissions);
		}
	}
	
	/**
	 * @method removePermission
	 * @param {string} $permission
	 */
	function removePermission($permission)
	{
		$permissions = array_diff($this->getAllPermissions(), array($permission));
		$this->permissions = Q::json_encode($permissions);
	}
	
	/**
	 * Method is called before setting the field and verifies that, if it is a string,
	 * it contains a JSON array.
	 * @method beforeSet_attributes
	 * @param {string|array} $value
	 * @throws {Exception} An exception is thrown if $value is not string or is exceedingly long
	 */
	function beforeSet_attributes($value)
	{
		if (is_array($value)) {
			$value = Q::json_encode($value);
		}
		return parent::beforeSet_attributes($value);
	}
	
	/**
	 * Method is called before setting the field and verifies that, if it is a string,
	 * it contains a JSON array.
	 * @method beforeSet_permissions
	 * @param {string|array} $value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if $value is not string or is exceedingly long
	 */
	function beforeSet_permissions($value)
	{
		if (is_array($value)) {
			$value = Q::json_encode($value);
		}
		if (is_string($value)) {
			$decoded = Q::json_decode($value, true);
			if (!is_array($decoded) or Q::isAssociative($decoded)) {
				throw new Q_Exception_WrongValue(array('field' => 'permissions', 'range' => 'JSON array'));
			}
		}
		return parent::beforeSet_permissions($value);
	}
	
	/**
	 * If the user is not participating in the stream yet, 
	 * inserts a participant record and posts a "Streams/joined" or "Streams/visited" type message
	 * to the stream, depending on whether the user is already participating in the stream.
	 * Otherwise updates the participant record's timestamp and other things.
	 * Also relates every stream joined to streams named under the config field
	 * "Streams"/"types"/$streamType/"participating"
	 * @method join
	 * @param $options=array() {array} An associative array of options.
	 * @param {boolean} [$options.subscribed] If true, the user is set as subscribed
	 * @param {boolean} [$options.posted] If true, the user is set as subscribed
	 * @param {array} [$options.extra] Any extra information to tree-merge for the participant
	 * @param {string} [$options.userId] The user who is joining the stream. Defaults to the logged-in user.
	 * @param {boolean} [$options.noVisit] If user is already participating, don't post a "Streams/visited" message
	 * @param {boolean} [$options.skipAccess] If true, skip access check for whether user can join
	 * @return {Streams_Participant|null}
	 */
	function join($options = array())
	{
		$userId = $this->_verifyUser($options);
		$participants = Streams::join(
			$userId, $this->publisherId, array($this), $options
		);
		$participant = reset($participants);
		return $participant ? $participant : null;
	} 
	
	/**
	 * If the user is participating in the stream, sets state of participant row
	 * as "left" and posts a "Streams/left" type message to the stream.
	 * Also unrelates every stream left to streams named under the config field
	 * "Streams"/"types"/streamType/"participating"
	 * @method leave
	 * @param $options=array() {array} An associative array of options.
	 * @param {string} [$options.userId] The user who is leaving the stream. Defaults to the logged-in user.
	 * @param {array} [$options.extra] Any extra information to tree-merge for the participant
	 * @param {string} [$options.skipAccess] If true, skip access check for whether user can join
	 * @param $participant=null {reference}
	 *  Optional reference to a participant object that will be filled
	 *  to point to the participant object, if any.
	 * @return {Streams_Participant|null}
	 */
	function leave($options = array())
	{
		$userId = $this->_verifyUser($options);
		$participants = Streams::leave(
			$userId, $this->publisherId, array($this), $options
		);
		$participant = reset($participants);
		return $participant ? $participant : null;
	}

	/**
	 * Subscribe to the stream, to start receiving notifications.
	 * Posts a "Streams/subscribed" message to the stream.
	 * Also posts a "Streams/subscribed" message to user's "Streams/participating" stream.
	 *	If options are not given check the subscription templates:
	 *	1. generic publisher id and generic user
	 *	2. exact publisher id and generic user
	 *	3. generic publisher id and exact user
	 *	default is to subscribe to ALL messages.
	 *	If options are supplied - skip templates and use options.
	 * Using subscribe if subscription is already active will modify existing
	 * subscription - change type(s) or modify notifications
	 * @param {array} [$options=array()]
	 * @param {array} [$options.filter] optional array with two keys
	 * @param {array} [$options.filter.types] array of message types, if this is empty then subscribes to all types
	 * @param {array} [$options.filter.notifications=0] limit number of notifications, 0 means no limit
	 * @param {datetime} [$options.untilTime=null] time limit, if any for subscription
	 * @param {array} [$options.rule=array()] optionally override the rule for new subscriptions
	 * @param {array} [$options.rule.deliver=array('to'=>'default')] under "to" key,
	 *   named the field under Streams/rules/deliver config, which will contain the names of destinations,
	 *   which can include "email", "mobile", "email+pending", "mobile+pending"
	 * @param {datetime} [$options.rule.readyTime] time from which user is ready to receive notifications again
	 * @param {array} [$options.rule.filter] optionally set a filter for the rules to add
	 * @param {boolean} [$options.skipRules] if true, do not attempt to create rules for new subscriptions
	 * @param {boolean} [$options.skipAccess] if true, skip access check for whether user can join and subscribe
	 * @param {boolean} [$options.evenIfSubscribed] if true, posts another subscribe message
	 * @param {string} [$options.userId] the user subscribing to the stream. Defaults to the logged in user.
	 * @return {Streams_Participant|null}
	 */
	function subscribe($options = array())
	{
		$userId = $this->_verifyUser($options);
		if (empty($options['evenIfSubscribed'])
		and $participant = $this->participant($userId)
		and $participant->subscribed === 'yes') {
			return $participant;
		}
		$participants = Streams::subscribe(
			$userId, $this->publisherId, array($this), $options
		);
		$participant = reset($participants);
		return $participant ? $participant : null;
	}

	/**
	 * Unsubscribe from a stream, to stop receiving notifications.
	 * Posts a "Streams/unsubscribe" message to the stream.
	 * Also posts a "Streams/unsubscribed" message to user's "Streams/participating" stream.
	 * Does not change the actual subscription, but only the participant row.
	 * (When subscribing again, the existing subscription will be used.)
	 * @method unsubscribe
	 * @param $options=array() {array}
	 * @param {boolean} [$options.leave] set to true to also leave the streams
	 * @param {boolean} [$options.userId] the user who is unsubscribing from the stream. Defaults to the logged-in user.
	 * @param {boolean} [$options.skipAccess] if true, skip access check for whether user can join and subscribe
	 * @return {Streams_Participant|null}
	 */
	function unsubscribe($options = array())
	{
		$userId = $this->_verifyUser($options);
		$participants = Streams::unsubscribe(
			$userId, $this->publisherId, array($this), $options
		);
		$participant = reset($participants);
		return $participant ? $participant : null;
	}
	
	/**
	 * If the user is subscribed, get the Streams_Subscription object.
	 * Otherwise, returns false, or null if the user isn't logged in.
	 * @param {string} $ofUserId Defaults to logged-in user's id, if any.
	 * @return {Streams_Subscription|false|null}
	 */
	function subscription($ofUserId = null)
	{
		if (!isset($ofUserId)) {
			$user = Users::loggedInUser();
			if (!$user) {
				return null;
			}
			$ofUserId = $user->id;
		}
		$s = new Streams_Subscription();
		$s->publisherId = $this->publisherId;
		$s->streamName = $this->name;
		$s->ofUserId = $ofUserId;
		return $s->retrieve();
	}
	
	/**
	 * If the user is participating, get the Streams_Participant object.
	 * Otherwise, returns false, or null if the user isn't logged in.
	 * @param {string} $userId Defaults to logged-in user's id, if any.
	 * @return {Streams_Subscription|false|null}
	 */
	function participant($userId = null)
	{
		if (!isset($userId)) {
			$user = Users::loggedInUser();
			if (!$user) {
				return null;
			}
			$userId = $user->id;
		}
		$p = new Streams_Participant();
		$p->publisherId = $this->publisherId;
		$p->streamName = $this->name;
		$p->userId = $userId;
		return $p->retrieve();
	}

	/**
	 * Post a message to stream
	 * @method post
	 * @param {string} $asUserId
	 *  The user to post as
	 * @param {array} $message
	 *  The fields of the message. Also may include 'streamNames' field which is an array of additional
	 *  names of the streams to post message to.
	 * @param {booleam} $skipAccess=false
	 *  If true, skips the access checks and just posts the message.
	 * @param $options=array() {array}
	 * @return {array}
	 *  The array of results - successfully posted messages or false if post failed
	 */
	function post(
		$asUserId,
		$message,
		$skipAccess=false)
	{
		return Streams_Message::post(
			$asUserId,
			$this->publisherId,
			$this->name,
			$message,
			$skipAccess
		);
	}
	
	/**
	 * Take actions to reflect the stream has changed: save it and post a message.
	 * @method post
	 * @param {string} [$asUserId=null]
	 *  The user to post as. Defaults to the logged-in user.
	 * @param {boolean} [$commit=false] If this is TRUE, then the current transaction is committed right after the save.
	 *  Use this only if you started a transaction before. 
	 * @param {string} [$messageType='Streams/changed']
	 *  The type of the message.
	 * @param {array} [$fieldNames=null]
	 *  The names of the fields to check for changes.
	 *  By default, checks all the standard stream fields.
	 * @return {false|Db_Query}
	 *  Returns false if nothing changed, otherwise the Db_Query
	 */
	function changed(
		$asUserId=null,
		$commit = false,
		$messageType='Streams/changed',
		$fieldNames = null)
	{
		if (!isset($asUserId)) {
			$asUserId = Users::loggedInUser();
			if (!$asUserId) $asUserId = "";
		}
		if ($asUserId instanceof Users_User) {
			$asUserId = $asUserId->id;
		}
		if (!isset($fieldNames)) {
			$fieldNames = Streams::getExtendFieldNames($this->type, true);
		}
		$coreFields = array(
			'title', 'icon', 'content', 'attributes', 
			'readLevel', 'writeLevel', 'adminLevel', 'inheritAccess',
			'closedTime'
		);
		$changes = $this->changedFields($fieldNames);
		foreach ($changes as $k => $v) {
			if (!in_array($k, $coreFields)) {
				// report it, but with null value
				$changes[$k] = null; // the actual value may be too big, etc.
			}
		}
		unset($changes['updatedTime']);
		if (!$changes and !$commit) {
			return false; // we found no reason to update the stream in the database
		}
		$result = $this->save(false, $commit);
		$this->post($asUserId, array(
			'type' => $messageType,
			'content' => '',
			'instructions' => @compact('changes')
		), true);
		return $result;

	}
	
	/**
	 * Checks or sets wheather stream was published by fetcher
	 * @method publishedByFetcher
	 * @param {boolean} $new_value=null
	 *	Optional. The value to set
	 * @return {boolean}
	 */
	function publishedByFetcher($new_value = null)
	{
		if (isset($new_value)) {
			$this->publishedByFetcher = true;
		}
		return $this->publishedByFetcher;
	}
	
	/**
	 * Verifies whether the user has at least a certain read level for the Stream
	 * @method testReadLevel
	 * @param {string|integer} $level
	 *	String describing the level (see Streams::$READ_LEVEL) or integer
	 * @return {boolean}
	 * @throws {Q_Exception_WrongValue}
	 *	If string is not referring to Streams::$READ_LEVEL
	 */
	function testReadLevel($level)
	{
		if ($this->publishedByFetcher) {
			return true;
		}

		if (!empty($this->closedTime) && !$this->testWriteLevel('close')) {
			return false;
		}

		$numeric = Streams_Stream::numericReadLevel($level);
		$readLevel = $this->get('readLevel', 0);
		if ($readLevel >= 0 and $readLevel >= $numeric) {
			return true;
		}
		$readLevel_source = $this->get('readLevel_source', 0);
		if ($readLevel_source === Streams::$ACCESS_SOURCES['direct']
		or $readLevel_source === Streams::$ACCESS_SOURCES['inherited_direct']) {
			return false;
		}
		if (!$this->inheritAccess()) {
			return false;
		}
		$readLevel = $this->get('readLevel', 0);
		if ($readLevel >= 0 and $readLevel >= $numeric) {
			return true;
		}
		return false;
	}
	
	/**
	 * Verifies whether the user has at least a certain write level for the Stream
	 * @method testWriteLevel
	 * @param {string|integer} $level
	 *	String describing the level (see Streams::$WRITE_LEVEL) or integer
	 * @return {boolean}
	 * @throws {Q_Exception_WrongValue}
	 *	If string is not referring to Streams::$WRITE_LEVEL
	 */
	function testWriteLevel($level)
	{
		if ($this->publishedByFetcher) {
			return true;
		}

		if (!empty($this->closedTime) && $level !== 'close') {
			return false;
		}

		$numeric = Streams_Stream::numericWriteLevel($level);
		$writeLevel = $this->get('writeLevel', 0);
		if ($writeLevel >= 0 and $writeLevel >= $numeric) {
			return true;
		}
		$writeLevel_source = $this->get('writeLevel_source', 0);
		if ($writeLevel_source === Streams::$ACCESS_SOURCES['direct']
		or $writeLevel_source === Streams::$ACCESS_SOURCES['inherited_direct']) {
			return false;
		}
		if ($this->inheritAccess()) {
			return true;
		}

		return false;
	}
	
	/**
	 * Verifies whether the user has at least a certain admin level in the Stream
	 * @method testAdminLevel
	 * @param {string|integer} $level
	 *	String describing the level (see Streams::$ADMIN_LEVEL) or integer
	 * @return {boolean}
	 * @throws {Q_Exception_WrongValue}
	 *	If string is not referring to Streams::$ADMIN_LEVEL
	 */
	function testAdminLevel($level)
	{
		if ($this->publishedByFetcher) {
			return true;
		}

		if (!empty($this->closedTime) && !$this->testWriteLevel('close')) {
			return false;
		}

		$numeric = Streams_Stream::numericAdminLevel($level);
		$adminLevel = $this->get('adminLevel', 0);
		if ($adminLevel >= 0 and $adminLevel >= $numeric) {
			return true;
		}
		if (!$this->inheritAccess()) {
			return false;
		}
		$adminLevel_source = $this->get('adminLevel_source', 0);
		if ($adminLevel_source === Streams::$ACCESS_SOURCES['direct']
		or $adminLevel_source === Streams::$ACCESS_SOURCES['inherited_direct']) {
			return false;
		}
		$adminLevel = $this->get('adminLevel', 0);
		if ($adminLevel >= 0 and $adminLevel >= $numeric) {
			return true;
		}
		return false;
	}
	
	/**
	 * Verifies whether the user has at least the given permission
	 * @method testPermission
	 * @param {string|array} $permission The name of the permission
	 * @return {boolean}
	 */
	function testPermission($permission)
	{
		if (is_array($permission)) {
			foreach ($permission as $p) {
				if (!$this->testPermission($p)) {
					return false;
				}
			}
			return true;
		}
		if ($this->publishedByFetcher) {
			return true;
		}
		if (!empty($this->closedTime) and !$this->testWriteLevel('close')) {
			return false;
		}
		$permissions = $this->get('permissions', array());
		if (in_array($permission, $permissions)) {
			return true;
		}
		$permissions_source = $this->get('permissions_source', 0);
		if ($permissions_source === Streams::$ACCESS_SOURCES['direct']
		or $permissions_source === Streams::$ACCESS_SOURCES['inherited_direct']) {
			return false;
		}
		if (!$this->inheritAccess()) {
			return false;
		}
		$permissions = $this->get('permissions', array());
		if (in_array($permission, $permissions)) {
			return true;
		}
		return false;
	}
	
	/**
	 * Returns whether the stream is required for the user, and thus shouldn't be deleted,
	 * even if it has been marked closed.
	 * @method isRequired
	 * @return {Boolean}
	 */
	function isRequired()
	{
		return $this->get('isRequired', false);
	}
	
	/**
	 * Calculate admin level to correspond to the highest
	 * Streams::$ADMIN_LEVEL lower than the user's currently
	 * calculated adminLevel in the stream.
	 * Primarily used by apps which invite a user to a stream
	 * and giving them a slightly lower admin level.
	 * @method lowerAdminLevel
	 */
	function lowerAdminLevel()
	{
		$this->inheritAccess();
		$currentLevel = $this->get('adminLevel', 0);
		$lowerLevel = 0;
		foreach (Streams::$ADMIN_LEVEL as $k => $v) {
			if ($v < $currentLevel) {
				$lowerLevel = $v;
			}
		}
		return $lowerLevel;
	}
	/**
	 * Inherits access from any streams specified in the inheritAccess field.
	 * @method inheritAccess
	 * @return {boolean}
	 *  Returns whether the access potentially changed.
	 */
	function inheritAccess()
	{
		$asUserId = $this->get('asUserId', '');
		if ($asUserId === $this->publisherId) {
			return false;
		}
		if (empty($this->inheritAccess)) {
			return false;
		}
		$inheritAccess = json_decode($this->inheritAccess, true);
		if (!$inheritAccess or !is_array($inheritAccess)) {
			return false;
		}
		if ($this->get('inheritedAccess') == $this->inheritAccess) {
			return false;
		}
		$this->set('inheritedAccess', $this->inheritAccess);
		$public_source = Streams::$ACCESS_SOURCES['public'];
		$direct_source = Streams::$ACCESS_SOURCES['direct'];
		$inherited_public_source = Streams::$ACCESS_SOURCES['inherited_public'];
		$inherited_direct_source = Streams::$ACCESS_SOURCES['inherited_direct'];
		$direct_sources = array(
			$inherited_direct_source, $direct_source
		);
		
		$readLevel = $this->get('readLevel', 0);
		$writeLevel = $this->get('writeLevel', 0);
		$adminLevel = $this->get('adminLevel', 0);
		$readLevel_source = $this->get('readLevel_source', $public_source);
		$writeLevel_source = $this->get('writeLevel_source', $public_source);
		$adminLevel_source = $this->get('adminLevel_source', $public_source);

		// Inheritance only goes one "generation" here.
		// To implement several "generations" of inheritance, you can do things like:
		// 'inheritAccess' => [["publisherId","grandparentStreamName"], ["publisherId","parentStreamName"]]
		foreach ($inheritAccess as $ia) {
			if (!is_array($ia)) {
				continue;
			}
			$publisherId = reset($ia);
			$name = next($ia);
			$stream = Streams_Stream::fetch(
				$asUserId,
				$publisherId,
				$name,
				'*',
				array(
					'duringInternal' => 'inheritAccess'
				)
			);
			$s_readLevel = $stream->get('readLevel', 0);
			$s_writeLevel = $stream->get('writeLevel', 0);
			$s_adminLevel = $stream->get('adminLevel', 0);
			$s_readLevel_source = $stream->get('readLevel_source', $public_source);
			$s_writeLevel_source = $stream->get('writeLevel_source', $public_source);
			$s_adminLevel_source = $stream->get('adminLevel_source', $public_source);

			// Inherit read, write and admin levels
			// But once we obtain a level via a direct_source,
			// we don't override it anymore.
			$ips = $inherited_public_source;
			if (!in_array($readLevel_source, $direct_sources)) {
				$readLevel = ($s_readLevel_source === $direct_source) ? $s_readLevel : max($readLevel, $s_readLevel);
				$readLevel_source = $s_readLevel_source + 
					(($s_readLevel_source > $ips) ? 0 : $ips);
			}
			if (!in_array($writeLevel_source, $direct_sources)) {
				$writeLevel = ($s_writeLevel_source === $direct_source) ? $s_writeLevel : max($writeLevel, $s_writeLevel);
				$writeLevel_source = $s_writeLevel_source + 
					(($s_writeLevel_source > $ips) ? 0 : $ips);
			}
			if (!in_array($adminLevel_source, $direct_sources)) {
				$adminLevel = ($s_adminLevel_source === $direct_source) ? $s_adminLevel : max($adminLevel, $s_adminLevel);
				$adminLevel_source = $s_adminLevel_source + 
				(($s_adminLevel_source > $ips) ? 0 : $ips);
			}
		}
		
		$this->set('readLevel', $readLevel);
		$this->set('writeLevel', $writeLevel);
		$this->set('adminLevel', $adminLevel);
		$this->set('readLevel_source', $readLevel_source);
		$this->set('writeLevel_source', $writeLevel_source);
		$this->set('adminLevel_source', $adminLevel_source);
		
		return true;
	}
	
	/**
	 * Inherit access from a specific stream. Pushes it onto the stack.
	 * @method inheritAccessAdd
	 * @param {string} [$publisherId] Publisher id of the stream from which to inherit access
	 * @param {string} [$streamName] Name of the stream from which to inherit access
	 * @return {boolean} Whether it was already there before
	 */
	function inheritAccessAdd($publisherId, $streamName)
	{
		$item = array($publisherId, $streamName);
		$inheritAccess = json_decode($this->inheritAccess, true);
		if ($inheritAccess and is_array($inheritAccess)) {
			$found = array_search($item, $inheritAccess);
			if ($found !== false) {
				return true;
			}
			$inheritAccess[] = $item;
		} else {
			$inheritAccess = array($item);
		}
		$this->inheritAccess = Q::json_encode($inheritAccess);
		$this->changed();
		return false;
	}

	/**
	 * Stop inheriting access from a specific stream. Splices it from the stack.
	 * @method inheritAccessRemove
	 * @param {string} [$publisherId] Publisher id of the stream from which to stop inheriting access
	 * @param {string} [$streamName] Name of the stream from which to stop inheriting access
	 * @return {boolean} Whether it was already there before
	 */
	function inheritAccessRemove($publisherId, $streamName)
	{
		$item = array($publisherId, $streamName);
		$inheritAccess = json_decode($this->inheritAccess, true);
		if ($inheritAccess and is_array($inheritAccess)) {
			$found = array_search($item, $inheritAccess);
			if ($found === false) {
				return false;
			}
			array_splice($inheritAccess, $found, 1);
		} else {
			return false;
		}
		$this->inheritAccess = Q::json_encode($inheritAccess);
		$this->changed();
		return true;
	}
	
	/**
	 * Fetch all the streams which are related to, or from, this stream
	 * @method related
	 * @static
	 * @param {string} $asUserId
	 *  The user who is fetching
	 * @param {mixed} $isCategory=true
	 *  If false, returns the categories that this stream is related to.
	 *  If true, returns all the streams this related to this category.
	 *  If a string, returns all the streams related to this category with names prefixed by this string.
	 * @param {array} $options=array()
	 * @param {boolean} [$options.orderBy=false] Defaults to false, which means order by decreasing weight. True means order by increasing weight.
	 * @param {integer} [$options.limit] number of records to fetch
	 * @param {integer} [$options.offset] offset to start from
	 * @param {double} [$options.min] the minimum orderBy value (inclusive) to filter by, if any
	 * @param {double} [$options.max] the maximum orderBy value (inclusive) to filter by, if any
	 * @param {string|array|Db_Range} [$options.type] if specified, this filters the type of the relation. Can be useful for implementing custom indexes using relations and varying the value of "type".
	 * @param {string} [$options.prefix] if specified, this filters by the prefix of the related streams
	 * @param {string} [$options.title] if specified, this filters the titles of the streams with a LIKE condition
	 * @param {array} [$options.where] you can also specify any extra conditions here
	 * @param {array} [$options.fetchOptions] An array of any options to pass to Streams::fetch when fetching streams
	 * @param {array} [$options.relationsOnly] If true, returns only the relations to/from stream, doesn't fetch the other data. Useful if publisher id of relation objects is not the same as provided by publisherId.
	 * @param {array} [$options.streamsOnly] If true, returns only the streams related to/from stream, doesn't return the other data.
	 * @param {array} [$options.streamFields] If specified, fetches only the fields listed here for any streams.
	 * @param {array} [$options.skipFields] Optional array of field names. If specified, skips these fields when fetching streams
	 * @param {array} [$options.skipTypes] Optional array of ($streamName => $relationTypes) to skip when fetching relations.
	 * @param {array} [$options.includeTemplates] Defaults to false. Pass true here to include template streams (whose name ends in a slash) among the related streams.
	 * @return {array}
	 *  Returns array($relations, $relatedStreams, $stream).
	 *  However, if $streamName wasn't a string or ended in "/"
	 *  then these third parameter is an array of streams.
	 */
	function related(
		$asUserId,
		$isCategory = true,
		$options = array())
	{
		return Streams::related(
			$asUserId,
			$this->publisherId,
			$this->name,
			$isCategory,
			$options
		);
	}
	
	/**
	 * Relate this stream to another stream
	 * @param {Streams_Stream} $toStream The stream to relate this stream to
	 * @param {string} $type The type of relation
	 * @param {string} [$asUserId=null] Override the user id to perform this action as
	 * @param {array} [$options=array()] Any options to pass to Streams::relate
	 * @return {array|boolean}
	 *  Returns false if the operation was canceled by a hook
	 *  Returns true if relation was already there
	 *  Otherwise returns array with keys "messagesFrom" and "messagesTo" and values of type Streams_Message
	 */
	function relateTo($toStream, $type, $asUserId = null, $options = array())
	{
		return Streams::relate(
			$asUserId,
			$toStream->publisherId,
			$toStream->name,
			$type,
			$this->publisherId,
			$this->name,
			$options
		);
	}
	
	/**
	 * Relate another stream, published by the same publisher, to this stream
	 * @param {Streams_Stream} $fromStream The stream to relate to this stream
	 * @param {string} $type The type of relation
	 * @param {string} [$asUserId=null] Override the user id to perform this action as
	 * @param {array} [$options=array()] Any options to pass to Streams::relate
	 * @return {array|boolean}
	 *  Returns false if the operation was canceled by a hook
	 *  Returns true if relation was already there
	 *  Otherwise returns array with keys "messagesFrom" and "messagesTo" and values of type Streams_Message
	 */
	function relateFrom($fromStream, $type, $asUserId = null, $options = array()) {
		return Streams::relate(
			$asUserId,
			$this->publisherId,
			$this->name,
			$type,
			$fromStream->publisherId,
			$fromStream->name,
			$options
		);
	}

	/**
	 * Unrelate this stream to another stream
	 * @param {Streams_Stream} $fromStream The stream to unrelate this stream to
	 * @param {string} $type The type of relation
	 * @param {string} [$asUserId=null] Override the user id to perform this action as
	 * @param {array} [$options=array()] Any options to pass to Streams:unrelate
	 * @return {false|array}
	 *  Returns false if the relation was not removed.
	 *  Otherwise, returns an array of (RelatedTo, RelatedFrom) that was just removed
	 */
	function unrelateTo($toStream, $type, $asUserId = null, $options = array())
	{
		return Streams::unrelate(
			$asUserId,
			$toStream->publisherId,
			$toStream->name,
			$type,
			$this->publisherId,
			$this->name,
			$options
		);
	}

	/**
	 * Unrelate another stream, published by the same publisher, from this stream
	 * @param {Streams_Stream} $fromStream The stream to unrelate from this stream
	 * @param {string} $type The type of relation
	 * @param {string} [$asUserId=null] Override the user id to perform this action as
	 * @param {array} [$options=array()] Any options to pass to Streams::unrelate
	 * @return {boolean}
	 *  Whether the relation was removed
	 */
	function unrelateFrom($fromStream, $type, $asUserId = null, $options = array()) {
		return Streams::unrelate(
			$asUserId,
			$this->publisherId,
			$this->name,
			$type,
			$fromStream->publisherId,
			$fromStream->name,
			$options
		);
	}
	
	/**
	 * Closes a stream, which prevents anyone from posting messages to it
	 * unless they have WRITE_LEVEL >= "close", as well as attempting to remove
	 * all relations to other streams. A "cron job" can later go and delete
	 * closed streams. The reason you should avoid deleting streams right away
	 * is that other subscribers may still want to receive the last messages
	 * posted to the stream.
	 * @method close
	 * @param {string} $asUserId The id of the user who would be closing the stream
	 * @param {array} [$options=array()] Can include "skipAccess"
	 * @static
	 */
	function close($asUserId, $options = array())
	{
		return Streams::close($asUserId, $this->publisherId, $this->name, $options);
	}
	
	/**
	 * Returns the fields and values we can export to clients.
	 * Can also contain "messageTotals", "relatedToTotals" and "relatedFromTotals".
	 * @method exportArray
	 * @param {array} $options=array()
	 * @param {string} [$options.asUserId] Defaults to the logged in user, or "" if not logged in
	 *	If access is not already set for the stream, it will be calculated for $asUserId.
	 * @param {string} [$options.skipAccess=false] If true, skips access checks
	 * @param {array} [$options.fields=null] By default, all fields from tables used to "extend" the
	 *  stream are returned. You can indicate here an array consisting of only the names of
	 *  fields to export. An empty array means no extended fields will be exported.
	 * @return {array}
	 */
	function exportArray($options = null)
	{
		$asUserId = isset($options['asUserId']) ? $options['asUserId'] : null;
		if (!isset($asUserId)) {
			$user = Users::loggedInUser(false, false);
			$asUserId = $user ? $user->id : '';
		}
		if (!empty($options["skipAccess"])
		or $this->get('public', false)) {
			$skip = true;
		} else {
			$this->calculateAccess($asUserId);
			$skip = false;
		}

		if ($skip or $this->testReadLevel('content')) {
			$readLevelAtLeastContent = true;
			$result = $this->toArray();
		} else {
			$readLevelAtLeastContent = false;
			if (!$this->testReadLevel('see')) {
				return array();
			}
			$result = array();
			$fields = array( // the array of fields allowed to see
				'publisherId',
				'name',
				'type',
				'title',
				'insertedTime',
				'updatedTime'
			);
			if (isset($this->type)) {
				$fields = array_merge($fields, Q_Config::get(
					'Streams', 'types', $this->type, 'see', array()
				));
			}
			foreach ($fields as $field) {
				$result[$field] = $this->$field;
			}
			// determine which fields and attributes can be seen
			$canSeeFields = array();
			$canSeeAttributes = array();
			$permissions = $this->get('permissions', array());
			$configPermissions = self::getConfigField($this->type, 'permissions', array());
			foreach ($permissions as $p) {
				if (empty($configPermissions[$p])) {
					continue;
				}
				$canSeeFields = array_merge($canSeeFields, 
					Q::ifset($configPermissions, $p, 'fields', array())
				);
				$canSeeAttributes = array_merge($canSeeFields, 
					Q::ifset($configPermissions, $p, 'attributes', array())
				);
			}
		}
		$result['icon'] = $this->iconUrl(false);
		$result['url'] = $this->url();
		$classes = Streams::getExtendClasses($this->type);
		
		foreach ($classes as $k => $v) {
			foreach ($v as $f) {
				if (!isset($options['fields'])
				or in_array($f, $options['fields'])) {
					if ($readLevelAtLeastContent or in_array($f, $canSeeFields, true)) {
						$result[$f] = isset($this->$f) ? $this->$f : null;
					}
				}
			}
		}
		if (!$readLevelAtLeastContent) {
			$attributes = $this->getAllAttributes();
			$result['attributes'] = Q::json_encode(Q::take($attributes, $canSeeAttributes));
		}
		$result['access'] = array(
			'readLevel' => $this->get('readLevel', $this->readLevel),
			'writeLevel' => $this->get('writeLevel', $this->writeLevel),
			'adminLevel' => $this->get('adminLevel', $this->adminLevel),
			'permissions' => $this->get('permissions', $this->getAllPermissions())
		);
		$result['isRequired'] = $this->isRequired();
		if ($this->get('participant')) {
			$result['participant'] = $this->get('participant')->exportArray();
		}
		if ($messageTotals = $this->get('messageTotals')) {
			$result['messageTotals'] = $messageTotals;
		}
		if ($relatedToTotals = $this->get('relatedToTotals')) {
			$result['relatedToTotals'] = $relatedToTotals;
		}
		if ($relatedFromTotals = $this->get('relatedFromTotals')) {
			$result['relatedFromTotals'] = $relatedFromTotals;
		}
		return $result;
	}

	/**
	 * Calculates the access for the current stream by querying the database.
	 * Modifies this object, by setting its access levels.
	 * After the function returns, you will be able to call the methods
	 * testReadLevel(), testWriteLevel() and testAdminLevel()
	 * on these streams before using them on the user's behalf.
	 * @method calculateAccess
	 * @static
	 * @param {string} $asUserId
	 *  Set this to the user relative to whom access is calculated.
	 *  If this matches the publisherId, just sets full access and calls publishedByFetcher(true).
	 *  If this is '', only returns the streams anybody can see.
	 *  If this is null, the logged-in user's id is used, or '' if no one is logged in
	 * @param {boolean} [$recalculate=false]
	 *  Pass true here to force recalculating access to streams for which access was already calculated
	 * @param {string} [$actualPublisherId=null]
	 *  For internal use only. Used by Streams::canCreateStreamType function.
	 * @param {string} [$inheritAccess=true]
	 *  Set to false to skip inheriting access from other streams, even if specified
	 * @return {integer}
	 *  The number of streams that were recalculated
	 */
	function calculateAccess(
		$asUserId = null, 
		$recalculate = false, 
		$actualPublisherId = null, 
		$inheritAccess = true)
	{
		Streams::calculateAccess($asUserId, $this->publisherId, array($this), $recalculate, $actualPublisherId, $inheritAccess);
		return $this;
	}

	/**
	 * Updates relations after a stream was inserted or updated.
	 * Checks the "updateRelations" config first, which haswhich is an array that can contain "to", "from" or both.
	 * @return {array} Consists of ("to" => array(Streams_RelatedTo), "from" => array(Streams_RelatedFrom))
	 */
	function updateRelations($asUserId = null)
	{
		$didntTry = array("to" => array(), "from" => array());
		$changes = $this->changedFields();
		if (!$changes) {
			return $didntTry;
		}
		$updateRelations = self::getConfigField($this->type, 'updateRelations', array());
		if (!$updateRelations) {
			return $didntTry;
		}
		$relationTypes = array();
		$attributesChanged = $attributesAdded = array();
		// foreach ($changes as $k => $v) {
		// 	$relationTypes[] = "field/$k";
		// }
		if (!empty($changes['attributes'])) {
			// see what attributes have changed
			$orig = $this->getAllAttributes(true);
			$attr = $this->getAttributes(false);
			foreach ($orig as $k => $v) {
				if (!isset($orig[$k]) and !isset($attr[$k])) {
					continue;
				}
				if ((!isset($attr[$k]) && isset($v))
				|| ($attr[$k] !== $v)) { // was removed or changed
					$attributesChanged[] = $k;
					$relationTypes[] = "attribute/$k";
				}
			}
			foreach ($attr as $k => $v) {
				if (!isset($orig[$k]) || $orig[$k] !== $v) {
					$attributesAdded[$k] = $v; // new value
				}
			}
		}
		if ($updateRelations === true) {
			$updateRelations = array('from');
		}
		foreach ($updateRelations as $direction) {
			if ($direction !== 'from') {
				continue;
			}
			$relationTypes = array_merge($relationTypes, array_keys($this->fields));
			$rfroms = Streams_RelatedFrom::select()->where(array(
				'fromPublisherId' => array('', $this->publisherId),
				'fromStreamName' => $this->type . '/',
				'type' => $relationTypes
			))->fetchDbRows(null, '', 'type');
			$weight = time(); // is_numeric($attr[$k]) ? $attr[$k] : 1;
			$removeRelationTypes = array();
			foreach ($attributesChanged as $ak => $av) {
				if (is_numeric($av)) {
					// this form for numbers makes lexicographical comparisons agree with numeric ones
					$av = sprintf("%+015.2f", $av);
				}
				if (empty($rfroms["attribute/$ak"])) {
					continue; // nothing to remove
				}
				$rfrom = $rfroms["attribute/$ak"];
				if (is_array($av)) {
					$toRemove = array_diff($av, $attr[$ak]);
					foreach ($toRemove as $r) {
						$removeRelationTypes[] = "attribute/$ak=" . json_encode($r);
					}
				} else {
					// handle regular scalar values
					$removeRelationTypes[] = "attribute/$ak=" . json_encode($av);
				}
			}
			$addRelationTypes = array();
			foreach ($attributesAdded as $ak => $av) {
				if (is_array($av)) {
					$toAdd = array_diff($av, $orig[$ak]);
					foreach ($toAdd as $a) {
						if (is_numeric($a)) {
							// this form for numbers makes lexicographical comparisons agree with numeric ones
							$av = sprintf("%+015.2f", $av);
						}
						$addRelationTypes[] = "attribute/$ak=" . json_encode($a);
					}
				} else {
					// handle regular scalar values
					if (is_numeric($av)) {
						// this form for numbers makes lexicographical comparisons agree with numeric ones
						$av = sprintf("%+015.2f", $av);
					}
					$addRelationTypes[] = "attribute/$ak=" . json_encode($av);
				}
			}
			Streams::unrelate(
				$asUserId, 
				$rfrom->fromPublisherId,
				$rfrom->fromStreamName,
				$removeRelationTypes,
				$this->publisherId, $this->name,
				array('skipAccess' => true, 'adjustWeights' => true)
			);
			Streams::relate(
				$asUserId, 
				$rfrom->fromPublisherId,
				$rfrom->fromStreamName,
				$addRelationTypes,
				$this->publisherId, $this->name,
				array('skipAccess' => true, 'weight' => $weight)
			);
		}
		return true;
	}
	
	/**
	 * Fetch messages of the stream.
	 * @method getMessages
	 * @param {array} [$options=array()] An array of options determining how messages will be fetched, which can include:
	 * @param {integer} [options.min] Minimum ordinal of the message to select from (inclusive). Defaults to minimum ordinal of existing messages (if any).
	 * @param {integer} [options.max] Maximum ordinal of the message to select to (inclusive). Defaults to maximum ordinal of existing messages (if any).
	 *   Can also be negative, then the value will be substracted from maximum number of existing messages and +1 will be added
	 *   to guarantee that $max = -1 means highest message ordinal.
	 * @param {integer} [options.limit=100] Number of the messages to be selected.
	 * @param {integer} [options.ascending] Sorting of fetched messages by ordinal. If true, sorting is ascending, if false - descending.
	 *   Defaults to true, but in case if 'min' option not given and only 'max' and 'limit' are given, we assuming
	 *   fetching in reverse order, so 'ascending' will default to false.
	 * @param {integer} [options.type] Optional string specifying the particular type of messages to get
	 * @param {boolean} [$options.skipLimiting=false] Pass true here to not cut the limit off by the getMessagesLimit from config. It's here to protect against excessively large queries.
	 * @param {boolean} [$options.updateSeen=false] Pass true here to update the streams_participant.seenOrdinal, if any, with the latest ordinal
	 * @return {array} Returns an array of ($ordinal => Streams_Message) pairs.
	 */
	function getMessages($options)
	{
		// preparing default query
		$criteria = array(
			'publisherId' => $this->publisherId,
			'streamName' => $this->name
		);
		if (!empty($options['type'])) {
			$criteria['type'] = $options['type'];
		}
		$q = Streams_Message::select()->where($criteria);
		
		// getting $min and $max
		$result = Streams_Message::select("MIN(ordinal) min, MAX(ordinal) max")
				->where($criteria)
				->fetchAll(PDO::FETCH_ASSOC);
		if (!$result[0]) return array();
		$min = (integer) $result[0]['min'];
		$max = (integer) $result[0]['max'];
		
		// default sorting is 'ORDER BY `ordinal` ASC', but it can be changed depending on options
		$ascending = true;
		if (!isset($options['min'])) {
			$options['min'] = $min;
			// if 'min' is not given, assume 'reverse' fetching, so $ascending is false
			$ascending = false;
		} else if ($options['min'] < $min) {
			$options['min'] = $min;
		}
		if (!isset($options['max'])) {
			$options['max'] = $max;
		} else if ($options['max'] > $max) {
			$options['max'] = $max;
		} else if ($options['max'] < 0) {
			// if 'max' is negative, subtract value from existing maximum
			$options['max'] = $max + $options['max'] + 1;
		}
		$limit = isset($options['limit']) ? $options['limit'] : 1000000;
		if (empty($options['skipLimiting'])) {
			$limit = min($limit, self::getConfigField($this->type, 'getMessagesLimit', 100));
		}
		
		if ($options['min'] > $options['max']) {
			return array();
		}
		
		$q->where(array(
			'ordinal >=' => $options['min'],
			'ordinal <=' => $options['max']
		));
		$q->limit($limit);
		$q->orderBy('ordinal', isset($options['ascending']) ? $options['ascending'] : $ascending);
		$rows = $q->fetchDbRows(null, '', 'ordinal');
		if (empty($options['updateSeen'])) {
			return $rows;
		}
		$max = 0;
		foreach ($rows as $ordinal => $r) {
			$max = max($max, $ordinal);
		}
		return $rows;
	}

	/**
	 * Fetch participants of the stream.
	 * @method getParticipants
	 * @param {array} [$options=array()] An array of options determining how messages will be fetched, which can include:
	 * @param {string} [$options.state] One of "invited", "participating", "left"
	 * @param {string} [$options.limit=1000] Number of the participants to be selected.
	 * @param {string} [$options.offset=0] Number of the messages to be selected.
	 * @param {string} [$options.ascending] Sorting of fetched participants by insertedTime. If true, sorting is ascending, if false - descending. Defaults to false.
	 * @param {string} [$options.type] Optional string specifying the particular type of messages to get
	 * @param {boolean} [$options.skipLimiting=false] Pass true here to not cut the limit off by the getParticipantsLimit from config. It's here to protect against excessively large queries.
	 */
	function getParticipants($options)
	{
		$criteria = array(
			'publisherId' => $this->publisherId,
			'streamName' => $this->name
		);
		if (isset($options['state'])) {
			$possible_states = array('invited', 'participating', 'left');
			if (!in_array($options['state'], $possible_states)) {
				throw new Q_Exception_WrongValue(array(
					'field' => 'state',
					'range' => '"' . implode('", "', $possible_states) . '"'
				));
			}
			$criteria['state'] = $options['state'];
		}
		$q = Streams_Participant::select()->where($criteria);
		$ascending = false;
		$limit = isset($options['limit']) ? $options['limit'] : 1000000;
		$offset = isset($options['offset']) ? $options['offset'] : 0;
		if (empty($options['skipLimiting'])) {
			$limit = min($limit, self::getConfigField($this->type, 'getParticipantsLimit', 100));
		}
		if (isset($limit)) {
			$q->limit($limit, $offset);
		}
		$q->orderBy('insertedTime', isset($options['ascending']) ? $options['ascending'] : $ascending);
		return $q->fetchDbRows(null, '', 'userId');
	}
	
	/**
	 * Fetch a particular participant in the stream, if it exists.
	 * @method getParticipant
	 * @param {string} [$userId=Users::loggedInUser(true)->id] The id of the user who may or may not be participating in the stream
	 * @return {Db_Row|null}
	 */
	function getParticipant($userId = null)
	{
		if (!$userId) {
			$userId = Users::loggedInUser(true)->id;
		}
		$rows = Streams_Participant::select()->where(array(
			'publisherId' => $this->publisherId,
			'streamName' => $this->name,
			'userId' => $userId
		))->limit(1)->fetchDbRows();
		return $rows ? reset($rows) : null;
	}
	
	/**
	 * Get the url of the stream's icon
	 * @method iconUrl
	 * @param {string|false} [$basename=null] The last part after the slash, such as "50.png" or "50". Setting it to false skips appending "/basename"
	 * @return {string} The stream's icon url
	 */
	function iconUrl($basename = null)
	{
		return Streams::iconUrl($this, $basename);
	}
	
	/**
	 * Get the directory to import the icon into, for a stream.
	 * Use this with Users::importIcon().
	 * @method iconDirectory
	 * @param {string} [$extra] You can pass time() here or something,
	 *  if you don't want to overwrite old values. It will append to the directory path.
	 * @return {string}
	 */
	function iconDirectory($extra = null)
	{
		return Streams::iconDirectory($this->publisherId, $this->name, $extra);
	}

	/**
	 * Get the directory to upload files into, for a stream.
	 * @method uploadsDirectory
	 * @return {string}
	 */
	function uploadsDirectory()
	{
		return Streams::uploadsDirectory($this->publisherId, $this->name);
	}

	/**
	 * A convenience method to get the URL of the streams-related action
	 * @method register
	 * @static
	 * @param {string} $what
	 *	Defaults to 'stream'. In the future, can be 'message', 'relation', etc.
	 * @return {string} 
	 *	The corresponding URL
	 */
	function actionUrl($what = 'stream')
	{
		return Streams::actionUrl($this->publisherId, $this->name, $what);
	}
	
	/**
	 * Add this stream to the list of streams to be preloaded onto the client with the rest of the page
	 * @method addPreloaded
	 * @static
	 * @param {string} $asUserId=null
	 *	The id of the user from whose point of view the access should be calculated.
	 *  If this matches the publisherId, just sets full access and calls publishedByFetcher(true).
	 *  If this is '', only preloads the streams anybody can see.
	 *  If this is null, the logged-in user's id is used, or '' if no one is logged in
	 */
	function addPreloaded($asUserId=null)
	{
		$this->calculateAccess($asUserId);
		self::$preloaded["{$this->publisherId}, {$this->name}"] = $this;
	}
	
	/**
	 * Remove this stream from the list of streams to be preloaded onto the client with the rest of the page
	 * @method removePreloaded
	 * @static
	 */
	function removePreloaded()
	{
		unset(self::$preloaded["{$this->publisherId}, {$this->name}"]);
	}
	
	/**
	 * Gets a value from the config corresponding to this stream type and a field name,
	 * using defaults from "Streams"/"types"/"*" and merging the value under
	 * "Streams"/"types"/$stream->type, if any.
	 * @method getConfigField
	 * @static
	 * @param {string} $type The type of the stream
	 * @param {string|array} $field The name of the field
	 * @param {mixed} [$default=null] The value to return if the config field isn't specified
	 * @param {boolean} [$merge=true] if arrays are found in both places, merge them
	 * @return mixed
	 */
	static function getConfigField($type, $field, $default = null, $merge = true)
	{
		if (is_string($field)) {
			$field = array($field);
		}
		$args1 = array_merge(array('Streams', 'types', '*'), $field, array($default));
		$args2 = array_merge(array('Streams', 'types', $type), $field, array(null));
		$bottom = call_user_func_array(array('Q_Config', 'get'), $args1);
		$top = call_user_func_array(array('Q_Config', 'get'), $args2);
		if ($merge and is_array($bottom) and is_array($top)) {
			return Q_Tree::mergeArrays($bottom, $top);
		}
		return isset($top) ? $top : $bottom;
	}

	/**
	 * Gets the stream row corresponding to a Db_Row retrieved from
	 * a table extending the stream.
	 * @method extendedBy
	 * @static
	 * @param {Db_Row} $row a Db_Row retrieved from a table extending the stream.
	 * @return Streams_Stream|null
	 */
	static function extendedBy(Db_Row $row)
	{
		return $row->get('Streams_Stream', null);
	}
	
	/**
	 * Returns the canonical url of the stream, if any.
	 * You can use strings in the config "url" parameter, that follow Handlebars usage,
	 * and use double-curly-braces to enclose expressions like baseUrl, name, and attributes.foo.bar
	 * See more at https://handlebarsjs.com/guide/expressions.html#basic-usage
	 * @param {integer} [$messageOrdinal] pass this to link to the message in the stream, e.g. to highlight it
	 * @param {string} [$baseUrl] you can override the default found in "Q"/"web"/"appRootUrl" config
	 * @return {string|null|false}
	 */
	function url($messageOrdinal = null, $baseUrl = null)
	{
		$url = self::getConfigField($this->type, 'url', null);
		if (!$url) {
			return null;
		}
		$streamNameParts = explode('/', $this->name);
		if (strpos($url, '.[2]') !== false
		and count($streamNameParts) <= 2) {
			Q::log("Streams_Stream->url(): The URL string doesn't match some fields in the stream name: $url");
			return null;
		}
		$fields = array_merge(
			$this->fields, 
			array(
				'attributes' => $this->getAllAttributes()
			),
			array(
				'streamName' => $streamNameParts,
				'nameNormalized' => Q_Utils::normalize($this->name),
				'baseUrl' => $baseUrl ? $baseUrl : Q_Request::baseUrl()
			)
		);
		$urlString = Q_Handlebars::renderSource($url, $fields);
		$qs = $messageOrdinal ? "?$messageOrdinal" : "";
		return Q_Uri::url($urlString . $qs);
	}
	
	/**
	 * Returns the canonical URI of the stream, if any
	 * @param {integer} [$messageOrdinal] pass this to link to the message in the stream, e.g. to highlight it
	 * @return {string|null|false}
	 */
	function uri($messageOrdinal = null)
	{
		$uri = self::getConfigField($this->type, 'uri', null);
		if (!$uri) {
			return null;
		}
		$uriString = Q_Handlebars::renderSource($uri, array(
			'publisherId' => $this->publisherId,
			'streamName' => explode('/', $this->name),
			'name' => $this->name
		));
		$parts = explode(' ', $uriString);
		$qs = $messageOrdinal ? "?$messageOrdinal" : "";
		return array_shift($parts) . $qs . ' ' . ($parts ? implode(' ', $parts) : '');
	}

	/**
	 * @method numericReadLevel
	 * @static
	 * @param {integer|string} $level
	 * @return integer
	 * @throws Q_Exception_WrongValue
	 */
	static function numericReadLevel($level)
	{
		if (is_numeric($level)) {
			return $level;
		}
		if (isset(Streams::$READ_LEVEL[$level])) {
			return Streams::$READ_LEVEL[$level];
		}
		throw new Q_Exception_WrongValue(array(
			'field' => 'level',
			'range' => 'one of: ' . implode(', ', array_keys(Streams::$READ_LEVEL))
		));
	}

	/**
	 * @method numericWriteLevel
	 * @static
	 * @param {integer|string} $level
	 * @return integer
	 * @throws Q_Exception_WrongValue
	 */
	static function numericWriteLevel($level)
	{
		if (is_numeric($level)) {
			return $level;
		}
		if (isset(Streams::$WRITE_LEVEL[$level])) {
			return Streams::$WRITE_LEVEL[$level];
		}
		throw new Q_Exception_WrongValue(array(
			'field' => 'level',
			'range' => 'one of: ' . implode(', ', array_keys(Streams::$WRITE_LEVEL))
		));
	}

	/**
	 * @method numericAdminLevel
	 * @static
	 * @param {integer|string} $level
	 * @return integer
	 * @throws Q_Exception_WrongValue
	 */
	static function numericAdminLevel($level)
	{
		if (is_numeric($level)) {
			return $level;
		}
		if (isset(Streams::$ADMIN_LEVEL[$level])) {
			return Streams::$ADMIN_LEVEL[$level];
		}
		throw new Q_Exception_WrongValue(array(
			'field' => 'level',
			'range' => 'one of: ' . implode(', ', array_keys(Streams::$ADMIN_LEVEL))
		));
	}
	
	/**
	 * Returns the type name to display from a stream type
	 * @method displayType
	 * @static
	 * @param {string} $streamType
	 * @param {array} [$options=array()]
	 * @param {string} [$options.language=null] Override language
	 * @param {string} [$options.locale=null] Override locale
	 * @param {string} [$options.plural=false] Whether to display plural, when available
	 * @return {string}
	 */
	static function displayType($streamType, $options = array())
	{
		$parts = explode('/', $streamType);
		$module = reset($parts);
		$default = end($parts);
		$text = Q_Text::get("$module/content", $options);
		$displayType = Q::ifset($text, 'types', $streamType, 'displayType', null);
		if (!empty($options['plural'])) {
			$displayType = Q::ifset($text, 'types', $streamType, 'displayTypePlural', $displayType);
		}
		return $displayType ? $displayType : $default;
	}

	/**
	 * Returns the type name to display from a stream type
	 * @method relationDisplayType
	 * @static
	 * @param {string} $relationType
	 * @param {array} [$options=array()]
	 * @param {string} [$options.language=null] Override language
	 * @param {string} [$options.locale=null] Override locale
	 * @param {string} [$options.plural=false] Whether to display plural, when available
	 * @param {string} [$options.text] The name of the text file to load
	 * @return {string}
	 */
	static function relationDisplayType($relationType, $options = array())
	{
		$parts = explode('/', $relationType);
		$name = Q::ifset($options, 'text', null);
		if (!$name and count($parts) > 1) {
			$module = reset($parts);
			$name = "$module/content";
		}
		if ($name) {
			$text = Q_Text::get($name, array_merge(array("dontThrow" => true), $options));
			$displayType = Q::ifset($text, 'relations', $relationType, 'displayType', null);
			if (!empty($options['plural'])) {
				$displayType = Q::ifset($text, 'relations', $relationType, 'displayTypePlural', $displayType);
			}
			if ($displayType) {
				return $displayType;
			}
		}
		$parts = explode('/', $relationType);
		$displayType = end($parts);
		if (empty($options['plural']) and substr(end($parts), -1) === 's') {
			$displayType = substr($displayType, 0, -1);
		}
		return $displayType;
	}
	
	/**
	 * Find out whether a certain field is restricted from being
	 * edited by clients via the regular Streams REST API.
	 * @method restrictedFromClient
	 * @static
	 * @param {string} $streamType
	 * @param {string} $fieldName
	 * @param {string} [$whenCreating=false]
	 * @return {boolean}
	 */
	static function restrictedFromClient($streamType, $fieldName, $whenCreating = false)
	{
		$during = $whenCreating ? 'create' : 'edit';
		$info = Streams_Stream::getConfigField($streamType, $during, false);
		if (!$info) {
			return true;
		}
		if (is_array($info) and !in_array($fieldName, $info)) {
			return true;
		}
		return false;
	}
	
	/**
	 * @method metas
	 * @param {array} $options You can use these to override the default places to look
	 * @param {string} [$options.icon] The name of an attribute that contains the icon url prefix
	 * @param {string} [$options.iconFile] The name of an attribute that contains the icon url prefix
	 * @param {string} [$options.title] The name of an attribute that contains the title
	 * @param {string} [$options.description] The name of an attribute that contains the description
	 * @param {string} [$options.keywords] The name of an attribute that contains the title
	 * @param {string} [$options.url] The name of an attribute that contains the url
	 * @return {array} The metas to set
	 */
	function metas($options)
	{
		if (!empty($options['iconFile'])) {
			$iconFile = $options['iconFile'];
		} else {
			$sizes = Q_Image::getSizes('Streams/image', $maxStretch);
			$iconFile = end($sizes);
		}
		$maxLength = Q_Config::get('Streams', 'meta', 'description', 'maxLength', 150);
		$description = mb_substr($this->content, 0, $maxLength);
		if (strlen($this->content) > $maxLength) {
			$description .= '...';
		}
		$description = preg_replace("/(\r?\n){2,}/", " ", $description);
		$image = Q::ifset($options, 'icon', $this->iconUrl($iconFile));
		$title = Q::ifset($options, 'title', $this->title);
		$description = Q::ifset($options, 'description', $description);
		$keywords = $this->getAttribute('keywords') ?: Q::ifset($this, 'keywords', null);
		$metas = array(
			array('name' => 'name', 'value' => 'title', 'content' => $title),
			array('name' => 'name', 'value' => 'image', 'content' => $image),
			array('name' => 'name', 'value' => 'description', 'content' => $description),
			array('name' => 'name', 'value' => 'keywords', 'content' => $keywords)
		);
		$url = Q::ifset($options, 'url', $this->url());
		foreach (array('og', 'twitter') as $prefix) {
			foreach (array('title', 'image', 'description', 'keywords', 'url') as $prop) {
				$metas[] = array('name' => 'property', 'value' => $prefix.':'.$prop, 'content' => $$prop);
			}
		}

		$attrUrl = $this->getAttribute('url');
		if (is_string($attrUrl) && strpos($attrUrl, 'youtube.com')) {
			$parsedUrl = parse_url($attrUrl);
			parse_str($parsedUrl['query'], $parsedQuery);
			if (Q::ifset($parsedQuery, 'v', null)) {
				$metas[] = array('name' => 'property', 'value' => 'og:video', 'content' => $parsedUrl['scheme'].'://'.$parsedUrl['host'].'/v/'.$parsedQuery['v']);
			} else {
				$metas[] = array('name' => 'property', 'value' => 'og:url', 'content' => $attrUrl);
			}
			$metas[] = array('name' => 'property', 'value' => 'og:type', 'content' => 'video');
			$metas[] = array('name' => 'property', 'value' => 'twitter:card', 'content' => 'player');
			$metas[] = array('name' => 'property', 'value' => 'twitter:player', 'content' => $attrUrl);
			$metas[] = array('name' => 'property', 'value' => 'twitter:player:width', 'content' => "360");
			$metas[] = array('name' => 'property', 'value' => 'twitter:player:height', 'content' => "200");
		} else {
			$metas[] = array('name' => 'property', 'value' => 'twitter:card', 'content' => 'summary');
		}
		return $metas;
	}

	/**
	 * Detect if streams icon is custom.
	 * @method isCustomIcon
	 * @return {bool}
	 */
	function isCustomIcon ()
	{
		return strpos(Q::ifset($this, 'icon', ''), 'uploads/Streams') !== false;
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Stream} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Stream();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}

	/**
	 * Returns the number of users who like the stream, excluding its publisher
	 * @method countLikes
	 * @param {string} $publisherId
	 * @param {string} $streamName
	 * @param {string} [$userId] If defined search likes related to this user
	 */
	static function countLikes ($publisherId, $streamName, $userId = null) {
		$where = array(
			"forId" => "$publisherId/$streamName",
			"value" => 1
		);
		if ($userId) {
			$where["userId"] = $userId;
		}
		return Users_Vote::select('COUNT(1)')
			->where($where)
			->ignoreCache()
			->execute()	
			->fetch(PDO::FETCH_NUM);
	}

	/**
	 * Returns the number of users subscribed to the stream, excluding its publisher
	 * @method countSubscribers
	 * @param {string} $publisherId
	 * @param {string} $streamName
	 * @param {string} [$userId] If defined return whether this user is subscribed
	 */
	static function countSubscribers ($publisherId, $streamName, $userId = null) {
		$where = array(
			"publisherId" => $publisherId,
			"streamName" => $streamName,
			"userId !=" => $publisherId,
			"subscribed" => "yes"
		);
		if ($userId) {
			$where["userId"] = $userId;
		}
		return Streams_Participant::select('COUNT(1)')
			->where($where)
			->ignoreCache()
			->execute()
			->fetch(PDO::FETCH_NUM);
	}

	/**
	 * Get number of users to whose stream the $userId is subscribed
	 * @method countSubscribed
	 * @param {string} $userId
	 * @param {string} [$streamType=null] Can be used to filter by type of stream
	 * @param {string} [$streamName=null] Can be used to filter by name of stream
	 */
	static function countSubscribed ($userId, $streamType = null, $streamName =  null) {
		$where = array(
			"a.toPublisherId" => $userId,
			"a.toStreamName" => 'Streams/participating',
			"b.subscribed" => "yes"
		);
		if (!empty($streamType)) {
			$where['a.type'] = $streamType;
		}
		if (!empty($streamName)) {
			$where['a.fromStreamName'] = $streamName;
		}
		return Streams_RelatedTo::select('COUNT(1)', array(
			'a' => Streams_RelatedTo::table(),
			'b' => Streams_Participant::table()
		))->join(Streams_Participant::table(), array(
			'a.fromPublisherId' => 'b.publisherId',
			'a.fromStreamName' => 'b.streamName'
		))->where($where)
		->groupBy('b.publisherId')
		->ignoreCache()
		->execute()
		->fetch(PDO::FETCH_NUM);
	}
	
	/**
	 * Any fetched database rows that extend the stream
	 * @property $rows
	 * @type array
	 */
	public $rows = array();
	
	/**
	 * @property $preloaded
	 * @static
	 * @type array
	 */
	static $preloaded = array();
};

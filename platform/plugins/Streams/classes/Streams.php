<?php

/**
 * Streams model
 * @module Streams
 * @main Streams
 */
/**
 * Static methods for the Streams models.
 * @class Streams
 * @extends Base_Streams
 * @abstract
 */
abstract class Streams extends Base_Streams
{
	/*
	 * This is where you would place all the static methods for the models,
	 * the ones that don't strongly pertain to a particular row or table.
	 */

	/**
	 * Read levels
	 * @property $READ_LEVEL
	 * @type array
	 */
	/**
	 * Can't see the stream
	 * @property $READ_LEVEL['none']
	 * @type integer
	 * @default 0
	 * @final
	 */
	/**
	 * Can see icon and title
	 * @property $READ_LEVEL['see']
	 * @type integer
	 * @default 10
	 * @final
	 */
	/**
	 * Can see the stream's content
	 * @property $READ_LEVEL['content']
	 * @type integer
	 * @default 20
	 * @final
	 */
	/**
	 * Can see relations to other streams
	 * @property $READ_LEVEL['relations']
	 * @type integer
	 * @default 25
	 * @final
	 */
	/**
	 * Can see participants in the stream
	 * @property $READ_LEVEL['participants']
	 * @type integer
	 * @default 30
	 * @final
	 */
	/**
	 * Can play stream in a player
	 * @property $READ_LEVEL['messages']
	 * @type integer
	 * @default 40
	 * @final
	 */
	/**
	 * Max read level
	 * @property $READ_LEVEL['max']
	 * @type integer
	 * @default 40
	 * @final
	 */
	public static $READ_LEVEL = array(
		'none' => 0,				// can't see the stream
		'see' => 10,				// can see icon and title
		'content' => 20,			// can see the stream's content
		'relations' => 25,			// can see relations to other streams
		'participants' => 30,		// can see participants in the stream
		'messages' => 40,			// can play stream in a player
		'max' => 40
	);
	/**
	 * Write levels
	 * @property $WRITE_LEVEL
	 * @type array
	 */
	/**
	 * Cannot affect stream or participants list
	 * @property $WRITE_LEVEL['none']
	 * @type integer
	 * @default 0
	 * @final
	 */
	/**
	 * Can become a participant, chat, and leave
	 * @property $WRITE_LEVEL['join']
	 * @type integer
	 * @default 10
	 * @final
	 */
	/**
	 * Can vote for a relation message posted to the stream.
	 * @property $WRITE_LEVEL['vote']
	 * @type integer
	 * @default 13
	 * @final
	 */
	/**
	 * Can suggest actions, but manager must approve
	 * @property $WRITE_LEVEL['suggest']
	 * @type integer
	 * @default 15
	 * @final
	 */
	/**
	 * Can contribute to the stream (e.g. "join the stage")
	 * @property $WRITE_LEVEL['contribute']
	 * @type integer
	 * @default 18
	 * @final
	 */
	/**
	 * Can send ephemeral payloads to the stream to be broadcast
	 * @property $WRITE_LEVEL['ephemeral']
	 * @type integer
	 * @default 19
	 * @final
	 */
	/**
	 * Can post durable messages which appear immediately
	 * @property $WRITE_LEVEL['post']
	 * @type integer
	 * @default 20
	 * @final
	 */
	/**
	 * Can post messages relating other streams to this one
	 * @property $WRITE_LEVEL['relate']
	 * @type integer
	 * @default 23
	 * @final
	 */
	/**
	 * Can update weights and properties of relations directly, and unrelate
	 * @property $WRITE_LEVEL['relations']
	 * @type integer
	 * @default 25
	 * @final
	 */
	/**
	 * Can post messages to edit stream content immediately
	 * @property $WRITE_LEVEL['edit']
	 * @type integer
	 * @default 30
	 * @final
	 */
	/**
	 * Can post a message requesting to close the stream
	 * @property $WRITE_LEVEL['closePending']
	 * @type integer
	 * @default 35
	 * @final
	 */
	/**
	 * Don't delete, just prevent any new changes to stream
	 * however, joining and leaving is still ok
	 * @property $WRITE_LEVEL['close']
	 * @type integer
	 * @default 40
	 * @final
	 */
	/**
	 * Max write level
	 * @property $WRITE_LEVEL['max']
	 * @type integer
	 * @default 40
	 * @final
	 */
	public static $WRITE_LEVEL = array(
		'none' => 0,
		'join' => 10,
		'vote' => 13,
		'contribute' => 18,		
		'post' => 20,
		'relate' => 23,
		'relations' => 25,
		'suggest' => 28,
		'edit' => 30,
		'closePending' => 35,
		'close' => 40,
		'max' => 40
	);
	/**
	 * Admin levels
	 * @property $ADMIN_LEVEL
	 * @type array
	 */
	/**
	 * Cannot do anything related to admin / users
	 * @property $ADMIN_LEVEL['none']
	 * @type integer
	 * @default 0
	 * @final
	 */
	/**
	 * Can prove things about the stream's content or participants
	 * @property $ADMIN_LEVEL['tell']
	 * @type integer
	 * @default 10
	 * @final
	 */
	/**
	 * Can share the stream's actual content with others
	 * @property $ADMIN_LEVEL['share']
	 * @type integer
	 * @default 10
	 * @final
	 */
	/**
	 * Able to create invitations for others, granting access
	 * and permissions up to what they themselves have
	 * @property $ADMIN_LEVEL['invite']
	 * @type integer
	 * @default 20
	 * @final
	 */
	/**
	 * Can approve posts, and give people any adminLevel < 'manage'
	 * @property $ADMIN_LEVEL['manage']
	 * @type integer
	 * @default 30
	 * @final
	 */
	/**
	 * Can give people any adminLevel <= 'own'
	 * @property $ADMIN_LEVEL['own']
	 * @type integer
	 * @default 40
	 * @final
	 */
	/**
	 * Max admin level
	 * @property $ADMIN_LEVEL['max']
	 * @type integer
	 * @default 40
	 * @final
	 */
	public static $ADMIN_LEVEL = array(
		'none' => 0,
		'tell' => 10,
		'share' => 15,
		'invite' => 20,
		'manage' => 30,
		'own' => 40,
		'max' => 40
	);
	/**
	 * Access sources
	 * @property $ACCESS_SOURCES
	 * @type array
	 */
	/**
	 * Public access
	 * @property $ACCESS_SOURCES['public']
	 * @type integer
	 * @default 0
	 * @final
	 */
	/**
	 * From contact
	 * @property $ACCESS_SOURCES['contact']
	 * @type integer
	 * @default 1
	 * @final
	 */
	/**
	 * Direct access
	 * @property $ACCESS_SOURCES['direct']
	 * @type integer
	 * @default 2
	 * @final
	 */
	/**
	 * Inherited public access
	 * @property $ACCESS_SOURCES['inherited_public']
	 * @type integer
	 * @default 3
	 * @final
	 */
	/**
	 * Inherited from contact
	 * @property $ACCESS_SOURCES['inherited_contact']
	 * @type integer
	 * @default 4
	 * @final
	 */
	/**
	 * Inherited direct access
	 * @property $ACCESS_SOURCES['inherited_direct']
	 * @type integer
	 * @default 5
	 * @final
	 */
	public static $ACCESS_SOURCES = array(
		'public' => 0,
		'contact' => 1,
		'direct' => 2,
		'inherited_public' => 3,
		'inherited_contact' => 4,
		'inherited_direct' => 5
	);

	/**
	 * Fetches streams from the database.
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
	 * @param {string} [$fields='*']
	 *  Comma delimited list of fields to retrieve in the stream.
	 *  Must include at least "publisherId" and "name".
	 *  since make up the primary key of the stream table.
	 * @param {array} [$options=array()]
	 *  Provide additional query options like 'limit', 'offset', 'orderBy', 'where' etc.
	 *  See Db_Query_Mysql::options().
	 *  @param {boolean|string} [$options.begin] This can be used to begin a transaction,
	 *   it is passed to Db_Row->retrieve() but only when fetching one stream.
	 *   Later on, you should tell $stream->save() or $stream->changed() to commit the transaction.
	 *  @param {boolean} [$options.refetch] Ignore cache of previous calls to fetch, 
	 *   and save a new cache if necessary.
	 *  @param {boolean} [$options.dontCache] Do not cache the results of
	 *   fetching the streams
	 *  @param {boolean} [$options.withParticipant=false]
	 *   Additionally call ->set('participant', $p) on the stream objects,
	 *   with the participant object corresponding to $asUserId, if any.
	 *  @param {array} [$options.withMessageTotals]
	 *   Pass an array of ($streamName => $messageTypes) here
	 *   to additionally call ->set('messageTotals', $t) on the stream objects.
	 *  @param {array} [$options.withRelatedToTotals]
	 *	 pass array('withRelatedFromTotals' => array($streamName => true)) for all rows
	 *	 pass array('withRelatedFromTotals' => array($streamName => array($relationType$, ...))) for particular rows
	 *   to additionally call ->set('relatedToTotals', $t) on the stream objects.
	 *  @param {array} [$options.withRelatedFromTotals]
	 *	 pass array('withRelatedFromTotals' => array($streamName => true)) for all rows
	 *	 pass array('withRelatedFromTotals' => array($streamName => array('relationType', ...))) for particular rows
	 *   to additionally call ->set('relatedFromTotals', $t) on the stream objects.
	 *  @param {reference} $results=array()
	 *   pass an array here, to be filled with intermediate results you might want to use
	 * @return {array}
	 *  Returns an array of Streams_Stream objects with access info calculated
	 *  specifically for $asUserId . Make sure to call the methods 
	 *  testReadLevel(), testWriteLevel() and testAdminLevel()
	 *  on these streams before using them on the user's behalf.
	 */
	static function fetch(
		$asUserId,
		$publisherId,
		$name,
		$fields = '*',
		$options = array(),
		&$results = array())
	{
		if (!isset($asUserId)) {
			$asUserId = Users::loggedInUser();
			if (!$asUserId) $asUserId = "";
		}
		if ($asUserId instanceof Users_User) {
			$asUserId = $asUserId->id;
		}
		if ($publisherId instanceof Users_User) {
			$publisherId = $publisherId->id;
		}
		if (empty($publisherId) or empty($name)) {
			return array();
		}
		if (is_array($fields)) {
			$options = $fields;
			$fields = '*';
		}
		if ($fields === '*') {
			$fields = join(',', Streams_Stream::fieldNames());
		}
		$allCached = array();
		if (empty($options['refetch']) and empty($options['begin'])
		and (is_array($name) or is_string($name))) {
			$arr = is_array($name) ? $name : array($name);
			$namesToFetch = array();
			foreach ($arr as $n) {
				if (isset(self::$fetch[$asUserId][$publisherId][$n][$fields])) {
					$allCached[$n] = self::$fetch[$asUserId][$publisherId][$n][$fields];
				} else {
					$namesToFetch[] = $n;
				}
			}
		} else {
			$namesToFetch = $name;
		}
		$results['criteria'] = $criteria = array(
			'publisherId' => $publisherId,
			'name' => $namesToFetch
		);

		// Get streams and set their default access info
		$restoreCaching = false;
		if (!self::$dontCache and empty($options['dontCache'])) {
			$prevCaching = Db::allowCaching(false);
			$restoreCaching = true;
		}
		$allRetrieved = $namesToFetch
			? Streams_Stream::select($fields)
				->where($criteria)
				->ignoreCache()
				->options($options)
				->fetchDbRows(null, '', 'name')
			: array();
		
		if (!empty($options['withParticipant']) and $asUserId) {
			$prows = Streams_Participant::select()->where(array(
				'publisherId' => $publisherId,
				'streamName' => $namesToFetch,
				'userId' => $asUserId
			))->fetchDbRows(null, '', 'streamName');

			$ssr_rows = Streams_SubscriptionRule::select()->where(array(
				'publisherId' => $publisherId,
				'streamName' => $namesToFetch,
				'ofUserId' => $asUserId
			))->fetchDbRows(null, '', 'streamName');

			foreach ($allRetrieved as $s) {
				$participant = Q::ifset($prows, $s->name, null);

				if (gettype($participant) == 'object' && !empty($participant)) {
					$participant->subscriptionRules = Q::ifset($ssr_rows, $s->name, null);
				}

				$s->set('participant', $participant);
			}
		}

		$streams = $allCached ? array_merge($allCached, $allRetrieved) : $allRetrieved;

		Streams::calculateAccess($asUserId, $publisherId, $streams, false);
		
		$streams = self::messageTotals($publisherId, $name, $options, $streams);
		$streams = self::relatedToTotals($publisherId, $name, $options, $streams);
		$streams = self::relatedFromTotals($publisherId, $name, $options, $streams);

		if (is_array($name) and count($name) > 1) {
			// put the streams back in the same internal PHP array order
			// and in the process honor any duplicate names that might have been passed
			$temp = $streams;
			$streams = array();
			foreach ($name as $n) {
				$streams[$n] = isset($temp[$n]) ? $temp[$n] : null;
			}
		}

		$types = array();
		foreach ($streams as $stream) {
			if ($stream) {
				$types[$stream->type] = true;
			}
		}
		$types = array_keys($types);
		
		self::afterFetchExtended($publisherId, $streams);

		foreach ($types as $type) {
			$cached = array();
			$retrieved = array();
			foreach ($allCached as $n => $s) {
				if ($s->type === $type) {
					$cached[$n] = $s;
				}
			}
			foreach ($allRetrieved as $n => $s) {
				if ($s->type === $type) {
					$retrieved[$n] = $s;
				}
			}
			$params = array(
				'streams' => &$streams,
				'cached' => $cached,
				'retrieved' => $retrieved,
				'allCached' => $allCached,
				'allRetrieved' => $allRetrieved,
				'asUserId' => $asUserId,
				'publisherId' => $publisherId,
				'name' => $name,
				'criteria' => $criteria,
				'fields' => $fields,
				'options' => $options,
				'type' => $type
			);
			/**
			 * @event Streams/fetch/$streamType {after}
			 * @param {&array} streams
			 * @param {string} asUserId
			 * @param {string} publisherId
			 * @param {string} name
			 * @param {array} criteria
			 * @param {string} fields
			 * @param {array} options also contains "duringInternal", may want to return early in that case
			 */
			Q::event("Streams/fetch/$type", $params, 'after', false, $streams);
		}

		if (!self::$dontCache and empty($options['dontCache'])) {
			foreach ($streams as $n => $stream) {
				self::$fetch[$asUserId][$publisherId][$n][$fields] = $stream;
			}
		}
		if ($restoreCaching) {
			Db::allowCaching($prevCaching);
		}
		return $streams;
	}

	/**
	 * Fetches public streams from the database, even from multiple publishers.
	 * Unlike Streams::fetch(), this method doesn't check the access control,
	 * because the streams should be accessible to be read by anybody.
	 * It simply returns the Streams_Stream rows with their own read/write/admin levels.
	 * Also, it skips any sort of template and mutable stuff.
	 * @method fetchPublicStreams
	 * @static
	 * @param {array} $publishersAndNames
	 *  Array of ($publisherId => $namesArray) pairs
	 * @return {array}
	 *  Returns an array of Streams_Stream objects indexed by
	 *  $publisherId => $name => $stream
	 *  It may end up missing some streams, if they weren't in the database.
	 */
	static function fetchPublicStreams(
		$publishersAndNames,
		$fields = '*',
		$options = array(),
		&$results = array())
	{
		if ($fields === '*') {
			$fields = join(',', Streams_Stream::fieldNames());
		}
		$pns = array();
		foreach ($publishersAndNames as $publisherId => $names) {
			foreach ($names as $name) {
				$pns[] = array($publisherId, $name);
			}
		}
		$rows = Streams_Stream::select($fields)->where(array(
			'publisherId,name' => $pns
		))->fetchDbRows();
		$streams = array();
		foreach ($rows as $row) {
			$row->set('public', true);
			if ($row->readLevel === Streams::$READ_LEVEL['max']) {
				// make sure the stream really has max read level
				$streams[$row->publisherId][$row->name] = $row;
			}
		}
		return $streams;
	}
	
	/**
	 * Fetches one stream from the database.
	 * Only here for backward compatibility. @see Streams_Stream::fetch();
	 * @method fetchOne
	 * @static
	 * @param {string} $asUserId
	 * @param {string} $publisherId
	 * @param {string|array|Db_Range} $name
	 * @param {string|boolean} $fields='*'
	 * @param {array} $options=array()
	 *  @param {boolean|string} [$options.begin]
	 *  @param {boolean} [$options.refetch]
	 *  @param {boolean} [$options.dontCache]
	 *  @param {boolean} [$options.withParticipant]
	 *  @param {array} [$options.withMessageTotals]
	 *  @param {array} [$options.withRelatedToTotals]
	 *  @param {array} [$options.withRelatedFromTotals]
	 *  @param {reference} $results=array()
	 * @return {Streams_Stream|null}
	 * @throws {Q_Exception_MissingRow} If the stream is missing and $fields == true
	 */
	static function fetchOne(
		$asUserId,
		$publisherId,
		$name,
		$fields = '*',
		$options = array(),
		&$results = array())
	{
		return Streams_Stream::fetch($asUserId, $publisherId, $name, $fields, $options, $results);
	}

	/**
	 * Fetch and return a stream if it is already in the database,
	 * otherwise create it in the database and then return it.
	 * May throw Users_Exception_NotAuthorized if stream doesn't exist
	 * and asUserId is not authorized to create this stream.
	 * @method fetchOneOrCreate
	 * @static
	 * @param {string} $asUserId used for fetchOne and create functions
	 * @param {string} $publisherId used for fetchOne and create functions
	 * @param {string} $name used for fetchOne and create functions
	 * @param {array} [$options] to pass to fetchOne. Also the following options to be used with stream creation:
	 * @param {boolean|array} [$options.subscribe] pass true to autosubscribe 
	 *   to the stream right after creating it. You can also pass an array of options 
	 *   that will be passed to the subscribe function.
	 * @param {array} [$options.fields] to pass to create function,
	 *   if you want to set some fields besides "name"
	 * @param {array} [$options.relate] to pass to create function,
	 *   if you want to relate the newly created stream to a category
	 * @param {array} [$options.type] to pass to create function,
	 *   not required if the stream is described in Streams::userStreams (streams.json files)
	 * @param {reference} [$results=array()] pass an array to fill with intermediate results
	 *   such as "created" => boolean
	 * @return {Streams_Stream|null} Returns the created stream, if any
	 * @throws {Users_Exception_NotAuthorized}
	 */
	static function fetchOneOrCreate(
		$asUserId,
		$publisherId,
		$name,
		$options = array(),
		&$results = array())
	{
		return Streams_Stream::fetchOrCreate($asUserId, $publisherId, $name, $options, $results);
	}

	/**
	 * Tell the client using scriptData to call Q.Streams.arePublic()
	 * and mark some streams as public
	 * @method arePublic
	 * @static
	 * @param {array} $publishersAndNames
	 *  Array of ($publisherId => $namesArray) pairs
	 */
	static function arePublic($publishersAndNames)
	{
		self::$arePublic = array_merge_recursive(
			self::$arePublic, 
			$publishersAndNames
		);
	}

	/**
	 * Calculates the access for one or more streams by querying the database
	 * Modifies the objects in the $streams array, setting their access levels.
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
	 * @param {string} $publisherId
	 *  The id of the user publishing these streams
	 * @param {array} $streams
	 *  An array of streams, obtained for example by Streams::fetch
	 * @param {boolean} [$recalculate=false]
	 *  Pass true here to force recalculating access to streams for which access was already calculated.
	 * @param {string} [$actualPublisherId=null]
	 *  For internal use only. Used by Streams::canCreateStreamType function.
	 * @param {string} [$inheritAccess=true]
	 *  Set to false to skip inheriting access from other streams, even if specified
	 * @return {integer}
	 *  The number of streams that were recalculated
	 */
	static function calculateAccess(
		$asUserId,
		$publisherId,
		$streams,
		$recalculate = false,
		$actualPublisherId = null,
		$inheritAccess = true)
	{
		if (!isset($asUserId)) {
			$asUserId = Users::loggedInUser();
			if (!$asUserId) $asUserId = "";
		}
		if ($asUserId instanceof Users_User) {
			$asUserId = $asUserId->id;
		}
		if ($publisherId instanceof Users_User) {
			$publisherId = $publisherId->id;
		}
		if (!isset($actualPublisherId)) {
			$actualPublisherId = $publisherId;
		}
		if ($recalculate) {
			$streams2 = $streams;
		} else {
			$streams2 = array();
			foreach ($streams as $k => $s) {
				if ($s->get('readLevel', null) === null) {
					$streams2[$k] = $s;
				}
			}
		}
		if (empty($streams2)) {
			return 0;
		}

		$public_source = Streams::$ACCESS_SOURCES['public'];
		$contact_source = Streams::$ACCESS_SOURCES['contact'];
		$direct_source = Streams::$ACCESS_SOURCES['direct'];

		$streams3 = array();
		$names = array();
		foreach ($streams2 as $s) {
			if ($s->get('asUserId', null) === $asUserId) {
				continue;
			}
			$s->set('asUserId', $asUserId);
			if ($asUserId and $asUserId == $actualPublisherId) {
				// The publisher should have full access to every one of their streams.
				// Streams which are "required", though, won't be deleted by the system.
				$required = Q_Config::get('Streams', 'requiredUserStreams', $s->name, false);
				$s->set('isRequired', $required);
				$s->set('readLevel', Streams::$READ_LEVEL['max']);
				$s->set('writeLevel', Streams::$WRITE_LEVEL['max']);
				$s->set('adminLevel', Streams::$ADMIN_LEVEL['max']);
				$s->set('readLevel_source', $direct_source);
				$s->set('writeLevel_source', $direct_source);
				$s->set('adminLevel_source', $direct_source);
				$s->publishedByFetcher(true);
				continue;
			}
			$s->set('readLevel', $s->readLevel);
			$s->set('writeLevel', $s->writeLevel);
			$s->set('adminLevel', $s->adminLevel);
			$s->set('permissions', $s->getAllPermissions());
			$s->set('readLevel_source', $public_source);
			$s->set('writeLevel_source', $public_source);
			$s->set('adminLevel_source', $public_source);
			$s->set('permissions_source', $public_source);
			if (empty($asUserId)) {
				continue; // No need to fetch further access info.
			}

			$names[] = $s->name;
			$names[] = $s->type."*";
			$streams3[] = $s;
		}

		if (empty($streams3)) {
			return count($streams2);
		}

		$names = array_unique($names);

		// Get the per-label access data
		// Avoid making a join to allow more flexibility for sharding
		$accesses = Streams_Access::select()
			->where(array(
				'publisherId' => array($publisherId, ''),
				'streamName' => $names,
				'ofUserId' => array('', $asUserId)
			))->ignoreCache()->fetchDbRows();

		$labels = array();
		foreach ($accesses as $access) {
			if ($access->ofContactLabel) {
				$labels[] = $access->ofContactLabel;
			}
		}
		if (!empty($labels)) {
			$labels = array_unique($labels);
			$contacts = Users_Contact::fetch($actualPublisherId, $labels, array(
				'contactUserId' => $asUserId,
				'skipAccess' => true
			));
			foreach ($contacts as $contact) {
				foreach ($accesses as $access) {
					if ($access->ofContactLabel !== $contact->label) {
						continue;
					}
					foreach ($streams3 as $stream) {
						$tail = substr($access->streamName, -1);
						$head = substr($access->streamName, 0, -1);
						if ($stream->name !== $access->streamName
							and ($tail !== '*' or $head !== $stream->type)) {
							continue;
						}
						$readLevel = $stream->get('readLevel', 0);
						$writeLevel = $stream->get('writeLevel', 0);
						$adminLevel = $stream->get('adminLevel', 0);
						if ($access->readLevel >= 0 and $access->readLevel > $readLevel) {
							$stream->set('readLevel', $access->readLevel);
							$stream->set('readLevel_source', $contact_source);
						}
						if ($access->writeLevel >= 0 and $access->writeLevel > $writeLevel) {
							$stream->set('writeLevel', $access->writeLevel);
							$stream->set('writeLevel_source', $contact_source);
						}
						if ($access->adminLevel >= 0 and $access->adminLevel > $adminLevel) {
							$stream->set('adminLevel', $access->adminLevel);
							$stream->set('adminLevel_source', $contact_source);
						}
						$p1 = $access->getAllPermissions();
						$p2 = $stream->get('permissions', array());
						$stream->set('permissions', array_unique(array_merge($p1, $p2)));
						$stream->set('permissions_source', $contact_source);
					}
				}
			}
		}

		// Override with per-user access data
		foreach ($accesses as $access) {
			foreach ($streams3 as $stream) {
				$tail = substr($access->streamName, -1);
				$head = substr($access->streamName, 0, -1);
				if ($stream->name !== $access->streamName
					and ($tail !== '*' or $head !== $stream->type)) {
					continue;
				}
				if ($access->ofUserId === $asUserId) {
					if ($access->readLevel >= 0) {
						$stream->set('readLevel', $access->readLevel);
						$stream->set('readLevel_source', $direct_source);
					}
					if ($access->writeLevel >= 0) {
						$stream->set('writeLevel', $access->writeLevel);
						$stream->set('writeLevel_source', $direct_source);
					}
					if ($access->adminLevel >= 0) {
						$stream->set('adminLevel', $access->adminLevel);
						$stream->set('adminLevel_source', $direct_source);
					}
					$stream->set('permissions', $access->getAllPermissions());
					$stream->set('permissions_source', $direct_source);
				}
			}
		}

		if ($inheritAccess) {
			$streams4 = array();
			$toFetch = array();
			foreach ($streams3 as $s) {
				if (empty($s->inheritAccess)) {
					continue;
				}
				$inheritAccess = json_decode($s->inheritAccess, true);
				if (!$inheritAccess or !is_array($inheritAccess)) {
					continue;
				}
				$streams4[] = $s;
				foreach ($inheritAccess as $ia) {
					$toFetch[reset($ia)][] = next($ia);
				}
			}
			// group the fetches by publisher and execute them in batches
			foreach ($toFetch as $publisherId => $streamNames) {
				$streamNames = array_unique($streamNames);
				Streams::fetch($asUserId, $publisherId, $streamNames, '*', array(
					'duringInternal' => 'calculateAccess'
				));
			}
			// this will now use the cached results of the above calls to Streams::fetch
			foreach ($streams4 as $s) {
				$s->inheritAccess();
			}
		}

		return count($streams2);
	}
	
	/**
	 * Calculates whether a given user is authorized by a given publisher
	 * to create a type of stream.
	 * @method canCreateStreamType
	 * @static
	 * @param {string} $userId The user who would be creating the stream.
	 * @param {string} $publisherId The id of the user who would be publishing the stream.
	 * @param {string} $streamType The type of the stream that would be created
	 * @param {array} [$relate=array()]
	 *  The user would also be authorized if the stream would be related to
	 *  an existing category stream, in which the user has a writeLevel of at least "relate",
	 *  and the user that would be publishing this new stream has a template for this stream type
	 *  that is related to either the category stream or a template matching the category stream.
	 *  To test for this, pass an array with the following keys:
	 * @param {string} $relate.publisherId The id of the user publishing that stream, defaults to $publisherId
	 * @param {string} $relate.streamName The name of the stream to which the new stream would be related
	 * @param {string} $relate.type The type of relation, defaults to ""
	 * @return {Streams_Stream|boolean} Returns a stream template the user must use,
	 *  otherwise a boolean true/false to indicate a yes or no regardless of template.
	 */
	static function canCreateStreamType(
		$userId,
		$publisherId,
		$streamType,
		$relate = array())
	{
		$authorized = false;
		if (!empty($relate['streamName'])) {
			if (empty($relate['publisherId'])) {
				$relate['publisherId'] = $publisherId;
			}
			if (empty($relate['type'])) {
				$relate['type'] = '';
			}
		}
		if ($publisherId == $userId) {
			$authorized = true; // user can publish streams under their own name
		}

		// user can publish streams of this type
		// on behalf of publisher if the user is in "admins" config for that type
		$labelsAuthorized = Streams_Stream::getConfigField(
			$streamType, array('canCreate'), array()
		);
		if (Users::roles($publisherId, $labelsAuthorized, array(), $userId)) {
			$authorized = true;
		}

		if (!$authorized) {
			// Check for permissions using templates
			$template = new Streams_Stream();
			$template->publisherId = $publisherId;
			$template->name = $streamType.'/';
			$template->type = 'Streams/template';
			$retrieved = $template->retrieve();
			if (!$retrieved) {
				$template->publisherId = '';
				$retrieved = $template->retrieve();
			}
			if ($retrieved) {
				$template->calculateAccess($userId, false, $publisherId);
				if ($template->testAdminLevel('own')) {
					$authorized = $template;
				}
			}
		}
		if (!$authorized and $retrieved and !empty($relate['streamName'])) {
			// Check if user is perhaps authorized to create a related stream
			$to_stream = Streams_Stream::fetch(
				$userId, $relate['publisherId'], $relate['streamName']
			);
			if ($to_stream and $to_stream->testWriteLevel('relate')) {
				$to_template = new Streams_Stream();
				$to_template->publisherId = $to_stream->publisherId;
				$to_template->name = $to_stream->type.'/';
				$to_template->type = 'Streams/template';
				$retrieved = $to_template->retrieve();
				if (!$retrieved) {
					$to_template->publisherId = '';
					$retrieved = $to_template->retrieve();
				}
				if ($retrieved) {
					$relatedTo = new Streams_RelatedTo();
					$relatedTo->toPublisherId = $to_template->publisherId;
					$relatedTo->toStreamName = $to_template->name;
					$relatedTo->type = $relate['type'];
					$relatedTo->fromPublisherId = $template->publisherId;
					$relatedTo->fromStreamName = $template->name;
					if ($retrieved = $relatedTo->retrieve()) {
						$authorized = $template;
					}
				}
			}
		}	
		return $authorized;
	}
	
	/**
	 * Creates a new stream in the system
	 * @method create
	 * @static
	 * @param {string} $asUserId The user who is attempting to create the stream.
	 * @param {string} $publisherId The id of the user to publish the stream.
	 * @param {string|array} [$type=null] The type of the stream to create.
	 *   Required unless you specify the name of the stream in the options,
	 *   and you've specified its type in a config file listed under a config named
	 *   "Streams/userStreams/$module".
	 * @param {array} [$fields=array()] Use this to set additional fields for the stream:
	 * @param {string} [$fields.title=null] You can set the stream's title
	 * @param {string} [$fields.icon=null] You can set the stream's icon
	 * @param {string} [$fields.title=null] You can set the stream's content
	 * @param {string|array} [$fields.attributes=null] You can set the stream's attributes directly as a JSON string
	 * @param {string|integer} [$fields.readLevel=null] You can set the stream's read access level, see Streams::$READ_LEVEL
	 * @param {string|integer} [$fields.writeLevel=null] You can set the stream's write access level, see Streams::$WRITE_LEVEL
	 * @param {string|integer} [$fields.adminLevel=null] You can set the stream's admin access level, see Streams::$ADMIN_LEVEL
	 * @param {string} [$fields.name=null] Here you can specify an exact name for the stream to be created. Otherwise a unique one is generated automatically.
	 * @param {boolean} [$fields.skipAccess=false] Skip all access checks when creating and relating the stream.
	 * @param {array} [$relate=array()]
	 *  Fill this out in order to relate the newly created stream to a category stream,
	 *  and also inheritAccess from it. When using this option, a user may be authorized
	 *  to create a stream they would otherwise not be authorized to create.
	 *  This happens when the asUserId user has a writeLevel of at least "relate" in the
	 *  existing category stream, and the publisherId user has a template for this stream
	 *  type that is related to either the category stream, or a template for the
	 *  category stream's type.
	 * @param {string} [$relate.publisherId] The id of the user publishing the category stream, defaults to $publisherId
	 * @param {string} [$relate.streamName] The name of the category stream
	 * @param {string} [$relate.type] The type of relation, defaults to ""
	 * @param {string} [$relate.weight] To set the weight for the relation. You can pass a numeric value here, or something like "max+1" to make the weight 1 greater than the current MAX(weight)
	 * @param {string} [$relate.inheritAccess=true] If false skip inherit access from category.
	 * @param {array} [&$result=null] Optionally pass a reference here to hold the result of calling Streams::relate().
	 * @return {Streams_Stream} Returns the stream that was created.
	 * @throws {Users_Exception_NotAuthorized}
	 */
	static function create(
		$asUserId, 
		$publisherId, 
		$type = null,
		$fields = array(), 
		$relate = null,
		&$result = null)
	{
		if (!isset($fields)) {
			$fields = array();
		}
		$skipAccess = Q::ifset($fields, 'skipAccess', false);
		if (!isset($asUserId)) {
			$asUserId = Users::loggedInUser(true)->id;
		} else if ($asUserId instanceof Users_User) {
			$asUserId = $asUserId->id;
		}
		if ($publisherId instanceof Users_User) {
			$publisherId = $publisherId->id;
		}
		
		// OK we are good to go!
		$stream = new Streams_Stream;
		$stream->publisherId = $publisherId;
		if (!empty($fields['name'])) {
			$stream->name = $fields['name'];
			if ($stream->retrieve()) {
				throw new Q_Exception_AlreadyExists(array('source' => 'stream'));
			}
			$p = Streams::userStreamsTree();
			if ($info = $p->get($fields['name'], array())) {
				foreach (Base_Streams_Stream::fieldNames() as $f) {
					if (isset($info[$f])) {
						$stream->$f = $info[$f];
					}
				}
				if (isset($info['type']) and $type and $info['type'] !== $type) {
					throw new Streams_Exception_Type(array(
						'expectedType' => $info['type'],
						'type' => $type
					));
				}
			}
		}
		if (!isset($stream->type)) {
			if (empty($type)) {
				throw new Q_Exception_RequiredField(array('field' => 'type'));
			}
			$stream->type = $type;
		}
		$authorized = self::canCreateStreamType(
			$asUserId, $publisherId, $stream->type, $relate
		);
		if (!$authorized and !$skipAccess) {
			throw new Users_Exception_NotAuthorized();
		}
		
		// prepare attributes field
		if (isset($fields['attributes'])) {
			if (is_array($fields['attributes'])) {
				$fields['attributes'] = Q::json_encode($fields['attributes']);
			} else if (is_string($fields['attributes'])) {
				Q::json_decode($fields['attributes']); // may throw an exception
			}
		}

		// extend with any config defaults for this stream type
		$fieldNames = Streams::getExtendFieldNames($type);
		$fieldNames[] = 'name';
		foreach ($fieldNames as $f) {
			if (isset($fields[$f])) {
				$stream->$f = $fields[$f];
			}
		}
	
		// ready to persist this stream to the database
		if (!empty($relate['streamName']) && Q::ifset($relate, 'inheritAccess', true)) {
			$rs = Streams_Stream::fetch(
				$asUserId,
				$relate['publisherId'],
				$relate['streamName']
			);
			// $inheritAccess = ($rs and $rs->inheritAccess)
			// 	? Q::json_decode($rs->inheritAccess)
			// 	: array();
			// $newInheritAccess = array($relate['publisherId'], $relate['streamName']);
			// if (!in_array($newInheritAccess, $inheritAccess)) {
			// 	$inheritAccess[] = $newInheritAccess;
			// }
			// $stream->inheritAccess = Q::json_encode($inheritAccess);
			$stream->inheritAccess = Q::json_encode(array(
				array($relate['publisherId'], $relate['streamName'])
			));
		}
		$stream->set('createdAsUserId', $asUserId);
		$stream->save();
		$stream->post($asUserId, array(
			'type' => 'Streams/created',
			'content' => '',
			'instructions' => $stream->toArray()
		), true);
		
		// relate the stream to category stream, if any
		if (!empty($relate['streamName'])) {
			$relationType = isset($relate['type']) ? $relate['type'] : '';
			$result = Streams::relate(
				$asUserId,
				$relate['publisherId'], 
				$relate['streamName'],
				$relationType,
				$stream->publisherId, 
				$stream->name,
				array(
					'weight' => isset($relate['weight']) ? $relate['weight'] : null,
					'skipAccess' => $skipAccess
				)
			);
		}

		self::$fetch[$asUserId][$publisherId][$stream->name] = array('*' => $stream);

		return $stream;
	}
	
	/**
	 * Creates multiple streams in the system. Skips access control checks.
	 * @method createStreams
	 * @static
	 * @param {string} $asUserId The user who is attempting to create the stream.
	 * @param {string} $publisherId The id of the user to publish the streams.
	 * @param {array} $fields Each stream's fields are a sub-array in this array
	 * @return {array} Returns Streams_Stream objects representing streams
	 *  that were created, but really they were saved using insertManyAndExecute.
	 * @throws {Users_Exception_NotAuthorized}
	 */
	static function createStreams(
		$asUserId,
		$publisherId, 
		$fields = array())
	{
		if (empty($fields)) {
			return array();
		}
		if (!isset($publisherId)) {
			foreach ($fields as $f) {
				if (!isset($f['publisherId'])) {
					throw new Q_Exception_RequiredField(array('name' => 'publisherId'));
				}
				$pid = $f['publisherId'];
				$arr[$pid] = $f;
			}
			$ret = array();
			foreach ($arr as $pid => $f) {
				$ret[$pid] = array_merge($ret, Streams::createStreams($asUserId, $pid, $f));
			}
			return $ret;
		}

		$streamFieldNames = Base_Streams_Stream::fieldNames();
		
		$toCreate = array();
		$p = Streams::userStreamsTree();
		$streams = array();
		$messages = array();
		foreach ($fields as $k => &$f) {
			if (!isset($f['type'])) {
				throw new Q_Exception_RequiredField(array('name' => 'type'));
			}
			$a = isset($f['attributes']) ? $f['attributes'] : null;
			if (is_array($a) and !empty($a)) {
				$a = Q::json_encode($a);
				$f['attributes'] = $a;
			} else {
				$f['attributes'] = null;
			}
			$a = isset($f['inheritAccess']) ? $f['inheritAccess'] : '';
			if (is_array($a)) {
				$a = Q::json_encode($a);
				$f['inheritAccess'] = $a;
			}
			$tc = @compact('publisherId');
			if ($name = isset($f['name']) ? $f['name'] : null) {
				if ($info = $p->get($name, array())) {
					foreach ($streamFieldNames as $fn) {
						if (isset($info[$fn])) {
							$tc[$fn] = $info[$fn];
						}
					}
					if (isset($info['type']) and $info['type'] !== $f['type']) {
						throw new Streams_Exception_Type(array('type' => $info['type']));
					}
				}
			}

			// extend with any config defaults for this stream type
			$fieldNames = Streams::getExtendFieldNames($f['type']);
			$fieldNames[] = 'name';
			foreach ($fieldNames as $fn) {
				if (isset($f[$fn])) {
					$tc[$fn] = $f[$fn];
				}
			}
			
			// simulate calls to beforeSave, to update avatars and do other stuff
			$s = new Streams_Stream($tc);
			$s->beforeSave($tc);
			$s->fields['insertedTime'] = new Db_Expression('CURRENT_TIMESTAMP');
			$toCreate[$s->name] = $s->fields;
			$streams[$s->name] = $s;
			
			$messages[$publisherId][$s->name][] = array(
				'type' => 'Streams/created',
				'content' => '',
				'instructions' => $s->fields
			);
		}

		Streams_Stream::insertManyAndExecute($toCreate, array('columns' => $streamFieldNames));

		if (!empty($messages)) {
			Streams_Message::postMessages($asUserId, $messages, true);
		}

		foreach ($streams as $name => $s) {
			$modifiedFields = $s->fields;
			foreach ($modifiedFields as $fn => $wasModified) {
				$s->notModified($fn);
				$s->wasRetrieved(true);
			}
			$s->afterSaveExecute(null, null, $modifiedFields, $s->getPKValue());
		}
		
		return $streams;
	}

	/**
	 * Takes some information out of an existing set of streams
	 * @method take
	 * @static
	 * @param {array} $streams
	 * @param {string} $name
	 * @param {string} $readLevel
	 *  Test each stream for at least this read level.
	 *  If the test fails, return null in its stead.
	 * @param {string|array} $field='content'
	 *  Optional. Defaults to "content".
	 *  Can be an array of fields, in which case the function returns an array.
	 * @param {boolean} [$escape=false]
	 *  Defaults to false. If true, escapes the values as HTML
	 * @return {mixed}
	 *  Returns the value of the field, or an array of values, depending on
	 *  whether $field is an array or a string
	 */
	static function take(
		$streams,
		$name,
		$readLevel,
		$field = 'content',
		$escape = false)
	{
		if (!isset($streams[$name])) {
			return null;
		}
		$result = array();
		$was_array = is_array($field);
		$arr = $was_array ? $field : array($field);
		foreach ($arr as $f) {
			if (!isset($streams[$name]->$f))  {
				return null;
			}
			if (!$streams[$name]->testReadLevel($readLevel)) {
				return null;
			}
			$result[$f] = !$escape
				? $streams[$name]->$f
				: Q_Html::text($streams[$name]->$f);
		}
		return $was_array ? $result : reset($result);
	}

	/**
	 * Get all the streams starting with "Streams/user/" for a particular user.
	 * This is cached via Streams:;fetch, so you can call it repeatedly.
	 * @method forUser
	 * @static
	 * @param {string} $asUserId The id of the user who's supposed to be accessing the stream.
	 * @param {string} $publisherId The id of the user who is publishing the streams.
	 * @return {array}
	 */
	static function forUser($asUserId, $publisherId)
	{
		if (!isset($asUserId) or !isset($publisherId)) {
			return null;
		}
		return Streams::fetch($asUserId, $publisherId, new Db_Range(
			'Streams/user/', true, false, null
		), '*');
	}

	/**
	 * A shorthand to get a stream whose name starts with "Streams/user/".
	 * @method my
	 * @static
	 * @param {string|array} $field='content'
	 *  Optional. Defaults to "content".
	 *  Can be an array of fields, in which case the function returns an array.
	 * @param {boolean} [$escape=false]
	 *  If true, escapes as HTML
	 * @return {mixed}
	 *  Returns the value of the field, or an array of values, depending on
	 *  whether $field is an array or a string
	 */
	static function my($name, $field = 'content', $escape = false)
	{
		$user = Users::loggedInUser();
		if (!$user) {
			return null;
		}
		$streams = Streams::forUser($user->id, $user->id); // cached
		// Since it's our stream, the testReadLevel will always succeed
		return Streams::take($streams, $name, 0, $field, $escape);
	}

	/**
	 * Get the publisher id from the request, if it can be deduced
	 * @method requestedPublisherId
	 * @static
	 * @param {boolean} $throwIfMissing=false
	 *  Optional. If true, throws an exception if the publisher id cannot be deduced
	 * @param {array|string} [$uri=Q_Dispatcher::uri()]
	 *  An array or string representing a uri to use instead of the Q_Dispatcher::uri()
	 * @return {integer}
	 *  The id of the publisher user
	 * @throws {Users_Exception_NoSuchUser}
	 *  If the URI contains an invalid "username"
	 * @throws {Q_Exception_RequiredField}
	 *  If the username can't be deduced, this is thrown
	 */
	static function requestedPublisherId($throwIfMissing = false, $uri = null)
	{
		if (isset(self::$requestedPublisherId_override)) {
			return self::$requestedPublisherId_override;
		}
		if (!isset($uri)) {
			$uri = Q_Dispatcher::uri();
		}
		$publisherId = null;
		if (isset($_REQUEST['publisherId'])) {
			$publisherId = $_REQUEST['publisherId'];
		} else if (isset($uri->publisherId)) {
			$publisherId = $uri->publisherId;
		} else if (isset($uri->username)) {
			$publisher = new Users_User();
			$publisher->username = $uri->username; // Warning: SECONDARY_LOOKUP
			if (!$publisher->retrieve()) {
				throw new Users_Exception_NoSuchUser(array(), 'username');
			}
			$publisherId = $publisher->id;
		} else if (Streams::$followedInvite) {
			$publisherId = Streams::$followedInvite->publisherId;
		} else if ($throwIfMissing) {
			throw new Q_Exception_RequiredField(
				array('field' => 'publisher id'),
				'publisherId'
			);
		}
		if ($throwIfMissing && !is_string($publisherId)) {
			throw new Q_Exception_WrongType(array('field' => 'publisherId', 'type' => 'string'));
		}
		return $publisherId;
	}

	/**
	 * Get the stream name from the request, if it can be deduced.
	 * Checks $_REQUEST['streamName'], then tries $_REQUEST['name'].
	 * If both are empty, tries Q_Dispatcher::uri() and returns "{$uri->name_prefix}{$uri->name}",
	 * which is useful when the URL contains just the last part of a stream's name.
	 * @method requestedName
	 * @static
	 * @param {boolean} $throwIfMissing=false
	 *  Optional. If true, throws an exception if the stream name cannot be deduced
	 * @param {string} [$returnAs='string'] Can be "array" or "string".
	 * @param {array|string} [$uri=Q_Dispatcher::uri()]
	 *  An array or string representing a uri to use instead of the Q_Dispatcher::uri()
	 * @return {string|Db_Range}
	 *  The name of the stream, or a Db_Range
	 * @throws {Q_Exception_RequiredField}
	 *  If the name can't be deduced, this is thrown
	 */
	static function requestedName($throwIfMissing = false, $returnAs = 'string', $uri = null)
	{
		if (isset(self::$requestedName_override)) {
			return self::$requestedName_override;
		}
		if (!isset($uri)) {
			$uri = Q_Dispatcher::uri();
		}
		$name = $result = null;
		$fieldName = 'streamName';
		if (isset($_REQUEST['streamName'])) {
			$result = $_REQUEST['streamName'];
		} else if (isset($_REQUEST['name'])) {
			$result = $_REQUEST['name'];
			$fieldName = 'name';
		} else if (isset($uri->streamName)) {
			$result = $uri->streamName;
		} else if (isset($uri->name)) {
			$fieldName = 'name';
			$result = $uri->name;
		}
		if (isset($result)) {
			if (is_array($result)) {
				if (Q::isAssociative($result)
				and isset($result['min'])
				and isset($result['includeMin'])) {
					$includeMin = filter_var($result['includeMin'], FILTER_VALIDATE_BOOLEAN);
					$includeMax = filter_var($result['includeMax'], FILTER_VALIDATE_BOOLEAN);
					$result = new Db_Range(
						$result['min'],
						$includeMin,
						$includeMax,
						$result['max']
					);
				} else {
					$result = implode('/', $result);
				}
			}
			$name = isset($uri->name_prefix) ? $uri->name_prefix.$result : $result;
		} else if (Streams::$followedInvite) {
			$name = Streams::$followedInvite->streamName;
		} else if ($throwIfMissing) {
			throw new Q_Exception_RequiredField(
				array('field' => 'stream name'),
				'streamName'
			);
		}
		if ($throwIfMissing && !is_string($name) && !($name instanceof Db_Range)) {
			throw new Q_Exception_WrongType(array('field' => $fieldName, 'type' => 'string or array'));
		}
		if ($returnAs === 'array' and is_string($name)) {
			$name = explode('/', $result);
		}
		return $name;
	}

	/**
	 * Get the stream type from the request, if it can be deduced
	 * @method requestedType
	 * @static
	 * @param {boolean} $throwIfMissing=false
	 *  Optional. If true, throws an exception if the stream type cannot be deduced
	 * @return {string}
	 *  The type of the stream
	 * @throws {Q_Exception_RequiredField}
	 *  If the type can't be deduced, this is thrown
	 */
	static function requestedType($throwIfMissing = false)
	{
		$uri = Q_Dispatcher::uri();
		if (isset($_REQUEST['streamType'])) {
			return $_REQUEST['streamType'];
		} else if (isset($_REQUEST['type'])) {
			return $_REQUEST['type'];
		} else if (isset($uri->type)) {
			return $uri->type;
		}
		if ($throwIfMissing) {
			throw new Q_Exception_RequiredField(
				array('field' => 'stream type'),
				'streamType'
			);
		}
		return null;
	}

	/**
	 * Get the message type from the request, if it can be deduced
	 * @method requestedMessageType
	 * @static
	 * @param {boolean} $throwIfMissing=false
	 *  Optional. If true, throws an exception if the message type cannot be deduced
	 * @return {string}
	 *  The type of the message
	 * @throws {Q_Exception_RequiredField}
	 *  If the type can't be deduced, this is thrown
	 */
	static function requestedMessageType($throwIfMissing = false)
	{
		$uri = Q_Dispatcher::uri();
		if (isset($_REQUEST['messageType'])) {
			return $_REQUEST['messageType'];
		} if (isset($_REQUEST['type'])) {
			return $_REQUEST['type'];
		}   else if (isset($uri->type)) {
			return $uri->type;
		}
		if ($throwIfMissing) {
			throw new Q_Exception_RequiredField(
				array('field' => 'message type'),
				array('type')
			);
		}
		return null;
	}

	/**
	 * Get the stream field from the request, if it can't be deduced throws error
	 * @method requestedField
	 * @static
	 * @param {string} $field
	 *	The fiels name
	 * @param {boolean} $throwIfMissing=false
	 *  Optional. If true, throws an exception if the stream field cannot be deduced
	 * @param {mixed} $default=null
	 *	Is returned if field is not set
	 * @return {string}
	 *  The value of the field
	 * @throws {Q_Exception_RequiredField}
	 *  If the field value can't be deduced, this is thrown
	 */
	static function requestedField($field, $throwIfMissing = false, $default = null)
	{
		$uri = Q_Dispatcher::uri();
		if (isset($_REQUEST[$field])) {
			return $_REQUEST[$field];
		} else if (isset($uri->$field)) {
			if (is_array($uri->$field)) {
				return implode('/', $uri->$field);
			}
			return $uri->$field;
		} else if ($field = Q_Request::special("Streams.$field", $default)) {
			return $field;
		}
		if ($throwIfMissing) {
			throw new Q_Exception_RequiredField(
				array('field' => "stream $field"),
				$field
			);
		}
		return $default;
	}

	/**
	 * Get the fields that have been requested in the request, otherwise '*'
	 * @method requestedFields
	 * @static
	 * @return {array|string}
	 *  An array or string of fields to select
	 * @throws {Q_Exception}
	 *	If requested field name is invalid
	 */
	static function requestedFields()
	{
		if (empty($_REQUEST['fields'])) {
			return '*';
		}
		$fields = $_REQUEST['fields'];
		$fields = is_array($fields) ? $fields : explode(',', $fields);
		if (!in_array('publisherId', $fields)) {
			$fields[] = 'publisherId';
		}
		if (!in_array('name', $fields)) {
			$fields[] = 'name';
		}
		return $fields;
	}

	/**
	 * Produce user's display name
	 * @method displayName
	 * @static
	 * @param {string|Users_User} $userId
	 *  Can be Users_User object or a string containing a user id
	 * @param {array} $options=array()
	 *   @param {boolean} [$options.short] Show one part of the name only
	 *   @param {boolean} [$options.show] The parts of the name to show. Can have the letters "f", "l", "u" in any order.
	 *   @param {boolean} [$options.html] If true, encloses the first name, last name, username in span tags. If an array, then it will be used as the attributes of the html.
	 *   @param {boolean} [$options.escape] If true, does HTML escaping of the retrieved field
	 *   @param {string} [$options.asUserId=Users::loggedInUser()] Optionally override which user to get the display name as
	 *   @param {string} [$options.fullAccess=false] if true, sets the $asUserId = $userId
	 * @param {string} [$fallback='Someone'] HTML to return if there is no info to get displayName from.
	 * @param {string|null} [$fallback='Someone']
	 *  What to return if there is no info to get displayName from.
	 * @return {string|null}
	 */
	static function displayName($userId, $options = array(), $fallback = 'Someone')
	{
		if ($userId instanceof Users_User) {
			$userId = $userId->id;
		}
		if (!empty($options['asUserId'])) {
			$asUserId = $options['asUserId'];
		} else if (!empty($options['fullAccess'])) {
			$asUserId = $userId;
		} else {
			$asUser = Users::loggedInUser();
			$asUserId = $asUser ? $asUser->id : "";
		}
		$avatar = Streams_Avatar::fetch($asUserId, $userId);
		if ($avatar) {
			return $avatar->displayName($options, $fallback);
		}

		$displayName = array();
		try {
			$displayName['firstName'] = Streams::fetchOne(null, $userId, "Streams/user/firstName")->content;
		} catch (Exception $e) {}
		try {
			$displayName['lastName'] = Streams::fetchOne(null, $userId, "Streams/user/lastName")->content;
		} catch (Exception $e) {}

		return empty($displayName) ? $fallback : implode(' ', $displayName);
	}

	/**
	 * Gets relations. At most one of toStreamName, toStreamName can be an array.
	 * @method getRelations
	 * @private
	 * @param {string} $asUserId
	 *  The user who is fetching
	 * @param {string} $toPublisherId
	 *  The publisher of the category
	 * @param {string|array} $toStreamName
	 *  The name of the category. May be turned into an array.
	 * @param {string} $type
	 *  The type of the relation.
	 * @param {string} $fromPublisherId
	 *  The publisher of the member stream(s)
	 * @param {string|array} $fromStreamName
	 *  The name of the member stream(s). May be turned into an array.
	 * @param {array} $relatedTo reference to array of Streams_RelatedTo to fill
	 * @param {array} $relatedFrom reference to array of Streams_RelatedFrom to fill
	 * @param {array} $categories reference to array of Streams_Stream to fill with categories
	 * @param {array} $streams reference to array of Streams_Stream to fill with streams
	 * @param {array} $options=array() An array of options that can include:
	 * @param {boolean} [$options.skipAccess=false] If true, skips the access checks and just relates the stream to the category
	 * @param {boolean} [$options.ignoreCache=false] If true, ignore cache during sql requests
	 */
	private static function getRelations(
		&$asUserId,
		$toPublisherId,
		&$toStreamName,
		$type,
		$fromPublisherId,
		&$fromStreamName,
		&$relatedTo,
		&$relatedFrom,
		&$categories,
		&$streams,
		&$arrayField,
		&$options = array())
	{
		if (!isset($asUserId)) {
			$asUserId = Users::loggedInUser(true)->id;
		} else if ($asUserId instanceof Users_User) {
			$asUserId = $asUserId->id;
		}
		if ($toPublisherId instanceof Users_User) {
			$toPublisherId = $toPublisherId->id;
		}
		if (!isset($options)) {
			$options = array();
		}
		
		if (is_array($toStreamName)) {
			if (is_array($fromStreamName)) {
				throw new Q_Exception("toStreamName and fromStreamName can't both be arrays");
			}
			$arrayField = 'toStreamName';
		} else if (is_array($fromStreamName)) {
			$arrayField = 'fromStreamName';
		} else {
			$toStreamName = array($toStreamName);
			$arrayField = 'toStreamName';
		}

		// Check access to category stream, the stream to which other streams are related
		$categories = Streams::fetch($asUserId, $toPublisherId, $toStreamName);
		if (empty($options['skipAccess'])) {
			foreach ($toStreamName as $sn) {
				if (empty($categories[$sn])) {
					throw new Q_Exception_MissingRow(array(
						'table' => 'Stream',
						'criteria' => Q::json_encode(array(
							'publisherId' => $toPublisherId,
							'streamName' => $toStreamName
						))
					));
				}
				if (!$categories[$sn]->testWriteLevel('relate')) {
					throw new Users_Exception_NotAuthorized();
				}
			}
		}

		// Fetch member streams, the streams which are being related
		$streams = Streams::fetch($asUserId, $fromPublisherId, $fromStreamName);
		
		$criteria = @compact(
			'toPublisherId', 'toStreamName', 
			'type', 'fromPublisherId', 'fromStreamName'
		);

		$ignoreCache = Q::ifset($options, "ignoreCache", false);

		// Fetch relatedTo
		if ($relatedTo !== false) {
			$relatedTo = Streams_RelatedTo::select()
			->where($criteria);
			if ($ignoreCache) {
				$relatedTo->ignoreCache();
			}
			$relatedTo = $relatedTo->fetchDbRows(null, null, $arrayField);
		}
		
		// Fetch relatedFrom
		if ($relatedFrom !== false) {
			$relatedFrom = Streams_RelatedFrom::select()
			->where($criteria);
			if ($ignoreCache) {
				$relatedFrom->ignoreCache();
			}
			$relatedFrom = $relatedFrom->fetchDbRows(null, null, $arrayField);
		}
		
		// Recover from inconsistency:
		// if one exists but not the other, delete both
		$removeRT = $removeRF = $fieldRT = $fieldRF = array();
		foreach ($relatedTo as $sn => $rt) {
			if (empty($relatedFrom[$sn])) {
				$removeRT[] = $sn;
				$fieldRT[] = $rt->$arrayField;
			}
		}
		foreach ($relatedFrom as $sn => $rf) {
			if (empty($relatedTo[$sn])) {
				$removeRF[] = $sn;
				$fieldRF[] = $rf->$arrayField;
			}
		}
		if ($removeRT) {
			foreach ($removeRT as $sn) {
				unset($relatedTo[$sn]);
			}
			$criteria2 = $criteria;
			$criteria2[$arrayField] = $fieldRT;
			Streams_RelatedTo::delete()
				->where($criteria2)
				->execute();
		}
		if ($removeRF) {
			foreach ($removeRF as $sn) {
				unset($relatedFrom[$sn]);
			}
			$criteria2 = $criteria;
			$criteria2[$arrayField] = $fieldRF;
			Streams_RelatedFrom::delete()
				->where($criteria2)
				->execute();
		}
	}

	/**
	 * Make the stream a member of category or other aggregating stream,
	 * First parameter set - where to add, Second parameter set - what to add
	 * NOTE: this currently only works when fromPublisherId and toPublisherId are on same Q cluster
	 * @method relate
	 * @static
	 * @param {string} $asUserId
	 *  The user who is making aggreagtor operation on the stream (add stream to category)
	 * @param {string} $toPublisherId
	 *  The user who has published the category stream
	 * @param {string|array} $toStreamName
	 *  The name of the category stream. Pass an array of strings to relate a single stream
	 *  to multiple categories, but in that case make sure fromStreamName is a string.
	 * @param {string|array|Db_Range} $type
	 *  The type of the relation
	 * @param {string} $fromPublisherId
	 *  The user who has published the related stream
	 * @param {string} $fromStreamName
	 *  The name of the related stream. Pass an array of strings to relate multiple streams
	 *  to a single category, but in that case make sure toStreamName is a string.
	 * @param {array} $options=array()
	 *  An array of options that can include:
	 * @param {boolean} [$options.skipAccess=false] If true, skips the access checks and just relates the stream to the category
	 * @param {boolean} [$options.skipMessageTo=false] If true, skips posting the Streams/relatedFrom message to the "to" streams
	 * @param {boolean} [$options.skipMessageFrom=false] If true, skips posting the Streams/relatedFrom message to the "from" streams
	 * @param {double|string} [$options.weight] Pass a numeric value here, or something like "max+1" to make the weight 1 greater than the current MAX(weight)
	 * @param {array} [$options.extra] Can be array of ($streamName => $extra) info
	 *  to save in the "extra" field.
	 * @param {boolean} [$options.inheritAccess=false] If true, inherit access from category to related stream.
	 * @param {boolean} [$options.ignoreCache=false] If true, ignore cache during sql requests
	 * @return {array|boolean}
	 *  Returns false if the operation was canceled by a hook
	 *  Returns true if relation was already there
	 *  Otherwise returns array with keys "messagesFrom" and "messageTo" and values of type Streams_Message
	 */
	static function relate(
		$asUserId,
		$toPublisherId,
		$toStreamName,
		$type,
		$fromPublisherId,
		$fromStreamName,
		$options = array())
	{
		self::getRelations(
			$asUserId,
			$toPublisherId,
			$toStreamName,
			$type,
			$fromPublisherId,
			$fromStreamName,
			$relatedToArray,
			$relatedFromArray,
			$categories,
			$streams,
			$arrayField,
			$options);
		
		// calculate weights
		$calculateWeights = null;
		foreach ($$arrayField as $sn) {
			if (isset($relatedToArray[$sn])) {
				continue;
			}

			// at least one new relation will be inserted
			if (isset($options['weight'])) {
				$parts = explode('+', "$options[weight]");
				if (count($parts) > 1) {
					$calculateWeights = $parts[1];
					break;
				}
			}
		}
		if (isset($calculateWeights)) {
			if (!is_numeric($calculateWeights) or $calculateWeights <= 0) {
				throw new Q_Exception_WrongValue(array(
					'field' => 'weight',
					'range' => 'a positive numeric value'
				), 'weight');
			}
			$rows = Streams_RelatedTo::select('toStreamName, MAX(weight) w')
				->where(@compact('toPublisherId', 'toStreamName', 'type'))
				->groupBy('toStreamName')
				->ignoreCache()
				->fetchAll(PDO::FETCH_ASSOC);
			$maxWeights = array();
			foreach ($rows as $r) {
				$maxWeights[$r['toStreamName']] = $r['w'];
			}
		}
		
		$newRT = array();
		$newRF = array();
		$newRTT = array();
		$newRFT = array();
		$weights2 = array();
		foreach ($$arrayField as $sn) {
			if (isset($relatedToArray[$sn])) {
				continue;
			}
			$category = ($arrayField === 'toStreamName') ? $categories[$sn] : reset($categories);
			$stream = ($arrayField === 'fromStreamName') ? $streams[$sn] : reset($streams);
			if (!empty($options['extra'][$sn])) {
				$extra = $options['extra'][$sn];
				$extra = is_string($extra) ? $extra : Q::json_encode($extra);
			} else {
				$extra = null;
			}
			/**
			 * @event Streams/relateTo/$categoryType {before}
			 * @param {array} relatedTo
			 * @param {array} relatedFrom
			 * @param {string} asUserId
			 * @param {Streams_Stream} category
			 * @param {Streams_Stream} stream
			 * @return {false} To cancel further processing
			 */
			if (false === Q::event(
				"Streams/relateTo/{$category->type}",
				array(
					'asUserId' => $asUserId,
					'category' => $category,
					'stream' => $stream,
					'extra' => &$extra,
					'type' => $type
				),
				'before'
			)) {
				continue;
			}
			/**
			 * @event Streams/relateFrom/$streamType {before}
			 * @param {array} relatedTo
			 * @param {array} relatedFrom
			 * @param {string} asUserId
			 * @param {Streams_Stream} category
			 * @param {Streams_Stream} stream
			 * @return {false} To cancel further processing
			 */
			if (false === Q::event(
				"Streams/relateFrom/{$stream->type}",
				@compact('asUserId', 'category', 'stream', 'type'),
				'before'
			)) {
				continue;
			}
			$tsn = ($arrayField === 'toStreamName') ? $sn : $toStreamName;
			$newRT[$sn] = $newRF[$sn] = @compact(
				'toPublisherId', 'type', 'fromPublisherId'
			);
			if (isset($extra)) {
				$newRT[$sn]['extra'] = $extra;
			}
			if ($calculateWeights) {
				if (!isset($weights2[$tsn])) {
					$weights2[$tsn] = isset($maxWeights[$tsn]) ? $maxWeights[$tsn] : 0;
				}
				$weights2[$tsn] += $calculateWeights;
				$newRT[$sn]['weight'] = $weights2[$tsn];
			} else if (isset($options['weight'])) {
				$weights2[$tsn] = $newRT[$sn]['weight'] = $options['weight'];
			}
			foreach (array('toStreamName', 'fromStreamName') as $f) {
				$newRT[$sn][$f] = $newRF[$sn][$f] = ($f === $arrayField) ? $sn : $$f;
			}
			$newRTT[] = array(
				'toPublisherId' => $category->publisherId,
				'toStreamName' => $category->name,
				'relationType' => $type,
				'fromStreamType' => $stream->type,
				'relationCount' => 1
			);
			$newRFT[] = array(
				'fromPublisherId' => $stream->publisherId,
				'fromStreamName' => $stream->name,
				'relationType' => $type,
				'toStreamType' => $category->type,
				'relationCount' => 1
			);
		}
		// Insert/update all the relatedTo and relatedFrom rows
		Streams_RelatedTo::insertManyAndExecute($newRT);
		Streams_RelatedFrom::insertManyAndExecute($newRF);
		// Insert/update all the corresponding totals
		Streams_RelatedToTotal::insertManyAndExecute($newRTT, array(
			'onDuplicateKeyUpdate' => array(
				'relationCount' => new Db_Expression('relationCount + 1')
			)
		));
		Streams_RelatedFromTotal::insertManyAndExecute($newRFT, array(
			'onDuplicateKeyUpdate' => array(
				'relationCount' => new Db_Expression('relationCount + 1')
			)
		));
		$relatedFrom_messages = array();
		$relatedTo_messages = array();
		foreach ($$arrayField as $sn) {
			if (isset($relatedToArray[$sn])) {
				continue;
			}

			$category = ($arrayField === 'toStreamName') ? $categories[$sn] : reset($categories);
			$stream = ($arrayField === 'fromStreamName') ? $streams[$sn] : reset($streams);
			$weight = (isset($options['weight']) && is_numeric($options['weight']))
				? $options['weight']
				: null;
			$weight = Q::ifset($weights2, $category->name, $weight);
			if (!$stream) {
				continue;
			}
			$fromUri = $stream->uri();
			$fromUrl = $stream->url();
			$fromIcon = $stream->icon;
			$fromTitle = $stream->title;
			$fromType = $stream->type;
			$fromDisplayType = Streams_Stream::displayType($fromType);
			if (!$category) {
				continue;
			}
			$toUri = $category->uri();
			$toUrl = $category->url();
			$toIcon = $category->icon;
			$toTitle = $category->title;
			$toType = $category->type;
			$toDisplayType = Streams_Stream::displayType($toType);
			$relationDisplayType = Streams_Stream::relationDisplayType($type);
			$categoryName = explode('/', $category->name);
			$streamName = explode('/', $stream->name);

			$params = @compact(
				'relatedToArray', 'relatedFromArray', 'asUserId', 'category', 'stream',
				'fromUri', 'fromUrl',
				'fromIcon', 'fromTitle', 'fromType', 'fromDisplayType',
				'toUri', 'toUrl',
				'toIcon', 'toTitle', 'toType', 'toDisplayType',
				'displayType', 'categoryName', 'streamName', 'extra'
			);

			if ($u = Streams_Stream::getConfigField($category->type, 
				array('relatedTo', $type, 'url'),
				Streams_Stream::getConfigField($category->type, array(
					'relatedTo', '*', 'url', null
				))
			)) {
				$fromUrl = Q_Uri::url(Q_Handlebars::renderSource($u, $params));
			}
			if ($u = Streams_Stream::getConfigField($stream->type, 
				array('relatedFrom', $type, 'url'),
				Streams_Stream::getConfigField($stream->type, array(
					'relatedFrom', '*', 'url', null
				))
			)) {
				$toUrl = Q_Uri::url(Q_Handlebars::renderSource($u, $params));
			}

			$params['relationDisplayType'] = $relationDisplayType;
			
			// Related TO description
			$description = Streams_Stream::getConfigField(
				$category->type,
				array('relatedTo', $type, 'description'),
				Streams_Stream::getConfigField($category->type, array(
					'relatedTo', '*', 'description'
				), "New {{relationDisplayType}} added"),
				false
			);
			$content = Q_Handlebars::renderSource($description, $params);

			// Send Streams/relatedTo message to a stream
			// node server will be notified by Streams_Message::post
			// DISTRIBUTED: in the future, the publishers may be on separate domains
			// so posting this message may require internet communication.
			$instructions = @compact(
				'fromPublisherId', 'type', 'weight', 'displayType',
				'fromUrl', 'toUrl', 'toTitle', 'relationDisplayType',
				'fromIcon', 'fromTitle', 'fromType', 'fromDisplayType', 'description'
			);
			$instructions['url'] = $instructions['fromUrl'];
			$instructions['fromStreamName'] = $stream->name;
			$relatedTo_messages[$toPublisherId][$category->name][] = array(
				'type' => 'Streams/relatedTo',
				'content' => $content,
				'instructions' => $instructions
			);

			// Related FROM description
			$description = Streams_Stream::getConfigField(
				$stream->type,
				array('relatedFrom', $type, 'description'),
				Streams_Stream::getConfigField($stream->type, array('relatedFrom', '*', 'description'),
					"Added to {{toDisplayType}} as {{relationDisplayType}}"
				)
			);
			$content = Q_Handlebars::renderSource($description, $params);

			// Send Streams/relatedFrom message to a stream
			// node server will be notified by Streams_Message::post
			// DISTRIBUTED: in the future, the publishers may be on separate domains
			// so posting this message may require internet communication.
			$instructions = @compact(
				'toPublisherId', 'type', 'weight', 'displayType',
				'fromUrl', 'toUrl', 'fromUri', 'toUri', 'relationDisplayType',
				'toIcon', 'toTitle', 'toType', 'toDisplayType', 'content', 'description'
			);
			$instructions['url'] = $instructions['toUrl'];
			$instructions['toStreamName'] = $category->name;
			$relatedFrom_messages[$fromPublisherId][$stream->name][] = array(
				'type' => 'Streams/relatedFrom',
				'content' => $content,
				'instructions' => $instructions
			);

			/**
			 * @event Streams/relateFrom/$streamType {after}
			 * @param {string} relatedToArray
			 * @param {string} relatedFromArray
			 * @param {string} asUserId
			 * @param {array} extra
			 * @param {Streams_Stream} category
			 * @param {Streams_Stream} stream
			 */
			Q::event(
				"Streams/relateFrom/{$stream->type}",
				@compact('relatedToArray', 'relatedFromArray', 'asUserId', 'category', 'stream', 'extra', 'type'),
				'after'
			);
			/**
			 * @event Streams/relateTo/$categoryType {after}
			 * @param {string} relatedToArray
			 * @param {string} relatedFromArray
			 * @param {string} asUserId
			 * @param {Streams_Stream} category
			 * @param {Streams_Stream} stream
			 */
			Q::event(
				"Streams/relateTo/{$category->type}",
				@compact('relatedToArray', 'relatedFromArray', 'asUserId', 'category', 'stream', 'type'),
				'after'
			);

			// inherit access from category to related stream
			if (Q::ifset($options, 'inheritAccess', false)) {
				$inheritAccess = ($category and $category->inheritAccess)
					? Q::json_decode($category->inheritAccess)
					: array();
				$newInheritAccess = array($category->publisherId, $category->name);
				if (!in_array($newInheritAccess, $inheritAccess)) {
					$inheritAccess[] = $newInheritAccess;
				}
				$stream->inheritAccess = Q::json_encode($inheritAccess);
				$stream->save();
			}
		}

		if (empty($options['skipMessageTo'])) {
			list($messagesTo, $s) = Streams_Message::postMessages($asUserId, $relatedTo_messages, true);
		}
		if (empty($options['skipMessageFrom'])) {
			list($messagesFrom, $s) = Streams_Message::postMessages($asUserId, $relatedFrom_messages, true);
		}

		return @compact('messagesTo', 'messagesFrom');
	}

	/**
	 * Remove a relation where a member stream is related to a category stream.
	 * Can only remove one relation at a time. Adjusts weights after removal.
	 * @method unrelate
	 * @static
	 * @param {string} $asUserId
	 *  The user who is making unrelate operation on the stream (remove stream from category)
	 * @param {string} $toPublisherId
	 *  The user who has published the category stream
	 * @param {string|array} $toStreamName
	 *  The name of the category stream. Pass an array of strings to relate a single stream
	 *  to multiple categories, but in that case make sure fromStreamName is a string.
	 * @param {string|array|Db_Range} $type
	 *  The type of the relation
	 * @param {string} $fromPublisherId
	 *  The user who has publishes the related stream
	 * @param {string|array} $fromStreamName
	 *  The name of the related stream. Pass an array of strings to relate multiple streams
	 *  to a single category, but in that case make sure toStreamName is a string.
	 * @param {array} $options=array()
	 *  An array of options that can include:
	 * @param {boolean} [$options.skipAccess=false] If true, skips the access checks and just unrelates the stream from the category
	 * @param {boolean} [$options.skipMessageTo=false] If true, skips posting the Streams/unrelatedTo message to the "to" streams
	 * @param {boolean} [$options.skipMessageFrom=false] If true, skips posting the Streams/unrelatedFrom message to the "from" streams
	 * @param {double} [$options.adjustWeights=0]
	 *  The amount to move the other weights by, to make room for this one.
	 *  The direction of the shift is determined by the sign of this number.
	 *  If it's negative, weights drop down by this amount.
	 *  If it's positive, weights are moved up by this amount.
	 * @return {false|array}
	 *  Returns false if the relation was not removed.
	 *  Otherwise, returns an array of (RelatedTo, RelatedFrom) that was just removed
	 */
	static function unrelate(
		$asUserId,
		$toPublisherId,
		$toStreamName,
		$type,
		$fromPublisherId,
		$fromStreamName,
		$options = array())
	{
		self::getRelations(
			$asUserId,
			$toPublisherId,
			$toStreamName,
			$type,
			$fromPublisherId,
			$fromStreamName,
			$relatedTo,
			$relatedFrom,
			$categories,
			$streams,
			$arrayField,
			$options);

		if (!$relatedTo && !$relatedFrom) {
			return false;
		}

		$relatedTo = reset($relatedTo);
		$relatedFrom = reset($relatedFrom);
		$category = reset($categories);
		$stream = reset($streams);
		if (is_array($toStreamName)) {
			$toStreamName = reset($toStreamName);
		}
		if (is_array($fromStreamName)) {
			$fromStreamName = reset($fromStreamName);
		}

		if (empty($options['skipAccess'])) {
			if (!$category->testWriteLevel('relations')) {
				throw new Users_Exception_NotAuthorized();
			}
		}

		// Now, clean up the relation.
		/**
		 * @event Streams/unrelateTo/$streamType {before}
		 * @param {string} relatedTo
		 * @param {string} relatedFrom
		 * @param {string} asUserId
		 * @return {false} To cancel further processing
		 */
		if (Q::event(
			"Streams/unrelateTo/{$category->type}",
			@compact('relatedTo', 'relatedFrom', 'asUserId'),
			'before') === false
		) {
			return false;
		}

		/**
		 * @event Streams/unrelateFrom/$streamType {before}
		 * @param {string} relatedTo
		 * @param {string} relatedFrom
		 * @param {string} asUserId
		 * @return {false} To cancel further processing
		 */
		if (Q::event(
			"Streams/unrelateFrom/{$stream->type}",
			@compact('relatedTo', 'relatedFrom', 'asUserId'),
			'before') === false
		) {
			return false;
		}

		/*
		 * remove 'Streams/relation' from $relatedTo.
		 * we consider category stream as 'remote' i.e. more error prone.
		 */

		$weight = isset($relatedTo->weight) ? $relatedTo->weight : null;
		if ($relatedTo && $relatedTo->remove()) {
			if (isset($weight) and !empty($options['adjustWeights'])) {
				$adjustWeights = $options['adjustWeights'] === true
					? -1 // backward compatibility
					: floatval($options['adjustWeights']);
				$criteria = array(
					'toPublisherId' => $toPublisherId,
					'toStreamName' => $category->name,
					'type' => $type
				);
				if ($options['adjustWeights'] > 0) {
					$criteria['weight'] = new Db_Range(null, false, false, $weight);
				} else {
					$criteria['weight'] = new Db_Range($weight, false, false, null);
				}
				Streams_RelatedTo::update()->set(array(
					'weight' => new Db_Expression("weight + ($adjustWeights)")
				))->where($criteria)
				->execute();
			}
			
			Streams_RelatedToTotal::update()->set(array(
				'relationCount' => new Db_Expression('relationCount - 1')
			))->where(array(
				'toPublisherId' => $category->publisherId,
				'toStreamName' => $category->name,
				'relationType' => $type,
				'fromStreamType' => $stream->type,
			))->execute();
			
			// Send Streams/unrelatedTo message to a stream
			// node server will be notified by Streams_Message::post
			if (empty($options['skipMessageTo'])) {
				Streams_Message::post($asUserId, $toPublisherId, $category->name, array(
					'type' => 'Streams/unrelatedTo',
					'instructions' => @compact(
						'fromPublisherId', 'fromStreamName', 'type', 'options', 'weight'
					)
				), true);
			}
		}

		if ($relatedFrom && $relatedFrom->remove()) {
			Streams_RelatedFromTotal::update()->set(array(
				'relationCount' => new Db_Expression('relationCount - 1')
			))->where(array(
				'fromPublisherId' => $stream->publisherId,
				'fromStreamName' => $stream->name,
				'relationType' => $type,
				'toStreamType' => $category->type,
			))->execute();
			
			if (empty($options['skipMessageFrom'])) {
				// Send Streams/unrelatedFrom message to a stream
				// node server will be notified by Streams_Message::post
				Streams_Message::post($asUserId, $fromPublisherId, $stream->name, array(
					'type' => 'Streams/unrelatedFrom',
					'instructions' => @compact(
						'toPublisherId', 'toStreamName', 'type', 'options'
					)
				), true);
			}
		}

		/**
		 * @event Streams/unrelateFrom/$streamType {after}
		 * @param {string} relatedTo
		 * @param {string} relatedFrom
		 * @param {string} asUserId
		 */
		Q::event(
			"Streams/unrelateFrom/{$stream->type}",
			@compact('relatedTo', 'relatedFrom', 'asUserId'), 
			'after'
		);

		/**
		 * @event Streams/unrelateTo/$categoryType {after}
		 * @param {string} relatedTo
		 * @param {string} relatedFrom
		 * @param {string} asUserId
		 */
		Q::event(
			"Streams/unrelateTo/{$category->type}",
			@compact('relatedTo', 'relatedFrom', 'asUserId'),
			'after'
		);

		return array($relatedTo, $relatedFrom);
	}

	/**
	 * Fetch all the streams which are related to, or from, a given stream.
	 * Right now, all the streams that are fetched have to be from the same publisher.
	 * So, if there are relations to streams from other publishers, you have to additionally
	 * go ahead and fetch them yourself.
	 * @method related
	 * @static
	 * @param {string} $asUserId
	 *  The user who is fetching
	 * @param {string} $publisherId
	 *  The publisher of the stream
	 * @param {string|array|Db_Range} $streamName
	 *  The name of the stream which is presumably related to/from other streams
	 * @param {mixed} $isCategory=true
	 *  If false, returns the categories that this stream is related to.
	 *  If true, returns all the streams this related to this category.
	 *  If a string, returns all the streams related to this category with names prefixed by this string.
	 * @param {array} $options=array()
	 * @param {boolean|string} [$options.orderBy=false] Defaults to false, which means order by decreasing weight. True means order by increasing weight. Also can pass "random" to order randomly.
	 * @param {integer} [$options.limit] number of records to fetch
	 * @param {integer} [$options.offset] offset to start from
	 * @param {double} [$options.min] the minimum orderBy value (inclusive) to filter by, if any
	 * @param {double} [$options.max] the maximum orderBy value (inclusive) to filter by, if any
	 * @param {string|array|Db_Range} [$options.type] if specified, this filters the type of the relation.
	 *   Can be useful for implementing custom indexes using relations and varying the value of "type".
	 * @param {number|array|Db_Range} [$options.weight] if specified, this filters the weight of the relation.
	 *   Can be useful for implementing custom indexes using relations and varying the weight ranges.
	 *   Only used if $options.isCategory is true.
	 * @param {string} [$options.prefix] if specified, this filters by the prefix of the related streams
	 * @param {string} [$options.title] if specified, this filters the titles of the streams with a LIKE condition
	 * @param {array} [$options.where] you can also specify any extra conditions here
	 * @param {array} [$options.fetchOptions] An array of any options to pass to Streams::fetch when fetching streams
	 * @param {array} [$options.relationsOnly] If true, returns only the relations to/from stream, doesn't fetch the other data. Useful if publisher id of relation objects is not the same as provided by publisherId.
	 * @param {array} [$options.streamsOnly] If true, returns only the streams related to/from stream, doesn't return the other data.
	 * @param {array} [$options.streamFields] If specified, fetches only the fields listed here for any streams.
	 * @param {callable} [$options.filter] Optional function to call to filter the relations. It should return a filtered array of relations.
	 * @param {boolean} [$options.skipAccess=false] If true, skips the access checks and just fetches the relations and related streams
	 * @param {array} [$options.skipFields] Optional array of field names. If specified, skips these fields when fetching streams
	 * @param {array} [$options.skipTypes] Optional array of ($streamName => $relationTypes) to skip when fetching relations.
	 * @param {array} [$options.includeTemplates] Defaults to false. Pass true here to include template streams (whose name ends in a slash) among the related streams.
	 * @param {boolean} [$options.ignoreCache=false] If true, ignore cache during sql requests
	 * @param {boolean} [$options.overrideMaximums=false] Set to true to potentially exceed max limit and offset
	 * @return {array}
	 *  Returns array($relations, $relatedStreams, $stream).
	 *  However, if $streamName wasn't a string or ended in "/"
	 *  then the third parameter is an array of streams.
	 *  Also, if you passed "relationsOnly" or "streamsOnly", then it returns
	 *  the $relations or $relatedStreams array by itself, respectively.
	 */
	static function related(
		$asUserId,
		$publisherId,
		$streamName,
		$isCategory = true,
		$options = array())
	{
		if (is_string($streamName) and substr($streamName, -1) === '/') {
			$streamName = new Db_Range($streamName, false, false, true);
		}
		$returnMultiple = !is_string($streamName);
		if (is_array($isCategory)) {
			$options = $isCategory;
			$isCategory = true;
		}
		$skipTypes = Q::ifset($options, 'skipTypes', array());

		// Check access to stream
		$fetchOptions = isset($options['fetchOptions']) ? $options['fetchOptions'] : null;
		$rows = Streams::fetch($asUserId, $publisherId, $streamName, '*', $fetchOptions);
		$streams = array();
		foreach($rows as $n => $row) {
			if (!$row) continue;
			if (empty($options['skipAccess'])
			and !$row->testReadLevel('relations')) {
				throw new Users_Exception_NotAuthorized();
			}
			if (!$row->testReadLevel('participants')) {
				$skipTypes[$n][] = 'Streams/participating';
			}
			$streams[$n] = $row;
		}
		if (!$streams) {
			if (!empty($options['relationsOnly'])
			|| !empty($options['streamsOnly'])) {
				return array();
			}
			return array(array(), array(), $returnMultiple ? array() : null);
		}
		$stream = reset($streams);

		if ($isCategory) {
			$query = Streams_RelatedTo::select()
			->where(array(
				'toPublisherId' => $publisherId,
				'toStreamName' => $streamName
			));
		} else {
			$query = Streams_RelatedFrom::select()
			->where(array(
				'fromPublisherId' => $publisherId,
				'fromStreamName' => $streamName
			));
		}
		if ($isCategory) {
			$orderBy = Q::ifset($options, "orderBy", false);
			if (is_bool($orderBy)) {
				$query = $query->orderBy('weight', $orderBy);
			} else if (strtolower($orderBy) === 'random') {
				$query = $query->orderBy('random', null)->ignoreCache();
			} else {
				throw new Q_Exception_WrongValue(array(
					'field' => 'orderBy',
					'range' => 'true, false, or "random"'
				));
			}

			if (!empty($options['weight'])) {
				$query = $query->andWhere(array('weight' => $options['weight']));
			}
		}
		if (isset($options['prefix'])) {
			if (substr($options['prefix'], -1) !== '/') {
				throw new Q_Exception("prefix has to end in a slash", 'prefix');
			}
			$other_field = $isCategory ? 'fromStreamName' : 'toStreamName';
			$query = $query->where(array(
				$other_field => new Db_Range($options['prefix'], true, false, true)
			));
		}
		if (!empty($options['title'])) {
			if (!is_string($options['title'])) {
				throw new Q_Exception_WrongType(array(
					'field' => 'filter',
					'type' => 'string'
				));
			}
			$query = $query->where(array(
				'title LIKE ' => $options['title']
			));
		}

		$max_limit = Q_Config::expect('Streams', 'db', 'limits', 'stream');
		$max_offset = (Q_Config::expect('Streams', 'db', 'pages') - 1) * $max_limit - 1;
		$offset = !empty($options['offset']) ? $options['offset'] : 0;
		$limit = !empty($options['limit']) ? $options['limit'] : $max_limit;
		if (empty($options['overrideMaximums'])) {
			if (!is_numeric($offset) or $offset > $max_offset) {
				throw new Q_Exception("Streams::related offset is too large, must be <= $max_offset");
			}
			if (!is_numeric($limit) or $limit > $max_limit) {
				throw new Q_Exception("Streams::related limit is too large, must be <= $max_limit");
			}
		}

		$min = null;
		if (isset($options['min'])) {
			$min = is_numeric($options['min']) ? $options['min'] : strtotime($options['min']);
		}

		$max = null;
		if (isset($options['max'])) {
			$max = is_numeric($options['max']) ? $options['max'] : strtotime($options['max']);
		}
		if (isset($min) or isset($max)) {
			$range = new Db_Range(isset($min) ? $min : null, true, true, isset($max) ? $max : null);
			$query = $query->where(array('weight' => $range));
		}
		if ($limit or $offset) {
			$query = $query->limit($limit, $offset);
		}
		if (isset($options['type'])) {
			$query = $query->where(array('type' => $options['type']));
		}
		if (isset($options['where'])) {
			$query = $query->where($options['where']);
		}
		$FT = $isCategory ? 'from' : 'to';
		if (empty($options['includeTemplates'])) {
			$col = $FT.'StreamName';
			$query = $query->where(new Db_Expression(
				"SUBSTRING($col, -1, 1) != '/'"
			));
		}
		if (Q::ifset($options, "ignoreCache", false)) {
			$query->ignoreCache();
		}
		$col2 = $isCategory ? 'toStreamName' : 'fromStreamName';

		$relations = $query->fetchDbRows();
		foreach ($relations as $k => $v) {
			if (!empty($options['includeTemplates'])
			and substr($k, -1) === '/') {
				unset($relations[$k]);
			} else if (!empty($skipTypes[$v->$col2])
			and in_array($v->type, $skipTypes[$v->$col2])) {
				unset($relations[$k]);
			}
		}

		if (empty($relations)) {
			if (!empty($options['relationsOnly'])
			or !empty($options['streamsOnly'])) {
				return array();
			}
			return array(array(), array(), $returnMultiple ? $streams : $stream);
		}
		
		if (!empty($options['filter'])) {
			$relations = call_user_func($options['filter'], $relations);
		}
		
		if (!empty($options['relationsOnly'])) {
			return $relations;
		}
		
		$fields = '*';
		if (isset($options['skipFields'])) {
			$skip_fields = is_array($options['skipFields'])
				? $options['skipFields']
				: explode(',', $options['skipFields']);
			$fields = implode(',', array_diff(Streams_Stream::fieldNames(), $skip_fields));
		} else if (isset($options['streamFields'])) {
			$fields = is_string($options['streamFields'])
				? $options['streamFields']
				: implode(',', $options['streamFields']);
		}
		$names = array();
		$FTP = $FT.'PublisherId';
		$FSN = $FT.'StreamName';
		foreach ($relations as $name => $r) {
			if ($r->$FTP === $publisherId) {
				$names[] = $r->$FSN;
			}
		}
		$relatedStreams = Streams::fetch(
			$asUserId, $publisherId, $names, $fields, $fetchOptions
		);
		foreach ($relatedStreams as $name => $s) {
			if (!$s) continue;
			$weight = isset($relations[$name]->weight)
				? $relations[$name]->weight
				: null;
			$s->set('weight', $weight);
		}
		if (!empty($options['streamsOnly'])) {
			return $relatedStreams;
		}
		return array(
			$relations, 
			$relatedStreams,
			$returnMultiple ? $streams : $stream
		);
	}

	/**
	 * Check if the maximum number of relations of a given type has been exceeded,
	 * if the "Streams/maxRelations" attribute has been set.
	 * @method checkAvailableRelations
	 * @param {string} $asUserId The id of the user on whose behalf the stream requested
	 * @param {string} $publisherId The publisher of the stream
	 * @param {string} $streamName The name of the stream
	 * @param {string} $relationType The type of the relation
	 * @param {array} [$options=array()]
	 * @param {boolean} [$options.postMessage=true] Whether to post messages Streams/relation/available, Streams/relation/unavailable
	 * @param {boolean} [$options.throwIfUnavailable=false] If true and relation unavailbale, throws exception
	 * @param {boolean} [$options.singleRelation=false] If true, check that user already related stream to category. If yes throws exception.
	 * @return {boolean} if available or not
	 */
	static function checkAvailableRelations ($asUserId, $publisherId, $streamName, $relationType, $options=array()) {
		$stream = Streams_Stream::fetch($asUserId, $publisherId, $streamName);
		$maxRelations = Q::ifset($stream->getAttribute("Streams/maxRelations"), $relationType, null);
		if (!is_numeric($maxRelations)) {
			return true;
		}

		$postMessage = Q::ifset($options, "postMessage", true);
		$throwIfUnavailable = Q::ifset($options, "throwIfUnavailable", false);
		$singleRelation = Q::ifset($options, "singleRelation", false);
		$texts = Q_Text::get("Streams/content");
		$exceededText = Q::ifset($texts, "types", $relationType, "MaxRelationsExceeded", "Max relations exceeded");

		$currentRelations = (int)Streams_RelatedTo::select("COUNT(1)")->where(array(
			"toPublisherId" => $publisherId,
			"toStreamName" => $streamName,
			"type" => $relationType
		))->execute()->fetchColumn(0);

		$available = $maxRelations - $currentRelations;
		if ($available > 0) {
			if ($postMessage) {
				Streams_Message::post($stream->publisherId, $stream->publisherId, $stream->name, array(
					'type' => 'Streams/relation/available',
					'instructions' => array("available" => $available)
				));
			}

			if ($singleRelation) {
				$selfRelations = (int)Streams_RelatedTo::select("COUNT(1)")->where(array(
					"toPublisherId" => $publisherId,
					"toStreamName" => $streamName,
					"type" => $relationType,
					"fromPublisherId" => $asUserId
				))->execute()->fetchColumn(0);
				if ($selfRelations) {
					if ($$throwIfUnavailable) {
						throw new Q_Exception(Q::interpolate($exceededText, @compact("maxRelations")));
					}
					return false;
				}
			}

			return true;
		} else {
			if ($postMessage) {
				Streams_Message::post($stream->publisherId, $stream->publisherId, $stream->name, array(
					'type' => 'Streams/relation/unavailable'
				));
			}

			if ($throw) {
				throw new Q_Exception(Q::interpolate($exceededText, @compact("maxRelations")));
			}

			return false;
		}
	}
	/**
	 * Updates the weight on a relation
	 * @method updateRelation
	 * @param {string} $asUserId
	 *  The id of the user on whose behalf the app will be updating the relation
	 * @param {string} $toPublisherId
	 *  The publisher of the stream on the 'to' end of the relation
	 * @param {string} $toStreamName
	 *  The name of the stream on the 'to' end of the relation
	 * @param {string} $type
	 *  The type of the relation
	 * @param {string} $fromPublisherId
	 *  The publisher of the stream on the 'from' end of the relation
	 * @param {string} $fromStreamName
	 *  The name of the stream on the 'from' end of the relation
	 * @param {double} $weight
	 *  The new weight
	 * @param {double} [$adjustWeights=1]
	 *  The amount to move the other weights by, to make room for this one.
	 *  This should be a positive number - the direction of the shift is determined automatically.
	 *  Or, set to 0 to prevent moving the other weights.
	 * @param {array} $options=array()
	 * @param {boolean} [$options.skipAccess=false] If true, skips the access checks and just updates the relation
	 * @param {string|array} [$options.extra] Any info to save in the "extra" field.
	 * @return {array|boolean}
	 *  Returns false if the operation was canceled by a hook
	 *  Otherwise returns array with key "to" and value of type Streams_Message
	 */
	static function updateRelation(
		$asUserId,
		$toPublisherId,
		$toStreamName,
		$type,
		$fromPublisherId,
		$fromStreamName,
		$weight,
		$adjustWeights = 1,
		$options = array())
	{
		self::getRelations(
			$asUserId,
			$toPublisherId,
			$toStreamName,
			$type,
			$fromPublisherId,
			$fromStreamName,
			$relatedTo,
			$relatedFrom,
			$categories,
			$streams,
			$arrayField,
			$options);

		$relatedTo = reset($relatedTo);
		$relatedFrom = reset($relatedFrom);
		$category = reset($categories);
		$stream = reset($streams);

		if (!$relatedTo) {
			$names = is_array($toStreamName) ? '['.implode(', ', $toStreamName).']' : $toStreamName;
			throw new Q_Exception_MissingRow(
				array('table' => 'relatedTo', 'criteria' => "with $toPublisherId, $names, $type, $fromPublisherId, $fromStreamName"),
				array('publisherId', 'name', 'type', 'toPublisherId', 'to_name')
			);			
		}
//		if (!$relatedFrom->retrieve()) {
//			throw new Q_Exception_MissingRow(
//				array('table' => 'relatedFrom', 'criteria' => 'those fields'),
//				array('publisherId', 'name', 'type', 'fromPublisherId', 'from_name')
//			);
//		}
		
		if (empty($options['skipAccess'])) {
			if (!$category->testWriteLevel('relations')) {
				throw new Users_Exception_NotAuthorized();
			}
		}
		
		if (!empty($options['extra'])) {
			$extra = $options['extra'];
			$relatedTo->extra = is_string($extra) ? $extra : Q::json_encode($extra);
		}
		
		/**
		 * @event Streams/updateRelation/$streamType {before}
		 * @param {string} relatedTo
		 * @param {string} relatedFrom
		 * @param {string} asUserId
		 * @param {double} weight
		 * @param {double} previousWeight
		 */
		$previousWeight = $relatedTo->weight;
		if (empty($adjustWeights)) {
			$adjustWeights = 0;
		}
		if (!is_numeric($adjustWeights) or $adjustWeights < 0) {
			throw new Q_Exception_WrongType(array(
				'fields' => 'adjustWeights',
				'type' => 'a non-negative number'
			));
		}
		$adjustWeightsBy = $weight < $previousWeight ? $adjustWeights : -$adjustWeights;
		if (Q::event(
			"Streams/updateRelation/{$stream->type}",
			@compact(
				'relatedTo', 'relatedFrom', 'type', 'weight', 
				'previousWeight', 'adjustWeightsBy', 'asUserId', 'extra'
			), 
			'before') === false
		) {
			return false;
		}

		$newWeight = null;
		if (is_numeric($weight)) {
			$newWeight = $weight;
		} else if (is_string($weight)) {
			if (Q::startsWith($weight, 'weight+')) {
				$newWeight = $previousWeight + doubleval(substr($weight, 7));
			} else if (Q::startsWith($weight, 'weight-')) {
				$newWeight = $previousWeight - doubleval(substr($weight, 7));
			}
		}
		if (!isset($newWeight)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'weight', 
				'range' => 'numeric or string of type +1.5 or -1.8'
			));
		}
		
		if ($adjustWeights
		and $newWeight !== $previousWeight) {
			$criteria = array(
				'toPublisherId' => $toPublisherId,
				'toStreamName' => $toStreamName,
				'type' => $type,
				'weight' => $newWeight < $previousWeight
					? new Db_Range($newWeight, true, false, $previousWeight)
					: new Db_Range($previousWeight, false, true, $newWeight)
			);
			Streams_RelatedTo::update()->set(array(
				'weight' => new Db_Expression("weight + " . $adjustWeightsBy)
			))->where($criteria)->execute();
		}
		
		$relatedTo->weight = $newWeight;
		$relatedTo->save();
		
		// Send Streams/updatedRelateTo message to the category stream
		// node server will be notified by Streams_Message::post
		$message = Streams_Message::post($asUserId, $toPublisherId, $toStreamName, array(
			'type' => 'Streams/updatedRelateTo',
			'instructions' => @compact(
				'fromPublisherId', 'fromStreamName', 'type', 'weight', 'previousWeight', 'adjustWeightsBy', 'asUserId'
			)
		), true);
		
		/**
		 * @event Streams/updateRelation/$categoryType {after}
		 * @param {string} relatedTo
		 * @param {string} relatedFrom
		 * @param {string} asUserId
		 * @param {double} weight
		 * @param {double} previousWeight
		 */
		Q::event(
			"Streams/updateRelation/{$category->type}",
			@compact(
				'relatedTo', 'relatedFrom', 'type', 'weight', 
				'previousWeight', 'adjustWeightsBy', 'asUserId', 'extra'
			),
			'after'
		);
		
		return $message;
	}
	
	/**
	 * If the user is not participating in the stream yet, 
	 * inserts a participant record and posts a "Streams/joined" or "Streams/visited" type message
	 * to the stream, depending on whether the user is already participating in the stream.
	 * Otherwise updates the participant record's timestamp and other things.
	 * Also relates every stream joined to streams named under the config field
	 * "Streams"/"types"/$streamType/"participating"
	 * @method join
	 * @static
	 * @param {string} $asUserId The id of the user that is joining. Pass null here to use the logged-in user's id.
	 * @param {string} $publisherId The id of the user publishing all the streams
	 * @param {array} $streams An array of Streams_Stream objects or stream names
	 * @param {array} [$options=array()] An associative array of options.
	 * @param {boolean} [$options.subscribed] If true, the user is set as subscribed
	 * @param {boolean} [$options.posted] If true, the user is set as subscribed
	 * @param {array} [$options.extra] Any extra information to tree-merge for the participants
	 * @param {boolean} [$options.noVisit] If user is already participating, don't post a "Streams/visited" message
	 * @param {boolean} [$options.skipAccess] If true, skip access check for whether user can join
	 * @param {boolean} [$options.skipRelationMessages=true] if true, skip posting messages on the stream about being
	 *  related to the Streams/participating streams of the joining user with id asUserId's
	 * @return {array} Returns an array of (streamName => Streams_Participant) pairs.
	 *  The newly inserted rows will have wasInserted() return true.
	 */
	static function join(
		$asUserId,
		$publisherId, 
		$streams,
		$options = array())
	{
		if (empty($streams)) {
			return array();
		}
		$streams2 = self::_getStreams($asUserId, $publisherId, $streams);
		$streamNames = array();
		foreach ($streams2 as $s) {
			$streamNames[] = $s->name;
		}
		if (empty($options['skipAccess'])) {
			self::_accessExceptions($streams2, $streamNames, 'join');
		}
		$participants = Streams_Participant::select()
		->where(array(
			'publisherId' => $publisherId,
			'streamName' => $streamNames,
			'userId' => $asUserId
		))->ignoreCache()->fetchDbRows(null, null, 'streamName');
		$streamNamesMissing = array();
		$streamNamesUpdate = array();
		$messages = array();
		$results = array();
		$state = 'participating';
		$updateCounts = array();

		// this fields will modified in streams_participant table row
		$changedFields = @compact('state');
		foreach ($streamNames as $sn) {
			if (!isset($participants[$sn])) {
				$updateCounts[''][] = $sn;
				$streamNamesMissing[] = $sn;
				continue;
			}
			$stream = $streams2[$sn];
			$participant = &$participants[$sn];
			if (isset($options['subscribed'])) {
				$changedFields['subscribed'] = $participant->subscribed = 'yes';
			}
			if (isset($options['posted'])) {
				$changedFields['posted'] = $participant->posted = 'yes';
			}
			if (!empty($options['extra'])) {
				$extra = Q::json_decode($participant->extra, true);
				$tree = new Q_Tree($extra);
				$tree->merge($options['extra']);
				$participant->extra = Q::json_encode($tree->getAll(), JSON_FORCE_OBJECT);
				$participant->save();
			}
			$streamNamesUpdate[] = $sn;
			$type = ($participant->state === 'participating') ? 'visit' : 'join';
			$messageType = "Streams/$type" . 'ed';
			$prevState = $participant->state;
			$participant->state = $state;
			$updateCounts[$prevState][] = $sn;
			if (empty($options['noVisit']) or $type !== 'visit') {
				// Send a message to Node
				Q_Utils::sendToNode(array(
					"Q/method" => "Streams/Stream/$type",
					"participant" => Q::json_encode($participant->toArray()),
					"stream" => Q::json_encode($stream->toArray()),
					"prevState" => $prevState
				));
				// Stream messages to post
				$messages[$publisherId][$sn] = array(
					'type' => $messageType,
					'instructions' => array(
						'prevState' => $prevState,
						'extra' => isset($participant->extra) ? $participant->extra : array()
					)
				);
			}
			$results[$sn] = $participant;
		}
		if ($streamNamesUpdate) {
			Streams_Participant::update()
				->set($changedFields)
				->where(array(
					'publisherId' => $publisherId,
					'streamName' => $streamNamesUpdate,
					'userId' => $asUserId
				))->execute();
		}
		self::_updateCounts($publisherId, $updateCounts, $state);
		if ($streamNamesMissing) {
			$rows = array();
			foreach ($streamNamesMissing as $sn) {
				$stream = $streams2[$sn];
				$extra = isset($options['extra'])
					? $options['extra']
					: '';
				if (is_array($extra)) {
					$extra = Q::json_encode($extra);
				}
				$results[$sn] = $rows[$sn] = new Streams_Participant(array(
					'publisherId' => $publisherId,
					'streamName' => $sn,
					'userId' => $asUserId,
					'streamType' => $stream->type,
					'state' => 'participating',
					'subscribed' => !empty($options['subscribed']) ? 'yes' : 'no',
					'posted' => !empty($options['posted']) ? 'yes' : 'no',
					'extra' => $extra
				));
			}
			Streams_Participant::insertManyAndExecute($rows);
			foreach ($streamNamesMissing as $sn) {
				$stream = $streams2[$sn];
				$participant = $rows[$sn];
				// Send a message to Node
				Q_Utils::sendToNode(array(
					"Q/method" => "Streams/Stream/join",
					"participant" => Q::json_encode($participant->fields),
					"stream" => Q::json_encode($stream->toArray()),
					"prevState" => null
				));
				// Stream messages to post
				$messages[$publisherId][$sn] = array(
					'type' => 'Streams/joined',
					'instructions' => array(
						'prevState' => null,
						'extra' => isset($participant->extra) ? $participant->extra : array()
					)
				);
			}
		}
		Streams_Message::postMessages($asUserId, $messages, true);
		// Relate to participating streams
		$relateStreams = array();
		foreach ($results as $sn => $p) {
			$participatingNames = Streams_Stream::getConfigField(
				$p->streamType, array('participating'), array()
			);
			foreach ($participatingNames as $pn) {
				$relateStreams[$pn][$p->streamType][] = $sn;
			}
		}
		foreach ($relateStreams as $pn => $streamTypes) {
			foreach ($streamTypes as $streamType => $streamNames) {
				if (!Streams_Stream::fetch($asUserId, $asUserId, $pn)) {
					Streams::create($asUserId, $asUserId, 'Streams/participating', array('name' => $pn));
				}
				$extraArray = array();
				foreach ($streamNames as $sn) {
					$extraArray[$sn] = $results[$sn]->extra;
				}
				Streams::relate(
					$asUserId, $asUserId, $pn,
					$streamType, $publisherId, $streamNames,
					array(
						'skipMessageFrom' => Q::ifset($options, 'skipRelationMessages', true),
						'skipAccess' => true,
						'weight' => time(),
						'extra' => $extraArray
					)
				);
			}
		}
		return $results;
	}
	
	/**
	 * If the user is participating in (some of) the streams, sets state of participant row
	 * as "left" and posts a "Streams/left" type message to the streams.
	 * Also unrelates every stream left to streams named under the config field
	 * "Streams"/"types"/$streamType/"participating"
	 * @method leave
	 * @static
	 * @param {string} $asUserId The id of the user that is joining. Pass null here to use the logged-in user's id.
	 * @param {string} $publisherId The id of the user publishing all the streams
	 * @param {array} $streams An array of Streams_Stream objects or stream names
	 * @param {array} [$options=array()] An associative array of options.
	 * @param {array} [$options.extra] Any extra information to tree-merge for the participants
	 * @param {boolean} [$options.skipAccess] If true, skip access check for whether user can join
	 * @param {boolean} [$options.skipRelationMessages=true] if true, skip posting messages on the stream about being unrelated to the joining asUserId's Streams/participating streams.
	 * @return {array} Returns an array of (streamName => Streams_Participant) pairs
	 */
	static function leave(
		$asUserId,
		$publisherId, 
		$streams,
		$options = array())
	{
		$streams2 = self::_getStreams($asUserId, $publisherId, $streams);
		$streamNames = array();
		foreach ($streams2 as $s) {
			$streamNames[] = $s->name;
		}
		if (empty($options['skipAccess'])) {
			self::_accessExceptions($streams2, $streamNames, 'join');
		}
		$participants = Streams_Participant::select()
		->where(array(
			'publisherId' => $publisherId,
			'streamName' => $streamNames,
			'userId' => $asUserId
		))->ignoreCache()->fetchDbRows(null, null, 'streamName');
		$streamNamesUpdate = array();
		$streamNamesMissing = array();
		$updateCounts = array();
		$state = 'left';
		foreach ($streamNames as $sn) {
			if (!isset($participants[$sn])) {
				$updateCounts[''][] = $sn;
				$streamNamesMissing[] = $sn;
				continue;
			}
			$p = &$participants[$sn];
			if ($p->state === $state) {
				continue;
			}
			if (!isset($participants[$sn])) {
				$streamNamesMissing[] = $sn;
				continue;
			}
			if (isset($options['extra'])) {
				$extra = Q::json_decode($p->extra, true);
				$tree = new Q_Tree($extra);
				$tree->merge($options['extra']);
				$extra = $p->extra = Q::json_encode($tree->getAll(), JSON_FORCE_OBJECT);
			}
			$streamNamesUpdate[] = $sn;
			$updateCounts[$p->state][] = $sn;
			$p->set('prevState', $p->state);
			$p->state = $state;
		}
		if ($streamNamesUpdate) {
			$updateFields = array(
				"state" => $state,
				"subscribed" => "no"
			);
			if (isset($extra)) {
				$updateFields['extra'] = $extra;
			}
			Streams_Participant::update()
				->set($updateFields)
				->where(array(
					'publisherId' => $publisherId,
					'streamName' => $streamNamesUpdate,
					'userId' => $asUserId
				))->execute();
		}
		self::_updateCounts($publisherId, $updateCounts, $state);
		if ($streamNamesMissing) {
			$rows = array();
			foreach ($streamNamesMissing as $sn) {
				$stream = $streams2[$sn];
				$participants[$sn] = $rows[$sn] = new Streams_Participant(array(
					'publisherId' => $publisherId,
					'streamName' => $sn,
					'userId' => $asUserId,
					'streamType' => $stream->type,
					'state' => $state,
					'subscribed' => !empty($options['subscribed']) ? 'yes' : 'no',
					'posted' => !empty($options['posted']) ? 'yes' : 'no',
					'extra' => !empty($options['extra']) ? $options['extra'] : ''
				));
			}
			Streams_Participant::insertManyAndExecute($rows);
		}
		$messages = empty($streamNames) ? null : array();
		foreach ($streamNames as $sn) {
			$stream = $streams2[$sn];
			$participant = Q::ifset($participants, $sn, null);
			$prevState = $participant ? $participant->get('prevState', null) : null;
			// Send a message to Node
			Q_Utils::sendToNode(array(
				"Q/method" => "Streams/Stream/leave",
				"participant" => Q::json_encode($participant->toArray()),
				"stream" => Q::json_encode($stream->toArray()),
				"prevState" => $prevState
			));
			// Stream messages to post
			$messages[$publisherId][$sn] = array(
				'type' => 'Streams/left',
				'instructions' => array(
					'prevState' => $prevState,
					'extra' => isset($participant->extra) ? $participant->extra : array()
				)
			);
		}
		Streams_Message::postMessages($asUserId, $messages, true);
		// Unrelate to participating streams
		$unrelateStreams = array();
		foreach ($participants as $sn => $p) {
			$participatingNames = Streams_Stream::getConfigField(
				$p->streamType, array('participating'), array()
			);
			foreach ($participatingNames as $pn) {
				$unrelateStreams[$pn][$p->streamType][] = $sn;
			}
		}
		foreach ($unrelateStreams as $pn => $streamTypes) {
			foreach ($streamTypes as $streamType => $streamNames) {
				if (!Streams_Stream::fetch($asUserId, $asUserId, $pn)) {
					Streams::create($asUserId, $asUserId, null, array('name' => $pn));
				}
				Streams::unrelate(
					$asUserId, $asUserId, $pn,
					$streamType, $publisherId, $streamNames,
					array(
						'skipMessageFrom' => Q::ifset($options, 'skipRelationMessages', true),
						'skipAccess' => true,
						'adjustWeights' => 0
					)
				);
			}
		}
		return $participants;
	}

	/**
	 * Subscribe to one or more streams, to start receiving notifications.
	 * Posts "Streams/subscribe" message to the streams.
	 * Also posts "Streams/subscribed" messages to user's "Streams/participating" stream.
	 *	If options are not given check the subscription templates:
	 *	1. generic publisher id and generic user
	 *	2. exact publisher id and generic user
	 *	3. generic publisher id and exact user
	 *	default is to subscribe to ALL messages.
	 *	If options are supplied - skip templates and use options.
	 * Using subscribe if subscription is already active will modify existing
	 * subscription - change type(s) or modify notifications
	 * @method subscribe
	 * @static
	 * @param {string} $asUserId The id of the user that is joining and subscribing. Pass null here to use the logged-in user's id.
	 * @param {string} $publisherId The id of the user publishing all the streams
	 * @param {array} $streams An array of Streams_Stream objects or stream names
	 * @param {array} [$options=array()] Options for the subscribe() and join() methods
	 * @param {array} [$options.filter] optional array with two keys
	 * @param {array} [$options.filter.types] array of message types, if this is empty then subscribes to all types
	 * @param {array} [$options.filter.notifications=0] limit number of notifications, 0 means no limit
	 * @param {datetime} [$options.untilTime=null] optionally custom time limit, if subscriptions
	 * @param {array} [$options.rule=array()] optionally set custom rule for subscriptions
	 * @param {array} [$options.rule.deliver=array('to'=>'default')] under "to" key,
	 *   named the field under Streams/rules/deliver config, which will contain the names of destinations,
	 *   which can include "email", "mobile", "email+pending", "mobile+pending"
	 * @param {datetime} [$options.rule.readyTime] time from which user is ready to receive notifications again
	 * @param {array} [$options.rule.filter] optionally set a filter for the rules to add
	 * @param {boolean} [$options.skipRules=false] if true, do not attempt to create rules for new subscriptions
	 * @param {boolean} [$options.skipAccess=false] if true, skip access check for whether user can join and subscribe
	 * @param {boolean} [$options.skipMessage=false] if true, skip posting the "Streams/subscribed" message to the stream
	 * @return {array} An array of Streams_Participant rows from the database.
	 */
	static function subscribe(
		$asUserId, 
		$publisherId, 
		$streams, 
		$options = array())
	{
		if (empty($streams)) {
			return array();
		}
		$streams2 = self::_getStreams($asUserId, $publisherId, $streams);
		$streamNames = array();
		foreach ($streams2 as $s) {
			$streamNames[] = $s->name;
		}
		if (empty($options['skipAccess'])) {
			self::_accessExceptions($streams2, $streamNames, 'join');
		}
		$o = array_merge($options, array(
			'subscribed' => true,
			'noVisit' => true
		));
		$participants = Streams::join($asUserId, $publisherId, $streams2, $o);
		$shouldUpdate = false;
		if (isset($options['filter'])) {
			$filter = Q::json_encode($options['filter']);
			$shouldUpdate = true;
		}
		$db = Streams_Subscription::db();
		if (isset($options['untilTime'])) {
			$untilTime = $db->toDateTime($options['untilTime']);
			$shouldUpdate = true;
		}
		if (isset($options['rule'])) {
			$rule = $options['rule']; // we aren't updating rules like this though
		}
		$subscriptions = Streams_Subscription::select('*', 'a')
		->where(array(
				'a.publisherId' => $publisherId,
				'a.streamName' => $streamNames,
				'a.ofUserId' => $asUserId
		))->join(Streams_Stream::table(true, 'b'), array(
			'a.publisherId' => 'b.publisherId',
			'a.streamName' => 'b.name'
		))->fetchDbRows(null, '', 'streamName');
		$messages = array();
		$streamNamesMissing = array();
		$streamNamesUpdate = array();
		foreach ($streamNames as $sn) {
			$messages[$publisherId][$sn] = array('type' => 'Streams/subscribed');
			if (empty($subscriptions[$sn])) {
				$streamNamesMissing[] = $sn;
				continue;
			}
			if ($shouldUpdate) {
				$streamNamesUpdate[] = $sn;
			}
		}
		if ($streamNamesUpdate) {
			Streams_Subscription::update()
			->set(@compact('filter', 'untilTime'))
			->where(array(
				'publisherId' => $publisherId,
				'streamName' => $streamNamesUpdate,
				'ofUserId' => $asUserId
			))->execute();
		}
		$rules = array();
		$userStreamsTree = Streams::userStreamsTree();
		if ($streamNamesMissing) {
			$types = array();
			$rows = Streams_Stream::select(array('name', 'type'))->where(array(
				'publisherId' => $publisherId,
				'name' => $streamNamesMissing
			))->fetchAll(PDO::FETCH_ASSOC);
			foreach ($rows as $row) {
				$name = $row['name'];
				$type = $row['type'];
				if ($o = $userStreamsTree->get($name, "subscribe", array())) {
					if (isset($o['filter'])) {
						$filter = Q::json_encode($o['filter']);
					}
					if (isset($o['untilTime'])) {
						$untilTime = $db->toDateTime($o['untilTime']);
					}
					if (isset($o['rule'])) {
						$rule = $o['rule'];
					}
				}
				if (!isset($filter) or !isset($untilTime)) {
					$templates = Streams_Subscription::select()
						->where(array(
							'publisherId' => array('', $publisherId),
							'streamName' => "$type/",
							'ofUserId' => array('', $asUserId)
						))->fetchAll(PDO::FETCH_ASSOC);
					$template = null;
					foreach ($templates as $t) {
						if (!$template
						or ($template['publisherId'] == '' and $t['publisherId'] !== '')
						or ($template['userId'] == '' and $t['userId'] !== '')) {
							$template = $t;
						}
					}
				}
				if (!isset($filter)) {
					$filter = Q::json_encode($template
						? Q::json_decode($template['filter'])
						: Streams_Stream::getConfigField($type, array(
							'subscriptions', 'filter'
						), array(
							"types" => array(
								"^(?!(Users/)|(Streams/)).*/",
								"Streams/relatedTo",
								"Streams/announcement",
								"Streams/chat/message"
							),
							"notifications" => 0
						))
					);
				}
				if (!isset($untilTime)) {
					$untilTime = ($template and $template['duration'] > 0)
						? new Db_Expression("CURRENT_TIMESTAMP + INTERVAL $template[duration] SECOND")
						: null;
				}
				if (!isset($rule)) {
					$rule = null;
				}
				$types[$type][] = array($name, $filter, $untilTime, $rule);
			}
			// prepare subscriptions and rules to be batch-inserted
			$subscriptionRows = array();
			$ruleRows = array();
			foreach ($types as $type => $infos) {
				foreach ($infos as $info) {
					list($name, $filter, $untilTime, $rule) = $info;
					$subscriptions[$name] = $subscriptionRows[] = new Streams_Subscription(array(
						'publisherId' => $publisherId,
						'streamName' => $name,
						'ofUserId' => $asUserId,
						'untilTime' => $untilTime,
						'filter' => $filter
					));
					if (!empty($options['skipRules'])) {
						continue;
					}

					// insert up to one rule per subscription
					if (isset($rule)) {
						if (isset($rule['readyTime'])) {
							$rule['readyTime'] = $db->toDateTime($rule['readyTime']);
						}
						if (isset($rule['filter']) and is_array($rule['filter'])) {
							$rule['filter'] = Q::json_encode($rule['filter']);
						}
						if (isset($rule['deliver']) and is_array($rule['deliver'])) {
							$rule['deliver'] = Q::json_encode($rule['deliver']);
						}
					}
					if (!isset($rule)) {
						// the following statement uses cache, so it happens once per type
						$templates = Streams_SubscriptionRule::select()
							->where(array(
								'ofUserId' => array('', $asUserId),
								'publisherId' => array('', $publisherId),
								'streamName' => $type.'/',
								'ordinal' => 1
							))->fetchAll(PDO::FETCH_ASSOC);
						foreach ($templates as $t) {
							if (!$rule
							or ($rule['userId'] == '' and $t['userId'] !== '')
							or ($rule['publisherId'] == '' and $t['publisherId'] !== '')) {
								$rule = $t;
							}
						}
					}
					if (!isset($rule)) {
						$rule = array(
							'deliver' => '{"to": "default"}',
							'filter' => '{"types": [], "labels": []}'
						);
					}
					if ($rule) {
						$rule['ofUserId'] = $asUserId;
						$rule['publisherId'] = $publisherId;
						if (empty($rule['readyTime'])) {
							$rule['readyTime'] = new Db_Expression("CURRENT_TIMESTAMP");
						}
						$row = $rule;
						$row['streamName'] = $name;
						$row['ordinal'] = 1;
						if (!isset($row['filter'])) {
							$row['filter'] = '';
						}
						$rules[$name] = $ruleRows[] = $row;
						$messages[$publisherId][$name]['instructions'] = Q::json_encode(array(
							'rule' => $row
						));
					}
				}
			}
			Streams_Subscription::insertManyAndExecute($subscriptionRows);
			Streams_SubscriptionRule::insertManyAndExecute($ruleRows);
		}

		$streams5 = Q::take($streams, $streamNames);
		Q_Utils::sendToNode(array(
			"Q/method" => "Streams/Stream/subscribe",
			"subscriptions" => Q::json_encode($subscriptions),
			"streams" => Q::json_encode($streams5),
			"rules" => Q::json_encode($rules)
		));
		if (empty($options['skipMessage'])) {
			Streams_Message::postMessages($asUserId, $messages, true);
		}
		
		return $participants;
	}
	
	/**
	 * Unsubscribe from one or more streams, to stop receiving notifications.
	 * Posts "Streams/unsubscribe" message to the streams.
	 * Also posts "Streams/unsubscribed" messages to user's "Streams/participating" stream.
	 * Does not change the actual subscription, but only the participant row.
	 * (When subscribing again, the existing subscription will be used.)
	 * @method unsubscribe
	 * @static
	 * @param {string} $asUserId The id of the user that is joining. Pass null here to use the logged-in user's id.
	 * @param {string} $publisherId The id of the user publishing all the streams
	 * @param {array} $streams An array of Streams_Stream objects or stream names
	 * @param {array} [$options=array()]
	 * @param {boolean} [$options.leave=false] set to true to also leave the streams
	 * @param {boolean} [$options.skipAccess=false] if true, skip access check for whether user can join and subscribe
	 * @param {boolean} [$options.skipMessage=false] if true, skip posting the "Streams/unsubscribe" message to the stream
	 * @return {array} Returns an array of Streams_Participant rows, if any were in the database.
	 */
	static function unsubscribe(
		$asUserId, 
		$publisherId, 
		$streams, 
		$options = array())
	{
		$streams2 = self::_getStreams($asUserId, $publisherId, $streams);
		$streamNames = array();
		foreach ($streams2 as $s) {
			$streamNames[] = $s->name;
		}
		if (empty($options['skipAccess'])) {
			self::_accessExceptions($streams2, $streamNames, 'join');
		}
		$skipAccess = Q::ifset($options, 'skipAccess', false);
		if (empty($options['leave'])) {
			$criteria = array(
				'publisherId' => $publisherId,
				'streamName' => $streamNames,
				'userId' => $asUserId
			);
			Streams_Participant::update()
				->set(array('subscribed' => 'no'))
				->where($criteria)->execute();
			$participants = Streams_Participant::select()
				->where($criteria)
				->fetchDbRows();
		} else {
			$participants = Streams::leave(
				$asUserId, $publisherId, $streams2, @compact('skipAccess')
			);
		}
		$messages = array();
		foreach ($streamNames as $sn) {
			$stream = $streams2[$sn];
			if ($participant = Q::ifset($participants, $sn, null)) {
				if ($participant instanceof Streams_Participant) {
					$participant = $participant->toArray();
				}
			}
			// Send a message to Node
			Q_Utils::sendToNode(array(
				"Q/method" => "Streams/Stream/unsubscribe",
				"participant" => Q::json_encode($participant),
				"stream" => Q::json_encode($stream->toArray())
			));
			// Stream messages to post
			$messages[$publisherId][$sn] = array('type' => 'Streams/unsubscribe');
		}
		if (empty($options['skipMessage'])) {
			Streams_Message::postMessages($asUserId, $messages, true);
		}
		return $participants;
	}

	private static function _getStreams(&$asUserId, $publisherId, $streams)
	{
		if (!isset($asUserId)) {
			$asUserId = Users::loggedInUser(true)->id;
		} else if ($asUserId instanceof Users_User) {
			$asUserId = $asUserId->id;
		}
		Users::fetch($asUserId, true);
		$names = array();
		$streams2 = array();
		foreach ($streams as $s) {
			if (is_string($s)) {
				$names[] = $s;
			} else if ($s instanceof Streams_Stream) {
				$streams2[$s->name] = $s;
			} else if (isset($s)) {
				throw new Q_Exception_WrongType(array(
					'field' => 'stream',
					'type' => 'Streams_Stream or string'
				));
			}
		}
		$rows = Streams::fetch($asUserId, $publisherId, $names, array('refetch' => true));
		$result = array_merge($streams2, $rows);
		foreach ($result as $k => $v) {
			if (!isset($v)) {
				unset($result[$k]);
			}
		}
		return $result;
	}
	
	
	/**
	 * Gets the streams related by relation of type "Streams/participating"
	 * to the given category stream. Typically, these relations are added and removed
	 * when the user joins or leaves the related streams, which is done automatically
	 * by the Streams plugin with the streams named in under the config field
	 * "Streams"/"types"/$streamType/"participating", which is an array of stream names.
	 * @method participating
	 * @static
	 * @param {string|array|Db_Range} [$options.type]
	 *  Filter the type(s) of the streams to return, that the user is participating in.
	 * @param {array} [$options=array()] options you can pass to Streams::relate() method
	 * @param {string} [$options.publisherId=Users::loggedInUser(true)->id] the publisher of the category stream
	 * @param {string} [$options.categoryName='Streams/participating'] the name of the category stream
	 * @param {string} [$options.asUserId=Users::loggedInUser(true)->id] the user to fetch as
	 * @return {array}
	 *  Returns array($relations, $relatedStreams, $stream).
	 *  However, if $streamName wasn't a string or ended in "/"
	 *  then the third parameter is an array of streams.
	 *  Also, if $options['streamsOnly'] or $options['relationsOnly'] is set,
	 *  then returns only $relatedStreams or $relations.
	 */
	static function participating(
		$type = null,
		$options = array())
	{
		if (isset($type)) {
			$options['type'] = $type;
		}
		$streamName = isset($options['categoryName'])
			? $options['categoryName']
			: 'Streams/participating';
		$publisherId = isset($options['publisherId'])
			? $options['publisherId']
			: Users::loggedInUser(true)->id;
		$asUserId = isset($options['asUserId'])
			? $options['asUserId']
			: $publisherId;
		return Streams::related($asUserId, $publisherId, $streamName, true, $options);
	}

	private static function _accessExceptions($streams2, $streamNames, $writeLevel)
	{
		foreach ($streamNames as $sn) {
			$stream = $streams2[$sn];
			if (!$stream->testWriteLevel($writeLevel)) {
				if (!$stream->testReadLevel('see')) {
					throw new Streams_Exception_NoSuchStream();
				}
				throw new Users_Exception_NotAuthorized();
			}
		}
	}
	
	private static function _updateCounts($publisherId, $updateCounts, $state)
	{
		foreach ($updateCounts as $prevState => $names) {
			if ($prevState === $state) {
				continue;
			}
			$newStateField = $state.'Count';
			$updates = array(
				$newStateField => new Db_Expression("$newStateField + 1")
			);
			if ($prevState) {
				$prevStateField = $prevState.'Count';
				$updates[$prevStateField] = new Db_Expression("$prevStateField - 1");
			}
			Streams_Stream::update()
				->set($updates)
				->where(array(
					'publisherId' => $publisherId,
					'name' => $names
				))->execute();
		}
	}
	
	/**
	 * Invites a user (or a future user) to a stream .
	 * @method invite
	 * @static
	 * @param {string} $publisherId The id of the stream publisher
	 * @param {string} $streamName The name of the stream the user will be invited to
	 * @param {array} $who Array that can contain the following keys:
	 * @param {string|array} [$who.userId] user id or an array of user ids
	 * @param {string} [$who.platform] platform for which xids are passed
	 * @param {string} [$who.appId] id of platform app for which xids are passed
	 * @param {string|array} [$who.xid] platform xid or array of xids
	 * @param {string|array} [$who.label]  label or an array of labels, or tab-delimited string
	 * @param {string|array} [$who.identifier] identifier such as an email or mobile number, or an array of identifiers, or tab-delimited string
	 * @param {integer} [$who.newFutureUsers] the number of new Users_User objects to create via Users::futureUser in order to invite them to this stream. This typically is used in conjunction with passing the "html" option to this function.
	 * @param {boolean} [$who.token=false] pass true here to save a Streams_Invite row
	 *  with empty userId, which is used whenever someone makes a request with the
	 *  "Q.Streams.token" querystring parameter containing the token.
	 *  This row is exported under "invite" key of the returned data.
	 *  See the Streams/before/Q_objects.php hook for more information.
	 *  You can also pass an array with two keys here, named "suggestion" and "Q.sig"
	 *  which were generated by Streams_invite_response_suggestion handler.
	 * @param {string} [$_REQUEST.token.suggestion] Suggestion generated by Streams/invite "suggestion"
	 * @param {string} [$_REQUEST.token.Q.sig] Signature generated by Streams/invite "suggestion"
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
	 *	@param {array} [$options.template] Directory for custom templates (email.handlebars, mobile.handlebars, device.handlebars).
	 * @param {string} [$options.asUserId=Users::loggedInUser(true)->id] Invite as this user id, defaults to logged-in user
	 * @param {boolean} [$options.alwaysSend=false] Send invitation message even if already sent.
	 * @param {boolean} [$options.skipAccess] whether to skip access checks when adding labels and contacts
	 * @param {string} [$options.baseUrl] Override the base url when making the invite url
	 * @see Users::addLink()
	 * @throws Users_Exception_NotAuthorized
	 * @throws Q_Exception_WrongType
	 * @throws Q_Exception_MissingFile
	 * @throws Q_Exception_WrongValue
	 * @return {array} Returns array with keys
	 *  "success", "invite", "count", "userIds", "statuses", "identifierTypes", "alreadyParticipating".
	 *  The userIds array contains userIds from "userId" first, then "identifiers", "xids", "label",
	 *  then "newFutureUsers". The statuses is an array of the same size and in the same order.
	 *  The identifierTypes array is in the same order as well.
	 *  If the "token" option was set to true, the array also contains the "invite"
	 *  key pointing to a Streams_Invite object that was saved in the database
	 *  (whose userId field is empty because anyone with the token may accept this invite).
	 */
	static function invite($publisherId, $streamName, $who, $options = array())
	{
		$options = Q::take($options, array(
			'readLevel', 'writeLevel', 'adminLevel', 'permissions', 'asUserId', 'html',
			'addLabel', 'addMyLabel', 'name', 'displayName', 'appUrl', 'alwaysSend', 'skipAccess',
			'templateDir', 'icon'
		));
		
		if (isset($options['asUserId'])) {
			$asUserId = $options['asUserId'];
			$asUser = Users_User::fetch($asUserId);
		} else {
			$asUser = Users::loggedInUser(true);
			$asUserId = $asUser->id;
		}

		// Fetch the stream as the logged-in user
		$stream = Streams_Stream::fetch($asUserId, $publisherId, $streamName, true);

		// Do we have enough admin rights to invite others to this stream?
		if (!$stream->testAdminLevel('invite') || !$stream->testWriteLevel('join')) {
			throw new Users_Exception_NotAuthorized();
		}

		if (isset($options['templateDir'])) {
			$templateDir = $options['templateDir'];
			$dirname = APP_VIEWS_DIR.DS.$templateDir;
			if (!is_dir($dirname)) {
				throw new Q_Exception_MissingDir(@compact('dirname'));
			}
		}
		if (isset($options['html'])) {
			$html = $options['html'];
			if (!is_array($html) or count($html) < 2) {
				throw new Q_Exception_WrongType(array(
					'field' => "options.html",
					'type' => 'array of 2 strings'
				));
			}
			list($template, $batchName) = $html;
			// validate these paths
			$filename = APP_VIEWS_DIR.DS.$template;
			if (!Q::realPath($filename)) {
				throw new Q_Exception_MissingFile(@compact('filename'));
			}
			$ext = $pathinfo = pathinfo($template, PATHINFO_EXTENSION);
			if ($ext !== 'handlebars') {
				throw new Q_Exception_WrongValue(array(
					'field' => 'options.html[0]',
					'range' => 'a filename with extension .handlebars'
				));
			}
			$path = Streams::invitationsPath($asUserId).DS.$batchName;
			Q_Utils::canWriteToPath($path, true, true);
		}

		// merge identifiers if any
		$raw_userIds = array();
		$identifiers = array();
		$identifierTypes = array();
		$statuses = array();
		// get user ids if any to array, throw if user not found
		if (isset($who['userId'])) {
			$userIds = $who['userId'];
			if (!is_array($userIds)) {
				$userIds = array($userIds);
			}
			$users = Users::fetch($userIds, true);
			$raw_userIds = array_keys($users);
			foreach ($users as $xid => $user) {
				$identifierTypes[] = 'userId';
				$statuses[] = $user->sessionCount ? 'verified' : 'future';
			}
		}
		if (isset($who['identifier'])) {
			$identifiers = $who['identifier'];
			if (is_string($identifiers)) {
				$identifiers = array_map('trim', explode("\t", $identifiers)) ;
			}
			$statuses1 = array();
			$identifier_ids = Users_User::idsFromIdentifiers(
				$identifiers, $statuses1, $identifierTypes1
			);
			$raw_userIds = array_merge($raw_userIds, $identifier_ids);
			$statuses = array_merge($statuses, $statuses1);
			$identifierTypes = array_merge($identifierTypes, $identifierTypes1);
		}
		if (!empty($who['platform']) and !empty($who['appId']) and !empty($who['xid'])) {
			// merge users from platform xids
			$platform = $who['platform'];
			$appId = $who['appId'];
			$xids = $who['xid'];
			if (is_string($xids)) {
				$xids = array_map('trim', explode("\t", $xids)) ;
			}
			$statuses2 = array();
			$raw_userIds = array_merge(
				$raw_userIds, 
				Users_User::idsFromPlatformXids($platform, $appId, $xids, false, $statuses2)
			);
			$statuses = array_merge($statuses, $statuses2);
			$identifiers = array_merge($identifiers, $xids);
			$identifierTypes2 = array_fill(0, count($statuses2), $platform);
			$identifierTypes = array_merge($identifierTypes, $identifierTypes2);
		}
		// merge labels if any
		$label = null;
		if (isset($who['label'])) {
			$label = $who['label'];
			if (is_string($label)) {
				$label = array_map('trim', explode("\t", $label)) ;
			}
			$userIdsFromLabels = Users_User::labelsToIds($asUserId, $label);
			$raw_userIds = array_merge($raw_userIds, $userIdsFromLabels);
			foreach ($userIdsFromLabels as $userId) {
				$statuses[] = 'verified'; // NOTE: this may occasionally be inaccurate
				$identifierTypes[] = 'label';
			}
		}
		if (!empty($who['newFutureUsers'])) {
			$nfu = $who['newFutureUsers'];
			for ($i=0; $i<$nfu; ++$i) {
				$raw_userIds[] = Users::futureUser('none', null)->id;
				$statuses[] = 'future';
				$identifierTypes[] = 'newFutureUsers';
			}
		}
		// ensure that each userId is included only once
		$userIds = array_unique($raw_userIds);
		$alreadyParticipating = Streams_Participant::filter(
			$userIds, $stream->publisherId, $stream->name, 'participating'
		);
		
		$alwaysSend = Q::ifset($options, 'alwaysSend', false);

		// remove already participating users if alwaysSend=false
		if (!$alwaysSend) {
			$userIds = array_diff($raw_userIds, $alreadyParticipating);
		}

		if (!empty($options['appUrl'])) {
			$appUrl = $options['appUrl'];
		} else {
			$appUrl = $stream->url();
		}

		// now check and define levels for invited user
		$readLevel = isset($options['readLevel']) ? $options['readLevel'] : null;
		if (isset($readLevel)) {
			$readLevel = Streams_Stream::numericReadLevel($readLevel);
			if (!$stream->testReadLevel($readLevel)) {
				// We can't assign greater read level to other people than we have ourselves!
				throw new Users_Exception_NotAuthorized();
			}
		}
		$writeLevel = isset($options['writeLevel']) ? $options['writeLevel'] : null;
		if (isset($writeLevel)) {
			$writeLevel = Streams_Stream::numericWriteLevel($writeLevel);
			if (!$stream->testWriteLevel($writeLevel)) {
				// We can't assign greater write level to other people than we have ourselves!
				throw new Users_Exception_NotAuthorized();
			}
		}
		$adminLevel = isset($options['adminLevel']) ? $options['adminLevel'] : null;
		if (isset($adminLevel)) {
			$adminLevel = Streams_Stream::numericAdminLevel($adminLevel);
			if (!$stream->testAdminLevel($adminLevel+1)) {
				// We can't assign an admin level greater, or equal, to our own!
				// A stream's publisher can assign owners. Owners can assign admins.
				// Admins can confer powers to invite others, to some people.
				// Those people can confer the privilege to publish a message re this stream.
				// But admins can't assign other admins, and even stream owners
				// can't assign other owners. 
				throw new Users_Exception_NotAuthorized();
			}
		}
		$permissions = isset($options['permissions']) ? $options['permissions'] : null;
		if (isset($permissions)) {
			foreach ($permissions as $permission) {
				$byPermissions = $stream->get('permissions', array());
				if (!in_array($permission, $byPermissions)) {
					// We can't assign permissions we don't have ourselves
					throw new Users_Exception_NotAuthorized();
				}
			}
		}

		// calculate expireTime
		$duration = Q_Config::get("Streams", "types", $stream->type, "invite", "duration", false);
		$expireTime = $duration ? strtotime("+$duration seconds") : null;
		
		$asUserId2 = empty($options['skipAccess']) ? $asUserId : false;

		if ($addLabel = Q::ifset($options, 'addLabel', null)) {
			if (is_string($label)) {
				$addLabel = explode("\t", $addLabel);
			}
			Users_Label::addLabel($addLabel, $publisherId, null, null, $asUserId2);
		}
		if ($addMyLabel = Q::ifset($options, 'addMyLabel', null)) {
			if (is_string($addMyLabel)) {
				$addMyLabel = explode("\t", $addMyLabel);
			}
			Users_Label::addLabel($addMyLabel, $asUserId, null, null, $asUserId2);
		}

		$asUserDisplayName = Streams::displayName($asUser);
		
		$displayName = Q::ifset($options, 'displayName', Q::ifset($options, 'name', null));
		$icon = Q::ifset($options, 'icon', null);

		foreach ($raw_userIds as $userId) {
			if (!Users::isCommunityId($asUserId) or $asUserId !== $publisherId) {
				// For now, don't add labels to community itself
				// for just inviting the user to its own published streams.
				// TODO: Debate the merits of this approach.
				Users_Contact::addContact($asUserId, "Streams/invited", $userId, null, false, true);
				Users_Contact::addContact($asUserId, "Streams/invited/{$stream->type}", $userId, null, false, true);
				Users_Contact::addContact($userId, "Streams/invitedMe", $asUserId, null, false, true);
				Users_Contact::addContact($userId, "Streams/invitedMe/{$stream->type}", $asUserId, null, false, true);
			}
			if ($addMyLabel) {
				$myLabels = Q::isAssociative($addMyLabel) ? array_keys($addMyLabel) : $addMyLabel;
				Users_Contact::addContact($asUserId, $myLabels, $userId, null, $asUserId2, true);
			}

			if ($displayName) {
				try {
					Q::event("Streams/basic/post", array(
						"userId" => $userId,
						"fullName" => $displayName
					));
				} catch (Exception $e) {}
			}
			if ($icon) {
				try {
					Q::event('Q/image/post', array(
						'data' => $icon,
						'path' => "Q/uploads/Users",
						'subpath' => Q_Utils::splitId($userId, 3, '/')."/icon/".time(),
						'save' => "Users/icon",
						'skipAccess' => true
					));
				} catch (Exception $e) {}
			}
		}

		// let node handle the rest, and get the result
		$params = array(
			"Q/method" => "Streams/Stream/invite",
			"invitingUserId" => $asUserId,
			"username" => $asUser->username,
			"preferredLanguage" => $asUser->preferredLanguage,
			"userIds" => Q::json_encode($userIds),
			"stream" => Q::json_encode($stream->toArray()),
			"appUrl" => $appUrl,
			"label" => $label,
			"addLabel" => $addLabel,
			"addMyLabel" => $addMyLabel, 
			"alwaysSend" => $alwaysSend,
			"readLevel" => $readLevel,
			"writeLevel" => $writeLevel,
			"adminLevel" => $adminLevel,
			"permissions" => $permissions,
			"displayName" => $asUserDisplayName,
			"expireTime" => $expireTime
		);
		
		if (!empty($template)) {
			$params['template'] = $template;
			$params['batchName'] = $batchName;
		}
		if (!empty($templateDir)) {
			$params['templateDir'] = $templateDir;
		}
		try {
			$result = Q_Utils::queryInternal('Q/node', $params);
		} catch (Exception $e) {
			// just suppress it
			$result = null;
		}

		$return = array(
			'publisherId' => $publisherId,
			'streamName' => $streamName,
			'success' => $result,
			'count' => count($raw_userIds),
			'userIds' => $raw_userIds,
			'statuses' => $statuses,
			'identifiers' => $identifiers,
			'identifierTypes' => $identifierTypes,
			'alreadyParticipating' => $alreadyParticipating
		);
		
		if (!empty($who['token'])) {
			$invite = new Streams_Invite();
			if (is_array($who['token'])) {
				Q_Valid::requireFields(array('token', 'Q.sig'), $who['token'], true);
				if (Q_Utils::sign($who['token']) !== $who['token']) {
					throw new Q_Exception_InvalidInput(array('source' => 'token'));
				}
				$invite->token = $who['token']['token'];
				if ($invite->retrieve()) {
					throw new Q_Exception_AlreadyExists(array('source' => 'invite with this token'));
				}
			}
			$invite->userId = '';
			$invite->publisherId = $publisherId;
			$invite->streamName = $streamName;
			$invite->invitingUserId = $asUserId;
			$invite->displayName = $displayName;
			$invite->appUrl = $appUrl;
			$invite->readLevel = $readLevel;
			$invite->writeLevel = $writeLevel;
			$invite->adminLevel = $adminLevel;
			$invite->state = 'pending';
			if (!empty($addLabel)) {
				$invite->setExtra('addLabel', $addLabel);
			}
			if (!empty($addMyLabel)) {
				$invite->setExtra('addMyLabel', $addMyLabel);
			}
			$invite->save();
			$return['invite'] = $invite->exportArray();
			$return['url'] = $invite->url();
		}
		
		// $instructions = array_merge($who, $options, @compact(
		// 	'displayName', 'appUrl', 'readLevel', 'writeLevel', 'adminLevel', 'permissions'
		// ));
		// Streams_Message::post($asUserId, $publisherId, $streamName, array(
		// 	'type' => 'Streams/invite',
		// 	'instructions' => $instructions
		// ), true);
		
		/**
		 * @event Streams/invite {after}
		 * @param {string} success
		 * @param {array} userIds
		 * @param {array} identifiers
		 * @param {array} identifierTypes
		 * @param {array} alreadyParticipating
		 * @param {Streams_Invite} invite
		 */
		Q::event('Streams/invite', $return, 'after');

		return $return;
	}
	
	/**
	 * This is for any user to request access to a stream (rather than being invited).
	 * Each user is allowed at most one request per stream at a time.
	 * If a request already exists, then this function returns it, even if it has
	 * different parameters.
	 * Otherwise, it inserts a request for upgrading access to a stream,
	 * and schedules actions to be taken automatically if the request is granted.
	 * It also posts a "Streams/request" message to the stream, so that someone
	 * with the adminLevel >= invite and adequate readLevel, writeLevel and permissions
	 * can grant the request.
	 * @method request
	 * @static
	 * @param {string} $publisherId The id of the stream publisher
	 * @param {string} $streamName The name of the stream the request is about
	 * @param {array} [$options=array()] All of these are optional
	 *  @param {string} [$options.userId=Users::loggedInUser()->id]
	 *    The id of the user requesting the upgraded access.
	 *  @param {string|integer} [$options.readLevel] upgrade to read level being requested
	 *  @param {string|integer} [$options.writeLevel] upgrade to write level being requested
	 *  @param {string|integer} [$options.adminLevel] upgrade to admin level being requested
	 *  @param {array} [$options.permissions] array of additional permissions to request
	 *  @param {array} [$options.actions] array of actions to take automatically
	 *    right after a request is granted, e.g. "Streams/joined" or "Streams/subscribed".
	 *    These can be interpreted in the "after" hook for "Streams/request" event.
	 * @return {Streams_Request} The request row that has been inserted into the database
	 */
	static function request($publisherId, $streamName, $options = array())
	{
		// get the user id
		if (isset($options['userId'])) {
			$userId = $options['userId'];
			$user = Users_User::fetch($userId);
		} else {
			$user = Users::loggedInUser(true);
			$userId = $user->id;
		}
		
		// see if such a request already exists
		$request = new Streams_Request();
		$request->publisherId = $publisherId;
		$request->streamName = $streamName;
		$request->userId = $userId;
		if ($request->retrieve()) {
			return $request;
		}
		
		// fetch the stream as the logged-in user
		$stream = Streams_Stream::fetch($userId, $publisherId, $streamName, true);

		// process any requested levels
		$readLevel = isset($options['readLevel']) ? $options['readLevel'] : null;
		if (isset($readLevel)) {
			$request->readLevel = Streams_Stream::numericReadLevel($readLevel);
		}
		$writeLevel = isset($options['writeLevel']) ? $options['writeLevel'] : null;
		if (isset($writeLevel)) {
			$request->writeLevel = Streams_Stream::numericWriteLevel($writeLevel);
		}
		$adminLevel = isset($options['adminLevel']) ? $options['adminLevel'] : null;
		if (isset($adminLevel)) {
			$request->adminLevel = Streams_Stream::numericAdminLevel($adminLevel);
		}
		$permissions = isset($options['permissions']) ? $options['permissions'] : null;
		if (!is_array($permissions)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'permissions', 
				'range' => 'array'
			));
		}
		$request->permissions = Q::json_encode($permissions);

		// calculate expireTime
		$duration = Q_Config::get("Streams", "types", $stream->type, "request", "duration", false);
		$request->expireTime = $duration ? strtotime("+$duration seconds") : null;
		
		// fill out the rest of the fields
		$request->state = 'pending';
		
		/**
		 * @event Streams/request {before}
		 * @param {Streams_Request} request
		 */
		Q::event('Streams/request', @compact('userId'), 'before');
		$request->save();
		
		// Send Streams/request message to the stream
		Streams_Message::post($userId, $publisherId, $streamName, array(
			'type' => 'Streams/request',
			'instructions' => Q::take($request->fields, array(
				'readLevel', 'writeLevel', 'adminLevel', 'expireTime', 'state'
			))
		), true);
			
		/**
		 * @event Streams/request {after}
		 * @param {Streams_Request} request
		 */
		Q::event('Streams/request', @compact('request'), 'after');

		return $request;
	}
	
	/**
	 * Closes a stream, which prevents anyone from posting messages to it
	 * unless they have WRITE_LEVEL >= "close". Also attempts to remove
	 * all relations to other streams, moving the higher weights down by one.
	 * A "cron job" can later go and delete closed streams. The reason you should avoid deleting streams right away
	 * is that other subscribers may still want to receive the last messages
	 * posted to the stream.
	 * @method close
	 * @param {string} $asUserId The id of the user who would be closing the stream
	 * @param {string} $publisherId The id of the user publishing the stream
	 * @param {string} $streamName The name of the stream
	 * @param {array} [$options=array()] Can include "skipAccess",
	 * @param {boolean} [$options.skipAccess] Don't check access before closing the stream
	 * @param {boolean|array} [$options.unrelate=false] Pass true here, or options that will be passed to Streams::unrelate()
	 * @static
	 */
	static function close($asUserId, $publisherId, $streamName, $options = array())
	{
		if (!isset($asUserId)) {
			$asUserId = Users::loggedInUser();
			if (!$asUserId) $asUserId = "";
		}
		if ($asUserId instanceof Users_User) {
			$asUserId = $asUserId->id;
		}
		
		$stream = new Streams_Stream();
		$stream->publisherId = $publisherId;
		$stream->name = $streamName;
		if (!$stream->retrieve()) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'stream', 
				'criteria' => "{publisherId: '$publisherId', name: '$streamName'}"
			));
		}
		
		// Authorization check
		if (empty($options['skipAccess'])) {
			if ($asUserId !== $publisherId) {
				$stream->calculateAccess($asUserId);
				if (!$stream->testWriteLevel('close')) {
					throw new Users_Exception_NotAuthorized();
				}
			}
		}

		/**
		 * @event Streams/close/$streamType {before}
		 * @param {Streams_Stream} stream
		 * @param {string} asUserId
		 * @return {false} To cancel further processing
		 */
		if (Q::event("Streams/close/{$stream->type}", compact('stream'), 'before') === false) {
			return false;
		}

		// Clean up relations from other streams to this category
		list($relations, $related) = Streams::related(
			$asUserId, 
			$stream->publisherId, 
			$stream->name, 
			true
		);
		foreach ($relations as $r) {
			try {
				Streams::unrelate(
					$asUserId, 
					$r->fromPublisherId, 
					$r->fromStreamName, 
					$r->type, 
					$stream->publisherId, 
					$stream->name,
					isset($options['unrelate']) ? $options['unrelate'] : array()
				);
			} catch (Exception $e) {}
		}

		// Clean up relations from this stream to categories
		list($relations, $related) = Streams::related(
			$asUserId,
			$stream->publisherId,
			$stream->name,
			false
		);
		if (empty($options['unrelate']) or $options['unrelate'] === true) {
			$options['unrelate'] = array(
				'skipAccess' => true
			);
		}
		foreach ($relations as $r) {
			try {
				// ACCESS: remove the "relatedTo" even if we didn't have access
				Streams::unrelate(
					$asUserId, 
					$r->toPublisherId,
					$r->toStreamName,
					$r->type,
					$stream->publisherId,
					$stream->name,
					$options['unrelate']
				);
			} catch (Exception $e) {}
		}

		$result = false;
		try {
			$db = $stream->db();
			$stream->closedTime = $closedTime = 
				$db->toDateTime($db->getCurrentTimestamp());
			if ($stream->save()) {
				$stream->post($asUserId, array(
					'type' => 'Streams/closed',
					'content' => '',
					'instructions' => @compact('closedTime')
				), true);
				$result = true;
			}
		} catch (Exception $e) {
			throw $e;
		}
		/**
		 * @event Streams/close/$streamType {after}
		 * @param {Streams_Stream} stream
		 * @param {string} asUserId
		 * @return {false} To cancel further processing
		 */
		Q::event("Streams/close/{$stream->type}", compact('stream'), 'after');
		return $result;
	}

	/**
	 * Get first and last name out of full name
	 * @method splitFullName
	 * @static
	 * @param {string} $fullName The string representing full name
	 * @return {array} array containing 'first' and 'last' properties
	 */
	static function splitFullName ($fullName) {
		$capitalize = Q_Config::get('Streams', 'inputs', 'fullName', 'capitalize', true);
		$last = null;
		if (strpos($fullName, ',') !== false) {
			list($last, $first) = explode(',', $fullName);
		} else if (strpos($fullName, ' ') !== false) {
			$parts = explode(' ', $fullName);
			if ($capitalize) {
				foreach ($parts as $k => $v) {
					$parts[$k] = Q_Utils::ucfirst($v);
				}
			}
			$last = join(' ', array_slice($parts, 1));
			$first = $parts[0];
		} else {
			$first = $fullName;
			$last = '';
		}
		$first = trim($first);
		$last = trim($last);

		return @compact('first', 'last');
	}
	
	/**
	 * Get a stream of type "Streams/experience" published by the community
	 * @method experience
	 * @static
	 * @param {string} [$experienceId='main']
	 * @return {Streams_Stream}
	 */
	static function experience($experienceId = 'main')
	{
		$communityId = Users::communityId();
		return Streams_Stream::fetch(null, $communityId, "Streams/experience/$experienceId", true);
	}
	/**
	 * Get the url of the stream's icon
	 * @param {object} [$stream] Stream row or Streams_Stream object
	 * @param {string|false} [$basename=null] The last part after the slash, such as "50.png" or "50". Setting it to false skips appending "/basename"
	 * @return {string} The stream's icon url
	 */
	static function iconUrl($stream, $basename = null)
	{
		if (empty($stream->icon)) return '';
		$url = Q_Uri::interpolateUrl($stream->icon, array(
			'publisherId' => Q_Utils::splitId($stream->publisherId)
		));
		$url = (Q_Valid::url($url) or mb_substr($stream->icon, 0, 2) === '{{')
			? $url
			: "{{Streams}}/img/icons/$url";
		$baseUrl = Q_Request::baseUrl();
		$themedUrl = Q_Html::themedUrl($url);
		if ($basename !== false && Q::startsWith($themedUrl, $baseUrl) && !preg_match("/\.\w{2,4}$/", $themedUrl)) {
			if ($basename === null or $basename === true) {
				$basename = '40';
			}
			if (strpos($basename, '.') === false) {
				$basename .= '.png';
			}
			$url .= "/$basename";
			return Q_Html::themedUrl($url);
		}
		return $themedUrl;
	}
	/**
	 * Registers a user. Can be hooked to 'Users/register' before event
	 * so it can override standard functionality.
	 * Method ensures user registration based on full name and also handles registration of
	 * invited user
	 * @method register
	 * @static
	 * @param {array|string} $fullName A string, or an array with keys
	 * @param {string} $fullName.first The first name
	 * @param {string} $fullName.last The last name
	 * @param {string|array} $identifier Can be an email address or mobile number. Or it could be an array of $type => $info
	 * @param {string} [$identifier.identifier] an email address or phone number
	 * @param {array} [$identifier.device] an array with keys
	 *   "deviceId", "platform", "appId", "version", "formFactor"
	 *   to store in the Users_Device table for sending notifications
	 * @param {array} [$identifier.app] an array with "platform" key, and optional "appId"
	 * @param {array|string|true} [$icon=array()] By default, the user icon would be "default".
	 *  But you can pass here an array of basename => filename or basename => url pairs, or a gravatar url to
	 *  download the various sizes from gravatar. 
	 *  You can pass a closure or a string here, referring to a function to call for the icon, such as "b" or "A::b" or an anonymous function () { }
	 *  If $identifier['app']['platform'] is specified, and $icon array is empty, then
	 *  an attempt will be made to download the icon from the user's account on the platform.
	 *  Finally, you can pass true to generate an icon instead of using the default icon.
	 * @param {array} [$options=array()] An array of options to Users::register() and also options that could include:
	 * @param {string} [$options.activation] The key under "Users"/"transactional" config to use for sending an activation message.
	 *   Set to false to skip sending the activation message and automatically set the email or phone number as confirmed.
	 * @param {string} [$options.username] You can use this to set a custom username
	 * @return {Users_User}
	 * @throws {Q_Exception_WrongType} If identifier is not a valid email address or mobile number
	 * @throws {Q_Exception} If identifier was already verified for someone else
	 * @throws {Users_Exception_AlreadyVerified} If user was already verified
	 * @throws {Users_Exception_UsernameExists} If username exists
	 */
	static function register(
		$fullName, 
		$identifier, 
		$icon = true,  
		$options = array())
	{	
		/**
		 * @event Streams/register {before}
		 * @param {string} $fullName
		 * @param {string|array} $identifier
		 * @param {string} $icon
		 * @param {array} $options
		 * @return {Users_User}
		 */
		$return = Q::event('Streams/register', @compact(
			'name', 'fullName', 'identifier', 'icon', 'options'), 'before'
		);
		if (isset($return)) {
			return $return;
		}

		// this will be used in Streams_after_Users_User_saveExecute
		if (is_string($fullName)) {
			$fullName = Streams::splitFullName($fullName);
		}
		Streams::$cache['fullName'] = $fullName ? $fullName : array(
			'first' => '',
			'last' => ''
		);

		$username = Q::ifset($options, 'username', '');
		$user = Users::register($username, $identifier, $icon, $options);

		/**
		 * @event Streams/register {after}
		 * @param {string|array} $identifier
		 * @param {string} $icon
		 * @param {Users_User} $user
		 * @param {Users_User} $options
		 * @return {Users_User}
		 */
		Q::event('Streams/register', @compact(
			'identifier', 'icon', 'user', 'options'
		), 'after');

		return $user;
	}
	
	/**
	 * A convenience method to get the URL of the streams-related action
	 * @method actionUrl
	 * @static
	 * @param {string} $publisherId
	 *	The name of the publisher
	 * @param {string} $name
	 *	The name of the stream
	 * @param {string} $what
	 *	Defaults to 'stream'. Can also be 'message', 'relation', etc.
	 * @return {string} 
	 *	The corresponding URL
	 */
	static function actionUrl($publisherId, $name, $what = 'stream')
	{
		switch ($what) {
			case 'stream':
			case 'message':
			case 'relation':
				$qs = http_build_query(@compact('publisherId', 'name'));
				return Q_Uri::url("Streams/$what?$qs");
		}
		return null;
	}
	
	/**
	 * Look up stream by types and title filter
	 * @method lookup
	 * @static
	 * @param {string} $publisherId
	 *	The id of the publisher whose streams to look through
	 * @param {string|array} $types
	 *	The possible stream type, or an array of types
	 * @param {string} $title
	 *	A string to compare titles by using SQL's "LIKE" statement
	 * @param {boolean} [$orderByTitle=false]
	 *  Put true to order by title, by default it's ordered by 'type,title'
	 */
	static function lookup($publisherId, $types, $title, $orderByTitle=false)
	{
		$fc = $title[0];
		if ($fc === '%' and strlen($title) > 1
		and Q_Config::get('Streams', 'lookup', 'requireTitleIndex', true)) {
			throw new Q_Exception_WrongValue(array(
				'field' => 'title',
				'range' => "something that doesn't start with %"
			));
		}
		$limit = Q_Config::get('Streams', 'lookup', 'limit', 10);
		$where = array(
			'type' => $types,
			'title LIKE ' => $title,
			'closedTime' => null
		);
		if ($publisherId) {
			$where["publisherId"] = $publisherId;
		}
		return Streams_Stream::select()->where($where)->orderBy($orderByTitle ? 'title' : 'type, title')
		->limit($limit)->fetchDbRows();
	}
	
	/**
	 * Get a structured, sorted array with all the interests in a community
	 * @method interests
	 * @static
	 * @param {string} [$communityId=Users::communityId()] the id of the community
	 * @param {boolean} [$skipStreams] - if true skip interests streams, use only from json file
	 * @return {array} an array of $category => ($subcategory =>) $interest
	 */
	static function interests($communityId = null, $skipStreams = false)
	{
		if (!isset($communityId)) {
			$communityId = Users::communityId();
		}
		$tree = new Q_Tree();
		$basename = Q_Text::basename();
		$tree->load("files/Streams/interests/$communityId/$basename.json");
		$interests = $tree->getAll();
		$interestsStreams = array();
		if (!$skipStreams) {
			$interestsStreams = Streams_Stream::select()->where(array(
				"publisherId" => $communityId,
				"type" => "Streams/interest"
			))->fetchDbRows();
		}
		foreach ($interests as $category => &$v1) {
			// add interests from streams
			foreach ($interestsStreams as $interestsStream) {
				$prefix = "Streams/interest/".$category."_";
				if (stripos($interestsStream->name, $prefix) !== 0) {
					continue;
				}
				$interestIndex = preg_replace("/".$category.":\s?/i", "", $interestsStream->title);
				if (!array_key_exists($interestIndex, $v1[""])) {
					$v1[""][$interestIndex] = array();
				}
			}

			foreach ($v1 as $k2 => &$v2) {
				if (!Q::isAssociative($v2)) {
					ksort($v1);
					break;
				}
				ksort($v2);
			}
		}
		return $interests;
	}
	
	static function getExtendClasses($type)
	{
		static $result = array();
		if (isset($result[$type])) {
			return $result[$type];
		}
		$extend = Q_Config::get('Streams', 'types', $type, 'extend', null);
		if (is_string($extend)) {
			$extend = array($extend);
		}
		$classes = array();
		if ($extend) {
			if (!Q::isAssociative($extend)) {
				$temp = array();
				foreach ($extend as $k) {
					$temp[$k] = true;
				}
				$extend = $temp;
			}
			foreach ($extend as $k => $v) {
				if (!class_exists($k, true)) {
					throw new Q_Exception_MissingClass(array(
						'className' => $k
					));
				}
				if (!is_subclass_of($k, 'Db_Row')) {
					throw new Q_Exception_BadValue(array(
						'internal' => "Streams/types/$type/extend",
						'problem' => "$k must extend Db_Row"
					));
				}
				if ($v === true) {
					$v = call_user_func(array('Base_'.$k, 'fieldNames'));
					$v = array_diff($v, array('publisherId', 'streamName', 'name'));
				} else if (Q::isAssociative($v)) {
					$v = array_keys($v);
				}
				$classes[$k] = $v;
			}
		}
		return $result[$type] = $classes;
	}
	
	/**
	 * Use this function to save a template for a specific stream type and publisher.
	 * @method saveTemplate
	 * @static
	 * @param {string} $streamType
	 * @param {string} $publisherId=''
	 * @param {array} [$overrides=array()]
	 * @param {array} [$overrides.readLevel]
	 * @param {array} [$overrides.writeLevel]
	 * @param {array} [$overrides.adminLevel]
	 * @param {array} [$accessLabels=null] Pass labels for which to save access rows.
	 * @param {array} [$accessLevels=array('max','max','max')]
	 *  Pass here the array of readLevel, writeLevel, adminLevel to save in access rows
	 *  (can include strings or numbers, including -1 to not affect the type of access)
	 * @return {Streams_Stream} The template stream
	 */
	static function saveTemplate(
		$streamType,
		$publisherId='',
		$overrides = array(),
		$accessLabels = null,
		$accessLevels = array(40, 40, 40))
	{
		$defaults = Streams_Stream::getConfigField($streamType, 'defaults', Streams_Stream::$DEFAULTS);
		$templateName = $streamType . '/';
		$template = new Streams_Stream();
		$template->publisherId = $publisherId;
		$template->name = $templateName;
		$template->type = "Streams/template";
		$template->retrieve();
		$template->title = $defaults['title'];
		$template->icon = $defaults['icon'];
		$template->readLevel = Q::ifset($overrides, 'readLevel', $defaults['readLevel']);
		$template->writeLevel = Q::ifset($overrides, 'writeLevel', $defaults['writeLevel']);
		$template->adminLevel = Q::ifset($overrides, 'adminLevel', $defaults['adminLevel']);
		$template->save();
		foreach ($accessLabels as $label) {
			$label = Q::interpolate($label, array('app' => Q::app()));
			$access = new Streams_Access();
			$access->publisherId = $publisherId;
			$access->streamName = $templateName;
			$access->ofContactLabel = $label;
			$access->retrieve();
			$access->readLevel = $numeric = Streams_Stream::numericReadLevel($accessLevels[0]);
			$access->writeLevel = Streams_Stream::numericWriteLevel($accessLevels[1]);
			$access->adminLevel = Streams_Stream::numericAdminLevel($accessLevels[2]);
			$access->save();
		}
		return $template;
	}
	
	/**
	 * Use this function to save mutable access for a specific stream type and publisher.
	 * @method saveMutable
	 * @static
	 * @param {string} $streamType
	 * @param {string} $publisherId=''
	 * @param {array} [$accessLabels=null] Pass labels for which to save access rows.
	 *    Otherwise we try to look in Streams/types/$streamType/admins
	 * @param {array} [$accessLevels=array('max','max','max')]
	 *  Pass here the array of readLevel, writeLevel, adminLevel to save in access rows
	 *  (can include strings or numbers, including -1 to not affect the type of access)
	 * @return {Streams_Stream} The template stream
	 */
	static function saveMutable(
		$streamType,
		$publisherId='',
		$accessLabels = null,
		$accessLevels = array(40, 40, 40))
	{
		if (!isset($accessLabels)) {
			$accessLabels = Streams_Stream::getConfigField($streamType, 'admins', array());
		}
		foreach ($accessLabels as $label) {
			$label = Q::interpolate($label, array('app' => Q::app()));
			$access = new Streams_Access();
			$access->publisherId = $publisherId;
			$access->streamName = $streamType . '*';
			$access->ofContactLabel = $label;
			$access->retrieve();
			$access->readLevel = $numeric = Streams_Stream::numericReadLevel($accessLevels[0]);
			$access->writeLevel = Streams_Stream::numericWriteLevel($accessLevels[1]);
			$access->adminLevel = Streams_Stream::numericAdminLevel($accessLevels[2]);
			$access->save();
		}
		return $access;
	}
	
	static function getExtendFieldNames($type, $asOwner = true)
	{
		$classes = Streams::getExtendClasses($type);
		$fieldNames = array('title', 'icon', 'content', 'attributes');
		if ($asOwner) {
			$fieldNames = array_merge($fieldNames, array(
				'readLevel', 'writeLevel', 'adminLevel', 'inheritAccess', 'closedTime'
			));
		}
		foreach ($classes as $k => $v) {
			foreach ($v as $f) {
				$fieldNames[] = $f;
			}
		}
		return $fieldNames;
	}
	
	static function inviteUrl ($token) {
		$baseUrl = Q_Config::get(array('Streams', 'invites', 'baseUrl'), "i");
		return Q_Html::themedUrl("$baseUrl/$token");
	}
	
	static function invitationsPath($invitingUserId)
	{
		$app = Q::app();
		$subpath = Q_Config::get(
			'Streams', 'invites', 'subpath',
			'{{app}}/uploads/Streams/invitations'
		);
		return APP_FILES_DIR
			.DS.Q::interpolate($subpath, @compact('app'))
			.DS.Q_Utils::splitId($invitingUserId);
	}
	
	/**
	 * Use this function to merge all the files under Streams/userStreams config,
	 * and get a descriptions of all potential user streams, indexed by their name
	 * @method userStreamsTree
	 * @static
	 * 
	 */
	static function userStreamsTree()
	{
		$p = new Q_Tree();
		$arr = Q_Config::get('Streams', 'userStreams', array());
		$app = Q::app();
		foreach ($arr as $k => $v) {
			$PREFIX = ($k === $app ? 'APP' : strtoupper($k).'_PLUGIN');
			$path = constant( $PREFIX . '_CONFIG_DIR' );
			$p->load($path.DS.$v);
		}
		return $p;
	}
	
	/**
	 * Generate an invite URL that can be transmitted by QR codes or NFC tags,
	 * containing additional querystring fields such as "u" (userId), "e" (expires)
	 * and "s" which is a signature truncated to have length specified in config
	 * Streams/userInviteUrl/signature/length.
	 * The "sig" may be missing if the Q/internal/secret config is empty.
	 * @param {string} $userId The id of the user for whom to generate this url
	 * @param {string} $appUrl The url to bring the user to
	 * @param {string} [$streamName=null] Optional stream
	 * @param {Streams_Invite} [&$invite=null] You can pass a variable reference here
	 *  to be filled with the Streams_Invite object.
	 * @return {string}
	 */
	static function userInviteUrl(
		$userId, 
		$appUrl, 
		$streamName = 'Streams/user/profile',
		&$invite = null)
	{
		$expires = time() + Q_Config::get('Streams', 'invites', 'expires', 86400);
		$fields = array(
			'u' => $userId,
			'e' => $expires
		);
		$len = Q_Config::get('Streams', 'invites', 'signature', 'length', 10);
		$fields = Q_Utils::sign($fields, array('s'));
		if (!empty($fields['s'])) {
			$fields['s'] = substr($fields['s'], 0, $len);
		}
		$streamName = 'Streams/user/profile';
		$stream = Streams_Stream::fetch($userId, $userId, $streamName);
		$now = time();
		if (!$stream) {
			$stream = Streams::create($userId, $userId, 'Streams/user/profile', array(
				'name' => $streamName
			));
		}
		if ($stream->getAttribute('userInviteExpires', 0) < $now) {
			$ret = $stream->invite(array('token' => true, 'appUrl' => $appUrl));
			$invite = $ret['invite'];
			$userInviteUrl = $ret['url'];
			$stream->setAttribute('userInviteUrl', $userInviteUrl);
			$stream->setAttribute('userInviteExpires', $expires);
			$stream->changed();
		} else {
			$userInviteUrl = $stream->getAttribute('userInviteUrl');
		}
		return $userInviteUrl . '?' . http_build_query($fields, '', '&');
	}
	
	protected static function afterFetchExtended($publisherId, $streams)
	{
		if (!$streams) return;
		$classes = array();
		$rows = array();
		$streamNamesByType = array();
		foreach ($streams as $stream) {
			if (!$stream) continue;
			$streamNamesByType[$stream->type][] = $stream->name;
		}
		$classes = array();
		foreach ($streams as $stream) {
			if (!$stream) continue;
			$type = $stream->type;
			if (!isset($classes[$type])) {
				$classes[$type] = Streams::getExtendClasses($type);
				foreach ($classes[$type] as $className => $fieldNames) {
					$rows[$className] = call_user_func(array($className, 'select'))
						->where(array(
							'publisherId' => $publisherId,
							'streamName' => $streamNamesByType[$type]
						))->fetchDbRows(null, '', 'streamName');
				}
			}
		}
		foreach ($streams as $stream) {
			if (!$stream) continue;
			$streamName = $stream->name;
			foreach ($classes[$stream->type] as $className => $fieldNames) {
				if (empty($rows[$className][$streamName])) continue;
				foreach ($fieldNames as $f) {
					if (!isset($rows[$className][$streamName])) continue;
					$stream->$f = $rows[$className][$streamName]->$f;
				}
				$stream->wasModified(false);
				$row = $stream->rows[$className] = $rows[$className][$streamName];
				$row->set('Streams_Stream', $stream);
				$stream->set($className, $row);
			}
		}
	}
	
	private static function messageTotals($publisherId, $name, $options, $streams)
	{
		if (empty($options['withMessageTotals'])) {
			return $streams;
		}
		$infoForTotals = array();
		if (isset($options['withMessageTotals']['*'])) {
			$trows = Streams_MessageTotal::select()->where(array(
				'publisherId' => $publisherId,
				'streamName' => $name,
				'messageType' => $options['withMessageTotals']['*']
			))->fetchDbRows();
			unset($options['withMessageTotals']['*']);
		} else {
			$trows = array();
		}
		foreach ($options['withMessageTotals'] as $n => $mt) {
			if (!$mt) {
				continue;
			}
			if (!is_array($mt)) {
				$mt = array($mt);
			}
			ksort($mt);
			$frows = Streams_MessageTotal::select()->where(array(
				'publisherId' => $publisherId,
				'streamName' => $n,
				'messageType' => $mt
			))->fetchDbRows();
			$trows = array_merge($trows, $frows);
		}
		foreach ($streams as $s) {
			if (!$s->testReadLevel('messages')) {
				continue;
			}
			$messageTotals = array();
			foreach ($trows as $row) {
				if ($row->streamName === $s->name) {
					$messageTotals[$row->messageType] = $row->messageCount;
				}
			}
			$s->set('messageTotals', $messageTotals);
		}
		return $streams;
	}

	/**
	 * Get info about relations TO streams
	 * @method relatedToTotals
	 * @static
	 * @param {string} $publisherId Stream publisher id
	 * @param {string|array} $name Stream name or array of names
	 * @param {array} $options Can be:
	 *	 array('withRelatedToTotals' => array('streamName' => true)) for all rows
	 *	 array('withRelatedToTotals' => array('streamName' => array('relationType', ...))) for particular rows
	 * @return {array} Returns array('relationType_1' => array('fromStreamType' => relationCount), 'relationType_2' => ...)
	*/
	private static function relatedToTotals($publisherId, $name, $options, $streams)
	{
		$options = Q::ifset($options, 'withRelatedToTotals', null);
		if (empty($options) || !is_array($options)) {
			return $streams;
		}

		$infoForTotals = array();
		if ($options === true){
			$trows = Streams_RelatedToTotal::select()->where(array(
				'toPublisherId' => $publisherId,
				'toStreamName' => $name
			))->fetchDbRows();
		} elseif (isset($options['*'])) {
			$trows = Streams_RelatedToTotal::select()->where(array(
				'toPublisherId' => $publisherId,
				'toStreamName' => $name,
				'relationType' => $options['*']
			))->fetchDbRows();
			unset($options['*']);
		} else {
			$trows = array();
		}
		foreach ($options as $n => $mt) {
			if (!$mt) {
				continue;
			}
			if (!is_array($mt)) {
				$mt = array($mt);
			}
			ksort($mt);
			if ($mt === array(true)) { // all relations
				$frows = Streams_RelatedToTotal::select()->where(array(
					'toPublisherId' => $publisherId,
					'toStreamName' => $n
				))->fetchDbRows();
			} else { // particular relations
				$frows = Streams_RelatedToTotal::select()->where(array(
					'toPublisherId' => $publisherId,
					'toStreamName' => $n,
					'relationType' => $mt
				))->fetchDbRows();
			}
			$trows = array_merge($trows, $frows);
		}

		foreach ($streams as $s) {
			if (!$s->testReadLevel('relations')) {
				continue;
			}
			$relatedToTotals = array();
			foreach ($trows as $row) {
				if ($row->toStreamName !== $s->name) {
					continue;
				}

				$relatedToTotals[$row->relationType][$row->fromStreamType] = $row->relationCount;
			}
			$s->set('relatedToTotals', $relatedToTotals);
		}
		return $streams;
	}

	/**
	 * Get info about relations FROM streams
	 * @method relatedFromTotals
	 * @static
	 * @param {string} $publisherId Stream publisher id
	 * @param {array} $options Can be:
	 *	 array('withRelatedFromTotals' => array('streamName' => true)) for all rows
	 *	 array('withRelatedFromTotals' => array('streamName' => array('relationType', ...))) for particular rows
	 * @return {array} Returns array('relationType_1' => array('fromStreamType' => relationCount), 'relationType_2' => ...)
	*/
	private static function relatedFromTotals($publisherId, $name, $options, $streams)
	{
		$options = Q::ifset($options, 'withRelatedFromTotals', null);
		if (empty($options) || !is_array($options)) {
			return $streams;
		}

		$infoForTotals = array();
		if ($options === true){
			$trows = Streams_RelatedFromTotal::select()->where(array(
				'fromPublisherId' => $publisherId,
				'fromStreamName' => $name
			))->fetchDbRows();
		} elseif (isset($options['*'])) {
			$trows = Streams_RelatedFromTotal::select()->where(array(
				'fromPublisherId' => $publisherId,
				'fromStreamName' => $name,
				'relationType' => $options['*']
			))->fetchDbRows();
			unset($options['*']);
		} else {
			$trows = array();
		}
		foreach ($options as $n => $mt) {
			if (!$mt) {
				continue;
			}
			if (!is_array($mt)) {
				$mt = array($mt);
			}
			ksort($mt);
			if ($mt === array(true)) { // all relations
				$frows = Streams_RelatedFromTotal::select()->where(array(
					'fromPublisherId' => $publisherId,
					'fromStreamName' => $n
				))->fetchDbRows();
			} else { // particular relations
				$frows = Streams_RelatedFromTotal::select()->where(array(
					'fromPublisherId' => $publisherId,
					'fromStreamName' => $n,
					'relationType' => $mt
				))->fetchDbRows();
			}
			$trows = array_merge($trows, $frows);
		}

		foreach ($streams as $s) {
			if (!$s->testReadLevel('relations')) {
				continue;
			}
			$relatedFromTotals = array();
			foreach ($trows as $row) {
				if ($row->fromStreamName !== $s->name) {
					continue;
				}

				$relatedFromTotals[$row->relationType][$row->toStreamType] = $row->relationCount;
			}
			$s->set('relatedFromTotals', $relatedFromTotals);
		}
		return $streams;
	}
	/**
	 * Get or create interest stream
	 * @method getInterest
	 * @static
	 * @param {string} $title Stream title which will convert to stream name
	 * @param {string} $publisherId If null, set to main community id Users::communityId()
	 * @return {Streams_Stream}
	 */
	static function getInterest ($title, $publisherId = null) {
		$streamName = 'Streams/interest/' . Q_Utils::normalize(str_replace(array("'", '"'), '', trim($title)));
		$publisherId = $publisherId ?: Users::communityId();

		$stream = Streams_Stream::fetch(null, $publisherId, $streamName);
		if (!$stream) {
			$parts = array_map('trim', explode(":", $title));
			if (sizeof($parts) > 1) {
				$title = $parts[0].": ".$parts[1];
			}

			// Check if interest in the list of interests defined in app by file files/Streams/interests/<communityId>/en.json and allow to create this stream for common user
			// doesn't listed interests can be created by admins
			$tree = new Q_Tree();
			$tree->load("files/Streams/interests/".Users::communityId()."/".Q_Text::basename().".json");
			$interests = $tree->getAll();
			$arr = Q::ifset($interests, $parts[0], array());
			$skipAccess = false;
			foreach ($arr as $section => $list) {
				$c = isset($section[0]) ? $section[0] : '';
				if ($c === '@' or $c === '#') {
					continue;
				}
				if (isset($list[$parts[1]])) {
					$skipAccess = true;
					break;
				}
			}
			$stream = Streams::create(null, $publisherId, 'Streams/interest', array(
				'name' => $streamName,
				'title' => $title,
				'skipAccess' => $skipAccess
			));
			if (is_dir(APP_WEB_DIR.DS."plugins".DS."Streams".DS."img".DS."icons".DS.$streamName)) {
				$stream->icon = $streamName;
			} else {
				// if char colon exists, remove from title colon and all before
				if (strstr($title, ':')) {
					$title = preg_replace("/.+:\s*/", '', $title);
				}
				$keywords = explode(' ', $title);
				$data = null;
				while (sizeof($keywords)) {
					$subpath = "Streams/interest/".strtolower(implode("_", $keywords));
					if (is_dir(STREAMS_PLUGIN_FILES_DIR.DS."Streams".DS."icons".DS.$subpath)) {
						$stream->icon = $subpath;
						break;
					}

					try {
						$data = Q_Image::pixabay(strtolower(implode(" ", $keywords)), array(
							'orientation' => 'horizontal',
							'min_width' => '500',
							'safesearch' => 'true',
							'image_type' => 'photo'
						), true);
					} catch (Exception $e) {
						Q::log("Exception during Streams/interest post: " . $e->getMessage());
						$data = null;
					}
					if (empty($data)) {
						array_pop($keywords);
					} else {
						break;
					}
				}
				if ($data) {
					$params = array(
						'data' => $data,
						'path' => "{{Streams}}/img/icons",
						'subpath' => $subpath,
						'save' => 'Streams/interest',
						'skipAccess' => true
					);
					Q_Image::save($params);
					$stream->icon = $subpath;
				}
			}
			$stream->save();
		}

		return $stream;
	}

	/**
	 * Get the directory to upload files into, for a stream.
	 * @method uploadsDirectory
	 * @param {string} $publisherId
	 * @param {string} $streamName
	 * @return {string}
	 */
	static function uploadsDirectory($publisherId, $streamName)
	{
		$splitId = Q_Utils::splitId($publisherId);
		$sn = implode(DS, explode('/', $streamName));
		$path = APP_WEB_DIR . DS . 'Q' . DS . 'uploads' . DS . 'Streams';
		if ($realpath = realpath($path)) {
			$path = $realpath;
		}
		$subpath = $splitId . DS . $sn;
		return $path . DS . $subpath;
	}

	/**
	 * Get the directory to import the icon into, for a stream.
	 * Use this with Users::importIcon().
	 * @param {string} $publisherId
	 * @param {string} $streamName
	 * @param {string} [$extra] You can pass time() here or something,
	 *  if you don't want to overwrite old values. It will append to the directory path.
	 * @return {string}
	 */
	static function iconDirectory($publisherId, $streamName, $extra = null)
	{
		$splitId = Q_Utils::splitId($publisherId);
		$sn = implode(DS, explode('/', $streamName));
		$path = APP_WEB_DIR . DS . 'Q' . DS . 'uploads' . DS . 'Streams';
		if ($realpath = realpath($path)) {
			$path = $realpath;
		}
		$subpath = $splitId . DS . $sn . DS . 'icon';
		if ($extra) {
			$subpath .= DS . $extra;
		}
		return $path . DS . $subpath;
	}
	/**
	 * Remove streams from the system, including all related rows.
	 * @method remove
	 * @static
	 * @param {string} $publisherId
	 * @param {string|array} $streamNames
	 */
	static function remove($publisherId, $streamNames)
	{
		if (is_string($streamNames)) {
			$streamNames = array($streamNames);
		}

		$params = @compact('publisherId', 'streamNames');
		
		/**
		 * @event Streams/remove {before}
		 * @param {string} $publisherId
		 * @param {string} $streamNames
		 */
		Q::event("Streams/remove", $params, 'before');

		$db = self::db();
		$fieldsRelatedToStreams = array(
			array("publisherId", "streamName"),
			array("toPublisherId", "toStreamName"),
			array("fromPublisherId", "fromStreamName")
		);
		$tables = $db->rawQuery('SHOW TABLES')->fetchAll();
		foreach ($tables as $table) {
			$tableName = $table[0];
			$fields = $db->rawQuery("SHOW COLUMNS FROM ".$tableName)->execute()->fetchAll(PDO::FETCH_ASSOC);
			foreach ($fieldsRelatedToStreams as $fieldsRelatedToStream) {
				$matchAmount = 0;
				foreach ($fields as $field) {
					$fieldName = $field["Field"];
					if (!in_array($fieldName, $fieldsRelatedToStream)) {
						continue;
					}

					$matchAmount++;
				}

				if ($matchAmount == count($fieldsRelatedToStream)) {
					$query = "delete from ".$tableName." where ".$fieldsRelatedToStream[0]."='".$publisherId."' and ".$fieldsRelatedToStream[1]." in ('".implode("','", $streamNames)."')";
					$db->rawQuery($query)->execute();
				}
			}
		}

		Streams_Stream::delete()
			->where(array('publisherId' => $publisherId, 'name' => $streamNames))
			->execute();
		
		/**
		 * @event Streams/remove {after}
		 * @param {string} $publisherId
		 * @param {string} $streamNames
		 */
		Q::event("Streams/remove", $params, 'after');
	}

	/**
	 * Converts the publisherId and the first 24 characters of
	 * an ID that is typically used as the final segment in a streamName
	 * to a hex string starting with "0x" representing a uint256 type.
	 * Both inputs are padded by 0's on the right in the hex string.
	 * For example Streams::toHexString("abc", "def") returns
	 * 0x6162630000000000646566000000000000000000000000000000000000000000
	 * while Streams::toHexString("abc/123", "def") returns
	 * 0x616263000000007b646566000000000000000000000000000000000000000000
	 * @param {string} $publisherId Takes the first 8 ASCII characters
	 * @param {string|integer} $streamId Takes the first 24 ASCII characters, or an unsigned integer up to PHP_INT_MAX
	 *  If the $streamId contains a slash, then the first part is interpreted as an unsigned integer up to 255,
	 *  and determines the 15th and 16th hexit in the string. This is typically used for "seriesId" under a publisher.
	 * @param {boolean} [$isNotNumeric=null] Set to true to encode $streamId as an ASCII string, even if it is numeric
	 * @return {string} A hex string starting with "0x..." followed by 16 hexits and then 48 hexits.
	 */
	static function toHexString($publisherId, $streamId, $isNotNumeric = null)
	{
		$parts = explode('/', $publisherId);
		$seriesId = null;
		$publisherHex = Q_Utils::asc2hex(substr($publisherId, 0, 8));
		$hexFirstPart = str_pad($publisherHex, 16, '0', STR_PAD_RIGHT);
		if (count($parts) > 1) {
			list($publisherId, $seriesId) = $parts;
			if ($seriesId > 255 || $seriesId < 0
			|| floor($seriesId) != $seriesId) {
				throw new Q_Exception_WrongValue(array(
					'field' => 'seriesId',
					'range' => 'integer 0-255'
				));
			}
			$hexFirstPart = substr($hexFirstPart, 0, 14)
				. str_pad(dechex($seriesId), 2, '0', STR_PAD_LEFT);
		}
		if (!$isNotNumeric and is_numeric($streamId)) {
			$streamHex = dechex($streamId);
			$pad = STR_PAD_LEFT;
		} else {
			$streamHex = Q_Utils::asc2hex(substr($streamId, 0, 24));
			$pad = STR_PAD_RIGHT;
		}
		$hexSecondPart = str_pad($streamHex, 48, '0', $pad);
		return "0x$hexFirstPart$hexSecondPart";
	}

	/**
	 * Converts a string previously generated with toHexString
	 * back to the publisherId and up to the first 16 characters
	 * of the streamId.
	 * @param {string} $hexString Should start with "0x"
	 * @param {bool} [$hasSeriesId=false] Set to true if it was produced with a seriesId,
	 *  so publisherId will be recovered in the form "abcdefg/123".
	 *  Note that it will be missing the last letter of the true publisherId,
	 *  so you may have to use a Db_Range when using it in database queries.
	 * @param {boolean} [$urlencoded] Whether to return a urlencoded string,
	 *  to handle leading zeros in the string
	 * @return {array} Assign to list($publisherId, $streamIdPrefix)
	 */
	static function fromHexString(
		$hexString, 
		$hasSeriesId = false, 
		$urlencoded = false
	) {
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
		$streamIdPrefix = $urlencoded 
			? Q_Utils::hex2urlencoded($streamHex)
			: Q_Utils::hex2asc($streamHex);
		if ($hasSeriesId) {
			$publisherId = "$publisherId/$seriesId";
		}
		return array($publisherId, $streamIdPrefix);
	}

	/**
	 * Call this method to update names of one or more streams.
	 * This should update them in many tables of the Streams plugin.
	 * Also, other plugins can add a hook to create their own updates.
	 * @method updateStreamNames
	 * @static
	 * @param {string} $publisherId
	 * @param {array} $updates pairs of (oldStreamName => newStreamName)
	 * @param {boolean} [$accumulateErrors=false] set to true to keep going
	 *  even if an update fails, accumulating errors
	 * @return {array} any errors that have accumulated, if accumulateErrors is true, otherwise empty array
	 */
	static function updateStreamNames($publisherId, array $updates, $accumulateErrors = false)
	{
		$chunkSize = 100;
		$chunks = array_chunk($updates, $chunkSize, true);
		$transactionKey = Q_Utils::randomString(10);
		$errors = array();
		Streams_Stream::begin(null, $transactionKey)->execute();
		// can be rolled back on any exception
		$fields = array(
			'Streams' => array(
				'Stream' => 'name',
				'Message' => 'streamName',
				'MessageTotal' => 'streamName',
				'RelatedTo' => array('toStreamName', 'fromStreamName'),
				'RelatedToTotal' => 'toStreamName',
				'RelatedFrom' => array('toStreamName', 'fromStreamName'),
				'RelatedFromTotal' => 'fromStreamName',
				'Participant' => 'streamName',
				'Subscription' => 'streamName',
				'SubscriptionRule' => 'streamName',
				'Notification' => 'streamName',
				'Request' => 'streamName',
				'Invite' => 'streamName',
				'Task' => 'streamName'
			)
		);
		$publisherIdFields = array(
			'Streams' => array(
				'RelatedTo' => array('toPublisherId', 'fromPublisherId'),
				'RelatedToTotal' => array('toPublisherId'),
				'RelatedFrom' => array('toPublisherId', 'fromPublisherId'),
				'RelatedFromTotal' => array('fromPublisherId')
			)
		);
		foreach ($fields as $Connection => $f1) {
			foreach ($f1 as $Table => $fields) {
				if (!is_array($fields)) {
					$fields = array($fields);
				}
				$ClassName = $Connection . '_' . $Table;
				foreach ($fields as $i => $field) {
					$publisherIdField = Q::ifset($publisherIdFields, $Connection, $Table, $i, 'publisherId');
					foreach ($chunks as $chunk) {
						$criteria = array($field => array_keys($chunk));
						if (isset($publisherId)) {
							$criteria[$publisherIdField] = $publisherId;
						}
						try {
							call_user_func(array($ClassName, 'update'))
							->set(array($field => $chunk))
							->where($criteria)
							->execute();
						} catch (Exception $e) {
							if ($accumulateErrors) {
								$errors[] = $e;
							} else {
								throw $e;
							}
						}
					}
				}
			}
		}
		$params = compact('publisherId', 'updates', 'accumulateErrors', 'chunks', 'fields', 'publisherIdFields');
		$params['errors'] =& $errors;
		/**
		 * Gives any plugin or app a chance to update stream names in its own tables
		 * @event Streams/updateStreamNames
		 * @param {array} $publisherId
		 * @param {array} $updates an array of (oldStreamName => newStreamName) pairs
		 * @param {boolean} [$accumulateErrors=false] if true, accumulate errors and keep going
		 * @param {boolean} [$errors=array()] reference to an array to push errors here
		 */
		Q::event('Streams/updateStreamNames', $params, 'after');
		Streams_Stream::commit($transactionKey)->execute();
		return $errors;
	}

	/**
	 * @property $fetch
	 * @static
	 * @type array
	 * @protected
	 */
	protected static $fetch = array();
	/**
	 * @property $cache
	 * @static
	 * @type array
	 */
	static $cache = array();
	/**
	 * @property $followedInvite
	 * @type Streams_Invite
	 */
	static $followedInvite = null;
	/**
	 * @property $requestedPublisherId_override
	 * @static
	 * @type string
	 */
	static $requestedPublisherId_override = null;
	/**
	 * @property $requestedName_override
	 * @static
	 * @type string
	 */
	static $requestedName_override = null;
	static $beingSaved = null;
	static $beingSavedQuery = null;
	static $arePublic = array();
	/**
	 * You can set this to true to prevent caching for a while,
	 * e.g. during installer scripts, but make sure to set it back to false when done.
	 * @property $dontCache
	 * @static
	 * @type string
	 */
	static $dontCache = false;
};

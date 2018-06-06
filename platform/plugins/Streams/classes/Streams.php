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
	 * @property WRITE_LEVEL['vote']
	 * @type integer
	 * @default 13
	 * @final
	 */
	/**
	 * Can post messages, but manager must approve
	 * @property $WRITE_LEVEL['postPending']
	 * @type integer
	 * @default 15
	 * @final
	 */
	/**
	 * Can post messages which appear immediately
	 * @property $WRITE_LEVEL['post']
	 * @type integer
	 * @default 20
	 * @final
	 */
	/**
	 * Can post messages relating other streams to this one
	 * @property WRITE_LEVEL['relate']
	 * @type integer
	 * @default 23
	 * @final
	 */
	/**
	 * Can update properties of relations directly
	 * @property WRITE_LEVEL['relations']
	 * @type integer
	 * @default 25
	 * @final
	 */
	/**
	 * Can post messages requesting edits of stream
	 * @property $WRITE_LEVEL['suggest']
	 * @type integer
	 * @default 28
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
		'postPending' => 18,
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
	 *  @param {boolean} [$options.refetch] Ignore cache of previous calls to fetch, 
	 *   and save a new cache if necessary.
	 *  @param {boolean} [$options.dontCache] Do not cache the results of
	 *   fetching the streams
	 *  @param {boolean} [$options.withParticipant=false]
	 *   Additionally call ->set('participant', $p) on the stream objects,
	 *   with the participant object corresponding to $asUserId, if any.
	 *  @param {array} [$options.withTotals]
	 *   Pass an array of ($streamName => $messageTypes) here
	 *   to additionally call ->set('totals', $t) on the stream objects.
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
		$options = array())
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
		$allCached = array();
		if (empty($options['refetch']) and (is_array($name) or is_string($name))) {
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
		if ($fields === '*') {
			$fields = join(',', Streams_Stream::fieldNames());
		}
		$criteria = array(
			'publisherId' => $publisherId,
			'name' => $namesToFetch
		);

		// Get streams and set their default access info
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
			foreach ($allRetrieved as $s) {
				$s->set('participant', Q::ifset($prows, $s->name, null));
			}
		}

		$streams = $allCached ? array_merge($allCached, $allRetrieved) : $allRetrieved;

		Streams::calculateAccess($asUserId, $publisherId, $streams, false);
		
		if (!empty($options['withTotals'])) {
			$infoForTotals = array();
			if (isset($options['withTotals']['*'])) {
				$trows = Streams_Total::select()->where(array(
					'publisherId' => $publisherId,
					'streamName' => $name,
					'messageType' => $options['withTotals']['*']
				))->fetchDbRows();
				unset($options['withTotals']['*']);
			} else {
				$trows = array();
			}
			foreach ($options['withTotals'] as $n => $mt) {
				if (!$mt) {
					continue;
				}
				if (!is_array($mt)) {
					$mt = array($mt);
				}
				ksort($mt);
				$j = json_encode($mt);
				$infoForTotals[$j] = array($n, $mt);
			}
			foreach ($infoForTotals as $info) {
				$frows = Streams_Total::select()->where(array(
					'publisherId' => $publisherId,
					'streamName' => $info[0],
					'messageType' => $info[1]
				))->fetchDbRows();
				$trows = array_merge($trows, $frows);
			}
			foreach ($streams as $s) {
				if (!$s->testReadLevel('messages')) {
					return;
				}
				$totals = array();
				foreach ($trows as $row) {
					if ($row->streamName === $s->name) {
						$totals[$row->messageType] = $row->messageCount;
					}
				}
				$s->set('totals', $totals);
			}
		}

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
			 * @param {array} options
			 */
			Q::event("Streams/fetch/$type", $params, 'after', false, $streams);
		}

		if (!self::$dontCache and empty($options['dontCache'])) {
			foreach ($streams as $n => $stream) {
				self::$fetch[$asUserId][$publisherId][$n][$fields] = $stream;
			}
		}
		return $streams;
	}
	
	/**
	 * Fetches one stream from the database.
	 * @method fetchOne
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
	 *  @param {boolean} [$options.refetch] Ignore cache of previous calls to fetch, 
	 *   and save a new cache if necessary.
	 *  @param {boolean} [$options.dontCache] Do not cache the results of
	 *   fetching the streams
	 *  @param {boolean} [$options.withParticipant] Additionally call ->set('participant', $p)
	 *   on the stream object, with the participant object corresponding to $asUserId, if any.
	 *  @param {array} [$options.withTotals]
	 *   Pass an array of arrays ($streamName => $messageTypes) here
	 *   to additionally call ->set('totals', $t) on the stream objects.
	 * @return {Streams_Stream|null}
	 *  Returns a Streams_Stream object with access info calculated
	 *  specifically for $asUserId . Make sure to call the methods 
	 *  testReadLevel(), testWriteLevel() and testAdminLevel()
	 *  on these streams before using them on the user's behalf.
	 */
	static function fetchOne(
		$asUserId,
		$publisherId,
		$name,
		$fields = '*',
		$options = array())
	{
		$options['limit'] = 1;
		$throwIfMissing = false;
		if ($fields === true) {
			$throwIfMissing = true;
			$fields = '*';
		}
		$streams = Streams::fetch($asUserId, $publisherId, $name, $fields, $options);
		if (empty($streams)) {
			if ($throwIfMissing) {
				throw new Q_Exception_MissingRow(array(
					'table' => 'Stream', 
					'criteria' => Q::json_encode(compact('publisherId', 'name'))
				));
			}
			return null;
		}
		return reset($streams);
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
	 *  Pass true here to force recalculating access to streams for which access was already calculated
	 * @param {string} [$actualPublisherId=null]
	 *  For internal use only. Used by Streams::isAuthorizedToCreate function.
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
			$contacts = Users_Contact::select()
				->where(array(
					'userId' => $actualPublisherId,
					'label' => $labels,
					'contactUserId' => $asUserId
				))->fetchDbRows();
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
				Streams::fetch($asUserId, $publisherId, $streamNames);
			}
			// this will now use the cached results of the above calls to Streams::fetch
			foreach ($streams4 as $s) {
				$s->inheritAccess(); 
			}
		}
		
		return count($streams2);
	}
	
	/**
	 * Calculates whether a given user is authorized by a specific publisher
	 * to create a particular type of stream.
	 * @method isAuthorizedToCreate
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
	static function isAuthorizedToCreate(
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
			$to_stream = Streams::fetchOne(
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
			$p = Streams::userStreamsTree();
			if ($info = $p->get($fields['name'], array())) {
				foreach (Base_Streams_Stream::fieldNames() as $f) {
					if (isset($info[$f])) {
						$stream->$f = $info[$f];
					}
				}
			}
		}
		if (!isset($stream->type)) {
			$stream->type = $type;
		}
		$authorized = self::isAuthorizedToCreate(
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
		if (!empty($relate['streamName'])) {
			$rs = Streams::fetchOne(
				$asUserId,
				$relate['publisherId'],
				$relate['streamName']
			);
			$inheritAccess = ($rs and $rs->inheritAccess)
				? Q::json_decode($rs->inheritAccess)
				: array();
			$newInheritAccess = array($relate['publisherId'], $relate['streamName']);
			if (!in_array($newInheritAccess, $inheritAccess)) {
				$inheritAccess[] = $newInheritAccess;
			}
			$stream->inheritAccess = Q::json_encode($inheritAccess);
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
	 * @return {string}
	 *  The name of the stream
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
				$result = implode('/', $result);
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
		if ($throwIfMissing && !is_string($name)) {
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
	 * @param {array} $streams=null
	 *  An array of streams fetched for this user.
	 *  If it is null, we fetch them as the logged-in user.
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
		return $avatar ? $avatar->displayName($options, $fallback) : $fallback;
	}

	/**
	 * Updates the publisher's avatar, as it appears to $toUserId
	 * This function should be called during events that may cause the
	 * publisher's avatar to change appearance for certain users viewing it.
	 * These are usually rare events, and include things like:<br/>
	 *   adding, removing or modifying a contact
	 * @method updateAvatar
	 * @static
	 * @param {integer} $toUserId
	 *  id of the user who will be viewing this avatar
	 * @param {string} $publisherId
	 *  id of the publisher whose avatar to update
	 * @return {boolean}
	 */
	static function updateAvatar($toUserId, $publisherId)
	{
		$user = new Users_User();
		$user->id = $publisherId;
		if (!$user->retrieve(null, null, true)->ignoreCache()->resume()) {
			return false;
		}

		// Fetch some streams as the contact user
		$streams = Streams::fetch($toUserId, $publisherId, array(
			'Streams/user/firstName', 'Streams/user/lastName'
		));
		$firstName = Streams::take($streams, 'Streams/user/firstName', 'content');
		$lastName = Streams::take($streams, 'Streams/user/lastName', 'content');

		// Update the Streams_avatar table
		Streams_Avatar::update()->set(array(
			'firstName' => $firstName,
			'lastName' => $lastName,
			'username' => $user->username,
			'icon' => $user->icon
		))->where(array(
			'toUserId' => $toUserId,
			'publisherId' => $publisherId
		))->execute();

		return true;
	}

	/**
	 * Updates the publisher's avatars, which may have changed with the taintedAccess.
	 * This function should be called during rare events that may cause the
	 * publisher's avatar to change appearance for certain users viewing it.<br/>
	 *
	 * You should rarely have to call this function. It is used internally by the model,
	 * in two main situations:
	 *
	 * 1)  adding, removing or modifying a Streams_Access row for Streams/user/firstName or Streams/user/lastName
	 *	In this case, the function is able to update exactly the avatars that need updating.
	 * 
	 * 2) adding, removing or modifying a Stream row for Streams/user/firstName or Streams/user/lastName
	 *	In this case, there may be some avatars which this function will miss.
	 *	These correspond to users which are reachable by the access array for one stream,
	 *	but not the other. For example, if Streams/user/firstName is being updated, but
	 *	a particular user is reachable only by the access array for Streams/user/lastName, then
	 *	their avatar will not be updated and contain a stale value for firstName.
	 *	To fix this, the Streams_Stream model passes true in the 4th parameter to this function.
	 * @method updateAvatars
	 * @static
	 * @param {string} $publisherId
	 *  id of the publisher whose avatar to update
	 * @param {array} $taintedAccess
	 *  array of Streams_Access objects representing access information that is either
	 *  about to be saved, are about to be overwritten, or will be deleted
	 * @param {string|Streams_Stream} $streamName
	 *  pass the stream name here. You can also pass a Stream_Stream object here,
	 *  in which case it will be used, instead of selecting that stream from the database.
	 * @param {boolean} $updateToPublicValue=false
	 *  if you want to first update all the avatars for this stream
	 *  to the what the public would see, to avoid the situation described in 2).
	 */
	static function updateAvatars(
		$publisherId, 
		$taintedAccess, 
		$streamName, 
		$updateToPublicValue = false)
	{
		if (!isset($streamName)) {
			$streamAccesses = array();
			foreach ($taintedAccess as $access) {
				$streamAccesses[$access->streamName][] = $access;
			}
			if (count($streamAccesses) > 1) {
				foreach ($streamAccesses as $k => $v) {
					self::updateAvatars($publisherId, $v, $k);
				}
				return false;
			}
		}
		if ($streamName instanceof Streams_Stream) {
			$stream = $streamName;
			$streamName = $stream->name;
		}

		// If we are here, all the Stream_Access objects have the same streamName
		if ($streamName !== 'Streams/user/firstName'
		and $streamName !== 'Streams/user/lastName'
		and $streamName !== 'Streams/user/username') {
			// we don't care about access to other streams being updated
			return false;
		}
		$showToUserIds = array();

		// Select the user corresponding to this publisher
		$user = new Users_User();
		$user->id = $publisherId;
		if (!$user->retrieve(null, null, array('ignoreCache' => true))) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'user',
				'criteria' => 'id = '.$user->id
			));
		}

		// Obtain the stream object to use
		if (isset($stream)) {
			if (!isset($stream->content)) {
				$stream->content = '';
			}
		} else {
			// If the $stream isn't already defined, select it
			$stream = new Streams_Stream();
			$stream->publisherId = $publisherId;
			$stream->name = $streamName;
			if (!$stream->retrieve()) {
				// Strange, this stream doesn't exist.
				// Well, we will just silently set the content to '' then
				$stream->content = '';
			}
		}

		$content_readLevel = Streams::$READ_LEVEL['content'];
		$readLevels = array();
		$label_readLevels = array();
		$contact_label_list = array();
		$removed_labels = array();

		// First, assign all the readLevels that are directly set for specific users,
		// and aggregate the contact_labels from the other accesses, for an upcoming select.
		foreach ($taintedAccess as $access) {
			if ($userId = $access->ofUserId) {
				$readLevel = $access->readLevel;
				$readLevels[$userId] = $readLevel;
				if ($readLevel < 0) {
					$showToUserIds[$userId] = null; // not determined yet
				} else if ($readLevel >= $content_readLevel) {
					$showToUserIds[$userId] = true;
				} else {
					$showToUserIds[$userId] = false;
				}
			} else if ($access->ofContactLabel) {
				$ofContactLabel = $access->ofContactLabel;
				$contact_label_list[] = $ofContactLabel;
				if ($access->get('removed', false)) {
					$removed_labels[$ofContactLabel] = true;
				} else {
					$label_readLevels[$ofContactLabel] = $access->readLevel;
				}
			}
		}

		// Now, get all the people affected by this change, and their readLevels
		$readLevels2 = array();
		if ($contact_label_list) {
			$contact_label_list = array_unique($contact_label_list);
			$contacts = Users_Contact::select()
				->where(array(
					'userId' => $publisherId,
					'label' => $contact_label_list
				))->fetchDbRows(null, '', 'contactUserId');
			foreach ($contacts as $contact) {
				$contactUserId = $contact->contactUserId;
				if (isset($showToUserIds[$contactUserId])) {
					// this user had their read level set directly by the access,
					// which overrides read levels set by access using ofContactLabel
					continue;
				}
				if (isset($removed_labels[$ofContactLabel])) {
					// this label doesn't affect readLevels anymore, since it was deleted
					// but put this contact's id on a list whose readLevels need to be determined
					$showToUserIds[$contactUserId] = null;
					continue;
				}
				if (!isset($label_readLevels[$contact->label])) {
					continue;
				}
				$readLevel = $label_readLevels[$contact->label];
				if (!isset($readLevels2[$contactUserId])) {
					$readLevels2[$contactUserId] = $readLevel;
				} else {
					$readLevels2[$contactUserId] = max(
						$readLevels2[$contactUserId],
						$readLevel
					);
				}
			}
		}

		// Now step through all the users we found who were found through ofContactLabel
		// and make sure we update the avatar rows that were meant for them.
		foreach ($readLevels2 as $userId => $rl) {
			if ($rl >= $content_readLevel) {
				$showToUserIds[$userId] = true;
			} else {
				// in order for this to happen, two things had to be true:
				// 1) there was no access that directly set a readLevel >= $content_readLevel
				// 2) there was no access that set a readLevel >= $content_readLevel for any label containing this user
				// therefore, their view should be the public view
				$showToUserIds[$userId] = 'public';
			}
		}

		// Resolve all the undetermined readLevels
		foreach ($showToUserIds as $userId => $v) {
			if (!isset($v)) {
				// if the readLevel hasn't been determined by now, it's the same as the public one
				$showToUserIds[$userId] = 'public';
			}
		}
		
		// Set up the self avatar:
		$showToUserIds[$publisherId] = true;

		// Finally, set up the public avatar:
		if (!isset($stream->readLevel)) {
			$stream->readLevel = Streams_Stream::$DEFAULTS['readLevel'];
		}
		$showToUserIds[""] = ($stream->readLevel >= $content_readLevel);

		// Now, we update the avatars:
		$parts = explode('/', $streamName);
		$field = end($parts);
		$rows_that_show = array();
		$rows_that_hide = array();
		foreach ($showToUserIds as $userId => $show) {
			if ($show === 'public') {
				// If no show is explicitly specified, use the value used for the rest of the public
				$show = $showToUserIds[""];
			}
			if ($show === true) {
				$rows_that_show[] = array(
					'publisherId' => $publisherId,
					'toUserId' => $userId,
					'username' => $user->username,
					'icon' => $user->icon,
					'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP"),
					$field => $stream->content
				);
			} else if ($show === false) {
				$rows_that_hide[] = array(
					'publisherId' => $publisherId,
					'toUserId' => $userId,
					'username' => $user->username,
					'icon' => $user->icon,
					'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP"),
					$field => ''
				);
			}
		}
		$updates_that_show = array(
			'username' => $user->username,
			'icon' => $user->icon,
			'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP"),
			$field => $stream->content
		);
		$updates_that_hide = array(
			'username' => $user->username,
			'icon' => $user->icon,
			'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP"),
			$field => ''
		);

		// We are now ready to make changes to the database.
		if ($updateToPublicValue) {
			Streams_Avatar::update()
				->set(array($field => $showToUserIds[""] ? $stream->content : ''))
				->where(compact('publisherId'))
				->execute();
		}
		Streams_Avatar::insertManyAndExecute($rows_that_show, array('onDuplicateKeyUpdate' => $updates_that_show));
		Streams_Avatar::insertManyAndExecute($rows_that_hide, array('onDuplicateKeyUpdate' => $updates_that_hide));
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
		
		$criteria = compact(
			'toPublisherId', 'toStreamName', 
			'type', 'fromPublisherId', 'fromStreamName'
		);
		
		// Fetch relatedTo
		if ($relatedTo !== false) {
			$relatedTo = Streams_RelatedTo::select()
			->where($criteria)
			->fetchDbRows(null, null, $arrayField);
		}
		
		// Fetch relatedFrom
		if ($relatedFrom !== false) {
			$relatedFrom = Streams_RelatedFrom::select()
			->where($criteria)
			->fetchDbRows(null, null, $arrayField);
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
	 * @param {string} $type
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
			if (!isset($relatedToArray[$sn])) {
				// at least one new relation will be inserted
				if (isset($options['weight'])) {
					$parts = explode('+', "$options[weight]");
					if (count($parts) > 1) {
						$calculateWeights = $parts[1];
						break;
					}
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
				->where(compact('toPublisherId', 'toStreamName', 'type'))
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
				unset($extra);
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
				compact('asUserId', 'category', 'stream', 'extra'),
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
				compact('asUserId', 'category', 'stream'),
				'before'
			)) {
				continue;
			}
			$tsn = ($arrayField === 'toStreamName') ? $sn : $toStreamName;
			$newRT[$sn] = $newRF[$sn] = compact(
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
		}
		// Save all the relatedTo
		Streams_RelatedTo::insertManyAndExecute($newRT);
		Streams_RelatedFrom::insertManyAndExecute($newRF);

		$relatedFrom_messages = array();
		$relatedTo_messages = array();
		foreach ($$arrayField as $sn) {
			
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
			$parts = explode('/', $type);
			$displayType = end($parts);
			if (substr(end($parts), -1) === 's') {
				$displayType = substr($displayType, 0, -1);
			}
			$categoryName = explode('/', $category->name);
			$streamName = explode('/', $stream->name);

			$params = compact(
				'relatedTo', 'relatedFrom', 'asUserId', 'category', 'stream',
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

			$description = Q_Handlebars::renderSource(
				Streams_Stream::getConfigField($category->type,
					array('relatedTo', $type, 'description'),
					Streams_Stream::getConfigField($category->type, array(
						'relatedTo', '*', 'description'
					), "New $fromDisplayType added"
				)),
				$params
			);

			// Send Streams/relatedTo message to a stream
			// node server will be notified by Streams_Message::post
			// DISTRIBUTED: in the future, the publishers may be on separate domains
			// so posting this message may require internet communication.
			$instructions = compact(
				'fromPublisherId', 'type', 'weight', 'displayType',
				'fromUrl', 'toUrl',
				'fromIcon', 'fromTitle', 'fromType', 'fromDisplayType', 'description'
			);
			$instructions['url'] = $instructions['fromUrl'];
			$instructions['fromStreamName'] = $stream->name;
			$relatedTo_messages[$toPublisherId][$category->name][] = array(
				'type' => 'Streams/relatedTo',
				'instructions' => $instructions
			);

			$description = Q_Handlebars::renderSource(
				Streams_Stream::getConfigField($stream->type, array('relatedFrom', $type, 'description'),
					Streams_Stream::getConfigField($stream->type, array('relatedFrom', '*', 'description'),
						"Added to {{toDisplayType}} as $displayType"
					)),
				$params
			);

			// Send Streams/relatedFrom message to a stream
			// node server will be notified by Streams_Message::post
			// DISTRIBUTED: in the future, the publishers may be on separate domains
			// so posting this message may require internet communication.
			$instructions = compact(
				'toPublisherId', 'type', 'weight', 'displayType',
				'fromUrl', 'toUrl', 'fromUri', 'toUri', 
				'toIcon', 'toTitle', 'toType', 'toDisplayType', 'description'
			);
			$instructions['url'] = $instructions['toUrl'];
			$instructions['toStreamName'] = $category->name;
			$relatedFrom_messages[$fromPublisherId][$stream->name][] = array(
				'type' => 'Streams/relatedFrom',
				'instructions' => $instructions
			);

			/**
			 * @event Streams/relateFrom/$streamType {after}
			 * @param {string} relatedTo
			 * @param {string} relatedFrom
			 * @param {string} asUserId
			 * @param {array} extra
			 * @param {Streams_Stream} category
			 * @param {Streams_Stream} stream
			 */
			Q::event(
				"Streams/relate/{$stream->type}",
				compact('relatedTo', 'relatedFrom', 'asUserId', 'category', 'stream', 'extra'),
				'after'
			);
			/**
			 * @event Streams/relateTo/$categoryType {after}
			 * @param {string} relatedTo
			 * @param {string} relatedFrom
			 * @param {string} asUserId
			 * @param {Streams_Stream} category
			 * @param {Streams_Stream} stream
			 */
			Q::event(
				"Streams/relateTo/{$category->type}",
				compact('relatedTo', 'relatedFrom', 'asUserId', 'category', 'stream'),
				'after'
			);
		}

		if (empty($options['skipMessageTo'])) {
			list($messagesTo, $s) = Streams_Message::postMessages($asUserId, $relatedTo_messages, true);
		}
		if (empty($options['skipMessageFrom'])) {
			list($messagesFrom, $s) = Streams_Message::postMessages($asUserId, $relatedFrom_messages, true);
		}

		return compact('messagesTo', 'messagesFrom');
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
	 * @param {string} $type
	 *  The type of the relation
	 * @param {string} $fromPublisherId
	 *  The user who has publishes the related stream
	 * @param {string} $fromStreamName
	 *  The name of the related stream. Pass an array of strings to relate multiple streams
	 *  to a single category, but in that case make sure toStreamName is a string.
	 * @param {array} $options=array()
	 *  An array of options that can include:
	 * @param {boolean} [$options.skipAccess=false] If true, skips the access checks and just unrelates the stream from the category
	 * @param {boolean} [$options.skipMessageTo=false] If true, skips posting the Streams/unrelatedTo message to the "to" streams
	 * @param {boolean} [$options.skipMessageFrom=false] If true, skips posting the Streams/unrelatedFrom message to the "from" streams
	 * @param {boolean} [$options.adjustWeights=false] If true, also decrements all following relations' weights by one.
	 * @return {boolean}
	 *  Whether the relation was removed
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
			compact('relatedTo', 'relatedFrom', 'asUserId'),
			'before') === false
		) {
			return;
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
			compact('relatedTo', 'relatedFrom', 'asUserId'),
			'before') === false
		) {
			return;
		}

		/*
		 * remove 'Streams/relation' from $relatedTo.
		 * we consider category stream as 'remote' i.e. more error prone.
		 */

		$weight = isset($relatedTo->weight) ? $relatedTo->weight : null;
		if ($relatedTo && $relatedTo->remove()) {
			if (isset($weight) and !empty($options['adjustWeights'])) {
				$criteria = array(
					'toPublisherId' => $toPublisherId,
					'toStreamName' => $category->name,
					'type' => $type,
					'weight' => new Db_Range($weight, false, false, null)
				);
				Streams_RelatedTo::update()->set(array(
					'weight' => new Db_Expression("weight - 1")
				))->where($criteria)->execute();
			}
			
			// Send Streams/unrelatedTo message to a stream
			// node server will be notified by Streams_Message::post
			if (empty($options['skipMessageTo'])) {
				Streams_Message::post($asUserId, $toPublisherId, $category->name, array(
					'type' => 'Streams/unrelatedTo',
					'instructions' => compact(
						'fromPublisherId', 'fromStreamName', 'type', 'options', 'weight'
					)
				), true);
			}
		}

		if ($relatedFrom && $relatedFrom->remove()) {
			if (empty($options['skipMessageFrom'])) {
				// Send Streams/unrelatedFrom message to a stream
				// node server will be notified by Streams_Message::post
				Streams_Message::post($asUserId, $fromPublisherId, $stream->name, array(
					'type' => 'Streams/unrelatedFrom',
					'instructions' => compact(
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
			compact('relatedTo', 'relatedFrom', 'asUserId'), 
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
			compact('relatedTo', 'relatedFrom', 'asUserId'),
			'after'
		);

		return true;
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
	 * @param {boolean} [$options.orderBy=false] Defaults to false, which means order by decreasing weight. True means order by increasing weight.
	 * @param {integer} [$options.limit] number of records to fetch
	 * @param {integer} [$options.offset] offset to start from
	 * @param {double} [$options.min] the minimum orderBy value (inclusive) to filter by, if any
	 * @param {double} [$options.max] the maximum orderBy value (inclusive) to filter by, if any
	 * @param {string|array|Db_Range} [$options.type] if specified, this filters the type of the relation.
	 *   Can be useful for implementing custom indexes using relations and varying the value of "type".
	 * @param {string|array|Db_Range} [$options.weight] if specified, this filters the weight of the relation.
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
	 * @param {array} [$options.skipFields] Optional array of field names. If specified, skips these fields when fetching streams
	 * @param {array} [$options.skipTypes] Optional array of ($streamName => $relationTypes) to skip when fetching relations.
	 * @param {array} [$options.includeTemplates] Defaults to false. Pass true here to include template streams (whose name ends in a slash) among the related streams.
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
			if (!$row->testReadLevel('relations')) {
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
			if (empty($options['orderBy'])) {
				$query = $query->orderBy('weight', false);
			} else if ($options['orderBy'] === true) {
				$query = $query->orderBy('weight', true);
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
		if (!is_numeric($offset) or $offset > $max_offset) {
			throw new Q_Exception("Streams::related offset is too large, must be <= $max_offset");
		}
		if (!is_numeric($limit) or $limit > $max_limit) {
			throw new Q_Exception("Streams::related limit is too large, must be <= $max_limit");
		}

		$min = isset($options['min']) ? $options['min'] : null;
		$max = isset($options['max']) ? $options['max'] : null;
		if (isset($min) or isset($max)) {
			$range = new Db_Range($min, true, true, $max);
			$query = $query->where(array('weight' => $range));
		}
		if (isset($limit)) {
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
	 * Updates the weight on a relation
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
	 * @param {boolean} [$options.skipAccess=false] If true, skips the access checks and just unrelates the stream from the category
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
			throw new Q_Exception_MissingRow(
				array('table' => 'relatedTo', 'criteria' => 'with those fields'),
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
			compact(
				'relatedTo', 'relatedFrom', 'type', 'weight', 
				'previousWeight', 'adjustWeightsBy', 'asUserId', 'extra'
			), 
			'before') === false
		) {
			return false;
		}
		
		if ($adjustWeights
		and $weight !== $previousWeight) {
			$criteria = array(
				'toPublisherId' => $toPublisherId,
				'toStreamName' => $toStreamName,
				'type' => $type,
				'weight' => $weight < $previousWeight
					? new Db_Range($weight, true, false, $previousWeight)
					: new Db_Range($previousWeight, false, true, $weight)
			);
			Streams_RelatedTo::update()->set(array(
				'weight' => new Db_Expression("weight + " . $adjustWeightsBy)
			))->where($criteria)->execute();
		}
		
		$relatedTo->weight = $weight;
		$relatedTo->save();
		
		// Send Streams/updatedRelateTo message to the category stream
		// node server will be notified by Streams_Message::post
		$message = Streams_Message::post($asUserId, $toPublisherId, $toStreamName, array(
			'type' => 'Streams/updatedRelateTo',
			'instructions' => compact(
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
			compact(
				'relatedTo', 'relatedFrom', 'type', 'weight', 
				'previousWeight', 'adjustWeightsBy', 'asUserId', 'extra'
			),
			'after'
		);
		
		return $message;
	}
	
	/**
	 * If the user is not participating in the stream yet, 
	 * inserts a participant record and posts a "Streams/join" or "Streams/visit" type message
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
		$changedFields = compact('state');
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
			if (isset($options['extra'])) {
				$extra = Q::json_decode($participant->extra, true);
				$tree = new Q_Tree($extra);
				$tree->merge($options['extra']);
				$participant->extra = Q::json_encode($tree->getAll(), true);
			}
			$streamNamesUpdate[] = $sn;
			$type = ($participant->state === 'participating') ? 'visit' : 'join';
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
					'type' => "Streams/$type",
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
					'type' => 'Streams/join',
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
				if (!Streams::fetchOne($asUserId, $asUserId, $pn)) {
					Streams::create($asUserId, $asUserId, 'Streams/participating/', array('name' => $pn));
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
	 * as "left" and posts a "Streams/leave" type message to the streams.
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
				$p->extra = Q::json_encode($tree->getAll(), true);
			}
			$streamNamesUpdate[] = $sn;
			$updateCounts[$p->state][] = $sn;
			$p->set('prevState', $p->state);
			$p->state = $state;
		}
		if ($streamNamesUpdate) {
			Streams_Participant::update()
				->set(compact('state'))
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
					'state' => 'participating',
					'subscribed' => !empty($options['subscribed']) ? 'yes' : 'no',
					'posted' => !empty($options['posted']) ? 'yes' : 'no',
					'extra' => !empty($options['extra']) ? $options['extra'] : ''
				));
			}
			Streams_Participant::insertManyAndExecute($rows);
		}
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
				'type' => 'Streams/leave',
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
				if (!Streams::fetchOne($asUserId, $asUserId, $pn)) {
					Streams::create($asUserId, $asUserId, null, array('name' => $pn));
				}
				Streams::unrelate(
					$asUserId, $asUserId, $pn,
					$streamType, $publisherId, $streamNames,
					array(
						'skipMessageFrom' => Q::ifset($options, 'skipRelationMessages', true),
						'skipAccess' => true,
						'weight' => time()
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
	 * @param {string} $asUserId The id of the user that is joining. Pass null here to use the logged-in user's id.
	 * @param {string} $publisherId The id of the user publishing all the streams
	 * @param {array} $streams An array of Streams_Stream objects or stream names
	 * @param {array} [$options=array()] Options for the subscribe() and join() methods
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
	 * @param {boolean} [$options.skipRules=false] if true, do not attempt to create rules for new subscriptions
	 * @param {boolean} [$options.skipAccess=false] if true, skip access check for whether user can join and subscribe
	 * @param {boolean} [$options.skipMessage=false] if true, skip posting the "Streams/subscribe" message to the stream
	 * @return {array} An array of Streams_Participant rows from the database.
	 */
	static function subscribe(
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
		$subscriptions = array();
		$rows = Streams_Subscription::select()
		->where(array(
			'publisherId' => $publisherId,
			'streamName' => $streamNames,
			'ofUserId' => $asUserId
		))->fetchAll(PDO::FETCH_ASSOC);
		foreach ($rows as $row) {
			$sn = $row['streamName'];
			$subscriptions[$sn] = $row;
		}
		$messages = array();
		$streamNamesMissing = array();
		$streamNamesUpdate = array();
		foreach ($streamNames as $sn) {
			$messages[$publisherId][$sn] = array('type' => 'Streams/subscribe');
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
			->set(compact('filter', 'untilTime'))
			->where(array(
				'publisherId' => $publisherId,
				'streamName' => $streamNamesUpdate,
				'ofUserId' => $asUserId
			))->execute();
		}
		$rules = array();
		if ($streamNamesMissing) {
			$types = array();
			foreach ($streamNamesMissing as $sn) {
				$stream = $streams2[$sn];
				$types[$stream->type][] = $sn;
			}
			$subscriptionRows = array();
			$ruleRows = array();
			foreach ($types as $type => $sns) {
				// insert subscriptions
				if (!isset($filter) or !isset($untilTime)) {
					$templates = Streams_Subscription::select()
						->where(array(
							'publisherId' => array('', $publisherId),
							'streamName' => $type.'/',
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
				foreach ($sns as $sn) {
					$subscriptions[$sn] = $subscriptionRows[] = new Streams_Subscription(array(
						'publisherId' => $publisherId,
						'streamName' => $sn,
						'ofUserId' => $asUserId,
						'untilTime' => $untilTime,
						'filter' => $filter
					));
				}

				if (!empty($options['skipRules'])) {
					continue;
				}

				// insert up to one rule per subscription
				$rule = null;
				if (isset($options['rule'])) {
					$rule = $options['rule'];
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
					$templates = Streams_Rule::select()
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
					foreach ($sns as $sn) {
						$row = $rule;
						$row['streamName'] = $sn;
						$row['ordinal'] = 1;
						$row['filter'] = '';
						$rules[$sn] = $ruleRows[] = $row;
						$messages[$publisherId][$sn]['instructions'] = Q::json_encode(array(
							'rule' => $row
						));
					}
				}
			}
			Streams_Subscription::insertManyAndExecute($subscriptionRows);
			Streams_Rule::insertManyAndExecute($ruleRows);
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
	 * Pooststs "Streams/unsubscribe" message to the streams.
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
				$asUserId, $publisherId, $streams2, compact('skipAccess')
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
	 * @param {string} [$who.platform] platform for which uids are passed
	 * @param {string|array} [$who.uid]  platform uid or array of uids
	 * @param {string|array} [$who.label]  label or an array of labels, or tab-delimited string
	 * @param {string|array} [$who.identifier] identifier such as an email or mobile number, or an array of identifiers, or tab-delimited string
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
	 *  The userIds array contains userIds from "userId" first, then "identifiers", "uids", "label",
	 *  then "newFutureUsers". The statuses is an array of the same size and in the same order.
	 *  The identifierTypes array is in the same order as well.
	 *  If the "token" option was set to true, the array also contains the "invite"
	 *  key pointing to a Streams_Invite object that was saved in the database
	 *  (whose userId field is empty because anyone with the token may accept this invite).
	 */
	static function invite($publisherId, $streamName, $who, $options = array())
	{
		if (isset($options['asUserId'])) {
			$asUserId = $options['asUserId'];
			$asUser = Users_User::fetch($asUserId);
		} else {
			$asUser = Users::loggedInUser(true);
			$asUserId = $asUser->id;
		}

		// Fetch the stream as the logged-in user
		$stream = Streams::fetchOne($asUserId, $publisherId, $streamName, true);

		// Do we have enough admin rights to invite others to this stream?
		if (!$stream->testAdminLevel('invite') || !$stream->testWriteLevel('join')) {
			throw new Users_Exception_NotAuthorized();
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
				throw new Q_Exception_MissingFile(compact('filename'));
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
			foreach ($users as $uid => $user) {
				$identifierTypes[] = 'userId';
				$statuses[] = $user->sessionCount ? 'verified' : 'future';
			}
		}
		if (isset($who['identifier'])) {
			$identifiers = $who['identifier'];
			if (is_string($identifiers)) {
				$identifiers = array_map('trim', explode("\t", $identifiers)) ;
			}
			$identifier_ids = Users_User::idsFromIdentifiers(
				$identifiers, $statuses1, $identifierTypes1
			);
			$raw_userIds = array_merge($raw_userIds, $identifier_ids);
			$statuses = array_merge($statuses, $statuses1);
			$identifierTypes = array_merge($identifierTypes, $identifierTypes1);
		}
		if (!empty($who['platform']) and !empty($who['uid'])) {
			// merge users from platform uids
			$platform = $who['platform'];
			$uids = $who['uid'];
			if (is_string($uids)) {
				$uids = array_map('trim', explode("\t", $uids)) ;
			}
			$statuses2 = array();
			$raw_userIds = array_merge(
				$raw_userIds, 
				Users_User::idsFromPlatformUids($platform, $uids, $statuses2)
			);
			$statuses = array_merge($statuses, $statuses2);
			$identifiers = array_merge($identifiers, $uids);
			$identifierTypes2 = array_fill(0, count($statuses2), $platform);
			$identifierTypes = array_merge($identifierTypes, $identifierTypes2);
		}
		// merge labels if any
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
		// and remove already participating users
		$userIds = array_unique($raw_userIds);
		$alreadyParticipating = Streams_Participant::filter(
			$userIds, $stream->publisherId, $stream->name, null
		);
		$userIds = array_diff($raw_userIds, $alreadyParticipating);

		$appUrl = !empty($options['appUrl'])
			? $options['appUrl']
			: Q_Request::baseUrl().'/'.Q_Config::get(
				"Streams", "types", $stream->type, 
				"invite", "url", "{{Streams}}/stream"
			);

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
		
		if ($label = Q::ifset($options, 'addLabel', null)) {
			if (is_string($label)) {
				$label = explode("\t", $label);
			}
			Users_Label::addLabel($label, $publisherId, null, null, $asUserId2, true);
		}
		if ($myLabel = Q::ifset($options, 'addMyLabel', null)) {
			if (is_string($myLabel)) {
				$myLabel = explode("\t", $myLabel);
			}
			Users_Label::addLabel($myLabel, $asUserId, null, null, $asUserId2, true);
		}
		
		foreach ($raw_userIds as $userId) {
			Users_Contact::addContact($asUserId, "Streams/invited", $userId, null, false, true);
			Users_Contact::addContact($asUserId, "Streams/invited/{$stream->type}", $userId, null, false, true);
			Users_Contact::addContact($userId, "Streams/invitedMe", $asUserId, null, false, true);
			Users_Contact::addContact($userId, "Streams/invitedMe/{$stream->type}", $asUserId, null, false, true);
			if ($label) {
				$label2 = Q::isAssociative($label) ? array_keys($label) : $label;
				Users_Contact::addContact($publisherId, $label2, $userId, null, $asUserId2, true);
			}
			if ($myLabel) {
				$myLabel2 = Q::isAssociative($myLabel) ? array_keys($myLabel) : $myLabel;
				Users_Contact::addContact($asUserId, $myLabel2, $userId, null, $asUserId2, true);
			}
		}

		// let node handle the rest, and get the result
		$displayName = isset($options['displayName'])
			? $options['displayName']
			: Streams::displayName($asUser);
		$params = array(
			"Q/method" => "Streams/Stream/invite",
			"invitingUserId" => $asUserId,
			"username" => $asUser->username,
			"userIds" => Q::json_encode($userIds),
			"stream" => Q::json_encode($stream->toArray()),
			"appUrl" => $appUrl,
			"label" => $label, 
			"myLabel" => $myLabel, 
			"readLevel" => $readLevel,
			"writeLevel" => $writeLevel,
			"adminLevel" => $adminLevel,
			"permissions" => $permissions,
			"displayName" => $displayName,
			"expireTime" => $expireTime
		);
		if (!empty($template)) {
			$params['template'] = $template;
			$params['batchName'] = $batchName;
		}
		$result = Q_Utils::queryInternal('Q/node', $params);

		$return = array(
			'success' => $result,
			'userIds' => $raw_userIds,
			'statuses' => $statuses,
			'identifiers' => $identifiers,
			'identifierTypes' => $identifierTypes,
			'alreadyParticipating' => $alreadyParticipating
		);
		
		if (!empty($who['token'])) {
			$invite = new Streams_Invite();
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
			$invite->save();
			$return['invite'] = $invite;
		}
		
		$instructions = array_merge($who, $options, compact(
			'displayName', 'appUrl', 'readLevel', 'writeLevel', 'adminLevel', 'permissions'
		));
		Streams_Message::post($asUserId, $publisherId, $streamName, array(
			'type' => 'Streams/invite',
			'instructions' => $instructions
		), true);
		
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
	 * Each user is allowed at most one request per stream.
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
	 *    right after a request is granted, e.g. "Streams/join" or "Streams/subscribe".
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
		$stream = Streams::fetchOne($userId, $publisherId, $streamName, true);

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
		Q::event('Streams/request', compact('userId'), 'before');
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
		Q::event('Streams/request', compact('request'), 'after');

		return $request;
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
	 * @param {string} $publisherId The id of the user publishing the stream
	 * @param {string} $streamName The name of the stream
	 * @param {array} [$options=array()] Can include "skipAccess"
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
					$stream->name
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
		foreach ($relations as $r) {
			try {
				Streams::unrelate(
					$asUserId, 
					$r->toPublisherId,
					$r->toStreamName,
					$r->type,
					$stream->publisherId,
					$stream->name,
					array(
						'skipAccess' => true
					)
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
					'instructions' => compact('closedTime')
				), true);
				$result = true;
			}
		} catch (Exception $e) {
			throw $e;
		}
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
					$parts[$k] = ucfirst($v);
				}
			}
			$last = join(' ', array_slice($parts, 1));
			$first = $parts[0];
		} else {
			$first = $fullName;
		}
		$first = trim($first);
		$last = trim($last);

		return compact('first', 'last');
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
		return Streams::fetchOne(null, $communityId, "Streams/experience/$experienceId", true);
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
	 * @param {array|string|true} [$icon=true] By default, the user icon is "default".
	 *  But you can pass here an array of filename => url pairs, or a gravatar url to
	 *  download the various sizes from gravatar. Finally, you can pass true to
	 *  generate an icon instead of using the default icon.
	 *  If $identifier['app']['platform'] is specified, and $icon==true, then
	 *  an attempt will be made to download the icon from the user's account on the platform.
	 * @param {array} [$options=array()] An array of options that could include:
	 * @param {string} [$options.activation] The key under "Users"/"transactional" config to use for sending an activation message. Set to false to skip sending the activation message for some reason.
	 * @return {Users_User}
	 * @throws {Q_Exception_WrongType} If identifier is not a valid email address or mobile number
	 * @throws {Q_Exception} If identifier was already verified for someone else
	 * @throws {Users_Exception_AlreadyVerified} If user was already verified
	 * @throws {Users_Exception_UsernameExists} If username exists
	 */
	static function register(
		$fullName, 
		$identifier, 
		$icon = array(),  
		$options = array())
	{	
		/**
		 * @event Streams/register {before}
		 * @param {string} username
		 * @param {string|array} identifier
		 * @param {string} icon
		 * @return {Users_User}
		 */
		$return = Q::event('Streams/register', compact(
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

		$user = Users::register("", $identifier, $icon, $options);

		/**
		 * @event Streams/register {after}
		 * @param {string} username
		 * @param {string|array} identifier
		 * @param {string} icon
		 * @param {Users_User} 'user'
		 * @return {Users_User}
		 */
		Q::event('Streams/register', compact(
			'register', 'identifier', 'icon', 'user', 'options'
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
				$qs = http_build_query(compact('publisherId', 'name'));
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
	 */
	static function lookup($publisherId, $types, $title)
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
		return Streams_Stream::select()->where(array(
			'publisherId' => $publisherId,
			'type' => $types,
			'title LIKE ' => $title
		))->limit($limit)->fetchDbRows();
	}
	
	/**
	 * Get a structured, sorted array with all the interests in a community
	 * @method interests
	 * @static
	 * @param {string} [$communityId=Users::communityId()] the id of the community
	 * @return {array} an array of $category => ($subcategory =>) $interest
	 */
	static function interests($communityId = null)
	{
		if (!isset($communityId)) {
			$communityId = Users::communityId();
		}
		$tree = new Q_Tree();
		$basename = Q_Text::basename();
		$tree->load("files/Streams/interests/$communityId/$basename.json");
		$interests = $tree->getAll();
		foreach ($interests as $category => &$v1) {
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
	
	static function invitedUrl ($token) {
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
			.DS.Q::interpolate($subpath, compact('app'))
			.DS.Q_Utils::splitId($invitingUserId);
	}
	
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
	/**
	 * You can set this to true to prevent caching for a while,
	 * e.g. during installer scripts, but make sure to set it back to false when done.
	 * @property $dontCache
	 * @static
	 * @type string
	 */
	static $dontCache = false;
};

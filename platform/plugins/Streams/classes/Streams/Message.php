<?php
/**
 * @module Streams
 */
/**
 * Class representing 'Message' rows in the 'Streams' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a message row in the Streams database.
 *
 * @class Streams_Message
 * @extends Base_Streams_Message
 */
class Streams_Message extends Base_Streams_Message
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
	 * Convert message object to array safe to show to a user
	 * @method exportArray
	 * @param {array} $options=null
	 * @return {array}
	 */
	function exportArray($options = null) {
		$result = $this->toArray();
		$result['clientId'] = !empty($result['clientId'])
			? sha1($result['clientId'])
			: '';
		return $result;
	}
	
	/**
	 * Post a message to stream
 	 * @method post
	 * @static
	 * @param {string} $asUserId
	 *  The user to post the message as
	 * @param {string} $publisherId
	 *  The publisher of the stream
	 * @param {string|array} $streamName
	 *  The name of the stream. You can also pass an array of stream names here.
	 * @param {array} $message
	 *  The fields of the message that you want posted.
	 * @param {booleam} $skipAccess=false
	 *  If true, skips the access checks and just posts the message.
	 * @return {Streams_Message|array}
	 *  If $streamName was a string, returns the Streams_Message that was posted.
	 *  If $streamName was an array, returns an array of ($streamName => $message) pairs
	 */
	static function post(
		$asUserId, 
		$publisherId,
		$streamName,
		$message,
		$skipAccess=false)
	{
		$messages = array($publisherId => array());
		$streamNames = is_string($streamName) ? array($streamName) : $streamName;
		if (!is_array($streamNames)) {
			throw new Q_Exception_WrongType(array(
				'field' => 'streamName', 
				'type' => 'string or array'
			));
		}
		foreach ($streamNames as $sn) {
			$messages[$publisherId][$sn] = $message;
		}
		list($posted, $streams) = self::postMessages($asUserId, $messages, $skipAccess);
		if (is_string($streamName)) {
			$arr = reset($posted);
			if (!is_array($arr)) {
				return false;
			}
			$arr = reset($arr);
			if (!is_array($arr)) {
				return false;
			}
			return reset($arr);
		}
		$results = array();
		foreach ($posted as $p => $arr) {
			foreach ($arr as $sn => $messages) {
				$results[$sn] = reset($messages);
			}
		}
		return $results;
	}
	
	/**
	 * Post (potentially) multiple messages to multiple streams.
	 * @method postMessages
	 * @static
	 * @param {string} $asUserId
	 *  The user to post the message as
	 * @param {string} $messages
	 *  Array indexed as follows:
	 *  array($publisherId => array($streamName => $message))
	 *  where $message are either Streams_Message objects, 
	 *  or arrays containing all the fields of messages that will need to be posted.
	 * @param {booleam} $skipAccess=false
	 *  If true, skips the access checks and just posts the message.
	 * @return {array}
	 *  Returns an array(array(Streams_Message), array(Streams_Stream))
	 */
	static function postMessages(
		$asUserId, 
		$messages, 
		$skipAccess = false)
	{
		if (!isset($asUserId)) {
			$asUserId = Users::loggedInUser();
			if (!$asUserId) $asUserId = "";
		}
		if ($asUserId instanceof Users_User) {
			$asUserId = $asUserId->id;
		}

		if (!is_array($messages)) {
			return null;
		}

		// Build arrays we will need
		foreach ($messages as $publisherId => $arr) {
			if (!is_array($arr)) {
				throw new Q_Exception_WrongType(array(
					'field' => "messages",
					'type' => 'array of publisherId => streamName => message'
				));
			}
			foreach ($arr as $streamName => &$message) {
				if (!is_array($message)) {
					if (!($message instanceof Streams_Message)) {
						throw new Q_Exception_WrongType(array(
							'field' => "message under $publisherId => $streamName",
							'type' => 'array or Streams_Message'
						));
					}
					$message = $message->fields;
				}
			}
		}

		// Check if there are any messages to post
		$atLeastOne = false;
		foreach ($messages as $publisherId => $arr) {
			foreach ($arr as $streamName => $m) {
				if (!$m) {
					continue;
				}
				$atLeastOne = true;
				break 2;
			}
		}
		if (!$atLeastOne) {
			return array(array(), array());
		}
		
		// Start posting messages, publisher by publisher
		$eventParams = array();
		$posted = array();
		$streams = array();
		$messages2 = array();
		$messageTotals2 = array();
		$updates = array();
		$clientId = Q_Request::special('clientId', '');
		$sendToNode = true;
		foreach ($messages as $publisherId => $arr) {
			$streamNames = array_keys($messages[$publisherId]);
			$streams[$publisherId] = $fetched = Streams::fetch(
				$asUserId, $publisherId, $streamNames, '*', 
				array('refetch' => true, 'begin' => true) // lock for updates
			);
			foreach ($arr as $streamName => $m) {
				// Get the Streams_Stream object
				if (!isset($fetched[$streamName])) {
					$p = new Q_Exception_MissingRow(array(
						'table' => 'stream',
						'criteria' => "publisherId $publisherId and name $streamName"
					));
					$updates[$publisherId]['missingRow'][] = $streamName;
					continue;
				}
				$p = &$posted[$publisherId][$streamName];
				$p = array();
				if (!$m) {
					$updates[$publisherId]['noMessages'][] = $streamName;
					continue;
				}
				$messages3 = is_array($m) && !Q::isAssociative($m) ? $m : array($m);
				$counts = array();
				$count = count($messages3);
				$updates[$publisherId][$count][] = $streamName;
				$i = 0;
				foreach ($messages3 as $message) {
					++$i;
					$type = isset($message['type']) ? $message['type'] : 'text/small';
					$content = isset($message['content']) ? $message['content'] : '';
					$instructions = isset($message['instructions']) ? $message['instructions'] : '';
					$weight = isset($message['weight']) ? $message['weight'] : 1;;
					if (!isset($message['byClientId'])) {
						$message['byClientId'] = $clientId ? substr($clientId, 0, 255) : '';
					}
					if (is_array($instructions)) {
						$instructions = Q::json_encode($instructions);
					}
					$byClientId = $message['byClientId'];
					$stream = $fetched[$streamName];
				
					// Make a Streams_Message object
					$message = new Streams_Message();
					$message->publisherId = $publisherId;
					$message->streamName = $streamName;
					$message->insertedTime = new Db_Expression("CURRENT_TIMESTAMP");
					$message->sentTime = new Db_Expression("CURRENT_TIMESTAMP");
					$message->byUserId = $asUserId;
					$message->byClientId = $byClientId ? substr($byClientId, 0, 31) : '';
					$message->type = $type;
					$message->content = $content;
					$message->instructions = $instructions;
					$message->weight = $weight;
					$message->ordinal = $stream->messageCount + $i; // thanks to transaction
				
					// Set up some parameters for the event hooks
					$params = $eventParams[$publisherId][$streamName][] = array(
						'publisherId' => $publisherId,
						'message' => $message,
						'skipAccess' => $skipAccess,
						'sendToNode' => &$sendToNode, // sending to node can be canceled
						'stream' => $stream
					);
				
					/**
					 * @event Streams/post/$streamType {before}
					 * @param {string} publisherId
					 * @param {Streams_Stream} stream
					 * @param {string} message
					 * @return {false} To cancel further processing
					 */
					if (Q::event("Streams/post/{$stream->type}", $params, 'before') === false) {
						$results[$stream->name] = false;
						continue;
					}
				
					/**
					 * @event Streams/message/$messageType {before}
					 * @param {string} publisherId
					 * @param {Streams_Stream} stream
					 * @param {string} message
					 * @return {false} To cancel further processing
					 */
					if (Q::event("Streams/message/$type", $params, 'before') === false) {
						$results[$stream->name] = false;
						continue;
					}
				
					if (!$skipAccess && !$stream->testWriteLevel('post')) {
						$p[] = new Users_Exception_NotAuthorized();
						/**
						 * @event Streams/notAuthorized {before}
						 * @param {string} publisherId
						 * @param {Streams_Stream} stream
						 * @param {string} message
						 */
						Q::event("Streams/notAuthorized", $params, 'after');
						continue;
					}

					// if we are still here, mark the message as "in the database"
					$message->wasRetrieved(true);
					$p[] = $message;

					// build the arrays of rows to insert
					$messages2[] = $message->fields;
					$counts[$type] = isset($counts[$type]) ? $counts[$type] + 1 : 1;
				}
				foreach ($counts as $type => $count) {
					$key = implode("\t", array($publisherId, $streamName, $type));
					$messageTotals2[$count][$key] = array(
						'publisherId' => $publisherId,
						'streamName' => $streamName,
						'messageType' => $type,
						'messageCount' => $count
					);
				}
			}
		}

		foreach ($messageTotals2 as $count => $rows) {
			Streams_MessageTotal::insertManyAndExecute($rows, array(
				'onDuplicateKeyUpdate' => array(
					'messageCount' => new Db_Expression("messageCount + $count")
				)
			));
		}

		if ($messages2) {
			Streams_Message::insertManyAndExecute($messages2);
		}

		// time to update the stream rows and commit the transaction
		// on all the shards where the streams were fetched.
		foreach ($updates as $publisherId => $arr) {
			foreach ($arr as $count => $streamNames) {
				$suffix = is_numeric($count) ? " + $count" : '';
				Streams_Stream::update()
					->set(array(
						'messageCount' => new Db_Expression('messageCount'.$suffix),
						'updatedTime' => new Db_Expression("CURRENT_TIMESTAMP")
					))->where(array(
						'publisherId' => $publisherId,
						'name' => $streamNames
					))->commit()
					->execute();
			}
		}
		
		// handle all the events for successfully posting
		foreach ($posted as $publisherId => $arr) {
			foreach ($arr as $streamName => $messages3) {
				$stream = $streams[$publisherId][$streamName];
				foreach ($messages3 as $i => $message) {
					$params = $eventParams[$publisherId][$streamName][$i];
					/**
					 * @event Streams/message/$messageType {after}
					 * @param {string} publisherId
					 * @param {Streams_Stream} stream
					 * @param {string} message
					 */
					Q::event("Streams/message/{$message->type}", $params, 'after', false);
					/**
					 * @event Streams/post/$streamType {after}
					 * @param {string} publisherId
					 * @param {Streams_Stream} stream
					 * @param {string} message
					 */
					Q::event("Streams/post/{$stream->type}", $params, 'after', false);
				}
			}
		}
		/**
		 * @event Streams/postMessages {after}
		 * @param {string} publisherId
		 * @param {Streams_Stream} stream
		 * @param {string} posted
		 */
		Q::event("Streams/postMessages", array(
			'streams' => $streams,
			'messages' => $messages,
			'skipAccess' => $skipAccess,
			'posted' => $posted
		), 'after', false);
		
		if ($sendToNode) {
			Q_Utils::sendToNode(array(
				"Q/method" => "Streams/Message/postMessages",
				"posted" => Q::json_encode($messages2),
				"streams" => Q::json_encode(Db::exportArray($streams, array("skipAccess" => true)))
			));
		}
		
		return array($posted, $streams);
	}
	
	/**
	 * @method getAllinstructions
	 * @return {array} The array of all instructions set in the message
	 */
	function getAllInstructions()
	{
		return empty($this->instructions) ? array() : json_decode($this->instructions, true);
	}
	
	/**
	 * @method getInstruction
	 * @param {string} $instructionName The name of the instruction to get
	 * @param {mixed} $default The value to return if the instruction is missing
	 * @return {mixed} The value of the instruction, or the default value, or null
	 */
	function getInstruction($instructionName)
	{
		$instr = $this->getAllInstructions();
		return isset($instr[$instructionName]) ? $instr[$instructionName] : null;
	}
	
	/**
	 * @method setInstruction
	 * @param {string|array} $instructionName The name of the instruction to set,
	 *  or an array of $instructionName => $value pairs
	 * @param {mixed} $value The value to set the instruction to
	 * @return Streams_Message
	 */
	function setInstruction($instructionName, $value)
	{
		$instr = $this->getAllInstructions();
		$instr[$instructionName] = $value;
		$this->instructions = Q::json_encode($instr);

		return $this;
	}
	
	/**
	 * @method clearInstruction
	 * @param {string} $instructionName The name of the instruction to remove
	 */
	function clearInstruction($instructionName)
	{
		$instr = $this->getAllInstructions();
		unset($instr[$instructionName]);
		$this->instructions = Q::json_encode($instr);
	}
	
	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Streams_Message} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Streams_Message();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};
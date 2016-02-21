<?php

/**
 * Invites a user (or a future user) to a stream .
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.publisherId The id of the stream publisher
 * @param {string} $_REQUEST.streamName The name of the stream the user will be invited to
 *  @param [$_REQUEST.userId] user id or an array of user ids
 *  @param [$_REQUEST.fb_uid] fb user id or array of fb user ids
 *  @param [$_REQUEST.label] label or an array of labels for adding publisher's contacts
 *  @param [$_REQUEST.myLabel] label or an array of labels for adding logged-in user's contacts
 *  @param [$_REQUEST.identifier] identifier or an array of identifiers
 *	@param [$_REQUEST.label] the contact label to add to the invited users
 *  @param [$_REQUEST.readLevel] the read level to grant those who are invited
 *  @param [$_REQUEST.writeLevel] the write level to grant those who are invited
 *  @param [$_REQUEST.adminLevel] the admin level to grant those who are invited
 *	@param [$_REQUEST.displayName] the name of inviting user
 * @see Users::addLink()
 */
function Streams_invite_post()
{
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	
	Streams::$cache['invited'] = Streams::invite(
		$publisherId, 
		$streamName, 
		$_REQUEST, 
		$_REQUEST
	);
}

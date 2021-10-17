<?php

/**
 * Displays an HTML document that can be printed, ideally with line breaks.
 * Uses a particular view for the layout.
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.invitingUserId Required. The id of the user that generated the invitations with a call to Streams::invite.
 * @param {string} $_REQUEST.batch Required. The name of the batch under which invitations were saved during a call to Streams::invite.
 * @param {string} [$_REQUEST.limit=100] The maximum number of invitations to show on the page
 * @param {string} [$_REQUEST.offset=0] Used for paging
 * @param {string} [$_REQUEST.title='Invitations'] Override the title of the document
 * @param {string} [$_REQUEST.layout='default'] The name of the layout to use for the HTML document
 * @see Users::addLink()
 */
function Streams_invitations_response()
{
	Q_Request::requireFields(array('batch', 'invitingUserId'), true);
	$invitingUserId = $_REQUEST['invitingUserId'];
	$batch = $_REQUEST['batch'];
	$user = Users::loggedInUser(true);
	$stream = Streams::fetchOne(null, $invitingUserId, 'Streams/invitations', true);
	if (!$stream->testReadLevel('content')) {
		throw new Users_Exception_NotAuthorized();
	}
	$title = Q::ifset($_REQUEST, 'title', 'Invitations');
	$layoutKey = Q::ifset($_REQUEST, 'layout', 'default');
	$limit = min(1000, Q::ifset($_REQUEST, 'limit', 100));
	$offset = Q::ifset($_REQUEST, 'offset', 0);
	$layout = Q_Config::expect('Streams', 'invites', 'layout', $layoutKey);
	$pattern = Streams::invitationsPath($invitingUserId) . DS . $batch . DS . "*.html";
	$filenames = glob($pattern);
	if ($sort = Q_Config::get('Streams', 'invites', 'sort', $batch, null)) {
		usort($filenames, $sort);
	}
	$parts = array();
	foreach ($filenames as $f) {
		if (--$offset >= 0) {
			continue;
		}
		$parts[] = file_get_contents($f);
		if (--$limit == 0) {
			break;
		}
	}
	$content = implode("\n\n<div class='Q_pagebreak Streams_invitations_separator'></div>\n\n", $parts);
	echo Q::view($layout, @compact('title', 'content', 'parts'));
	return false;
}
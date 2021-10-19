<?php

/**
 * Websites tools
 * @module Websites-tools
 */

/**
 * This tool generates an HTML article viewer that lets authorized users edit the article.
 * @class Websites article
 * @constructor
 * @param {Object} [$options] parameters for the tool
 *   @param {String} $options.publisherId The article publisher's user id
 *   @param {String} $options.streamName The article's stream name
 *   @param {String} $options.stream The article's stream, if it is already fetched
 *   @param {String} [$options.html=array()] Any additional for the Streams/html editor
 *   @param {String} [$options.getintouch=array()] Additional options for the Users/getintouch tool, in case it's rendered
 */
function Websites_article_tool($options)
{
	$publisherId = $options['publisherId'];
	$streamName = $options['streamName'];
	$article = Q::ifset($options, 'stream', Streams::fetchOne(null, $publisherId, $streamName));
	if (!$article) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'article', 
			'criteria' => "stream named $streamName"
		));
	}
	$getintouch = array_merge(array(
		'user' => $article->userId,
		'email' => true,
		'sms' => true,
		'call' => true,
		'between' => "",
		'emailSubject' => 'Reaching out from your website',
		'class' => 'Q_button Q_clickable'
	), Q::ifset($options, 'getintouch', array()));
	$canView = $article->testReadLevel('content');
	$canEdit = $article->testWriteLevel('edit');
	if ($article->getintouch) {
		if (is_array($git = json_decode($article->getintouch, true))) {
			$getintouch = array_merge($getintouch, $git);
		}
	}
	$getintouch['class'] = 'Q_button';
	if (!$canView) {
		throw new Users_Exception_NotAuthorized();
	}
	$html = Q::ifset($options, 'html', array());
	$article->addPreloaded();
	Q_Response::addStylesheet('{{Websites}}/css/Websites.css', 'Websites');
	Q_Response::addScript("{{Websites}}/js/Websites.js", 'Websites');
	Q_Response::setToolOptions($options);
	return Q::view("Websites/tool/article.php", 
		@compact('article', 'getintouch', 'canEdit', 'canView', 'html')
	);
}
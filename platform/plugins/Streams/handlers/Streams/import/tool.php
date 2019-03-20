<?php

/**
 * @module Streams-tools
 */
	
/**
 * Allows $app/admins in a community o download of sample csv and upload a filled-out csv.
 * The upload starts a Streams/task where Streams/import handler runs and creates
 * users from the csv, inviting them to certain Streams/experience streams in the community.
 * It also listens to Streams/task/progress messages on the task, displays progress
 * and provides a way to send mass messages to follow up the invitation messages.
 * @class Streams import
 * @constructor
 * @param {array} [$options] this array contains function parameters
 *   @param {string} [$options.link] Required. URL to the csv file to download, if any.
 *      Can be a full url or one of "university.csv" or "building.csv".
 *   @param {string} [$options.linkTitle="Fill Out This Spreadsheet"] The content of the link to the csv, if csv is set
 *   @param {string} [$options.fileLabel="Upload Spreadsheet"] The content of the link to the csv, if csv is set
 *   @param {string} [$options.submitButton="Upload"] The content of the submit button
 *   @param {string} [$options.smsText] The text to send in SMS followups
 *   @param {string} [$options.emailSubject] The subject of the email in followups
 *   @param {string} [$options.emailBody] The body of the email, as HTML
 *   @param {string} [$options.smsBatchSize=99] The size of followup sms batches
 *   @param {string} [$options.emailBatchSize=99] The size of followup email batches
 *   @param {string} [$options.communityId=Users::communityId] For Streams/import/post
 *   @param {string} [$options.taskStreamName] For Streams/import/post
 */
function Streams_import_tool($options)
{
	if ($link = Q::ifset($options, 'link', null)) {
		$href = Q_Valid::url($link)
			? $link
			: Q_Html::themedUrl("{{Streams}}/importing/$link");
		$default = Q::t('Fill Out This Spreadsheet', $foo, $bar);
		$a = Q_Html::a($href, Q::ifset($options, 'linkTitle', $default));
	} else {
		$a = null;
	}
	$fileLabel = Q::ifset($options, 'fileLabel', 'Upload Spreadsheet:');
	$submitButton = Q::ifset($options, 'submitButton', 'Upload');
	$label = Q_Html::label('file', $fileLabel);
	$input = Q_Html::input('file', '', array(
		'id' => 'file', 
		'type' => 'file',
		'class' => 'Streams_import_file'
	));
	$hidden = array();
	if ($communityId = Q::ifset($options, 'communityId', null)) {
		$hidden['communityId'] = $communityId;
	}
	if ($taskStreamName = Q::ifset($options, 'taskStreamName', null)) {
		$hidden['taskStreamName'] = $taskStreamName;
	}
	$hidden = Q_Html::hidden($hidden);
	$button = Q_Html::tag('button', array(
		'type' => 'submit', 
		'class' => 'Q_button Streams_import_submit'
	), $submitButton);
	$form = Q_Html::form('Streams/import', 'post', array(
		'enctype' => 'multipart/form-data',
		'class' => 'Streams_import_form'
	), $label.$input.$hidden.$button);
	Q_Response::setToolOptions($options);
	return $a.$form;
}
<?php

/**
 * Renders a photo selector tool
 * @param $options
 *   An associative array of parameters, which can include:
 * @param {Object} [$options] this object contains function parameters
 *   @param {Q.Event} $options.onSelect Required string naming the callback to be called when the user selects a photo.
 *   @param {Q.Event} [$options.beforePhotos] Triggered when photos are about to be rendered.
 *   @param {Q.Event} [$options.onPhotos] Triggered when photos have been rendered.
 *   @param {String} [$options.platform='facebook'] Has to be "facebook" for now.
 *   @param {String} [$options.uid='me'] Optional. The uid of the user on the platform whose photos should be shown. Facebook only allows 'me' or a page id as a value.
 *   @param {String} [$options.fetchBy='album'] The tool supports different algoriths for fetching photos. Can be either by 'album' or 'tags'. Maybe more will be added later.
 *   @param {String} [$options.preprocessAlbums] Optional function to process the albums array before presenting it in the select. Receives a reference to the albums array as the first parameter, and a callback to call when it's done as the second.
 *   @param {String} [$options.preprocessPhotos] Optional function to process the photos array before presenting it in the select. Receives a reference to the albums array as the first parameter, and a callback to call when it's done as the second.
 *   @param {Q.Event} [$options.onLoad] Q.Event, callback or callback string name which is called when bunch of photos has been loaded.
 *   @param {Q.Event} [$options.onError] Q.Event, callback or callback string which will be called for each image that is unable to load. Image DOM element will be passed as first argument.
 *   @param {String} [$options.prompt=false]
 *   Specifies type of prompt if user is not logged in or didn't give required permission for the tool.
 *   Can be either 'button', 'dialog' or null|false. 
 *   In first case just shows simple button which opens facebook login popup.
 *   In second case shows Users.facebookDialog prompting user to login.
 *   In third case will not show any prompt and will just hide the tool.
 *   @param {String} [$options.promptTitle]  Used only when 'prompt' equals 'dialog' - will be title of the dialog.
 *   @param {String} [$options.promptText]  Used either for button caption when 'prompt' equals 'button' or dialog text when 'prompt' equals 'dialog'.
 *   @param {Boolean} [$options.oneLine]  If true, all the images are shown in a large horizontally scrolling line.
 * @return {void}
 */
function Streams_photoSelector_tool($options)
{
	Q_Response::addScript('{{Streams}}/js/Streams.js', 'Streams');
	Q_Response::addStylesheet('{{Streams}}/css/Streams.css', 'Streams');
	Q_Response::setToolOptions($options);
	return '';
}

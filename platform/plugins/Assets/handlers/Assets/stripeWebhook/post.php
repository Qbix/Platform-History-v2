<?php

/**
 * HTTP method for starting a payment
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.payments Required. Should be either "authnet" or "stripe"
 *  @param {String} [$_REQUEST.publisherId=Q.Users.communityId] The publisherId of the Assets/product or Assets/service stream
 *  @param {String} [$_REQUEST.streamName] The name of the Assets/product or Assets/service stream
 *  @param {Number} [$_REQUEST.description] A short name or description of the product or service being purchased.
 *  @param {Number} [$_REQUEST.amount] the amount to pay. 
 *  @param {String} [$_REQUEST.currency="usd"] the currency to pay in. (authnet supports only "usd")
 *  @param {String} [$_REQUEST.token] the token obtained from the hosted forms
 */
function Assets_stripeWebhook_post($params = array())
{
	print 4523;
	exit;
}
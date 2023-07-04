<?php

/**
 * @module Streams
 */

/**
 * Interface that an adapter must support
 * to implement the Streams_Enrich class.
 * @class Streams_Enrich_Interface
 * @constructor
 */
interface Streams_Enrich_Interface
{

    /**
     * Makes a query to the service.
     * Any adapter should cache the result in a table name Streams_Enrich
     * @method query
     * @param {array} $params May include
     * @param {string} [$params.first_name]
     * @param {string} [$params.last_name]
     * @param {string} [$params.middle_name]
     * @param {string} [$params.phone]
     * @param {string} [$params.email]
     * @param {string} [$params.email_hash] can be either SHA-256 or MD5 hash
     * @param {string} [$params.profile] link to a LinkedIn or other profile
     * @param {string} [$params.street_address] you can put an address here
     * @param {string} [$params.locality] put a city name, for instance
     * @param {string} [$params.country] the country
     * @param {string} [$params.postal_code] 
     * @param {string} [$params.location] freeform, but the above specific ones are preferred
     * @param {string} [$params.company]
     * @param {string} [$params.school]
     * @param {string} [$params.birth_date] YYYY-MM-DD format
     * @param {string} [$params.lid] The LinkedIn ID
     * @param {string} [$params.xid] ID in the external service, adapter may translate this
     * @param {array} $options May include
     * @param {array} [$options.fields] The names of fields to include, otherwise returns whole thing
     * @param {array} [$options.required] The names of fields that are required, to prevent returning bad results and save costs
     * @param {integer} [$options.min_likelihood] Between 0 and 1, to save costs on returning useless results
     * @param {boolean} [$options.pretty] Whether to pretty-print the resulting JSON.
     * @param {integer} $type The type of the query. See class constants beginning with TYPE_ .
     * @return {array} The resulting schema is based on the PeopleDataLabs Enrich API
     */
    function query(array $params, array $options = array());

    /**
     * @method bulkQuery
     * @param {array} $params array of arrays, see query params 
     * @param {array} $options options passed to the queries
     * @return {array} The resulting schema is based on the PeopleDataLabs Bulk Enrich API
     */
    function bulkQuery(array $paramsArray, array $options = array());


};

abstract class Streams_Enrich
{	
    // put any static methods here

    // all the adapters inherit from this class
}

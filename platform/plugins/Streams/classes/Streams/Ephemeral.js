/**
 * Class representing Streams/Ephemeral.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');

/**
 * Streams Ephemeral
 * @namespace Streams
 * @class Ephemeral
 * @constructor
 * @param {Object} payload an associative array of {column: value} pairs
 * @param {Streams.Stream} stream through which the ephemeral will be broadcast
 * @param {Integer} [timestamp=Date.now()] defaults to current timestanp
 */
function Streams_Ephemeral (payload, timestamp) {
    this.payload = payload;
    this.timestamp = timestamp || Date.now() / 1000;
}

Streams_Ephemeral.prototype = {
    className: "Streams_Ephemeral",
};

/**
 * Get the type of the Ephemeral
 * @method getType
 * @return {string}
 */
Streams_Ephemeral.prototype.getType = function () {
    return this.payload.type;
};

/**
 * Get a copy of the fields of the Ephemeral
 * @method getFields
 * @return {string}
 */
Streams_Ephemeral.prototype.getFields = function () {
    return Q.copy(this.payload);
};

module.exports = Streams_Ephemeral;
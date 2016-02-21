/**
 * Platform model
 * @module Platform
 * @main Platform
 */
var Q = require('Q');

/**
 * Static methods for the Platform model
 * @class Platform
 * @extends Base.Platform
 * @static
 */
function Platform() { };
module.exports = Platform;

var Base_Platform = Q.require('Base/Platform');
Q.mixin(Platform, Base_Platform);

/*
 * This is where you would place all the static methods for the models,
 * the ones that don't strongly pertain to a particular row or table.
 * Just assign them as methods of the Platform object.
 * If file 'Platform.js.inc' exists, its content is included
 * * * */

/* * * */
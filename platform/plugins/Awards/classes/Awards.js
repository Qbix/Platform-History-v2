/**
 * Awards model
 * @module Awards
 * @main Awards
 */
var Q = require('Q');

/**
 * Static methods for the Awards model
 * @class Awards
 * @extends Base.Awards
 * @static
 */
var Awards = module.exports;
Q.require('Base/Awards').apply(Awards);

/*
 * This is where you would place all the static methods for the models,
 * the ones that don't strongly pertain to a particular row or table.
 * Just assign them as methods of the Awards object.
 
 * * * */

/* * * */
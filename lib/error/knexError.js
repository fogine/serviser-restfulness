const util = require('util');
const _    = require('lodash');

module.exports = KnexError;

/**
 * @constructor
 * @extends Error
 **/
function KnexError(message, context) {

    Error.call(this); //super constructor
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.message = message;
    this.context = context;
}

/**
 * converts knex generic Error object to the KnexError
 *
 * @param {Error} err
 * @return {KnexError}
 */
KnexError.buildFrom = function(err) {
    const context = {};

    const error = new KnexError(err.message);

    Object.assign(error, _.omit(err, ['name', 'length']));

    error.stack = err.stack;

    return error;
};

util.inherits(KnexError, Error);

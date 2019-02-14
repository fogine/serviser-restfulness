const util            = require('util');
const RequestError    = require('bi-service').error.RequestError;
const HttpStatusCodes = require('http-status-codes');

module.exports = Gone410Error;

/**
 * @constructor
 * @extends {RequestError}
 * @param {Object} [options]
 * @param {String} [options.apiCode]
 **/
function Gone410Error(options) {

    /**
     * @name Gone410Error#code
     * @instance
     * @default 401
     */

    /**
     * @name Gone410Error#message
     * @instance
     * @default 'Unauthorized'
     */

    RequestError.call(this, {
        message : 'Gone',
        code    : HttpStatusCodes.GONE,
        apiCode : options && options.apiCode,
        desc    : 'resource does not exist or is already deleted'
    });
}

util.inherits(Gone410Error, RequestError);

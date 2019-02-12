const util            = require('util');
const RequestError    = require('bi-service').error.RequestError;
const HttpStatusCodes = require('http-status-codes');

module.exports = Created201Response;

/**
 * @constructor
 * @extends {RequestError}
 **/
function Created201Response() {

    RequestError.call(this, {
        message: 'Not found',
        code: HttpStatusCodes.CREATED
    });
}


/**
 */
Created201Response.prototype.toSwagger = function(first_argument) {
    return {
        description: 'empty response with value of Location header pointing to the created resource',
        schema: {}
    };
};

/**
 */
Created201Response.prototype.toJSON = function() {
    return {};
};

util.inherits(Created201Response, RequestError);

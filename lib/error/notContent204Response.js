const util            = require('util');
const RequestError    = require('bi-service').error.RequestError;
const HttpStatusCodes = require('http-status-codes');

module.exports = NoContent204Response;

/**
 * @constructor
 * @extends {RequestError}
 **/
function NoContent204Response() {

    RequestError.call(this, {
        message: 'No Content',
        code: HttpStatusCodes.NO_CONTENT
    });
}


/**
 */
NoContent204Response.prototype.toSwagger = function(first_argument) {
    return {
        description: '',
        schema: {}
    };
};

/**
 */
NoContent204Response.prototype.toJSON = function() {
    return {};
};

util.inherits(NoContent204Response, RequestError);

const validator = require('./validator');

module.exports.validateResourceOptions = validateResourceOptions;

const RESOURCE_OPTIONS_SCHEMA = {
    type: 'object',
    required: ['singular', 'plural', 'properties'],
    additionalProperties: false,
    properties: {
        singular: {
            type: 'string',
            minLength: 1,
            transform: ['toLowerCase', 'trim']
        },
        plural: {
            type: 'string',
            minLength: 1,
            transform: ['toLowerCase', 'trim']
        },
        db: {
            type: 'object',
            additionalProperties: false,
            default: {},
            properties: {
                table: { //database table name
                    type: 'string',
                    $default: {$data: '/singular'},
                    default: 'undefined',
                    minLength: 1
                },
                key: {
                    type: 'object',
                    additionalProperties: true,//additional json-schema keywords
                    default: {},
                    properties: {
                        name: {
                            type: 'string',
                            default: 'id',
                            minLength: 1
                        },
                        type: {
                            type: 'string',
                            default: 'integer',
                            enum: ['integer', 'string']
                        },
                        format: {type: 'string', minLength: 1},
                        pattern: {type: 'string', minLength: 1}
                    }
                }
            }
        },
        properties: {type: 'object'},
        responseProperties: {type: 'object'},
        dynamicDefaults: {type: 'object'}
    }
};

validator.addSchema(RESOURCE_OPTIONS_SCHEMA, 'resource-options-schema');

/**
 * @private
 *
 * @param {Object} options
 *
 * @throws {Error}
 * @return {undefined}
 */
function validateResourceOptions(options) {

    const validate = validator.getSchema('resource-options-schema');
    let result = validate(options);

    if (!result) {
        let meta = validate.errors.pop();
        throw new Error(`Invalid Resource options object: ${meta.dataPath} ${meta.message}`);
    }

    if (!options.hasOwnProperty('responseProperties')) {
        options.responseProperties = options.properties;
    }
}

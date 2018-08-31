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

const RESOURCE_ASSOCIATION_SCHEMA = {
    type: 'object',
    required: ['type', 'foreignKey', 'localKey'],
    properties: {
        type: {
            type: 'string',
            enum: ['1x1', '1xM', 'MxM']
        },
        foreignKey: {
            type: 'string',
            minLength: 1
        },
        localKey: {
            type: 'string',
            minLength: 1
        },
        through: {
            type: 'object',
            properties: {
                foreignKey: { $ref: '#/properties/foreignKey' },
                localKey: { $ref: '#/properties/localKey' }
            }
        }
    }
};

validator.addSchema(RESOURCE_OPTIONS_SCHEMA, 'resource-options-schema');
validator.addSchema(RESOURCE_ASSOCIATION_SCHEMA, 'resource-association-schema');

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
}

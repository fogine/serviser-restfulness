const validator = require('./validator');
const ResourceRegistry = require('./resourceRegistry.js');

module.exports.validateResourceOptions = validateResourceOptions;
module.exports.parseUrlResources = parseUrlResources;
module.exports.normalizeUrl = normalizeUrl;


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

/**
 * @param {String} url
 * @param {ResourceRegistry} registry
 * @return {Array<Object>}
 */
function parseUrlResources(url, registry) {
    const regex = /(?:@)(\w+)|:{key}|:(\w+)/g;
    let matches, segments = [];

    if (typeof url !== 'string' || !url.length) {
        throw new Error('First argument should be a type of string, not empty');
    }

    if (!(registry instanceof ResourceRegistry)) {
        throw new Error('Second argument of parseUrlResources() must be instanceof ResourceRegistry');
    }

    while (matches = regex.exec(url)) {
        let segment = segments[segments.length -1];


        if (matches[0][0] === '@') {
            segments.push({
                resource: registry.getByPluralName(matches[1])
            });
            continue;
        }

        if (segment === undefined) {
            segment = {};
            segments.push(segment);
        }

        if (matches[0][0] === ':' && matches[2] !== undefined) {
            segment.narrowedDownBy = matches[2];
        } else if (matches[0] === ':{key}') {
            segment.narrowedDownBy = segment.resource.getKeyName();
        }
    }

    return segments;
}

/**
 * @param {String} url
 * @param {Array<Object>} urlSegments - output of parseUrlResources function
 * @return {String}
 */
function normalizeUrl(url, urlSegments) {
    urlSegments.forEach(function(segment) {
        let resource = segment.resource;
        let name = resource.getPluralName();
        let rNarrowedDownResource = new RegExp(`@${name}/:{key}`);
        let rResource = new RegExp(`@${name}`);

        if (segment.hasOwnProperty('narrowedDownBy')
            && url.match(rNarrowedDownResource)
        ) {
            url = url.replace(
                rNarrowedDownResource,
                `${name}/:${resource.getName()}_${resource.getKeyName()}`
            );
            return;
        }

        url = url.replace(rResource, name);
    });

    return url;
}

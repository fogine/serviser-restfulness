const validator = require('./validator');
const ResourceRegistry = require('./resourceRegistry.js');

module.exports.validateResourceOptions = validateResourceOptions;
module.exports.parseUrlResources = parseUrlResources;
module.exports.normalizeUrl = normalizeUrl;

const QuerySegmentCollection = require('./querySegmentCollection.js');
const QuerySegment           = require('./querySegment.js');

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
                    $default: {$data: '/plural'},
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
 * @param {QuerySegmentCollection} [segments] - required only when parsing relative urls which start with parameter definition eg: /:{key}/posts
 * @return {QuerySegmentCollection}
 */
function parseUrlResources(url, registry, segments) {
    const regex = /(?:@)(\w+)|:{key}|:(\w+)/g;
    let matches = [];

    segments = segments || new QuerySegmentCollection;

    if (typeof url !== 'string' || !url.length) {
        throw new Error('First argument should be a type of string, not empty');
    }

    if (!(registry instanceof ResourceRegistry)) {
        throw new Error('Second argument of parseUrlResources() must be instanceof ResourceRegistry');
    }

    while (matches = regex.exec(url)) {
        let segment = segments[segments.length -1];

        if (matches[0][0] === '@') {
            segments.push(
                new QuerySegment(registry.getByPluralName(matches[1]))
            );
            continue;
        }

        if (matches[0][0] === ':' && matches[2] !== undefined) {
            segments.last().reduceBy(matches[2]);
        } else if (matches[0] === ':{key}') {
            segments.last().reduceBy(segment.resource.getKeyName());
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
        let name = segment.resource.getPluralName();
        let rNarrowedDownResource = new RegExp(`@${name}/:{key}`);
        let rResource = new RegExp(`@${name}`);

        if (segment.isReduced()
            && url.match(rNarrowedDownResource)
        ) {
            url = url.replace(
                rNarrowedDownResource,
                `${name}/:${segment.getPropertyName()}`
            );
            return;
        }

        url = url.replace(rResource, name);
    });

    return url;
}

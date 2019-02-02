const _                      = require('lodash');
const Resource               = require('../resource.js');
const QuerySegmentCollection = require('../querySegmentCollection.js');
const utils                  = require('../utils.js');
const middlewares            = require('./middlewares.js');

module.exports._buildRoute = _buildRoute;
module.exports._settleRouteValidators = _settleRouteValidators;
module.exports._settleRouteResponseSchema = _settleRouteResponseSchema;
module.exports._hasResponseSchema = _hasResponseSchema;
module.exports._isImplemented = _isImplemented;
module.exports._acceptSortLimitOffsetParameters = _acceptSortLimitOffsetParameters;
module.exports._acceptEmbedParameter = _acceptEmbedParameter;
module.exports._getResponseSchema = _getResponseSchema;

/**
 * @param {Object} options - route options
 * @param {String} options.type - http method
 * @this {Router}
 * @private
 *
 * @return {Route}
 */
function _buildRoute(options) {

    if (typeof options !== 'object' || options === null) {
        throw new Error('route options object argument is required.');
    }

    const router = this;
    const querySegments = this.$restfulness.querySegments.clone();
    let routeUrl = '/';

    if (typeof options.url === 'string' && options.url.length > 1) {//must be more than just '/'
        let routerUrl = router.$restfulness.urlTemplate;
        let numberOfRouterUrlSegments = routerUrl.split('/').length;
        let fullUrl = this.$normalizeUrl(routerUrl + '/' + options.url);

        utils.parseUrlResources(options.url, Resource.registry, querySegments);

        routeUrl = utils
            .normalizeUrl(fullUrl, querySegments)
            .split('/')
            .slice(numberOfRouterUrlSegments);
    }

    const route = this.buildRoute(Object.assign(options, {
        url: this.$normalizeUrl(routeUrl),
        name: options.name || _getRouteName(querySegments)
    }));

    route.$restfulness = {
        querySegments: querySegments
    };

    return route;
}


/**
 * when a url operates on single resource (aka. is narrowed down by eg. primary key),
 * this function returns alternate singular route name which will not colide with default
 * plural version of the route name
 *
 * @private
 * @param {QuerySegmentCollection} urlSegments
 * @return {String|undefined}
 */
function _getRouteName(urlSegments) {
    const lastSegment = urlSegments.last();

    if (lastSegment.isReduced()) {
        let name = '';
        for (let i = 0, len = urlSegments.length - 1; i < len; i++) {
            name += _.upperFirst(urlSegments[i].resource.getPluralName());
        }
        name += _.upperFirst(lastSegment.resource.getName());
        return name;
    }
}


/**
 * sets response fallbacks for routes that contain payload
 * @param {Route} route
 * @param {Boolean} [wrapIntoCollection=false]
 * @return {undefined}
 */
function _settleRouteResponseSchema(route, wrapIntoCollection) {
    if (!_hasResponseSchema(route)) {
        const segment = route.$restfulness.querySegments.last();
        const resource = segment.resource;

        const resourceResponseSchema = {
            type: 'object',
            additionalProperties: false,
            properties: _.cloneDeep(resource.getResponseProperties())
        };

        //describe optional associated sub resources which can be eager loaded
        resource.getAssociatedResourceNames().forEach(function(name) {
            if (resource.hasAssociation(name, '1x1')) {
                const subResource = Resource.registry.getByPluralName(name);
                resourceResponseSchema.properties[subResource.getName()] = {
                    type: 'object',
                    additionalProperties: false,
                    properties: _.cloneDeep(subResource.getResponseProperties())
                };
            }
        });

        if (wrapIntoCollection) {
            route.respondsWith({
                type: 'array',
                items: resourceResponseSchema
            });
        } else {
            route.respondsWith(resourceResponseSchema);
        }
    }
}

/**
 * @private
 * @param {Route} route
 * @return {undefined}
 */
function _settleRouteValidators(route) {
    const segment = route.$restfulness.querySegments.last();

    //a route which operates on collection of resources accepts query filter
    //parameters
    if (!segment.isReduced()
        && !_hasTargetValidator(route, 'query')
    ) {
        route.validate({
            type: 'object',
            additionalProperties: false,
            properties: segment.resource.getResponseProperties()
        }, 'query');
    }

    //
    if (!_hasTargetValidator(route, 'params')) {
        let properties = {};
        route.$restfulness.querySegments.forEach(function(segment) {
            if (segment.isReduced()) {
                properties[segment.getPropertyName()] =
                    segment.getPropertySchema();
            }
        });

        if (Object.keys(properties).length) {
            route.validate({
                type: 'object',
                required: Object.keys(properties),
                additionalProperties: false,
                properties: properties
            }, 'params')
        }
    }

    //route has payload
    if (route.acceptedContentTypes().length
        && !_hasTargetValidator(route, 'body')
    ) {
        route.validate({
            type: 'object',
            dynamicDefaults: segment.resource.getDynamicDefaults(),
            required: segment.resource.getRequiredProperties(),
            additionalProperties: false,
            properties: segment.resource.getProperties()
        });
    }
}

/**
 * @private
 * @param {Route} route
 * @return {undefined}
 */
function _acceptSortLimitOffsetParameters(route) {
    route.validate({
        type: 'object',
        additionalProperties: true,
        properties: {
            _sort: {type: 'string', maxLength: 128, pattern: '^(-?[a-zA-Z0-9_]+,)*(-?[a-zA-Z0-9_]+){1}$'},
            _limit: {type: 'integer', minimum: 0, maximum: 500, default: 0},
            _offset: {type: 'integer', minimum: 0, default: 0}
        }
    }, 'query');

    //mark the internal middleware
    _.last(route.steps).$restfulness = true;

    route.step(
        '_restfulness_parse_sort_limit_offset',
        middlewares.parseSortLimitOffsetParametersMiddleware
    );
}


/**
 * @param {Route} route
 * @return {undefined}
 */
function _acceptEmbedParameter(route) {
    route.validate({
        type: 'object',
        additionalProperties: true,
        properties: {
            _embed: {type: 'string', pattern: '^[a-z.,_]+$'}
        }
    }, 'query');

    //mark the internal middleware
    _.last(route.steps).$restfulness = true;

    route.step(
        '_restfulness_parse_embed_parameter',
        middlewares.parseEmbedParameterMiddleware
    );
}

/**
 * returns true if route contains user defined validator for given target
 * @param {Route} route
 * @param {String} target - query|params|body|headers
 * @private
 * @return {Boolean}
 */
function _hasTargetValidator(route, target) {
    for (let i = 0, len = route.steps.length; i < len; i++) {
        let step = route.steps[i];
        let validationSchemaProps = [];

        if (step.name === 'validator'
            && step.args
            && step.args[1] === target
            && !step.hasOwnProperty('$restfulness')
        ) {
            return true;
        }
    }
    return false;
}


/**
 * @param {Route} route
 * @private
 * @return {Boolean}
 */
function _hasResponseSchema(route) {
    if (route.description.responses[200]
        && route.description.responses[200].length
    ) {
        return true;
    }

    return false;
}


/**
 * @param {Route} route
 * @return {Object}
 */
function _getResponseSchema(route) {
    return route.description.responses[200][0].schema;
}

/**
 * @param {Route} route
 * @return {Boolean}
 */
function _isImplemented(route) {
    for (let i = 0, len = route.steps.length; i < len; i++) {
        let step = route.steps[i];
        if (step.name === 'main') {
            return true;
        }
    }
    return false;
}

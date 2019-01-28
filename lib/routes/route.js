const _                      = require('lodash');
const Resource               = require('../resource.js');
const QuerySegmentCollection = require('../querySegmentCollection.js');
const utils                  = require('../utils.js');

module.exports._buildRoute = _buildRoute;
module.exports._settleRouteValidators = _settleRouteValidators;
module.exports._settleRouteResponseSchema = _settleRouteResponseSchema;
module.exports._hasResponseSchema = _hasResponseSchema;

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

    if (lastSegment.hasOwnProperty('narrowedDownBy')) {
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
 * @return {undefined}
 */
function _settleRouteResponseSchema(route) {
    if (!_hasResponseSchema(route)) {
        const segment = route.$restfulness.querySegments.last();

        route.respondsWith({
            type: 'object',
            properties: segment.resource.getResponseProperties()
        });
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
    if (!segment.hasOwnProperty('narrowedDownBy')
        && !_hasTargetValidator(route, 'query')
    ) {
        route.validate({
            type: 'object',
            properties: segment.resource.getResponseProperties()
        }, 'query');
    }

    //
    if (!_hasTargetValidator(route, 'params')) {
        let properties = {};
        route.$restfulness.querySegments.forEach(function(segment) {
            if (segment.narrowedDownBy) {
                properties[segment.narrowedDownBy] =
                    segment.resource.prop(segment.narrowedDownBy);
            }
        });

        if (Object.keys(properties).length) {
            route.validate({
                type: 'object',
                required: Object.keys(properties),
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
            properties: segment.resource.getProperties()
        });
    }
}

/**
 * @param {Route} route
 * @param {String} target - query|params|body|headers
 * @private
 * @return {Boolean}
 */
function _hasTargetValidator(route, target) {
    for (let i = 0, len = route.steps.length; i < len; i++) {
        let step = route.steps[i];
        if (step.name === 'validator' && step.args && step.args[1] === target) {
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

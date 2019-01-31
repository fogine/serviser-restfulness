const routeUtils = require('./route.js');

module.exports = get;

/**
 * @param {String} [url]
 * @param {Object} [options] - route options
 * @this {Router}
 *
 * @return {Route}
 */
function get(url, options) {
    options = options || {};

    const route = routeUtils._buildRoute.call(this, Object.assign(options, {
        url: url,
        type: 'get'
    }));

    const lastSegment = route.$restfulness.querySegments.last();

    if (!lastSegment.isReduced()) {
        routeUtils._acceptSortLimitOffsetParameters(route);
    }

    if (lastSegment.resource.hasAssociation()) {
        routeUtils._acceptEmbedParameter(route);
    }


    /*
     * give the user time to set route specific validators and then, during the
     * next tick, set the fallbacks
     */
    process.nextTick(function() {
        routeUtils._settleRouteValidators(route);

        if (!routeUtils._hasResponseSchema(route)) {
            const resourceResponseSchema = {
                type: 'object',
                properties: lastSegment.resource.getResponseProperties()
            };

            if (!lastSegment.isReduced()) {
                route.respondsWith({
                    type: 'array',
                    items: resourceResponseSchema
                });
            } else {
                route.respondsWith(resourceResponseSchema);
            }
        }
    });

    return route;
}

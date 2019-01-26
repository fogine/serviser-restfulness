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

    /*
     * give the user time to set route specific validators and then, during the
     * next tick, set the fallbacks
     */
    process.nextTick(function() {
        routeUtils._settleRouteValidators(route);

        if (!routeUtils._hasResponseSchema(route)) {
            const segment = route.$restfulness.querySegments.last();
            const resourceResponseSchema = {
                type: 'object',
                properties: segment.resource.getResponseProperties()
            };

            if (!segment.hasOwnProperty('narrowedDownBy')) {
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

const buildRoute = require('./route.js');

module.exports = put;

/**
 * @param {String} [url]
 * @param {Object} [options] - route options
 * @this {Router}
 *
 * @return {Route}
 */
function put(url, options) {
    options = options || {};

    const route = buildRoute.call(this, Object.assign(options, {
        url: url,
        type: 'put'
    }));

    /*
     * give the user time to set route specific validators and then, during the
     * next tick, set the fallbacks
     */
    process.nextTick(function() {
        routeUtils._settleRouteValidators(route);
        routeUtils._settleRouteResponseSchema(route);
    });

    return route;
}

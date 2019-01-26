const buildRoute = require('./route.js');

module.exports = post;

/**
 * @param {String} [url]
 * @param {Object} [options] - route options
 * @this {Router}
 *
 * @return {Route}
 */
function post(url, options) {
    options = options || {};

    const route = buildRoute.call(this, Object.assign(options, {
        url: url,
        type: 'post'
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

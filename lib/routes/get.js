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

    process.nextTick(function() {
        routeUtils._settleRouteValidators(route);
    });

    return route;
}

const buildRoute = require('./route.js');

module.exports = del;

/**
 * @param {String} [url]
 * @param {Object} [options] - route options
 * @this {Router}
 *
 * @return {Route}
 */
function del(url, options) {
    options = options || {};

    const route = buildRoute.call(this, Object.assign(options, {
        url: url,
        type: 'del'
    }));

    return route;
}

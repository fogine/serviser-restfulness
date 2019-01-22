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

    return route;
}

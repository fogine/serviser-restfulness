const Resource = require('../resource.js');
const QuerySegmentCollection = require('../querySegmentCollection.js');
const utils = require('../utils.js');

module.exports = buildRoute;

/**
 * @param {Object} options - route options
 * @param {String} options.type - http method
 * @this {Router}
 *
 * @return {Route}
 */
function buildRoute(options) {

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
        url: this.$normalizeUrl(routeUrl)
    }));

    route.$restfulness = {
        querySegments: querySegments
    };

    return route;
}

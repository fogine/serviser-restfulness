const Resource = require('../resource.js');
const QuerySegmentCollection = require('../querySegmentCollection.js');
const utils = require('../utils.js');

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

    const router = this;
    const querySegments = this.$restfulness.querySegments.clone();
    let routeUrl = '/';

    if (typeof url === 'string' && url.length > 1) {//must be more than just '/'
        let routerUrl = router.$restfulness.urlTemplate;
        let numberOfRouterUrlSegments = routerUrl.split('/').length;
        let fullUrl = this.$normalizeUrl(routerUrl + '/' + url);

        utils.parseUrlResources(url, Resource.registry, querySegments);

        routeUrl = utils
            .normalizeUrl(fullUrl, querySegments)
            .split('/')
            .slice(numberOfRouterUrlSegments);
    }

    const route = this.buildRoute(Object.assign(options, {
        type: 'get',
        url: this.$normalizeUrl(routeUrl)
    }));

    route.$restfulness = {
        querySegments: querySegments
    };

    return route;
}

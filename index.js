const Service = require('bi-service');
const Resource = require('./lib/resource.js');
const utils = require('./lib/utils.js');

const get = require('./lib/routes/get.js');

const App = Service.App; //http app prototype

/**
 * creates a router managed by restfulness
 * @param {Object} options
 * @param {String} options.url
 * @param {Number} [options.version]
 *
 * @return {Router}
 */
App.prototype.buildRestfulRouter = function(options) {
    //this.resourceManager.get('knex');
    options = options || {};

    const querySegments = utils.parseUrlResources(options.url, Resource.registry);
    const url = utils.normalizeUrl(options.url, querySegments);

    const router = this.buildRouter({
        url: url,
        version: options.version
    });

    router.$restfulness = {
        urlTemplate: options.url,
        querySegments: querySegments
    };

    router.get = get;

    return router;
};

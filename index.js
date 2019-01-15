const Service = require('bi-service');
const Resource = require('./lib/resource.js');
const utils = require('./lib/utils.js');

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

    const queryResources = utils.parseUrlResources(options.url, Resource.registry);
    const url = utils.normalizeUrl(options.url, queryResources);

    const router = this.buildRouter({
        url: url,
        version: options.version
    });

    router.$restfulness = {
        queryResources: queryResources
    };

    return router;
};

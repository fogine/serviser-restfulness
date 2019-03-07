const Service = require('bi-service');
const Resource = require('./lib/resource.js');
const utils = require('./lib/utils.js');
const registerCustomKeywords = require('./lib/validator.js').registerCustomKeywords;

const get = require('./lib/routes/get.js');
const post = require('./lib/routes/post.js');
const put = require('./lib/routes/put.js');
const del = require('./lib/routes/del.js');

const App = Service.App; //http app prototype

module.exports.Resource = Resource;
module.exports.config = require('./lib/config.js');
module.exports.error = {
    KnexError: require('./lib/error/knexError.js')
};

//register resource property validation schemas
Service.Service.on('set-up', function(appManager) {
    appManager.on('build-app', function(app) {
        const validator = app.getValidator();
        registerCustomKeywords(validator);
        Resource.registry.forEach(function(resource) {
            validator.addSchema(resource._getCommonProperties());
        });
    });
});


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
    router.post = post;
    router.put = put;
    router.del = del;

    return router;
};


/**
 * @param {String} resource - plural|singular resource name
 * @param {Route}  route
 * @param {String} httpMethod - get|post|put|del
 *
 * @return {Route}
 */
App.prototype.$setRoutesForResource = function(resource, route, httpMethod) {
    if (!this.$restfulness) {
        Object.defineProperty(this, '$restfulness', {
            value: {get: {}, post: {}, put: {}, del: {}}
        });
    }

    if (!this.$restfulness[httpMethod].hasOwnProperty(resource)) {
        this.$restfulness[httpMethod][resource] = [];
    }

    this.$restfulness[httpMethod][resource].push(route);
};

/**
 * @param {Resource} resource
 * @param {String} httpMethod
 *
 * @return {Route}
 */
App.prototype.$getRoutesForResource = function(resource, httpMethod) {
    if (this.$restfulness) {
        return this.$restfulness[httpMethod][resource];
    }
};

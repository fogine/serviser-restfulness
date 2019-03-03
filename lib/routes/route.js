const _                      = require('lodash');
const Resource               = require('../resource.js');
const QuerySegmentCollection = require('../querySegmentCollection.js');
const utils                  = require('../utils.js');
const middlewares            = require('./middlewares.js');
const KnexError              = require('../error/knexError.js');
const config                 = require('../config.js');

module.exports._buildRoute = _buildRoute;
module.exports._settleRouteValidators = _settleRouteValidators;
module.exports._settleRouteResponseSchema = _settleRouteResponseSchema;
module.exports._hasResponseSchema = _hasResponseSchema;
module.exports._isImplemented = _isImplemented;
module.exports._acceptSortLimitOffsetParameters = _acceptSortLimitOffsetParameters;
module.exports._acceptEmbedParameter = _acceptEmbedParameter;
module.exports._getResponseSchema = _getResponseSchema;
module.exports._transformKnexError = _transformKnexError;
module.exports._getLocationHeader = _getLocationHeader;

/**
 * @param {Object} options - route options
 * @param {String} options.type - http method
 * @this {Router}
 * @private
 *
 * @return {Route}
 */
function _buildRoute(options) {

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
            .slice(numberOfRouterUrlSegments)
            .join('/');
    }

    const route = this.buildRoute(Object.assign(options, {
        url: this.$normalizeUrl(routeUrl),
        name: options.name || _getRouteName(querySegments)
    }));

    route.$restfulness = {
        querySegments: querySegments
    };

    return route;
}

/**
 * when a url operates on reduced resource (aka. is narrowed down by eg. primary key),
 * this function returns alternate singular route name which will not colide with default
 * plural version of the route name.
 * Example:
 * GET api/users = route name: Users
 * GET api/users/:id = route name tweaked from: Users -> User
 *
 * additionally it will make sure route names are unique when
 * there are two similar routes which differ only at path parameter names
 * Example:
 * GET api/users/:id = route name: getUser
 * GET api/users/:username = route name tweaked from: User -> UserByUsername
 *
 * @private
 * @param {QuerySegmentCollection} urlSegments
 * TODO unit test this
 * @return {String|undefined}
 */
function _getRouteName(urlSegments) {
    const lastSegment = urlSegments.last();
    let by = 'By';

    let name = '';
    for (let i = 0, len = urlSegments.length - 1; i < len; i++) {
        const resource = urlSegments[i].resource;
        name += _.upperFirst(resource.getPluralName());
        if (resource.getKeyName() !== urlSegments[i].getOriginalPropertyName()) {
            by += _.upperFirst(_.camelCase(urlSegments[i].getOriginalPropertyName()));
        }
    }

    const resource = lastSegment.resource;
    if (lastSegment.isReduced()) {
        name += _.upperFirst(resource.getName());
        if (resource.getKeyName() !== lastSegment.getOriginalPropertyName()) {
            by += _.upperFirst(_.camelCase(lastSegment.getOriginalPropertyName()));
        }
    } else {
        name += _.upperFirst(resource.getPluralName());
    }

    if (by.length > 2) {
        name += by;
    }

    return name;
}


/**
 * sets response fallbacks for routes that contain payload
 * @param {Route} route
 * @param {Boolean} [wrapIntoCollection=false]
 * @return {undefined}
 */
function _settleRouteResponseSchema(route, wrapIntoCollection) {
    if (!_hasResponseSchema(route)) {
        const ajv = route.Router.App.getValidator();
        const segment = route.$restfulness.querySegments.last();
        const resource = segment.resource;
        const allowedValidationKeywords = ['type', 'default'];
        const properties = _clearValidationKeywords(
            _.cloneDeep(resource.getResponseProperties()),
            ajv,
            allowedValidationKeywords
        );

        const resourceResponseSchema = {
            type: 'object',
            additionalProperties: false,
            properties: properties
        };

        //describe optional associated sub resources which can be eager loaded
        resource.getAssociatedResourceNames().forEach(function(name) {
            if (resource.hasAssociation(name, '1x1')) {
                const subResource = Resource.registry.getByPluralName(name);
                const subProperties = _clearValidationKeywords(
                    _.cloneDeep(subResource.getResponseProperties()),
                    ajv,
                    allowedValidationKeywords
                );
                resourceResponseSchema.properties[subResource.getName()] = {
                    type: 'object',
                    additionalProperties: false,
                    properties: subProperties
                };
            }
        });

        if (wrapIntoCollection) {
            route.respondsWith({
                type: 'array',
                items: resourceResponseSchema
            });
        } else {
            route.respondsWith(resourceResponseSchema);
        }
    }
}

/**
 * @private
 * @param {Route} route
 * @return {undefined}
 */
function _settleRouteValidators(route) {
    const ajv = route.Router.App.getValidator();
    const segment = route.$restfulness.querySegments.last();
    const firstSegment = route.$restfulness.querySegments[0];
    const hasPayload = !!route.acceptedContentTypes().length;

    //a route which operates on collection of resources accepts query filter
    //parameters
    if (!segment.isReduced()
        && !_hasTargetValidator(route, 'query')
        && !hasPayload
    ) {
        let properties = _.cloneDeep(segment.resource.getResponseProperties());
        const keywordWhitelist = ['type', 'minimum', 'maximum',
            'maxLength', 'minLength', 'faker'];

        route.validate({
            type: 'object',
            additionalProperties: false,
            properties: _clearValidationKeywords(properties, ajv, keywordWhitelist),
        }, 'query');
    }

    //
    if (!_hasTargetValidator(route, 'params')) {
        let properties = {};
        route.$restfulness.querySegments.forEach(function(segment) {
            if (segment.isReduced()) {
                properties[segment.getPropertyName()] =
                    segment.getPropertySchema();
            }
        });

        if (Object.keys(properties).length) {
            route.validate({
                type: 'object',
                required: Object.keys(properties),
                additionalProperties: false,
                properties: properties
            }, 'params')
        }
    }

    //route has payload
    if (hasPayload && !_hasTargetValidator(route, 'body')) {
        let required = segment.resource.getRequiredProperties();
        let properties = _.cloneDeep(segment.resource.getProperties());
        let dynamicDefaults = segment.resource.getDynamicDefaults();
        let association;

        if (firstSegment !== segment && firstSegment) {
            association = segment.resource.getAssociation(firstSegment.resource);
        }

        if (route.options.type === 'put') {
            //validators for update routes should not apply defaults
            //nor any properties should be required
            if (!association || association.type !== 'MxM') {
                required.splice(0, required.length);
                _removeDefaults(properties);
                dynamicDefaults = {};
            }

            //eg.: PUT /users/:user_id/movies/:movie_id
            //aka. associate user with movie
            //accept additional pivot table properties if there are any
            if (association && association.type === 'MxM') {
                required = association.through.resource.getRequiredProperties();
                properties = _.cloneDeep(association.through.resource.getProperties());
                dynamicDefaults = association.through.resource.getDynamicDefaults();
                let localKey = association.through.localKey;
                let foreignKey = association.through.foreignKey;
                delete properties[localKey];
                delete properties[foreignKey];
                if (required.includes(localKey)) {
                    required.splice(required.indexOf(localKey), 1);
                }
                if (required.includes(foreignKey)) {
                    required.splice(required.indexOf(foreignKey), 1);
                }
            }
        } else if (association && association.type === '1x1') {
            //TODO make a unit test that will make sure the user of API cant overwrite
            //ids of associated resources that have been defined as part of the endpoint
            //in params by those defined in body
            //does not apply for put routes
            if (~required.indexOf(association.localKey)) {
                required.splice(required.indexOf(association.localKey), 1);
                delete properties[association.localKey];
            }
        }

        route.validate({
            type: 'object',
            dynamicDefaults: dynamicDefaults,
            required: required,
            additionalProperties: false,
            properties: properties
        }, 'body');
    }

    route.emit('after-validation-setup');
}

/**
 * @private
 * @param {Route} route
 * @return {undefined}
 */
function _acceptSortLimitOffsetParameters(route) {
    //TODO set minimum & maximum global defaults and allow to override them
    //on the route level
    route.validate({
        type: 'object',
        additionalProperties: true,
        properties: {
            _sort: {
                type: 'string',
                maxLength: config.getOrFail('sort:maxLength'),
                pattern: '^(-?[a-zA-Z0-9_]+,)*(-?[a-zA-Z0-9_]+){1}$',
                example: 'column,-other_column',
                $desc: 'comma delimited column list, prefixing column name with - means DESC ordering'
            },
            _limit: {
                type: 'integer',
                minimum: config.getOrFail('limit:minimum'),
                maximum: config.getOrFail('limit:maximum'),
                default: config.getOrFail('limit:default')
            },
            _offset: {
                type: 'integer',
                minimum: config.getOrFail('offset:minimum'),
                maximum: config.getOrFail('offset:maximum'),
                default: config.getOrFail('offset:default')
            }
        }
    }, 'query');

    //mark the internal middleware
    _.last(route.steps).$restfulness = true;

    route.step(
        '_restfulness_parse_sort_limit_offset',
        middlewares.parseSortLimitOffsetParametersMiddleware
    );
}


/**
 * @param {Route} route
 * @return {undefined}
 */
function _acceptEmbedParameter(route) {
    route.validate({
        type: 'object',
        additionalProperties: true,
        properties: {
            _embed: {
                type: 'string',
                maxLength: config.getOrFail('embed:maxLength'),
                pattern: '^[a-z0-9.,_]+$',
                example: 'resource_name,resource_name.property_name',
                $desc: 'comma delimited list of resources to eager load'
            }
        }
    }, 'query');

    //mark the internal middleware
    _.last(route.steps).$restfulness = true;

    route.step(
        '_restfulness_parse_embed_parameter',
        middlewares.parseEmbedParameterMiddleware
    );
}

/**
 * returns true if route contains user defined validator for given target
 * @param {Route} route
 * @param {String} target - query|params|body|headers
 * @private
 * @return {Boolean}
 */
function _hasTargetValidator(route, target) {
    for (let i = 0, len = route.steps.length; i < len; i++) {
        let step = route.steps[i];
        let validationSchemaProps = [];

        if (step.name === 'validator'
            && step.args
            && step.args[1] === target
            && !step.hasOwnProperty('$restfulness')
        ) {
            return true;
        }
    }
    return false;
}


/**
 * @param {Route} route
 * @private
 * @return {Boolean}
 */
function _hasResponseSchema(route) {
    if (route.description.responses[200]
        && route.description.responses[200].length
    ) {
        return true;
    }

    return false;
}


/**
 * @param {Route} route
 * @return {Object}
 */
function _getResponseSchema(route) {
    return route.description.responses[200][0].schema;
}

/**
 * @param {Route} route
 * @return {Boolean}
 */
function _isImplemented(route) {
    for (let i = 0, len = route.steps.length; i < len; i++) {
        let step = route.steps[i];
        if (step.name === 'main') {
            return true;
        }
    }
    return false;
}

/**
 * @param {Error} err
 * @throws {KnexError}
 */
function _transformKnexError(err) {

    // matches every error object which includes the Error.prototype
    // in it's prototype chain and at the same time the error object is not dirrect
    // instance of the Error
    if (Error.prototype.isPrototypeOf(Object.getPrototypeOf(err))) {
        throw err;
    }

    throw KnexError.buildFrom(err);
}

/**
 * @param {Object} properties
 * @param {Ajv} ajv validator instance
 * @param {Array<String>} except - collection of keywords to not remove
 * @return {Object}
 */
function _clearValidationKeywords(properties, ajv, except) {
    Object.keys(properties).forEach(function(prop) {
        let schema = properties[prop];
        if (schema.hasOwnProperty('$ref')) {
            let refSchema = ajv.getSchema(schema.$ref);
            if (typeof refSchema !== 'function') {
                return;
            }
            refSchema = _.cloneDeep(refSchema.schema);

            properties[prop] = Object.assign(
                _.pick(refSchema, except),
                _.pick(schema, except)
            );
        } else {
            properties[prop] = _.pick(schema, except);
        }
    });

    return properties;
}

/**
 * @param {Object} properties
 * @return {Object}
 */
function _removeDefaults(properties) {
    Object.keys(properties).forEach(function(prop) {
        let schema = properties[prop];
        if (schema.hasOwnProperty('default')) {
            delete schema.default;
        }
    });

    return properties;
}

/**
 * implementation assumes that route urls define maximum of two resources
 * @param {Route} route
 * @param {Array} params
 * @private
 * @return {String}
 */
function _getLocationHeader(route, params) {
    const router = route.Router;
    const app = router.App;
    const segments = route.$restfulness.querySegments;
    const lastSegment = segments.last();
    const pathParams = {};
    const keyName = lastSegment.resource.getKeyName();
    let resourceName = lastSegment.resource.getName();
    let getRoute;

    const routes = app.$getRoutesForResource(resourceName, 'get');

    for (let i = 0, len = routes.length; i < len; i++) {
        let otherSegments = routes[i].$restfulness.querySegments;
        if (otherSegments.length === segments.length
            && otherSegments.last().isReduced()
            && otherSegments.last().getOriginalPropertyName() === keyName
        ) {
            getRoute = routes[i];
            break;
        }
    }

    if (!getRoute) {
        getRoute = routes.find(function(route) {
            return route.$restfulness.querySegments.length === 1;
        });

        params = params.slice(-1);

        if (!getRoute) {
            return null;
        }
    }

    getRoute.$restfulness.querySegments.forEach(function(segment, index) {
        if (segment.isReduced()) {
            pathParams[segment.getPropertyName()] = params[index];
        }
    });

    return getRoute.getAbsoluteUrl(pathParams);
};

const _                      = require('lodash');
const Resource               = require('../resource.js');
const QuerySegmentCollection = require('../querySegmentCollection.js');
const utils                  = require('../utils.js');
const middlewares            = require('./middlewares.js');
const KnexError              = require('../error/knexError.js');
const config                 = require('../config.js');
const queryFilter            = require('../queryFilter.js');
const validator              = require('../validator.js');

module.exports._buildRoute = _buildRoute;
module.exports._settleRouteValidators = _settleRouteValidators;
module.exports._settleRouteResponseSchema = _settleRouteResponseSchema;
module.exports._hasResponseSchema = _hasResponseSchema;
module.exports._isImplemented = _isImplemented;
module.exports._acceptSortLimitOffsetParameters = _acceptSortLimitOffsetParameters;
module.exports._acceptFilterParameter = _acceptFilterParameter;
module.exports._acceptEmbedParameter = _acceptEmbedParameter;
module.exports._getResponseSchema = _getResponseSchema;
module.exports._transformKnexError = _transformKnexError;
module.exports._getLocationHeader = _getLocationHeader;
module.exports.reducesDatasetBy = reducesDatasetBy;

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

/*
 * limits allowed column values its possible to filter dataset by for DELETE, GET MANY routes
 * @example
 * route.reducesDatasetBy(['id', 'user.username']);
 *
 * @public
 * @name Route#reducesDatasetBy
 * @type {Function}
 * @this {Route}
 * @param {Array<String>} columns - empty array disables data filtering completely
 */
function reducesDatasetBy(columns) {
    const isValid = validator.validate({
        type: 'array',
        items: {
            type: 'string'
        }
    }, columns);

    if (!isValid) {
        throw validator.errors[0];
    }

    this.$restfulness.filterColumnWhitelist = columns;
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
        const allowedValidationKeywords = config.getOrFail('response:validationKeywordWhiteList');//TODO make unit tests for allowed keywords
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
    const segment = route.$restfulness.querySegments.last();
    const hasPayload = !!route.acceptedContentTypes().length;

    //a route which operates on collection of resources accepts query filter
    //parameters
    if (!segment.isReduced()
        && !_hasTargetValidator(route, 'query')
        && !hasPayload
    ) {
        _settleRouteQueryValidator(route, segment.resource);
    }

    //
    if (!_hasTargetValidator(route, 'params')) {
        _settleRouteParamsValidator(route);
    }

    //route has payload
    if (hasPayload && !_hasTargetValidator(route, 'body')) {
        _settleRouteBodyValidator(route);
    }

    route.emit('after-validation-setup');
}

/**
 * @param {Route} route
 * @param {Resource} resource
 * @return {undefined}
 */
function _settleRouteQueryValidator(route, resource) {
    const ajv = route.Router.App.getValidator();
    let filterColumnWhitelist = route.$restfulness.filterColumnWhitelist;

    /*
     * if the developer defined explicit whitelist of allowed values,
     * use it, if an empty array is provided query filtering will be disabled.
     * if the option was not set, then filtering by all response properties
     * will be enabled
     */
    if (filterColumnWhitelist instanceof Array) {
        if (!filterColumnWhitelist.length) {
            return;
        }
    } else if (_hasResponseSchema(route)) {
        filterColumnWhitelist = Object.keys(_.get(
           _getResponseSchema(route),
           'items.properties',
           {}
       ));
    } else {
        filterColumnWhitelist = Object.keys(resource.getResponseProperties());
    }

    let properties = {};
    filterColumnWhitelist.forEach(function(propName) {
        if (resource.hasProp(propName)) {
            properties[propName] = _.cloneDeep(resource.prop(propName));
        }
    });
    const keywordWhitelist = config.getOrFail('filter:validationKeywordWhiteList');

    route.validate({
        type: 'object',
        additionalProperties: false,
        properties: _clearValidationKeywords(properties, ajv, keywordWhitelist),
    }, 'query');
}


/**
 * @param {Route} route
 * @return {undefined}
 */
function _settleRouteParamsValidator(route) {
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

/**
 * @param {Route} route
 * @return {undefined}
 */
function _settleRouteBodyValidator(route) {
    const segment = route.$restfulness.querySegments.last();
    const firstSegment = route.$restfulness.querySegments[0];

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

/**
 * @private
 * @param {Route} route
 * @return {undefined}
 */
function _acceptSortLimitOffsetParameters(route) {
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

    //mark the internal validation middleware
    _.last(route.steps).$restfulness = true;

    route.step(
        '_restfulness_parse_sort_limit_offset',
        middlewares.parseSortLimitOffsetParametersMiddleware
    );
}

/**
 * @private
 * @param {Route} route
 * @return {undefined}
 */
function _acceptFilterParameter(route) {
    const columnWhitelist = [];
    const segment = route.$restfulness.querySegments.last();
    const filterColumnWhitelistOption = route.$restfulness.filterColumnWhitelist;

    /*
     * if the developer defined explicit whitelist of allowed values,
     * use it, if an empty array is provided _filter will be disabled.
     * if the option was not set, then filtering by all response properties
     * will be enabled
     */
    if (filterColumnWhitelistOption instanceof Array) {
        if (!filterColumnWhitelistOption.length) {
            return;
        }
        columnWhitelist.push.apply(columnWhitelist, filterColumnWhitelistOption)
    } else if (_hasResponseSchema(route)) {
        const responseSchema = _getResponseSchema(route);
        _.forOwn(responseSchema.items.properties, function(val, key, obj) {
            if (!_.isPlainObject(val)) {
                return;
            }

            if (val.type !== 'object') {
                columnWhitelist.push(key);
            } else if (Resource.registry.hasSingularName(key)) {
                const resource = Resource.registry.getBySingularName(key);
                if (segment.resource.hasAssociation(resource, '1x1')) {
                    _.forOwn(val.properties, function(subVal, subKey) {
                        columnWhitelist.push(`${key}.${subKey}`);
                    });
                }
            }
        });
    } else {
        columnWhitelist.push(segment.resource.getKeyName());
    }

    const middleware = route.$createValidatorMiddleware({
        type: 'object',
        additionalProperties: true,
        properties: {
            _filter: queryFilter.getJsonSchema(columnWhitelist),
        }
    }, 'query');

    const parserMiddleware = {
        name: '_restfulness_parse_filter',
        fn: middlewares.parseFilterParameterMiddleware
    };

    //mark the internal validation middleware
    middleware.$restfulness = true

    const index = route.steps.findIndex(function(step) {
        return step.name === 'validator';
    });

    route.steps.splice(index, 0, middleware, parserMiddleware);
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

    //mark the internal validation middleware
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

    if (!(err instanceof Error)) {
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

    //TODO bug - routes can be undefined
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

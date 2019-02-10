const Service    = require('bi-service');
const _          = require('lodash');
const Resource   = require('../resource.js');
const routeUtils = require('./route.js');
const sqlUtils   = require('../sqlUtils.js');

const RequestError = Service.error.RequestError;

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

    const querySegments = route.$restfulness.querySegments;
    const lastSegment = querySegments.last();
    const firstSegment = querySegments[0];

    /*
     * if route returns a collection of resources, enable pagination
     */
    if (!lastSegment.isReduced()) {
        routeUtils._acceptSortLimitOffsetParameters(route);
        route.Router.App.$setRoutesForResource(
            lastSegment.resource.getPluralName(),
            route,
            'get'
        );
    } else {
        route.Router.App.$setRoutesForResource(
            lastSegment.resource.getName(),
            route,
            'get'
        );
    }

    /*
     * Currently only 1x1 associations can be eager loaded
     * via the _embed query parameter
     */
    if (lastSegment.resource.hasAnyAssociationOfType('1x1')) {
        routeUtils._acceptEmbedParameter(route);
    }


    /*
     * give the user time to set route specific validators and then, during the
     * next tick, set the fallbacks
     */
    process.nextTick(function() {
        routeUtils._settleRouteValidators(route);
        routeUtils._settleRouteResponseSchema(route, !lastSegment.isReduced());

        //
        if (!routeUtils._isImplemented(route)) {
            if (querySegments.length === 1) {
                if (lastSegment.isReduced()) {
                    //eg. api/users/:id
                    route.main(getOneViaSingleResourceQuery);
                } else {
                    //eg. api/users
                    route.main(getManyViaSingleResourceQuery);
                }
            } else {
                const association = lastSegment.resource.getAssociation(
                    firstSegment.resource
                );

                if(lastSegment.isReduced()) {//eg. api/users/:id/movies/:id
                    switch (association.type) {
                        case 'MxM':
                            route.main(getOneViaManyToManyQuery);
                            break;
                        case '1xM':
                            route.main(getOneViaOneToManyQuery);
                            break;
                        case '1x1':
                            route.main(getOneViaOneToOneQuery);
                            break;
                    }
                } else {//eg. api/users/:id/movies
                    switch (association.type) {
                        case 'MxM':
                            route.main(getManyViaManyToManyQuery);
                            break;
                        case '1xM':
                            let msg = 'Endpoint pattern GET /@resource/:column/@resource' +
                                ' not supported for one to one relations';
                            throw new Error(msg);
                            break;
                        case '1x1':
                            route.main(getManyViaOneToOneQuery);
                            break;
                    }
                }
            }
        }
    });

    return route;
}

/**
 * implements routes matching url pattern: GET /api/@resource/:column
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function getOneViaSingleResourceQuery(req, res) {
    const knex = this.app.service.knex;
    const segment = this.route.$restfulness.querySegments.last();
    const resource = segment.resource;
    const localResourceName = resource.getTableName();
    const responseSchema = routeUtils._getResponseSchema(this.route);
    const embed = this.$restfulness && this.$restfulness.embed;

    const select = _.intersection(
        Object.keys(responseSchema.properties),
        Object.keys(resource.getResponseProperties())
    );
    const where = {};
    where[localResourceName + '.' + segment.getOriginalPropertyName()]
        = req.params[segment.getPropertyName()];

    const query = knex(localResourceName)
        .where(where);

    query.select(sqlUtils.generateKnexSelect(select, localResourceName));

    //eager load user defined associated resources
    query.modify(sqlUtils.withEagerLoad, embed, resource);

    return query.catch(routeUtils._transformKnexError).then(function(rows) {
        if (!rows.length) {
            throw new RequestError({
                message: `${resource.getName()} not found`,
                apiCode: `${resource.getName()}.notFound`
            });
        }

        embed && sqlUtils.unwrap(rows[0]);
        res.filter(rows[0]).json();
    });
}

/**
 * implements routes matching url pattern: GET /api/@resource/:column/@resource/:column
 * for resources having one to one relationship
 *
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function getOneViaOneToOneQuery(req, res) {
    const knex = this.app.service.knex;
    const firstSegment = this.route.$restfulness.querySegments[0];
    const lastSegment = this.route.$restfulness.querySegments.last();
    const resource = lastSegment.resource;
    const association = resource.getAssociation(firstSegment.resource);
    const tableName = resource.getTableName();
    const responseSchema = routeUtils._getResponseSchema(this.route);
    const embed = this.$restfulness && this.$restfulness.embed;

    const select = _.intersection(
        Object.keys(responseSchema.properties),
        Object.keys(resource.getResponseProperties())
    );
    const where = {};
    where[tableName + '.' + association.localKey]
        = req.params[firstSegment.getPropertyName()];
    where[tableName + '.' + lastSegment.getOriginalPropertyName()]
        = req.params[lastSegment.getPropertyName()];

    const query = knex(tableName).where(where);

    query.select(sqlUtils.generateKnexSelect(select, resource.getTableName()));

    //eager load user defined associated resources
    query.modify(sqlUtils.withEagerLoad, embed, resource);

    return query.catch(routeUtils._transformKnexError).then(function(rows) {
        if (!rows.length) {
            throw new RequestError({
                message: `${resource.getName()} not found`,
                apiCode: `${resource.getName()}.notFound`
            });
        }

        embed && sqlUtils.unwrap(rows[0]);
        res.filter(rows[0]).json();
    });
}

/**
 * implements routes matching url pattern: GET /api/@resource/:column/@resource/:column
 * for resources having one to many relationship
 *
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function getOneViaOneToManyQuery(req, res) {
    const knex = this.app.service.knex;
    const firstSegment = this.route.$restfulness.querySegments[0];
    const lastSegment = this.route.$restfulness.querySegments.last();
    const lastResource = lastSegment.resource;
    const association = lastResource.getAssociation(firstSegment.resource);
    const tableName = lastResource.getTableName();
    const joinTableName = firstSegment.resource.getTableName();
    const responseSchema = routeUtils._getResponseSchema(this.route);
    const embed = this.$restfulness && this.$restfulness.embed;

    const select = _.intersection(
        Object.keys(responseSchema.properties),
        Object.keys(lastResource.getResponseProperties())
    );
    const where = {};
    where[tableName + '.' + lastSegment.getOriginalPropertyName()]
        = req.params[lastSegment.getPropertyName()];
    where[joinTableName + '.' + firstSegment.getOriginalPropertyName()]
        = req.params[firstSegment.getPropertyName()];

    const query = knex(tableName)
        .innerJoin(
            joinTableName,
            tableName + '.' + association.localKey,
            joinTableName + '.' + association.foreignKey
        ).where(where);

    query.select(sqlUtils.generateKnexSelect(select, lastResource.getTableName()));

    //eager load user defined associated resources
    query.modify(sqlUtils.withEagerLoad, embed, lastResource);

    return query.catch(routeUtils._transformKnexError).then(function(rows) {
        if (!rows.length) {
            throw new RequestError({
                message: `${lastResource.getName()} not found`,
                apiCode: `${lastResource.getName()}.notFound`
            });
        }

        embed && sqlUtils.unwrap(rows[0]);
        res.filter(rows[0]).json();
    });
}

/**
 * implements routes matching url pattern: GET /api/@resource/:column/@resource/:column
 * for resources having many to many relationship
 *
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function getOneViaManyToManyQuery(req, res) {
    const knex = this.app.service.knex;
    const lastSegment = this.route.$restfulness.querySegments.last();
    const firstSegment = this.route.$restfulness.querySegments[0];
    const firstResource = firstSegment.resource;
    const secondResource = lastSegment.resource;
    const association = secondResource.getAssociation(firstSegment.resource);
    const pivotTableName = association.through.resource.getTableName();
    const responseSchema = routeUtils._getResponseSchema(this.route);
    const embed = this.$restfulness && this.$restfulness.embed;

    const select = _.intersection(
        Object.keys(responseSchema.properties),
        Object.keys(secondResource.getResponseProperties())
    );
    const where = {};
    where[secondResource.getTableName() + '.' + lastSegment.getOriginalPropertyName()]
        = req.params[lastSegment.getPropertyName()];
    where[firstResource.getTableName() + '.' + firstSegment.getOriginalPropertyName()]
        = req.params[firstSegment.getPropertyName()];

    const query = knex(pivotTableName)
        .innerJoin(
            secondResource.getTableName(),
            pivotTableName + '.' + association.through.localKey,
            secondResource.getTableName() + '.' + association.localKey
        )
        .innerJoin(
            firstResource.getTableName(),
            pivotTableName + '.' + association.through.foreignKey,
            firstResource.getTableName() + '.' + association.foreignKey
        )
        .where(where);

    query.select(sqlUtils.generateKnexSelect(select, secondResource.getTableName()));

    //eager load user defined associated resources
    query.modify(sqlUtils.withEagerLoad, embed, secondResource);

    return query.catch(routeUtils._transformKnexError).then(function(rows) {
        if (!rows.length) {
            throw new RequestError({
                message: `${secondResource.getName()} not found`,
                apiCode: `${secondResource.getName()}.notFound`
            });
        }

        embed && sqlUtils.unwrap(rows[0]);
        res.filter(rows[0]).json();
    });
}

/**
 * implements routes matching url pattern: GET /api/@resource/:column/@resource
 * for resources having many to many relationship
 *
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function getManyViaManyToManyQuery(req, res) {
    const knex = this.app.service.knex;
    const lastSegment = this.route.$restfulness.querySegments.last();
    const firstSegment = this.route.$restfulness.querySegments[0];
    const firstResource = firstSegment.resource;
    const secondResource = lastSegment.resource;
    const association = secondResource.getAssociation(firstSegment.resource);
    const pivotTableName = association.through.resource.getTableName();
    const responseSchema = routeUtils._getResponseSchema(this.route);

    if (this.$restfulness) {
        var embed = this.$restfulness.embed;
        var limit = this.$restfulness.limit;
        var offset = this.$restfulness.offset;
        var order = this.$restfulness.order;
    }

    const select = _.intersection(
        Object.keys(responseSchema.items.properties),
        Object.keys(secondResource.getResponseProperties())
    );
    const where = req.query;
    where[firstResource.getTableName() + '.' + firstSegment.getOriginalPropertyName()]
        = req.params[firstSegment.getPropertyName()];

    const query = knex(pivotTableName)
        .innerJoin(
            secondResource.getTableName(),
            pivotTableName + '.' + association.through.localKey,
            secondResource.getTableName() + '.' + association.localKey
        )
        .innerJoin(
            firstResource.getTableName(),
            pivotTableName + '.' + association.through.foreignKey,
            firstResource.getTableName() + '.' + association.foreignKey
        )
        .where(where);

    const countQuery = query.clone().count('* as count');

    query.select(sqlUtils.generateKnexSelect(select, secondResource.getTableName()));

    //eager load user defined associated resources
    query.modify(sqlUtils.withEagerLoad, embed, secondResource);
    query.modify(sqlUtils.withPagination, limit, offset);

    //TODO needs updated bi-service-knex package to use knex@0.16.3
    //TODO make it possible for the user to define/override ordering
    //strategy by custom more performant one
    query.modify(sqlUtils.withOrderBy, order);

    return countQuery.catch(routeUtils._transformKnexError).then(function(count) {
        return query.catch(routeUtils._transformKnexError).then(function(rows) {
            embed && sqlUtils.unwrap(rows);

            res.setPaginationHeaders({
                limit: limit,
                offset: offset,
                count: count[0].count
            });
            res.filter(rows).json();
        });
    })
}


/**
 * implements routes matching url pattern: GET /api/@resource/:column/@resource
 * for resources having one to one relationship
 *
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function getManyViaOneToOneQuery(req, res) {
    const knex = this.app.service.knex;
    const lastSegment = this.route.$restfulness.querySegments.last();
    const firstSegment = this.route.$restfulness.querySegments[0];
    const firstResource = firstSegment.resource;
    const secondResource = lastSegment.resource;
    const association = secondResource.getAssociation(firstSegment.resource);
    const tableName = secondResource.getTableName();
    const responseSchema = routeUtils._getResponseSchema(this.route);

    if (this.$restfulness) {
        var embed = this.$restfulness.embed;
        var limit = this.$restfulness.limit;
        var offset = this.$restfulness.offset;
        var order = this.$restfulness.order;
    }

    const select = _.intersection(
        Object.keys(responseSchema.items.properties),
        Object.keys(secondResource.getResponseProperties())
    );
    const where = req.query;

    const query = knex(tableName).where(where);

    if (firstSegment.getOriginalPropertyName() !== firstResource.getKeyName()) {
        query.innerJoin(
            firstResource.getTableName(),
            tableName + '.' + association.localKey,
            firstResource.getTableName() + '.' + association.foreignKey
        );
        where[tableName + '.' + firstSegment.getOriginalPropertyName()]
            = req.params[firstSegment.getPropertyName()];
    } else {
        where[tableName + '.' + association.localKey]
            = req.params[firstSegment.getPropertyName()];
    }

    const countQuery = query.clone().count('* as count');

    query.select(sqlUtils.generateKnexSelect(select, secondResource.getTableName()));

    //eager load user defined associated resources
    query.modify(sqlUtils.withEagerLoad, embed, secondResource);
    query.modify(sqlUtils.withPagination, limit, offset);

    //TODO needs updated bi-service-knex package to use knex@0.16.3
    //TODO make it possible for the user to define/override ordering
    //strategy by custom more performant one
    query.modify(sqlUtils.withOrderBy, order);

    return countQuery.catch(routeUtils._transformKnexError).then(function(count) {
        return query.catch(routeUtils._transformKnexError).then(function(rows) {
            embed && sqlUtils.unwrap(rows);

            res.setPaginationHeaders({
                limit: limit,
                offset: offset,
                count: count[0].count
            });
            res.filter(rows).json();
        });
    })
}

/**
 * implements routes matching url pattern: GET /api/@resource
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function getManyViaSingleResourceQuery(req, res) {
    const knex = this.app.service.knex;
    const segment = this.route.$restfulness.querySegments.last();
    const resource = segment.resource;
    const localResourceName = resource.getTableName();
    const responseSchema = routeUtils._getResponseSchema(this.route);

    if (this.$restfulness) {
        var embed = this.$restfulness.embed;
        var limit = this.$restfulness.limit;
        var offset = this.$restfulness.offset;
        var order = this.$restfulness.order;
    }

    const select = _.intersection(
        Object.keys(responseSchema.items.properties),
        Object.keys(resource.getResponseProperties())
    );

    const query = knex(localResourceName).where(req.query);
    const countQuery = query.clone().count('* as count');

    query.select(sqlUtils.generateKnexSelect(select, localResourceName));

    //eager load user defined associated resources
    query.modify(sqlUtils.withEagerLoad, embed, resource);

    query.modify(sqlUtils.withPagination, limit, offset);

    //TODO needs updated bi-service-knex package to use knex@0.16.3
    //TODO make it possible for the user to define/override ordering
    //strategy by custom more performant one
    query.modify(sqlUtils.withOrderBy, order);

    return countQuery.catch(routeUtils._transformKnexError).then(function(count) {
        return query.catch(routeUtils._transformKnexError).then(function(rows) {
            embed && sqlUtils.unwrap(rows);

            res.setPaginationHeaders({
                limit: limit,
                offset: offset,
                count: count[0].count
            });
            res.filter(rows).json();
        });
    })
}

const _                  = require('lodash');
const routeUtils         = require('./route.js');
const Created201Response = require('../error/created201Response.js');
const sqlUtils           = require('../sqlUtils.js');

module.exports = put;

/**
 * @param {String} [url]
 * @param {Object} [options] - route options
 * @this {Router}
 *
 * @return {Route}
 */
function put(url, options) {
    options = options || {};

    const route = routeUtils._buildRoute.call(this, Object.assign(options, {
        url: url,
        type: 'put'
    }));

    const querySegments = route.$restfulness.querySegments;
    const lastSegment = querySegments.last();
    const firstSegment = querySegments[0];

    /*
     * give the user time to set route specific validators and then, during the
     * next tick, set the fallbacks
     */
    process.nextTick(function() {
        routeUtils._settleRouteValidators(route);

        if (!routeUtils._isImplemented(route)) {
            if (!lastSegment.isReduced()) {
                throw new Error('Not supported');
            }
            route.description.summary = `update a ${lastSegment.resource.getName()}`;

            if (querySegments.length === 1) {
                //eg. api/users/:id
                routeUtils._settleRouteResponseSchema(route);
                route.main(updateViaSingleResourceQuery);
            } else if(firstSegment.isReduced()) {
                //eg. api/users/:user_id/posts/:post_id
                const association = lastSegment.resource.getAssociation(
                    firstSegment.resource
                );

                switch (association.type) {
                    case 'MxM':
                        route.respondsWith(Created201Response);
                        route.description.summary = `associate ` +
                            `a ${firstSegment.resource.getName()} with a ` +
                            lastSegment.resource.getName();

                        if (firstSegment.getOriginalPropertyName() === firstSegment.resource.getKeyName()
                            && lastSegment.getOriginalPropertyName() === lastSegment.resource.getKeyName()
                        ) {
                            route.main(updateViaManyToManyQuery);
                        } else {
                            throw new Error('Not supported');
                        }
                        break;
                    case '1xM':
                        throw new Error('Not supported');
                        break;
                    case '1x1':
                        routeUtils._settleRouteResponseSchema(route);
                        if (firstSegment.getOriginalPropertyName() === firstSegment.resource.getKeyName()) {
                            route.main(updateViaOneToOneQuery);
                        } else {
                            //route.main(updateViaDistantOneToOneQuery);
                        }
                        break;
                }
            } else {
                throw new Error('Not supported');
            }
        }
    });

    return route;
}


/**
 * implements routes matching url pattern:
 * PUT /api/@resource/{key}/@resource/{key}
 *
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function updateViaOneToOneQuery(req, res) {
    const route = this.route;
    const knex = this.app.service.resourceManager.get('knex');
    const lastSegment = route.$restfulness.querySegments.last();
    const firstSegment = route.$restfulness.querySegments[0];
    const firstResource = firstSegment.resource;
    const secondResource = lastSegment.resource;
    const association = secondResource.getAssociation(firstResource);
    const tableName = secondResource.getTableName();
    const responseSchema = routeUtils._getResponseSchema(route);

    const data = req.body;
    const where = {};
    const returning = _.intersection(
        Object.keys(responseSchema.properties),
        Object.keys(secondResource.getResponseProperties())
    );

    where[lastSegment.getOriginalPropertyName()] =
        req.params[lastSegment.getPropertyName()];
    where[association.localKey] =
        req.params[firstSegment.getPropertyName()];

    return knex.transaction(function(trx) {
        const query = trx(tableName).where(where);

        query.modify(sqlUtils.withTimestamps, secondResource);

        if (_.isEmpty(data)) {
            //if there is nothing to update return current state of resource
            return query
                .select(returning)
                .catch(routeUtils._transformKnexError)
                .then(_emitBeforeResponseEvent(route, req))
                .then(postProcess);
        }

        query.update(data).returning(returning);

        return route.emitAsync('before-query', req, query).then(function() {
            return query.catch(routeUtils._transformKnexError);
        }).then(function(rows) {
            if (!_.isPlainObject(rows[0])) {
                if (data.hasOwnProperty(association.localKey)) {
                    where[association.localKey] = data[association.localKey];
                }
                return trx(tableName)
                    .where(where)
                    .select(returning)
                    .catch(routeUtils._transformKnexError);
            }
            return rows;
        });
    }).then(_emitBeforeResponseEvent(route, req)).then(postProcess);

    function postProcess(rows) {
        res.filter(rows[0]).json();
    }
}

/**
 * implements routes matching url pattern:
 * PUT /api/@resource/:{key}/@resource/:{key}
 *
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function updateViaManyToManyQuery(req, res) {
    const route = this.route;
    const knex = this.app.service.resourceManager.get('knex');
    const lastSegment = route.$restfulness.querySegments.last();
    const firstSegment = route.$restfulness.querySegments[0];
    const firstResource = firstSegment.resource;
    const secondResource = lastSegment.resource;
    const association = secondResource.getAssociation(firstResource);
    const tableName = association.through.resource.getTableName();

    const data = req.body || {};

    data[association.through.localKey] =
        req.params[lastSegment.getPropertyName()];
    data[association.through.foreignKey] =
        req.params[firstSegment.getPropertyName()];

    return knex.transaction(function(trx) {

        const query = trx.insert(data).into(tableName);
        query.modify(sqlUtils.withTimestamps, association.through.resource);

        return route.emitAsync('before-query', req, query).then(function() {
            return query.catch(routeUtils._transformKnexError);
        })
    }).then(_emitBeforeResponseEvent(route, req)).then(postProcess)

    function postProcess(rows) {
        const locationParams = [
            data[association.through.foreignKey],
            data[association.through.localKey]
        ];
        const location =  routeUtils._getLocationHeader(route, locationParams);
        if (location) {
            res.setHeader('Location', location);
        }
        res.status(201);
        res.end();
    }
}

/**
 * implements routes matching url pattern:PUT /api/@resource/:column
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function updateViaSingleResourceQuery(req, res) {
    const route = this.route;
    const knex = this.app.service.resourceManager.get('knex');
    const segment = route.$restfulness.querySegments.last();
    const resource = segment.resource;
    const tableName = resource.getTableName();
    const responseSchema = routeUtils._getResponseSchema(route);

    const data = req.body;
    const where = {};
    const returning = _.intersection(
        Object.keys(responseSchema.properties),
        Object.keys(resource.getResponseProperties())
    );

    where[segment.getOriginalPropertyName()] =
        req.params[segment.getPropertyName()];

    return knex.transaction(function(trx) {
        const query = trx(tableName).where(where);
        query.modify(sqlUtils.withTimestamps, resource);

        if (_.isEmpty(data)) {
            //if there is nothing to update return current state of resource
            return query
                .select(returning)
                .catch(routeUtils._transformKnexError)
                .then(_emitBeforeResponseEvent(route, req))
                .then(postProcess);
        }

        query.update(data).returning(returning);
        return route.emitAsync('before-query', req, query).then(function() {
            return query.catch(routeUtils._transformKnexError);
        }).then(function(rows) {
            if (!_.isPlainObject(rows[0])) {
                if (segment.getOriginalPropertyName() !== resource.getKeyName()
                    && data.hasOwnProperty(segment.getOriginalPropertyName())
                ) {
                    where[segment.getOriginalPropertyName()] =
                        data[segment.getOriginalPropertyName()];
                }
                return trx(tableName)
                    .where(where)
                    .select(returning)
                    .catch(routeUtils._transformKnexError);
            }
            return rows;
        });
    }).then(_emitBeforeResponseEvent(route, req)).then(postProcess);

    function postProcess(rows) {
        res.filter(rows[0]).json();
    }
}

/**
 * @private
 * @param {Route} route
 * @param {Req} req
 * @return {Function}
 */
function _emitBeforeResponseEvent(route, req) {
    return function(rows) {
        return route.emitAsync('before-response', req, rows[0]).return(rows);
    }
}

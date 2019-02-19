const Service = require('bi-service');
const routeUtils = require('./route.js');
const RequestError = Service.error.RequestError;
const Created201Response = require('../error/created201Response.js');
const sqlUtils   = require('../sqlUtils.js');

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

    const route = routeUtils._buildRoute.call(this, Object.assign(options, {
        url: url,
        type: 'post'
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
            route.respondsWith(Created201Response);

            if (querySegments.length === 1) {
                //eg. api/users OR api/users/:id
                route.main(createViaSingleResourceQuery);
            } else if(firstSegment.isReduced()) {
                //eg. api/users/:id/posts OR api/users/:user_id/posts/:post_id
                const association = lastSegment.resource.getAssociation(
                    firstSegment.resource
                );

                switch (association.type) {
                    case 'MxM':
                        if (firstSegment.getOriginalPropertyName() === firstSegment.resource.getKeyName()) {
                            route.main(createViaManyToManyQuery);
                        } else {
                            route.main(createViaDistantManyToManyQuery);
                        }
                        break;
                    case '1xM':
                        throw new Error('Not implemented');
                        break;
                    case '1x1':
                        if (firstSegment.getOriginalPropertyName() === firstSegment.resource.getKeyName()) {
                            route.main(createViaOneToOneQuery);
                        } else {
                            route.main(createViaDistantOneToOneQuery);
                        }
                        break;
                }
            } else {
                throw new Error('Not implemented');
            }
        }
    });

    return route;
}

/**
 * implements routes matching url pattern:
 * POST /api/@resource/:id/@resource
 * or
 * POST /api/@resource/:id/@resource/:column
 *
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function createViaOneToOneQuery(req, res) {
    const route = this.route;
    const knex = this.app.service.knex;
    const lastSegment = route.$restfulness.querySegments.last();
    const firstSegment = route.$restfulness.querySegments[0];
    const firstResource = firstSegment.resource;
    const secondResource = lastSegment.resource;
    const association = secondResource.getAssociation(firstResource);
    const tableName = secondResource.getTableName();

    const data = req.body;

    if (lastSegment.isReduced()) {
        data[lastSegment.getOriginalPropertyName()] =
            req.params[lastSegment.getPropertyName()];
    }

    data[association.localKey] = req.params[firstSegment.getPropertyName()];

    const query = knex(tableName);
    query.modify(sqlUtils.withTimestamps, secondResource);

    return query
    .insert(data)
    .returning(secondResource.getKeyName())
    .catch(routeUtils._transformKnexError)
    .then(function (rows) {
        const locationParams = [data[association.localKey], rows[0]];
        const location =  routeUtils._getLocationHeader(route, locationParams);
        if (location) {
            res.setHeader('Location', location);
        }
        res.status(201);
        res.end();
    });

}

/**
 * implements routes matching url pattern:
 * POST /api/@resource/:column/@resource
 * or
 * POST /api/@resource/:column/@resource/:column
 *
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function createViaDistantOneToOneQuery(req, res) {
    const route = this.route;
    const knex = this.app.service.knex;
    const lastSegment = route.$restfulness.querySegments.last();
    const firstSegment = route.$restfulness.querySegments[0];
    const firstResource = firstSegment.resource;
    const secondResource = lastSegment.resource;
    const association = secondResource.getAssociation(firstResource);
    const tableName = secondResource.getTableName();

    const data = req.body;

    if (lastSegment.isReduced()) {
        data[lastSegment.getOriginalPropertyName()] =
            req.params[lastSegment.getPropertyName()];
    }

    return knex.transaction(function(query) {
        return query
            .select(association.foreignKey)
            .where(
                firstSegment.getOriginalPropertyName(),
                req.params[firstSegment.getPropertyName()]
            )
            .from(firstResource.getTableName()).then(function(rows) {
                if (!rows.length) {
                    throw new RequestError({
                        message: firstResource.getName() + ' not found',
                        apiCode: firstResource.getName() + '.notFound'
                    });
                }

                data[association.localKey] = rows[0][association.foreignKey];

                const q = query.insert(data);
                q.modify(sqlUtils.withTimestamps, secondResource);
                return q.into(tableName)
                    .returning(secondResource.getKeyName())
                    .catch(routeUtils._transformKnexError)
                    .then(postProcess);
            })
    });

    function postProcess(rows) {
        const locationParams = [data[association.localKey], rows[0]];
        const location =  routeUtils._getLocationHeader(route, locationParams);
        if (location) {
            res.setHeader('Location', location);
        }
        res.status(201);
        res.end();
    }
}

/**
 * implements routes matching url pattern:
 * POST /api/@resource/:column/@resource
 * or
 * POST /api/@resource/:{key}/@resource/:column
 *
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function createViaManyToManyQuery(req, res) {
    const route = this.route;
    const knex = this.app.service.knex;
    const lastSegment = route.$restfulness.querySegments.last();
    const firstSegment = route.$restfulness.querySegments[0];
    const firstResource = firstSegment.resource;
    const secondResource = lastSegment.resource;
    const association = secondResource.getAssociation(firstResource);
    const tableName = secondResource.getTableName();

    const data = req.body;
    const pivotData = {};

    if (lastSegment.isReduced()) {
        data[lastSegment.getOriginalPropertyName()] =
            req.params[lastSegment.getPropertyName()];
    }

    return knex.transaction(function(trx) {
        const query = trx.insert(data);
        query.modify(sqlUtils.withTimestamps, secondResource);

        return query
            .into(tableName)
            .returning(secondResource.getKeyName())
            .catch(routeUtils._transformKnexError)
            .then(function(rows) {
                pivotData[association.through.localKey] = rows[0];
                pivotData[association.through.foreignKey]
                    = req.params[firstSegment.getOriginalPropertyName()];

                const query = trx.insert(pivotData);
                query.modify(sqlUtils.withTimestamps, association.through.resource);

                return query
                    .into(association.through.resource.getTableName())
                    .returning(association.through.resource.getKeyName())
                    .catch(routeUtils._transformKnexError)
            }).then(postProcess);
    }).catch(routeUtils._transformKnexError);

    function postProcess(rows) {
        const locationParams = [
            pivotData[association.through.foreignKey],
            pivotData[association.through.localKey]
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
 * implements routes matching url pattern:
 * POST /api/@resource/:column/@resource
 * or
 * POST /api/@resource/:column/@resource/:column
 *
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function createViaDistantManyToManyQuery(req, res) {
    const route = this.route;
    const knex = this.app.service.knex;
    const lastSegment = route.$restfulness.querySegments.last();
    const firstSegment = route.$restfulness.querySegments[0];
    const firstResource = firstSegment.resource;
    const secondResource = lastSegment.resource;
    const association = secondResource.getAssociation(firstResource);
    const tableName = secondResource.getTableName();

    const data = req.body;
    const pivotData = {};
    let associationForeignKeyValue;

    if (lastSegment.isReduced()) {
        data[lastSegment.getOriginalPropertyName()] =
            req.params[lastSegment.getPropertyName()];
    }

    return knex.transaction(function(trx) {
        return trx
            .select(association.foreignKey)
            .where(
                firstSegment.getOriginalPropertyName(),
                req.params[firstSegment.getPropertyName()]
            )
            .from(firstResource.getTableName())
            .catch(routeUtils._transformKnexError)
            .then(function(rows) {
                if (!rows.length) {
                    throw new RequestError({
                        message: firstResource.getName() + ' not found',
                        apiCode: firstResource.getName() + '.notFound'
                    });
                }

                associationForeignKeyValue = rows[0][association.foreignKey];

                const query = trx.insert(data);
                query.modify(sqlUtils.withTimestamps, secondResource);

                return query.into(tableName)
                    .returning(secondResource.getKeyName())
                    .catch(routeUtils._transformKnexError)
            }).then(function(rows) {
                pivotData[association.through.localKey] = rows[0];
                pivotData[association.through.foreignKey]
                    = associationForeignKeyValue;

                const query = trx.insert(pivotData);
                query.modify(sqlUtils.withTimestamps, association.through.resource);

                return query.into(association.through.resource.getTableName())
                    .returning(association.through.resource.getKeyName())
                    .catch(routeUtils._transformKnexError)
            }).then(postProcess);
    }).catch(routeUtils._transformKnexError);

    function postProcess(rows) {
        const locationParams = [
            pivotData[association.through.foreignKey],
            pivotData[association.through.localKey]
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
 * implements routes matching url pattern:POST /api/@resource/:column
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function createViaSingleResourceQuery(req, res) {
    const route = this.route;
    const knex = this.app.service.knex;
    const segment = route.$restfulness.querySegments.last();
    const resource = segment.resource;
    const tableName = resource.getTableName();

    const data = req.body;

    if (segment.isReduced()) {
        data[segment.getOriginalPropertyName()] =
            req.params[segment.getPropertyName()];
    }

    const query = knex(tableName).insert(data);
    query.modify(sqlUtils.withTimestamps, resource);

    return query
    .returning(resource.getKeyName())
    .catch(routeUtils._transformKnexError)
    .then(function(rows) {
        const location =  routeUtils._getLocationHeader(route, rows);
        if (location) {
            res.setHeader('Location', location);
        }
        res.status(201);
        res.end();
    });
}

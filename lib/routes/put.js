const _                  = require('lodash');
const routeUtils         = require('./route.js');
const Created201Response = require('../error/created201Response.js');

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
    const knex = this.app.service.knex;
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

    const query = knex(tableName).where(where);

    if (_.isEmpty(data)) {
        //if there is nothing to update return current state of resource
        return query
            .select(returning)
            .catch(routeUtils._transformKnexError)
            .then(postProcess);
    }

    return query
    .update(data)
    .returning(returning)
    .catch(routeUtils._transformKnexError)
    .then(function(rows) {
        if (!_.isPlainObject(rows[0])) {
            if (data.hasOwnProperty(association.localKey)) {
                where[association.localKey] = data[association.localKey];
            }
            return knex(tableName)
                .where(where)
                .select(returning)
                .catch(routeUtils._transformKnexError);
        }
        return rows;
    }).then(postProcess);

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
    const knex = this.app.service.knex;
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

    return knex.transaction(function(query) {
        return query
            .insert(data)
            .into(tableName)
            .catch(routeUtils._transformKnexError)
            .then(postProcess);
    }).catch(routeUtils._transformKnexError);

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
    const knex = this.app.service.knex;
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

    const query = knex(tableName).where(where);

    if (_.isEmpty(data)) {
        //if there is nothing to update return current state of resource
        return query
            .select(returning)
            .catch(routeUtils._transformKnexError)
            .then(postProcess);
    }

    return query
    .update(data)
    .returning(returning)
    .catch(routeUtils._transformKnexError)
    .then(function(rows) {
        if (!_.isPlainObject(rows[0])) {
            if (segment.getOriginalPropertyName() !== resource.getKeyName()
                && data.hasOwnProperty(segment.getOriginalPropertyName())
            ) {
                where[segment.getOriginalPropertyName()] =
                    data[segment.getOriginalPropertyName()];
            }
            return knex(tableName)
                .where(where)
                .select(returning)
                .catch(routeUtils._transformKnexError);
        }
        return rows;
    }).then(postProcess);

    function postProcess(rows) {
        res.filter(rows[0]).json();
    }
}

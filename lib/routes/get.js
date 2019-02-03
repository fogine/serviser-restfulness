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

    /*
     * if route returns a collection of resources, enable pagination
     */
    if (!lastSegment.isReduced()) {
        routeUtils._acceptSortLimitOffsetParameters(route);
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
    const localResourceName = resource.getPluralName();
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
    if (_.isPlainObject(embed)) {
        sqlUtils.eagerLoad(embed, query, resource);
    }

    return query.then(function(rows) {
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
 * implements routes matching url pattern: GET /api/@resource
 * @param {Req} req
 * @param {Res} res
 * @this {Object} request context object
 */
function getManyViaSingleResourceQuery(req, res) {
    const knex = this.app.service.knex;
    const segment = this.route.$restfulness.querySegments.last();
    const resource = segment.resource;
    const localResourceName = resource.getPluralName();
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

    const countQuery = query.clone();

    query.select(sqlUtils.generateKnexSelect(select, localResourceName));

    //eager load user defined associated resources
    if (_.isPlainObject(embed)) {
        sqlUtils.eagerLoad(embed, query, resource);
    }

    if (typeof limit === 'number' && limit > 0) {
        query.limit(limit);
    }

    if (typeof offset === 'number' && offset > 0) {
        query.offset(offset);
    }

    if (order) {
        //TODO needs updated bi-service-knex package to use knex@0.16.3
        query.orderBy(order);
    }

    return countQuery.count('* as count').then(function(count) {
        return query.then(function(rows) {
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

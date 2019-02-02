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
            //eg. api/users/:id
            if (querySegments.length === 1 && lastSegment.isReduced()) {
                route.main(getOneViaSingleResourceQuery);
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

    let select = _.intersection(
        Object.keys(responseSchema.properties),
        Object.keys(resource.getResponseProperties())
    );
    const where = {};
    where[localResourceName + '.' + segment.getOriginalPropertyName()]
        = req.params[segment.getPropertyName()];

    const query = knex(localResourceName)
        .where(where);

    //
    if (_.isPlainObject(embed)) {
        select = sqlUtils.generateKnexSelect(select, localResourceName);

        Object.keys(embed).forEach(function(pluralResourceName) {
            const association = resource.getAssociation(pluralResourceName);
            let embededResource =
                Resource.registry.getByPluralName(pluralResourceName);
            let _additionalSelect;

            if (embed[pluralResourceName].length) {
                _additionalSelect =
                    sqlUtils.generateKnexSelect(
                        embed[pluralResourceName],
                        pluralResourceName,
                        embededResource.getName()
                    );
            } else {
                _additionalSelect =
                    sqlUtils.generateKnexSelect(
                        Object.keys(embededResource.getResponseProperties()),
                        pluralResourceName,
                        embededResource.getName()
                    );
            }

            Object.assign(select, _additionalSelect);

            query.leftJoin(
                pluralResourceName,
                `${localResourceName}.${association.localKey}`,
                `${pluralResourceName}.${association.foreignKey}`
            );
        });
    }

    query.select(select);

    return query.then(function(rows) {
        if (!rows.length) {
            throw new RequestError({
                message: `${resource.getName()} not found`,
                apiCode: `${resource.getName()}.notFound`
            });
        }

        sqlUtils.unwrap(rows[0]);
        res.filter(rows[0]).json();
    });
}

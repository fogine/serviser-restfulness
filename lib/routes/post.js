const routeUtils = require('./route.js');

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
        routeUtils._settleRouteResponseSchema(route);

        if (!routeUtils._isImplemented(route)) {
            if (querySegments.length === 1) {
                //eg. api/users OR api/users/:id
                route.main(createViaSingleResourceQuery);
            } else {
                //eg. api/users/:id/posts OR api/users/:user_id/posts/:post_id
                const association = lastSegment.resource.getAssociation(
                    firstSegment.resource
                );

                switch (association.type) {
                    case 'MxM':
                        //route.main(getOneViaManyToManyQuery);
                        break;
                    case '1xM':
                        //route.main(getOneViaOneToManyQuery);
                        break;
                    case '1x1':
                        //route.main(getOneViaOneToOneQuery);
                        break;
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
function createViaSingleResourceQuery(req, res) {
    const route = this.route;
    const knex = this.app.service.knex;
    const segment = route.$restfulness.querySegments.last();
    const resource = segment.resource;
    const tableName = resource.getPluralName();

    const data = req.body;

    if (segment.isReduced()) {
        data[segment.getOriginalPropertyName()] =
            req.params[segment.getPropertyName()];
    }

    const query = knex(tableName).insert(data);

    return query.returning(resource.getKeyName()).then(function(rows) {
        const location =  _getLocationHeader(route, rows);
        if (location) {
            res.setHeader('Location', location);
        }
        res.status(201);
        res.end();
    });
}

/**
 * @param {Route} route
 * @param {Array} params
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

    const _segments = segments.slice(0, -1);
    for (let i = 0, len = routes.length; i < len; i++) {
        let otherSegments = routes[i].$restfulness.querySegments;
        if (otherSegments.slice(0, -1).equals(_segments)) {
            if (otherSegments.last().isReduced()
                && otherSegments.last().getOriginalPropertyName() === keyName
            ) {
                getRoute = routes[i];
                break;
            }
        }
    }

    if (!getRoute) {
        return null;
    }

    getRoute.$restfulness.querySegments.forEach(function(segment, index) {
        if (segment.isReduced()) {
            pathParams[segment.getPropertyName()] = params[index];
        }
    });

    return getRoute.getAbsoluteUrl(pathParams);
};

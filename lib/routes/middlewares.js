const _  = require('lodash');
const RequestError = require('bi-service').error.RequestError;
const Resource = require('../resource.js');
const routeUtils = require('../routes/route.js');


module.exports.parseEmbedParameterMiddleware = parseEmbedParameterMiddleware;
module.exports.parseSortLimitOffsetParametersMiddleware = parseSortLimitOffsetParametersMiddleware;
module.exports.parseFilterParameterMiddleware = parseFilterParameterMiddleware;

/**
 * @param {Req} req
 */
function parseEmbedParameterMiddleware(req) {

    if (req.query._embed) {
        const lastSegment = this.route.$restfulness.querySegments.last();
        const responseSchema = routeUtils._getResponseSchema(this.route);
        const resource = lastSegment.resource;
        let responseProperties;

        if (lastSegment.isReduced()) {
            responseProperties = responseSchema.properties;
        } else {
            responseProperties = responseSchema.items.properties;
        }

        const embed = {};
        _setRestfulnessReqContext.call(this, {
            embed: embed
        });


        let paths = req.query._embed.split(',');
        paths.forEach(function(p) {
            //strip trailing & leading dot characters
            p = p.replace(/^\.?(.*)\.?$/, '$1');
            let props = p.split('.');
            let assocResource = _getAssociatedResource(resource, props[0]);
            if (!(assocResource instanceof Resource)
                || !responseProperties.hasOwnProperty(props[0])
                || _.isEmpty(_.get(responseProperties, [props[0], 'properties']))
            ) {
                throw new RequestError(`Can not embed ${props[0]}. Invalid _embed resource.`);
            }

            if (!embed.hasOwnProperty(assocResource.getPluralName())) {
                embed[assocResource.getPluralName()] = [];
            }

            if (props.length > 1) {
                if (assocResource.hasProp(props[1])
                    && _.has(responseProperties, [props[0], 'properties', props[1]])
                ) {
                    embed[assocResource.getPluralName()].push(props[1]);
                } else {
                    throw new RequestError(
                        `Can not embed ${p}. Invalid _embed resource.`
                    );
                }
            }
        }, this);
    }
}


/**
 * @param {Req} req
 * @private
 */
function parseSortLimitOffsetParametersMiddleware(req) {
    const responseSchema = routeUtils._getResponseSchema(this.route);
    const columnWhitelist = Object.keys(responseSchema.items.properties);

    _setRestfulnessReqContext.call(this, {
        limit: req.query._limit,
        offset: req.query._offset
    });

    if (req.query._sort) {
        //order array in knex orderBy format
        this.$restfulness.order = [];

        req.query._sort.split(',').forEach(function(column) {
            const item = {
                order: 'asc'
            };
            //columns prepended with - sign are to be sorted descendingly
            if (column[0] === '-') {
                item.order = 'desc';
                item.column = column.slice(1);
            } else {
                item.column = column;
            }

            if (!columnWhitelist.includes(item.column)) {
                throw new RequestError(
                    `Invalid _sort target ${item.column}.`
                );
            } else {
                this.$restfulness.order.push(item);
            }
        }, this);
    }
}

/**
 * @param {Req} req
 * @private
 */
function parseFilterParameterMiddleware(req) {
    if (req.query._filter) {
        _setRestfulnessReqContext.call(this, {
            filter: req.query._filter
        });
    }
}

/**
 * @this {Object} request context object
 * @param {Object} data
 * @private
 */
function _setRestfulnessReqContext(data) {
    if (!this.hasOwnProperty('$restfulness')) {
        this.$restfulness = {};
    }
    Object.assign(this.$restfulness, data);
}

/*
 * @param {Resource} resource
 * @param {String} assocResourceName
 * @private
 * @return {Resource|null}
 */
function _getAssociatedResource(resource, assocResourceName) {
    //embed parameter can eager load singular resources only
    //(not collection of resources) thus we lookup singular name only
    if(Resource.registry.hasSingularName(assocResourceName)) {
        let assocResource = Resource.registry.getBySingularName(assocResourceName);

        if (resource.hasAssociation(assocResource, '1x1')) {
            return assocResource;
        }
        return null;
    }

    return null;
}

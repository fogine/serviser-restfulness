const RequestError = require('bi-service').error.RequestError;
const Resource = require('../resource.js');


module.exports.parseEmbedParameterMiddleware = parseEmbedParameterMiddleware;
module.exports.parseSortLimitOffsetParametersMiddleware = parseSortLimitOffsetParametersMiddleware;

/**
 * @param {Req} req
 */
function parseEmbedParameterMiddleware(req) {

    if (req.query._embed) {
        const lastSegment = this.route.$restfulness.querySegments.last();
        const resource = lastSegment.resource;

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
            if (assocResource === null) {
                throw new RequestError(`No such association ${props[0]}. Invalid embed parameter value.`);
            }

            if (!embed.hasOwnProperty(assocResource.getPluralName())) {
                embed[assocResource.getPluralName()] = [];
            }

            if (props.length > 1) {
                if (assocResource.getResponseProperties().hasOwnProperty(props[1])) {
                    embed[assocResource.getPluralName()].push(props[1]);
                } else {
                    throw new RequestError(
                        `Invalid _embed parameter resource path ${p}`
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
            item.column = column[0] === '-' ? column.slice(1) : column;

            this.$restfulness.order.push(item);
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

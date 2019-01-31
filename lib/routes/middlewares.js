const RequestError = require('bi-service').error.RequestError;
const Resource = require('../resource.js');


module.exports.parseEmbedParameterMiddleware = parseEmbedParameterMiddleware;
module.exports.parseSortLimitOffsetParametersMiddleware = parseSortLimitOffsetParametersMiddleware;

/**
 * @param {Req} req
 */
function parseEmbedParameterMiddleware(req) {
    const resource = this.route.$restfulness.querySegments.last();

    if (req.query.embed) {
        const embed = {};
        this.$restfulness.embed = embed;

        let paths = req.query.embed.split(',');
        paths.forEach(function(p) {
            //strip trailing & leading dot characters
            p = p.replace(/^\.?(.*)\.?$/, '$1');
            let props = p.split('.');
            let assocResource = _getAssociatedResource(resource, props[0]);
            if (assocResource === null) {
                throw new RequestError(`No such association ${props[0]}. Invalid embed parameter value.`);
            }

            if (!embed.hasOwnProperty(assocResource)) {
                embed[assocResource.getPluralName()] = [];
            }

            if (props.length > 1) {
                embed[assocResource.getPluralName()].push(props[1]);
            }
        }, this);
    }
}


/**
 * @param {Req} req
 */
function parseSortLimitOffsetParametersMiddleware(req) {
    this.$restfulness = {
        limit: req.query._limit,
        offset: req.query._offset
    };

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

/*
 * @param {Resource} resource
 * @param {String} assocResourceName
 * @return {Resource|null}
 */
function _getAssociatedResource(resource, assocResourceName) {
    if (resource.hasAssociation(assocResourceName)) {
        return Resource.registry.getByPluralName(assocResourceName);
    } else if(Resource.registry.hasSingularName(assocResourceName)) {
        let resource = Resource.registry.getBySingularName(assocResourceName);
        if (resource.hasAssociation(resource.getPluralName())) {
            return resource;
        }
        return null;
    }

    return null;
}

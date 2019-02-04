const _ = require('lodash');
const Resource = require('./resource.js');

module.exports.generateKnexSelect = generateKnexSelect;
module.exports.unwrap = unwrap;
module.exports.eagerLoad = eagerLoad;
module.exports.withPagination = withPagination;
module.exports.withOrderBy = withOrderBy;
module.exports.withEagerLoad = withEagerLoad;


/**
 * @param {Knex} query
 * @param {Integer} limit
 * @param {Integer} offset
 *
 * @return {undefined}
 */
function withPagination (query, limit, offset) {
    if (typeof limit === 'number' && limit > 0) {
        query.limit(limit);
    }

    if (typeof offset === 'number' && offset > 0) {
        query.offset(offset);
    }
}

/**
 * @param {Knex} query
 * @param {Array<Object>} order
 *
 * @return {undefined}
 */
function withOrderBy(query, order) {
    if (order) {
        query.orderBy(order);
    }
}

/**
 * @param {Knex} query
 * @param {Object} embed
 * @param {Resource} resource
 *
 * @return {undefined}
 */
function withEagerLoad(query, embed, resource) {
    if (_.isPlainObject(embed)) {
        eagerLoad(embed, query, resource);
    }
}

/**
 * @param {Array<String>} columns
 * @param {String} table
 * @param {String} [alias] - whether to alias each column like: table.column as table.column
 * @return {Array|Object}
 */
function generateKnexSelect(columns, table, alias) {

    return columns.reduce(function(out, column) {
        let key = table + '.' + column;

        if (alias) {
            out[alias + '.' + column] = key;
        } else {
            out[column] = key;
        }

        return out;
    }, {});
}

/**
 * modifyies source data object
 *
 * @param {Object|Array<Object>} data
 * @return {Object}
 */
function unwrap(data) {
    if (data instanceof Array) {
        for (let y = 0, len = data.length; y < len; y++) {
            unwrap(data[y]);
        }
    } else {
        let keys = Object.keys(data);

        for (let i = 0, len = keys.length; i < len; i++) {
            let key = keys[i].split('.');
            if (key.length > 1) {
                if (!data.hasOwnProperty(key[0])) {
                    data[key[0]] = {};
                }

                data[key[0]][key[1]] = data[keys[i]];
            }
        }
    }

    return data;
}


/**
 * modifyies query object
 *
 * @param {Object} resources
 * @param {Knex} query
 * @param {Resource} resource
 */
function eagerLoad(resources, query, resource) {
    const localResourceName = resource.getPluralName();

    Object.keys(resources).forEach(function(pluralResourceName) {
        const association = resource.getAssociation(pluralResourceName);
        let embededResource = Resource.registry.getByPluralName(pluralResourceName);
        let _additionalSelect;

        if (resources[pluralResourceName].length) {
            _additionalSelect = generateKnexSelect(
                resources[pluralResourceName],
                pluralResourceName,
                embededResource.getName()
            );
        } else {
            _additionalSelect = generateKnexSelect(
                Object.keys(embededResource.getResponseProperties()),
                pluralResourceName,
                embededResource.getName()
            );
        }

        query.select(_additionalSelect);

        //TODO remove eager loaded resources which doesnt exist
        //aka when database engine places null values when no association exists
        query.leftJoin(
            pluralResourceName,
            `${localResourceName}.${association.localKey}`,
            `${pluralResourceName}.${association.foreignKey}`
        );
    });
}

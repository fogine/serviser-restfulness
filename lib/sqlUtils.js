const _ = require('lodash');
const Resource = require('./resource.js');

module.exports.generateKnexSelect = generateKnexSelect;
module.exports.unwrap = unwrap;
module.exports.eagerLoad = eagerLoad;
module.exports.withPagination = withPagination;
module.exports.withOrderBy = withOrderBy;
module.exports.withEagerLoad = withEagerLoad;
module.exports.withTimestamps = withTimestamps;
module.exports.withWhere = withWhere;
module.exports.removeWithSoftDelete = removeWithSoftDelete;


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
 * @param {Array<Object>} order
 *
 * @return {undefined}
 */
function removeWithSoftDelete(query, resource) {
    if (resource.hasTimestamps(resource.DELETED_AT)) {
        const timestamps = {};
        timestamps[resource.DELETED_AT] = query.client.raw('now()');
        return query.update(timestamps);
    } else {
        return query.del();
    }
}

/**
 * @param {KnexBuilder} query
 * @param {...Resource} resource
 *
 * @return {Object}
 */
function withTimestamps(query, resource) {

    const resources = Array.prototype.slice.call(arguments, 1);

    query.on('start', function(builder) {
        if (builder._method === 'select') {
            return _queryWhereDeletedAtIsNull(builder);
        }

        if (resource.hasTimestamps()) {
            const now = builder.client.raw('now()');

            if (builder._method === 'update') {
                _queryWhereDeletedAtIsNull(builder);
                builder._single.update[resource.UPDATED_AT] = now;
            }

            if (builder._method === 'insert') {
                builder._single.insert[resource.UPDATED_AT] = now;
                builder._single.insert[resource.CREATED_AT] = now;
            }
        }
    });

    function _queryWhereDeletedAtIsNull(builder) {
        return resources.forEach(function(resource) {
            if (resource.hasTimestamps(resource.DELETED_AT)) {
                builder.where(resource.getTableName() + '.' + resource.DELETED_AT, null);
            }
        });
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
 * @return {Object}
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
 * @param {Knex} query
 * @param {Object} where
 * @param {Resource} resource
 * @return {undefined}
 */
function withWhere(query, where, resource) {

    const tableName = resource.getTableName();
    Object.keys(where).forEach(function(column) {
        query.where(tableName + '.' + column, where[column]);
    });
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
    const alreadyJoined = []; //tables which are already joined in query

    //TODO hooks up into knex private API
    if (query._statements instanceof Array) {
        query._statements.forEach(function(statement) {
            if (statement.constructor.name === 'JoinClause') {
                alreadyJoined.push(statement.table);
            }
        });
    }

    Object.keys(resources).forEach(function(pluralResourceName) {
        const association = resource.getAssociation(pluralResourceName);
        let embededResource = Resource.registry.getByPluralName(pluralResourceName);
        let _additionalSelect;

        if (resources[pluralResourceName].length) {
            //select only requested resource properties
            _additionalSelect = generateKnexSelect(
                resources[pluralResourceName],
                pluralResourceName,
                embededResource.getName()
            );
        } else {
            //select whole resource
            _additionalSelect = generateKnexSelect(
                Object.keys(embededResource.getResponseProperties()),
                pluralResourceName,
                embededResource.getName()
            );
        }

        query.select(_additionalSelect);

        //TODO remove eager loaded resources which doesnt exist
        //aka when database engine places null values when no association exists
        if (!alreadyJoined.includes(embededResource.getTableName())) {
            query.leftJoin(
                pluralResourceName,
                `${localResourceName}.${association.localKey}`,
                `${pluralResourceName}.${association.foreignKey}`
            );
        }
    });
}

const _ = require('lodash');
const config = require('./config.js');
const Resource = require('./resource.js');
const sqlUtils = require('./sqlUtils.js');

module.exports.withFilter = withFilter;
module.exports.getJsonSchema = getJsonSchema;

/**
 * @param {Array<String>}
 * @return {Object}
 */
function getJsonSchema(columnWhitelist) {

    const properties = {};
    const schema = {
        allOf: [
            //custom data coercion keywords must be wrapped into allOf
            //so that they are called before the actuall validation
            //this is currently the limitation of ajv
            {
                $toJSON: {},
                additionalProperties: false
            },
            {
                example: '{id: {in: [1,2,3]}}',
                type: 'object',
                failOnAdditionalProperties: true,
                properties: properties
            }
        ]
    };

    const jsonSchemaNumber = {
        type: 'number',
        maximum: config.getOrFail('filter:maximum'),
        maximum: config.getOrFail('filter:minimum')
    };

    const jsonSchemaString = {
        type: 'string',
        maxLength: config.getOrFail('filter:maxLength'),
        minLength: config.getOrFail('filter:minLength')
    };

    const operators = {
        eq: {type: ['string', 'number', 'null', 'boolean']},
        gt: jsonSchemaNumber,
        gte: jsonSchemaNumber,
        lt: jsonSchemaNumber,
        lte: jsonSchemaNumber,
        like: jsonSchemaString,
        iLike: jsonSchemaString,
        between: {
            type: 'array',
            maxItems: 2,
            minItems: 2,
            items: { anyOf: [jsonSchemaNumber, jsonSchemaString] }
        },
        in: {
            type: 'array',
            maxItems: config.getOrFail('filter:maxItems'),
            minItems: 1,
            items: { anyOf: [jsonSchemaNumber, jsonSchemaString] }
        }
    };

    const propertySchema = {
        type: 'object',
        additionalProperties: false,
        properties: Object.assign({
            not: {
                type: 'object',
                additionalProperties: false,
                properties: operators
            }
        }, operators)
    }

    columnWhitelist.forEach(function(propName) {
        properties[propName] = propertySchema;
    });

    return schema;
}

/**
 * @param {Knex} knex
 * @param {Object} schema
 * @param {Resource} resource
 * @return {undefined}
 */
function withFilter(knex, schema, resource) {
    if (!schema) {
        return knex;
    }

    const filter = new Filter(knex, resource);

    _.each(schema, function(colSchema, column) {
        _.forOwn(colSchema, iterator.bind(filter));

        function iterator(val, method) {
            if (method === 'not') {
                _.forOwn(val, iterator.bind(this.not()));
            } else {
                this[method](this._getTableColumn(column), val);
            }
        }
    });

    return knex;
}

/*
 * @param {Knex} knex
 * @param {Resource} [resource]
 * @constructor
 */
function Filter(knex, resource) {
    this._knex = knex;
    this._tableName = resource.getTableName();
    this._resource = resource;
    this._joinedTables = sqlUtils.knexGetAlreadyJoinedTables(knex);
    this._not = false;
    this._negatedKnexMethods = {
        where: 'whereNot',
        whereNull: 'whereNotNull',
        whereIn: 'whereNotIn',
        whereBetween: 'whereNotBetween'
    };
}

/**
 * @param {String} method
 * @return {String}
 */
Filter.prototype._getKnexMethod = function(method) {
    if (this._not) {
        return this._negatedKnexMethods[method];
    }
    return method;
};


/**
 * @param {String} column
 * @return {String}
 */
Filter.prototype._getTableColumn = function(column) {
    const segments = column.split('.');
    if (segments.length === 1) {
        if (this._tableName) {
            return this._tableName + '.' + column;
        }
        return column;
    } else {
        const resource = Resource.registry.getBySingularName(segments[0]);
        if (!this._joinedTables.includes(resource.getTableName())) {
            const association = this._resource.getAssociation(resource);
            this._joinedTables.push(resource.getTableName());
            this._knex.innerJoin(
                resource.getTableName(),
                `${this._tableName}.${association.localKey}`,
                `${resource.getTableName()}.${association.foreignKey}`
            );
        }
        return `${resource.getTableName()}.${segments[1]}`;
    }
};

/**
 * negates future filter.<method> calls
 * @return {undefined}
 */
Filter.prototype.not = function() {
    const filter = new Filter(this._knex, this._resource);
    filter._not = !this._not;

    return filter;
};

/**
 * equal value
 * @param {String} column
 * @param {Integer} value
 * @return {undefined}
 */
Filter.prototype.eq = function(column, value) {
    let method = 'where';
    if (value === null) {
        method = 'whereNull';
    }
    this._knex[this._getKnexMethod(method)](column, value);
    return this;
};

/**
 * greater than or equal value
 * @param {String} column
 * @param {Integer} value
 * @return {undefined}
 */
Filter.prototype.gte = function(column, value) {
    this._knex[this._getKnexMethod('where')](column, '>=', value);
    return this;
};

/**
 * greater than value
 * @param {String} column
 * @param {Integer} value
 * @return {undefined}
 */
Filter.prototype.gt = function(column, value) {
    this._knex[this._getKnexMethod('where')](column, '>', value);
    return this;
};

/**
 * lower than value
 * @param {String} column
 * @param {Integer} value
 * @return {undefined}
 */
Filter.prototype.lt = function(column, value) {
    this._knex[this._getKnexMethod('where')](column, '<', value);
    return this;
};

/**
 * lower than or equal value
 * @param {String} column
 * @param {Integer} value
 * @return {undefined}
 */
Filter.prototype.lte = function(column, value) {
    this._knex[this._getKnexMethod('where')](column, '<=', value);
    return this;
};

/**
 * like value
 * @param {String} column
 * @param {String} value
 * @return {undefined}
 */
Filter.prototype.like = function(column, value) {
    this._knex[this._getKnexMethod('where')](column, 'like', value);
    return this;
};

/**
 * like  case insensitive value
 * @param {String} column
 * @param {String} value
 * @return {undefined}
 */
Filter.prototype.iLike = function(column, value) {
    this._knex[this._getKnexMethod('where')](column, 'like', (value + '').toLowerCase());
    return this;
};

/**
 * in list of values
 * @param {String} column
 * @param {Array<mixed>} value
 * @return {undefined}
 */
Filter.prototype.in = function(column, value) {
    this._knex[this._getKnexMethod('whereIn')](column, value);
    return this;
};

/**
 * between two value
 * @param {String} column
 * @param {Array<Integer|String>} value
 * @return {undefined}
 */
Filter.prototype.between = function(column, value) {
    this._knex[this._getKnexMethod('whereBetween')](column, value);
    return this;
};
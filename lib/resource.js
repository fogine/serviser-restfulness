const _    = require('lodash');
const util = require('./utils');

module.exports = Resource;

const ResourceRegistry = require('./resourceRegistry.js')

/**
 * @public
 * @constructor
 *
 * @param {Object} options
 * @param {String} options.singular - singular resource segment name
 * @param {String} options.plural - plural resource segment name
 * @param {Object} options.properties - json-schema
 * @param {Object} [options.db]
 * @param {String} [options.db.table]
 * @param {Object} [options.db.key]
 * @param {String} [options.db.key.name=id] - primary key name
 * @param {String} [options.db.key.type=integer] - string|integer
 * @param {Object} [options.responseProperties] - json-schema, defaults to properties object
 * @param {Object} [options.dynamicDefaults] - [ajv-keywords dynamicDefaults](https://github.com/epoberezkin/ajv-keywords#dynamicdefaults)
 */
function Resource(options) {
    util.validateResourceOptions(options);
    this.options = options;

    /**
     * @name Resource#_associations
     * @private
     * @instance
     * @type
     *
     * indexed by resource plural name
     * {
     *     additionalProperties: {
     *         type: 'object',
     *         required: ['type', 'foreignKey', 'localKey'],
     *         properties: {
     *             type: {
     *                 type: 'string',
     *                 enum: ['1x1', '1xM', 'MxM']
     *             },
     *             foreignKey: { type: 'string', minLength: 1 },
     *             localKey: { type: 'string', minLength: 1 },
     *             through: {
     *                 type: 'object',
     *                 properties: {
     *                     resource: { type: 'string'},
     *                     foreignKey: { $ref: '#/properties/foreignKey' },
     *                     localKey: { $ref: '#/properties/localKey' }
     *                 }
     *             }
     *         }
     *     }
     * }
     */
    this._associations = {};

    Resource.registry.add(this);
}

/**
 * constructor
 * @name Service.Resource
 * @type {Resource}
 * @readonly
 */
Resource.Resource = Resource;

/**
 * @name Service.registry
 * @type {ResourceRegistry}
 * @readonly
 */
Resource.registry = new ResourceRegistry;

/**
 * returns either plural or singular form of resource name depending on provided
 * `count` argument value
 * @param {Integer} [count=1]
 * @return {String}
 */
Resource.prototype.getName = function(count) {
    if (typeof count !== 'number' ||  count <= 1) {
        return this.options.singular;
    } else {
        return this.options.plural;
    }
};

/**
 * returns plural form of resource name
 * @return {String}
 */
Resource.prototype.getPluralName = function() {
    return this.options.plural;
};

/**
 * @return {String}
 */
Resource.prototype.getTableName = function() {
    return this.options.db.table;
};

/**
 * @return {String}
 */
Resource.prototype.getKeyName = function() {
    return this.options.db.key.name;
};

/**
 * returns resource property schema descriptor
 * @return {Object}
 */
Resource.prototype.prop = function(name) {
    if (this.options.properties.hasOwnProperty(name)) {
        return this.options.properties[name];
    } else if(_.isPlainObject(this.options.responseProperties)
        && this.options.responseProperties.hasOwnProperty(name)
    ) {
        return this.options.responseProperties[name];
    }

    throw new Error(`${this.getPluralName()} resource - no such property: ${name}`);
};

/**
 * defines One to One relationship between two resources, the relationship can
 * also be self-referencing (aka. within a single resource)
 *
 * @param {Resource} resource
 * @param {Object} [options]
 * @param {String} [options.foreignKey]
 * @param {String} [options.localKey]
 *
 * @throws {TypeError}
 * @return {undefined}
 */
Resource.prototype.belongsTo = function(resource, options) {

    if (!(resource instanceof Resource)) {
        throw new TypeError('First argument of belongsTo method must be an instance of Resource');
    }

    //
    if (this._associations.hasOwnProperty(resource.getPluralName())
        && this._associations[resource.getPluralName()].type === '1x1'
    ) {
        return;
    }

    const defaults = {
        foreignKey: resource.getKeyName(),
        localKey: `${resource.getName()}_${resource.getKeyName()}`,
    };

    options = _.assign(defaults, options);

    this._associations[resource.getPluralName()] = {
        type: '1x1',
        foreignKey: options.foreignKey,
        localKey: options.localKey
    };
};


/**
 * defines One to Many relationship between source and target resources
 *
 * @param {Resource} resource
 * @param {Object} [options]
 * @param {String} [options.foreignKey]
 * @param {String} [options.localKey]
 *
 * @throws {TypeError}
 * @return {undefined}
 */
Resource.prototype.hasMany = function(resource, options) {

    if (!(resource instanceof Resource)) {
        throw new TypeError('First argument of hasMany method must be an instance of Resource');
    }

    //
    if (this._associations.hasOwnProperty(resource.getPluralName())
        && this._associations[resource.getPluralName()].type === '1xM'
    ) {
        return;
    }

    const defaults = {
        foreignKey: `${this.getName()}_${this.getKeyName()}`,
        localKey: this.getKeyName(),
    };

    options = _.assign(defaults, options);

    this._associations[resource.getPluralName()] = {
        type: '1xM',
        foreignKey: options.foreignKey,
        localKey: options.localKey
    };
};


/**
 * defines Many to Many relationship between source and target resources through
 * pivot resource
 *
 * @param {Resource} resource
 * @param {Object} options
 * @param {String} [options.foreignKey]
 * @param {String} [options.localKey]
 *
 * @throws {TypeError}
 * @return {undefined}
 */
Resource.prototype.belongsToMany = function(resource, options) {

    if (!(resource instanceof Resource)) {
        throw new TypeError('First argument of belongsToMany method must be an instance of Resource');
    }

    //
    if (this._associations.hasOwnProperty(resource.getPluralName())
        && this._associations[resource.getPluralName()].type === 'MxM'
    ) {
        return;
    }

    const defaultPivotResName = _sortResourcesByName(this, resource).map(function(res) {
        return res.getPluralName();
    }).join('_');

    const defaults = {
        foreignKey: resource.getKeyName(),
        localKey: this.getKeyName(),
        through: {
            resource: defaultPivotResName,
            foreignKey: `${resource.getName()}_${resource.getKeyName()}`,
            localKey: `${this.getName()}_${this.getKeyName()}`,
        }
    };

    options = _.merge(defaults, options);

    this._associations[resource.getPluralName()] = {
        type: 'MxM',
        foreignKey: options.foreignKey,
        localKey: options.localKey,
        through: options.through
    };
};

/**
 * @param {...Resource} res
 * @return {Array<Resource>}
 */
function _sortResourcesByName(/*res1, res2, ...*/) {
    const pool = Array.prototype.slice.call(arguments, 0);
    return _.sortBy(pool, function(res) {
        return res.getName();
    });
}

const _    = require('lodash');
const util = require('./utils');

module.exports = Resource;

Resource.Resource = Resource;

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
 * @param {Object} [options.responseProperties] - json-schema
 * @param {Object} [options.dynamicDefaults] - [ajv-keywords dynamicDefaults](https://github.com/epoberezkin/ajv-keywords#dynamicdefaults)
 */
function Resource(options) {
    util.validateResourceOptions(options);
    this.options = options;

    this._associations = {};
}

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

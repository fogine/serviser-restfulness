const Resource = require('./resource.js');

module.exports = ResourceRegistry;

ResourceRegistry.ResourceRegistry = ResourceRegistry;

/**
 * @public
 * @constructor
 */
function ResourceRegistry() {
    Object.defineProperty(this, '_registry', {
        value: {
            singular: {},
            plural: {}
        }
    });
}

/**
 * @param {Resource} resource
 * @return {undefined}
 */
ResourceRegistry.prototype.add = function(resource) {
    if (!(resource instanceof Resource)) {
        throw new TypeError('First argument must be instanceof `Resource`');
    }

    this._registry.singular[resource.getName()] = resource;
    this._registry.plural[resource.getPluralName()] = resource;
};

/**
 * @param {String} name
 * @return {Resource}
 */
ResourceRegistry.prototype.getByPluralName = function(name) {
    if (!this._registry.plural.hasOwnProperty(name)) {
        throw new Error(`No resource matching plural name ${name}`);
    }

    return this._registry.plural[name];
};

/**
 * @param {String} name
 * @return {Resource}
 */
ResourceRegistry.prototype.getBySingularName = function(name) {
    if (!this._registry.singular.hasOwnProperty(name)) {
        throw new Error(`No resource matching singular name ${name}`);
    }

    return this._registry.singular[name];
};


/**
 * @param {String} name - resource name
 * @return {Boolean}
 */
ResourceRegistry.prototype.hasSingularName = function(name) {
    if (this._registry.singular.hasOwnProperty(name)) {
        return true;
    }

    return false;
};


/**
 * @param {Function} cb - callback is provided with Resource object
 * @return {undefined}
 */
ResourceRegistry.prototype.forEach = function(cb) {
    return Object.keys(this._registry.singular).forEach(function(name) {
        return cb(this._registry.singular[name]);
    }, this);
};

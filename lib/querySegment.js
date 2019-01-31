
module.exports = Segment;

/**
 * @constructor
 * @param {Resource} [resource]
 */
function Segment(resource) {
    this.resource = resource || null;
    this._reduceSubjectProp = null;
    this._reduceSubjectPropAlias = null;
}

/**
 * if a query resource is reduced by a property (eg. primary key)
 * return the property name or its alias if set
 * @return {String}
 */
Segment.prototype.getPropertyName = function() {
    if (this._reduceSubjectPropAlias) {
        return this._reduceSubjectPropAlias;
    } else if (this._reduceSubjectProp) {
        return this._reduceSubjectProp;
    }
    throw new Error('Segment resource is not reduced. Cant get property subject');
};

/**
 * @return {String}
 */
Segment.prototype.getOriginalPropertyName = function() {
    return this._reduceSubjectProp;
};

/**
 * @param {String} alias
 * @return {undefined}
 */
Segment.prototype.setReduceByAlias = function(alias) {
    this._reduceSubjectPropAlias = alias;
};

/**
 * if a query resource is reduced by a property (eg. primary key)
 * return the property schema
 * @return {String}
 */
Segment.prototype.getPropertySchema = function() {
    return this.resource.prop(this._reduceSubjectProp);
};

/**
 * @param {String} property
 * @return {undefined}
 */
Segment.prototype.reduceBy = function(property) {
    if (this.resource) {
        this.resource.prop(property); //throws if doesnt exist
    }
    this._reduceSubjectProp = property;
};

/**
 * @return {Boolean}
 */
Segment.prototype.isReduced = function() {
    if (this._reduceSubjectProp) {
        return true;
    }
    return false;
};


/**
 * @return {undefined}
 */
Segment.prototype.clone = function() {
    const segment = new Segment(this.resource);
    segment._reduceSubjectProp = this._reduceSubjectProp;
    segment._reduceSubjectPropAlias = this._reduceSubjectPropAlias;

    return segment;
};

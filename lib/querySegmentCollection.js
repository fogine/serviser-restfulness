
const _ = require('lodash');

/**
 * A collection that tracks segment objects in the following format:
 * {
 *   resource: new Resource,
 *   narrowedDownBy: 'string'
 * }
 *
 * which are parsed from url eg:
 * /api/v1.0/@users/:{key}
 */
class QuerySegmentCollection extends Array {
    constructor() {
        super();
    }

    /**
     * @param {Resource} resource
     * @param {Object} [options]
     * @param {String} [options.narrowedDownBy]
     */
    add(resource, options) {
        const segment = {
            resource: resource,
        };

        if (options && options.hasOwnProperty('narrowedDownBy')) {
            segment.narrowedDownBy = options.narrowedDownBy;
        }

        this.push(segment);
    }

    /**
     * returns last segment
     */
    last() {
        return _.last(this);
    }

    /**
     * sets additional options to the segment on top of the stack,
     * if no segment has been added yet, it creates a dummy segment without resource object assigned
     *
     * @param {Object} options
     * @param {String} options.narrowedDownBy
     */
    setOptionsToLast(options) {
        let segment = this[this.length -1];

        if (!segment) {
            throw new Error('Can not apply options to zero length colletion');
        }

        Object.assign(segment, options);
    }

    /**
     *
     */
    push() {
        if (!this.length) {
            return super.push.apply(this, arguments);
        }

        let dummySegmentCandidate = arguments[0];

        if (_.isPlainObject(dummySegmentCandidate)
            && !dummySegmentCandidate.hasOwnProperty('resource')
        ) {
            const targetSegment = this[this.length -1];
            Object.assign(targetSegment, dummySegmentCandidate);

            if (arguments.length > 1) {
                let args = Array.prototype.slice.call(arguments, 1);
                return super.push.apply(this, args);
            }
            return this.length;
        }

        return super.push.apply(this, arguments);

    }

    clone() {
        const Resource = require('./resource.js');
        const newCollection = new QuerySegmentCollection();

        this.forEach(function(segment) {
            const clonedSegment = _.cloneWith(segment, function(value) {
                if (value instanceof Resource) {
                    return Resource;
                }
            });

            newCollection.push(clonedSegment);
        });

        return newCollection;
    }
}

module.exports = QuerySegmentCollection;

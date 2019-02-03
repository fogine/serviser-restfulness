
const _ = require('lodash');
const QuerySegment = require('./querySegment.js');

/**
 * A collection that tracks QuerySegment objects
 *
 * which are instantiated from parsed url eg:
 * /api/v1.0/@users/:{key}
 */
class QuerySegmentCollection extends Array {
    constructor() {
        super();
    }

    /**
     * returns last segment
     */
    last() {
        return _.last(this);
    }

    /**
     *
     */
    push() {
        if (!this.length) {
            return this._push(Array.prototype.slice.call(arguments));
        }

        let dummySegmentCandidate = arguments[0];

        if ((dummySegmentCandidate instanceof QuerySegment)
            && !dummySegmentCandidate.resource
            && dummySegmentCandidate.isReduced()
        ) {
            const targetSegment = this[this.length -1];
            targetSegment.reduceBy(dummySegmentCandidate.getPropertyName());

            if (arguments.length > 1) {
                let args = Array.prototype.slice.call(arguments, 1);
                return this._push(args);
            }
            return this.length;
        }

        return this._push(Array.prototype.slice.call(arguments));

    }

    /**
     * @param {Array<QuerySegment>} args
     */
    _push(args) {
        for (let i = 0, len = args.length; i < len; i++) {
            const segment = args[i];
            segment._segmentCollection = this;

            super.push.call(this, segment);
        }

        return this.length;
    }

    uniquifyPropertyNames() {
        const propNames = {};

        for (let i = 0, len = this.length; i < len; i++) {
            const segment = this[i];

            if (!segment.isReduced()) {
                continue;
            }

            if (!propNames.hasOwnProperty(segment.getOriginalPropertyName())) {
                propNames[segment.getOriginalPropertyName()] = [];
            }

            propNames[segment.getOriginalPropertyName()].push(segment);
        }

        Object.keys(propNames).forEach(function(prop) {
            if (propNames[prop].length > 1) {
                propNames[prop].forEach(function(segment) {
                    segment.setReduceByAlias(
                        segment.resource.getName() + '_' + segment.getOriginalPropertyName()
                    );
                });
            }
        });
    }

    clone() {
        const Resource = require('./resource.js');
        const newCollection = new QuerySegmentCollection();

        this.forEach(function(segment) {
            newCollection.push(segment.clone());
        });

        return newCollection;
    }
}

module.exports = QuerySegmentCollection;

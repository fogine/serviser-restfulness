
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
        this._propNames = {};
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

            if (!segment.isReduced()) {
                super.push.call(this, segment);
                continue;
            }

            if (this._propNames.hasOwnProperty(segment.getOriginalPropertyName())) {
                let otherSegment = this[this._propNames[segment.getOriginalPropertyName()]];
                segment.setReduceByAlias(
                    segment.resource.getName() + '_' + segment.getOriginalPropertyName()
                );
                otherSegment.setReduceByAlias(
                    otherSegment.resource.getName() + '_' + otherSegment.getOriginalPropertyName()
                );
            } else {
                this._propNames[segment.getOriginalPropertyName()] = this.length + i;
            }

            super.push.call(this, segment);
        }

        return this.length;
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

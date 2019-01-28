describe('QuerySegmentCollection', function() {
    before(function() {
        this.users = new this.Resource({
            singular: 'user',
            plural: 'users',
            properties: {
                id: {type: 'integer'},
                username: {type: 'string'}
            }
        });

        this.posts = new this.Resource({
            singular: 'post',
            plural: 'posts',
            properties: {
                id: {type: 'integer'},
                title: {type: 'string'}
            }
        });
    });

    after(function() {
        this.Resource.registry = new this.ResourceRegistry;
    });

    it('should behave like an array', function() {
        const array = new this.QuerySegmentCollection;
        const segment = new this.QuerySegment(this.users);
        segment.reduceBy('username');

        array.push(segment);
        array[0].should.be.equal(segment);
    });

    describe('last', function() {
        it('should return last segment in collection', function() {
            const collection = new this.QuerySegmentCollection;
            collection.push(new this.QuerySegment(this.users));
            collection.push(new this.QuerySegment(this.posts));

            this.expect(collection.last()).to.be.equal(this._.last(collection));
        });
    });

    describe('push', function() {
        it('should merge pushed DUMMY segment with the last segment of the collection', function() {
            const collection = new this.QuerySegmentCollection;
            collection.push(new this.QuerySegment(this.users));

            //a DUMMY segment is a segment
            //which is not yet associated with a resource object
            const dummySegment = new this.QuerySegment();
            dummySegment.reduceBy('id');

            //dummy object can only be defined as first argument
            collection.push(dummySegment);

            collection.length.should.be.equal(1);
            collection[0].should.be.instanceof(this.QuerySegment);
            collection[0].should.have.property('resource', this.users);
            collection[0].getPropertyName().should.be.equal('id');
            collection[0].isReduced().should.be.equal(true);
        });

        it('should merge a dummy segment with the last segment of the collection and push other segments on top of the collection', function() {
            const collection = new this.QuerySegmentCollection;
            collection.push(new this.QuerySegment(this.users));

            const dummySegment = new this.QuerySegment();
            dummySegment.reduceBy('id');

            const anotherSegment = new this.QuerySegment(this.users);

            collection.push(dummySegment, anotherSegment);

            collection.length.should.be.equal(2);
            collection[0].should.be.instanceof(this.QuerySegment);
            collection[0].should.have.property('resource', this.users);
            collection[0].getPropertyName().should.be.equal('id');
            collection[0].isReduced().should.be.equal(true);

            collection[1].should.be.instanceof(this.QuerySegment);
            collection[1].should.have.property('resource', this.users);

        });
    });

    describe('clone', function() {
        it('should clone the collection and return a new QuerySegmentCollection object', function() {
            const array = new this.QuerySegmentCollection;
            const segment = new this.QuerySegment(this.users);
            const segment2 = new this.QuerySegment(this.posts);
            segment.reduceBy('id');
            segment2.reduceBy('id');

            array.push(segment, segment2);

            const cloned = array.clone();

            cloned.should.not.be.equal(array);
            cloned.should.be.eql(array);

            this.expect(cloned[0]).to.not.be.equal(segment);
            this.expect(cloned[1]).to.not.be.equal(segment2);

            this.expect(cloned._propNames).to.be.eql(array._propNames);
        });
    });
});

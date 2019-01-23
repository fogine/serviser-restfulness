describe('QuerySegmentCollection', function() {
    before(function() {
        this.users = new this.Resource({
            singular: 'user',
            plural: 'users',
            properties: {
                username: {type: 'string'}
            }
        });

        this.posts = new this.Resource({
            singular: 'post',
            plural: 'posts',
            properties: {
                title: {type: 'string'}
            }
        });
    });

    after(function() {
        this.Resource.registry = new this.ResourceRegistry;
    });

    it('should behave like an array', function() {
        const array = new this.QuerySegmentCollection;
        const segment = {
            resource: this.users,
            narrowedDownBy: 'username'
        };

        array.push(segment);
        array[0].should.be.equal(segment);
    });

    describe('add', function() {
        it('should push a new segment on top of the stack', function() {
            const collection = new this.QuerySegmentCollection;
            collection.add(this.users);

            collection[0].should.be.eql({
                resource: this.users
            });
        });

        it('should push a new segment on top of the stack (2)', function() {
            const collection = new this.QuerySegmentCollection;
            collection.add(this.users, {narrowedDownBy: 'id'});

            collection[0].should.be.eql({
                resource: this.users,
                narrowedDownBy: 'id'
            });
        });
    });

    describe('last', function() {
        it('should return last segment in collection', function() {
            const collection = new this.QuerySegmentCollection;
            collection.add(this.users);
            collection.add(this.posts);

            this.expect(collection.last()).to.be.equal(this._.last(collection));
        });
    });

    describe('setOptionsToLast', function() {
        it('should set additional options to the last segment in collection', function() {
            const collection = new this.QuerySegmentCollection;
            collection.add(this.users);

            collection.setOptionsToLast({narrowedDownBy: 'id'});

            collection.length.should.be.equal(1);
            collection[0].should.be.eql({
                resource: this.users,
                narrowedDownBy: 'id'
            });
        });
    });

    describe('push', function() {
        it('should merge pushed DUMMY segment with the last segment of the collection', function() {
            const collection = new this.QuerySegmentCollection;
            collection.add(this.users);

            const dummySegment = {
                //resource: this.users, a DUMMY segment is a segment
                //which is not associated with a resource object
                narrowedDownBy: 'id'
            };

            //dummy object can only be defined as first argument
            collection.push(dummySegment);

            collection.length.should.be.equal(1);
            collection[0].should.be.eql({
                resource: this.users,
                narrowedDownBy: 'id'
            });
        });

        it('should merge a dummy segment with the last segment of the collection and push other segments on top of the collection', function() {
            const collection = new this.QuerySegmentCollection;
            collection.add(this.users);

            const dummySegment = {
                narrowedDownBy: 'id'
            };

            const anotherSegment = {
                resource: this.users
            };

            collection.push(dummySegment, anotherSegment);

            collection.length.should.be.equal(2);
            collection[0].should.be.eql({
                resource: this.users,
                narrowedDownBy: 'id'
            });

            collection[1].should.be.eql({
                resource: this.users
            });
        });
    });

    describe('clone', function() {
        it('should clone the collection and return a new QuerySegmentCollection object', function() {
            const array = new this.QuerySegmentCollection;
            const segment = {
                resource: this.users,
                narrowedDownBy: 'username'
            };

            array.push(segment);

            const cloned = array.clone();

            cloned.should.not.be.equal(array);
            cloned.should.be.eql(array);

            this.expect(cloned[0]).to.not.be.equal(segment);
        });
    });
});

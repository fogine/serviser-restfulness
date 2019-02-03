const utils = require('../../../lib/utils.js');

describe('utils', function() {
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

        this.tags = new this.Resource({
            singular: 'tag',
            plural: 'tags',
            properties: {
                name: {type: 'string'}
            }
        });

    });

    describe('parseUrlResources', function() {
        before(function() {
            this.registry = this.Resource.registry;
        });

        after(function() {
            this.Resource.registry = new this.ResourceRegistry;
        });

        it('should throw an Error when we provide zero length string', function() {
            const self = this;
            function zeroLengthString() {
                utils.parseUrlResources('', self.registry);
            }

            this.expect(zeroLengthString).to.throw(Error);
        });

        it('should throw an Error when we provide invalid url parameter', function() {
            function invalidUrlParameter() {
                utils.parseUrlResources(null, self.registry);
            }

            this.expect(invalidUrlParameter).to.throw(Error);
        });

        it('should throw an Error when invalid resource registry argument is provided', function() {
            function invalidRegistryParameter() {
                utils.parseUrlResources('/', {});
            }

            this.expect(invalidRegistryParameter).to.throw(Error);
        });

        describe('full url', function() {
            before(function() {
                this.output = utils.parseUrlResources(
                    '/api/{version}/@users/:{key}/@posts/:title/@tags',
                    this.registry
                );
            });

            it('should return array of objects', function() {

                this.output.should.be.instanceof(Array);
                this.expect(this.output.length).to.be.equal(3);
            });

            it('should define primary key column of the users resource as query constraint', function() {
                this.output[0].should.be.instanceof(this.QuerySegment);
                this.output[0].should.have.property('resource', this.users);
                this.output[0].getPropertyName().should.be.equal('id');
            });

            it('should define title column of the posts resource as query constraint', function() {
                this.output[1].should.be.instanceof(this.QuerySegment);
                this.output[1].should.have.property('resource', this.posts);
                this.output[1].getPropertyName().should.be.equal('title');
            });

            it('should not define any query constraint', function() {
                this.output[2].should.be.instanceof(this.QuerySegment);
                this.output[2].should.have.property('resource', this.tags);
                this.output[2].isReduced().should.be.equal(false);
            });
        });

        describe('relative url', function() {
            before(function() {
                let segmentCollection = new this.QuerySegmentCollection;
                segmentCollection.push(new this.QuerySegment(this.users));

                //this case assumes the url is extension of eg: router url
                //and thus first segment with username query constraint
                //is dependent and will be merged with segment in provided
                //segmentCollection
                this.output = utils.parseUrlResources(
                    '/:username/@posts',
                    this.registry,
                    segmentCollection
                );
            });

            it('should return array of objects', function() {

                this.output.should.be.instanceof(Array);
                this.expect(this.output.length).to.be.equal(2);
            });

            it('should define username column as query constraint', function() {
                this.output[0].should.be.instanceof(this.QuerySegment);
                this.output[0].should.have.property('resource', this.users);
                this.output[0].getPropertyName().should.be.equal('username');
            });

            it('should define posts resource as last segment', function() {
                this.output[1].should.be.instanceof(this.QuerySegment);
                this.output[1].should.have.property('resource', this.posts);
                this.output[1].isReduced().should.be.equal(false);
            });
        });

        describe('relative url (2)', function() {
            before(function() {
                let segmentCollection = new this.QuerySegmentCollection;
                segmentCollection.push(new this.QuerySegment(this.users));

                //this case assumes the url is extension of eg: router url
                //and thus first segment which defines primary key parameter
                //query constraint is dependent and will be merged with
                //segment in provided segmentCollection
                this.output = utils.parseUrlResources(
                    '/:{key}',
                    this.registry,
                    segmentCollection
                );
            });

            it('should return parsed segment collection', function() {

                this.output.should.be.instanceof(Array);
                this.expect(this.output.length).to.be.equal(1);

                this.output[0].should.be.instanceof(this.QuerySegment);
                this.output[0].should.have.property('resource', this.users);
                this.output[0].getPropertyName().should.be.equal('id');
            });
        });
    });

    describe('normalizeUrl', function() {
        it('should replace resource and column name placeholders with valid url segments', function() {

            let urlSegments = [
                new this.QuerySegment(this.users),
                new this.QuerySegment(this.posts),
                new this.QuerySegment(this.tags)
            ];

            urlSegments[0].reduceBy('id');
            urlSegments[1].reduceBy('title');

            let url =  utils.normalizeUrl(
                '/api/{version}/@users/:{key}/@posts/:title/@tags',
                urlSegments
            );

            url.should.be.equal('/api/{version}/users/:id/posts/:title/tags');
        });

        it('should prepend uri parameters with resource name if there are colliding parameter names', function() {


            let urlSegments = new this.QuerySegmentCollection();
            let segment1 = new this.QuerySegment(this.users);
            let segment2 = new this.QuerySegment(this.posts);

            urlSegments.push(segment1, segment2);

            segment1.reduceBy('id');
            segment2.reduceBy('id');

            let url =  utils.normalizeUrl(
                '/api/{version}/@users/:{key}/@posts/:{key}',
                urlSegments
            );

            url.should.be.equal('/api/{version}/users/:user_id/posts/:post_id');
        });
    });
});



const utils = require('../../../lib/utils.js');

describe('utils', function() {
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
                this.output[0].should.be.eql({
                    resource: this.users,
                    narrowedDownBy: 'id'
                });
            });

            it('should define title column of the posts resource as query constraint', function() {
                this.output[1].should.be.eql({
                    resource: this.posts,
                    narrowedDownBy: 'title'
                });
            });

            it('should not define any query constraint', function() {
                this.output[2].should.be.eql({
                    resource: this.tags
                });

                this.output[2].should.not.have.property('narrowedDownBy');
            });
        });

        describe('relative url', function() {
            before(function() {
                let segmentCollection = new this.QuerySegmentCollection;
                segmentCollection.add(this.users);

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
                this.output[0].should.be.eql({
                    resource: this.users,
                    narrowedDownBy: 'username'
                });
            });

            it('should define posts resource as last segment', function() {
                this.output[1].should.be.eql({
                    resource: this.posts
                });
            });
        });

        describe('relative url (2)', function() {
            before(function() {
                let segmentCollection = new this.QuerySegmentCollection;
                segmentCollection.add(this.users);

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
                this.output[0].should.be.eql({
                    resource: this.users,
                    narrowedDownBy: 'id'
                });
            });
        });
    });

    describe('normalizeUrl', function() {
        it('should replace resource and column name placeholders with valid url segments', function() {
            let urlSegments = [
                {
                    resource: this.users,
                    narrowedDownBy: 'id'
                },
                {
                    resource: this.posts,
                    narrowedDownBy: 'title'
                },
                {
                    resource: this.tags
                }
            ];

            let url =  utils.normalizeUrl(
                '/api/{version}/@users/:{key}/@posts/:title/@tags',
                urlSegments
            );

            url.should.be.equal('/api/{version}/users/:user_id/posts/:title/tags');
        });
    });
});



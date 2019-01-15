const path             = require('path');
const Service          = require('bi-service');
const Config           = require('bi-config');
const index            = require('../../../index.js');
const Resource         = require('../../../lib/resource.js');
const ResourceRegistry = require('../../../lib/resourceRegistry.js');

describe('Router', function() {

    before(function() {
        this.config = new Config.Config({
            root: path.resolve(__dirname + '/../../..'),//fake project root
            apps: {REST: {}}//fake app config
        }, 'literal');

        this.service = new Service(this.config);

        this.app = this.service.buildApp('REST', {
            validator: {definitions: {}}
        });

        this.users = new Resource({
            singular: 'user',
            plural: 'users',
            properties: {
                username: {type: 'string'}
            }
        });

        this.posts = new Resource({
            singular: 'post',
            plural: 'posts',
            properties: {
                title: {type: 'string'}
            }
        });
    });

    after(function() {
        Resource.registry = new ResourceRegistry;
    });

    describe('buildRestfulRouter', function() {

        it('should return a new Router instance', function() {
            this.app.buildRestfulRouter({
                url: '/'
            }).should.be.instanceof(this.app.Router);
        });

        it('should return a new Router instance with valid url', function() {
            const router = this.app.buildRestfulRouter({
                url: '/api/{version}/@users',
                version: 1.0
            });

            router.should.be.instanceof(this.app.Router);
            this.expect(router.options.url).to.be.equal('/api/v1.0/users');
        });

        it('should return a new Router instance with valid url', function() {
            const router = this.app.buildRestfulRouter({
                url: '/api/{version}/@users/:{key}/@posts/:title',
                version: 1.0
            });

            router.should.be.instanceof(this.app.Router);
            this.expect(router.options.url).to.be.equal(
                '/api/v1.0/users/:user_id/posts/:title'
            );
        });

        //it('should bind route generation methods to the router instance', function() {
            //const router = this.app.buildRestfulRouter({
                //url: '/'
            //});

            //router.should.have.property('get').that.is.a('function');
            //router.should.have.property('post').that.is.a('function');
            //router.should.have.property('put').that.is.a('function');
            //router.should.have.property('del').that.is.a('function');
        //});
    });
});

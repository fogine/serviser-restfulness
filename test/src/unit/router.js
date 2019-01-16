const path    = require('path');
const Service = require('bi-service');
const Config  = require('bi-config');
const index   = require('../../../index.js');

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

        this.router = this.app.buildRestfulRouter({
            url: '/api/{version}/@users',
            version: 1.0
        });
    });

    after(function() {
        this.Resource.registry = new this.ResourceRegistry;
    });

    describe('get', function() {
        it('should return a new Route object', function() {
            this.router.get().should.be.instanceof(Service.Route);
        });

        it('should return a new Route object with correct relative url', function() {
            const route = this.router.get('/:{key}', {
                name: 'user'
            });
            route.getUrl().should.be.equal('/api/v1.0/users/:user_id');
        });
    });
});

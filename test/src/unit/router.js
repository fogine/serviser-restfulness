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

        const validator = this.app.getValidator();

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
            this.router.get().should.be.instanceof(Service.Route)
                .that.has.deep.property('options.type', 'get');
        });

        it('should return a new Route object with correct relative url', function() {
            const route = this.router.get('/:{key}', {
                name: 'user'
            });
            route.getUrl().should.be.equal('/api/v1.0/users/:user_id');
        });

        it('should return a new Route object with correct relative url (2)', function() {
            const route = this.router.get('/@posts');
            route.getUrl().should.be.equal('/api/v1.0/users/posts');
        });

        it('should register fallback route query validator middleware in the next tick if none was defined by user', function(cb) {
            const self = this;
            const route = this.router.get('/', {name: 'other'});

            this.expect(route.steps.find((v) => {return v.name === 'validator'})).to.be.equal(undefined);

            process.nextTick(function() {
                try {
                    const val = route.steps.find((v) => {return v.name === 'validator'});
                    self.expect(val).to.be.a('object');
                    val.args.should.be.instanceof(Array);
                    val.args[1].should.be.equal('query');
                    return cb();
                } catch(e) {
                    return cb(e);
                }
            });
        });
    });
});

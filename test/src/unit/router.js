const path    = require('path');
const Service = require('bi-service');
const Config  = require('bi-config');
const index   = require('../../../index.js');
//const Resource         = require('../../../lib/resource.js');
//const ResourceRegistry = require('../../../lib/resourceRegistry.js');

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
    });

    describe('buildRestfulRouter', function() {
        it('should return a new Router instance', function() {
            this.app.buildRestfulRouter({
                url: '/'
            }).should.be.instanceof(this.app.Router);
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

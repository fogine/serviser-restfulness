const Promise         = require('bluebird');
const chai            = require('chai');
const Service         = require('bi-service');
const path            = require('path');
const _               = require('lodash');
const chaiAsPromised  = require('chai-as-promised');
const parseLinkHeader = require('parse-link-header');
const ServiceSDK      = require('../../service/sdk.js');

//import the restfulness plugin
require('../../../index.js');

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.should();

//
//Object.defineProperty(global, 'Promise', {
    //configurable: false,
    //writable: false,
    //value: Promise
//});

describe('integration tests', function() {
    before(function() {
        //
        this.expect = expect;
        this.chai = chai;
        this.Promise = Promise;
        this._ = _;
        this.parseLinkHeader = parseLinkHeader;
    });

    describe('postgres database', function() {
        before(function() {
            return initService.call(this, 'pg');
        });

        loadTestFiles();
    });

    describe('mysql database', function() {
        before(function() {
            return initService.call(this, 'mysql');
        });

        loadTestFiles();
    });

    /**
     * @param {String} dbProvider
     * @return {Promise}
     */
    function initService(dbProvider) {
        const self = this;

        this.service = require('../../service/index.js')(dbProvider);
        this.knex = this.service.knex;

        return this.service.listen().then(function() {
            let port = self.service.appManager.get('test').server.address().port;

            self.sdk = new ServiceSDK({
                baseURL: `http://127.0.0.1:${port}`
            });
        });
    }

    /**
     * @return {undefined}
     */
    function loadTestFiles() {
        //load all files in the current directory except itself
        Service.moduleLoader.fileIterator([
            path.resolve(`${__dirname}/`),
        ], {
            except: [
                path.resolve(`${__dirname}/index.js`),//itself
            ]
        }, function(file, dir) {
            if (require.extensions[path.extname(file)]) {
                let p = path.join(dir, file);
                delete require.cache[require.resolve(p)];
                return require(p);
            }
        });
    }

});

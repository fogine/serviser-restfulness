const pg              = require('pg');
const Promise         = require('bluebird');
const chai            = require('chai');
const Service         = require('bi-service');
const path            = require('path');
const _               = require('lodash');
const chaiAsPromised  = require('chai-as-promised');
const chaiDateString  = require('chai-date-string');
const parseLinkHeader = require('parse-link-header');
const ServiceSDK      = require('../../service/sdk.js');
const testUtils       = require('../../utils.js');

//import the restfulness plugin
require('../../../index.js');

const expect = chai.expect;
chai.use(chaiAsPromised);
chai.use(chaiDateString);
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
        this.utils = testUtils;
    });

    describe('postgres database', function() {
        before(function() {
            return initService.call(this, 'pg', 3001);
        });

        loadTestFiles();
    });

    describe('mysql database', function() {
        before(function() {
            return initService.call(this, 'mysql', 3000);
        });

        loadTestFiles();
    });

    /**
     * @param {String} dbProvider
     * @param {Integer} port
     * @return {Promise}
     */
    function initService(dbProvider, port) {
        const self = this;

        this.service = require('../../service/index.js')(dbProvider, port);
        this.knex = this.service.resourceManager.get('knex');

        return this.service.listen().then(function() {
            const app = self.service.appManager.get('test');
            let port = app.server.address().port;

            self.port = port;
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

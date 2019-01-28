const chai    = require('chai');
const Service = require('bi-service');
const path    = require('path');
const _       = require('lodash');

//import the restfulness plugin
require('../../../index.js');

const expect = chai.expect;
chai.should();

describe('integration tests', function() {
    before(function() {
        //
        this.expect = expect;
        this.chai = chai;
        this._ = _;
        this.service = require('../../service/index.js')('pg');
        this.knex = this.service.knex;

        return this.service.listen();
    });

    //load all files in the current directory except itself
    Service.moduleLoader.loadModules([
        path.resolve(`${__dirname}/`),
    ], {
        except: [
            path.resolve(`${__dirname}/index.js`),//itself
        ]
    });

});

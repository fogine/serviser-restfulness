const chai      = require('chai');
const Service   = require('bi-service');
const path      = require('path');
const _         = require('lodash');

//import the restfulness plugin
require('../../../index.js');

const expect = chai.expect;
chai.should();

describe('integration tests', function() {
    //load all files in the current directory except itself
    Service.moduleLoader.loadModules([
        path.resolve(`${__dirname}/`),
    ], {
        except: [
            path.resolve(`${__dirname}/index.js`),//itself
        ]
    });

    before(function() {
        this.expect = expect;
        this.chai = chai;
        this._ = _;
    });
});

const sinon     = require('sinon');
const chai      = require('chai');
const sinonChai = require("sinon-chai");
const Service   = require('bi-service');
const path      = require('path');

const expect = chai.expect;

chai.use(sinonChai);
chai.should();

describe('unit tests', function() {
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
    });
});

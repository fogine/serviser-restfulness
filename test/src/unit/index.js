const sinon     = require('sinon');
const chai      = require('chai');
const sinonChai = require("sinon-chai");
const Service   = require('bi-service');
const path      = require('path');

const QuerySegmentCollection = require('../../../lib/querySegmentCollection.js');
const Resource               = require('../../../lib/resource.js');
const ResourceRegistry       = require('../../../lib/resourceRegistry.js');

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

        this.Resource = Resource;
        this.QuerySegmentCollection = QuerySegmentCollection;
        this.ResourceRegistry = ResourceRegistry;
    });
});

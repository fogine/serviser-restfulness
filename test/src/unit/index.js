const sinon       = require('sinon');
const chai        = require('chai');
const sinonChai   = require("sinon-chai");
const Service     = require('bi-service');
const path        = require('path');
const _           = require('lodash');
const Knex        = require('knex');
const KnexRunner  = require('knex/lib/runner');
const KnexBuilder = require('knex/lib/query/builder');

const QuerySegmentCollection = require('../../../lib/querySegmentCollection.js');
const Resource               = require('../../../lib/resource.js');
const QuerySegment           = require('../../../lib/querySegment.js');
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
        this.sinon = sinon;
        this._ = _;

        this.Knex = Knex;
        this.KnexRunner = KnexRunner;
        this.KnexBuilder = KnexBuilder;
        this.Resource = Resource;
        this.QuerySegment = QuerySegment;
        this.QuerySegmentCollection = QuerySegmentCollection;
        this.ResourceRegistry = ResourceRegistry;
    });
});

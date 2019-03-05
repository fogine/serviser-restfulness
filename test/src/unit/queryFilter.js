const queryFilter = require('../../../lib/queryFilter.js');

describe('queryFilter', function() {
    before(function() {
        this.knex = this.Knex({
            client: 'postgres'
        });
    });

    describe('withFilter', function() {
        [
            {
                filter: { id: {eq: 1} },
                expectedSQL: 'select * from "user" where "id" = 1'
            },
            {
                filter: { subscribed: {eq: false} },
                expectedSQL: 'select * from "user" where "subscribed" = false'
            },
            {
                filter: { id: {gt: 1} },
                expectedSQL: 'select * from "user" where "id" > 1'
            },
            {
                filter: { id: {gte: 1} },
                expectedSQL: 'select * from "user" where "id" >= 1'
            },
            {
                filter: { id: {lt: 1} },
                expectedSQL: 'select * from "user" where "id" < 1'
            },
            {
                filter: { id: {lte: 1} },
                expectedSQL: 'select * from "user" where "id" <= 1'
            },
            {
                filter: { id: {in: [1,2,3]} },
                expectedSQL: 'select * from "user" where "id" in (1, 2, 3)'
            },
            {
                filter: { id: {not: {in: [1,2,3]}} },
                expectedSQL: 'select * from "user" where "id" not in (1, 2, 3)'
            },
            {
                filter: { username: {like: 'Happie%'} },
                expectedSQL: `select * from "user" where "username" like 'Happie%'`
            },
            {
                filter: { username: {iLike: '%Happie%'} },
                expectedSQL: `select * from "user" where "username" like '%happie%'`
            },
            {
                filter: { id: {between: [1,10]} },
                expectedSQL: `select * from "user" where "id" between 1 and 10`
            },
            {
                filter: { code: {between: ['a','z']} },
                expectedSQL: `select * from "user" where "code" between 'a' and 'z'`
            },
        ].forEach(function(testCase) {
            it(`should append ${testCase.expectedSQL.slice(testCase.expectedSQL.indexOf('where'))} clause to query builder`, function() {
                const query = this.knex('user');

                query.modify(queryFilter.withFilter, testCase.filter);
                query.toString().should.be.equal(testCase.expectedSQL);
            });
        });

        [
            {
                filter: { id: {eq: 1} },
                expectedSQL: 'select * from "user" where "user"."id" = 1'
            },
            {
                filter: { subscribed: {eq: false} },
                expectedSQL: 'select * from "user" where "user"."subscribed" = false'
            },
            {
                filter: { id: {gt: 1} },
                expectedSQL: 'select * from "user" where "user"."id" > 1'
            },
            {
                filter: { id: {gte: 1} },
                expectedSQL: 'select * from "user" where "user"."id" >= 1'
            },
            {
                filter: { id: {lt: 1} },
                expectedSQL: 'select * from "user" where "user"."id" < 1'
            },
            {
                filter: { id: {lte: 1} },
                expectedSQL: 'select * from "user" where "user"."id" <= 1'
            },
            {
                filter: { id: {in: [1,2,3]} },
                expectedSQL: 'select * from "user" where "user"."id" in (1, 2, 3)'
            },
            {
                filter: { id: {not: {in: [1,2,3]}} },
                expectedSQL: 'select * from "user" where "user"."id" not in (1, 2, 3)'
            },
            {
                filter: { username: {like: 'Happie%'} },
                expectedSQL: `select * from "user" where "user"."username" like 'Happie%'`
            },
            {
                filter: { username: {iLike: '%Happie%'} },
                expectedSQL: `select * from "user" where "user"."username" like '%happie%'`
            },
            {
                filter: { id: {between: [1,10]} },
                expectedSQL: `select * from "user" where "user"."id" between 1 and 10`
            },
            {
                filter: { code: {between: ['a','z']} },
                expectedSQL: `select * from "user" where "user"."code" between 'a' and 'z'`
            },
        ].forEach(function(testCase) {
            it(`should append ${testCase.expectedSQL.slice(testCase.expectedSQL.indexOf('where'))} clause to query builder`, function() {
                const query = this.knex('user');

                query.modify(queryFilter.withFilter, testCase.filter, 'user');
                query.toString().should.be.equal(testCase.expectedSQL);
            });
        });

        it(`should append correct filter clause to query builder`, function() {
            const query = this.knex('user');
            const filter = {
                username: {not: {like: "%O'Braen%"}},
                subscribed: {eq: true},
            };

            query.modify(queryFilter.withFilter, filter);
            query.toString().should.be.equal(`select * from "user" where not "username" like '%O''Braen%' and "subscribed" = true`);
        });
    });
});

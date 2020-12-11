const queryFilter = require('../../../lib/queryFilter.js');

describe('queryFilter', function() {

    describe('postgres', function() {
        before(function() {
            this.knex = this.Knex({
                client: 'pg'
            });

            this.user = new this.Resource({
                singular: 'user',
                plural: 'users',
                db: {
                    table: 'user'
                },
                properties: {}
            });

            this.comment = new this.Resource({
                singular: 'comment',
                plural: 'comments',
                db: {
                    table: 'comment'
                },
                properties: {}
            });

            this.comment.belongsTo(this.user);
        });

        describe('withFilter', function() {
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
                    expectedSQL: `select * from "user" where "user"."username" ilike '%happie%'`
                },
                {
                    filter: { id: {between: [1,10]} },
                    expectedSQL: `select * from "user" where "user"."id" between 1 and 10`
                },
                {
                    filter: { code: {between: ['a','z']} },
                    expectedSQL: `select * from "user" where "user"."code" between 'a' and 'z'`
                }
            ].forEach(function(testCase) {
                it(`should append ${testCase.expectedSQL.slice(testCase.expectedSQL.indexOf('where'))} clause to query builder`, function() {
                    const query = this.knex('user');

                    query.modify(queryFilter.withFilter, testCase.filter, this.user);
                    query.toString().should.be.equal(testCase.expectedSQL);
                });
            });

            it(`should append correct filter clause to query builder`, function() {
                const query = this.knex('user');
                const filter = {
                    username: {not: {like: "%O'Braen%"}},
                    subscribed: {eq: true},
                };

                query.modify(queryFilter.withFilter, filter, this.user);
                query.toString().should.be.equal(`select * from "user" where not "user"."username" like '%O''Braen%' and "user"."subscribed" = true`);
            });

            it(`should construct correct select query with where & inner join clauses`, function() {
                const query = this.knex('comment');
                const filter = {
                    id: {not: {in: [1,2]}},
                    'user.username': {like: '%happie%'}
                };

                query.modify(queryFilter.withFilter, filter, this.comment);
                query.toString().should.be.equal(`select * from "comment" inner join "user" on "comment"."user_id" = "user"."id" where "comment"."id" not in (1, 2) and "user"."username" like '%happie%'`);
            });
        });
    });

    describe('mysql', function() {
        before(function() {
            this.knex = this.Knex({
                client: 'mysql'
            });

            this.user = new this.Resource({
                singular: 'user',
                plural: 'users',
                db: {
                    table: 'user'
                },
                properties: {}
            });

            this.comment = new this.Resource({
                singular: 'comment',
                plural: 'comments',
                db: {
                    table: 'comment'
                },
                properties: {}
            });

            this.comment.belongsTo(this.user);
        });

        describe('withFilter', function() {
            [
                {
                    filter: { username: {iLike: '%Happie%'} },
                    expectedSQL: `select * from \`user\` where LOWER(user.username) LIKE '%happie%'`
                },
            ].forEach(function(testCase) {
                it(`should append ${testCase.expectedSQL.slice(testCase.expectedSQL.indexOf('where'))} clause to query builder`, function() {
                    const query = this.knex('user');

                    query.modify(queryFilter.withFilter, testCase.filter, this.user);
                    query.toString().should.be.equal(testCase.expectedSQL);
                });
            });
        });
    });
});

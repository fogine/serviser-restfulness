
describe('GET /api/v1.0/users', function() {
    before(function() {
        const rows = [];

        for (let i = 0, len = 21; i < len; i++) {
            rows.push({
                username: `happie${i+1}`,
                password: `secret${i+1}`,
                subscribed: false,
                email: `email${i+1}@email.com`,
                created_at: this.knex.raw('now()'),
                updated_at: this.knex.raw('now()')
            });
        }

        rows[20].deleted_at = this.knex.raw('now()');

        return this.knex.batchInsert('users', rows, 21)
            .returning('id')
            .bind(this)
            .then(function(ids) {
                this.userIds = this.utils.expandResourceIds(ids, 21);
                this.deletedUserId = this.userIds.pop();
            });

    });

    after(function() {
        return this.knex('users').whereIn('id', this.userIds.concat([this.deletedUserId])).del();
    });

    it('should return (200 code) collection of all user resources', function() {
        const expect = this.expect;
        const userIds = this.userIds;

        return this.sdk.getUsers().then(function(response) {
            expect(response.data.length).to.be.equal(20);
            response.data.forEach(function(user, index) {
                Object.keys(user).should.be.eql(['id','username', 'subscribed', 'created_at', 'updated_at']);

                expect(user.id).to.equal(userIds[index]);
                expect(user.username).to.equal(`happie${index+1}`);
                expect(user.subscribed).to.equal(false);
                expect(user.created_at).to.be.a('string');
                expect(user.updated_at).to.be.a('string');
            });
        });
    });

    it('should return paginated result set and return correct pagination headers', function() {
        const self = this;
        const expect = this.expect;
        const userIds = this.userIds.slice(5, 10);

        return this.sdk.getUsers({query: {
            _limit: 5,
            _offset: 5
        }}).then(function(response) {
            expect(response.data.length).to.be.equal(5);
            expect(response.headers).to.have.property('link');

            const link = self.parseLinkHeader(response.headers.link);
            link.should.be.eql({
                first: {
                    _limit: '5',
                    rel: 'first',
                    url: `http://127.0.0.1:${self.port}/api/v1.0/users?_limit=5`
                },
                last: {
                    _limit: '5',
                    _offset: '15',
                    rel: 'last',
                    url: `http://127.0.0.1:${self.port}/api/v1.0/users?_limit=5&_offset=15`
                },
                next: {
                    _offset: '10',
                    _limit: '5',
                    rel: 'next',
                    url: `http://127.0.0.1:${self.port}/api/v1.0/users?_limit=5&_offset=10`
                },
                prev: {
                    _offset: '0',
                    _limit: '5',
                    rel: 'prev',
                    url: `http://127.0.0.1:${self.port}/api/v1.0/users?_limit=5&_offset=0`
                }
            });

            response.data.forEach(function(user, index) {
                Object.keys(user).should.be.eql(['id','username', 'subscribed', 'created_at', 'updated_at']);

                expect(user.id).to.equal(userIds[index]);
                expect(user.username).to.equal(`happie${index+5+1}`);
                expect(user.subscribed).to.equal(false);
                expect(user.created_at).to.be.a('string');
                expect(user.updated_at).to.be.a('string');
            });
        });
    });

    it('should not accept _embed query parameter', function() {
        const expect = this.expect;
        const userId = this.userId;

        //sort of tests that _embed parameter is ignored (striped out
        //is unit tested separately
        //TODO
        return this.sdk.getUsers({
            query: {_embed: '!@*($&!)'}
        });
    });

    it('should return ordered collection of resources', function() {
        const self = this;
        const expect = this.expect;
        const userIds = this._.reverse(this.userIds.slice()).slice(5, 10);

        return this.sdk.getUsers({query: {
            _limit: 5,
            _offset: 5,
            _sort: '-id,-created_at'
        }}).then(function(response) {
            expect(response.data.length).to.be.equal(5);
            expect(response.headers).to.have.property('link');

            response.data.forEach(function(user, index) {
                Object.keys(user).should.be.eql(['id','username', 'subscribed', 'created_at', 'updated_at']);

                expect(user.id).to.equal(userIds[index]);
                expect(user.username).to.match(/happie/);
                expect(user.subscribed).to.equal(false);
                expect(user.created_at).to.be.a('string');
                expect(user.updated_at).to.be.a('string');
            });
        });
    });

    it('should return filtered collection by id column', function() {
        const self = this;
        const expect = this.expect;
        const userIds = this.userIds;

        return this.sdk.getUsers({query: {
            id: userIds[0]
        }}).then(function(response) {
            expect(response.data.length).to.be.equal(1);
            expect(response.headers).to.have.property('link');

            const link = self.parseLinkHeader(response.headers.link);
            link.should.be.eql({
                first: {
                    rel: 'first',
                    url: `http://127.0.0.1:${self.port}/api/v1.0/users`
                },
                last: {
                    _offset: '0',
                    rel: 'last',
                    url: `http://127.0.0.1:${self.port}/api/v1.0/users?_offset=0`
                }
            });

            Object.keys(response.data[0]).should.be.eql(['id','username', 'subscribed', 'created_at', 'updated_at']);

            expect(response.data[0].id).to.equal(userIds[0]);
            expect(response.data[0].username).to.equal('happie1');
            expect(response.data[0].subscribed).to.equal(false);
            expect(response.data[0].created_at).to.be.a('string');
            expect(response.data[0].updated_at).to.be.a('string');
        });
    });

    it('should return filtered collection by username column', function() {
        const self = this;
        const expect = this.expect;
        const userIds = this.userIds;

        return this.sdk.getUsers({query: {
            username: 'happie20'
        }}).then(function(response) {
            expect(response.data.length).to.be.equal(1);
            expect(response.headers).to.have.property('link');

            Object.keys(response.data[0]).should.be.eql(['id','username', 'subscribed', 'created_at', 'updated_at']);

            expect(response.data[0].id).to.equal(self._.last(userIds));
            expect(response.data[0].username).to.equal('happie20');
            expect(response.data[0].subscribed).to.equal(false);
            expect(response.data[0].created_at).to.be.a('string');
            expect(response.data[0].updated_at).to.be.a('string');
        });
    });

    it('should NOT filter result set by password (filter should be ignored)', function() {
        const expect = this.expect;
        const userIds = this.userIds;

        return this.sdk.getUsers({query: {
            password: 'secret15'
        }}).then(function(response) {
            expect(response.data.length).to.be.equal(20);
        });
    });

    it('should return 400 json response with validation error when filter parameter value is invalid', function() {
        const self = this;
        const expect = this.expect;
        const userIds = this.userIds;

        return this.sdk.getUsers({query: {
            username: '$@!*(^$)'
        }}).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.match(/\.username/);
        });
    });
});

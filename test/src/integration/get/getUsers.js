
describe('GET /api/v1.0/users', function() {
    before(function() {
        const rows = [];

        for (let i = 0, len = 20; i < len; i++) {
            rows.push({
                username: `happie${i+1}`,
                password: `secret${i+1}`,
                subscribed: false,
                email: `email${i+1}@email.com`
            });
        }

        return this.knex.batchInsert('users', rows, 20)
            .returning('id')
            .bind(this)
            .then(function(ids) {
                this.userIds = ids;

                if (this.userIds.length == 1) {
                    /*
                     * If you insert multiple rows using a single INSERT statement,
                     * LAST_INSERT_ID() returns the value generated for the first inserted row only.
                     * The reason for this is to make it possible to reproduce
                     * easily the same INSERT statement against some other server.
                     * https://github.com/tgriesser/knex/issues/86
                     */
                    for (let i = this.userIds[0]+1, len = this.userIds[0]+20; i < len; i++) {
                        this.userIds.push(i);
                    }
                }
            });

    });

    after(function() {
        return this.knex('users').whereIn('id', this.userIds).del();
    });

    it('should return (200 code) collection of all user resources', function() {
        const expect = this.expect;
        const userIds = this.userIds;

        return this.sdk.getUsers().should.be.fulfilled.then(function(response) {
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
        }}).should.be.fulfilled.then(function(response) {
            expect(response.data.length).to.be.equal(5);
            expect(response.headers).to.have.property('link');

            const link = self.parseLinkHeader(response.headers.link);
            link.should.be.eql({
                first: {
                    limit: '5',
                    rel: 'first',
                    url: `http://127.0.0.1:${self.port}/api/v1.0/users?limit=5`
                },
                last: {
                    limit: '5',
                    offset: '15',
                    rel: 'last',
                    url: `http://127.0.0.1:${self.port}/api/v1.0/users?limit=5&offset=15`
                },
                next: {
                    offset: '10',
                    limit: '5',
                    rel: 'next',
                    url: `http://127.0.0.1:${self.port}/api/v1.0/users?offset=10&limit=5`
                },
                prev: {
                    offset: '0',
                    limit: '5',
                    rel: 'prev',
                    url: `http://127.0.0.1:${self.port}/api/v1.0/users?offset=0&limit=5`
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
        }).should.be.fulfilled;
    });

    it('should return ordered collection of resources', function() {
        const self = this;
        const expect = this.expect;
        const userIds = this._.reverse(this.userIds.slice()).slice(5, 10);

        return this.sdk.getUsers({query: {
            _limit: 5,
            _offset: 5,
            _sort: '-id,-created_at'
        }}).should.be.fulfilled.then(function(response) {
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
        }}).should.be.fulfilled.then(function(response) {
            expect(response.data.length).to.be.equal(1);
            expect(response.headers).to.have.property('link');

            const link = self.parseLinkHeader(response.headers.link);
            link.should.be.eql({
                first: {
                    rel: 'first',
                    url: `http://127.0.0.1:${self.port}/api/v1.0/users`
                },
                last: {
                    offset: '0',
                    rel: 'last',
                    url: `http://127.0.0.1:${self.port}/api/v1.0/users?offset=0`
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
        }}).should.be.fulfilled.then(function(response) {
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
        }}).should.be.fulfilled.then(function(response) {
            expect(response.data.length).to.be.equal(20);
        });
    });

    it.skip('should return 400 json response with validation error when filter parameter value is invalid', function() {
        //TODO
        const self = this;
        const expect = this.expect;
        const userIds = this.userIds;

        return this.sdk.getUsers({query: {
            username: '$@!*(^$)'
        }}).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
        });
    });
});

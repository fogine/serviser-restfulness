
describe('DELETE /api/v1.0/users', function() {
    beforeEach(function() {
        const self = this;
        return this.knex('users').insert({
            username: 'happie',
            password: 'secret',
            subscribed: true,
            email: 'email@email.com',
            created_at: this.knex.raw('now()'),
            updated_at: this.knex.raw('now()')
        }).returning('id').then(function(result) {
            self.userId = result[0];

            return self.knex('users').insert({
                username: 'happie2',
                password: 'secret2',
                subscribed: true,
                email: 'email2@email.com',
                created_at: self.knex.raw('now()'),
                updated_at: self.knex.raw('now()')
            }).returning('id');
        }).then(function(result) {
            self.userId2 = result[0];

            return self.knex('users').insert({
                username: 'happie3',
                password: 'secret3',
                subscribed: false,
                email: 'email3@email.com',
                created_at: self.knex.raw('now()'),
                updated_at: self.knex.raw('now()')
            }).returning('id');
        }).then(function(result) {
            self.userId3 = result[0];
        });
    });

    afterEach(function() {
        return this.knex('users').del();
    });

    it('should soft-delete user resource by id and return 204 with correct x-total-count header value', function() {
        const expect = this.expect;
        const knex = this.knex;
        const userId = this.userId;

        return this.sdk.deleteUsers({
            query: {
                id: userId
            }
        }).then(function(response) {
            expect(response.status).to.be.equal(204);
            expect(response.headers['x-total-count']).to.be.equal('1');

            return knex('users').where('id', userId).where('deleted_at', null).first();
        }).then(function(user) {
            expect(user).to.be.equal(undefined);
        });
    });

    it('should soft-delete all subscribed and return 204 with correct x-total-count header value', function() {
        const expect = this.expect;
        const knex = this.knex;
        const userId = this.userId3;

        return this.sdk.deleteUsers({
            query: {
                subscribed: true
            }
        }).then(function(response) {
            expect(response.status).to.be.equal(204);
            expect(response.headers['x-total-count']).to.be.equal('2');

            return knex('users').where('id', userId).where('deleted_at', null).first();
        }).then(function(user) {
            expect(user).to.be.a('object');
            expect(user.id).to.be.equal(userId);
        });
    });

    describe('_filter', function() {
        it('should soft-delete multiple user records based on provided query filter {id: {in: [<id1>,<id2>]}}', function() {
            const self = this;
            const expect = this.expect;
            const knex = this.knex;

            return this.sdk.deleteUsers({
                query: {
                    _filter: {id: {in:[self.userId, self.userId2]}}
                }
            }).then(function(response) {
                expect(response.status).to.be.equal(204);
                expect(response.headers['x-total-count']).to.be.equal('2');

                return knex('users').whereNotNull('deleted_at').pluck('id').should.eventually.be.an('array').that.is.eql([self.userId, self.userId2]);
            }).then(function(user) {
                return knex('users').where({
                    deleted_at: null,
                    id: self.userId3
                }).first().should.eventually.be.a('object');
            });
        });

        it('should return 400 json response with validation error when filter is applied to a non-primary key column', function() {
            const expect = this.expect;
            const userId = this.userId;

            return this.sdk.getUsersMovies(userId, {
                query: {
                    _filter: {username: {eq: 'happie'}}
                }
            }).should.be.rejected.then(function(response) {
                expect(response.code).to.be.equal(400);
                expect(response.apiCode).to.be.equal('validationFailure');
                expect(response.message).to.match(/._filter unsupported property username/);
            });
        });
    });

    it('should soft-delete all user resources', function() {
        const expect = this.expect;
        const knex = this.knex;

        return this.sdk.deleteUsers().then(function(response) {
            expect(response.status).to.be.equal(204);
            expect(response.headers['x-total-count']).to.be.equal('3');

            return knex('users').select().where('deleted_at', null);
        }).then(function(rows) {
            expect(rows).to.be.an('array').that.is.empty;
        });
    });

    it('should return 400 json response with validation error when id path parameter is invalid', function() {
        const expect = this.expect;

        return this.sdk.deleteUsers({
            query: {
                id: 'test'
            }
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.equal('.id should be integer');
        });
    });

    it('should not delete anything and return x-total-count=0', function() {
        const expect = this.expect;
        const knex = this.knex;
        const userId = this.userId;

        return this.sdk.deleteUsers({
            query: {
                username: '$!@)($*!)'
            }
        }).then(function(response) {
            expect(response.status).to.be.equal(204);
            expect(response.headers['x-total-count']).to.be.equal('0');

            return knex('users').select().should.eventually.be.an('array').that.has.length(3);
        });
    });
});


describe('DELETE /api/v1.0/users', function() {
    beforeEach(function() {
        return this.knex('users').insert({
            username: 'happie',
            password: 'secret',
            subscribed: true,
            email: 'email@email.com'
        }).returning('id').bind(this).then(function(result) {
            this.userId = result[0];

            return this.knex('users').insert({
                username: 'happie2',
                password: 'secret2',
                subscribed: true,
                email: 'email2@email.com'
            }).returning('id');
        }).then(function(result) {
            this.userId2 = result[0];

            return this.knex('users').insert({
                username: 'happie3',
                password: 'secret3',
                subscribed: false,
                email: 'email3@email.com'
            }).returning('id');
        }).then(function(result) {
            this.userId3 = result[0];
        });
    });

    afterEach(function() {
        return this.knex('users').del();
    });

    it('should delete user resource by id and return 204 with correct x-total-count header value', function() {
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

            return knex('users').where('id', userId).first();
        }).then(function(user) {
            expect(user).to.be.equal(undefined);
        });
    });

    it('should delete all subscribed and return 204 with correct x-total-count header value', function() {
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

            return knex('users').where('id', userId).first();
        }).then(function(user) {
            expect(user).to.be.a('object');
            expect(user.id).to.be.equal(userId);
        });
    });

    it('should delete all user resources', function() {
        const expect = this.expect;
        const knex = this.knex;

        return this.sdk.deleteUsers().then(function(response) {
            expect(response.status).to.be.equal(204);
            expect(response.headers['x-total-count']).to.be.equal('3');

            return knex('users').select();
        }).then(function(rows) {
            expect(rows).to.be.an('array').that.is.empty;
        });
    });

    it('should return 400 json response with validation error when username path parameter is invalid', function() {
        const expect = this.expect;

        return this.sdk.deleteUsers({
            query: {
                username: '$!@)($*!)'
            }
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.equal('.username should match pattern "^[a-z0-9-_]+$"');
        });
    });
});

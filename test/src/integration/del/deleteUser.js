
describe('DELETE /api/v1.0/users/:column', function() {
    beforeEach(function() {
        const self = this;
        return this.knex('users').insert({
            username: 'happie',
            password: 'secret',
            subscribed: false,
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
        });
    });

    afterEach(function() {
        return this.knex('users').del();
    });

    it('should soft-delete user resource by id and return 204', function() {
        const expect = this.expect;
        const knex = this.knex;
        const userId = this.userId;

        return this.sdk.deleteUser(this.userId).then(function(response) {
            expect(response.status).to.be.equal(204);

            return knex('users').where('id', userId).where('deleted_at', null).first();
        }).then(function(user) {
            expect(user).to.be.equal(undefined);
        });
    });

    it('should soft-delete user resource by username and return 204', function() {
        const expect = this.expect;
        const knex = this.knex;
        const userId = this.userId2;

        return this.sdk.deleteUser('happie2').then(function(response) {
            expect(response.status).to.be.equal(204);

            return knex('users').where('id', userId).where('deleted_at', null).first();
        }).then(function(user) {
            expect(user).to.be.equal(undefined);
        });
    });

    it('should return 410 status code when there was no resource to delete', function() {
        const self = this;
        const expect = this.expect;

        return this.knex('users').del().then(function() {
            return self.sdk.deleteUser(self.userId);
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(410);
            expect(response.message).to.be.equal('Gone');
        });
    });

    it('should return 400 json response with validation error when username path parameter is invalid', function() {
        const expect = this.expect;

        return this.sdk.deleteUser('$!$@$!@').should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.equal('.username should match pattern "^[a-z0-9-_]+$"');
        });
    });
});

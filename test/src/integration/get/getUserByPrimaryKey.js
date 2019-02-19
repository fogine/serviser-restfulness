
describe('GET /api/v1.0/users/:id', function() {
    before(function() {
        return this.knex('users').insert({
            username: 'happie',
            password: 'secret',
            subscribed: false,
            email: 'email@email.com',
            created_at: this.knex.raw('now()'),
            updated_at: this.knex.raw('now()')
        }).returning('id').bind(this).then(function(result) {
            this.userId = result[0];

            return this.knex('users').insert({
                username: 'happie2',
                password: 'secret2',
                subscribed: false,
                email: 'email2@email.com',
                created_at: this.knex.raw('now()'),
                updated_at: this.knex.raw('now()'),
                deleted_at: this.knex.raw('now()')
            }).returning('id');
        }).then(function(result) {
            this.userId2 = result[0];
        });
    });

    after(function() {
        return this.knex('users').whereIn('id', [this.userId, this.userId2]).del();
    });

    it('should return 200 json response with user details', function() {
        const expect = this.expect;
        const userId = this.userId;

        return this.sdk.getUser(this.userId).should.be.fulfilled.then(function(response) {
            Object.keys(response.data).should.be.eql(['id','username', 'subscribed', 'created_at', 'updated_at']);

            expect(response.data.id).to.equal(userId);
            expect(response.data.username).to.equal('happie');
            expect(response.data.subscribed).to.equal(false);
            expect(response.data.created_at).to.be.a('string');
            expect(response.data.updated_at).to.be.a('string');
        });
    });

    it('should not accept _embed query parameter', function() {
        const expect = this.expect;
        const userId = this.userId;

        return this.sdk.getUser(this.userId, {
            query: {_embed: '!@*($&!)'}
        }).should.be.fulfilled;
    });

    it('should return 400 json response with user.notFound api code', function() {
        const expect = this.expect;

        return this.sdk.getUser(1000000).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('user.notFound');
            expect(response.message).to.be.equal('user not found');
        });
    });

    it('should return 400 json response with user.notFound api code when the user record is soft deleted', function() {
        const expect = this.expect;

        return this.sdk.getUser(this.userId2).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('user.notFound');
            expect(response.message).to.be.equal('user not found');
        });
    });

    it('should return 400 json response with validation error when primary key is too large', function() {
        const expect = this.expect;

        return this.sdk.getUser('100000000').should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.equal('.id should be <= 10000000');
        });
    });
});

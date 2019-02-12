
describe('GET /api/v1.0/users/:username', function() {
    before(function() {
        return this.knex('users').insert({
            username: 'happie',
            password: 'secret',
            subscribed: false,
            email: 'email@email.com'
        }).returning('id').bind(this).then(function(result) {
            this.userId = result[0];
        });
    });

    after(function() {
        return this.knex('users').where({username: 'happie'}).del();
    });

    it('should return 200 json response with user details', function() {
        const expect = this.expect;
        const userId = this.userId;

        /*
         * get users/:username can has the same sdk method as get users/:id
         * so lets use sdk.getUser
         */
        return this.sdk.getUser('happie').should.be.fulfilled.then(function(response) {
            Object.keys(response.data).should.be.eql(['id','username', 'subscribed', 'created_at', 'updated_at']);

            expect(response.data.id).to.equal(userId);
            expect(response.data.username).to.equal('happie');
            expect(response.data.subscribed).to.equal(false);
            expect(response.data.created_at).to.be.a('string');
            expect(response.data.updated_at).to.be.a('string');
        });
    });

    it('should return 400 json response with user.notFound api code', function() {
        const expect = this.expect;

        return this.sdk.getUser('not-happy').should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('user.notFound');
            expect(response.message).to.be.equal('user not found');
        });
    });

    it('should return 400 json response with validation error when invalid primary key value is provided', function() {
        const expect = this.expect;

        return this.sdk.getUser('invalid+value').should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.equal('.username should match pattern "^[a-z0-9-_]+$"');
        });
    });
});

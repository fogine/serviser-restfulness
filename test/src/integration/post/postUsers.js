
describe('POST /api/v1.0/users', function() {
    after(function() {
        return this.knex('users').del();
    });

    it('should create a new user row in users table and return correct Location header', function() {
        const knex = this.knex;
        const sdk = this.sdk;
        const expect = this.expect;
        let userId;

        return this.sdk.postUsers({data: {
            username: 'happie',
            password: 'verysecretpassword',
            subscribed: true,
            email: 'happie@email.com'
        }}).then(function(response) {
            response.headers.should.have.property('location').that.is.a('string');

            return knex('users').select().where('username', 'happie').then(function(rows) {
                const user = rows[0];
                userId = user.id;

                user.should.have.property('created_at').that.is.a.dateString();
                user.should.have.property('updated_at').that.is.a.dateString();
                delete user.created_at;
                delete user.updated_at;

                user.should.be.eql({
                    id: user.id,
                    username: 'happie',
                    password: 'verysecretpassword',
                    subscribed: true,
                    email: 'happie@email.com',
                    deleted_at: null
                });

                return sdk.$request({
                    method: 'get',
                    url: response.headers.location
                });
            }).then(function(response) {
                Object.keys(response.data).should.be.eql(['id','username', 'subscribed', 'created_at', 'updated_at']);
                expect(response.data.id).to.equal(userId);
            });

        });
    });

    it('should fail with 400 validationFailure error when email validation fails', function() {
        const expect = this.expect;

        return this.sdk.postUsers({data: {
            username: 'happie',
            password: 'verysecretpassword',
            subscribed: true,
            email: 'notvalidemailaddress'
        }}).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.match(/\.email/);
        });
    });


    it('should fail with 400 validationFailure error when username is invalid', function() {
        const expect = this.expect;

        return this.sdk.postUsers({data: {
            username: 'invalid-username"',
            password: 'verysecretpassword',
            subscribed: true,
            email: 'email@email.com'
        }}).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.match(/\.username/);
        });
    });

    it('should fail with 400 user.alreadyExists apiCode', function() {
        const expect = this.expect;

        return this.sdk.postUsers({data: {
            username: 'happie',
            password: 'verysecretpassword',
            subscribed: true,
            email: 'email2@email.com'
        }}).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('uniqueConstraintFailure');
            expect(response.message).to.be.match(/username/);
        });
    });
});

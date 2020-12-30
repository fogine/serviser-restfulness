
describe('PUT /api/v1.0/users/:column', function() {
    beforeEach(function() {
        const self = this;
        return this.knex('users').insert({
            username: 'happie',
            password: 'secret',
            subscribed: false,
            email: 'email@email.com',
            created_at: self.knex.raw('now()'),
            updated_at: self.knex.raw('now()')
        }).returning('id').then(function(result) {
            self.userId = result[0];

            return self.Promise.delay(1000);//so day updated_at timestamp has different value
        });
    });

    afterEach(function() {
        return this.knex('users').del();
    });

    it('should update the user record and return current resource data', function() {
        const knex = this.knex;
        const expect = this.expect;
        const userId = this.userId;

        return this.sdk.putUser(this.userId, {data: {
            username: 'happie-updated',
            subscribed: true,
            email: 'happie-updated@email.com'
        }}).then(function(response) {
            assertUpdatedUserEntity(response.data);

            return knex('users').select().where('id', userId).then(function(rows) {
                const user = rows[0];
                expect(user.password).to.be.equal('secret');
                expect(user.email).to.be.equal('happie-updated@email.com');
                expect(user.deleted_at).to.be.a.dateString();

                delete user.password;
                delete user.email;
                delete user.deleted_at;
                assertUpdatedUserEntity(user);
            });

            function assertUpdatedUserEntity(user) {
                Object.keys(user).should.be.eql(['id','username', 'subscribed', 'created_at', 'updated_at']);
                user.should.have.property('created_at').that.is.a.dateString();
                user.should.have.property('updated_at').that.is.a.dateString().and.that.is.not.equal(user.created_at);
                delete user.created_at;
                delete user.updated_at;

                user.should.be.eql({
                    id: user.id,
                    username: 'happie-updated',
                    subscribed: true
                });
            }

        });
    });

    it('should update the user by username and return current resource data', function() {
        const knex = this.knex;
        const expect = this.expect;
        const userId = this.userId;

        return this.sdk.putUser('happie', {data: {
            username: 'happie-updated',
            subscribed: true,
            email: 'happie-updated@email.com'
        }}).then(function(response) {
            assertUpdatedUserEntity(response.data);

            return knex('users').select().where('id', userId).then(function(rows) {
                const user = rows[0];
                expect(user.password).to.be.equal('secret');
                expect(user.email).to.be.equal('happie-updated@email.com');
                expect(user.deleted_at).to.be.a.dateString();

                delete user.password;
                delete user.email;
                delete user.deleted_at;
                assertUpdatedUserEntity(user);
            });

            function assertUpdatedUserEntity(user) {
                Object.keys(user).should.be.eql(['id','username', 'subscribed', 'created_at', 'updated_at']);
                user.should.have.property('created_at').that.is.a.dateString();
                user.should.have.property('updated_at').that.is.a.dateString().and.that.is.not.equal(user.created_at);
                delete user.created_at;
                delete user.updated_at;

                user.should.be.eql({
                    id: user.id,
                    username: 'happie-updated',
                    subscribed: true
                });
            }

        });
    });


    it('should ignore created_at property', function() {
        const knex = this.knex;
        const expect = this.expect;
        const userId = this.userId;

        return this.sdk.putUser(this.userId, {data: {
            created_at: '2000-01-01'
        }}).then(function(response) {
            assertUpdatedUserEntity(response.data);

            return knex('users').select().where('id', userId).then(function(rows) {
                const user = rows[0];
                expect(user.password).to.be.equal('secret');
                expect(user.email).to.be.equal('email@email.com');
                expect(user.deleted_at).to.be.a.dateString();

                delete user.password;
                delete user.email;
                delete user.deleted_at;
                assertUpdatedUserEntity(user);
            });

            function assertUpdatedUserEntity(user) {
                Object.keys(user).should.be.eql(['id','username', 'subscribed', 'created_at', 'updated_at']);
                user.should.have.property('created_at').that.is.a.dateString();
                user.should.have.property('created_at').that.not.match(/2000-01-01/);
                user.should.have.property('updated_at').that.is.a.dateString();
                delete user.created_at;
                delete user.updated_at;

                user.should.be.eql({
                    id: user.id,
                    username: 'happie',
                    subscribed: false
                });
            }

        });
    });

    it('should fail with 400 validationFailure error when email validation fails', function() {
        const expect = this.expect;

        return this.sdk.putUser(this.userId, {data: {
            email: 'notvalidemailaddress'
        }}).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.match(/\.email/);
        });
    });
});

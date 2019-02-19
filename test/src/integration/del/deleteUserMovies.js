
describe('DELETE /api/v1.0/users/:column/movies', function() {
    beforeEach(function() {
        return this.knex('countries').insert({
            name: 'United States',
            code_2: 'US',
        }).returning('id').bind(this).then(function(result) {
            this.countryId = result[0];

            return this.knex('users').insert({
                username: 'happie',
                password: 'secret',
                subscribed: false,
                email: 'email@email.com',
                created_at: this.knex.raw('now()'),
                updated_at: this.knex.raw('now()')
            }).returning('id')
        }).then(function(result) {
            this.userId = result[0];

            return this.knex('movies').insert({
                name: 'name',
                description: 'description',
                released_at: '2019-01-01',
                country_id: this.countryId,
                rating: 10
            }).returning('id');
        }).then(function(result) {
            this.movieId = result[0];

            return this.knex('movies').insert({
                name: 'name2',
                description: 'description2',
                released_at: '2019-01-01',
                rating: 1
            }).returning('id');
        }).then(function(result) {
            this.movieId2 = result[0];

            return this.knex('movies_users').insert({
                movie_id: this.movieId,
                user_id: this.userId
            }).returning('id');
        }).then(function(result) {
            this.movieUserId = result[0];

            return this.knex('movies_users').insert({
                movie_id: this.movieId2,
                user_id: this.userId
            }).returning('id');
        }).then(function(result) {
            this.movieUserId2 = result[0];
        });
    });

    afterEach(function() {
        return this.knex('movies_users').whereIn('id', [this.movieUserId, this.movieUserId2]).del()
            .del().bind(this).then(function() {
                return this.knex('movies').whereIn('id', [this.movieId, this.movieId2]).del();
            }).then(function() {
                return this.knex('users').where({id: this.userId}).del();
            }).then(function() {
                return this.knex('countries').where({id: this.countryId}).del();
            });
    });

    it('should deassociate all movies from the user by user id and return 204 with correct x-total-count header', function() {
        const self = this;

        return this.sdk.deleteUsersMovies(self.userId).then(function(response) {
            self.expect(response.status).to.be.equal(204);
            self.expect(response.headers['x-total-count']).to.be.equal('2');

            return self.knex('users').where('id', self.userId).first().should.eventually.be.a('object');
        }).then(function(user) {
            return self.knex('movies').select().should.eventually.be.an('array').that.has.length(2);
        }).then(function() {
            return self.knex('movies_users').select().should.eventually.be.an('array').that.is.empty;
        });
    });

    it('should deassociate all movies from the user by user username and return 204 with correct x-total-count header', function() {
        const self = this;

        return this.sdk.deleteUsersMovies('happie').then(function(response) {
            self.expect(response.status).to.be.equal(204);
            self.expect(response.headers['x-total-count']).to.be.equal('2');

            return self.knex('users').where('id', self.userId).first().should.eventually.be.a('object');
        }).then(function(user) {
            return self.knex('movies').select().should.eventually.be.an('array').that.has.length(2);
        }).then(function() {
            return self.knex('movies_users').select().should.eventually.be.an('array').that.is.empty;
        });
    });

    it('should deassociate movies with rating 10 from the user and return 204 with correct x-total-count header', function() {
        const self = this;

        return this.sdk.deleteUsersMovies(self.userId, {
            query: {
                rating: 10
            }
        }).then(function(response) {
            self.expect(response.status).to.be.equal(204);
            self.expect(response.headers['x-total-count']).to.be.equal('1');

            return self.knex('users').where('id', self.userId).first().should.eventually.be.a('object');
        }).then(function(user) {
            return self.knex('movies').select().should.eventually.be.an('array').that.has.length(2);
        }).then(function() {
            return self.knex('movies_users').first().should.eventually.be.a('object').that.has.property('id', self.movieUserId2);
        });
    });

    it('should not delete nor deassociate anything and return 204 with correct x-total-count header', function() {
        const self = this;

        return this.sdk.deleteUsersMovies(self.userId, {
            query: {
                rating: 5
            }
        }).then(function(response) {
            self.expect(response.status).to.be.equal(204);
            self.expect(response.headers['x-total-count']).to.be.equal('0');

            return self.knex('users').where('id', self.userId).first().should.eventually.be.a('object');
        }).then(function(user) {
            return self.knex('movies').select().should.eventually.be.an('array').that.has.length(2);
        }).then(function() {
            return self.knex('movies_users').select().should.eventually.be.an('array').that.has.length(2);
        });
    });

    it('should return 400 json response with validation error when username path parameter is invalid', function() {
        const expect = this.expect;

        return this.sdk.deleteUsersMovies('$!$@$!@').should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.equal('.username should match pattern "^[a-z0-9-_]+$"');
        });
    });
});

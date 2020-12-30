
describe('DELETE /api/v1.0/users/:column/reviews/:column', function() {
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

            return self.knex('movies').insert({
                name: 'name',
                description: 'description',
                released_at: '2019-01-01',
                country_id: self.countryId,
                rating: 10
            }).returning('id');
        }).then(function(result) {
            self.movieId = result[0];

            return self.knex('reviews').insert({
                stars: 10,
                comment: 'comment',
                movie_id: self.movieId,
                user_id: self.userId
            }).returning('id');
        }).then(function(result) {
            self.reviewId = result[0];
            return self.knex('users').insert({
                username: 'happie22',
                password: 'secret2',
                subscribed: false,
                email: 'email2@email.com',
                created_at: self.knex.raw('now()'),
                updated_at: self.knex.raw('now()')
            }).returning('id');
        }).then(function(result) {
            self.userId2 = result[0];
        });
    });

    afterEach(function() {
        const self = this;
        return this.knex('reviews').where({id: this.reviewId})
            .del().then(function() {
                return self.knex('movies').whereIn('id', [self.movieId]).del();
            }).then(function() {
                return self.knex('users').whereIn('id', [self.userId, self.userId2]).del();
            });
    });

    it('should remove review resource that belongs to the user by review id and user id and return 204', function() {
        const self = this;

        return this.sdk.deleteUsersReview(self.userId, self.reviewId).then(function(response) {
            self.expect(response.status).to.be.equal(204);

            return self.knex('users').select().should.eventually.be.an('array').that.has.length(2);
        }).then(function(user) {
            return self.knex('movies').first().should.eventually.be.a('object').that.has.property('id', self.movieId);
        }).then(function(movies) {
            return self.knex('reviews').select().should.eventually.be.an('array').that.has.length(0);
        });
    });

    it('should remove review resource that belongs to the user by review movie_id and user username and return 204', function() {
        const self = this;

        return this.sdk.deleteUsersReview('happie', self.movieId).then(function(response) {
            self.expect(response.status).to.be.equal(204);

            return self.knex('users').select().should.eventually.be.an('array').that.has.length(2);
        }).then(function(user) {
            return self.knex('movies').first().should.eventually.be.a('object').that.has.property('id', self.movieId);
        }).then(function(movies) {
            return self.knex('reviews').select().should.eventually.be.an('array').that.has.length(0);
        });
    });

    it('should return 410 status code when there was no resource to delete', function() {
        const self = this;
        const expect = this.expect;

        return this.knex('reviews').del().then(function() {
            return self.sdk.deleteUsersReview(self.userId2, self.reviewId);
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(410);
            expect(response.message).to.be.equal('Gone');
        });
    });

    it('should return 400 json response with validation error when username path parameter is invalid', function() {
        const expect = this.expect;

        return this.sdk.deleteUsersReview('$!$@$!@', this.movieId).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.equal('.username should match pattern "^[a-z0-9-_]+$"');
        });
    });
});

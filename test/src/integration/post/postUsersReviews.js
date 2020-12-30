
describe('POST /api/v1.0/users/:column/reviews', function() {
    before(function() {
        const self = this;
        return self.knex('users').insert({
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
                rating: 10
            }).returning('id');
        }).then(function(result) {
            self.movieId = result[0];
        });
    });

    after(function() {
        const self = this;
        return self.knex('reviews').del().then(function() {
            return self.knex('users').del();
        }).then(function() {
            return self.knex('movies').del();
        });
    });

    it('should create a new user review row in reviews table and return correct Location header', function() {
        const self = this;
        let reviewId;

        return this.sdk.postUsersReviews(self.userId, {data: {
            stars: 5,
            comment: 'comment',
            movie_id: self.movieId,
            user_id: self.userId
        }}).then(function(response) {
            return self.knex('reviews').where('comment', 'comment').first().then(function(review) {
                reviewId = review.id;

                response.headers.should.have.property('location')
                    .that.is.equal(`http://127.0.0.1:${self.port}/api/v1.0/users/${self.userId}/reviews/${reviewId}`);

                review.should.be.eql({
                    id: review.id,
                    movie_id: self.movieId,
                    user_id: self.userId,
                    stars: 5,
                    comment: 'comment'
                });

                return self.sdk.$request({
                    method: 'get',
                    url: response.headers.location
                });
            }).then(function(response) {
                Object.keys(response.data).should.be.eql(['id', 'stars', 'comment','movie_id', 'user_id']);
                self.expect(response.data.id).to.equal(reviewId);
            });

        });
    });

    it('should create a new user review in reviews table via username user identifier and return correct Location header', function() {
        const self = this;
        let reviewId;

        return this.sdk.postUsersReviews('happie', {data: {
            stars: 5,
            comment: 'comment2',
            movie_id: self.movieId
        }}).then(function(response) {
            return self.Promise.delay(500).then(function() {
                return self.knex('reviews').where('comment', 'comment2').first();
            }) .then(function(review) {
                reviewId = review.id;

                response.headers.should.have.property('location')
                    .that.is.equal(`http://127.0.0.1:${self.port}/api/v1.0/users/${self.userId}/reviews/${reviewId}`);

                review.should.be.eql({
                    id: review.id,
                    movie_id: self.movieId,
                    user_id: self.userId,
                    stars: 5,
                    comment: 'comment2'
                });

                return self.sdk.$request({
                    method: 'get',
                    url: response.headers.location
                });
            }).then(function(response) {
                Object.keys(response.data).should.be.eql(['id', 'stars', 'comment','movie_id', 'user_id']);
                self.expect(response.data.id).to.equal(reviewId);
            });

        });
    });

    it('should fail with 400 validationFailure error when movie_id validation fails', function() {
        const expect = this.expect;

        return this.sdk.postUsersReviews(this.userId, {data: {
            stars: 5,
            comment: 'comment',
            movie_id: 0
        }}).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.match(/\.movie_id/);
        });
    });
});

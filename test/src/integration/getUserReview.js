
describe('GET /api/v1.0/users/:user_id/reviews/:review_id', function() {
    before(function() {
        return this.knex('users').insert({
            username: 'happie',
            password: 'secret',
            subscribed: false,
            email: 'email@email.com'
        }).returning('id').bind(this).then(function(result) {
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

            return this.knex('reviews').insert({
                stars: 10,
                comment: 'comment',
                movie_id: this.movieId,
                user_id: this.userId
            }).returning('id');
        }).then(function(result) {
            this.reviewId = result[0];
            return this.knex('users').insert({
                username: 'happie22',
                password: 'secret2',
                subscribed: false,
                email: 'email2@email.com'
            }).returning('id');
        }).then(function(result) {
            this.userId2 = result[0];
        });
    });

    after(function() {
        return this.knex('reviews').where({id: this.reviewId})
            .del().bind(this).then(function() {
                return this.knex('movies').whereIn('id', [this.movieId]).del();
            }).then(function() {
                return this.knex('users').whereIn('id', [this.userId, this.userId2]).del();
            });
    });

    it('should return 200 json response with user details', function() {
        const expect = this.expect;
        const userId = this.userId;
        const reviewId = this.reviewId;
        const movieId = this.movieId;

        return this.sdk.getUsersReview(userId, reviewId).should.be.fulfilled.then(function(response) {
            Object.keys(response.data).should.be.eql(['id', 'stars', 'comment', 'movie_id', 'user_id']);

            expect(response.data.id).to.equal(reviewId);
            expect(response.data.comment).to.equal('comment');
            expect(response.data.stars).to.equal(10);
            expect(response.data.movie_id).to.equal(movieId);
            expect(response.data.user_id).to.equal(userId);
        });
    });

    it('should embed user & movie resources in the review response', function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieId = this.movieId;
        const reviewId = this.reviewId;

        return this.sdk.getUsersReview(userId, reviewId, {
            query: {_embed: 'movie,user'}
        }).should.be.fulfilled.then(function(response) {
            Object.keys(response.data).should.be.eql(['id', 'stars', 'comment', 'movie_id', 'user_id', 'movie', 'user']);

            expect(response.data.id).to.equal(reviewId);
            expect(response.data.comment).to.equal('comment');
            expect(response.data.stars).to.equal(10);
            expect(response.data.movie_id).to.equal(movieId);
            expect(response.data.user_id).to.equal(userId);

            expect(response.data.user.created_at).to.be.a('string');
            expect(response.data.user.updated_at).to.be.a('string');
            expect(response.data.movie.released_at).to.be.a('string');

            delete response.data.user.created_at;
            delete response.data.user.updated_at;
            delete response.data.movie.released_at;

            expect(response.data.user).to.be.eql({
                id: userId,
                username: 'happie',
                subscribed: false
            });

            expect(response.data.movie).to.be.eql({
                id: movieId,
                name: 'name',
                country_id: 0,
                rating: 10
            });
        });
    });

    it('should return 400 json response with review.notFound api code when association does NOT exist', function() {
        const expect = this.expect;

        return this.sdk.getUsersReview(this.userId2, this.reviewId).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('review.notFound');
            expect(response.message).to.be.equal('review not found');
        });
    });
});

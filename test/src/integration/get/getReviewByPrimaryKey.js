
describe('GET /api/v1.0/reviews/:id', function() {
    before(function() {
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

            return self.knex('movies').insert({
                name: 'Star Trek',
                description: 'description',
                released_at: '2018-01-10',
                rating: 10
            }).returning('id');
        }).then(function(result) {
            self.movieId = result[0];

            return self.knex('reviews').insert({
                stars: 8,
                comment: 'comment',
                movie_id: self.movieId,
                user_id: self.userId
            }).returning('id');
        }).then(function(result) {
            self.reviewId = result[0];
        });
    });

    after(function() {
        const self = this;
        let ids = [this.reviewId, this.userId, this.movieId];

        return this.Promise.each(['reviews', 'users', 'movies'], function(table, index) {
            return self.Promise.resolve(self.knex(table).where({id: ids[index]}).del()).reflect();
        });
    });

    it('should return 200 json response with review details', function() {
        const expect = this.expect;
        const reviewId = this.reviewId;
        const userId = this.userId;
        const movieId = this.movieId;

        return this.sdk.getReview(reviewId).should.be.fulfilled.then(function(response) {
            Object.keys(response.data).should.be.eql(['id','stars', 'comment', 'movie_id', 'user_id']);

            expect(response.data.id).to.equal(reviewId);
            expect(response.data.stars).to.equal(8);
            expect(response.data.comment).to.equal('comment');
            expect(response.data.user_id).to.be.equal(userId);
            expect(response.data.movie_id).to.be.equal(movieId);
        });
    });

    it('should embed user and movie resource in the response json', function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieId = this.movieId;
        const reviewId = this.reviewId;

        return this.sdk.getReview(reviewId, {
            query: {_embed: 'user,movie'}
        }).should.be.fulfilled.then(function(response) {
            expect(response.status).to.be.equal(200);

            Object.keys(response.data).should.be.eql(['id','stars', 'comment', 'movie_id', 'user_id', 'user', 'movie']);

            response.data.user.should.have.property('created_at').that.is.a('string');
            response.data.user.should.have.property('updated_at').that.is.a('string');
            response.data.movie.should.have.property('released_at').that.is.a('string');
            delete response.data.user.created_at;
            delete response.data.user.updated_at;
            delete response.data.movie.released_at;

            response.data.should.be.eql({
                id: reviewId,
                stars: 8,
                comment: 'comment',
                movie_id: movieId,
                user_id: userId,
                user: {
                    id: userId,
                    username: 'happie',
                    subscribed: false
                },
                movie: {
                    id: movieId,
                    country_id: 0, //TODO should be null, update serviser ajv and define field as nullable
                    name: 'Star Trek',
                    rating: 10
                }
            })
        });
    });

    it('should embed specific user and movie resource properties in the response json', function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieId = this.movieId;
        const reviewId = this.reviewId;

        return this.sdk.getReview(reviewId, {
            query: {_embed: 'user.username,movie.name,user.subscribed'}
        }).should.be.fulfilled.then(function(response) {
            expect(response.status).to.be.equal(200);

            Object.keys(response.data).should.be.eql(['id','stars', 'comment', 'movie_id', 'user_id', 'user', 'movie']);

            response.data.should.be.eql({
                id: reviewId,
                stars: 8,
                comment: 'comment',
                movie_id: movieId,
                user_id: userId,
                user: {
                    username: 'happie',
                    subscribed: false
                },
                movie: {
                    name: 'Star Trek'
                }
            })
        });
    });

    it('should return 400 response when requested property to eager load doesnt exist or is private/internal only', function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieId = this.movieId;
        const reviewId = this.reviewId;

        return this.sdk.getReview(reviewId, {
            query: {_embed: 'user.password'}
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            response.message.should.match(/Can not embed user.password. Invalid _embed resource./);
        });
    });

    it('should return 400 validation error response when _embed parameter is invalid', function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieId = this.movieId;
        const reviewId = this.reviewId;

        return this.sdk.getReview(reviewId, {
            query: {_embed: '$$&@!($)'}
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
        });
    });

    it('should return 400 json response with review.notFound api code', function() {
        const expect = this.expect;

        return this.sdk.getReview(1000000).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('review.notFound');
            expect(response.message).to.be.equal('review not found');
        });
    });

    it('should return 400 json response with validation error when invalid primary key value is provided', function() {
        const expect = this.expect;

        return this.sdk.getReview('invalid_value').should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.equal('.id should be integer');
        });
    });

    it('should return 400 json response with validation error when no primary key is provided', function() {
        const expect = this.expect;

        return this.sdk.getReview().should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.equal('.id should be integer');
        });
    });
});

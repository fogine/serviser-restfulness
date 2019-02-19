describe('GET /api/v1.0/reviews', function() {
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

            const movieRows = [];
            for (let i = 0, len = 20; i < len; i++) {
                movieRows.push({
                    name: `Title${i+1}`,
                    description: `description${i+1}`,
                    released_at: '2018-01-10',
                    rating: 10
                });
            }

            return this.knex.batchInsert('movies', movieRows, 20).returning('id');
        }).bind(this).then(function(ids) {
            this.movieIds = this.utils.expandResourceIds(ids, 20);

            const reviewRows = [];
            for (let i = 0, len = 20; i < len; i++) {
                reviewRows.push({
                    comment: `comment${i+1}`,
                    movie_id: this.movieIds[i],
                    user_id: this.userId,
                    stars: 8
                });
            }

            return this.knex.batchInsert('reviews', reviewRows, 20).returning('id');
        }).bind(this).then(function(ids) {
            this.reviewIds = this.utils.expandResourceIds(ids, 20);
        });
    });

    after(function() {
        const self = this;
        let ids = [this.reviewIds, this.userId, this.movieIds];

        return this.Promise.each(['reviews', 'users', 'movies'], function(table, index) {
            const delQuery = self.knex(table);
            if (ids[index] instanceof Array) {
                delQuery.whereIn('id', ids[index]);
            } else {
                delQuery.where({id: ids[index]});
            }

            return delQuery.del().reflect()
        });
    });

    it('should return (200 code) collection of all review resources', function() {
        const expect = this.expect;
        const userId = this.userId;
        const reviewIds = this.reviewIds;
        const movieIds = this.movieIds;

        return this.sdk.getReviews().then(function(response) {
            expect(response.data.length).to.be.equal(20);

            response.data.forEach(function(review, index) {
                Object.keys(review).should.be.eql(['id','stars', 'comment', 'movie_id', 'user_id']);

                expect(review.id).to.equal(reviewIds[index]);
                expect(review.stars).to.equal(8);
                expect(review.comment).to.equal(`comment${index+1}`);
                expect(review.user_id).to.be.equal(userId);
                expect(review.movie_id).to.be.equal(movieIds[index]);
            });
        });
    });

    it('should embed user and movie resource in the response json', function() {
        const expect = this.expect;
        const userId = this.userId;
        const reviewIds = this.reviewIds;
        const movieIds = this.movieIds;

        return this.sdk.getReviews({
            query: {
                _embed: 'user,movie',
                _sort: 'id'
            }
        }).then(function(response) {
            expect(response.status).to.be.equal(200);
            expect(response.data.length).to.be.equal(20);

            response.data.forEach(function(review, index) {
                Object.keys(review).should.be.eql(['id','stars', 'comment', 'movie_id', 'user_id', 'user', 'movie']);

                review.user.should.have.property('created_at').that.is.a('string');
                review.user.should.have.property('updated_at').that.is.a('string');
                review.movie.should.have.property('released_at').that.is.a('string');
                delete review.user.created_at;
                delete review.user.updated_at;
                delete review.movie.released_at;

                review.should.be.eql({
                    id: reviewIds[index],
                    stars: 8,
                    comment: `comment${index+1}`,
                    movie_id: movieIds[index],
                    user_id: userId,
                    user: {
                        id: userId,
                        username: 'happie',
                        subscribed: false
                    },
                    movie: {
                        id: movieIds[index],
                        name: `Title${index+1}`,
                        country_id: 0,
                        rating: 10
                    }
                })
            });
        });
    });

    it('should embed specific user and movie resource properties in the response json', function() {
        const expect = this.expect;
        const userId = this.userId;
        const reviewIds = this.reviewIds;
        const movieIds = this.movieIds;

        return this.sdk.getReviews({
            query: {
                _embed: 'user.username,movie.name,user.subscribed',
                _sort: 'id'
            }
        }).then(function(response) {
            expect(response.status).to.be.equal(200);
            expect(response.data.length).to.be.equal(20);

            response.data.forEach(function(review, index) {
                Object.keys(review).should.be.eql(['id','stars', 'comment', 'movie_id', 'user_id', 'user', 'movie']);

                review.should.be.eql({
                    id: reviewIds[index],
                    stars: 8,
                    comment: `comment${index+1}`,
                    movie_id: movieIds[index],
                    user_id: userId,
                    user: {
                        username: 'happie',
                        subscribed: false
                    },
                    movie: {
                        name: `Title${index+1}`
                    }
                })
            });
        });
    });

    it('should return 400 response when requested property to eager load doesnt exist or is private/internal only', function() {
        const expect = this.expect;

        return this.sdk.getReviews({
            query: {_embed: 'user.password'}
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            response.message.should.match(/Invalid _embed parameter resource path/);
        });
    });

    it('should return 400 validation error response when _embed parameter is invalid', function() {
        const expect = this.expect;

        return this.sdk.getReviews({
            query: {_embed: '$$&@!($)'}
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
        });
    });
});

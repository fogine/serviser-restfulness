
describe('GET /api/v1.0/users/:column/reviews', function() {
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

            const movieRows = [];
            for (let i = 0, len = 20; i < len; i++) {
                movieRows.push({
                    name: `Title${i+1}`,
                    description: `description${i+1}`,
                    released_at: '2018-01-10',
                    rating: 10
                });
            }

            return self.knex.batchInsert('movies', movieRows, 20).returning('id');
        }).then(function(ids) {
            self.movieIds = self.utils.expandResourceIds(ids, 20);

            const reviewRows = [];
            for (let i = 0, len = 20; i < len; i++) {
                reviewRows.push({
                    stars: 10,
                    comment: 'comment',
                    //2 reviews without associated movie for a test case
                    movie_id: i < 18 ? self.movieIds[i] : null,
                    user_id: self.userId
                });
            }
            return self.knex.batchInsert('reviews', reviewRows, 20).returning('id');
        }).then(function(ids) {
            self.reviewIds = self.utils.expandResourceIds(ids, 20);

            return self.knex('users').insert({
                username: 'happie22',
                password: 'secret2',
                subscribed: false,
                email: 'email2@email.com',
                created_at: self.knex.raw('now()'),
                updated_at: self.knex.raw('now()'),
                deleted_at: self.knex.raw('now()')
            }).returning('id');
        }).then(function(result) {
            self.deletedUserId = result[0];

            return self.knex('reviews').insert({
                stars: 8,
                comment: 'comment',
                movie_id: self.movieIds[0],
                user_id: self.deletedUserId
            }).returning('id');
        }).then(function(result) {
            self.deletedUserReviewId = result[0];
        });
    });

    after(function() {
        const self = this;

        return self.knex('reviews').whereIn('id', self.reviewIds.concat([self.deletedUserReviewId]))
            .del().then(function() {
                return self.knex('movies').whereIn('id', self.movieIds).del();
            }).then(function() {
                return self.knex('users').whereIn('id', [self.userId, self.deletedUserId]).del();
            });
    });

    it('should return (200 code) collection of all users` reviews', function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieIds = this.movieIds;
        const reviewIds = this.reviewIds;

        return this.sdk.getUsersReviews(userId, {
            query: {
                _sort: 'id'
            }
        }).then(function(response) {
            expect(response.data.length).to.be.equal(20);

            response.data.forEach(function(review, index) {
                Object.keys(review).should.be.eql(['id', 'stars', 'comment', 'movie_id', 'user_id']);

                expect(review.id).to.equal(reviewIds[index]);
                expect(review.comment).to.equal('comment');
                expect(review.stars).to.equal(10);
                if (review.id < 18) { //2 reviews are saved without movie_id
                    expect(review.movie_id).to.equal(movieIds[index]);
                }
                expect(review.user_id).to.equal(userId);
            });
        });
    });

    it('should return collection of all users` reviews by users username', function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieIds = this.movieIds;
        const reviewIds = this.reviewIds;

        return this.sdk.getUsersReviews('happie', {
            query: {
                _sort: 'id'
            }
        }).then(function(response) {
            expect(response.data.length).to.be.equal(20);

            response.data.forEach(function(review, index) {
                Object.keys(review).should.be.eql(['id', 'stars', 'comment', 'movie_id', 'user_id']);

                expect(review.id).to.equal(reviewIds[index]);
                expect(review.comment).to.equal('comment');
                expect(review.stars).to.equal(10);
                if (review.id < 18) { //2 reviews are saved without movie_id
                    expect(review.movie_id).to.equal(movieIds[index]);
                }
                expect(review.user_id).to.equal(userId);
            });
        });
    });

    it('should return collection of users` reviews which match defined query filter parameters', function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieIds = this.movieIds;
        const reviewIds = this.reviewIds;

        return this.sdk.getUsersReviews(userId, {
            query: {
                _sort: 'id',
                id: reviewIds[2]
            }
        }).then(function(response) {
            expect(response.data.length).to.be.equal(1);

            response.data.forEach(function(review, index) {
                Object.keys(review).should.be.eql(['id', 'stars', 'comment', 'movie_id', 'user_id']);

                expect(review.id).to.equal(reviewIds[2]);
                expect(review.comment).to.equal('comment');
                expect(review.stars).to.equal(10);
                expect(review.movie_id).to.equal(movieIds[2]);
                expect(review.user_id).to.equal(userId);
            });
        });
    });

    it('should embed movie resource in each users review resource', function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieIds = this.movieIds;
        const reviewIds = this.reviewIds;

        return this.sdk.getUsersReviews(userId, {
            query: {
                _embed: 'movie',
                _sort: 'id'
            }
        }).then(function(response) {
            expect(response.status).to.be.equal(200);
            expect(response.data.length).to.be.equal(20);

            response.data.forEach(function(review, index) {
                Object.keys(review).should.be.eql(['id', 'stars', 'comment', 'movie_id', 'user_id', 'movie']);

                expect(review.id).to.equal(reviewIds[index]);
                expect(review.comment).to.equal('comment');
                expect(review.stars).to.equal(10);
                if (review.id < 18) { //2 reviews are saved without movie_id
                    expect(review.movie_id).to.equal(movieIds[index]);
                    expect(review.movie.released_at).to.be.a('string');
                    delete review.movie.released_at;

                    expect(review.movie).to.eql({
                        id: movieIds[index],
                        name: `Title${index+1}`,
                        country_id: 0,
                        rating: 10
                    });
                }
                expect(review.user_id).to.equal(userId);

            });
        });
    });

    it('should embed specific movie resource properties in each users review resource', function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieIds = this.movieIds;
        const reviewIds = this.reviewIds;

        return this.sdk.getUsersReviews(userId, {
            query: {
                _embed: 'movie.name,movie.rating',
                _sort: 'id'
            }
        }).then(function(response) {
            expect(response.status).to.be.equal(200);
            expect(response.data.length).to.be.equal(20);

            response.data.forEach(function(review, index) {
                Object.keys(review).should.be.eql(['id', 'stars', 'comment', 'movie_id', 'user_id', 'movie']);

                expect(review.id).to.equal(reviewIds[index]);
                expect(review.comment).to.equal('comment');
                expect(review.stars).to.equal(10);
                if (review.id < 18) { //2 reviews are saved without movie_id
                    expect(review.movie_id).to.equal(movieIds[index]);
                    expect(review.movie).to.eql({
                        name: `Title${index+1}`,
                        rating: 10
                    });
                }
                expect(review.user_id).to.equal(userId);

            });
        });
    });

    describe('_filter', function() {
        it('should return multiple review records based on provided query filter {id: {in: [<id1>,<id2>]}}', function() {
            const expect = this.expect;
            const userId = this.userId;
            const reviewIds = this.reviewIds;

            return this.sdk.getUsersReviews(userId, {query: {
                _filter: {id: {in:[reviewIds[0], reviewIds[1]]}}
            }}).then(function(response) {
                expect(response.data.length).to.be.equal(2);
                expect(response.data[0].id).to.be.equal(reviewIds[0]);
                expect(response.data[1].id).to.be.equal(reviewIds[1]);
                expect(response.headers).to.have.property('link');
            });
        });

        it('should allow to _filter by associated resource of type one to one (1x1)', function() {
            const expect = this.expect;
            const userId = this.userId;

            return this.sdk.getUsersReviews(userId, {query: {
                _filter: {'movie.name': {like: 'Title1%'}},
                _embed: 'movie.name,movie.id'
            }}).then(function(response) {
                expect(response.data.length).to.be.equal(10);
            });
        });

        it('should allow to _filter for reviews which do NOT have any associated movies (association 1x1) - database setup should contain such cases just to test the functionality', function() {
            const expect = this.expect;
            const userId = this.userId;

            return this.sdk.getUsersReviews(userId, {query: {
                _filter: {'movie.id': {eq: null}}
            }}).then(function(response) {
                expect(response.data.length).to.be.equal(2);
            });
        });

        it('should return 400 json response with validation error when filter is applied to a column which is not part of response data', function() {
            const expect = this.expect;
            const userId = this.userId;

            return this.sdk.getUsersReviews(userId, {query: {
                _filter: {invalidcolumn: {eq: 'val'}}
            }}).should.be.rejected.then(function(response) {
                expect(response.code).to.be.equal(400);
                expect(response.apiCode).to.be.equal('validationFailure');
                expect(response.message).to.match(/._filter unsupported property invalidcolumn/);
            });
        });
    });

    it('should return empty collection when quering soft deleted resource', function() {
        const expect = this.expect;
        const userId = this.deletedUserId;

        return this.sdk.getUsersReviews(userId).then(function(response) {
            expect(response.data.length).to.be.equal(0);
        });
    });

    it('should return 400 response when requested property to eager load doesnt exist or is private/internal only', function() {
        const expect = this.expect;

        return this.sdk.getUsersReviews(this.userId, {
            query: {_embed: 'user.password'}
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            response.message.should.match(/Can not embed user.password. Invalid _embed resource./);
        });
    });

    it('should return 400 validation error response when _embed parameter is invalid', function() {
        const expect = this.expect;

        return this.sdk.getUsersReviews(this.userId, {
            query: {_embed: '$$&@!($)'}
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
        });
    });
});

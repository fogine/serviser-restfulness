describe('GET /api/v1.0/users/:column/movies', function() {
    before(function() {
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

            return self.knex('countries').insert({
                name: 'United States',
                code_2: 'US'
            }).returning('id');
        }).then(function(result) {
            self.countryId = result[0];

            const movieRows = [];
            for (let i = 0, len = 20; i < len; i++) {
                movieRows.push({
                    name: `Title${i+1}`,
                    description: `description${i+1}`,
                    released_at: '2018-01-10',
                    country_id: self.countryId,
                    rating: 10
                });
            }

            return self.knex.batchInsert('movies', movieRows, 20).returning('id');
        }).then(function(ids) {
            self.movieIds = self.utils.expandResourceIds(ids, 20);

            const reviewsRows = [];
            for (let i = 0, len = 20; i < len; i++) {
                reviewsRows.push({
                    movie_id: self.movieIds[i],
                    user_id: self.userId,
                    stars: i
                });
            }

            return self.knex.batchInsert('reviews', reviewsRows, 20).returning('id');
        }).then(function(ids) {
            self.reviewIds = self.utils.expandResourceIds(ids, 20);

            const moviesUsersRows = [];
            for (let i = 0, len = 20; i < len; i++) {
                moviesUsersRows.push({
                    movie_id: self.movieIds[i],
                    user_id: self.userId
                });
            }

            return self.knex.batchInsert('movies_users', moviesUsersRows, 20).returning('id');
        }).then(function(ids) {
            self.moviesUsersIds = self.utils.expandResourceIds(ids, 20);

            return self.knex('users').insert({
                username: 'happie22',
                password: 'secret2',
                subscribed: false,
                email: 'email222@email.com',
                created_at: self.knex.raw('now()'),
                updated_at: self.knex.raw('now()'),
                deleted_at: self.knex.raw('now()')
            }).returning('id');
        }).then(function(result) {
            self.deletedUserId = result[0];

            return self.knex('movies_users').insert({
                movie_id: self.movieIds[0],
                user_id: self.deletedUserId
            }).returning('id');
        }).then(function(result) {
            self.moviesUsersId = result[0];
        });
    });

    after(function() {
        const self = this;
        let ids = [
            this.moviesUsersIds.concat([this.moviesUsersId]),
            this.reviewIds,
            [this.userId, this.deletedUserId],
            this.movieIds,
            this.countryId
        ];

        return this.Promise.each(['movies_users', 'reviews', 'users', 'movies', 'countries'], function(table, index) {
            const delQuery = self.knex(table);
            if (ids[index] instanceof Array) {
                delQuery.whereIn('id', ids[index]);
            } else {
                delQuery.where({id: ids[index]});
            }

            return delQuery.del();
        });
    });

    it('should return (200 code) collection of all users` movies', function() {
        const expect = this.expect;
        const userId = this.userId;
        const countryId = this.countryId;
        const movieIds = this.movieIds;

        return this.sdk.getUsersMovies(userId, {
            query: {
                _sort: 'id'
            }
        }).then(function(response) {
            expect(response.data.length).to.be.equal(20);

            response.data.forEach(function(movie, index) {
                Object.keys(movie).should.be.eql(['id', 'name', 'released_at', 'country_id', 'rating']);

                expect(movie.id).to.equal(movieIds[index]);
                expect(movie.name).to.equal(`Title${index+1}`);
                expect(movie.rating).to.equal(10);
                expect(movie.country_id).to.be.equal(countryId);
                expect(movie.released_at).to.be.a('string');
            });
        });
    });

    it('should fetch collection of all users` movies via users username', function() {
        const expect = this.expect;
        const userId = this.userId;
        const countryId = this.countryId;
        const movieIds = this.movieIds;

        return this.sdk.getUsersMovies('happie', {
            query: {
                _sort: 'id'
            }
        }).then(function(response) {
            expect(response.data.length).to.be.equal(20);

            response.data.forEach(function(movie, index) {
                Object.keys(movie).should.be.eql(['id', 'name', 'released_at', 'country_id', 'rating']);

                expect(movie.id).to.equal(movieIds[index]);
                expect(movie.name).to.equal(`Title${index+1}`);
                expect(movie.rating).to.equal(10);
                expect(movie.country_id).to.be.equal(countryId);
                expect(movie.released_at).to.be.a('string');
            });
        });
    });

    it('should return collection of users` movies which match defined query filter parameters', function() {
        const expect = this.expect;
        const userId = this.userId;
        const countryId = this.countryId;
        const movieIds = this.movieIds;

        return this.sdk.getUsersMovies(userId, {
            query: {
                _sort: 'id',
                name: 'Title20'
            }
        }).then(function(response) {
            expect(response.data.length).to.be.equal(1);
            const movie = response.data[0];

            Object.keys(movie).should.be.eql(['id', 'name', 'released_at', 'country_id', 'rating']);

            expect(movie.id).to.equal(movieIds[movieIds.length-1]);
            expect(movie.name).to.equal(`Title${movieIds.length}`);
            expect(movie.rating).to.equal(10);
            expect(movie.country_id).to.be.equal(countryId);
            expect(movie.released_at).to.be.a('string');
        });
    });

    it('should return collection of users` movies which match defined name query filter parameter', function() {
        const expect = this.expect;
        const userId = this.userId;
        const countryId = this.countryId;
        const movieIds = this.movieIds;

        return this.sdk.getUsersMovies(userId, {
            query: {
                _sort: 'id',
                name: 'Title1'
            }
        }).then(function(response) {
            expect(response.data.length).to.be.equal(11);
        });
    });

    describe('_filter', function() {

        it('should allow to _filter by associated resource of type one to many (1xM)', function() {
            const expect = this.expect;
            const userId = this.userId;

            return this.sdk.getUsersMovies(userId, {query: {
                _filter: {'review.stars': {gte: 10}}
            }}).then(function(response) {
                expect(response.data.length).to.be.equal(10);
            });
        });

        it('should return multiple movie records based on provided query filter {id: {in: [<id1>,<id2>]}}', function() {
            const expect = this.expect;
            const userId = this.userId;
            const movieIds = this.movieIds;

            return this.sdk.getUsersMovies(userId, {
                query: {
                    _filter: {id: {in:[movieIds[0], movieIds[1]]}}
                }
            }).then(function(response) {
                expect(response.data.length).to.be.equal(2);
                expect(response.data[0].id).to.be.equal(movieIds[0]);
                expect(response.data[1].id).to.be.equal(movieIds[1]);
                expect(response.headers).to.have.property('link');
            });
        });

        it('should return 400 json response with validation error when filter is applied to a column which is not part of response data', function() {
            const expect = this.expect;
            const userId = this.userId;

            return this.sdk.getUsersMovies(userId, {
                query: {
                    _filter: {description: {like: 'description'}}
                }
            }).should.be.rejected.then(function(response) {
                expect(response.code).to.be.equal(400);
                expect(response.apiCode).to.be.equal('validationFailure');
                expect(response.message).to.match(/._filter unsupported property description/);
            });
        });
    });

    it('should embed country resource in each users movie resource', function() {
        const expect = this.expect;
        const userId = this.userId;
        const countryId = this.countryId;
        const movieIds = this.movieIds;

        return this.sdk.getUsersMovies(userId, {
            query: {
                _embed: 'country',
                _sort: 'id'
            }
        }).then(function(response) {
            expect(response.status).to.be.equal(200);
            expect(response.data.length).to.be.equal(20);

            response.data.forEach(function(movie, index) {
                Object.keys(movie).should.be.eql(['id', 'name', 'released_at', 'country_id', 'rating', 'country']);

                expect(movie.id).to.equal(movieIds[index]);
                expect(movie.name).to.equal(`Title${index+1}`);
                expect(movie.rating).to.equal(10);
                expect(movie.country_id).to.be.equal(countryId);
                expect(movie.released_at).to.be.a('string');
                expect(movie.country).to.be.eql({
                    id: countryId,
                    name: 'United States',
                    code_2: 'US'
                });
            });
        });
    });

    it('should embed specific country resource properties in the response collection', function() {
        const expect = this.expect;
        const userId = this.userId;
        const countryId = this.countryId;
        const movieIds = this.movieIds;

        return this.sdk.getUsersMovies(userId, {
            query: {
                _embed: 'country.code_2',
                _sort: 'id'
            }
        }).then(function(response) {
            expect(response.status).to.be.equal(200);
            expect(response.data.length).to.be.equal(20);

            response.data.forEach(function(movie, index) {
                Object.keys(movie).should.be.eql(['id', 'name', 'released_at', 'country_id', 'rating', 'country']);

                expect(movie.id).to.equal(movieIds[index]);
                expect(movie.name).to.equal(`Title${index+1}`);
                expect(movie.rating).to.equal(10);
                expect(movie.country_id).to.be.equal(countryId);
                expect(movie.released_at).to.be.a('string');
                expect(movie.country).to.be.eql({
                    code_2: 'US'
                });
            });
        });
    });

    it('should return empty collection when requesting movies of soft deleted user resource', function() {
        const expect = this.expect;
        const userId = this.deletedUserId;

        return this.sdk.getUsersMovies(userId).then(function(response) {
            expect(response.data.length).to.be.equal(0);
        });
    });

    it('should return 400 response when requested property to eager load doesnt exist or is private/internal only', function() {
        const expect = this.expect;

        return this.sdk.getUsersMovies(this.userId, {
            query: {_embed: 'country.code2'}
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            response.message.should.match(/Can not embed country.code2. Invalid _embed resource./);
        });
    });

    it('should return 400 validation error response when _embed parameter is invalid', function() {
        const expect = this.expect;

        return this.sdk.getUsersMovies(this.userId, {
            query: {_embed: '$$&@!($)'}
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
        });
    });
});

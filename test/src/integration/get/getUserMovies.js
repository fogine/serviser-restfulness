describe('GET /api/v1.0/users/:column/movies', function() {
    before(function() {

        return this.knex('users').insert({
            username: 'happie',
            password: 'secret',
            subscribed: false,
            email: 'email@email.com'
        }).returning('id').bind(this).then(function(result) {
            this.userId = result[0];

            return this.knex('countries').insert({
                name: 'United States',
                code_2: 'US'
            }).returning('id');
        }).bind(this).then(function(result) {
            this.countryId = result[0];

            const movieRows = [];
            for (let i = 0, len = 20; i < len; i++) {
                movieRows.push({
                    name: `Title${i+1}`,
                    description: `description${i+1}`,
                    released_at: '2018-01-10',
                    country_id: this.countryId,
                    rating: 10
                });
            }

            return this.knex.batchInsert('movies', movieRows, 20).returning('id');
        }).bind(this).then(function(ids) {
            this.movieIds = this.utils.expandResourceIds(ids, 20);

            const moviesUsersRows = [];
            for (let i = 0, len = 20; i < len; i++) {
                moviesUsersRows.push({
                    movie_id: this.movieIds[i],
                    user_id: this.userId
                });
            }

            return this.knex.batchInsert('movies_users', moviesUsersRows, 20).returning('id');
        }).bind(this).then(function(ids) {
            this.moviesUsersIds = this.utils.expandResourceIds(ids, 20);
        });
    });

    after(function() {
        const self = this;
        let ids = [this.moviesUsersIds, this.userId, this.movieIds, this.countryId];

        return this.Promise.each(['movies_users', 'users', 'movies', 'countries'], function(table, index) {
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
        }).should.be.fulfilled.then(function(response) {
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
                name: 'Title1'
            }
        }).should.be.fulfilled.then(function(response) {
            expect(response.data.length).to.be.equal(1);

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
        }).should.be.fulfilled.then(function(response) {
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
        }).should.be.fulfilled.then(function(response) {
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

    it('should return 400 response when requested property to eager load doesnt exist or is private/internal only', function() {
        const expect = this.expect;

        return this.sdk.getUsersMovies(this.userId, {
            query: {_embed: 'country.code2'}
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            response.message.should.match(/Invalid _embed parameter resource path/);
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

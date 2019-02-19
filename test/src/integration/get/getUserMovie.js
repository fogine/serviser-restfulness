
describe('GET /api/v1.0/users/:user_id/movies/:movie_id', function() {
    before(function() {
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

            return this.knex('movies_users').insert({
                movie_id: this.movieId,
                user_id: this.userId
            }).returning('id');
        }).then(function(result) {
            this.movieUserId = result[0];
            return this.knex('movies').insert({
                name: 'name2',
                description: 'description2',
                released_at: '2019-01-01',
                rating: 1
            }).returning('id');
        }).then(function(result) {
            this.movieId2 = result[0];

            return this.knex('users').insert({
                username: 'happie2',
                password: 'secret2',
                subscribed: false,
                email: 'email2@email.com',
                created_at: this.knex.raw('now()'),
                updated_at: this.knex.raw('now()'),
                deleted_at: this.knex.raw('now()')
            }).returning('id');
        }).then(function(result) {
            this.deletedUserId = result[0];

            return this.knex('movies_users').insert({
                movie_id: this.movieId2,
                user_id: this.deletedUserId
            }).returning('id');
        }).then(function(result) {
            this.movieUserId2 = result[0];
        });
    });

    after(function() {
        return this.knex('movies_users').whereIn('id', [this.movieUserId, this.movieUserId2])
            .del().bind(this).then(function() {
                return this.knex('movies').whereIn('id', [this.movieId, this.movieId2]).del();
            }).then(function() {
                return this.knex('users').whereIn('id', [this.userId, this.deletedUserId]).del();
            }).then(function() {
                return this.knex('countries').where({id: this.countryId}).del();
            });
    });

    it('should return 200 json response with user details', function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieId = this.movieId;

        return this.sdk.getUsersMovie(userId, movieId).then(function(response) {
            Object.keys(response.data).should.be.eql(['id','name', 'released_at', 'country_id', 'rating']);

            expect(response.data.id).to.equal(movieId);
            expect(response.data.name).to.equal('name');
            expect(response.data.released_at).to.be.a('string');
            expect(response.data.rating).to.be.equal(10);
        });
    });

    it(`should fetch movie details via user's username and movie's name`, function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieId = this.movieId;

        return this.sdk.getUsersMovie('happie', 'name').then(function(response) {
            Object.keys(response.data).should.be.eql(['id','name', 'released_at', 'country_id', 'rating']);

            expect(response.data.id).to.equal(movieId);
            expect(response.data.name).to.equal('name');
            expect(response.data.released_at).to.be.a('string');
            expect(response.data.rating).to.be.equal(10);
        });
    });

    it('should embed country resource in the movie response', function() {
        const expect = this.expect;
        const userId = this.userId;
        const movieId = this.movieId;
        const countryId = this.countryId;

        return this.sdk.getUsersMovie(userId, movieId, {
            query: {_embed: 'country'}
        }).then(function(response) {
            Object.keys(response.data).should.be.eql(['id','name', 'released_at', 'country_id', 'rating', 'country']);

            expect(response.data.id).to.equal(movieId);
            expect(response.data.name).to.equal('name');
            expect(response.data.released_at).to.be.a('string');
            expect(response.data.rating).to.be.equal(10);
            expect(response.data.country).to.be.eql({
                id: countryId,
                name: 'United States',
                code_2: 'US'
            });
        });
    });

    it('should return 400 json response with movie.notFound api code when association does NOT exist', function() {
        const expect = this.expect;

        return this.sdk.getUsersMovie(this.userId, this.movieId2).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('movie.notFound');
            expect(response.message).to.be.equal('movie not found');
        });
    });

    it('should return 400 json response with movie.notFound api code when user association is soft deleted', function() {
        const expect = this.expect;

        return this.sdk.getUsersMovie(this.deletedUserId, this.movieId2).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('movie.notFound');
            expect(response.message).to.be.equal('movie not found');
        });
    });
});


describe('POST /api/v1.0/users/:column/movies', function() {
    before(function() {
        const self = this;

        return this.knex('users').insert({
            username: 'happiemovies',
            password: 'pwd',
            subscribed: false,
            email: 'email@email.com',
            created_at: self.knex.raw('now()'),
            updated_at: self.knex.raw('now()')
        }).returning('id').then(function(result) {
            self.userId = result[0];

            return self.knex('countries').insert({
                name: 'United Kingdom',
                code_2: 'UK'
            }).returning('id');
        }).then(function(result) {
            self.countryId = result[0];
        });
    });

    after(function() {
        const self = this;
        return this.knex('movies_users').del().then(function() {
            return self.knex('users').del();
        }).then(function() {
            return self.knex('movies').del();
        }).then(function() {
            return self.knex('countries').del();
        });
    });

    it('should create a new movie, associate it with the user and return correct Location header', function() {
        const self = this;
        let movieId;
        let locationURI;

        return self.sdk.postUsersMovies(self.userId, {data: {
            name: 'movie',
            description: 'movie-description',
            released_at: '2018-01-01',
            country_id: self.countryId
        }}).then(function(response) {
            locationURI = response.headers.location;
            return self.Promise.delay(300);
        }).then(function() {
            return self.knex('movies').where('name', 'movie').first();
        }).then(function(movie) {
            movieId = movie.id;

            self.expect(locationURI)
                .to.be.equal(`http://127.0.0.1:${self.port}/api/v1.0/users/${self.userId}/movies/${movieId}`);

            movie.should.have.property('released_at').that.is.a.dateString();
            delete movie.released_at;

            movie.should.be.eql({
                id: movie.id,
                name: 'movie',
                country_id: self.countryId,
                rating: null,
                description: 'movie-description',
            });

            return self.knex('movies_users').where('movie_id', movie.id).first();
        }).then(function(movieUser) {

            movieUser.should.be.eql({
                id: movieUser.id,
                movie_id: movieId,
                user_id: self.userId
            });

            return self.sdk.$request({
                method: 'get',
                url: locationURI
            });
        }).then(function(response) {
            Object.keys(response.data).should.be.eql(['id', 'name', 'released_at', 'country_id', 'rating']);
            self.expect(response.data.id).to.equal(movieId);
        });
    });

    it('should create a new movie, associate it with the user via username and return correct Location header', function() {
        const self = this;
        let movieId;
        let locationURI;

        return self.sdk.postUsersMovies('happiemovies', {data: {
            name: 'movie2',
            description: 'movie-description2',
            released_at: '2018-01-02',
            country_id: self.countryId
        }}).then(function(response) {
            locationURI = response.headers.location;
            return self.Promise.delay(300);
        }).then(function() {
            return self.knex('movies').where('name', 'movie2').first();
        }).then(function(movie) {
            movieId = movie.id;

            self.expect(locationURI)
                .to.be.equal(`http://127.0.0.1:${self.port}/api/v1.0/users/${self.userId}/movies/${movieId}`);

            movie.should.have.property('released_at').that.is.a.dateString();
            delete movie.released_at;

            movie.should.be.eql({
                id: movie.id,
                name: 'movie2',
                country_id: self.countryId,
                rating: null,
                description: 'movie-description2',
            });

            return self.knex('movies_users').where('movie_id', movie.id).first();
        }).then(function(movieUser) {

            movieUser.should.be.eql({
                id: movieUser.id,
                movie_id: movieId,
                user_id: self.userId
            });

            return self.sdk.$request({
                method: 'get',
                url: locationURI
            });
        }).then(function(response) {
            Object.keys(response.data).should.be.eql(['id', 'name', 'released_at', 'country_id', 'rating']);
            self.expect(response.data.id).to.equal(movieId);
        });
    });

    it('should fail with 400 validationFailure error when country_id validation fails', function() {
        const expect = this.expect;

        return this.sdk.postUsersMovies(this.userId, {data: {
            name: 'movie',
            description: 'movie-description',
            released_at: '2018-01-01',
            country_id: -1
        }}).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.match(/\.country_id/);
        });
    });
});

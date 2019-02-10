
describe('POST /api/v1.0/users/:column/movies', function() {
    before(function() {
        return this.knex('users').insert({
            username: 'happiemovies',
            password: 'pwd',
            subscribed: false,
            email: 'email@email.com'
        }).returning('id').bind(this).then(function(result) {
            this.userId = result[0];

            return this.knex('countries').insert({
                name: 'United Kingdom',
                code_2: 'UK'
            }).returning('id');
        }).then(function(result) {
            this.countryId = result[0];
        });
    });

    after(function() {
        return this.knex('movies_users').del().bind(this).then(function() {
            return this.knex('users').del();
        }).then(function() {
            return this.knex('movies').del();
        }).then(function() {
            return this.knex('countries').del();
        });
    });

    //TODO should work when be-service route.gerUrl bug is fixed
    it.skip('should create a new movie, associate it with the user and return correct Location header', function() {
        const self = this;
        let movieId;
        let locationURI;

        return this.Promise.delay(400).then(function() {
            return self.sdk.postUsersMovies(self.userId, {data: {
                name: 'movie',
                description: 'movie-description',
                released_at: '2018-01-01',
                country_id: self.countryId
            }});
        }).then(function(response) {

            locationURI = response.headers.location;

            response.headers.should.have.property('location')
                .that.is.equal(`http://127.0.0.1:${self.port}/api/v1.0/users/${self.userId}/movies/${movieId}`);

            return self.knex('movies').where('name', 'movie').first();
        }).then(function(movie) {
            movieId = movie.id;

            movie.should.be.eql({
                id: movie.id,
                name: 'movie',
                country_id: self.countryId,
                released_at: '2018-01-01',
                description: 'movie-description',
            });

            return self.knex('movies_users').where('movie_id', movie.id).first();
        }).then(function(movieUser) {

            movie.should.be.eql({
                id: movieUser.id,
                movie_id: movieId,
                user_id: self.userId
            });

            return self.sdk.$request({
                method: 'get',
                url: locationURI
            });
        }).then(function(response) {
            Object.keys(response.data).should.be.eql(['id', 'name', 'country_id','released_at', 'rating']);
            self.expect(response.data.id).to.equal(movieId);
        });
    });

    //TODO should work when be-service route.gerUrl bug is fixed
    it.skip('should create a new movie, associate it with the user via username and return correct Location header', function() {
        const self = this;
        let movieId;
        let locationURI;

        return this.Promise.delay(400).then(function() {
            return self.sdk.postUsersMovies('happiemovies', {data: {
                name: 'movie2',
                description: 'movie-description2',
                released_at: '2018-01-02',
                country_id: self.countryId
            }});
        }).then(function(response) {

            locationURI = response.headers.location;

            response.headers.should.have.property('location')
                .that.is.equal(`http://127.0.0.1:${self.port}/api/v1.0/users/${self.userId}/movies/${movieId}`);

            return self.knex('movies').where('name', 'movie2').first();
        }).then(function(movie) {
            movieId = movie.id;

            movie.should.be.eql({
                id: movie.id,
                name: 'movie',
                country_id: self.countryId,
                released_at: '2018-01-01',
                description: 'movie-description',
            });

            return self.knex('movies_users').where('movie_id', movie.id).first();
        }).then(function(movieUser) {

            movie.should.be.eql({
                id: movieUser.id,
                movie_id: movieId,
                user_id: self.userId
            });

            return self.sdk.$request({
                method: 'get',
                url: locationURI
            });
        }).then(function(response) {
            Object.keys(response.data).should.be.eql(['id', 'name', 'country_id','released_at', 'rating']);
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

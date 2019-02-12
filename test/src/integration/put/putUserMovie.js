
describe('PUT /api/v1.0/users/:id/movies/:id', function() {
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

            return this.knex('movies').insert({
                name: 'name2',
                description: 'description2',
                released_at: '2019-01-01',
                rating: 1
            }).returning('id');
        }).then(function(result) {
            this.movieId2 = result[0];
        });
    });

    after(function() {
        return this.knex('movies_users').del().bind(this).then(function() {
            return this.knex('movies').whereIn('id', [this.movieId, this.movieId2]).del();
        }).then(function() {
            return this.knex('users').where({id: this.userId}).del();
        });
    });

    it('should associate user resource with movie resource and return correct Location header with 201 status code', function() {
        const self = this;
        let locationURI;

        return self.sdk.putUsersMovie(self.userId, self.movieId).then(function(response) {
            self.expect(response.status).to.be.equal(201);
            locationURI = response.headers.location;
            return self.Promise.delay(300);
        }).then(function() {
            return self.knex('movies_users')
                .where('user_id', self.userId)
                .where('movie_id', self.movieId)
                .first();
        }).then(function(movieUser) {

            self.expect(locationURI)
                .to.be.equal(`http://127.0.0.1:${self.port}/api/v1.0/users/${self.userId}/movies/${self.movieId}`);

            movieUser.should.be.eql({
                id: movieUser.id,
                user_id: self.userId,
                movie_id: self.movieId
            });

            return self.sdk.$request({
                method: 'get',
                url: locationURI
            });
        }).then(function(response) {
            Object.keys(response.data).should.be.eql(['id', 'name', 'released_at', 'country_id', 'rating']);
            self.expect(response.data.id).to.equal(self.movieId);
        });
    });
});

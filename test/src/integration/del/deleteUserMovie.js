
describe('DELETE /api/v1.0/users/:column/movies/:column', function() {
    beforeEach(function() {
        return this.knex('countries').insert({
            name: 'United States',
            code_2: 'US',
        }).returning('id').bind(this).then(function(result) {
            this.countryId = result[0];

            return this.knex('users').insert({
                username: 'happie',
                password: 'secret',
                subscribed: false,
                email: 'email@email.com'
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

            return this.knex('movies').insert({
                name: 'name2',
                description: 'description2',
                released_at: '2019-01-01',
                rating: 1
            }).returning('id');
        }).then(function(result) {
            this.movieId2 = result[0];

            return this.knex('movies_users').insert({
                movie_id: this.movieId,
                user_id: this.userId
            }).returning('id');
        }).then(function(result) {
            this.movieUserId = result[0];

            return this.knex('movies_users').insert({
                movie_id: this.movieId2,
                user_id: this.userId
            }).returning('id');
        }).then(function(result) {
            this.movieUserId2 = result[0];
        });
    });

    afterEach(function() {
        return this.knex('movies_users').whereIn('id', [this.movieUserId, this.movieUserId2]).del()
            .del().bind(this).then(function() {
                return this.knex('movies').whereIn('id', [this.movieId, this.movieId2]).del();
            }).then(function() {
                return this.knex('users').where({id: this.userId}).del();
            }).then(function() {
                return this.knex('countries').where({id: this.countryId}).del();
            });
    });

    it('should deassociate movie resource from user resource by movie id and user id and return 204', function() {
        const self = this;

        return this.sdk.deleteUsersMovie(self.userId, self.movieId).then(function(response) {
            self.expect(response.status).to.be.equal(204);

            return self.knex('users').where('id', self.userId).first().should.eventually.be.a('object');
        }).then(function(user) {
            return self.knex('movies').where('id', self.movieId).first().should.eventually.be.a('object');
        }).then(function() {
            return self.knex('movies_users').where('id', self.movieUserId).first().should.eventually.be.equal(undefined);
        });
    });

    it('should deassociate movie resource from user resource by movie name and user username and return 204', function() {
        const self = this;

        return this.sdk.deleteUsersMovie('happie', 'name').then(function(response) {
            self.expect(response.status).to.be.equal(204);

            return self.knex('users').where('id', self.userId).first().should.eventually.be.a('object');
        }).then(function(user) {
            return self.knex('movies').where('id', self.movieId).first().should.eventually.be.a('object');
        }).then(function() {
            return self.knex('movies_users').where('id', self.movieUserId).first().should.eventually.be.equal(undefined);
        });
    });

    it('should deassociate movie resource from user resource by movie id and user username and return 204', function() {
        const self = this;

        return this.sdk.deleteUsersMovie('happie', self.movieId).then(function(response) {
            self.expect(response.status).to.be.equal(204);

            return self.knex('users').where('id', self.userId).first().should.eventually.be.a('object');
        }).then(function(user) {
            return self.knex('movies').where('id', self.movieId).first().should.eventually.be.a('object');
        }).then(function() {
            return self.knex('movies_users').where('id', self.movieUserId).first().should.eventually.be.equal(undefined);
        });
    });

    it('should return 410 status code when there was no resource to delete', function() {
        const self = this;
        const expect = this.expect;

        return this.knex('movies_users').del().then(function() {
            return self.sdk.deleteUsersMovie(self.userId, self.movieId);
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(410);
            expect(response.message).to.be.equal('Gone');
        });
    });

    it('should return 400 json response with validation error when username path parameter is invalid', function() {
        const expect = this.expect;

        return this.sdk.deleteUsersMovie('$!$@$!@', this.movieId).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('validationFailure');
            expect(response.message).to.be.equal('.username should match pattern "^[a-z0-9-_]+$"');
        });
    });
});

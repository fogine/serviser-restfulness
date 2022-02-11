
describe('GET /api/v1.0/movies', function() {
    before(function() {
        const rows = [];

        for (let i = 0, len = 20; i < len; i++) {
            rows.push({
                name: `name${i+1}`,
                description: `desc${i+1}`,
                country_id: null,
                rating: 5,
                released_at: this.knex.raw('now()')
            });
        }

        const self = this;
        return this.knex.batchInsert('movies', rows, 20)
            .returning('id')
            .then(function(ids) {
                self.movieIds = self.utils.expandResourceIds(ids, 20);

                const userRows = [];
                for (let i = 0, len = 20; i < len; i++) {
                    userRows.push({
                        username: `happie${i}`,
                        password: 'secret',
                        subscribed: false,
                        email: `email${i}@email.com`,
                        created_at: self.knex.raw('now()'),
                        updated_at: self.knex.raw('now()')
                    });
                }

                return self.knex.batchInsert('users', userRows, 20).returning('id');
            }).then(function(ids) {
                self.userIds = self.utils.expandResourceIds(ids, 20);

                const moviesUsersRows = [];
                for (let i = 0, len = 20; i < len; i++) {
                    moviesUsersRows.push({
                        movie_id: self.movieIds[i],
                        user_id: self.userIds[i]
                    });
                }

                return self.knex.batchInsert('movies_users', moviesUsersRows, 20).returning('id');
            }).then(function(ids) {
                self.moviesUsersIds = self.utils.expandResourceIds(ids, 20);
            });

    });

    after(async function() {
        await this.knex('movies_users').whereIn('id', this.moviesUsersIds).del();
        await this.knex('movies').whereIn('id', this.movieIds).del();
        await this.knex('users').whereIn('id', this.userIds).del();
    });

    it('should return filtered collection by id column', function() {
        const self = this;
        const expect = this.expect;
        const movieIds = this.movieIds;

        return this.sdk.getMovies({query: {
            id: movieIds[0]
        }}).then(function(response) {
            expect(response.data.length).to.be.equal(1);
            expect(response.headers).to.have.property('link');

            expect(response.data[0].id).to.equal(movieIds[0]);
        });
    });

    it('should NOT accept `name` query filter (parameter should be ignored)', function() {
        const expect = this.expect;

        return this.sdk.getMovies({query: {
            name: 'secret15'
        }}).then(function(response) {
            expect(response.data.length).to.be.equal(20);
        });
    });

    describe('_filter', function() {
        it('should return multiple movie records based on provided query filter {id: {in: [<id1>,<id2>]}}', function() {
            const self = this;
            const expect = this.expect;
            const movieIds = this.movieIds;

            return this.sdk.getMovies({query: {
                _filter: {id: {in:[movieIds[0], movieIds[1]]}}
            }}).then(function(response) {
                expect(response.data.length).to.be.equal(2);
                expect(response.data[0].id).to.be.equal(movieIds[0]);
                expect(response.data[1].id).to.be.equal(movieIds[1]);
                expect(response.headers).to.have.property('link');
            });
        });

        it('should allow to filter by released_at timestamp', function() {
            const self = this;
            const expect = this.expect;
            const movieIds = this.movieIds;

            return this.sdk.getMovies({query: {
                _filter: {released_at: {gt:'2022-02-11'}}
            }}).then(function(response) {
                expect(response.data.length).to.be.equal(20);
            });
        });

        it.only('should allow to _filter by associated resource of type many to many (MxM)', function() {
            const expect = this.expect;

            return this.sdk.getMovies({query: {
                _filter: {'user.username': {in: ['happie10', 'happie11', 'happie12']}}
            }}).then(function(response) {
                expect(response.data.length).to.be.equal(3);
            });
        });

        it('should return 400 json response with validation error when filter is applied to an unallowed country_id column', function() {
            const self = this;
            const expect = this.expect;

            return this.sdk.getMovies({query: {
                _filter: {country_id: {eq: 'secret1'}}
            }}).should.be.rejected.then(function(response) {
                expect(response.code).to.be.equal(400);
                expect(response.apiCode).to.be.equal('validationFailure');
                expect(response.message).to.match(/._filter unsupported property country_id/);
            });
        });

        it('should return 400 json response with validation error when filter is applied to an unallowed name column', function() {
            const self = this;
            const expect = this.expect;

            return this.sdk.getMovies({query: {
                _filter: {name: {like: 'name'}}
            }}).should.be.rejected.then(function(response) {
                expect(response.code).to.be.equal(400);
                expect(response.apiCode).to.be.equal('validationFailure');
                expect(response.message).to.match(/._filter unsupported property name/);
            });
        });
    });
});


describe('GET /api/v1.0/movies/:movie_column/country/:country_column', function() {
    before(function() {
        const self = this;

        return this.knex('countries').insert({
            name: 'United States',
            code_2: 'US',
        }).returning('id').then(function(result) {
            self.countryId = result[0];

            return self.knex('movies').insert({
                name: 'name',
                description: 'description',
                released_at: '2019-01-01',
                country_id: self.countryId,
                rating: 10
            }).returning('id');
        }).then(function(result) {
            self.movieId = result[0];
        }).then(function(result) {
            return self.knex('movies').insert({
                name: 'name2',
                description: 'description2',
                released_at: '2019-01-01',
                rating: 1
            }).returning('id');
        }).then(function(result) {
            self.movieId2 = result[0];
        });
    });

    after(function() {
        const self = this;

        return this.knex('movies').whereIn('id', [this.movieId, this.movieId2])
            .del().then(function() {
                return self.knex('countries').where({id: self.countryId}).del();
            });
    });

    it('should fetch country association by country_id and return 200 response', function() {
        const expect = this.expect;
        const movieId = this.movieId;
        const countryId = this.countryId;

        return this.sdk.getMoviesCountry(movieId, countryId).then(function(response) {
            Object.keys(response.data).should.be.eql(['id', 'name', 'code_2']);

            expect(response.data.id).to.equal(countryId);
            expect(response.data.name).to.equal('United States');
            expect(response.data.code_2).to.be.equal('US');
        });
    });

    it('should fetch country association by code_2 and return 200 response', function() {
        const expect = this.expect;
        const movieId = this.movieId;
        const countryId = this.countryId;

        return this.sdk.getMoviesCountry(movieId, 'US').then(function(response) {
            Object.keys(response.data).should.be.eql(['id', 'name', 'code_2']);

            expect(response.data.id).to.equal(countryId);
            expect(response.data.name).to.equal('United States');
            expect(response.data.code_2).to.be.equal('US');
        });
    });

    it('should fetch country association by movie name and code_2', function() {
        const expect = this.expect;
        const movieId = this.movieId;
        const countryId = this.countryId;

        return this.sdk.getMoviesCountry('name', 'US').then(function(response) {
            Object.keys(response.data).should.be.eql(['id', 'name', 'code_2']);

            expect(response.data.id).to.equal(countryId);
            expect(response.data.name).to.equal('United States');
            expect(response.data.code_2).to.be.equal('US');
        });
    });

    it('should return 400 json response with country.notFound api code when association does NOT exist', function() {
        const expect = this.expect;

        return this.sdk.getMoviesCountry(this.movieId2, this.countryId).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            expect(response.apiCode).to.be.equal('country.notFound');
            expect(response.message).to.be.equal('country not found');
        });
    });
});

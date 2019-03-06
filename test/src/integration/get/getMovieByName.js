
describe('GET /api/v1.0/movies/:column', function() {
    before(function() {
        return this.knex('countries').insert({
            name: 'United States',
            code_2: 'US',
        }).returning('id').bind(this).then(function(result) {
            this.countryId = result[0];

            return this.knex('movies').insert({
                name: 'name',
                description: 'description',
                released_at: '2019-01-01',
                country_id: this.countryId,
                rating: 10
            }).returning('id');
        }).then(function(result) {
            this.movieId = result[0];
        });
    });

    after(function() {
        return this.knex('movies').whereIn('id', [this.movieId]).del().bind(this).then(function() {
            return this.knex('countries').where({id: this.countryId}).del();
        });
    });

    it('should fetch movie with embedded country resource', function() {
        const expect = this.expect;
        const movieId = this.movieId;
        const countryId = this.countryId;

        return this.sdk.getMovie(movieId, {
            query: {_embed: 'country'}
        }).then(function(response) {
            Object.keys(response.data).should.be.eql(['id', 'name', 'country']);

            expect(response.data.id).to.equal(movieId);
            expect(response.data.country).to.eql({
                name: 'United States'
            });
        });
    });

    it('should return 400 response when requested property to eager load is not part of route response schema', function() {
        const expect = this.expect;

        return this.sdk.getMovie(this.movieId, {
            query: {_embed: 'country.id'}
        }).should.be.rejected.then(function(response) {
            expect(response.code).to.be.equal(400);
            response.message.should.match(/Can not embed country.id. Invalid _embed resource./);
        });
    });
});

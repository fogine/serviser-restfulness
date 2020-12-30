
describe('PUT /api/v1.0/users/:column/review/:column', function() {
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

            return self.knex('movies').insert({
                name: 'name',
                description: 'description',
                released_at: '2019-01-01',
                country_id: self.countryId,
                rating: 10
            }).returning('id');
        }).then(function(result) {
            self.movieId = result[0];

            return self.knex('users').insert({
                username: 'sad',
                password: 'badpwd',
                subscribed: true,
                email: 'email2@email.com',
                created_at: self.knex.raw('now()'),
                updated_at: self.knex.raw('now()')
            }).returning('id');
        }).then(function(result) {
            self.userId2 = result[0];

            return self.knex('reviews').insert({
                stars: 5,
                comment: 'comment',
                movie_id: self.movieId,
                user_id: self.userId
            }).returning('id');
        }).then(function(result) {
            self.reviewId = result[0];
        });
    });

    after(function() {
        const self = this;

        return self.knex('reviews').where('id', self.reviewId).del().then(function() {
            return self.knex('movies').whereIn('id', [self.movieId]).del();
        }).then(function() {
            return self.knex('users').whereIn('id', [self.userId, self.userId2]).del();
        });
    });

    it('should update user review resource and return current state', function() {
        const self = this;
        const knex = this.knex;
        const expect = this.expect;

        return this.sdk.putUsersReview(self.userId, self.reviewId, {data: {
            user_id: self.userId2,
            stars: 10
        }}).then(function(response) {
            assertUpdatedUserEntity(response.data);

            return knex('reviews').select().where('id', self.reviewId).then(function(rows) {
                const review = rows[0];
                assertUpdatedUserEntity(review);
            });

            function assertUpdatedUserEntity(review) {
                self.expect(review).to.have.all.keys(['id', 'stars', 'comment', 'movie_id', 'user_id']);

                review.should.be.eql({
                    id: self.reviewId,
                    stars: 10,
                    comment: 'comment',
                    movie_id: self.movieId,
                    user_id: self.userId2
                });
            }

        });
    });
});

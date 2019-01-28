
describe('GET /api/v1.0/users/:id', function() {
    before(function() {
        return this.knex('users').insert({
            username: 'happie',
            password: 'secret',
            subscribed: false,
            email: 'email@email.com'
        }).returning('id').bind(this).then(function(result) {
            this.userId = result[0];
        });
    });

    after(function() {
        return this.knex('users').where({username: 'happie'}).del();
    });

    it('should return 200 json response with user details', function() {
        //return this.sdk.getUser
    });
});

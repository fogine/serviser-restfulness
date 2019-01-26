const Service = require('bi-service');
const Config  = require('bi-config');
const Knex    = require('bi-service-knex');
const Resource = require('../../lib/resource.js');

module.exports = createService;


/**
 * @param {String} dbProvider
 * @return {Service}
 */
function createService(dbProvider) {
    const config = new Config.Config({
        apps: {
            test: {}
        }
    });

    const service = new Service(config);

    createResources();

    service.resourceManager.register(
        'knex',
        Knex(getDbConnectionOptions(dbProvider))
    );

    const app = service.buildApp('test');

    const users = app.buildRestfulRouter({
        url: '/api/{version}/@users',
        version: 1.0
    });

    const movies = app.buildRestfulRouter({
        url: '/api/{version}/@movies',
        version: 1.0
    });

    users.get('/'); //get users
    users.get('/:{key}'); //get user
    users.get('/@movies/'); //get user movies
    users.get('/@movies/:{key}'); //get user movie
    users.get('/@reviews/'); //get user reviews
    users.get('/@reviews/:{key}'); //get user review

    users.post('/'); //register new user
    users.post('/@reviews'); //create new user review

    users.put('/:{key}'); //update user
    users.put('/@movies/:{key}'); //assign a movie to the user
    users.put('/@reviews/:{key}'); //update user review

    users.del('/@movies/:{key}'); //deassign a movie from the user
    users.del('/@reviews/:{key}'); //delete a user review

    movies.get('/');//get movies
    movies.get('/@reviews');//get movie reviews

    movies.post('/');//create new movie
    movies.put('/:{key}');//update a movie
    movies.del('/:{key}');//delete a movie

    return service;
}


/**
 * @param {String} dbProvider
 * @return {Object}
 */
function getDbConnectionOptions(dbProvider) {
    if (dbProvider === 'pg') {
        return {
            client: 'pg',
            connection: {
                host : process.env.POSTGRES_HOST,
                user : process.env.POSTGRES_USER,
                password : process.env.POSTGRES_PASSWORD,
                database : process.env.POSTGRES_DB
            }
        };
    } else if (dbProvider === 'mysql') {
        return {
            client: 'mysql',
            connection: {
                host : process.env.MYSQL_HOST,
                user : process.env.MYSQL_USER,
                password : process.env.MYSQL_PASSWORD,
                database : process.env.MYSQL_DATABASE
            }
        };
    }
}

/*
 *
 */
function createResources() {
    const user = new self.Resource({
        singular: 'user',
        plural: 'users',
        dynamicDefaults: {
            updated_at: 'datetime'
        },
        properties: {
            username: {type: 'string', minLength: 4, maxLength: 16},
            password: {type: 'string', maxLength: 32},
            subscribed: {type: 'boolean', default: false},
            email: {type: 'string', format: 'email'}
        },
        responseProperties: {
            username: {type: 'string'},
            subscribed: {type: 'boolean'},
            created_at: {type: 'string'},
            updated_at: {type: 'string'}
        }
    });

    const review = new self.Resource({
        singular: 'review',
        plural: 'reviews',
        properties: {
            stars: {type: 'integer'},
            comment: {type: 'string', maxLength: 128},
            movie_id: {type: 'integer'},
            user_id: {type: 'integer'}
        }
    });

    const movie = new self.Resource({
        singular: 'movie',
        plural: 'movies',
        properties: {
            name: {type: 'string'},
            description: {type: 'string', maxLength: 256},
            released_at: {type: 'string', format: 'date'}
        },
        responseProperties: {
            name: {type: 'string'},
            released_at: {type: 'string'},
            rating: {type: 'number'},//cauculated
        }
    });

    user.belongsToMany(movie);
    movie.hasMany(review);
    user.hasMany(review);
    review.belongsTo(user);
    review.belongsTo(movie);
}

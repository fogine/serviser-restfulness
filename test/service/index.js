const Service = require('bi-service');
const Config  = require('bi-config');
const Knex    = require('bi-service-knex');
const Resource = require('../../lib/resource.js');
const pgTypes  = require('pg').types;

// override parsing date column to Date()
pgTypes.setTypeParser(1184, val => val);

module.exports = createService;

/**
 * @param {String} dbProvider
 * @return {Service}
 */
function createService(dbProvider) {
    const config = Config.createMemoryProvider({
        apps: {
            test: {}
        }
    });

    const service = new Service(config);

    createResources();

    //TODO fix bug in bi-service-knex inspectIntegrity method
    //service.resourceManager.register(
        //'knex',
        //Knex(getDbConnectionOptions(dbProvider))
    //);
    service.knex = Knex(getDbConnectionOptions(dbProvider));

    service.on('set-up', createEndpoints);

    return service;
}

/**
 * @private
 * @this {Service}
 */
function createEndpoints() {
    const service = this;
    const app = service.buildApp('test');

    const users = app.buildRestfulRouter({
        url: '/api/{version}/@users',
        version: 1.0
    });

    const movies = app.buildRestfulRouter({
        url: '/api/{version}/@movies',
        version: 1.0
    });

    const reviews = app.buildRestfulRouter({
        url: '/api/{version}/@reviews',
        version: 1.0
    });

    users.get('/'); //get users
    users.get('/:{key}(\\d+)'); //get user
    users.get('/:username', {name: 'userByUsername'}); //get user by username
    users.get('/:{key}/@movies/'); //get user movies
    users.get('/:{key}/@movies/:{key}'); //get user movie
    users.get('/:{key}/@reviews/'); //get user reviews
    users.get('/:{key}/@reviews/:{key}'); //get user review

    users.post('/'); //register new user
    users.post('/:{key}/@reviews'); //create new user review

    users.put('/:{key}'); //update user
    users.put('/:{key}/@movies/:{key}'); //assign a movie to the user
    users.put('/:{key}/@reviews/:{key}'); //update user review

    users.del('/:{key}/@movies/:{key}'); //deassign a movie from the user
    users.del('/:{key}/@reviews/:{key}'); //delete a user review

    movies.get('/');//get movies
    movies.get('/:{key}/@reviews');//get movie reviews

    movies.post('/');//create new movie
    movies.put('/:{key}');//update a movie
    movies.del('/:{key}');//delete a movie

    reviews.get('/:{key}'); //get review
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
                database : process.env.MYSQL_DATABASE,
                dateStrings: true
            }
        };
    }
}

/*
 *
 */
function createResources() {
    const user = new Resource({
        singular: 'user',
        plural: 'users',
        dynamicDefaults: {
            updated_at: 'datetime'
        },
        properties: {
            username: {type: 'string', minLength: 4, maxLength: 16, pattern: '^[a-z-_]+$'},
            password: {type: 'string', maxLength: 32},
            subscribed: {type: 'boolean', default: false},
            email: {type: 'string', format: 'email'}
        },
        responseProperties: {
            id: {type: 'integer', maximum: 10000000},
            username: {type: 'string'},
            subscribed: {type: 'boolean'},
            created_at: {type: 'string'},
            updated_at: {type: 'string'}
        }
    });

    const review = new Resource({
        singular: 'review',
        plural: 'reviews',
        properties: {
            stars: {type: 'integer'},
            comment: {type: 'string', maxLength: 128},
            movie_id: {type: 'integer'},
            user_id: {type: 'integer'}
        },
        responseProperties: {
            id: {type: 'integer'},
            stars: {type: 'integer'},
            comment: {type: 'string'},
            movie_id: {type: 'integer'},
            user_id: {type: 'integer'}
        }
    });

    const movie = new Resource({
        singular: 'movie',
        plural: 'movies',
        properties: {
            name: {type: 'string'},
            description: {type: 'string', maxLength: 256},
            released_at: {type: 'string', format: 'date'}
        },
        responseProperties: {
            id: {type: 'integer'},
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

/*
 * TODO remove this when the bug will be fixed in the upstream bi-service package
 */
Service.ResourceManager.prototype.register = function(key, resource) {

    if (typeof resource.inspectIntegrity !== 'function'
    ) {
        throw new TypeError('The resource must be an object that implements `inspectIntegrity` method');
    }

    this.resources[key] = resource;
    this.tag(key, key, '*');
    return resource;
};

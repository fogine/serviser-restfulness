const Service   = require('serviser');
const Config    = require('serviser-config');
const Knex      = require('serviser-knex');
const pg        = require('pg');
const Resource  = require('../../lib/resource.js');
const KnexError = require('../../lib/error/knexError.js');
const RequestError = Service.error.RequestError;

module.exports = createService;

/**
 * @param {String} dbProvider
 * @param {Integer} port
 * @return {Service}
 */
function createService(dbProvider, port) {
    const config = Config.createMemoryProvider({
        apps: {
            test: {
                listen: port,
                baseUrl: `http://127.0.0.1:${port}`,
                bodyParser: {
                    'application/json': {
                        limit: "2mb",
                        extended: false
                    }
                },
            }
        }
    });

    const service = new Service(config);

    createResources();

    service.resourceManager.register(
        'knex',
        Knex(getDbConnectionOptions(dbProvider))
    );

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

    app.on('unknown-error', function(err, errorHandler) {
        if (err instanceof KnexError) {
            if (err.code === '23505' || err.code === 'ER_DUP_ENTRY') {
                if (err.message.match(/users__username__key/)) {
                    return errorHandler(new RequestError({
                        message: 'username already exists',
                        apiCode: 'uniqueConstraintFailure'
                    }));
                }
            }
        }
        //hand back the error processing to the application
        return errorHandler(err);
    });

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
    users.get('/:username'); //get user by username
    users.get('/:{key}(\\d+)/@movies/'); //get user movies
    users.get('/:username/@movies/'); //get user movies
    users.get('/:{key}(\\d+)/@movies/:{key}(\\d+)'); //get user movie
    users.get('/:username/@movies/:name'); //get user movie
    users.get('/:{key}(\\d+)/@reviews/'); //get user reviews
    users.get('/:username/@reviews/'); //get user reviews
    users.get('/:{key}(\\d+)/@reviews/:{key}'); //get user review
    users.get('/:username/@reviews/:{key}'); //get user review

    users.post('/'); //register new user
    users.post('/:{key}(\\d+)/@reviews'); //create new user review
    users.post('/:username/@reviews'); //create new user review
    users.post('/:{key}(\\d+)/@movies'); //create a new movie and associate it with the user
    users.post('/:username/@movies'); //create a new movie and associate it with the user

    users.put('/:{key}(\\d+)'); //update user
    users.put('/:username'); //update user
    users.put('/:{key}/@movies/:{key}'); //assign a movie to the user
    users.put('/:{key}/@reviews/:{key}'); //update user review

    users.del('/'); //delete users
    users.del('/:{key}(\\d+)'); //delete user
    users.del('/:username'); //delete user
    users.del('/:{key}(\\d+)/@movies/:{key}(\\d+)'); //deassign a movie from the user
    users.del('/:username/@movies/:{key}(\\d+)'); //deassign a movie from the user
    users.del('/:username/@movies/:name'); //deassign a movie from the user
    users.del('/:{key}(\\d+)/@movies'); //deassign all movies from the user
    users.del('/:username/@movies'); //deassign all movies from the user
    users.del('/:{key}(\\d+)/@reviews/:{key}(\\d+)'); //delete a user review
    users.del('/:username/@reviews/:movie_id'); //delete a user review
    users.del('/:{key}(\\d+)/@reviews'); //delete all user reviews
    users.del('/:username/@reviews'); //delete all user reviews

    movies.get('/');//get movies
    movies.get('/:{key}/@reviews');//get movie reviews
    movies.get('/:{key}(\\d+)/@countries/:{key}(\\d+)');//get movie country
    movies.get('/:{key}(\\d+)/@countries/:code_2');//get movie country
    movies.get('/:name/@countries/:code_2');//get movie country
    movies.get('/:{key}').respondsWith({
        type: 'object',
        additionalProperties: false,
        properties: {
            id: {type: 'integer'},
            name: {type: 'string'},
            country: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    name: {type: 'string'}
                }
            }
        }
    });//get movie

    movies.post('/');//create new movie
    movies.put('/:{key}');//update a movie
    movies.del('/:{key}');//delete a movie

    reviews.get('/'); //get reviews
    reviews.get('/:{key}'); //get review
}


/**
 * @param {String} dbProvider
 * @return {Object}
 */
function getDbConnectionOptions(dbProvider) {
    if (dbProvider === 'pg') {
        // override parsing date column to Date() so that it returns strings
        pg.types.setTypeParser(1184, val => val);
        // select count() operations will not return strings
        pg.defaults.parseInt8 = true;

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
                dateStrings: true,
                //converts tinyint(1) to booleans instead of integers
                typeCast: function (field, next) {
                    if (field.type == 'TINY' && field.length == 1) {
                        return (field.string() == '1'); // 1 = true, 0 = false
                    }
                    return next();
                }
            }
        };
    }
}

/*
 *
 */
function createResources() {
    const country = new Resource({
        singular: 'country',
        plural: 'countries',
        properties: {
            name: {type: 'string', maxLength: 16},
            code_2: {type: 'string', minLength: 2, maxLength: 2}
        },
        responseProperties: {
            id: {type: 'integer', minimum: 1},
            name: {$ref: 'country.name'},
            code_2: {$ref: 'country.code_2'}
        }
    });

    const user = new Resource({
        singular: 'user',
        plural: 'users',
        dynamicDefaults: {},
        timestamps: true,
        softDelete: true,
        properties: {
            username: {type: 'string', minLength: 4, maxLength: 16, pattern: '^[a-z0-9-_]+$'},
            password: {type: 'string', maxLength: 32},
            subscribed: {type: 'boolean', default: false},
            email: {type: 'string', format: 'email'}
        },
        responseProperties: {
            id: {type: 'integer', minimum: 1, maximum: 10000000},
            username: {$ref: 'user.username'},
            //needs default to be set because of the delete /users tests
            subscribed: {$ref: 'user.subscribed', default: true},
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
            movie_id: {$ref: 'movie.id'},
            user_id: {$ref: 'user.id'}
        },
        responseProperties: {
            id: {type: 'integer', minimum: 1},
            stars: {$ref: 'review.stars'},
            comment: {$ref: 'review.comment'},
            movie_id: {$ref: 'movie.id'},
            user_id: {$ref: 'user.id'}
        }
    });

    const movie = new Resource({
        singular: 'movie',
        plural: 'movies',
        properties: {
            name: {type: 'string'},
            description: {type: 'string', maxLength: 256},
            released_at: {type: 'string', format: 'date'},
            country_id: {$ref: 'country.id'}
        },
        responseProperties: {
            id: {type: 'integer', minimum: 1},
            name: {$ref: 'movie.name'},
            released_at: {$ref: 'movie.released_at'},
            country_id: {$ref: 'country.id'},
            rating: {type: 'number'},//calculated
        }
    });

    user.belongsToMany(movie);
    movie.hasMany(review);
    movie.belongsTo(country);
    user.hasMany(review);
    review.belongsTo(user);
    review.belongsTo(movie);
}

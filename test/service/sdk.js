'use strict';
//autogenerated

var ServiceSDK = module.require('bi-service-sdk').BIServiceSDK;

module.exports = TestServiceSDK;


/**
 * @constructor
 * @name TestServiceSDK
 */
function TestServiceSDK(options) {
    options = options || {};

    if (!options.baseURL) {
        options.baseURL = "http://127.0.0.1";
    }

    this.version = "v1.0";
    options.baseURL += "/api/v1.0";

    //options object must be ready before we call the parent constructor
    ServiceSDK.call(this, options);
}

TestServiceSDK.prototype = Object.create(ServiceSDK.prototype);
TestServiceSDK.prototype.constructor = TestServiceSDK;

/**
 * @method
 * @name TestServiceSDK#getUsers
 * @operationId getUsers_v1.0
 * @summary 
 *
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.getUsers = function getUsers(options) {


    var opt = {
        url     : "/users",
        method  : "get",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };


    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#postUsers
 * @operationId postUsers_v1.0
 * @summary 
 *
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {integer} [options.params.id]
 * @param {string} [options.params.username]
 * @param {boolean} [options.params.subscribed]
 * @param {string} [options.params.created_at]
 * @param {string} [options.params.updated_at]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.postUsers = function postUsers(options) {


    var opt = {
        url     : "/users",
        method  : "post",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };


    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#getUser
 * @operationId getUser_v1.0
 * @summary 
 *
 * @param {integer} [id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.getUser = function getUser(id, options) {

    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/users/{id}",
        method  : "get",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#getMovie
 * @operationId getMovie_v1.0
 * @summary 
 *
 * @param {integer} [id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.getMovie = function getMovie(id, options) {

    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/movies/{id}",
        method  : "get",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#getReviews
 * @operationId getUsers_v1.0
 * @summary 
 *
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.getReviews = function getReviews(options) {


    var opt = {
        url     : "/reviews",
        method  : "get",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };


    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#getReview
 * @operationId getUser_v1.0
 * @summary 
 *
 * @param {integer} [id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.getReview = function getReview(id, options) {

    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/reviews/{id}",
        method  : "get",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#putUser
 * @operationId putUser_v1.0
 * @summary 
 *
 * @param {integer} [id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.putUser = function putUser(id, options) {

    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/users/{id}",
        method  : "put",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#getUsersMovies
 * @operationId getUsersMovies_v1.0
 * @summary 
 *
 * @param {integer} id - user id
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {Object} options.path.id
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.getUsersMovies = function getUsersMovies(id, options) {

    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/users/{id}/movies",
        method  : "get",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#getUsersMovie
 * @operationId getUsersMovie_v1.0
 * @summary 
 *
 * @param {integer} [user_id]
 * @param {integer} [movie_id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.getUsersMovie = function getUsersMovie(user_id, movie_id, options) {

    if (typeof user_id === 'object' && user_id !== null && typeof options === 'undefined') {
        options = user_id;
        user_id = undefined;
        movie_id = undefined;
    }

    if (typeof movie_id === 'object' && movie_id !== null && typeof options === 'undefined') {
        options = movie_id;
        movie_id = undefined;
    }

    if (typeof user_id === 'undefined') {
        user_id = options && options.path && options.path['user_id'];
    }

    if (typeof movie_id === 'undefined') {
        movie_id = options && options.path && options.path['movie_id'];
    }

    var opt = {
        url     : "/users/{user_id}/movies/{movie_id}",
        method  : "get",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{user_id}/, user_id);
    opt.url = opt.url.replace(/{movie_id}/, movie_id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#putUsersMovie
 * @operationId putUsersMovie_v1.0
 * @summary 
 *
 * @param {integer} [user_id]
 * @param {integer} [movie_id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.putUsersMovie = function putUsersMovie(user_id, movie_id, options) {

    if (typeof user_id === 'object' && user_id !== null && typeof options === 'undefined') {
        options = user_id;
        user_id = undefined;
        movie_id = undefined;
    }

    if (typeof movie_id === 'object' && movie_id !== null && typeof options === 'undefined') {
        options = movie_id;
        movie_id = undefined;
    }

    if (typeof user_id === 'undefined') {
        user_id = options && options.path && options.path['user_id'];
    }

    if (typeof movie_id === 'undefined') {
        movie_id = options && options.path && options.path['movie_id'];
    }
    var opt = {
        url     : "/users/{user_id}/movies/{movie_id}",
        method  : "put",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{user_id}/, user_id);
    opt.url = opt.url.replace(/{movie_id}/, movie_id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#deleteUser
 * @operationId deleteUser_v1.0
 * @summary 
 *
 * @param {integer} [id]
 * @param {Object} options
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.deleteUser = function deleteUser(id, options) {

    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/users/{id}",
        method  : "delete",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#deleteUsers
 * @operationId deleteUsers_v1.0
 * @summary 
 *
 * @param {Object} options
 * @param {Object} options.path
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.deleteUsers = function deleteUsers(options) {

    var opt = {
        url     : "/users",
        method  : "delete",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#deleteUsersMovie
 * @operationId deleteUsersMovie_v1.0
 * @summary
 *
 * @param {integer} [user_id]
 * @param {integer} [movie_id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.user_id]
 * @param {integer} [options.path.movie_id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.deleteUsersMovie = function deleteUsersMovie(user_id, movie_id, options) {

    if (typeof user_id === 'object' && user_id !== null && typeof options === 'undefined') {
        options = user_id;
        user_id = undefined;
        movie_id = undefined;
    }

    if (typeof movie_id === 'object' && movie_id !== null && typeof options === 'undefined') {
        options = movie_id;
        movie_id = undefined;
    }

    if (typeof user_id === 'undefined') {
        user_id = options && options.path && options.path['user_id'];
    }

    if (typeof movie_id === 'undefined') {
        movie_id = options && options.path && options.path['movie_id'];
    }

    var opt = {
        url     : "/users/{user_id}/movies/{movie_id}",
        method  : "delete",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{user_id}/, user_id);
    opt.url = opt.url.replace(/{movie_id}/, movie_id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#deleteUsersMovies
 * @operationId deleteUsersMovie_v1.0
 * @summary
 *
 * @param {integer} [id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.deleteUsersMovies = function deleteUsersMovies(id, options) {

    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/users/{id}/movies",
        method  : "delete",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#getUsersReviews
 * @operationId getUsersReviews_v1.0
 * @summary 
 *
 * @param {Integer} id - user id
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.getUsersReviews = function getUsersReviews(id, options) {

    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/users/{id}/reviews",
        method  : "get",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#postUsersReviews
 * @operationId postUsersReviews_v1.0
 * @summary 
 *
 * @param {Integer} id - user id
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.params]
 * @param {integer} [options.params.id]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.postUsersReviews = function postUsersReviews(id, options) {


    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/users/{id}/reviews",
        method  : "post",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};

/**
 * @method
 * @name TestServiceSDK#postUsersMovies
 * @operationId postUsersReviews_v1.0
 * @summary 
 *
 * @param {Integer} id - user id
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.params]
 * @param {integer} [options.params.id]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.postUsersMovies = function postUsersMovies(id, options) {


    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/users/{id}/movies",
        method  : "post",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#getUsersReview
 * @operationId getUsersReview_v1.0
 * @summary 
 *
 * @param {integer} [user_id]
 * @param {integer} [review_id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.user_id]
 * @param {integer} [options.path.review_id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.getUsersReview = function getUsersReview(user_id, review_id, options) {

    if (typeof user_id === 'object' && user_id !== null && typeof options === 'undefined') {
        options = user_id;
        user_id = undefined;
        review_id = undefined;
    }

    if (typeof review_id === 'object' && review_id !== null && typeof options === 'undefined') {
        options = review_id;
        review_id = undefined;
    }

    if (typeof user_id === 'undefined') {
        user_id = options && options.path && options.path['user_id'];
    }

    if (typeof review_id === 'undefined') {
        review_id = options && options.path && options.path['review_id'];
    }

    var opt = {
        url     : "/users/{user_id}/reviews/{review_id}",
        method  : "get",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{user_id}/, user_id);
    opt.url = opt.url.replace(/{review_id}/, review_id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#putUsersReview
 * @operationId putUsersReview_v1.0
 * @summary 
 *
 * @param {integer} [id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.putUsersReview = function putUsersReview(user_id, review_id, options) {

    if (typeof user_id === 'object' && user_id !== null && typeof options === 'undefined') {
        options = user_id;
        user_id = undefined;
        review_id = undefined;
    }

    if (typeof review_id === 'object' && review_id !== null && typeof options === 'undefined') {
        options = review_id;
        review_id = undefined;
    }

    if (typeof user_id === 'undefined') {
        user_id = options && options.path && options.path['user_id'];
    }

    if (typeof review_id === 'undefined') {
        review_id = options && options.path && options.path['review_id'];
    }

    var opt = {
        url     : "/users/{user_id}/reviews/{review_id}",
        method  : "put",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{user_id}/, user_id);
    opt.url = opt.url.replace(/{review_id}/, review_id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#deleteUsersReviews
 * @operationId deleteUsersReviews_v1.0
 * @summary 
 *
 * @param {integer} [id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.deleteUsersReviews = function deleteUsersReviews(id, options) {

    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/users/{id}/reviews",
        method  : "delete",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#deleteUsersReview
 * @operationId deleteUsersReview_v1.0
 * @summary 
 *
 * @param {integer} [user_id]
 * @param {integer} [review_id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.user_id]
 * @param {integer} [options.path.review_id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.deleteUsersReview = function deleteUsersReview(user_id, review_id, options) {

    if (typeof user_id === 'object' && user_id !== null && typeof options === 'undefined') {
        options = user_id;
        user_id = undefined;
        review_id = undefined;
    }

    if (typeof review_id === 'object' && movie_id !== null && typeof options === 'undefined') {
        options = review_id;
        review_id = undefined;
    }

    if (typeof user_id === 'undefined') {
        user_id = options && options.path && options.path['user_id'];
    }

    if (typeof review_id === 'undefined') {
        review_id = options && options.path && options.path['review_id'];
    }

    var opt = {
        url     : "/users/{user_id}/reviews/{review_id}",
        method  : "delete",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{user_id}/, user_id);
    opt.url = opt.url.replace(/{review_id}/, review_id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#getMovies
 * @operationId getMovies_v1.0
 * @summary 
 *
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.getMovies = function getMovies(options) {


    var opt = {
        url     : "/movies",
        method  : "get",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };


    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#getMoviesCountry
 * @operationId getMoviesCountry_v1.0
 * @summary 
 *
 * @param {integer} [movie_id]
 * @param {integer} [movie_id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.getMoviesCountry = function getMoviesCountry(movie_id, country_id, options) {

    if (typeof movie_id === 'object' && movie_id !== null && typeof options === 'undefined') {
        options = movie_id;
        movie_id = undefined;
        country_id = undefined;
    }

    if (typeof country_id === 'object' && country_id !== null && typeof options === 'undefined') {
        options = country_id;
        country_id = undefined;
    }

    if (typeof movie_id === 'undefined') {
        movie_id = options && options.path && options.path['movie_id'];
    }

    if (typeof country_id === 'undefined') {
        country_id = options && options.path && options.path['country_id'];
    }

    var opt = {
        url     : "/movies/{movie_id}/countries/{country_id}",
        method  : "get",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{movie_id}/, movie_id);
    opt.url = opt.url.replace(/{country_id}/, country_id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#postMovies
 * @operationId postMovies_v1.0
 * @summary 
 *
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {integer} [options.params.id]
 * @param {string} [options.params.name]
 * @param {string} [options.params.released_at]
 * @param {number} [options.params.rating]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.postMovies = function postMovies(options) {


    var opt = {
        url     : "/movies",
        method  : "post",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };


    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#getMoviesReviews
 * @operationId getMoviesReviews_v1.0
 * @summary 
 *
 * @param {Integer} id
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {Integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.getMoviesReviews = function getMoviesReviews(id, options) {


    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/movies/{id}/reviews",
        method  : "get",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#putMovie
 * @operationId putMovie_v1.0
 * @summary 
 *
 * @param {integer} [id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.putMovie = function putMovie(id, options) {

    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/movies/{id}",
        method  : "put",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};
/**
 * @method
 * @name TestServiceSDK#deleteMovie
 * @operationId deleteMovie_v1.0
 * @summary 
 *
 * @param {integer} [id]
 * @param {Object} options
 * @param {Object} options.data - request body payload in case of PUT|POST|DELETE, query parameters otherwise
 * @param {Object} [options.query]
 * @param {Object} [options.headers]
 * @param {Object} options.path
 * @param {integer} [options.path.id]
 * @return {Promise<Object>}
 */
TestServiceSDK.prototype.deleteMovie = function deleteMovie(id, options) {

    if (typeof id === 'object' && id !== null && typeof options === 'undefined') {
        options = id;
        id = undefined;
    }

    if (typeof id === 'undefined') {
        id = options && options.path && options.path['id'];
    }

    var opt = {
        url     : "/movies/{id}",
        method  : "delete",
        data    : (options && options.data) !== undefined ? options.data : {},
        params  : (options && options.query) !== undefined ? options.query : {},
        headers : (options && options.headers) !== undefined ? options.headers : {}
    };

    opt.url = opt.url.replace(/{id}/, id);

    return this.$request(opt);
};

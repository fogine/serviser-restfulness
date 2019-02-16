[![Build Status](https://travis-ci.org/BohemiaInteractive/bi-service-restfulness.svg?branch=master)](https://travis-ci.org/BohemiaInteractive/bi-service-restfulness)  [![Test Coverage](https://codeclimate.com/github/BohemiaInteractive/bi-service-restfulness/badges/coverage.svg)](https://codeclimate.com/github/BohemiaInteractive/bi-service-restfulness/coverage) [![npm version](https://badge.fury.io/js/bi-service-restfulness.svg)](https://www.npmjs.com/package/bi-service-restfulness)  


`bi-service-restfulness` is yet another `bi-service` plugin that will help you with your REST API implementation by generating fully functional API endpoints that operate on your ralational database backed resources.  
That being said, its up to the user to decide when it's more appropriate to implement a route from scratch due to its increasing complexity.

The following is a simplest example of what it takes to design basic REST API operations:  

```javascript
    //define resources

    const movie = new Resource({
        singular: 'movie',
        plural: 'movies',
        properties: {
            name: {type: 'string', pattern: '^[a-zA-Z0-9 ]+$'},
            description: {type: 'string', maxLength: 256},
            released_at: {type: 'string', format: 'date'}
        },
        responseProperties: {
            id: {type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER},
            name: {$ref: 'movie.name'},
            released_at: {$ref: 'movie.released_at'},
            rating: {type: 'number', minimum: 0, maximum: 10}
        }
    });

    //define http routers
    const movies = app.buildRestfulRouter({
        url: '/api/{version}/@movies',
        version: 1.0
    });

    //define http endpoints
    movies.get('/:{key}');//get movies
    movies.get('/');//get movies
    movies.post('/');//create new movie
    movies.put('/:{key}');//update a movie
    movies.del('/:{key}');//delete a movie
    movies.del('/');//delete movies
```

With assumption that you were to use `bi-service-doc` plugin, you'd get [THIS generated API documentation]() of above defined endpoints.  
On the other hand if you were to plug in `bi-service-sdk` you would get client API SDKs for free.  

Of cource, there is more to be familiarized with when defining REST operations using `bi-service-restfulness`:  

* [Resource definition](#resource-definition)
    * [constructor options](#constructor-options)
    * [property json-schema references](#property-json-schema-references)
    * [associations](#associations)
    * [API](#api)
        * [Resource.registry](#resrouceregistry)
            * [Resource.registry.getByPluralName](resourceregistrygetbypluralname)
            * [Resource.registry.getBySingularName](resourceregistrygetbysingularname)
        * [Resource.prototype.getName()](resourceprototypegetname)
        * [Resource.prototype.getPluralName()](resourceprototypegetpluralname)
        * [Resource.prototype.getTableName()](resourceprototypegettablename)
        * [Resource.prototype.getKeyName()](resourceprototypegetkeyname)
        * [Resource.prototype.prop()](resourceprototypeprop)
        * [Resource.prototype.hasProp()](resourceprototypehasprop)
        * [Resource.prototype.belongsTo()](resourceprototypebelongstoresource-options)
        * [Resource.prototype.hasMany()](resourceprototypehasmanyresource-options)
        * [Resource.prototype.belongsToMany()](resourceprototypebelongstomanyresource-options)
* [Route definition](#route-definition)
    * [list of supported REST operations](#list-of-supported-rest-operations)
    * [customizing route](#customizing-route)
        * [modifying response data](#response-properties)
        * [modifying accepted input data](#input-data-validation)
    * [about authentication/restricting access](#about-authentication/restricting-access)
    * [request lifecycle events and implementing extra logic](#request-lifecycle-events-and-implementing-extra-logic)

## Resource definition

Resources are compound data structures describing a data source and how it relates to `RDS` (relational database storage).

### constructor options

- `singular` - _required_ singular resource name
- `plural` - _required_ plural resource name
- `db` - options related to `RDS`
    - `table` - _required_, _default_ equals to `plural` resource name
    - `key` - primary key options
        - `name` - _required_, _default_:`id`
        - `type` - _required_, _default_:`integer` enum: [`integer`, `string`]
        - `format` - _optional_ `ajv` string format
        - `pattern` - _optional_ `ajv` string regex
- `properties` - _required_, `ajv-json-schema` object properties descriptor, lists allowed input properties for REST operations
- `responseProperties` - _optional_, `ajv-json-schema` object properties descriptor, lists allowed query and response properties, if NOT defined, ALL `properties` will be whitelisted
- `dynamicDefaults` - _optional_, `ajv` [dynamic defaults](https://github.com/epoberezkin/ajv-keywords#dynamicdefaults) definition object for properties listed in `properties` option object

### property json-schema references

Resource property schemas defined as part of `properties` & `responseProperties` constructor options will get registered with [Application](https://lucid-services.github.io/bi-service/App.html) wide `Ajv` validator instance allowing the user to reference property schema from outside of a resource the property belongs to.  

```javascript
    const user = new Resource({
        singular: 'user',
        plural: 'users',
        properties: {
            name: {type: 'string', maxLength: 32}
        },
        responseProperties: {
            id: {type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER},
            //reference the property schema from inside of the owning resource
            name: {$ref: 'user.name'}
        }
    });

    const post = new Resource({
        singular: 'post',
        plural: 'posts',
        properties: {
            title: {type: 'string', maxLength: 128},
            content: {type: 'string', maxLength: 2048},
            //reference user id from another resource
            user_id: {$ref: 'user.id'}
        }
    });
```

### associations

When designing a route which operates on multiple resources, eg:  
> /api/v1.0/@users/:{key}/@posts/:{key}  

the user must tell `bi-service-restfulness` how the resources are related to each other in order for the operation to function properly: 

```javascript
//defines relation of user to the post and relation of post to the user.
user.hasMany(post);
// or (both are redundant)
post.belongsTo(user);
```

See [Resource.prototype.belongsTo](#resourceprototypebelongstoresource-options)  
or/and [Resource.prototype.hasMany](#resourceprototypehasmanyresource-options)  
or/and [Resource.prototype.belongsToMany](#resourceprototypebelongstomanyresource-options) respectivelly.


### API

#### `Resource.registry`
is global `ResourceRegistry` instance
#### `Resource.registry.getByPluralName()`
retrieves a resource by its plural unique name
#### `Resource.registry.getBySingularName()`
retrieves a resource by its singular unique name
#### `Resource.prototype.getName(count)`
returns singular resource name by default, if `count` argument value is greater than 1 then it returns plural version of the name.
#### `Resource.prototype.getPluralName()`
returns plural version of the name.
#### `Resource.prototype.getTableName()`
returns `sql` table name as defined by `db.table` constructor option
#### `Resource.prototype.getKeyName()`
returns name of resource primary key
#### `Resource.prototype.prop()`
returns property schema as defined either in `properties` or `responseProperties` object. `properties` object takes precendence.
#### `Resource.prototype.hasProp()`
returns `boolean` value. True if property is defined either in `properties` or `responseProperties` object.
#### `Resource.prototype.belongsTo(resource, options)`
```javascript
/*
 * @param {Resource} resource
 * @param {Object} [options]
 * @param {String} [options.foreignKey]
 * @param {String} [options.localKey]
 */
```
Defines One to One association between `sourceResource.belongsTo(targetResource)`.  
* `localKey` option defaults to `<targetResourceSingularName>_<targetResourcePrimaryKeyName>`
* `foreignKey` option defaults to `<targetResourcePrimaryKeyName>`

#### `Resource.prototype.hasMany(resource, options)`
```javascript
/*
 * @param {Resource} resource
 * @param {Object} [options]
 * @param {String} [options.foreignKey]
 * @param {String} [options.localKey]
 */
```
Defines One to Many association between `sourceResource.hasMany(targetResource)`.  
* `localKey` option defaults to `<sourceResourcePrimaryKeyName>`
* `foreignKey` option defaults to `<sourceResourceSingularName>_<sourceResourcePrimaryKeyName>`

#### `Resource.prototype.belongsToMany(resource, options)`
```javascript
/*
 * @param {Resource} resource
 * @param {Object} options
 * @param {String} [options.foreignKey]
 * @param {String} [options.localKey]
 * @param {Object} [options.through]
 * @param {Resource} [options.through.resource]
 * @param {String} [options.through.localKey]
 * @param {String} [options.through.foreignKey]
 */
```
Defines Many to Many association between `sourceResource.belongsToMany(targetResource)`.  
* `localKey` option defaults to `<sourceResourcePrimaryKeyName>`
* `foreignKey` option defaults to `<targetResourcePrimaryKeyName>`
* `through.resource` option defaults to generated pivot resource object whose singular and plural name is set to alphabetically sorted and concatenated singular and plural names of source and target resources respectivelly.  
    eg: for source and target resources `users.belongsToMany(movies);` default pivot singular name would be `movie_user` and plural `movies_users`
* `through.localKey` option defaults to `<sourceResourceSingularName>_<sourceResourcePrimaryKeyName>`
* `through.foreignKey` option defaults to `<targetResourceSingularName>_<targetResourcePrimaryKeyName>`

## Route definition

### list of supported REST operations

#### spetial `_embed` query parameter

Accepted by all GET routes. Eager loads associated One to One resources (embedding collections is not supported).  
Examples:  
- `GET posts/1?_embed=user` - embeds whole user resource in the response - meaning embeds all properties defined as part of `responseProperties` user resource option
- `GET posts/1?_embed=user.username,user.id` - embeds user username and id in the response

#### spetial `_sort` & `_limit` & `_offset` query parameters

Accepted by GET routes that return a collection of resources.  
Allows to sort records and limit number of fetched records (paginate results)
Example:  
- `GET users/?_sort=username,-id` - order by username ASC, id DESC

#### filtering results or reducing scope of delete queries

Accepted by GET and DELETE routes that operate on a collection of resources.  
Routes that support it accept query parameter filters which are named after targed resource's response properties.  
Example resource:  
```javascript
    const user = new Resource({
        singular: 'user',
        plural: 'users',
        properties: { //results can  NOT be reduced by these properties
            password: {type: 'string'},
            email: {type: 'string'}
        },
        responseProperties: {
            id: {type: 'integer'},
            username: {type: 'string'}
        }
    });
```

accepts the following filter parameters (by default, can be modified):  
- `GET users/?id=1`
- `DELETE users/?username=anonym`

#### single resource queries

- `GET @resource/:{key}` - fetch resource response properties by primary key
- `GET @resource/:property` - fetch resource response properties by any underlying table column
- `GET @resource` - retrieve paginated and optionally sorted collection of all or filtered resources
- `POST @resource/:{key}` - create a new resource whose primary key type is NOT auto-incremented integer
- `POST @resource` - create a new resource whose primary key IS auto-incremented integer
- `PUT @resource/:{key}` - update a resource by its primary key
- `PUT @resource/:property` - update a resource by any of its properties
- `DELETE @resource/:{key}` - remove a resource by its primary key
- `DELETE @resource/:property` - remove a resource by any of its properties
- `DELETE @resource` - delete all resources or resources that match particular query filter

### multi resource queries

##### depending or relationship

###### many to many

- `GET @resource1/:{key}/@resource2/:{key}` - fetch resource2 which belongs to resource1 
- `GET @resource1/:property/@resource2/:property` - fetch resource2 which belongs to resource1
- `GET @resource1/:{key}/@resource2` - retrieve paginated and optionally sorted collection of all or filtered resource2 records that belong to resource1
- `GET @resource1/:property/@resource2` - retrieve paginated and optionally sorted collection of all or filtered resource2 records that belong to resource1
- `POST @resource1/:{key}/@resource2/:{key}` - create a new resource2 whose primary key type is NOT auto-incremented integer and associate it with resource1
- `POST @resource1/:property/@resource2/:{key}` - create a new resource2 whose primary key type is NOT auto-incremented integer and associate it with resource1
- `POST @resource1/:{key}/@resource2` - create a new resource2 whose primary key type IS auto-incremented integer and associate it with resource1
- `POST @resource1/:property/@resource2` - create a new resource2 whose primary key type IS auto-incremented integer and associate it with resource1
- `PUT @resource1/:{key}/@resource2/:{key}` - associate resource1 with resource2 by inserting a new record to pivot table
- `PUT @resource1/:property/@resource2/:property` - associate resource1 with resource2 by inserting a new record to pivot table
- `DELETE @resource1/:{key}/@resource2/:{key}` - deassociate resource1 and resource2 from each other
- `DELETE @resource1/:property/@resource2/:property` - deassociate resource1 and resource2 from each other
- `DELETE @resource1/:{key}/@resource2` - deassociate all resource1 records and resource2 records from each other where optional condition applies

###### one to many
- `GET @resource1/:{key}/@resource2/:{key}` - fetch resource2 which belongs to resource1 
- `GET @resource1/:property/@resource2/:property` - fetch resource2 which belongs to resource1
- `GET @resource1/:{key}/@resource2` - retrieve paginated and optionally sorted collection of all or filtered resource2 records that belong to resource1
- `GET @resource1/:property/@resource2` - retrieve paginated and optionally sorted collection of all or filtered resource2 records that belong to resource1
- `POST @resource1/:{key}/@resource2/:{key}` - create a new resource2 whose primary key type is NOT auto-incremented integer and associate it with resource1
- `POST @resource1/:property/@resource2/:{key}` - create a new resource2 whose primary key type is NOT auto-incremented integer and associate it with resource1
- `POST @resource1/:{key}/@resource2` - create a new resource2 whose primary key type IS auto-incremented integer and associate it with resource1
- `POST @resource1/:property/@resource2` - create a new resource2 whose primary key type IS auto-incremented integer and associate it with resource1
- `PUT @resource1/:{key}/@resource2/:{key}` - update a resource2 by its primary key whose foreign key value of resource1 is equal to particular value
- `DELETE @resource1/:{key}/@resource2/:{key}` - remove  resource2 that is associated to resource1
- `DELETE @resource1/:property/@resource2/:property` - remove resource2 that is associated to resource1
- `DELETE @resource1/:{key}/@resource2` - remove all resource2 records that are associated to resource1  where optional condition applies

###### one to one
- `GET @resource1/:{key}/@resource2/:{key}` - fetch resource2 which belongs to resource1 
- `GET @resource1/:property/@resource2/:property` - fetch resource2 which belongs to resource1

### customizing route

```javascript
    const user = new Resource({
        singular: 'user',
        plural: 'users',
        properties: {
            name: {type: 'string'},
            username: {type: 'string'},
            password: {type: 'string'},
            email: {type: 'string'}
        },
        responseProperties: {
            id: {type: 'integer'},
            name: {$ref: 'user.name'},
            username: {$ref: 'user.username'},
        }
    });

    const users = app.buildRestfulRouter({
        url: '/api/{version}/@users',
        version: 1.0
    });
```

`Router`'s `get` & `post` & `put` &  `del` methods all return an uninitialized `bi-service` [HttpRoute](https://lucid-services.github.io/bi-service/Route.html) object.  
The user is given time to manualy initialize the route in the current event loop tick, that is
to define validation rules for `headers` & `body` & `query` & `params` objects and/or response schema or even to implement or tweak
the main route's logic.  
`bi-service-restfulness` schedules initialization procedures that will execute on the next event loop tick and will set default behavior and rules
where it's not been done by the user.

```javascript
users.get('/'); //returns Route object instance
users.post('/'); //returns Route object instance
users.put('/'); //returns Route object instance
users.del('/'); //returns Route object instance
```

##### response properties

```javascript
users.get('/:{key}'); //get single user
```

the get user route, if not modified by the developer, returns `id` & `name` & `username` properties for every user.  
Lets modify the route so that it returns just the user username:  

```javascript
users
.get('/:{key}')
.respondsWith({
    type: 'object',
    additionalProperties: false,//IMPORTANT!
    properties: {
        username: {$ref: 'user.username'}
    }
});
```
simple, right? You just define a custom `json-schema`.   
That being said, by defining your cuctom response schema its entirely up to you what features will be enabled.  
For example the above custom schema does not allow any associated resources to be embedded along.

##### input data validation

```javascript
users.post('/'); //register new user
```

Again, the post users route, if not modified by the developer, accepts in its json payload all properties that are defined as part of user's resource `properties` constructor option.  

In this case, the route accepts `name` & `username` & `password` & `email` properties.  
Lets modify the route so that it accepts additional `password_confirmation` field:  

```javascript
users
.post('/')
.validate({
    type: 'object',
    additionalProperties: false,//IMPORTANT!
    properties: {
        name: {$ref: 'user.name'},
        username: {$ref: 'user.username'},
        password: {
            $ref: 'user.password',
            bcrypt: {saltLength: 8}
        },
        password_confirmation: {
            const: {$data: '1/password'}
        },
        email: {$ref: 'user.email'}
    }
}, 'body');
```
In the custom payload validator schema above, we make sure `password_confirmation` field matches the `password` field.  

There is one more thing we did and thats we applied our custom validation/sanitization keyword to the valid password field which will make sure the password gets transformed into a more secure hash.  
For custom keyword definition see `ajv`'s [official documentation](https://github.com/epoberezkin/ajv/blob/master/CUSTOM.md).  
You can then apply the keyword to a `ajv` validator instance on your `bi-sevice` [HttpApplication](https://lucid-services.github.io/bi-service/App.html#getValidator) object.


Tests
-------------------

- unit tests  
`npm test`

- integration tests  
`npm run test:docker`


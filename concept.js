

/**
 * @return {undefined}
 */
function Segment() {
    /*
     * child / parent resources
     */
    this.parents = [];
    this.childs = [];

    //resource naming
    this.name = {
        singular: 'user',
        plural: 'users'
    };
    this.db = {
        table: 'user',
        key: {
            name: 'id',
            type: 'string',
            format: ''
        }
    };

    //resource data structure
    this.request = {
        schema: {
            properties: {
                username: {type: 'string'},
                email: {type: 'string', format: 'email'},
                password: {type: 'string'}
            }
        }
    };
    this.response = {
        schema: {
            properties: {
                username: {type: 'string'},
                email: {type: 'string'}
                apps: {$ref: 'REST@apps'},
            }
        }
    };
}

let users = Segment.build({singular: 'user', plural: 'users'});
let apps = Segment.build();

users.belongsTo(apps);
users.belongsToMany(apps);
users.hasMany(apps);
users.hasOne(apps);

let rest = REST.with({
    app: app,
    url: '/@users/:{key}'
});

let getAll = rest.get('/@apps');
let get = rest.get('/@apps/:id');
let post = rest.post('/@apps');
let del = rest.del('/@apps/:id');

route.on('query', function(q) {
});

const Resource = require('../../../lib/resource.js');

describe('Resource', function() {
    describe('constructor', function() {
        it('should fail with an Error when singular resource name is not provided', function() {
            this.expect(function() {
                new Resource({
                    plural: 'users',
                    properties: {}
                });
            }).to.throw(Error, /singular/);
        });

        it('should trim and convert toLowerCase the resource name(s)', function() {
            let resource = new Resource({
                plural: '  Users  ',
                singular: '  UseR',
                properties: {}
            });

            resource.options.plural.should.be.equal('users');
            resource.options.singular.should.be.equal('user');
        });

        it('should fail with an Error when plural resource name is not provided', function() {
            this.expect(function() {
                new Resource({
                    singular: 'user',
                    properties: {}
                });
            }).to.throw(Error, /plural/);
        });

        it('should fail with an Error when properties object is not provided', function() {
            this.expect(function() {
                new Resource({
                    singular: 'user',
                    plural: 'users'
                });
            }).to.throw(Error, /properties/);
        });

        it('should fail with an Error when invalid `dynamicDefaults` option value is provided', function() {
            this.expect(function() {
                new Resource({
                    singular: 'user',
                    plural: 'users',
                    properties: {},
                    dynamicDefaults: null
                });
            }).to.throw(Error, /dynamicDefaults/);
        });

        it('should fail with an Error when invalid `db` option value is provided', function() {
            this.expect(function() {
                new Resource({
                    singular: 'user',
                    plural: 'users',
                    properties: {},
                    db: null
                });
            }).to.throw(Error, /db/);
        });

        it('should fail with an Error when invalid `db.table` option value is provided', function() {
            this.expect(function() {
                new Resource({
                    singular: 'user',
                    plural: 'users',
                    properties: {},
                    db: {table: null}
                });
            }).to.throw(Error, /db.table/);
        });

        it('should fail with an Error when invalid `db.key` option value is provided', function() {
            this.expect(function() {
                new Resource({
                    singular: 'user',
                    plural: 'users',
                    properties: {},
                    db: {key: null}
                });
            }).to.throw(Error, /db.key/);
        });

        it('should assign default value of db.table option', function() {
            let resource = new Resource({
                singular: 'user',
                plural: 'users',
                properties: {}
            });

            resource.options.should.have.deep.property('db.table', 'user');
        });

        it('should assign a reference of properties object to responseProperties when no responseProperties are defined', function() {
            let resource = new Resource({
                singular: 'user',
                plural: 'users',
                properties: {
                    username: {type: 'string'}
                }
            });

            resource.options.should.have.deep.property('responseProperties.username');
            resource.options.responseProperties.should.be.equal(resource.options.properties);
        });
    });

    describe('getName', function() {
        before(function() {
            this.resource = new Resource({
                singular: 'user',
                plural: 'users',
                properties: {}
            });
        });

        it('should return a singular name by default', function() {
            this.resource.getName().should.be.equal('user');
        });

        it('should return a singular name when count is <= 1', function() {
            this.resource.getName(1).should.be.equal('user');
            this.resource.getName(0).should.be.equal('user');
        });

        it('should return a plural name when count is > 1', function() {
            this.resource.getName(2).should.be.equal('users');
            this.resource.getName(3).should.be.equal('users');
        });
    });

    describe('getPluralName', function() {
        before(function() {
            this.resource = new Resource({
                singular: 'user',
                plural: 'users',
                properties: {}
            });
        });

        it('should return resource name in the plural form', function() {
            this.resource.getPluralName().should.be.equal('users');
        });
    });

    describe('getTableName', function() {
        it('should return database table name', function() {
            let resource = new Resource({
                singular: 'user',
                plural: 'users',
                properties: {}
            });
            resource.getTableName().should.be.equal('user');
        });

        it('should return database table name (2)', function() {
            let resource = new Resource({
                singular: 'user',
                plural: 'users',
                db: {
                    table: 'users'
                },
                properties: {}
            });

            resource.getTableName().should.be.equal('users');
        });
    });

    describe('prop', function() {
        before(function() {
            this.resource = new Resource({
                singular: 'user',
                plural: 'users',
                properties: {
                    username: {type: 'string'},
                    address: {
                        type: 'object',
                        properties: {
                            country_code: {type: 'string'},
                            city: {type: 'string'}
                        }
                    }
                }
            });
        });

        it('should return a property schema from the `properties` object', function() {
            this.resource.prop('username').should.be.eql({
                type: 'string'
            });
        });

        it('should return a property schema from the `responseProperties` object when the property is not available in `properties`', function() {
            this.resource.prop('address').should.be.eql({
                type: 'object',
                properties: {
                    country_code: {type: 'string'},
                    city: {type: 'string'}
                }
            });
        });

        it('should fail when the resource does not have such property', function() {
            const self = this;

            this.expect(function() {
                self.resource.prop('unknown');
            }).to.throw(Error, /no such property: unknown/);
        });
    });

    describe('getKeyName', function() {
        it('should return name of the resource primary key', function() {
            let resource = new Resource({
                singular: 'user',
                plural: 'users',
                db: {
                    key: {
                        name: 'key'
                    }
                },
                properties: {}
            });

            resource.getKeyName().should.be.equal('key');
        });
    });

    describe('associations', function() {
        beforeEach(function() {
            this.resource1 = new Resource({
                singular: 'resource1',
                plural: 'resources1',
                db: {
                    key: {
                        name: 'key'
                    }
                },
                properties: {}
            });

            this.resource2 = new Resource({
                singular: 'resource2',
                plural: 'resources2',
                properties: {}
            });
        });

        describe('belongsTo', function() {
            it('should create correct association at the source resource', function() {
                this.resource1.belongsTo(this.resource2);
                this.resource1._associations.should.have.property('resources2')
                .that.is.eql({
                    type: '1x1',
                    foreignKey: 'id',
                    localKey: 'resource2_id'
                });
            });

            it('should allow us to overwrite foreignKey & localKey defaults', function() {
                this.resource1.belongsTo(this.resource2, {
                    foreignKey: 'key', //resource2 column
                    localKey: 'resource2_key' //resource1 column
                });
                this.resource1._associations.should.have.property('resources2')
                .that.is.eql({
                    type: '1x1',
                    foreignKey: 'key',
                    localKey: 'resource2_key'
                });
            });

            it('should be noop when the association has been already defined', function() {
                this.resource1.belongsTo(this.resource2);

                this.resource1._associations.should.have.property('resources2')
                .that.is.eql({
                    type: '1x1',
                    foreignKey: 'id',
                    localKey: 'resource2_id'
                });

                let assocBck = this.resource1._associations['resources2'];

                this.resource1.belongsTo(this.resource2);
                this.resource1._associations['resources2'].should.be.equal(assocBck);
            });

            it('should throw a TypeError when invalid related resource is provided', function() {
                const self = this;

                this.expect(function() {
                    self.resource1.belongsTo({});
                }).to.throw(TypeError);
            });
        });

        describe('hasMany', function() {
            it('should create correct association at the source resource', function() {
                this.resource1.hasMany(this.resource2);
                this.resource1._associations.should.have.property('resources2')
                .that.is.eql({
                    type: '1xM',
                    foreignKey: 'resource1_key',
                    localKey: 'key',
                });
            });

            it('should allow us to overwrite foreignKey & localKey defaults', function() {
                this.resource1.hasMany(this.resource2, {
                    foreignKey: 'resource_uid', //resource2 column
                    localKey: 'uid' //resource1 column
                });
                this.resource1._associations.should.have.property('resources2')
                .that.is.eql({
                    type: '1xM',
                    foreignKey: 'resource_uid',
                    localKey: 'uid'
                });
            });

            it('should be noop when the association has been already defined', function() {
                this.resource1.hasMany(this.resource2);

                this.resource1._associations.should.have.property('resources2')
                .that.is.eql({
                    type: '1xM',
                    foreignKey: 'resource1_key',
                    localKey: 'key'
                });

                let assocBck = this.resource1._associations['resources2'];

                this.resource1.hasMany(this.resource2);
                this.resource1._associations['resources2'].should.be.equal(assocBck);
            });

            it('should throw a TypeError when invalid related resource is provided', function() {
                const self = this;

                this.expect(function() {
                    self.resource1.hasMany({});
                }).to.throw(TypeError);
            });
        });

        describe('belongsToMany', function() {
            it('should create correct association at the source resource', function() {
                this.resource1.belongsToMany(this.resource2);
                this.resource1._associations.should.have.property('resources2')
                .that.is.eql({
                    type: 'MxM',
                    foreignKey: 'id',
                    localKey: 'key',
                    through: {
                        resource: 'resources1_resources2',
                        foreignKey: 'resource2_id',
                        localKey: 'resource1_key'
                    }
                });
            });

            it('should allow us to overwrite foreignKey & localKey defaults', function() {
                this.resource1.belongsToMany(this.resource2, {
                    foreignKey: 'uuid', //resource2 column
                    localKey: 'id', //resource1 column
                    through: {
                        foreignKey: 'resource2_uuid',
                        localKey: 'resource1_id'
                    }
                });

                this.resource1._associations.should.have.property('resources2')
                .that.is.eql({
                    type: 'MxM',
                    foreignKey: 'uuid',
                    localKey: 'id',
                    through: {
                        resource: 'resources1_resources2',
                        foreignKey: 'resource2_uuid',
                        localKey: 'resource1_id'
                    }
                });
            });

            it('should be noop when the association has been already defined', function() {
                this.resource1.belongsToMany(this.resource2);

                this.resource1._associations.should.have.property('resources2')
                .that.is.eql({
                    type: 'MxM',
                    foreignKey: 'id',
                    localKey: 'key',
                    through: {
                        resource: 'resources1_resources2',
                        foreignKey: 'resource2_id',
                        localKey: 'resource1_key'
                    }
                });

                let assocBck = this.resource1._associations['resources2'];

                this.resource1.belongsToMany(this.resource2);
                this.resource1._associations['resources2'].should.be.equal(assocBck);
            });

            it('should throw a TypeError when invalid related resource is provided', function() {
                const self = this;

                this.expect(function() {
                    self.resource1.belongsToMany({});
                }).to.throw(TypeError);
            });
        });
    });
});

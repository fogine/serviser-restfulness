describe('Resource', function() {
    it('should have static property named registry of instanceof ResourceRegistry value', function() {
        this.Resource.registry.should.be.instanceof(this.ResourceRegistry);
    });

    describe('constructor', function() {
        it('should fail with an Error when singular resource name is not provided', function() {
            const self = this;

            this.expect(function() {
                new self.Resource({
                    plural: 'users',
                    properties: {}
                });
            }).to.throw(Error, /singular/);
        });

        it('should trim and convert toLowerCase the resource name(s)', function() {
            let resource = new this.Resource({
                plural: '  Users  ',
                singular: '  UseR',
                properties: {}
            });

            resource.options.plural.should.be.equal('users');
            resource.options.singular.should.be.equal('user');
        });

        it('should fail with an Error when plural resource name is not provided', function() {
            const self = this;

            this.expect(function() {
                new self.Resource({
                    singular: 'user',
                    properties: {}
                });
            }).to.throw(Error, /plural/);
        });

        it('should fail with an Error when properties object is not provided', function() {
            const self = this;

            this.expect(function() {
                new self.Resource({
                    singular: 'user',
                    plural: 'users'
                });
            }).to.throw(Error, /properties/);
        });

        it('should fail with an Error when invalid `dynamicDefaults` option value is provided', function() {
            const self = this;

            this.expect(function() {
                new self.Resource({
                    singular: 'user',
                    plural: 'users',
                    properties: {},
                    dynamicDefaults: null
                });
            }).to.throw(Error, /dynamicDefaults/);
        });

        it('should fail with an Error when invalid `db` option value is provided', function() {
            const self = this;

            this.expect(function() {
                new self.Resource({
                    singular: 'user',
                    plural: 'users',
                    properties: {},
                    db: null
                });
            }).to.throw(Error, /db/);
        });

        it('should fail with an Error when invalid `db.table` option value is provided', function() {
            const self = this;

            this.expect(function() {
                new self.Resource({
                    singular: 'user',
                    plural: 'users',
                    properties: {},
                    db: {table: null}
                });
            }).to.throw(Error, /db.table/);
        });

        it('should fail with an Error when invalid `db.key` option value is provided', function() {
            const self = this;

            this.expect(function() {
                new self.Resource({
                    singular: 'user',
                    plural: 'users',
                    properties: {},
                    db: {key: null}
                });
            }).to.throw(Error, /db.key/);
        });

        it('should assign default value of db.table option', function() {
            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                properties: {}
            });

            resource.options.should.have.deep.property('db.table', 'users');
        });

        it('should set default responseProperties when no responseProperties are defined', function() {
            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                properties: {
                    username: {type: 'string'}
                }
            });

            resource.options.responseProperties.should.be.eql({
                id: {type: 'integer'},
                username: {type: 'string'}
            });
        });

        it('should register itself with Resource.registry', function() {
            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                properties: {
                    username: {type: 'string'}
                }
            });

            this.Resource.registry.getByPluralName('users').should.be.equal(resource);
        });

        describe('timestamps & softDelete options', function() {
            it('should assign default value for timestamps option', function() {
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    properties: {}
                });

                resource.options.should.have.property('timestamps', false);
            });

            it('should set timestamps option to true', function() {
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    timestamps: true,
                    properties: {}
                });

                resource.options.should.have.property('timestamps', true);
            });

            it('should assign default value for selfDelete option', function() {
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    properties: {}
                });

                resource.options.should.have.property('softDelete', false);
            });

            it('should assign timestamp properties to default responseProperties', function() {
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    timestamps: true,
                    properties: {
                        username: {type: 'string'}
                    }
                });
                const expected = {
                    id: {type: 'integer'},
                    username: {type: 'string'}
                }
                expected[resource.CREATED_AT] = {type: 'string', format: 'date-time'};
                expected[resource.UPDATED_AT] = {type: 'string', format: 'date-time'};

                resource.getResponseProperties().should.be.eql(expected);
            });

            it('should assign default value for CREATED_AT & UPDATED_AT & DELETED_AT options', function() {
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    properties: {}
                });

                resource.options.should.have.property('CREATED_AT', 'created_at');
                resource.options.should.have.property('UPDATED_AT', 'updated_at');
                resource.options.should.have.property('DELETED_AT', 'deleted_at');
            });
        });
    });

    describe('getName', function() {
        before(function() {
            this.resource = new this.Resource({
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
            this.resource = new this.Resource({
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
            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                properties: {}
            });
            resource.getTableName().should.be.equal('users');
        });

        it('should return database table name (2)', function() {
            let resource = new this.Resource({
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
            this.resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                properties: {
                    username: {type: 'string'}
                },
                responseProperties: {
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

    describe('hasProp', function() {
        before(function() {
            this.resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                properties: {
                    username: {type: 'string'},
                },
                responseProperties: {
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

        it('should return true when a property exists in `properties` object', function() {
            this.resource.hasProp('username').should.be.equal(true);
        });

        it('should return true when a property exists in `responseProperties` despite it does not exist in `properties` object', function() {
            this.resource.hasProp('address').should.be.equal(true);
        });

        it('should fireturn false when a resource does not have such property', function() {
            this.resource.hasProp('unknown').should.be.equal(false);
        });
    });

    describe('hasTimestamps', function() {
        it('should return true when resource has timestamps option set', function() {

            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                timestamps: true,
                properties: {},
            });

            resource.hasTimestamps().should.be.equal(true);
        });

        it('should return false when resource does not have timestamps option set', function() {

            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                timestamps: false,
                properties: {},
            });

            resource.hasTimestamps().should.be.equal(false);
        });

        it('should return true when resource can be soft deleted', function() {

            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                softDelete: true,
                properties: {},
            });

            resource.hasTimestamps(resource.DELETED_AT).should.be.equal(true);
        });

        it('should return false when resource can NOT be soft deleted', function() {

            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                properties: {},
            });

            resource.hasTimestamps(resource.DELETED_AT).should.be.equal(false);
        });
    });

    describe('getKeyName', function() {
        it('should return name of the resource primary key', function() {
            let resource = new this.Resource({
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

    describe('getResponseProperties', function() {
        it('should return response properties object when defined', function() {
            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                db: {
                    key: {
                        name: 'key'
                    }
                },
                properties: {
                    password: {type: 'string'}
                },
                responseProperties: {
                    username: {type: 'string'}
                }
            });

            resource.getResponseProperties().should.be.eql({
                username: {type: 'string'}
            });
        });
    });

    describe('getProperties', function() {
        it('should return resource properties object', function() {
            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                db: {
                    key: {
                        name: 'key'
                    }
                },
                properties: {
                    password: {type: 'string'}
                }
            });

            resource.getProperties().should.be.eql({
                password: {type: 'string'}
            });
            resource.getProperties().should.be.equal(resource.options.properties);
        });
    });

    describe('getDynamicDefaults', function() {
        it('should return dynamic defaults definition', function() {
            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                dynamicDefaults: {
                    created_at: 'datetime'
                },
                properties: {
                    created_at: {type: 'string'}
                }
            });

            resource.getDynamicDefaults().should.be.eql({
                created_at: 'datetime'
            });
            resource.getDynamicDefaults().should.be.equal(resource.options.dynamicDefaults);
        });

        it('should return empty object whne dynamic defaults are not defined', function() {
            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                properties: {
                    created_at: {type: 'string'}
                }
            });

            resource.getDynamicDefaults().should.be.eql({});
        });
    });

    describe('getRequiredProperties', function() {
        it('should return array of property names which dont have either dynamic or static default value defined', function() {
            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                dynamicDefaults: {
                    created_at: 'datetime',
                },
                properties: {
                    created_at: {type: 'string'},
                    activated: {type: 'boolean', default: true},
                    username: {type: 'string'},
                    password: {type: 'string'}
                }
            });

            resource.getRequiredProperties().should.be.eql(['username', 'password']);
        });
    });

    describe('_getCommonProperties', function() {
        before(function() {
            this.resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                properties: {
                    password: {type: 'string'},
                    email: {type: 'string', format: 'email'},
                    id: {$ref: 'user.id'}
                },
                responseProperties: {
                    username: {$ref: 'user.email'},
                    password: {$ref: 'user.password'},
                    created_at: {type: 'string', format: 'date-time'}
                }
            });
        });

        it('should return valid collection of common resource properties', function() {
            let schema = this.resource._getCommonProperties();

            this.expect(schema).to.be.eql([
                {
                    "$id": "user.password",
                    type: "string"
                },
                {
                    "$id": "user.email",
                    format: "email",
                    type: "string"
                },
                {
                    "$id": "user.created_at",
                    format: "date-time",
                    type: "string"
                }
            ]);
        });
    });

    describe('associations', function() {
        beforeEach(function() {
            this.resource1 = new this.Resource({
                singular: 'resource1',
                plural: 'resources1',
                db: {
                    key: {
                        name: 'key'
                    }
                },
                properties: {}
            });

            this.resource2 = new this.Resource({
                singular: 'resource2',
                plural: 'resources2',
                properties: {}
            });
        });

        describe('getAssociatedResourceNames', function() {
            it('should return collection of associated resource names', function() {
                this.resource1.belongsTo(this.resource2);
                this.resource1.getAssociatedResourceNames().should.be.eql(['resources2']);
                this.resource2.getAssociatedResourceNames().should.be.eql(['resources1']);
            });

            it('should return an empty array', function() {
                this.resource1.getAssociatedResourceNames().should.be.eql([]);
            });
        });

        describe('hasAssociation', function() {
            it('should return true if a resource is associated to any other resource', function() {
                this.resource1.belongsTo(this.resource2);

                this.resource1.hasAssociation().should.be.equal(true);
                this.resource2.hasAssociation().should.be.equal(true);
            });

            it('should return false if a resource is NOT associated to any other resource', function() {
                this.resource1.hasAssociation().should.be.equal(false);
                this.resource2.hasAssociation().should.be.equal(false);
            });

            it('should return true if a resource is associated to specific resource provided by first argument', function() {
                this.resource1.belongsTo(this.resource2);

                this.resource1.hasAssociation(this.resource2).should.be.equal(true);
                this.resource1.hasAssociation(this.resource2.getPluralName()).should.be.equal(true);

                this.resource2.hasAssociation(this.resource1).should.be.equal(true);
                this.resource2.hasAssociation(this.resource1.getPluralName()).should.be.equal(true);
            });

            it('should return false if a resource is NOT associated to specific resource provided by first argument', function() {
                this.resource1.hasAssociation(this.resource2).should.be.equal(false);
                this.resource1.hasAssociation(this.resource2.getPluralName()).should.be.equal(false);

                this.resource2.hasAssociation(this.resource1).should.be.equal(false);
                this.resource2.hasAssociation(this.resource1.getPluralName()).should.be.equal(false);
            });

            it('should return true if a resource is associated to a particual resource via 1x1 association type', function() {
                this.resource1.belongsTo(this.resource2);

                this.resource1.hasAssociation(this.resource2, '1x1').should.be.equal(true);
                this.resource2.hasAssociation(this.resource1, '1xM').should.be.equal(true);
            });

            it('should return false if a resource is associated to a particual resource but with INCORRECT association type', function() {
                this.resource1.belongsTo(this.resource2);

                this.resource1.hasAssociation(this.resource2, '1xM').should.be.equal(false);
                this.resource2.hasAssociation(this.resource1, '1x1').should.be.equal(false);
            });
        });

        describe('hasAssociationType', function() {
            it('should return true if a resource has 1x1 association to other resource', function() {
                this.resource1.belongsTo(this.resource2);

                this.resource1.hasAnyAssociationOfType('1x1').should.be.equal(true);
                this.resource2.hasAnyAssociationOfType('1xM').should.be.equal(true);
            });

            it('should return false if a resource does NOT have 1x1 association', function() {
                this.resource1.belongsToMany(this.resource2);

                this.resource1.hasAnyAssociationOfType('1x1').should.be.equal(false);
                this.resource2.hasAnyAssociationOfType('1x1').should.be.equal(false);
            });
        });

        describe('getAssociation', function() {
            it('should return association details object', function() {
                this.resource1.belongsTo(this.resource2);

                this.resource1.getAssociation(this.resource2)
                    .should.be.eql({
                        type: '1x1',
                        foreignKey: 'id',
                        localKey: 'resource2_id'
                    });

                this.resource1.getAssociation(this.resource2.getPluralName())
                    .should.be.eql({
                        type: '1x1',
                        foreignKey: 'id',
                        localKey: 'resource2_id'
                    });

                this.resource1.getAssociation(this.resource2)
                    .should.be.equal(this.resource1._associations[this.resource2.getPluralName()]);
            });

            it('should throw an Error when no such association exists', function() {
                const self = this;
                this.resource1.belongsToMany(this.resource2);

                function getAssoc() {
                    self.resource1.getAssociation(self.resource1);
                }

                this.expect(getAssoc).to.throw(Error, /No such association:/);
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

            it('should create correct association at the target resource', function() {
                this.resource1.belongsTo(this.resource2);
                this.resource2._associations.should.have.property('resources1')
                .that.is.eql({
                    type: '1xM',
                    foreignKey: 'resource2_id',
                    localKey: 'id'
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

            it('should create correct association at the target resource', function() {
                this.resource1.hasMany(this.resource2);
                this.resource2._associations.should.have.property('resources1')
                .that.is.eql({
                    type: '1x1',
                    foreignKey: 'key',
                    localKey: 'resource1_key',
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

                const throughResource
                    = this.resource1._associations.resources2.through.resource;

                this.resource1._associations.should.have.property('resources2')
                .that.is.eql({
                    type: 'MxM',
                    foreignKey: 'id',
                    localKey: 'key',
                    through: {
                        resource: throughResource,
                        foreignKey: 'resource2_id',
                        localKey: 'resource1_key'
                    }
                });

                throughResource.should.be.instanceof(this.Resource);
                throughResource.getPluralName().should.be.equal('resources1_resources2');
                throughResource.getName().should.be.equal('resource1_resource2');
                throughResource.getResponseProperties().should.be.eql({
                    id: {type: 'integer'},
                    resource1_key: {type: 'integer'},
                    resource2_id: {type: 'integer'}
                });
            });

            it('should create correct association at the target resource', function() {
                this.resource1.belongsToMany(this.resource2);

                const throughResource
                    = this.resource1._associations.resources2.through.resource;

                this.resource2._associations.should.have.property('resources1')
                .that.is.eql({
                    type: 'MxM',
                    foreignKey: 'key',
                    localKey: 'id',
                    through: {
                        resource: throughResource,
                        foreignKey: 'resource1_key',
                        localKey: 'resource2_id'
                    }
                });

                throughResource.should.be.instanceof(this.Resource);
                throughResource.getPluralName().should.be.equal('resources1_resources2');
                throughResource.getName().should.be.equal('resource1_resource2');
                throughResource.getResponseProperties().should.be.eql({
                    id: {type: 'integer'},
                    resource1_key: {type: 'integer'},
                    resource2_id: {type: 'integer'}
                });
            });

            it('should allow us to overwrite through pivot resource & foreignKey & localKey defaults', function() {
                const throughResource = new this.Resource({
                    plural: 'resources_resources2',
                    singular: 'resource_resource2',
                    properties: {
                        resource2_uuid: {type: 'integer'},
                        resource1_id: {type: 'integer'}
                    }
                });

                this.resource1.belongsToMany(this.resource2, {
                    foreignKey: 'uuid', //resource2 column
                    localKey: 'id', //resource1 column
                    through: {
                        resource: throughResource,
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
                        resource: throughResource,
                        foreignKey: 'resource2_uuid',
                        localKey: 'resource1_id'
                    }
                });
            });

            it('should be noop when the association has been already defined', function() {
                this.resource1.belongsToMany(this.resource2);
                const throughResource
                    = this.resource1._associations.resources2.through.resource;

                this.resource1._associations.should.have.property('resources2')
                .that.is.eql({
                    type: 'MxM',
                    foreignKey: 'id',
                    localKey: 'key',
                    through: {
                        resource: throughResource,
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

    describe('query', function() {
        before(function() {
            this.knex = this.Knex({
                client: 'pg',
                connection: {
                    host : process.env.POSTGRES_HOST,
                    user : process.env.POSTGRES_USER,
                    password : process.env.POSTGRES_PASSWORD,
                    database : process.env.POSTGRES_DB
                }
            });
            this.runner = this.sinon.stub(this.KnexRunner.prototype, 'query');
            this.ensureConnection = this.sinon.stub(this.KnexRunner.prototype, 'ensureConnection').resolves({});
        });

        after(function() {
            this.runner.restore();
            this.ensureConnection.restore();
        });

        beforeEach(function() {
            this.runner.reset();
        });

        it('should return a new QueryBuilder', function() {
            let resource = new this.Resource({
                singular: 'user',
                plural: 'users',
                properties: {}
            });

            resource.query(this.knex).should.be.instanceof(this.KnexBuilder);
        });

        describe('insert', function() {
            it('should append created_at & updated_at timestamps', function() {
                const self = this;
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    timestamps: true,
                    properties: {}
                });

                return resource.query(this.knex).insert({
                    username: 'value'
                }).then(function() {
                    self.runner.should.be.calledOnce;
                    self.runner.should.be.calledWith(self.sinon.match({
                        bindings: ['value'],
                        sql: 'insert into "users" ("created_at", "updated_at", "username") values (now(), now(), ?)'
                    }));
                });
            });

            it('should not modify the query when resources timestamps option is false', function() {
                const self = this;
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    timestamps: false,
                    properties: {}
                });

                return resource.query(this.knex).insert({
                    username: 'value'
                }).then(function() {
                    self.runner.should.be.calledOnce;
                    self.runner.should.be.calledWith(self.sinon.match({
                        bindings: ['value'],
                        sql: 'insert into "users" ("username") values (?)'
                    }));
                });
            });
        });

        describe('update', function() {
            it('should autoupdate updated_at timestamp', function() {
                const self = this;
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    timestamps: true,
                    properties: {}
                });

                return resource.query(this.knex).update('username', 'value').then(function() {
                    self.runner.should.be.calledOnce;
                    self.runner.should.be.calledWith(self.sinon.match({
                        sql: 'update "users" set "username" = ?, "updated_at" = now()'
                    }));
                });
            });

            it('should not update timestamps if resource doesnt have them', function() {
                const self = this;
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    timestamps: false,
                    properties: {}
                });

                return resource.query(this.knex).update('username', 'value').then(function() {
                    self.runner.should.be.calledOnce;
                    self.runner.should.be.calledWith(self.sinon.match({
                        sql: 'update "users" set "username" = ?'
                    }));
                });
            });
        });

        describe('delete', function() {
            it('should perform update instead of delete when resources solfDelete option is true', function() {
                const self = this;
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    softDelete: true,
                    properties: {}
                });

                return resource.query(this.knex).where('id', 1).del().then(function() {
                    self.runner.should.be.calledOnce;
                    self.runner.should.be.calledWith(self.sinon.match({
                        bindings: [1],
                        sql: 'update "users" set "deleted_at" = now() where "id" = ?'
                    }));
                });
            });

            it('should execute delete operation when resources softDelete option is false', function() {
                const self = this;
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    softDelete: false,
                    properties: {}
                });

                return resource.query(this.knex).where('id', 1).del().then(function() {
                    self.runner.should.be.calledOnce;
                    self.runner.should.be.calledWith(self.sinon.match({
                        bindings: [1],
                        sql: 'delete from "users" where "id" = ?'
                    }));
                });
            });
        });

        describe('select', function() {
            it('should append where deleted_at is null clause when resources softDelete option is true', function() {
                const self = this;
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    softDelete: true,
                    properties: {}
                });

                return resource.query(this.knex).where('id', 1).select().then(function() {
                    self.runner.should.be.calledOnce;
                    self.runner.should.be.calledWith(self.sinon.match({
                        bindings: [1],
                        sql: 'select * from "users" where "id" = ? and "users"."deleted_at" is null'
                    }));
                });
            });

            it('should not modify sql query when the resources softDelete option is false', function() {
                const self = this;
                let resource = new this.Resource({
                    singular: 'user',
                    plural: 'users',
                    softDelete: false,
                    properties: {}
                });

                return resource.query(this.knex).where('id', 1).select().then(function() {
                    self.runner.should.be.calledOnce;
                    self.runner.should.be.calledWith(self.sinon.match({
                        bindings: [1],
                        sql: 'select * from "users" where "id" = ?'
                    }));
                });
            });
        });
    });
});

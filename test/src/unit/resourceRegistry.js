describe('ResourceRegistry', function() {
    beforeEach(function() {
        this.resourceRegistry = new this.ResourceRegistry;
    });

    describe('add', function() {
        it('should throw a TypeError when invalid resource value is provided', function() {
            const self = this;

            this.expect(function() {
                self.resourceRegistry.add({});
            }).to.throw(TypeError, /must be instanceof `Resource`/);
        });

        it('should register provided resource object', function() {
            const res = new this.Resource({
                singular: 'user',
                plural: 'users',
                properties: {}
            });

            this.resourceRegistry.add(res);

            this.resourceRegistry.should.have.deep.property(
                '_registry.singular.user'
            ).that.is.equal(res);

            this.resourceRegistry.should.have.deep.property(
                '_registry.plural.users'
            ).that.is.equal(res);
        });
    });

    describe('getByPluralName', function() {
        beforeEach(function() {
            const res = new this.Resource({
                singular: 'human',
                plural: 'humans',
                properties: {}
            });

            this.res = res;
            this.resourceRegistry.add(res);
        });

        it('should throw an Error when no such resource is found', function() {
            const self = this;

            this.expect(function() {
                self.resourceRegistry.getByPluralName('unknownname');
            }).to.throw(Error, /No resource matching plural name unknownname/);
        });

        it('should return resource object that matches provided plural name', function() {
            this.resourceRegistry.getByPluralName('humans').should.be.equal(this.res);
        });
    });

    describe('getBySingularName', function() {
        beforeEach(function() {
            const res = new this.Resource({
                singular: 'human',
                plural: 'humans',
                properties: {}
            });

            this.res = res;
            this.resourceRegistry.add(res);
        });

        it('should throw an Error when no such resource is found', function() {
            const self = this;

            this.expect(function() {
                self.resourceRegistry.getBySingularName('unknownname');
            }).to.throw(Error, /No resource matching singular name unknownname/);
        });

        it('should return resource object that matches provided singular name', function() {
            this.resourceRegistry.getBySingularName('human').should.be.equal(this.res);
        });
    });


    describe('forEach', function() {
        beforeEach(function() {
            const res = new this.Resource({
                singular: 'human',
                plural: 'humans',
                properties: {}
            });

            this.res = res;
            this.resourceRegistry.add(res);
        });

        it('should iterate over all registered resources and provide the resource objects a parameter to the callback', function() {
            const spy = this.sinon.spy();

            this.resourceRegistry.forEach(spy);

            spy.should.be.calledOnce;
            spy.should.be.calledWith(this.res);
        });
    });
});

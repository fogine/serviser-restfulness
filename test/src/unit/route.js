const Promise    = require('bluebird');
const KnexRunner = require('knex/lib/runner');
const KnexBuilder = require('knex/lib/query/builder');
const ServiceSDK = require('../../service/sdk.js');

let service, app, sdk, runner, sinon, ensureConnection;

describe('Route-setup', function() {
    before(function() {
        const self = this;
        sinon = this.sinon;
        runner = this.sinon.stub(KnexRunner.prototype, 'query');
        ensureConnection = this.sinon.stub(KnexRunner.prototype, 'ensureConnection').resolves({});

        service = require('../../service/index.js')('pg', 0);
        return service.listen().then(function() {
            app = service.appManager.get('test');
            let port = app.server.address().port;

            sdk = new ServiceSDK({
                baseURL: `http://127.0.0.1:${port}`
            });

            describe('Route', tests);
        });
    });

    it.skip('dummy', function() {
    });

    function tests() {

        beforeEach(function() {
            runner.reset();
        });

        after(function() {
            runner.restore();
            ensureConnection.restore();
            return service.close();
        });

        describe('get', function() {

            [
                {
                    uid: 'getUsers_v1.0',
                },
                {
                    uid: 'getUser_v1.0',
                    path: {id:1}
                },
                {
                    uid: 'getUsersMovies_v1.0',
                    path: {id:1}
                },
                {
                    uid: 'getUsersMovie_v1.0',
                    path: {user_id:1, movie_id:2}
                },
                {
                    uid: 'getUsersReviews_v1.0',
                    path: {id:1}
                },
                {
                    uid: 'getUsersReview_v1.0',
                    path: {user_id:1, review_id:2}
                },
                {
                    uid: 'getMovies_v1.0',
                },
                {
                    uid: 'getMoviesReviews_v1.0',
                    path: {id:1}
                },
                {
                    uid: 'getMoviesCountry_v1.0',
                    path: {movie_id:1, country_id:2}
                },
                {
                    uid: 'getReviews_v1.0',
                },
                {
                    uid: 'getReview_v1.0',
                    path: {id:1}
                },
            ].forEach(function(endpoint) {
                const route = app.getRoute(endpoint.uid);

                describe(route.getUrl(), function() {

                    beforeEach(function() {
                        this.routeEmitAsyncSpy = sinon.spy(route, 'emitAsync');
                        this.rows = [{}];

                        runner.resolves(Promise.resolve(this.rows));
                        runner.withArgs(sinon.match(function(opt) {
                            return opt.sql.indexOf('select count(*) as "count"') === 0;
                        })).resolves([{count: 0}]);
                    });

                    afterEach(function() {
                        this.routeEmitAsyncSpy.restore();
                    });

                    it('should emit before-query event with req & knexQueryBuilder parameters', function() {
                        const routeEmitAsyncSpy = this.routeEmitAsyncSpy.withArgs('before-query');

                        return sdk[route.description.sdkMethodName]({
                            path: endpoint.path
                        }).then(function() {
                            routeEmitAsyncSpy.should.be.calledOnce;
                            routeEmitAsyncSpy.should.be.calledBefore(runner);
                            routeEmitAsyncSpy.should.be.calledWith(
                                'before-query',
                                sinon.match(matchReq),
                                sinon.match(matchKnexQueryBuilder)
                            );
                        })
                    });

                    it('should emit before-response event with req & data parameters', function() {
                        const routeEmitAsyncSpy = this.routeEmitAsyncSpy.withArgs('before-response');
                        const rows = this.rows;
                        const isRouteReduced = route.$restfulness.querySegments.last().isReduced();

                        return sdk[route.description.sdkMethodName]({
                            path: endpoint.path
                        }).then(function() {
                            const match = [
                                'before-response',
                                sinon.match(matchReq),//req object
                                sinon.match(function(value) {//data
                                    if (isRouteReduced) {
                                        return value === rows[0];
                                    }
                                    return value === rows;
                                })
                            ];

                            if (!isRouteReduced) {
                                match.push(sinon.match.same(0));//result count param
                                match.push(sinon.match.same(0));//limit param
                                match.push(sinon.match.same(0));//offset param
                            }
                            routeEmitAsyncSpy.should.be.calledOnce;
                            routeEmitAsyncSpy.should.be.calledAfter(runner);

                            routeEmitAsyncSpy.should.be.calledWith.apply(
                                routeEmitAsyncSpy.should.be,
                                match
                            );
                        })
                    });
                });
            })
        });

        describe('post', function() {
            [
                {
                    uid: 'postMovies_v1.0',
                    path: {},
                    data: {
                        name: 'name',
                        released_at: '2018-01-01',
                        description: 'desc',
                        country_id: 1
                    }
                },
                {
                    uid: 'postUsersMovies_v1.0',
                    path: {id: 1},
                    data: {
                        name: 'name',
                        released_at: '2018-01-01',
                        description: 'desc',
                        country_id: 1
                    }
                },
                {
                    uid: 'postUsersReviews_v1.0',
                    path: {id: 1},
                    data: {
                        stars: 10,
                        movie_id: 1,
                        comment: 'comment'
                    }
                },
                {
                    uid: 'postUsers_v1.0',
                    path: {},
                    data: {
                        username: 'happie',
                        email: 'email@email.com',
                        password: 'pwd'
                    }
                }
            ].forEach(function(endpoint) {
                const route = app.getRoute(endpoint.uid);

                describe(route.getUrl(), function() {

                    beforeEach(function() {
                        this.routeEmitAsyncSpy = sinon.spy(route, 'emitAsync');
                        this.rows = [{id: 1}];

                        runner.resolves(Promise.resolve(this.rows));
                    });

                    afterEach(function() {
                        this.routeEmitAsyncSpy.restore();
                    });

                    it('should emit before-query event with req & knexQueryBuilder parameters', function() {
                        const routeEmitAsyncSpy = this.routeEmitAsyncSpy.withArgs('before-query');

                        return sdk[route.description.sdkMethodName]({
                            path: endpoint.path,
                            data: endpoint.data
                        }).then(function() {
                            routeEmitAsyncSpy.should.be.calledOnce;
                            routeEmitAsyncSpy.should.be.calledBefore(runner);
                            routeEmitAsyncSpy.should.be.calledWith(
                                'before-query',
                                sinon.match(matchReq),
                                sinon.match(matchKnexQueryBuilder)
                            );
                        })
                    });

                    it('should emit before-response event with req', function() {
                        const routeEmitAsyncSpy = this.routeEmitAsyncSpy.withArgs('before-response');
                        const rows = this.rows;

                        return sdk[route.description.sdkMethodName]({
                            path: endpoint.path,
                            data: endpoint.data
                        }).then(function() {
                            const match = [
                                'before-response',
                            ];

                            routeEmitAsyncSpy.should.be.calledOnce;
                            routeEmitAsyncSpy.should.be.calledAfter(runner);

                            routeEmitAsyncSpy.should.be.calledWith(
                                'before-response',
                                sinon.match(matchReq),
                                sinon.match.same(rows)
                            );
                        })
                    });
                });
            })
        });

        describe('put', function() {
            [
                {
                    uid: 'putUser_v1.0',
                    path: {id: 1},
                    data: {username: 'happie'}
                },
                {
                    uid: 'putUsersMovie_v1.0',
                    path: {user_id: 1, movie_id: 1},
                    data: {name: 'name'}
                },
                {
                    uid: 'putUsersReview_v1.0',
                    path: {user_id: 1, review_id: 1},
                    data: {comment: 'comment'}
                }
            ].forEach(function(endpoint) {
                const route = app.getRoute(endpoint.uid);

                describe(route.getUrl(), function() {

                    beforeEach(function() {
                        this.routeEmitAsyncSpy = sinon.spy(route, 'emitAsync');
                        this.rows = [{id: 1}];

                        runner.resolves(Promise.resolve(this.rows));
                    });

                    afterEach(function() {
                        this.routeEmitAsyncSpy.restore();
                    });

                    it('should emit before-query event with req & knexQueryBuilder parameters', function() {
                        const routeEmitAsyncSpy = this.routeEmitAsyncSpy.withArgs('before-query');

                        return sdk[route.description.sdkMethodName]({
                            path: endpoint.path,
                            data: endpoint.data
                        }).then(function() {
                            routeEmitAsyncSpy.should.be.calledOnce;
                            routeEmitAsyncSpy.should.be.calledBefore(runner);
                            routeEmitAsyncSpy.should.be.calledWith(
                                'before-query',
                                sinon.match(matchReq),
                                sinon.match(matchKnexQueryBuilder)
                            );
                        })
                    });

                    it('should emit before-response event with req & data parameters', function() {
                        const routeEmitAsyncSpy = this.routeEmitAsyncSpy.withArgs('before-response');
                        const rows = this.rows;

                        return sdk[route.description.sdkMethodName]({
                            path: endpoint.path,
                            data: endpoint.data
                        }).then(function() {
                            const match = [
                                'before-response',
                            ];

                            routeEmitAsyncSpy.should.be.calledOnce;
                            routeEmitAsyncSpy.should.be.calledAfter(runner);

                            routeEmitAsyncSpy.should.be.calledWith(
                                'before-response',
                                sinon.match(matchReq),
                                sinon.match.same(rows[0])
                            );
                        })
                    });
                });
            });
        });

        describe('delete', function() {
            [
                {
                    uid: 'deleteUsers_v1.0',
                    path: {}
                },
                {
                    uid: 'deleteUser_v1.0',
                    path: {id: 1}
                },
                {
                    uid: 'deleteUsersMovie_v1.0',
                    path: {user_id: 1, movie_id: 2}
                },
                {
                    uid: 'deleteUsersMovies_v1.0',
                    path: {id: 1}
                },
                {
                    uid: 'deleteUsersReview_v1.0',
                    path: {user_id: 1, review_id: 2}
                },
                {
                    uid: 'deleteUsersReviews_v1.0',
                    path: {id: 1}
                }
            ].forEach(function(endpoint) {
                const route = app.getRoute(endpoint.uid);

                describe(route.getUrl(), function() {

                    beforeEach(function() {
                        this.routeEmitAsyncSpy = sinon.spy(route, 'emitAsync');
                        this.result = 1;

                        runner.resolves(Promise.resolve(this.result));
                    });

                    afterEach(function() {
                        this.routeEmitAsyncSpy.restore();
                    });

                    it('should emit before-query event with req & knexQueryBuilder parameters', function() {
                        const routeEmitAsyncSpy = this.routeEmitAsyncSpy.withArgs('before-query');

                        return sdk[route.description.sdkMethodName]({
                            path: endpoint.path
                        }).then(function() {
                            routeEmitAsyncSpy.should.be.calledOnce;
                            routeEmitAsyncSpy.should.be.calledBefore(runner);
                            routeEmitAsyncSpy.should.be.calledWith(
                                'before-query',
                                sinon.match(matchReq),
                                sinon.match(matchKnexQueryBuilder)
                            );
                        })
                    });

                    it('should emit before-response event with req & data parameters', function() {
                        const routeEmitAsyncSpy = this.routeEmitAsyncSpy.withArgs('before-response');
                        const result = this.result;

                        return sdk[route.description.sdkMethodName]({
                            path: endpoint.path
                        }).then(function() {
                            const match = [
                                'before-response',
                            ];

                            routeEmitAsyncSpy.should.be.calledOnce;
                            routeEmitAsyncSpy.should.be.calledAfter(runner);

                            routeEmitAsyncSpy.should.be.calledWith(
                                'before-response',
                                sinon.match(matchReq),
                                sinon.match.same(result)
                            );
                        })
                    });
                });
            })
        });
    }
});


function matchReq(value) {
    return value.constructor.name === 'IncomingMessage'
        && value.params
        && value.query
        && value.body;
}
function matchKnexQueryBuilder(value) {
    return value instanceof KnexBuilder;
}

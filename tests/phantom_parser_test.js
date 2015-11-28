var libFolder = process.env.JSCOV ? '../lib-cov/' : '../lib/';
var Parser = require(libFolder + 'Parser');
var Actions = require(libFolder + 'Actions');
var Paginator = require(libFolder + 'Paginator');
var Transformations = require(libFolder + 'Transformations');
var PhantomEnvironment = require(libFolder + 'PhantomEnvironment');
var Environment = require(libFolder + 'Environment');
var chai = require('chai');
var expect = chai.expect;
var path = require('path');

var env;
var uri = 'file://' + path.join(__dirname, '/phantom_parser.html');

before(function () {
    env = new PhantomEnvironment({
        url: uri,
        screen: {
            width: 1080,
            height: 200
        }
    });
});

describe('Parser', function () {
    describe('#parse', function () {
        it('parse simple node', function () {
            var parser = new Parser({
                environment: env
            });
            return parser.parse(
                {
                    rules: {
                        scope: 'div.scope-simple'
                    }
                }
            ).then(function (found) {
                    expect(found).equal('simple');
                });
        });

        it('parse attr of simple node', function () {
            var parser = new Parser({
                environment: env
            });
            return parser.parse(
                {
                    rules: {
                        scope: 'div.scope-simple',
                        attr: 'data-attr'
                    }
                }
            ).then(function (found) {
                    expect(found).equal('simple-attr');
                });
        });

        it('parse simple with unknown scope', function () {
            var parser = new Parser({
                environment: env
            });
            return parser.parse(
                {
                    rules: {
                        scope: 'div.scope-unknown'
                    }
                }
            ).then(function (found) {
                }, function (err) {
                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).equal('Error during querying selector: div.scope-unknown');
                });
        });

        it('parse simple node with parentScope', function () {
            var parser = new Parser({
                environment: env
            });
            return parser.parse(
                {
                    rules: {
                        scope: 'div.scope-simple',
                        parentScope: 'body'
                    }
                }
            ).then(function (found) {
                    expect(found).equal('simple');
                });
        });

        it('parse without scope', function () {
            var parser = new Parser({
                environment: env
            });
            parser.parse({
                rules: {}
            }).then(function (found) {
            }, function (err) {
                expect(err).to.be.instanceOf(Error);
                expect(err.message).equal('Scope cannot be blank');
            });
        });

        it('parse simple node with separator', function () {
            var parser = new Parser({
                environment: env
            });
            return parser.parse(
                {
                    rules: {
                        scope: 'div.scope-simple-multiple',
                        separator: ','
                    }
                }
            ).then(function (found) {
                    expect(found).equal('simple,simple');
                });
        });

        it('parse simple node and get result as array', function () {
            var parser = new Parser({
                environment: env
            });
            return parser.parse(
                {
                    rules: {
                        scope: 'div.scope-simple-multiple',
                        type: 'array'
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Array);
                    expect(found.length).equal(2);

                    found.forEach(function (row, i) {
                        expect(row, 'row' + i).equal('simple');
                    });
                });
        });

        it('parse collection node', function () {
            var parser = new Parser({
                environment: env
            });
            return parser.parse(
                {
                    rules: {
                        scope: 'div.scope-collection',
                        collection: [
                            {
                                name: 'column1',
                                scope: 'div.scope-collection-column1'
                            },
                            {
                                name: 'column2',
                                scope: 'div.scope-collection-column2'
                            }
                        ]
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Object);
                    expect(found.column1).equal('column1');
                    expect(found.column2).equal('column2');
                });
        });

        it('parse simple node with pre-actions', function () {
            var parser = new Parser({
                environment: env
            });
            return parser.parse(
                {
                    actions: [
                        {
                            type: 'wait',
                            scope: 'div.scope-simple-pre-actions'
                        },
                        {
                            type: 'click',
                            scope: 'div.scope-simple-pre-actions'
                        },
                        {
                            type: 'wait',
                            scope: 'div.scope-simple-pre-actions.clicked'
                        }
                    ],
                    rules: {
                        name: 'node',
                        scope: 'div.scope-simple-pre-actions.clicked'
                    }
                }
            ).then(function (found) {
                    expect(found).equal('simple1');
                });
        });

        it('parse single page', function () {
            var parser = new Parser({
                environment: env
            });
            return parser.parse(
                {
                    rules: {
                        scope: '.scrollable > .content > div.scope-pagination-passed',
                        collection: [[
                            {name: 'column1', scope: 'div.scope-pagination-passed-column1'},
                            {
                                name: 'sub-column',
                                scope: 'div:last-child',
                                collection: [
                                    {name: 'column2', scope: 'div.scope-pagination-passed-column2'},
                                    {name: 'column3', scope: 'div.scope-pagination-passed-column3'},
                                    {name: 'column4', scope: 'div.scope-pagination-passed-column4'}
                                ]
                            }
                        ]]
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Array);
                    expect(found.length).equal(1);

                    var item = found[0];
                    expect(item.column1).equal('column1');
                    for (var i = 2; i <= 4; i++) {
                        var val = 'column' + i;
                        expect(item['sub-column'][val]).equal(val);
                    }
                });
        });

        it('parse single page with multiple rows', function () {
            var parser = new Parser({
                environment: env
            });
            return parser.parse(
                {
                    rules: {
                        scope: '.scope-multiple-pagination > div.scope-pagination-passed',
                        collection: [[
                            {name: 'column1', scope: 'div.scope-pagination-passed-column1'},
                            {
                                name: 'sub-column',
                                scope: 'div:last-child',
                                collection: [
                                    {name: 'column2', scope: 'div.scope-pagination-passed-column2'},
                                    {name: 'column3', scope: 'div.scope-pagination-passed-column3'},
                                    {name: 'column4', scope: 'div.scope-pagination-passed-column4'}
                                ]
                            }
                        ]]
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Array);
                    expect(found.length).equal(2);
                    found.forEach(function (item) {
                        expect(item.column1).equal('column1');
                        for (var i = 2; i <= 4; i++) {
                            var val = 'column' + i;
                            expect(item['sub-column'][val]).equal(val);
                        }
                    });
                });
        });

        it('parse single page with id=true', function () {
            var parser = new Parser({
                environment: env
            });
            return parser.parse(
                {
                    rules: {
                        scope: '.scrollable > .content > div.scope-pagination-passed',
                        collection: [[
                            {id: true, scope: 'div.scope-pagination-passed-column1', attr: 'data-ref'},
                            {name: 'column1', scope: 'div.scope-pagination-passed-column1'},
                            {
                                name: 'sub-column',
                                scope: 'div:last-child',
                                collection: [
                                    {name: 'column2', scope: 'div.scope-pagination-passed-column2'},
                                    {name: 'column3', scope: 'div.scope-pagination-passed-column3'},
                                    {name: 'column4', scope: 'div.scope-pagination-passed-column4'}
                                ]
                            }
                        ]]
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Array);
                    expect(found.length).equal(1);

                    var item = found[0];
                    expect(item._id).equal('ref1');
                    expect(item.column1).equal('column1');
                    for (var i = 2; i <= 4; i++) {
                        var val = 'column' + i;
                        expect(item['sub-column'][val]).equal(val);
                    }
                });
        });

        it('parse single page with id=function', function () {
            var id = 0;
            var idGenerator = function (rule, result) {
                return result + ++id;
            };
            var parser = new Parser({
                environment: env
            });
            return parser.parse(
                {
                    rules: {
                        scope: '.scrollable > .content > div.scope-pagination-passed',
                        collection: [[
                            {id: idGenerator, scope: 'div.scope-pagination-passed-column1', attr: 'data-ref'},
                            {name: 'column1', scope: 'div.scope-pagination-passed-column1'},
                            {
                                name: 'sub-column',
                                scope: 'div:last-child',
                                collection: [
                                    {name: 'column2', scope: 'div.scope-pagination-passed-column2'},
                                    {name: 'column3', scope: 'div.scope-pagination-passed-column3'},
                                    {name: 'column4', scope: 'div.scope-pagination-passed-column4'}
                                ]
                            }
                        ]]
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Array);
                    expect(found.length).equal(1);

                    var item = found[0];
                    expect(item._id).equal('ref11');
                    expect(item.column1).equal('column1');
                    for (var i = 2; i <= 4; i++) {
                        var val = 'column' + i;
                        expect(item['sub-column'][val]).equal(val);
                    }
                });
        });

        it('parse page with scroll pagination', function () {
            var parser = new Parser({
                environment: env,
                pagination: {
                    type: 'scroll',
                    interval: 500
                }
            });
            return parser.parse(
                {
                    rules: {
                        scope: '.scrollable > .content > div.scope-pagination-passed',
                        collection: [[
                            {name: 'column1', scope: 'div.scope-pagination-passed-column1'},
                            {
                                name: 'sub-column',
                                scope: 'div:last-child',
                                collection: [
                                    {name: 'column2', scope: 'div.scope-pagination-passed-column2'},
                                    {name: 'column3', scope: 'div.scope-pagination-passed-column3'},
                                    {name: 'column4', scope: 'div.scope-pagination-passed-column4'}
                                ]
                            }
                        ]]
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Array);
                    expect(found.length).equal(11);

                    found.forEach(function (item, i) {
                        expect(item.column1, 'row' + i).equal('column1');
                        for (var i = 2; i <= 4; i++) {
                            var val = 'column' + i;
                            expect(item['sub-column'][val], 'row' + i).equal(val);
                        }
                    }, this);
                });
        });

        it('parse page with page pagination', function () {
            var parser = new Parser({
                environment: env,
                pagination: {
                    type: 'page',
                    scope: '.pageable .pagination div',
                    pageScope: '.pageable .content .scope-pagination-passed'
                }
            });
            return parser.parse(
                {
                    rules: {
                        scope: '.pageable > .content > div.scope-pagination-passed',
                        collection: [[
                            {name: 'column1', scope: 'div.scope-pagination-passed-column1'},
                            {
                                name: 'sub-column',
                                scope: 'div:last-child',
                                collection: [
                                    {name: 'column2', scope: 'div.scope-pagination-passed-column2'},
                                    {name: 'column3', scope: 'div.scope-pagination-passed-column3'},
                                    {name: 'column4', scope: 'div.scope-pagination-passed-column4'}
                                ]
                            }
                        ]]
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Array);
                    expect(found.length).equal(10);

                    found.forEach(function (item, i) {
                        expect(item.column1, 'row' + i).equal('column1' + (i + 1));
                        for (var i = 2; i <= 4; i++) {
                            var val = 'column' + i;
                            expect(item['sub-column'][val], 'row' + i).equal(val);
                        }
                    }, this);
                });
        });

        it('parse page with custom pagination', function () {
            var parser = new Parser({
                environment: env,
                pagination: {
                    type: 'custom-pagination',
                    scope: '.pageable .pagination div',
                    pageScope: '.pageable .content .scope-pagination-passed'
                }
            });

            var previousPageHtml;
            parser.addPagination('custom-pagination', function (options) {
                var selector = options.scope + ':eq(' + this._currentPage + ')';
                return this._env
                    .evaluateJs(options.pageScope, this._getPaginatePageHtml)
                    .then(function (html) {
                        previousPageHtml = html;
                    })
                    .then(function () {
                        return this._actions.click(selector);
                    }, this);
            }, function (options, timeout) {
                return this._actions.wait(this._getPaginatePageHtml, function (html) {
                    return html !== null && html !== previousPageHtml;
                }, [options.pageScope], timeout)
            });

            return parser.parse(
                {
                    rules: {
                        scope: '.pageable > .content > div.scope-pagination-passed',
                        collection: [[
                            {name: 'column1', scope: 'div.scope-pagination-passed-column1'},
                            {
                                name: 'sub-column',
                                scope: 'div:last-child',
                                collection: [
                                    {name: 'column2', scope: 'div.scope-pagination-passed-column2'},
                                    {name: 'column3', scope: 'div.scope-pagination-passed-column3'},
                                    {name: 'column4', scope: 'div.scope-pagination-passed-column4'}
                                ]
                            }
                        ]]
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Array);
                    expect(found.length).equal(10);

                    found.forEach(function (item, i) {
                        expect(item.column1, 'row' + i).equal('column1' + (i + 1));
                        for (var i = 2; i <= 4; i++) {
                            var val = 'column' + i;
                            expect(item['sub-column'][val], 'row' + i).equal(val);
                        }
                    }, this);
                });
        });

        it('parse page with missed params for custom pagination', function () {
            var parser = new Parser({
                environment: env,
                pagination: {
                    type: 'custom-pagination',
                    scope: '.pageable .pagination div',
                    pageScope: '.pageable .content .scope-pagination-passed'
                }
            });

            var fn = parser.addPagination.bind(parser, 'custom-pagination');
            expect(fn).to.throw(Error, /paginateFn and checkPaginateFn should be functions which return Promise/);
        });

        it('parse page with page pagination and maxPagesCount', function () {
            var parser = new Parser({
                environment: env,
                pagination: {
                    type: 'page',
                    scope: '.pageable .pagination div',
                    pageScope: '.pageable .content .scope-pagination-passed',
                    maxPagesCount: 3
                }
            });
            return parser.parse(
                {
                    rules: {
                        scope: '.pageable > .content > div.scope-pagination-passed',
                        collection: [[
                            {name: 'column1', scope: 'div.scope-pagination-passed-column1'},
                            {
                                name: 'sub-column',
                                scope: 'div:last-child',
                                collection: [
                                    {name: 'column2', scope: 'div.scope-pagination-passed-column2'},
                                    {name: 'column3', scope: 'div.scope-pagination-passed-column3'},
                                    {name: 'column4', scope: 'div.scope-pagination-passed-column4'}
                                ]
                            }
                        ]]
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Array);
                    expect(found.length).equal(3);

                    found.forEach(function (item, i) {
                        expect(item.column1, 'row' + i).equal('column1' + (i + 1));
                        for (var i = 2; i <= 4; i++) {
                            var val = 'column' + i;
                            expect(item['sub-column'][val], 'row' + i).equal(val);
                        }
                    }, this);
                });
        });

        it('parse page with page pagination and maxResultsCount', function () {
            var parser = new Parser({
                environment: env,
                pagination: {
                    type: 'page',
                    scope: '.pageable .pagination div',
                    pageScope: '.pageable .content .scope-pagination-passed',
                    maxResultsCount: 3
                }
            });
            return parser.parse(
                {
                    rules: {
                        scope: '.pageable > .content > div.scope-pagination-passed',
                        collection: [[
                            {name: 'column1', scope: 'div.scope-pagination-passed-column1'},
                            {
                                name: 'sub-column',
                                scope: 'div:last-child',
                                collection: [
                                    {name: 'column2', scope: 'div.scope-pagination-passed-column2'},
                                    {name: 'column3', scope: 'div.scope-pagination-passed-column3'},
                                    {name: 'column4', scope: 'div.scope-pagination-passed-column4'}
                                ]
                            }
                        ]]
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Array);
                    expect(found.length).equal(3);

                    found.forEach(function (item, i) {
                        expect(item.column1, 'row' + i).equal('column1' + (i + 1));
                        for (var i = 2; i <= 4; i++) {
                            var val = 'column' + i;
                            expect(item['sub-column'][val], 'row' + i).equal(val);
                        }
                    }, this);
                });
        });

        it('parse page with wrong type of pagination', function () {
            var parser = new Parser({
                environment: env,
                pagination: {
                    type: 'unknownType',
                    scope: '.pageable .pagination div',
                    pageScope: '.pageable .content .scope-pagination-passed',
                }
            });
            return parser.parse(
                {
                    rules: {
                        scope: '.pageable > .content > div.scope-pagination-passed',
                        collection: [[
                            {name: 'column1', scope: 'div.scope-pagination-passed-column1'},
                            {
                                name: 'sub-column',
                                scope: 'div:last-child',
                                collection: [
                                    {name: 'column2', scope: 'div.scope-pagination-passed-column2'},
                                    {name: 'column3', scope: 'div.scope-pagination-passed-column3'},
                                    {name: 'column4', scope: 'div.scope-pagination-passed-column4'}
                                ]
                            }
                        ]]
                    }
                }
            ).then(function () {
                }, function (err) {
                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).equal('Unknown pagination type: unknownType');
                });
        });

        it('parse page with page href pagination', function () {
            var parser = new Parser({
                environment: env,
                pagination: {
                    type: 'page',
                    scope: '.pageable-simple .pagination div',
                    pageScope: '.pageable-simple .content .scope-pagination-passed'
                }
            });
            return parser.parse(
                {
                    rules: {
                        scope: '.pageable-simple > .content > div.scope-pagination-passed',
                        collection: [[
                            {name: 'column1', scope: 'div.scope-pagination-passed-column1'},
                            {
                                name: 'sub-column',
                                scope: 'div:last-child',
                                collection: [
                                    {name: 'column2', scope: 'div.scope-pagination-passed-column2'},
                                    {name: 'column3', scope: 'div.scope-pagination-passed-column3'},
                                    {name: 'column4', scope: 'div.scope-pagination-passed-column4'}
                                ]
                            }
                        ]]
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Array);
                    expect(found.length).equal(10);

                    found.forEach(function (item, i) {
                        expect(item.column1, 'row' + i).equal('column1' + (i + 1));
                        for (var i = 2; i <= 4; i++) {
                            var val = 'column' + i;
                            expect(item['sub-column'][val], 'row' + i).equal(val);
                        }
                    }, this);
                });
        });

        it('parse page with page href pagination with predefined strategy', function () {
            var parser = new Parser({
                environment: env,
                pagination: {
                    type: 'page',
                    scope: '.pageable-simple .pagination div',
                    pageScope: '.pageable-simple .content .scope-pagination-passed',
                    strategy: 'newPage'
                }
            });
            return parser.parse(
                {
                    rules: {
                        scope: '.pageable-simple > .content > div.scope-pagination-passed',
                        collection: [[
                            {name: 'column1', scope: 'div.scope-pagination-passed-column1'},
                            {
                                name: 'sub-column',
                                scope: 'div:last-child',
                                collection: [
                                    {name: 'column2', scope: 'div.scope-pagination-passed-column2'},
                                    {name: 'column3', scope: 'div.scope-pagination-passed-column3'},
                                    {name: 'column4', scope: 'div.scope-pagination-passed-column4'}
                                ]
                            }
                        ]]
                    }
                }
            ).then(function (found) {
                    expect(found).to.be.instanceOf(Array);
                    expect(found.length).equal(10);

                    found.forEach(function (item, i) {
                        expect(item.column1, 'row' + i).equal('column1' + (i + 1));
                        for (var i = 2; i <= 4; i++) {
                            var val = 'column' + i;
                            expect(item['sub-column'][val], 'row' + i).equal(val);
                        }
                    }, this);
                });
        });
    });

    it('addAction', function () {
        var parser = new Parser({
            environment: env
        });
        parser.addAction('custom-wait', function (options) {
            return this.waitElement(options.scope, options.timeout || 2000);
        });
        return parser.parse(
            {
                actions: [{
                    type: 'custom-wait',
                    scope: 'div.scope-simple'
                }],
                rules: {
                    scope: 'div.scope-simple'
                }
            }
        ).then(function (found) {
                expect(found).equal('simple');
            });
    });

    it('addTransformation', function () {
        var parser = new Parser({
            environment: env
        });
        parser.addTransformation('custom-transform', function (options, result) {
            return result + options.increment;
        });
        return parser.parse(
            {
                rules: {
                    scope: 'div.scope-simple',
                    transform: [
                        {
                            type: 'custom-transform',
                            increment: 1
                        }
                    ]
                }
            }
        ).then(function (found) {
                expect(found).equal('simple1');
            });
    });
});

describe('Actions', function () {
    describe('#performForRule', function () {
        it('perform click and wait actions', function () {
            return env
                .prepare()
                .then(function () {
                    var actions = new Actions({
                        environment: env
                    });
                    return actions.performForRule({
                            actions: [
                                {
                                    type: 'wait',
                                    scope: 'div.scope-simple-actions'
                                },
                                {
                                    type: 'click',
                                    scope: 'div.scope-simple-actions'
                                },
                                {
                                    type: 'wait',
                                    scope: 'div.scope-simple-actions.clicked'
                                }
                            ]
                        },
                        'body'
                    );
                });
        });

        it('perform type, click+waitForPage, conditionalActions, exist  actions', function () {
            return env
                .prepare()
                .then(function () {
                    var actions = new Actions({
                        environment: env
                    });
                    return actions.performForRule({
                            actions: [
                                {
                                    scope: '.form .value',
                                    type: 'type',
                                    text: 'submitted'
                                },
                                {
                                    scope: '.form input[type=submit]',
                                    type: 'click',
                                    waitForPage: true
                                },
                                {
                                    type: 'conditionalActions',
                                    conditions: [
                                        {
                                            type: 'exist',
                                            scope: '.submitted-value'
                                        }
                                    ],
                                    actions: [
                                        {
                                            type: 'wait',
                                            scope: '.submitted-value.done'
                                        }
                                    ]
                                }
                            ]
                        },
                        'body'
                    );
                });
        });

        it('perform custom action', function () {
            return env
                .prepare()
                .then(function () {
                    var actions = new Actions({
                        environment: env
                    });

                    actions.addAction('custom-click', function (options) {
                        return this._env.evaluateJs(options.scope, /* @covignore */ function (selector) {
                            var nodes = Sizzle(selector);
                            for (var i = 0, l = nodes.length; i < l; i++) {
                                nodes[i].click();
                            }

                            return nodes.length;
                        })
                    });
                    return actions.performForRule({
                            actions: [
                                {
                                    type: 'wait',
                                    scope: 'div.scope-simple-custom-actions'
                                },
                                {
                                    type: 'custom-click',
                                    scope: 'div.scope-simple-custom-actions'
                                },
                                {
                                    type: 'wait',
                                    scope: 'div.scope-simple-custom-actions.clicked'
                                }
                            ]
                        },
                        'body'
                    );
                });
        });

        it('perform action once', function () {
            return env
                .prepare()
                .then(function () {
                    var actions = new Actions({
                        environment: env
                    });

                    actions.performForRule({
                            actions: [
                                {
                                    type: 'wait',
                                    scope: 'div.scope-simple-actions',
                                    once: true,
                                    __done: true
                                }
                            ]
                        },
                        'body'
                    );
                });
        });

        it('perform performActions with missed params', function () {
            return env
                .prepare()
                .then(function () {
                    var actions = new Actions({
                        environment: env
                    });
                    var fn = actions.performActions.bind(actions);
                    expect(fn).to.throw(Error, /actions must be an Array/);
                });
        });

        it('perform addAction with missed params', function () {
            return env
                .prepare()
                .then(function () {
                    var actions = new Actions({
                        environment: env
                    });
                    var fn = actions.addAction.bind(actions);
                    expect(fn).to.throw(Error, /addAction accept type as string and action if function which must return a promise/);
                });
        });

        it('perform performActions with missed params', function () {
            return env
                .prepare()
                .then(function () {
                    var actions = new Actions({
                        environment: env
                    });
                    actions.performActions([
                        {type: 'unknownAction'}
                    ], 'body').done(
                        function () {
                        }, function (err) {
                            expect(err).to.be.instanceOf(Error);
                            expect(err.message).equal('Unknown action type: unknownAction');
                        }
                    );
                });
        });

        it('perform conditionalActions with false condition', function () {
            return env
                .prepare()
                .then(function () {
                    var actions = new Actions({
                        environment: env
                    });
                    return actions.performForRule({
                            actions: [
                                {
                                    type: 'conditionalActions',
                                    conditions: [
                                        {
                                            type: 'exist',
                                            scope: '.unknown-element'
                                        }
                                    ],
                                    actions: []
                                }
                            ]
                        },
                        'body'
                    ).then(function (res) {
                            expect(res).to.be.undefined;
                        });
                });
        });
    });
});

describe('Transformations', function () {
    var transformations = new Transformations();
    describe('#produce', function () {
        it('perform date transform', function () {
            var transformedValue = transformations.produce([
                    {
                        type: 'date',
                        locale: 'en',
                        from: 'HH:mm D MMM YYYY',
                        to: 'YYYY-MM-DD'
                    }
                ],
                '21:10 30 Aug 2016'
            );
            expect(transformedValue).equal('2016-08-30');
        });

        it('perform replace transform', function () {
            var transformedValue = transformations.produce([
                    {
                        type: 'replace',
                        re: ['\\s', 'g'],
                        to: ''
                    }
                ],
                ' t e  s  t'
            );
            expect(transformedValue).equal('test');
        });

        it('perform custom transform', function () {
            transformations.addTransformation('custom-transform', function (options, result) {
                return result + options.increment;
            });
            var transformedValue = transformations.produce([
                    {
                        type: 'custom-transform',
                        increment: 3
                    }
                ],
                'value'
            );
            expect(transformedValue).equal('value3');
        });

        it('perform unsupported transformation type', function () {
            var fn = transformations.produce.bind(transformations, [{
                    type: 'unknownType'
                }],
                ' t e  s  t'
            );
            expect(fn).to.throw(Error, /Unsupported transformation type: unknownType/);
        });
    });

    it('perform addTransformation with wrong data', function () {
        var fn = transformations.addTransformation;
        expect(fn).to.throw(Error, /addTransformation accept type as string and transformation as function which must return a transformed value/);
    });
});

describe('Environment', function () {
    var environment = new Environment();

    it('perform evaluateJs', function () {
        var fn = environment.evaluateJs.bind(environment, function () {
        });
        expect(fn).to.throw(Error, /You must redefine evaluateJs method in child environment/);
    });

    it('perform waitForPage', function () {
        var fn = environment.waitForPage.bind(environment);
        expect(fn).to.throw(Error, /You must redefine waitForPage method in child environment/);
    });

    it('perform prepare, snapshot, tearDown', function () {
        environment
            .prepare()
            .then(environment.snapshot)
            .then(environment.tearDown)
            .then(function () {
                expect(true).equal(true);
            }, function () {
                expect(true).equal(false);
            })
    });
});
/**
 * Q Promise implementation
 * @module Q
 */
(function (Q) {

    /**
     * Q.Promise constructor.
     * Call the .fulfill(...) or .reject(...) method to
     * signal that the promise is fulfilled or rejected.
     * Implemented according to http://promises-aplus.github.io/promises-spec/
     * with one exception:
     * 2.2.5) fulfill and reject can in fact accept "this", and pass it on
     * @class Q.Promise
     * @constructor
     */
    var P = function () {
        this.state = P.states.PENDING;
        this._done = [];
        this._fail = [];
        this._progress = [];
        this._args = null;
        this._context = null;

        var p = this;
        p.fulfill = function () {
            if (p._args) {
                return p;
            }
            p._args = Array.prototype.slice.call(arguments, 0);
            p._context = this;
            setTimeout(function () {
                p.state = P.states.FULFILLED;
                for (var i=0, l=p._done.length; i<l; ++i) {
                    var r = p._done[i];
                    x = r.handler.apply(p._context, p._args);
                    _Q_Promise_resolve(r.promise, x);
                }
                p._done = null;
            }, 0);
            return p;
        };

        p.reject = function () {
            if (p._args) {
                return p;
            }
            p._args = Array.prototype.slice.call(arguments, 0);
            p._context = this;
            setTimeout(function () {
                p.state = P.states.REJECTED;
                for (var i=0, l=p._fail.length; i<l; ++i) {
                    var r = p._fail[i];
                    x = r.handler.apply(p._context, p._args);
                    if (x !== undefined) {
                        _Q_Promise_resolve(r.promise, x);
                    }
                }
                p._fail = null;
            }, 0);
            return p;
        };

        p.notify = function () {
            if (p.state !== P.states.PENDING) {
                return p;
            }
            var context = this;
            var args = Array.prototype.slice.call(arguments, 0);
            setTimeout(function () {
                for (var i=0, l=p._progress.length; i<l; ++i) {
                    p._progress[i].handler.apply(context, args);
                }
            }, 0);
            return p;
        };
    };

    /**
     * @method resolve
     * @param {Q.Promise} x
     * @returns {Q.Promise}
     */

    P.resolve = function (x) {
        var result = new Q.Promise();
        _Q_Promise_resolve(result, x);
        return result;
    };
    /**
     * @method when
     * @param {Mixed} valueOrPromise
     * @param {Function} doneHandler
     * @param {Function} failHandler
     * @param {Function} progressHandler
     * @returns {Q.Promise}
     */
    P.when = function (valueOrPromise, doneHandler, failHandler, progressHandler) {
        var result = new Q.Promise();
        result.then(doneHandler, failHandler, progressHandler);
        _Q_Promise_resolve(result, valueOrPromise);
        return result;
    };
    /**
     * @method all
     * @param {Array} promises , array of Q.Promise objects
     * @returns {Q.Promise}
     */
    P.all = function (promises) {
        var result = new Q.Promise();
        var i, l, p, c, canceled = false;
        for (i=0, c=l=promises.length; i<l; ++i) {
            p = new Q.Promise();
            _Q_Promise_resolve(p, promises[i]);
            p.done(function () {
                if (!canceled && --c === 0) {
                    // we can do this because promises only get fulfilled once
                    result.fulfill.apply(this, arguments);
                }
            });
            p.fail(function () {
                canceled = true;
            });
        }
        return result;
    };

    /**
     * @method first
     * @param {Q.Promise} promises
     * @returns {Q.Promise}
     */
    P.first = function (promises) {
        var result = new Q.Promise();
        var i, l;
        for (i=0, l=promises.length; i<l; ++i) {
            _Q_Promise_resolve(result, promises[i]);
            if (result.isFulfilled()) {
                break;
            }
        }
        return result;
    };

    /**
     * @method then
     * @param {Function} doneHandler
     * @param {Function} failHandler
     * @param {Function} progressHandler
     * @returns {Q.Promise}
     */

    P.prototype.then = function (doneHandler, failHandler, progressHandler) {
        var result = new Q.Promise();
        var x;
        try {
            switch (this.state) {
                case P.states.FULFILLED:
                    if (typeof doneHandler === 'function')  { // 2.2.1.1
                        x = doneHandler.apply(this._context, this._args); // 2.2.2.1
                    }
                    _Q_Promise_resolve(result, x);
                    break;
                case P.states.REJECTED:
                    if (typeof failHandler === 'function') { // 2.2.1.2
                        x = failHandler.apply(this._context, this._args); // 2.2.3.1
                    }
                    if (x !== undefined) {
                        _Q_Promise_resolve(result, x);
                    } else {
                        result.reject.apply(this._context, this._args); // 2.2.7.4
                    }
                    break;
                default:
                    if (typeof doneHandler === 'function') { // 2.2.1.1
                        this._done.push({
                            handler: doneHandler,
                            promise: result
                        }); // 2.2.6.1
                    }
                    if (typeof failHandler === 'function') { // 2.2.1.2
                        this._fail.push({
                            handler: failHandler,
                            promise: result
                        }); // 2.2.6.2
                    }
                    if (typeof progressHandler === 'function') {
                        this._progress.push({ handler: progressHandler });
                    }
                    if (typeof doneHandler !== 'function' && doneHandler !== null) {
                        this._done.push({ handler: result.fulfill }); // 2.2.7.3
                    }
                    if (typeof failHandler !== 'function' && failHandler !== null) {
                        this._fail.push({ handler: result.reject }); // 2.2.7.4
                    }
                    break;
            }
        } catch (e) {
            result.reject(e); // 2.2.7.2
        }
        return result;
    };

    function _Q_Promise_resolve(promise, x) {
        if (!promise) {
            return;
        }
        if (promise === x) {
            throw new TypeError("Q.Promise resolving to itself"); // recursion;
        }
        if (x && (x instanceof Q.Promise)) {
            x.done(promise.fulfill); // 2.3.2.2
            x.fail(promise.reject); // 2.3.2.3
        } else {
            try {
                var t = x && x.then; // 2.3.3.1
            } catch (e) {
                return promise.reject.call(null, e); // 2.3.3.2
            }
            if (typeof t === 'function') { // 2.3.3.3
                // NOTE: the following does not support the spec completely
                // in that fulfilling and rejecting promises
                // does not handle a special case where a Q.Promise
                // or other thenable is passed to the first argument of t
                t.call(x, function (value) {
                    _Q_Promise_resolve(promise, value);
                }, function (reason) {
                    promise.reject.call(null, reason);
                });
            } else {
                promise.fulfill.call(null, x); // 2.3.3.4
            }
        }
    }

    /**
     * @method done
     * @param {Function} doneHandler
     * @returns {Q.Promise}
     */

    P.prototype.done = function (doneHandler) {
        return this.then(doneHandler, null, null);
    };
    /**
     * @method fail
     * @param {Function} failHandler
     * @returns {Q.Promise}
     */
    P.prototype.fail = function (failHandler) {
        return this.then(null, failHandler, null);
    };
    /**
     * @method progress
     * @param {Function} progressHandler
     * @returns {Q.Promise}
     */
    P.prototype.progress = function (progressHandler) {
        return this.then(null, null, progressHandler);
    };
    /**
     * @method always
     * @param {Function} handler
     * @returns {Q.Promise}
     */

    P.prototype.always = function (handler) {
        return this.then(handler, handler, null);
    };
    /**
     * @method isPending
     * @returns {boolean}
     */
    P.prototype.isPending = function () {
        return this.state === P.states.PENDING;
    };
    /**
     * @method isFulfilled
     * @returns {boolean}
     */
    P.prototype.isFulfilled = function () {
        return this.state === P.states.FULFILLED;
    };
    /**
     * @method isRejected
     * @returns {boolean}
     */
    P.prototype.isRejected = function () {
        return this.state === P.states.REJECTED;
    };
    /**
     * @property states
     * @type {Object}
     * @default <code> {PENDING: 1, FULFILLED: 2, REJECTED: 3} </code>
     */
    P.states = {
        PENDING: 1,
        FULFILLED: 2,
        REJECTED: 3
    };

    Q.Promise = P;

})(Q);
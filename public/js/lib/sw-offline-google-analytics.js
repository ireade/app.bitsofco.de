(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

const idb = require('idb');

/**
 * A wrapper to store for an IDB connection to a particular ObjectStore.
 *
 * @private
 * @class
 */
function IDBHelper(name, version, storeName) {
  if (name == undefined || version == undefined || storeName == undefined) {
    throw Error('name, version, storeName must be passed to the constructor.');
  }

  this._name = name;
  this._version = version;
  this._storeName = storeName;
}

/**
 * Returns a promise that resolves with an open connection to IndexedDB, either
 * existing or newly opened.
 *
 * @private
 * @returns {Promise.<DB>}
 */
IDBHelper.prototype._getDb = function() {
  if (this._db) {
    return Promise.resolve(this._db);
  }

  return idb.open(this._name, this._version, upgradeDB => {
    upgradeDB.createObjectStore(this._storeName);
  }).then(db => {
    this._db = db;
    return db;
  });
};

/**
 * Wrapper on top of the idb wrapper, which simplifies saving the key/value
 * pair to the object store.
 * Returns a Promise that fulfills when the transaction completes.
 *
 * @private
 * @param {String} key
 * @param {Object} value
 * @returns {Promise.<T>}
 */
IDBHelper.prototype.put = function(key, value) {
  return this._getDb().then(db => {
    const tx = db.transaction(this._storeName, 'readwrite');
    const objectStore = tx.objectStore(this._storeName);
    objectStore.put(value, key);
    return tx.complete;
  });
};

/**
 * Wrapper on top of the idb wrapper, which simplifies deleting an entry
 * from the object store.
 * Returns a Promise that fulfills when the transaction completes.
 *
 * @private
 * @param {String} key
 * @returns {Promise.<T>}
 */
IDBHelper.prototype.delete = function(key) {
  return this._getDb().then(db => {
    const tx = db.transaction(this._storeName, 'readwrite');
    const objectStore = tx.objectStore(this._storeName);
    objectStore.delete(key);
    return tx.complete;
  });
};

/**
 * Wrapper on top of the idb wrapper, which simplifies getting a key's value
 * from the object store.
 * Returns a promise that fulfills with the value.
 *
 * @private
 * @param {String} key
 * @returns {Promise.<Object>}
 */
IDBHelper.prototype.get = function(key) {
  return this._getDb().then(db => {
    return db.transaction(this._storeName)
      .objectStore(this._storeName)
      .get(key);
  });
};

/**
 * Wrapper on top of the idb wrapper, which simplifies getting all the values
 * in an object store.
 * Returns a promise that fulfills with all the values.
 *
 * @private
 * @returns {Promise.<Array.<Object>>}
 */
IDBHelper.prototype.getAllValues = function() {
  return this._getDb().then(db => {
    return db.transaction(this._storeName)
      .objectStore(this._storeName)
      .getAll();
  });
};

/**
 * Wrapper on top of the idb wrapper, which simplifies getting all the keys
 * in an object store.
 * Returns a promise that fulfills with all the keys.
 *
 * @private
 * @param {String} storeName
 * @returns {Promise.<Array.<Object>>}
 */
IDBHelper.prototype.getAllKeys = function() {
  return this._getDb().then(db => {
    return db.transaction(this._storeName)
      .objectStore(this._storeName)
      .getAllKeys();
  });
};

module.exports = IDBHelper;

},{"idb":4}],2:[function(require,module,exports){
/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

module.exports = () => {
  // Evaluate goog.DEBUG at runtime rather than once at export time to allow
  // developers to enable logging "on-the-fly" by setting `goog.DEBUG = true`
  // in the JavaScript console.
  return (self && self.goog && self.goog.DEBUG) ?
    console.debug.bind(console) :
    function() {};
};

},{}],3:[function(require,module,exports){
/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

const namespace = 'goog';

module.exports = (name, func) => {
  self[namespace] = self[namespace] || {};
  self[namespace][name] = func;
};

},{}],4:[function(require,module,exports){
'use strict';

(function() {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function(resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }
  
  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function(value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function(prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function() {
          return this[targetProp][prop];
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, '_index', [
    'name',
    'keyPath',
    'multiEntry',
    'unique'
  ]);

  proxyRequestMethods(Index, '_index', IDBIndex, [
    'get',
    'getKey',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(Index, '_index', IDBIndex, [
    'openCursor',
    'openKeyCursor'
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, '_cursor', [
    'direction',
    'key',
    'primaryKey',
    'value'
  ]);

  proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
    'update',
    'delete'
  ]);

  // proxy 'next' methods
  ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function() {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function() {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function(value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function() {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function() {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, '_store', [
    'name',
    'keyPath',
    'indexNames',
    'autoIncrement'
  ]);

  proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'put',
    'add',
    'delete',
    'clear',
    'get',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'openCursor',
    'openKeyCursor'
  ]);

  proxyMethods(ObjectStore, '_store', IDBObjectStore, [
    'deleteIndex'
  ]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function(resolve, reject) {
      idbTransaction.oncomplete = function() {
        resolve();
      };
      idbTransaction.onerror = function() {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function() {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, '_tx', [
    'objectStoreNames',
    'mode'
  ]);

  proxyMethods(Transaction, '_tx', IDBTransaction, [
    'abort'
  ]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function() {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(UpgradeDB, '_db', IDBDatabase, [
    'deleteObjectStore',
    'close'
  ]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function() {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(DB, '_db', IDBDatabase, [
    'close'
  ]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
    [ObjectStore, Index].forEach(function(Constructor) {
      Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var request = (this._store || this._index)[funcName].apply(this._store, args.slice(0, -1));
        request.onsuccess = function() {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function(Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function(query, count) {
      var instance = this;
      var items = [];

      return new Promise(function(resolve) {
        instance.iterateCursor(query, function(cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      request.onupgradeneeded = function(event) {
        if (upgradeCallback) {
          upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
        }
      };

      return p.then(function(db) {
        return new DB(db);
      });
    },
    delete: function(name) {
      return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = exp;
  }
  else {
    self.idb = exp;
  }
}());
},{}],5:[function(require,module,exports){
/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

module.exports = {
  CACHE_NAME: 'offline-google-analytics',
  IDB: {
    NAME: 'offline-google-analytics',
    STORE: 'urls',
    VERSION: 1
  },
  MAX_ANALYTICS_BATCH_SIZE: 20,
  STOP_RETRYING_AFTER: 86400000, // One day, in milliseconds.
  URL: {
    ANALYTICS_JS_PATH: '/analytics.js',
    COLLECT_PATH: '/collect',
    HOST: 'www.google-analytics.com'
  }
};

},{}],6:[function(require,module,exports){
/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/* eslint-env worker, serviceworker */

const IDBHelper = require('../../../../lib/idb-helper.js');
const constants = require('./constants.js');

const idbHelper = new IDBHelper(constants.IDB.NAME, constants.IDB.VERSION,
  constants.IDB.STORE);
self.a = idbHelper;

/**
 * Adds a URL to IndexedDB, along with the current timestamp.
 *
 * If the request has a body, that body will be used as the URL's search
 * parameters when saving the URL to IndexedDB.
 *
 * If no `time` parameter is provided, Date.now() will be used.
 *
 * @private
 * @param {Request} request
*  @param {Number} [time]
 * @returns {Promise.<T>} A promise that resolves when IndexedDB is updated.
 */
module.exports = (request, time) => {
  const url = new URL(request.url);
  return request.text().then(body => {
    // If there's a request body, then use it as the URL's search value.
    // This is most likely because the original request was an HTTP POST
    // that uses the beacon transport.
    if (body) {
      url.search = body;
    }

    return idbHelper.put(url.toString(), time || Date.now());
  });
};

},{"../../../../lib/idb-helper.js":1,"./constants.js":5}],7:[function(require,module,exports){
/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/* eslint-env worker, serviceworker */

const IDBHelper = require('../../../../lib/idb-helper.js');
const constants = require('./constants.js');
const log = require('../../../../lib/log.js');

const idbHelper = new IDBHelper(constants.IDB.NAME, constants.IDB.VERSION,
  constants.IDB.STORE);

/**
 * Replays all the queued requests found in IndexedDB, by calling fetch()
 * with an additional parameter indicating the offset from the original time.
 *
 * Returns a promise that resolves when the replaying is complete.
 *
 * @private
 * @param {Object=} additionalParameters URL parameters, expressed as key/value
 *                 pairs, to be added to replayed Google Analytics requests.
 *                 This can be used to, e.g., set a custom dimension indicating
 *                 that the request was replayed from the service worker.
 * @returns {Promise.<T>}
 */
module.exports = additionalParameters => {
  additionalParameters = additionalParameters || {};

  return idbHelper.getAllKeys().then(urls => {
    return Promise.all(urls.map(url => {
      return idbHelper.get(url).then(queuedTime => {
        const newUrl = new URL(url);

        // URLSearchParams was added in Chrome 49.
        // On the off chance we're on a browser that lacks support, we won't
        // set additionParameters, but at least we'll set qt=.
        if ('searchParams' in newUrl) {
          additionalParameters.qt = queuedTime;
          // Call sort() on the keys so that there's a reliable order of calls
          // to searchParams.set(). This isn't important in terms of
          // functionality, but it will make testing easier, since the
          // URL serialization depends on the order in which .set() is called.
          Object.keys(additionalParameters).sort().forEach(parameter => {
            newUrl.searchParams.set(parameter, additionalParameters[parameter]);
          });
        } else {
          log('The browser does not support URLSearchParams, ' +
            'so not setting additional parameters.');
          newUrl.search += (newUrl.search ? '&' : '') + 'qt=' + queuedTime;
        }

        return fetch(newUrl.toString()).catch(error => {
          // If this was queued recently, then rethrow the error, to prevent
          // the entry from being deleted. It will be retried again later.
          if ((Date.now() - queuedTime) < constants.STOP_RETRYING_AFTER) {
            throw error;
          }
        });
      }).then(() => idbHelper.delete(url));
    }));
  });
};

},{"../../../../lib/idb-helper.js":1,"../../../../lib/log.js":2,"./constants.js":5}],8:[function(require,module,exports){
/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/* eslint-env worker, serviceworker */

const constants = require('./lib/constants.js');
const enqueueRequest = require('./lib/enqueue-request.js');
const log = require('../../../lib/log.js');
const replayQueuedRequests = require('./lib/replay-queued-requests.js');
const scope = require('../../../lib/scope.js');

/**
 * In order to use the library, call`goog.offlineGoogleAnalytics.initialize()`.
 * It will take care of setting up service worker `fetch` handlers to ensure
 * that the Google Analytics JavaScript is available offline, and that any
 * Google Analytics requests made while offline are saved (using `IndexedDB`)
 * and retried the next time the service worker starts up.
 *
 * @example
 * // This code should live inside your service worker JavaScript, ideally
 * // before any other 'fetch' event handlers are defined:
 *
 * // First, import the library into the service worker global scope:
 * importScripts('path/to/offline-google-analytics-import.js');
 *
 * // Then, call goog.offlineGoogleAnalytics.initialize():
 * goog.offlineGoogleAnalytics.initialize({
 *   parameterOverrides: {
 *     // Optionally, pass in an Object with additional parameters that will be
 *     // included in each replayed request.
 *     // See https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
 *     cd1: 'Some Value',
 *     cd2: 'Some Other Value'
 *   }
 * });
 *
 * // At this point, implement any other service worker caching strategies
 * // appropriate for your web app.
 *
 * @alias goog.offlineGoogleAnalytics.initialize
 * @param {Object=} config Optional configuration arguments.
 * @param {Object=} config.parameterOverrides Optional
 *                  [Measurement Protocol parameters](https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters),
 *                  expressed as key/value pairs, to be added to replayed Google
 *                  Analytics requests. This can be used to, e.g., set a custom
 *                  dimension indicating that the request was replayed.
 * @returns {undefined}
 */
const initialize = config => {
  config = config || {};

  self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    const request = event.request;

    if (url.hostname === constants.URL.HOST) {
      if (url.pathname === constants.URL.COLLECT_PATH) {
        // If this is a /collect request, then use a network-first strategy,
        // falling back to queueing the request in IndexedDB.

        // Make a clone of the request before we use it, in case we need
        // to read the request body later on.
        const clonedRequest = request.clone();

        event.respondWith(
          fetch(request).catch(error => {
            log('Enqueuing failed request...');
            return enqueueRequest(clonedRequest).then(() => error);
          })
        );
      } else if (url.pathname === constants.URL.ANALYTICS_JS_PATH) {
        // If this is a request for the Google Analytics JavaScript library,
        // use the network first, falling back to the previously cached copy.
        event.respondWith(
          caches.open(constants.CACHE_NAME).then(cache => {
            return fetch(request).then(response => {
              return cache.put(request, response.clone()).then(() => response);
            }).catch(error => {
              log(error);
              return cache.match(request);
            });
          })
        );
      }
    }
  });

  replayQueuedRequests(config.parameterOverrides || {});
};

// Add the function to the global service worker scope,
// as goog.offlineGoogleAnalytics.initialize.
scope('offlineGoogleAnalytics', {
  initialize: initialize
});

},{"../../../lib/log.js":2,"../../../lib/scope.js":3,"./lib/constants.js":5,"./lib/enqueue-request.js":6,"./lib/replay-queued-requests.js":7}]},{},[8]);
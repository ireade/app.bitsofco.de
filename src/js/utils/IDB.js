function IDB() {
    this._dbPromise = this._setupDB();
}

IDB.prototype._setupDB = function() {
    if (!navigator.serviceWorker) { return Promise.reject(); }

    return idb.open('bitsofcode', 1, function(upgradeDb) {

        const ArticlesStore = upgradeDb.createObjectStore('Articles', {
          keyPath: 'guid'
        });
        ArticlesStore.createIndex('guid', 'guid');

        const BookmarksStore = upgradeDb.createObjectStore('Bookmarks', {
            keyPath: 'guid'
        });
        BookmarksStore.createIndex('guid', 'guid');

        const SettingsStore = upgradeDb.createObjectStore('Settings', {
            keyPath: 'setting'
        });
        
    });
};

IDB.prototype.add = function(dbStore, data) {
    return this._dbPromise.then( function(db) {
        const tx = db.transaction(dbStore, 'readwrite');
        const store = tx.objectStore(dbStore);
        store.put(data);
        return tx.complete;
    });
};


IDB.prototype.search = function(dbStore, dbIndex, searchKey, searchValue) {
    let results = [];
    return this._dbPromise.then( function(db) {
        const tx = db.transaction(dbStore, 'readwrite');
        const store = tx.objectStore(dbStore);

        if ( !dbIndex ) { return store.openCursor(); }
        const index = store.index(dbIndex);
        return index.openCursor();
    })
        .then(function findItem(cursor) {
            if (!cursor) return;
            if ( cursor.value[searchKey] == searchValue ) {
                results.push(cursor.value);
            }
            return cursor.continue().then(findItem);
        })
        .then(function() { return results; })
};


IDB.prototype.remove = function(dbStore, dbIndex, searchKey, searchValue) {
    return this._dbPromise.then( function(db) {
        const tx = db.transaction(dbStore, 'readwrite');
        const store = tx.objectStore(dbStore);

        if ( !dbIndex ) { return store.openCursor(); }
        const index = store.index(dbIndex);
        return index.openCursor();
    })
    .then(function deleteItem(cursor) {
        if (!cursor) return;
        if ( cursor.value[searchKey] == searchValue ) {
            cursor.delete();
        }
        return cursor.continue().then(deleteItem);
    })
    .then(function() { return true; })
};

IDB.prototype.retrieve = function(dbStore, dbIndex, check) { 
    return this._dbPromise.then( function(db) {
        const tx = db.transaction(dbStore);
        const store = tx.objectStore(dbStore);

        if ( !check ) { return store.getAll(); }

        const index = store.index(dbIndex);
        return index.getAll(check);
    });
};

'use strict';

/* Classes and Variables */
var Articles = [];
var didFetchArticlesFromDatabase = false;

/* Database Functions */
function addToDatabase(article) {
    return new Promise(function (resolve, reject) {
        Database.retrieve('Articles', 'guid', article.guid).then(function (articles) {
            if (articles.length === 1) return resolve(article);
            Database.add('Articles', article).then(function () {
                resolve(article);
            });
        });
    });
}
function clearDatabase() {
    function removeArticle(guid) {
        Database.remove('Articles', false, 'guid', guid);
    }
    Database.retrieve('Articles', 'pubDate').then(function (articlesFromDatabase) {
        Articles = sortedArticles(articlesFromDatabase);
        var guidsOfArticlesToDelete = [];
        for (var i = 10; i < Articles.length; i++) {
            guidsOfArticlesToDelete.push(Articles[i].guid);
        }
        return Promise.resolve(guidsOfArticlesToDelete);
    }).then(function (guids) {
        guids.forEach(function (guid) {
            return removeArticle;
        });
    });
}

/* Getting Articles, Updating in Background, etc */
function checkForNewArticles() {
    function isNewArticle(article) {
        Articles.find(function (oldArticle) {
            if (oldArticle.title === article.title) return false;
            return true;
        });
    }
    var newArticles = [];
    return new Promise(function (resolve, reject) {
        fetchArticles(true).then(function (articles) {
            articles.forEach(function (article) {
                if (isNewArticle(article)) newArticles.push(article);
            });
            resolve(newArticles);
        }).catch(function (err) {
            return reject(err);
        });
    });
}
function updateArticlesInBackground() {
    //console.log("updateArticlesInBackground");
    checkForNewArticles().then(function (newArticles) {
        //console.log(newArticles);
        if (newArticles.length === 0) return;
        Articles.unshift(newArticles);
        clearDatabase();
    });
}
function displayArticles(articles) {
    var html = MyApp.templates.excerpt({ items: articles });
    document.getElementById('excerpts').innerHTML = html;
    document.querySelector('.site-main').insertAdjacentHTML('beforeEnd', '<a href="https://bitsofco.de" class="read-more-link">Read more on bitsofco.de <i class="fa fa-external-link"></i></a>');
}

/* Start */
if ('serviceWorker' in navigator) {

    Database.retrieve('Articles').then(function (articlesFromDatabase) {
        if (articlesFromDatabase.length == 0) return fetchArticles(true);
        didFetchArticlesFromDatabase = true;
        return Promise.resolve(articlesFromDatabase);
    }).then(function (articles) {
        Articles = sortedArticles(articles);
        displayArticles(Articles);
        return Promise.resolve();
    }).then(function () {
        if (didFetchArticlesFromDatabase) updateArticlesInBackground();
    });
} else {

    fetchArticles(false).then(function (articles) {
        Articles = sortedArticles(articles);
        displayArticles(Articles);
        return Promise.resolve();
    }).then(function () {
        var bookmarkButtons = Array.from(document.querySelectorAll('.btn-bookmark'));
        bookmarkButtons.map(function (button) {
            button.disabled = true;
        });
    });
}
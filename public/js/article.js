'use strict';

var guid = sessionStorage.getItem('articleGuid');

if ('serviceWorker' in navigator) {

    Database.retrieve('Articles', 'guid', guid).then(function (articles) {
        var article = articles[0];
        var html = MyApp.templates.article(article);
        document.getElementById('article').innerHTML = html;
    });
} else {

    fetchArticles(false).then(function (articles) {
        var article = articles.find(function (a) {
            if (a.guid === guid) return true;
        });
        var html = MyApp.templates.article(article);
        document.getElementById('article').innerHTML = html;

        var bookmarkButton = document.querySelector('.btn-bookmark');
        bookmarkButton.disabled = true;
    });
}
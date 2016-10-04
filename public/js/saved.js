'use strict';

var excerptsEl = document.getElementById('excerpts');

Database.retrieve('Bookmarks').then(function (bookmarkedArticles) {
    document.querySelector('.articles-count').innerHTML = bookmarkedArticles.length;
    return Promise.resolve(bookmarkedArticles);
}).then(function (articles) {
    var Articles = sortedArticles(articles);
    var html = MyApp.templates.excerpt({ items: Articles });
    excerptsEl.innerHTML = html;
});
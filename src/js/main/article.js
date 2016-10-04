const guid = sessionStorage.getItem('articleGuid');

if ('serviceWorker' in navigator) {

    Database.retrieve('Articles', 'guid', guid)
        .then((articles) => {
            const article = articles[0];
            const html = MyApp.templates.article(article);
            document.getElementById('article').innerHTML = html;
        });

} else {

    fetchArticles(false)
        .then((articles) => {
            const article = articles.find((a) => {
                if ( a.guid === guid ) return true;
            })
            const html = MyApp.templates.article(article);
            document.getElementById('article').innerHTML = html;

            const bookmarkButton = document.querySelector('.btn-bookmark');
            bookmarkButton.disabled = true;
        });

}


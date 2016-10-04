/* Classes and Variables */
let Articles = [];
let didFetchArticlesFromDatabase = false;


/* Database Functions */
function addToDatabase(article) {
    return new Promise((resolve, reject) => {
        Database.retrieve('Articles', 'guid', article.guid)
            .then((articles) => {
                if ( articles.length === 1 ) return resolve(article)
                Database.add('Articles', article).then(() => { resolve(article) });
            })
    })
}
function clearDatabase() {
    function removeArticle(guid) {
        Database.remove('Articles', false, 'guid', guid)
    }
    Database.retrieve('Articles', 'pubDate')
        .then((articlesFromDatabase) => {
            Articles = sortedArticles(articlesFromDatabase);
            const guidsOfArticlesToDelete = [];
            for (let i = 10; i < Articles.length; i++) {
                guidsOfArticlesToDelete.push( Articles[i].guid );
            }
            return Promise.resolve(guidsOfArticlesToDelete)
        })
        .then((guids) => { guids.forEach(guid => removeArticle) })
}

/* Getting Articles, Updating in Background, etc */
function checkForNewArticles() {
    function isNewArticle(article) {
        Articles.find((oldArticle) => {
            if ( oldArticle.title === article.title ) return false
            return true
        })
    }
    const newArticles = [];
    return new Promise((resolve, reject) => {
        fetchArticles(true)
            .then((articles) => {
                articles.forEach((article) => { if ( isNewArticle(article) ) newArticles.push(article) });
                resolve(newArticles);
            })
            .catch((err) => reject(err))
    })
}
function updateArticlesInBackground() {
    //console.log("updateArticlesInBackground");
    checkForNewArticles()
        .then((newArticles) => {
            //console.log(newArticles);
            if ( newArticles.length === 0 ) return
            Articles.unshift(newArticles);
            clearDatabase();
        })
}
function displayArticles(articles) {
    const html = MyApp.templates.excerpt({items: articles});
    document.getElementById('excerpts').innerHTML = html;
    document.querySelector('.site-main').insertAdjacentHTML('beforeEnd', '<a href="https://bitsofco.de" class="read-more-link">Read more on bitsofco.de <i class="fa fa-external-link"></i></a>');
}

/* Start */
if ( 'serviceWorker' in navigator ) {

    Database.retrieve('Articles')
        .then((articlesFromDatabase) => {
            if (articlesFromDatabase.length == 0) return fetchArticles(true)
            didFetchArticlesFromDatabase = true;
            return Promise.resolve(articlesFromDatabase);
        })
        .then((articles) => {
            Articles = sortedArticles(articles);
            displayArticles(Articles);
            return Promise.resolve();
        })
        .then(() => { if (didFetchArticlesFromDatabase) updateArticlesInBackground() });

} else {

    fetchArticles(false)
        .then((articles) => {
            Articles = sortedArticles(articles);
            displayArticles(Articles);
            return Promise.resolve();
        })
        .then(() => {
            const bookmarkButtons = Array.from( document.querySelectorAll('.btn-bookmark') )
            bookmarkButtons.map((button) => {
                button.disabled = true;
            })

        })
}



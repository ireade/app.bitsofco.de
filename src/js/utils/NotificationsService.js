function NotificationsService(serviceWorkerReg) {
    this.serviceWorkerReg = serviceWorkerReg;
    this.url = 'https://bitsofcode-notify.herokuapp.com/users/';

    this.headers = new Headers();
    this.headers.append('Content-Type', 'application/json');
}
NotificationsService.prototype.subscribe = function() {
    return new Promise((resolve, reject) => {
        this.serviceWorkerReg.pushManager
            .subscribe({userVisibleOnly: true})
            .then((sub) => this._addSubscription(sub))
            .then(() => resolve())
            .catch(() => reject())
    })
};
NotificationsService.prototype.unsubscribe = function() {
    return new Promise((resolve, reject) => {
        this.serviceWorkerReg.pushManager.getSubscription()
            .then((sub) => {
                sub.unsubscribe()
                    .then(() => this._deleteSubscription(sub))
                    .then(() => resolve())
                    .catch(() => reject());
            })
    })
};
NotificationsService.prototype._addSubscription = function(sub) {
    return new Promise((resolve, reject) => {
        const uid = sub.endpoint.split('gcm/send/')[1];
        const body = JSON.stringify({
            uid: uid
        });
        const init = {
            method: 'POST',
            headers: this.headers,
            body: body
        };
        fetch(this.url, init)
            .then((res) => {
                console.log(res);
                if ( res.errors ) { reject(); }
                resolve();
            })
            .catch(() => reject());
    });
}
NotificationsService.prototype._deleteSubscription = function(sub) {
    return new Promise((resolve, reject) => {
        const uid = sub.endpoint.split('gcm/send/')[1];
        const init = {
            method: 'DELETE',
            headers: this.headers
        };
        fetch(this.url+uid, init)
            .then((res) => {
                console.log(res);
                if ( res.errors ) { reject(); }
                resolve();
            })
            .catch(() => reject());
    });
};
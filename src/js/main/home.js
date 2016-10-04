/* **************

 Local Publish Time

 *************** */

const setTimezoneLink = document.querySelector('.setTimezoneLink');
const localTimeElement = document.querySelector('.localTime');

function getLocalPublishTime(coords) {

    const url = `https://api.timezonedb.com/v2/get-time-zone?key=7KIGVA90V0ES&format=json&by=position&lat=${coords.latitude}&lng=${coords.longitude}`;
    return new Promise((resolve) => {
        return fetch(url)
            .then(response => response.json())
            .then(response => {
                let localTimeOnTuesday = 1474365600 - response.gmtOffset;
                localTimeOnTuesday = moment.unix(localTimeOnTuesday).format('ha');
                localTimeOnTuesday = `${localTimeOnTuesday} ${response.nextAbbreviation ? response.nextAbbreviation : `in ${response.countryName}` }`;
                resolve(localTimeOnTuesday);
            })
        });
}

function addPublishTimeToDatabase(time) {
    const setting = {
        setting: 'publishTime',
        value: time
    }
    Database.add('Settings', setting);
}

function getPublishTimeSetting() {
    return new Promise((resolve, reject) => {
        Database.search('Settings', false, 'setting', 'publishTime')
            .then((publishTimeSetting) => resolve(publishTimeSetting))
            .catch((err) => reject(err))
    })
}

function displayLocalTime(localPublishTime) {
    localTimeElement.innerHTML = `That's ${localPublishTime}.`;
    setTimezoneLink.innerHTML = 'Reset Local Time';
}

setTimezoneLink.addEventListener('click', function(e) {
    e.preventDefault();
    setTimezoneLink.innerHTML = 'Checking...';
    navigator.geolocation.getCurrentPosition(function(position) {
        getLocalPublishTime(position.coords)
            .then((localPublishTime) => {
                addPublishTimeToDatabase(localPublishTime);
                displayLocalTime(localPublishTime);
            })
    });
});

getPublishTimeSetting()
    .then((publishTimeSetting) => {
        if ( publishTimeSetting.length === 0 ) return
        displayLocalTime(publishTimeSetting[0].value)
    })


/* **************

 Push Notifications

 *************** */
const notificationsButton = document.querySelector('.btn-notifications');

function getNotificationsSetting() {
    return new Promise((resolve, reject) => {
        Database.search('Settings', false, 'setting', 'allowNotifications')
            .then((notificationsSetting) => resolve(notificationsSetting))
            .catch((err) => reject(err))
    })
}

function subscribeToNotifications() {
    const setting = {
        setting: 'allowNotifications',
        value: true
    }
    myNotificationsService.subscribe()
        .then(() => {
            Database.add('Settings', setting);
            notificationsButton.classList.toggle('btn-notifications--on');
        });
}

function unsubscribeFromNotifications() {
    const setting = {
        setting: 'allowNotifications',
        value: false
    }
    myNotificationsService.unsubscribe()
        .then(() => {
            Database.add('Settings', setting);
            notificationsButton.classList.toggle('btn-notifications--on');
        })
}

function toggleNotificationsSetting() {
    getNotificationsSetting()
        .then((notificationsSetting) => {
            if ( notificationsSetting.length === 0 ) {
                subscribeToNotifications()
            } else if ( notificationsSetting[0].value === false ) {
                subscribeToNotifications()
            } else if ( notificationsSetting[0].value === true ) {
                unsubscribeFromNotifications()
            }
        });
}

notificationsButton.addEventListener('click', function() {
    toggleNotificationsSetting();
});

getNotificationsSetting()
    .then((notificationsSetting) => {
        if ( notificationsSetting.length === 0 ) return
        if ( notificationsSetting[0].value === true ) {
            notificationsButton.classList.add('btn-notifications--on');
        }
    })



if ( !('serviceWorker' in navigator) ) {
    const message = "<em>Unfortunately, your current browser doesn't support some of the features that make this app really awesome.</em> You can still use it like you would a normal website, but the offline features will not be available.";
    document.querySelector('.notifications-section').innerHTML = message;
}
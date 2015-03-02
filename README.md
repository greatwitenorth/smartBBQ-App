### smartBBQ App
This is a mobile app to accompany a Spark Core running the smartBBQ firmware. The app uses the [ionic framework](http://ionicframework.com/) and can be compiled for iOS or Andriod.

### Build Instructions
First head over to [nodejs.org](http://nodejs.org/download/) and download nodejs if you haven't already. You'll need npm in order to install the apps dependancies.

Install Cordova and Ionic:
```bash
npm install -g cordova ionic
```

Clone this repo and install dependencies:
```bash
git clone git@github.com:greatwitenorth/smartBBQ-App.git
cd smartBBQ-App
npm install
ionic serve
```

This will open a web browser with a running version of the app. For the most part this will function just like the app on your phone.
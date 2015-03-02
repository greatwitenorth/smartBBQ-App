// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('smartBBQ', ['ionic', 'smartBBQ.controllers', 'ngCordova'], function($httpProvider){
    // Use x-www-form-urlencoded Content-Type
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
 
  /**
   * The workhorse; converts an object to x-www-form-urlencoded serialization.
   * @param {Object} obj
   * @return {String}
   */ 
  var param = function(obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;
      
    for(name in obj) {
      value = obj[name];
        
      if(value instanceof Array) {
        for(i=0; i<value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value instanceof Object) {
        for(subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value !== undefined && value !== null)
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }
      
    return query.length ? query.substr(0, query.length - 1) : query;
  };
 
  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function(data) {
    return angular.isObject(data) && String(data) !== '[object File]' ? param(data) : data;
  }];
})

.run(function($rootScope, $localstorage){
  var token = $localstorage.getObject('auth');

  if(Object.keys(token).length === 0){
      $rootScope.loggedInUser = token;
  } else {
      $rootScope.loggedInUser = null;
  }
})

.run(function($ionicPlatform, $cordovaSplashscreen) {

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })

  .state('app.main', {
    url: "/main",
    views: {
      'menuContent': {
          templateUrl: "templates/main.html"
      }
    }
  })

  .state('login', {
    url: "/login",
    templateUrl: "templates/login.html",
    controller: 'LoginCtrl'
  })
  
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/main');
})

.run( function($rootScope, $location, $localstorage, User) {

  // register listener to watch route changes
  $rootScope.$on( "$locationChangeStart", function(event, next, current) {
    
    if ( !User.isLoggedIn() ) {
      // no logged user, we should be going to #login
      if ( next.templateUrl == "templates/login.html" ) {
        // already going to #login, no redirect needed
      } else {
        // not going to #login, we should redirect now
        $location.path( "/login" );
      }
    }         
  });
 })

.factory('User', function($localstorage){
  var user;

  // Check for a saved user
  var local = $localstorage.getObject('auth');

  if(Object.keys(local).length > 0){
    user = local;
    spark.login({accessToken: user.access_token});
    // todo make sure credentials are still valid
  }

  return{
    setUser : function(aUser){
        user = aUser;
    },
    isLoggedIn : function(){
        return(user)? true : false;
    },
    token : function(){
      return(user)? user.access_token : false;
    },
    selectedCore : function() {
      var core = $localstorage.getObject('selectedCore');
      if(angular.equals({}, core)){
        return null;
      }
      return core;
    },
    logout: function(){
      user = null;
      $localstorage.deleteObject('auth');
      // TODO delete access token from spark server
    }
  }
})

.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    },
    deleteObject: function(key) {
      return $window.localStorage.removeItem(key);
    }
  }
}])

.factory('Probes', function($rootScope, User) {
  // todo, make this dynamic, maybe fetch config from spark core
  var probes = [
    {
      alarm: false,
      temp: 0
    },
    {
      alarm: false,
      temp: 0
    },
    {
      alarm: false,
      temp: 0
    },
    {
      alarm: false,
      temp: 0
    }
  ];

  var eventSource = function() {
    if(User.selectedCore() === null) return;

    var e = new EventSource('https://api.spark.io/v1/devices/' + User.selectedCore()['id'] + '/events/?access_token=' + User.token());

    // Listen to connection open
    e.addEventListener('open', function(e) {
      console.log("Opened connection to core!"); 
    },false);

    // Listen to connection error
    e.addEventListener('error', function(e) {
      console.log("Errored, cannot connect to core!"); 
    },false);

    // Listen to probe alarms
    e.addEventListener('alarms', function(e) {
        var rawData = JSON.parse(e.data);
        
        console.log(rawData.data);

        saveAlarms(alarms.data);
    }, false);

    // Listen to probe temps
    e.addEventListener('temps', function(e) {
        // Format our data
        var temps = JSON.parse(e.data);
        temps['data'] = JSON.parse(temps.data);

        console.log(temps);

        saveTemps(temps.data);
    }, false);

    return e;
  }

  var events = eventSource();

  function refreshEventSource(){
    console.log(events);
    if(typeof events !== 'undefined') {
      events.close();
    }
    events = eventSource();
  }

  $rootScope.$on('core:change', refreshEventSource);

  function saveAlarms(data) {
    updateProbeKey('alarm', data);
    $rootScope.$broadcast('probe:alarm',data);
  }

  function saveTemps(data) {
    updateProbeKey('temp', data);
    $rootScope.$broadcast('probe:temp',data);
  }

  function updateProbeKey(key, data){
    for (var i = data.length - 1; i >= 0; i--) {
      probes[i][key] = data[i]
    }
  }


  return probes;
})

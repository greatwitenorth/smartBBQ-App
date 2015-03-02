angular.module('smartBBQ.controllers', [])

.controller('LoginCtrl', function($scope, $state, $ionicModal, $http, $localstorage, $location, $rootScope, $ionicLoading, User) {

  $scope.loginData = {};

  $scope.cores = {};

  $scope.show = function() {          
    if(User.isLoggedIn()){

      // User is logged in, redirect to main page
      $state.go('app.main');
      return false;
    }

    return true;
  }

  // Perform the login action when the user submits the login form
  $scope.login = function() {
    // $scope.cores(); return;
    $ionicLoading.show();

    spark.login({username: $scope.loginData.username, password: $scope.loginData.password}).then(
      function(token){

        // Figure out our expiry date
        var date = new Date();
        var daysToExpiry = token.expires_in / 60 / 60 / 24;
        token['expires'] = date.setDate(date.getDate() + daysToExpiry); 

        $localstorage.setObject('auth', token);
        User.setUser(token);

        // TODO: Now we need to find the spark core running the SmartBBQ software

        $location.path( "/main" );        
        $ionicLoading.hide();
      },
      function(err) {
        console.log('API call completed on promise fail: ', err);
        $ionicLoading.hide();
      }
    );
  };
})

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $http, $localstorage, $location, $ionicLoading, $rootScope, User, Probes) {

  $scope.mainTemp = 0;

  $scope.cores = [];

  $ionicModal.fromTemplateUrl('templates/selectCore.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.init = function() {
    console.log(User.selectedCore());
    if(User.selectedCore() === null) {
      $scope.showCores();
    }
  }

  $scope.selectedCore = function() {
      return $localstorage.getObject('selectedCore', null);
  }

  $scope.showCores = function() {
    // If we've already fetched the cores, don't do it again.
    if($scope.cores.length < 1){
      var devicesPr = spark.getAttributesForAll();
      devicesPr.then(
        function(cores){
          console.log('Core attrs retrieved successfully:', cores);
          // Only show cores running smartBBQ firmware
          angular.forEach(cores, function(core, key) {
            if('smartBBQ' in core.variables) {
              $scope.cores.push(core);
            }
          });
          $scope.modal.show();
        },
        function(err) {
          console.log('API call failed: ', err);
        }
      );
    } else {
      $scope.modal.show();
    }
    
  }

  $scope.setCore = function(core) {
    console.log(core);
    $scope.selectedCore = core;
    $localstorage.setObject('selectedCore', core);
    $scope.modal.hide();
    $rootScope.$broadcast('core:change');
  }
  
  $scope.$on('probe:temp', function(event,data) {
    $scope.$apply(function(){
      $scope.mainTemp = data[2];      
    });
  });

  $scope.logout = function() {
    console.log('logging out...');

    User.logout();

    $location.path('/login');
  }

  $scope.init();

})

.controller('LoadingCtrl', function($scope, $ionicLoading) {
  $scope.show = function() {
    $ionicLoading.show();
  };
  $scope.hide = function(){
    $ionicLoading.hide();
  };
});


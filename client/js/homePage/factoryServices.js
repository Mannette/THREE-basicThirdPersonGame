var myApp = angular.module('myApp', ['ngRoute']);

myApp.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'partials/home.html',
      access: {restricted: false}
    })
    .when('/game', {
      templateUrl: 'partials/myDemo.html',
      access: {restricted: true}
    })
    .otherwise({redirectTo: '/'});
});

myApp.factory('AuthService', ['$q', '$http', function($q, $http) {

  var user = null;

  // return available functions for use in controllers
  return ({
    getUserStatus: getUserStatus,
    login: login,
    logout: logout,
    register: register,
    tempUserLogin: tempUserLogin,
    user: user
  });

  function getUserStatus() {
    if (user) {
      return true;
    } else {
      return false;
    }
  }

  function login(username, password) {
    var deferred = $q.defer();

    // send POST request to Server
    $http.post('/login', {username: username, password: password})
      // handle success
      .success(function(data, status) {
        if(status === 200 && data.status) {
          user = true;
          deferred.resolve();
        } else {
          user = false;
          deferred.reject();
        }
      })
      // handle Error
      .error(function(data) {
        user = false;
        deferred.reject();
      });

      // return promise object
      return deferred.promise;
  }

  function logout() {
    var deferred = $q.defer();

    // send GET request to server
    $http.get('/logout')
    // handle success
    .success(function(data) {
      user = false;
      deferred.resolve();
    })
    // handle Error
    .error(function(data) {
      user = false;
      deferred.reject();
    });

    // return promise object
    return deferred.promise;
  }

  function register(username, password) {
    var deferred = $q.defer();

    // send POST request to server
    $http.post('/register', {username: username, password: password})
    // handle success
    .success(function(data, status) {
      if (status === 200 && data.status) {
        user = true;
        deferred.resolve();
      } else {
        deferred.reject();
      }
    })
    // handle Error
    .error(function(data) {
      deferred.reject();
    });

    // return promise object
    return deferred.promise;
  }

  function tempUserLogin() {
    var deferred = $q.defer();

    // send POST request to server
    $http.post('/tempUser')
    // handle success
    .success(function(data, status) {
      if (status === 200 && data.status) {
        user = true;
        deferred.resolve();
      } else {
        deferred.reject();
      }
    })
    // handle Error
    .error(function(data) {
      deferred.reject();
    });

    return deferred.promise;
  }

}]);

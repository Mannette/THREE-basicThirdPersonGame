// var myApp = angular.module('myApp', []);

myApp.controller('loginController', ['$scope', '$location', 'AuthService', '$rootScope', function($scope, $location, AuthService, $rootScope) {

  $scope.login = function() {

    // value to show Error
    $scope.error = false;

    // call login from service
    AuthService.login($scope.login.username, $scope.login.password)
      // handle success
      .then(function() {
        $location.path('/game');
        $scope.error = false;
        $scope.login = {};
      })
      // handle Error
      .catch(function() {
        $scope.error = true;
        $scope.errorMessage = 'Invalid username or password.';
        $scope.login = {};
      });
  };

}]);

myApp.controller('registerController', ['$scope', '$location', 'AuthService', function($scope, $location, AuthService) {

    $scope.register = function() {

      $scope.registerError = false;
      $scope.disabled = true;

      // call register from service
      AuthService.register($scope.register.username, $scope.register.password)
      // handle success
      .then(function() {
        $location.path('/game');
        $scope.register = {};
        $scope.disabled = false;
      })
      // handle Error
      .catch(function() {
        $scope.registerError = true;
        $scope.errorMessage = 'Something went wrong!';
        $scope.disabled = false;
        $scope.register = {};
      });

    };

}]);

myApp.controller('noLoginController', ['$scope', '$location', function($scope, $location) {

  $scope.tempUser = function() {

    AuthService.noUser()
    // handle success
    .then(function() {
      $location.path('/game');
    })
    // handle Error
    .catch(function() {
      $scope.tempUserError = true;
    });
  };

}]);

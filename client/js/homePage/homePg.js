myApp.controller('loginController', ['$scope', '$location', 'AuthService', function($scope, $location, AuthService) {

  $scope.login = function() {

    // value to show Error
    $scope.loginError = false;
    // call login from service
    AuthService.login($scope.loginForm.username, $scope.loginForm.password)
      // handle success
      .then(function() {
        $location.path('/game');
        $scope.loginError = false;
        $scope.loginForm = {};
      })
      // handle Error
      .catch(function() {
        $scope.loginError = true;
        $scope.errorMessage = 'Invalid username or password.';
        $scope.loginForm = {};
      });
  };

}]);

myApp.controller('registerController', ['$scope', '$location', 'AuthService', function($scope, $location, AuthService) {

    $scope.register = function() {

      $scope.registerError = false;
      $scope.disabled = true;

      // call register from service
      AuthService.register($scope.registerForm.username, $scope.registerForm.password)
      // handle success
      .then(function() {
        $location.path('/game');
        $scope.registerForm = {};
        $scope.disabled = false;
      })
      // handle Error
      .catch(function() {
        $scope.registerError = true;
        $scope.errorMessage = 'Something went wrong!';
        $scope.disabled = false;
        $scope.registerForm = {};
      });

    };

}]);

myApp.controller('noLoginController', ['$scope', '$location', 'AuthService', function($scope, $location, AuthService) {

  $scope.tempUser = function() {

    AuthService.tempUserLogin()
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

myApp.controller('logoutController', ['$scope', '$location', '$http', 'AuthService', function($scope, $location, $http, AuthService) {

  $scope.logout = function() {
    $('body').addClass('body');

    // console.log('logout controller');

    AuthService.logout()
      .then(function() {
        $location.path('/');
      });
  };

}]);

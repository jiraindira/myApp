angular.module('starter.controllers', ['myService', 'ion-autocomplete','autocomplete'])

.controller('ReviewedCtrl', ['$scope', '$firebase', '$ionicModal', function($scope, $firebase, $ionicModal) {

  function getArrayFromObject(object) {
    var array = [];
    for (var key in object) {
      var item = object[key];
      item.id = key;
      array.push(item);
    }
    return array;
  }

  var firebaseObj = new Firebase('https://dazzling-heat-4525.firebaseio.com//restaurant');

  firebaseObj.once('value', function(dataSnapshot) {

    //GET DATA
    var data = dataSnapshot.val();
    var restaurants = getArrayFromObject(data);

    if (!restaurants.length) return;

    // Attach list of selected observations to each review)
    restaurants.forEach(function (restaurant) {
      restaurant.reviews = getArrayFromObject(restaurant.reviews);

      // pandai pandai la
      restaurant.observations = Object.keys(restaurant.observations)
        .filter(function (key) {
          return restaurant.observations[key];
        });
    });

    $scope.$apply(function () {
      $scope.restaurants = restaurants;
    });
  });

  console.log("pass");

  $ionicModal.fromTemplateUrl('templates/filter-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal
  })

  $scope.openModal = function() {
    $scope.modal.show()
  }

  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });

}])

.controller('AddReviewCtrl', function($scope, $stateParams, $q, Firebase, placesExplorerService) {

  $scope.observations = [
    {
      name: 'Big Group',
      isSelected: false
    },
    {
      name: 'Casual',
      isSelected: false
    },
    {
      name: 'Conversations',
      isSelected: false
    },
    {
      name: 'Crowded',
      isSelected: false
    },
    {
      name: 'Date Spot',
      isSelected: false
    },
    {
      name: 'Value For Money',
      isSelected: false
    },
    {
      name: 'Service',
      isSelected: false
    },
    {
      name: 'View',
      isSelected: false
    },
    {
      name: 'Long Wait',
      isSelected: false
    },
    {
      name: 'Meeting',
      isSelected: false
    },
    {
      name: 'Mixiology',
      isSelected: false
    },
    {
      name: 'Romantic',
      isSelected: false
    },
    {
      name: 'Outdoor Space',
      isSelected: false
    }
  ];
  $scope.places = [];

  var self = this;


  // gives another movie array on change
  $scope.getTest = function(typed){
    //$scope.fourSquare = get4SquareRestaurants();

    get4SquareRestaurants(typed).then(function(data){
      $scope.places = data;
    })
  };

  function get4SquareRestaurants(typed){
    var location = "New York";
    var defered = $q.defer();

    placesExplorerService.get({ near: location, query: typed , limit: 4 },function(result){
      defered.resolve(result.response.minivenues);
      console.log(result.response)
    });

    return defered.promise;
  }

})

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})

.controller('FilterCtrl', function($scope, Firebase, filterService ) {

  var vm1 = this;
  $scope.test = 'jirain';

  $scope.closeModal = function() {
    $scope.modal.hide();
  };

  $scope.filterService = filterService;
  //$scope.selectedPrice = [];
  //$scope.selectedCity = [];
  //$scope.selectedReviewer = [];

   if (!filterService.allReviewers.length) {
    var firebaseObj = new Firebase('https://dazzling-heat-4525.firebaseio.com//restaurant');
    firebaseObj.once('value', function (dataSnapshot) {
      //GET DATA
      var data = dataSnapshot.val();
      var restaurants = getArrayFromObject(data);

      // store data in a $scope
      $scope.RestaurantData = restaurants;

      if (!restaurants.length) return;

      // Retrieve all cities
      var allCities = [];
      restaurants.forEach(function(restaurant){
        allCities.push(restaurant.location);
      });

      allCities = _.unique(allCities).map(function (city) {
        return {
          name: city
        }
      });
      filterService.allCities = allCities;

      //Retrieve all reviewers
      var allReviewers = [];
      restaurants.forEach(function (restaurant) {
        var reviews = getArrayFromObject(restaurant.reviews);
        reviews.forEach(function (review) {
          allReviewers.push(review.reviewer);
        });
      });

      allReviewers = _.unique(allReviewers).map(function (reviewer) {
        return {
          name: reviewer
        }
      });

      filterService.allReviewers = allReviewers;
      //$scope.reviewers = users;

    });
  }

  function getArrayFromObject(object) {
    var array = [];
    for (var key in object) {
      var item = object[key];
      item.id = key;
      array.push(item);
    }
    return array;
  }
})

.filter('list', function () {
  return function (array) {
    if (!Array.isArray(array)) return;

    return array.join(', ');
  };
})

.service('filterService',function(){
  var self = this;

  this.allReviewers = [];
  this.allCities = [];

  function getSelectedOnly(array){
    return array.filter(function(item){
      return item.selected;
    })
  }

  this.getSelectedReviewers = function(){
    return getSelectedOnly(self.allReviewers)
  }

  this.getSelectedCities = function(){
    return getSelectedOnly(self.allCities)
  }

})

.filter('myFilter',function(filterService){
  return function(input){
    //if (angular.isUndefined(input)) return;
    if (!angular.isArray(input)) return;
    var reviewers = filterService.getSelectedReviewers();
    var cities = filterService.getSelectedCities();


    //save the input in a temp output
    var tempOutput = getArrayFromObject(input);

    if(reviewers.length>0){
      //apply reviewer filter on data

      tempOutput = filterReviewer(tempOutput,reviewers);
    }

    if(cities.length>0){
      //apply reviewer filter on data
      tempOutput = filterCity(tempOutput,cities);
    }

    function getArrayFromObject(object) {
      var array = [];
      for (var key in object) {
        var item = object[key];
        item.id = key;
        array.push(item);
      }
      return array;
    }

    function filterReviewer(allRestaurants, selectedReviewers) {
      // Get restaurants that are reviewed by the selected reviewers
      return allRestaurants.filter(function (restaurant) {
        //return true
        var reviews = getArrayFromObject(restaurant.reviews);
        return reviews.some(function(review) {
          return _.find(selectedReviewers, {name: review.reviewer});
        })
      });
    }

    function filterCity(allRestaurants, selectedCities){
      // get restaurants that matches a selected cities
      return allRestaurants.filter(function (restaurant){
        //return true
        return _.find(selectedCities, {name: restaurant.location});
      })
    }

    return tempOutput;
  }
})

.service('filterService',function(){
  var self = this;

  this.allReviewers = [];
  this.allCities = [];

  function getSelectedOnly(array){
    return array.filter(function(item){
      return item.isSelected;
    })
  }

  this.getSelectedReviewers = function(){
    return getSelectedOnly(self.allReviewers)
  }

  this.getSelectedCities = function(){
    return getSelectedOnly(self.allCities)
  }


});

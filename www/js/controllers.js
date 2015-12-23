angular.module('starter.controllers', ['myService', 'ion-autocomplete'])

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

.controller('AddReviewCtrl', function($scope, $state, $stateParams, $q, Firebase, placesExplorerService, restaurantDataService) {

  // we will store all of the restaurant specific data here
  $scope.restaurantData = {};
  // we will store all of the reviewer's specific data here

  $scope.restaurantData.location = "New York";

  var self = this;

  $scope.search = function (query) {

    get4SquareRestaurants(query).then(function (data) {
      $scope.places = data;
      console.log(data);
    });
  }

  $scope.itemSelected = function(selected){
    $scope.selectedPlace = selected;
    $scope.placeSelected = true;

    //store info from fsquare and move to next view
    $scope.restaurantData.name = selected.name;
    $scope.restaurantData.address = selected.location.address;
    $scope.restaurantData.location = selected.location.city;
    $scope.restaurantData.fsquareID = selected.id;
    if ("crossStreet" in selected.location){
      $scope.restaurantData.crossStreet = selected.location.crossStreet;
    }
    else
    {
      $scope.restaurantData.crossStreet = "N/A"
    }
    $scope.restaurantData.longitude = selected.location.lng;
    $scope.restaurantData.latitude = selected.location.lat;

    restaurantDataService.RestaurantAttributes = $scope.restaurantData;

    $state.go('tab.add-review2', {}, {reload: true});
  };

  function get4SquareRestaurants(query){
    //var location = "New York";
    var defered = $q.defer();

    placesExplorerService.get({ near: $scope.restaurantData.location , query: query , limit: 4 },function(result){
      defered.resolve(result.response.minivenues);
      console.log(result.response)
    });
    return defered.promise;
  }

})

  .controller('AddReview2Ctrl', function($scope, $state, $stateParams, $q, Firebase, placesExplorerService, restaurantDataService) {

    console.log($scope.restaurantData);
    $scope.restaurantData = restaurantDataService.getRestaurant();
    // we will store all of the reviewer's specific data here
    $scope.reviewerData = {};

    $scope.foodChoices = [
      { text: "Good", value: 'good' },
      { text: "Amazing", value: 'amazing' }
    ];

    $scope.serviceChoices = [
      { text: "Good", value: 'good' },
      { text: "Amazing", value: 'amazing' }
    ];

    $scope.reviewerData = {
      food: 'good',
      service: 'good'

    };

    $scope.restaurantData.observations = [
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

    var self = this;

    $scope.AddPost = function(){
      $scope.reviewerData.reviewer = 'Jirain';

      var id = $scope.restaurantData.fsquareID;
      var manualId = $scope.restaurantData.name;
      var reviewer = $scope.reviewerData.reviewer;

      if (id == undefined){
        var firebaseID = manualId;
        var firebaseChild = "name";
      }
      else{
        var firebaseID = id;
        var firebaseChild = "fsquareID"
      }
      //add date to the reviewer list
      d = new Date();
      $scope.reviewerData.date = d.toDateString();

      // Making a copy so that you don't mess with original user input
      var payloadRestaurant = angular.copy($scope.restaurantData);
      var payloadReviewer = angular.copy($scope.reviewerData);

      // create restaurant object from firebase
      var restoRef = new Firebase('https://dazzling-heat-4525.firebaseio.com/restaurant');
      var reviewsUrl = "";
      var fbReviews = {};

      restoRef.orderByChild(firebaseChild).startAt(firebaseID).endAt(firebaseID).once('value', function(dataSnapshot) {
        //GET DATA

        if (dataSnapshot.exists()){
          var data = dataSnapshot.val();
          var key = Object.keys(data)[0];
          var masterList = consolidateObservation(data[key],$scope.restaurantData.observations);
          restoRef.child(key).set(masterList);
          reviewsUrl = 'https://dazzling-heat-4525.firebaseio.com/restaurant/' + key + "/reviews";
          fbReviews = new Firebase(reviewsUrl);
          fbReviews.push(payloadReviewer);
        }
        else{
          //var masterList1 = consolidateObservation(payloadRestaurant,$scope.restaurantData.observations);
          var pushedResto = restoRef.push(payloadRestaurant);
          reviewsUrl = 'https://dazzling-heat-4525.firebaseio.com/restaurant/' + pushedResto.key() + "/reviews";
          fbReviews = new Firebase(reviewsUrl);
          fbReviews.push(payloadReviewer);

        };

      });

      //consolidate observations into a master list
      function consolidateObservation(masterObservation,userObservation){
        for (var i in userObservation){
          if (userObservation[i].isSelected === true){
            // i need to fix this. I should refer to the name instead of the i
            masterObservation.observations[i] = angular.copy(userObservation[i]);
          }

        }
        return masterObservation;
      }

      $state.go('tab.reviewed', {}, {reload: true});

    };
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

//.service('filterService',function(){
//  var self = this;
//
//  this.allReviewers = [];
//  this.allCities = [];
//
//  function getSelectedOnly(array){
//    return array.filter(function(item){
//      return item.selected;
//    })
//  }
//
//  this.getSelectedReviewers = function(){
//    return getSelectedOnly(self.allReviewers)
//  }
//
//  this.getSelectedCities = function(){
//    return getSelectedOnly(self.allCities)
//  }
//
//})

.service('restaurantDataService', function(){
  var self = this;

  this.RestaurantAttributes = [];

  this.getRestaurant = function(){
    return self.RestaurantAttributes;
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


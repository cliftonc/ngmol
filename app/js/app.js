'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', ['myApp.filters', 'myApp.services', 'myApp.directives', 'ngSanitize']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'partials/channel.html', controller: ChannelColumnCtrl, reloadOnSearch: false});
    $routeProvider.when('/article/:articleId', {templateUrl: 'partials/article.html', controller: ArticleCtrl});
    $routeProvider.otherwise({redirectTo: '/'});
  }]);

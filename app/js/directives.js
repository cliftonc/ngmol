'use strict';

/* Directives */


angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
  .directive('ngTap', function() {
  	return function(scope, element, attrs) {
  		var tapping = false;
    	element.bind('touchstart', function() {
      		tapping = true;
    	});
    	element.bind('touchmove', function() {
			tapping = false;
    	});
    	element.bind('touchend', function() {
      		if(tapping) scope.$apply(attrs['ngTap']);
    	});
  	};
  });

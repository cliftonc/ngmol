'use strict';

/* Directives */


angular.module('myApp.directives', []).directive('ngFullHeight', function() {
    return function(scope, element, attrs) {               
      $(".channel-table").css("height", '1100px !important');
    }
  }) 
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
  })
  .directive('articleHtml', function($compile, $rootScope) {
 
    function getImage(article, id) {    

      //console.log('get image for ' + id);
      var image = _.find(article.aImages, function(image) {
        if(image.id == id) return image;
      })
      return '//i.mol.im' + image.url;

    }

    function processText(article) {

      if(!article) return;
    
      var processedTextDom = $('<div>' + article.aTxt + '</div>'),
        imageBoxes = $('.imgBox', processedTextDom);

      _.map(imageBoxes, function(imageBox) {

        var link = $('a', imageBox),
            img = $('a img', imageBox);

        link.attr('ng-click', link.attr('href').replace('dmapp:','').replace(':','(\'') + '\')');
        link.removeAttr('href');

        img.attr('ng-src', getImage(article, img.attr('id').replace('/','')));
        img.removeAttr('id');

      });

      return processedTextDom.html();

    }

     return function(scope, elm, attrs) {

        scope.$watch(attrs.articleHtml, function(newValue, oldValue) {

            elm.html(processText(newValue));
            $compile(elm.contents())(scope);

        });
    };

  });
   
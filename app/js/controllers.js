'use strict';


/* Controllers */
function ChannelColumnCtrl($scope, $route, $routeParams, $location, $http, $rootScope, ChannelService) {

	$scope.channels = $rootScope.channels;

	$scope.openArticle = function() {

		$location.path('/article/' + this.article.aId);
		$location.search('channel',this.channel.sn);

	}

	$scope.getImage = function(type) {		
		return '//i.mol.im' + this.article.images[type].url;
	}

	$scope.refreshChannel = function() {

		console.log('refreshing ' + this.channel.sn)

		var channel = this.channel.sn;

		ChannelService.get(channel, function(err, data) {	

			data.sn = channel; // copy sn into channel
			
			var arrIndex = $rootScope.channelSettingsData[channel].dataIndex;						
			$rootScope.channels.splice(arrIndex, 1, data);
			$scope.channels.splice(arrIndex, 1, data);

		});

	}

	// Listen for first instantiation
	$scope.$on("render", function(e) {		
		$scope.channels = $rootScope.channels;
	});

	$scope.$on("channelUpdated", function(e) {
		console.log(e);
	});
}

function ArticleCtrl($scope, $route, $compile, $routeParams, $rootScope, $http) {
	
	var channel = $routeParams.channel,
		articleId = $routeParams.articleId;

	$scope.imageClick = function() {
		console.log('clicker')
	}

	function getImage(article, id) {		

		console.log('get image for ' + id);
		var image = _.find(article.aImages, function(image) {
			if(image.id == id) return image;
		})
		return '//i.mol.im' + image.url;

	}

	function processText(article) {
		
		var processedTextDom = $('<div>' + article.aTxt + '</div>'),
			imageBoxes = $('.imgBox', processedTextDom);

		_.map(imageBoxes, function(imageBox) {

			var link = $('a', imageBox),
				img = $('a img', imageBox);

			link.attr('ng-click',link.attr('href').replace('dmapp:','').replace(':','(\'') + '\')');
			link.attr('href',null);
			img.attr('ng-src', getImage(article, img.attr('id').replace('/','')));
			img.attr('id', null);

		});

		return processedTextDom.html();
	}

	function render() {
		var articles = $rootScope.channels[$rootScope.channelSettingsData[$routeParams.channel].dataIndex].items;
		_.each(articles, function(article) {
			if(article.aId == articleId) {
				// We unfortunately need to process the article text				
				$scope.article = article;
				$('.x-innerhtml').append($compile(processText(article))($scope));
			}
		})
	}

	// If we already have data
	if($rootScope.channels) render();

	// Listen for first instantiation
	$scope.$on("render", function(e) {
		render();
	});
	
}

function ChannelNavigationCtrl($scope, $route, $routeParams, $http, $rootScope, Settings, ChannelService) {

	// Display the loading image
	$scope.loadingImage = 'img/loading/Default-Landscape.png';

	// We have user settings
	$scope.$on('userSettings', function(e, data) {			
		
		$rootScope.userSettings = data;
		$rootScope.$broadcast('settingsLoaded');

	})

	// We have server settings
	$scope.$on('serverSettings', function(e, data) {

		// Save for later		
		$rootScope.settings = data;

		// Push channels into a clean array
		$rootScope.channels = [];
		$rootScope.channelSettingsData = {};

		$rootScope.$broadcast('settingsLoaded');

	});

	$scope.$on('serverSettingsChanged', function(e, data) {

		// This means that we now have *NEW* settings from the server

	});	

	// We have now loaded both settings
	$scope.$on('settingsLoaded', function(e, data) {

		// if we don't have both yet exit
		if(!$rootScope.settings || !$rootScope.userSettings) return;

		console.log($rootScope.settings.channels);

		async.map($rootScope.settings.channels, 

			function(channel, cb) {			
				
				$rootScope.channelSettingsData[channel.sn] = channel;			

				// Check to see if we have the channel enabled locally
				var channelEnabled = _.indexOf($rootScope.userSettings.channels, channel.sn) !== -1;

				if(channelEnabled) {
					
					ChannelService.get(channel.sn, function(err, data) {	
						
						data.sn = channel.sn; // copy sn into channel
						$rootScope.channelSettingsData[channel.sn].dataIndex = $rootScope.channels.length;										
						$rootScope.channelSettingsData[channel.sn].enabled = true;										

						$rootScope.channels.push(data);
						$('.loadingStatus').append(channel.sn + ' ');
						cb();

					});		

				} else {

					$rootScope.channelSettingsData[channel.sn].enabled = false;	
					cb();
				}

			}, function(err) {

				// Draw the channel navigation
				$scope.loadingImage = null;
				$scope.channelSettings = $rootScope.settings.channels;	

				// broadcast that we should render channels
				$rootScope.$broadcast("render");
							
			});


	});

	$scope.changeChannel = function() {

		console.log(this.channel.sn + ' = ' + this.channel.enabled);
		Settings.update.SetChannel(this.channel.sn, this.channel.enabled, function() {
			$rootScope.$broadcast("render");	
		})		

	}

	Settings.get('GB');

	/*, function(err, data) {
		
		
		
		// Broadcast to enable channels to be requested
		async.map(data.subscribedChannels, 
			function(channel, cb) {			
				$rootScope.channelSettingsData[channel.sn] = channel;			
				ChannelService.get(channel.sn, function(err, data) {	
					data.sn = channel.sn; // copy sn into channel
					$rootScope.channelSettingsData[channel.sn].dataIndex = $rootScope.channels.length;										
					$rootScope.channels.push(data);
					$('.loadingStatus').append(channel.sn + ' ');
					cb();
				});		
			}, function(err) {

				// Draw the channel navigation
				$scope.loadingImage = null;
				$scope.channelSettings = data.subscribedChannels;	

				// broadcast
				$rootScope.$broadcast("render");		
							
			});

	});*/
        
}

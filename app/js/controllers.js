'use strict';


/* Controllers */
function ChannelColumnCtrl($scope, $route, $routeParams, $timeout, $location, $http, $rootScope, ChannelService) {

	// Default View
	// $scope.channels = $rootScope.channels;

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
		console.log('on channel render');		
		$scope.channels = $rootScope.channels;			
		$timeout(function() { $scope.$root.$eval() }, 200)
	});

	$scope.$on("channelUpdated", function(e) {
		console.log(e);
	});
}

function ArticleCtrl($scope, $route, $compile, $routeParams, $rootScope, $http) {
	
	var channel = $routeParams.channel,
		articleId = $routeParams.articleId;
	
    $scope.imgClick = function(imageId) {
      console.log('clicker ' + imageId);
      return false;
    }

	function render() {
		var articles = $rootScope.channels[$rootScope.channelSettingsData[$routeParams.channel].dataIndex].items;
		_.each(articles, function(article) {
			if(article.aId == articleId) {									
				$scope.article = article;
			}
		})
	}

	// If we already have data
	if($rootScope.channels) {
		console.log('have channel data')
		render();
	}

	// Listen for first instantiation - load on articel page
	$scope.$on("render", function(e) {
		console.log('on article render');
		render();
	});
	
}

function ChannelNavigationCtrl($scope, $route, $routeParams, $http, $rootScope, $timeout, Settings, ChannelService) {

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
		console.log('we have new server settings');

	});	

	// We have now loaded both settings
	$scope.$on('settingsLoaded', function(e, data) {

		// if we don't have both yet exit
		if(!$rootScope.settings || !$rootScope.userSettings) return;

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
				$scope.channelSettings = $rootScope.settings.channels;	

				// broadcast that we should render channels
				$rootScope.$broadcast("render");				

				$timeout(function() { $scope.loadingImage = null }, 300);
							
			});


	});

	$scope.changeChannel = function() {

		var self = this;
		Settings.update.SetChannel(self.channel.sn, self.channel.enabled, function() {

			//if(!self.channel.enabled) {
			//	// Remove it				
			//	$rootScope.channels.splice($rootScope.channelSettingsData[self.channel.sn].dataIndex, 1);				
		///	}

			$rootScope.$broadcast("render");	

		})		

	}

	Settings.get('GB');
        
}

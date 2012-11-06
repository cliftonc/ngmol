
angular.module('myApp.services', ['ngResource'])
  .factory('ChannelData', function($resource, $location) {
    
    return $resource("http://content.dailymail.co.uk/molcontent/tablet/feed/readchannel/:channel/format=jsonp/",
    	{callback:'JSON_CALLBACK'},
        {get:{method:'JSONP'}}
    );
  }).factory('SettingsData', function($resource, $location) {
    
    return $resource("http://content.dailymail.co.uk/molcontent/mobile/feed/readsettings/iphone/geo=:geo/format=jsonp/",
    	{callback:'JSON_CALLBACK'},
        {get:{method:'JSONP'}}
    );

  }).factory('Settings', function(SettingsData, $q, $rootScope) {  	
    
    // Channel Settings from server
    var GetSettingsFromServer = function(geo, cb) {
    	if($rootScope.debug) console.log('getting from server for ' + geo)
		SettingsData.get({geo:'GB'}, function(settingsData) {					
			cb(null, settingsData)
		});
    }

    var GetSettingsFromStore = function(geo, cb) {
    	 if($rootScope.debug) console.log('getting from store ' + geo)
    	 Lawnchair(function() {
    	 	this.get('settings:' + geo, function(result) {
    	 		if(result) {    	 			
    	 			cb(null, result.value);	
    	 		} else {
    	 			cb();
    	 		}    	 		
    	 	})
    	 });
    }

     var GetUserSettingsFromStore = function(cb) {
    	 if($rootScope.debug) console.log('getting user settings from store ' + geo)
    	 Lawnchair(function() {
    	 	this.get('user:settings', function(result) {
    	 		if(result) {    	 			
    	 			cb(null, result.value);	
    	 		} else {
    	 			var toSave = {
    	 				key:"user:settings",
    	 				value: {
    	 					channels: ['home','tvshowbiz','news','sport']
    	 				}
    	 			}
    	 			this.save(toSave);
    	 			cb(null, toSave.value);
    	 		}    	 		
    	 	})
    	 });
    }

    // Helpers to update user settings
    var UpdateUserSettings = {
    	
    	SetChannel: function(channel, value, cb) {

			var toSave = {
 				key:"user:settings",
 				value: {}
			}

    		Lawnchair(function() {
    	 		this.get('user:settings', function(result) {
    				if(result) {
    					toSave.value = result.value;
    					if(!value) {
	    					toSave.value.channels = _.without(toSave.value.channels,channel);
		    			} else {
		    				toSave.value.channels.push(channel);
		    			}
    				} else {
    					toSave.value.channels = [];
    					toSave.value.channels.push(channel);    					
    				}
    				this.save(toSave);
    				cb();
    			});
    		});    
    				
    	}    	
    }

     // Figure out if we have new data or not;
    var isDifferent = function(newData, oldData) {
    	return JSON.stringify(newData) !== JSON.stringify(oldData);    	
    }

    var GetSettings = function(geo) {
       
      GetUserSettingsFromStore(function(err, userData) {
       	
       	$rootScope.$broadcast('userSettings', userData);

        GetSettingsFromStore(geo, function(err, storeData) {
        
        	// Keep track of if we have called back or not
        	var doneCb = false;

        	// If we have data locally, always return it immediately        	
        	if(!err && storeData) {
        		doneCb = true;
        		if($rootScope.debug) console.log('calling back from store')	        	
	        	$rootScope.$broadcast('serverSettings', storeData);
	        }
        	
        	// Get it from the server now regardless
        	GetSettingsFromServer(geo, function(err, serverData) {
        		
        		if(!storeData || isDifferent(storeData, serverData)) {
        			var toSave = {
				        key: "settings:" + geo,
				        value: serverData
				    }				             			
				    Lawnchair(function() {
				    	this.save(toSave);
					});

					// Check if server data is different, if so, raise a second event:
	        		$rootScope.$broadcast('serverSettingsChanged', serverData);

        		}

        		// Deal with the first ever load
        		if(!doneCb) $rootScope.$broadcast('serverSettings', serverData);

        	});        	        	        	 

        });

      });

    }

    return {
    	get: GetSettings,
    	update: UpdateUserSettings
    }
    
  }).factory('ChannelService', function($resource, $location, ChannelData, $q, $rootScope) {

  	  // Channel Settings from server
    var GetDataFromServer = function(channel, cb) {
    	if($rootScope.debug) console.log('getting from server for ' + channel)
    	var self = this;
    
		ChannelData.get({channel:channel}, function(channelData) {					
			cb(null, channelData)
		});
    }

    var GetDataFromStore = function(channel, cb) {
    	if($rootScope.debug) console.log('getting from store ' + channel)
    	var self = this;
    	 Lawnchair(function() {
    	 	this.get('channel:' + channel, function(result) {
    	 		if(result) {    	 			
    	 			cb(null, result.value);	
    	 		} else {
    	 			cb();
    	 		}    	 		
    	 	})
    	 });
    }

    // Figure out if we have new data or not;
    var isDifferent = function(newData, oldData, compareProperty) {
    	var different = _.difference(_.pluck(newData.items, compareProperty), _.pluck(oldData.items, compareProperty));
    	return different.length > 0;
    }

    var GetData = function(channel, cb) {
        
        var self = this;

        GetDataFromStore(channel, function(err, storeData) {
        
        	// Keep track of if we have called back or not
        	var doneCb = false;

        	// If we have data locally, always return it immediately        	
        	if(!err && storeData) {
        		doneCb = true;
        		//if($rootScope.debug) console.log('calling back from store')
	        	cb(null, storeData);
	        }
        	
        	// Get it from the server now regardless
        	GetDataFromServer(channel, function(err, serverData) {
        		
        		if(!storeData || isDifferent(serverData, storeData, 'aId')) {        		
        			var toSave = {
				        key: "channel:" + channel,
				        value: serverData
				    }				             			
				    Lawnchair(function() {
				    	this.save(toSave);
					});

					// Broadcast 
					if(storeData) $rootScope.$broadcast('channelUpdated', serverData);

        		}
        		
        		if(!doneCb) cb(err, serverData); 		

        	});        	        	        	 

        });

    }

    return {
    	get: GetData
    };

  });


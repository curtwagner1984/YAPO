angular.module('playlistList').component('playlistList', {
    // Note: The URL is relative to our `index.html` file
    templateUrl: ['$element', '$attrs', function ($element, $attrs) {

        // if ($attrs.viewStyle == 'grid') {
        //     return 'static/js/app/scene-list/scene-list-grid.template.html'
        // } else {
        return 'static/partials/lists/general-list/general-list-template.html';
        // }


    }],
    bindings: {
        mainPage: '=',
        treeFolder: '='
    },
    controller: ['$scope', '$http', '$rootScope', 'Playlist', 'helperService', 'scopeWatchService',
        function PlaylistListController($scope, $http, $rootScope, Playlist, helperService, scopeWatchService) {

            var self = this;
            var didSectionListWrapperLoad = false;

            self.pageType = 'Playlist';

            self.linkAid = "playlist";


            self.advSearchString = undefined;
            self.advSearchObject = {};


            // Wrapper for the Dynamic Items object in nav-bar.component.
            // It's responsible for the infinite scroll.

            var DynamicItems = function () {
                this.dI = new $rootScope.DynamicItems();
            };

            DynamicItems.prototype.updateQuery_ = function () {
                this.dI.pageType = self.pageType;
                this.dI.advSearch = self.advSearchString;
                this.dI.sortBy = self.sortBy;
            };

            DynamicItems.prototype.reset = function (caller) {
                this.dI.reset(caller);
            };

            DynamicItems.prototype.getItemAtIndex = function (index) {
                return this.dI.getItemAtIndex(index)
            };

            DynamicItems.prototype.getLength = function () {
                return this.dI.getLength()
            };

            DynamicItems.prototype.nextPage = function (pageNumber, isCalledFromDynamicItems) {
                this.updateQuery_();
                this.dI.nextPage(pageNumber, isCalledFromDynamicItems)
            };


            this.dynamicItems = new DynamicItems();
            this.dynamicItems.updateQuery_();


            $scope.$on("searchTermChanged", function (event, searchTerm) {
                if (searchTerm['sectionType'] == 'PlaylistList'){


                    var searchedItem = searchTerm['searchTerm'];
                    var searchType = 'playlist_properties_' + searchTerm['searchField'];

                    self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject,searchType,searchedItem, true);
                    self.dynamicItems.reset();
                    self.dynamicItems.nextPage(0, false);
                }


            });

            $scope.$on("sortOrderChanged", function (event, sortOrder) {
                if (sortOrder['sectionType'] == 'PlaylistList'){
                    console.log("Sort Order Changed!");

                    self.sortBy = sortOrder['sortBy'];
                     if (sortOrder.mainPage == undefined || sortOrder.mainPage == true ) {
                        self.dynamicItems.reset();
                        self.dynamicItems.nextPage(0, false);
                    }
                    didSectionListWrapperLoad = true;
                }

            });

            if (!didSectionListWrapperLoad) {
                scopeWatchService.didSectionListWrapperLoaded('PlaylistList')
            }
            
            
            
            
            // $http.get('api/playlist/', {}).then(function (response) {
            //     // alert(angular.toJson(response));
            //     self.playlists = response.data;
            //     self.response = response;
            //     // alert("Got response from server: " + self.pathToFolderToAdd);
            // }, function errorCallback(response) {
            //     alert("Something went wrong!");
            // });


            self.removePlaylist = function (playlistToRemove) {

                Playlist.remove({playlistId: playlistToRemove.id});

                var found = helperService.getObjectIndexFromArrayOfObjects(playlistToRemove,self.playlists);

                if(found != null){
                    self.playlists.splice(found,1)
                }



            }

        }]
});
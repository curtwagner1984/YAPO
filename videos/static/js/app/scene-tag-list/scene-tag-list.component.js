// Register `phoneList` component, along with its associated controller and template
angular.module('sceneTagList').component('sceneTagList', {
    // Note: The URL is relative to our `index.html` file
    templateUrl: 'static/js/app/scene-tag-list/scene-tag-list.template.html',
    bindings: {
        mainPage: '='
    },
    controller: ['$scope', 'SceneTag', 'scopeWatchService', 'pagerService', 'helperService','$rootScope',
        function SceneTagListController($scope, SceneTag, scopeWatchService, pagerService, helperService ,$rootScope) {

            var self = this;
            var didSectionListWrapperLoad = false;
            // self.tags = [];
            self.pageType = 'SceneTag';


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



            $scope.$on("sceneLoaded", function (event, scene) {
                self.scene = scene;
                self.dynamicItems.reset();
                self.dynamicItems.nextPage(0, false);


            });

            


            $scope.$on("addSceneTagToList", function (event, sceneTag) {
                self.tags.push(sceneTag)
            });

            $scope.$on("searchTermChanged", function (event, searchTerm) {
                if (searchTerm['sectionType'] == 'SceneTagList'){
                    self.tags = [];
                    
                    var searchedItem = searchTerm['searchTerm'];
                    var searchType = 'scene_tag_properties_' + searchTerm['searchField'];

                    self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject,searchType,searchedItem, true);
                    self.dynamicItems.reset();
                    self.dynamicItems.nextPage(0, false);  
                }
                

            });

            $scope.$on("sortOrderChanged", function (event, sortOrder) {
                if (sortOrder['sectionType'] == 'SceneTagList'){
                    console.log("Sort Order Changed!");
                    self.tags = [];
                    self.sortBy = sortOrder['sortBy'];
                     if (sortOrder.mainPage == undefined || sortOrder.mainPage == true ) {
                        self.dynamicItems.reset();
                        self.dynamicItems.nextPage(0, false);
                    }
                    didSectionListWrapperLoad = true;
                }
                
            });

            if (!didSectionListWrapperLoad) {
                scopeWatchService.didSectionListWrapperLoaded('SceneTagList')
            }


            self.deleteSceneTag = function (tagToDelete) {
                // alert("delete scene tag was clicked!");
                if (angular.isObject(self.scene)) {
                    // self.pk.splice(self.pk.indexOf(aliasToDelete.id), 1);
                    // alert(angular.toJson(self.actor.actor_tags));
                    // alert(angular.toJson(tagToDelete));
                    // alert(angular.toJson(self.actor.actor_tags.indexOf(tagToDelete.id)));

                    var res = helperService.removeObjectFromArrayOfObjects(tagToDelete,self.tags);

                    console.log(res['resId']);
                    self.scene.scene_tags = res['resId'];
                    scopeWatchService.sceneChanged(self.scene);

                    self.tags = res['resObject'];


                    // self.actor.actor_tags.splice(self.actor.actor_tags.indexOf(tagToDelete.id,1));
                    // alert(angular.toJson(self.actor.actor_tags));
                }
            };
            
            self.deleteSceneTagFromDb = function (tagToDelete) {
                
                SceneTag.remove({sceneTagId: tagToDelete.id});

                var ans = helperService.removeObjectFromArrayOfObjects(tagToDelete,self.tags);

                self.tags = ans['resObject'];
                
            }

        }
    ]
});
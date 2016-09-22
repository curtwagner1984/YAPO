// Register `phoneList` component, along with its associated controller and template
angular.module('actorTagList').component('actorTagList', {
    // Note: The URL is relative to our `index.html` file
    templateUrl: 'static/partials/lists/general-list/general-list-template.html',
    bindings: {
        mainPage: '='
    },
    controller: ['$scope', 'ActorTag', 'pagerService', 'scopeWatchService', 'helperService','$rootScope',
        function ActorTagListController($scope, ActorTag, pagerService, scopeWatchService, helperService, $rootScope) {

            // this.tags = ActorTag.query();


            var self = this;
            var didSectionListWrapperLoad = false;
            self.pageType = 'ActorTag';
            self.linkAid = "actor-tag";

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


            $scope.$on("actorLoaded", function (event, actor) {
                self.actor = actor;

                self.dynamicItems.reset();
                self.dynamicItems.nextPage(0, false);


            });



            $scope.$on("addActorTagToList", function (event, actorTag) {
                self.tags.push(actorTag)


            });

            $scope.$on("searchTermChanged", function (event, searchTerm) {
                if (searchTerm['sectionType'] == 'ActorTagList') {
                    self.tags = [];
                    var searchedItem = searchTerm['searchTerm'];
                    var searchType = 'actor_tag_properties_' + searchTerm['searchField'];

                    self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject,searchType,searchedItem, true);
                    self.dynamicItems.reset();
                    self.dynamicItems.nextPage(0, false);
                }

            });

            $scope.$on("sortOrderChanged", function (event, sortOrder) {
                if (sortOrder['sectionType'] == 'ActorTagList') {
                    console.log("Sort Order Changed!");
                    self.tags = [];
                    self.sortBy = sortOrder['sortBy'];
                    if (sortOrder.mainPage == undefined || sortOrder.mainPage == true) {
                        self.dynamicItems.reset();
                        self.dynamicItems.nextPage(0, false);
                    }
                    didSectionListWrapperLoad = true;
                }

            });

            if (!didSectionListWrapperLoad) {
                scopeWatchService.didSectionListWrapperLoaded('ActorTagList')
            }


            self.deleteActorTag = function (tagToDelete) {

                if (angular.isObject(self.actor)) {
                    // self.pk.splice(self.pk.indexOf(aliasToDelete.id), 1);
                    // alert(angular.toJson(self.actor.actor_tags));
                    // alert(angular.toJson(tagToDelete));
                    // alert(angular.toJson(self.actor.actor_tags.indexOf(tagToDelete.id)));


                    var res = helperService.removeObjectFromArrayOfObjects(tagToDelete, self.tags);

                    // var resId = [];
                    // var resObject = [];
                    // for (i = 0; i < self.tags.length; i++) {
                    //     if (self.tags[i].id != tagToDelete.id) {
                    //         resId.push(self.tags[i].id);
                    //         resObject.push(self.tags[i]);
                    //     }
                    // }

                    self.actor.actor_tags = res['resId'];


                    scopeWatchService.actorChaned(self.actor);

                    self.tags = res['resObject'];


                    // self.actor.actor_tags.splice(self.actor.actor_tags.indexOf(tagToDelete.id,1));
                    // alert(angular.toJson(self.actor.actor_tags));
                }
            };

            self.deleteActorTagFromDb = function (tagToDelete) {

                // var index = helperService.getObjectIndexFromArrayOfObjects(tagToDelete,self.tags);

                ActorTag.remove({actorTagId: tagToDelete.id});

                var ans = helperService.removeObjectFromArrayOfObjects(tagToDelete, self.tags);

                self.tags = ans['resObject'];


            }


        }
    ]
});
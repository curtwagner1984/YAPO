// Register `phoneList` component, along with its associated controller and template
angular.module('actorList').component('actorList', {
    // Note: The URL is relative to our `index.html` file
    bindings: {

        mainPage: '=',
        callingObject: '=',
        callingObjectType: '='

    },
    templateUrl: ['$element', '$attrs', function ($element, $attrs) {

        // self.gridView = false;
        if ($attrs.sceneDetail == 'true') {
            return 'static/js/app/actor-list/actor-list-row.template.html';

            // }else if ($attrs.viewStyle == 'grid'){
            //     self.gridView = true;
            //     return 'static/js/app/actor-list/actor-list-grid.template.html'
        } else {
            return 'static/js/app/actor-list/actor-list.template.html'
        }


    }],

    controller: ['$scope', 'Actor', 'pagerService', 'Scene', 'ActorTag', 'scopeWatchService', 'helperService',
        '$timeout', '$rootScope',
        function ActorListController($scope, Actor, pagerService, Scene, ActorTag, scopeWatchService, helperService,
                                     $timeout, $rootScope) {


            var self = this;

            var didSceneLoad = false;
            var didActorTagLoad = false;
            var didSectionListWrapperLoad = false;

            self.actors = [];
            self.gridView = false;
            self.ordering = "name";
            self.pageType = 'Actor';

            self.advSearchString = undefined;
            self.advSearchObject = {};

            $rootScope.setItemsPerRowActor();
            try {
                $rootScope.closeRight();
                $rootScope.updateWidth("right");
            } catch (err) {
                console.log("Caught error")
            }


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

            DynamicItems.prototype.getLoadedItems = function () {

                return this.dI.getLoadedItems();
            };

            DynamicItems.prototype.setLoadedItems = function (loadedItemsToSet) {
                this.dI.setLoadedItems(loadedItemsToSet)
            };


            this.dynamicItems = new DynamicItems();
            this.dynamicItems.updateQuery_();


            var checkGridOption = function () {
                if ((helperService.getGridView() != undefined) && (helperService.getGridView()['actor'] != undefined)) {
                    self.gridView = helperService.getGridView()['actor']
                }

                if (self.gridView) {
                    if (!self.dynamicItems.dI.isGrid) {
                        self.dynamicItems.dI.isGrid = true;
                        var tmp = helperService.list2Grid(self.dynamicItems.getLoadedItems());
                        self.dynamicItems.setLoadedItems(tmp);
                    }

                } else {
                    if (self.dynamicItems.dI.isGrid) {
                        self.dynamicItems.dI.isGrid = false;
                        var tmp = helperService.grid2List(self.dynamicItems.getLoadedItems());
                        self.dynamicItems.setLoadedItems(tmp);
                    }

                }
            };

            checkGridOption();

            $scope.$on("gridViewOptionChnaged", function (event, pageInfo) {
                checkGridOption()
            });

            var currentNumberOfItemsPerRow = undefined;

            $scope.$on("widthChanged", function (event, width) {
                $rootScope.ITEMS_PER_ROW = Math.floor($rootScope.currentWidth / 256);
                if ($rootScope.ITEMS_PER_ROW < 1) {
                    $rootScope.ITEMS_PER_ROW = 1;
                }
                if ((currentNumberOfItemsPerRow == undefined) ||
                    (currentNumberOfItemsPerRow != $rootScope.ITEMS_PER_ROW) ||
                    gotItemAtIndex) {

                    // $scope.$apply();
                    $timeout(function () {
                        // anything you want can go here and will safely be run on the next digest.
                        self.dynamicItems.setLoadedItems(helperService.gridChangeNumberOfRows(self.gridView,self.dynamicItems.getLoadedItems()));
                        currentNumberOfItemsPerRow = $rootScope.ITEMS_PER_ROW;
                    })
                }
            });


            $scope.$on("addActorToList", function (event, changedActor) {
                self.actors.push((changedActor));
            });

            $scope.$on("actorTagLoaded", function (event, loadedActorTag) {
                self.actors = [];
                self.actorTag = loadedActorTag;
                
                self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject,'actor_properties_actor_tags',loadedActorTag, true);
                self.dynamicItems.reset();
                self.dynamicItems.nextPage(0, false);

                // self.nextPage(0);
                didActorTagLoad = true

            });


            $scope.$on("sceneLoaded", function (event, scene) {

                self.actors = [];
                self.scene = scene;
                // self.nextPage(0);
                self.dynamicItems.reset();
                self.dynamicItems.nextPage(0, false);
                didSceneLoad = true;

            });

            $scope.$on("sortOrderChanged", function (event, sortOrder) {
                if (sortOrder['sectionType'] == 'ActorList') {
                    console.log("Sort Order Changed!");
                    self.actors = [];
                    self.sortBy = sortOrder['sortBy'];
                    self.dynamicItems.reset();

                    if (sortOrder.mainPage == undefined || sortOrder.mainPage == true) {
                        // self.nextPage(0);
                        self.dynamicItems.nextPage(0, false)
                    }
                    didSectionListWrapperLoad = true;
                }

            });

            $scope.$on("searchTermChanged", function (event, searchTerm) {
                if (searchTerm['sectionType'] == 'ActorList') {
                    self.actors = [];
                    self.dynamicItems.reset();
                    var searchedItem = searchTerm['searchTerm'];
                    var searchType = 'actor_properties_' + searchTerm['searchField'];

                    self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject,searchType,searchedItem, true);


                    // self.nextPage(0);
                    self.dynamicItems.nextPage(0, false)
                }


            });


            $scope.$on("runnerUpChanged", function (event, runnerUp) {
                if (runnerUp['sectionType'] == 'ActorList') {
                    console.log("Runner up Changed!");
                    self.actors = [];
                    self.dynamicItems.reset();
                    self.runnerUp = runnerUp['runnerUp'];

                    var temp;
                    if (runnerUp['runnerUp']) {
                        temp = '1'
                    } else {
                        temp = ''
                    }

                    self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject,'actor_properties_is_runner_up', temp, true);
                    self.dynamicItems.reset('runnerUpChanged');
                    self.dynamicItems.nextPage(0, false);
                }

            });

            if (!didSceneLoad) {
                scopeWatchService.didSceneLoad('a')
            }

            if (!didActorTagLoad) {
                scopeWatchService.didActorTagLoad('a')
            }

            if (!didSectionListWrapperLoad) {
                scopeWatchService.didSectionListWrapperLoaded('ActorList')
            }


            self.removeActorFromScene = function (actorToRemove) {
                console.log("actor-list: function removeActorFromScene was triggered");
                if (angular.isObject(self.scene)) {
                    var resId = [];
                    var resObj = [];

                    for (var i = 0; i < self.actors.length; i++) {
                        if (self.actors[i].id != actorToRemove.id) {
                            resId.push(self.actors[i].id);
                            resObj.push(self.actors[i]);
                        }
                    }


                    self.scene.actors = resId;

                    scopeWatchService.sceneChanged(self.scene);

                    self.actors = resObj;

                }
            };

            self.deleteActor = function (actorToRemove) {
                Actor.remove({actorId: actorToRemove.id});

                var ans = helperService.removeObjectFromArrayOfObjects(actorToRemove, self.actors);

                self.actors = ans['resObject'];
            };

            self.patchActor = function (actorToPatch, patchInfo) {

                Actor.patch({actorId: actorToPatch.id}, patchInfo)
            };

            self.setRating = function (actor) {
                var patchInfo = {'rating': actor.rating};

                self.patchActor(actor, patchInfo)

            };

            self.toggleRunnerUp = function (actor) {
                var patchInfo = {'is_runner_up': actor.is_runner_up};

                self.patchActor(actor, patchInfo)

            };


        }

    ]
});
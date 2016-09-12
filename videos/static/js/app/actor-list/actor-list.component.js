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

    controller: ['$scope', 'Actor', 'pagerService', 'Scene', 'ActorTag', 'scopeWatchService', 'helperService', '$timeout',
        function ActorListController($scope, Actor, pagerService, Scene, ActorTag, scopeWatchService, helperService, $timeout) {


            var self = this;

            var didSceneLoad = false;
            var didActorTagLoad = false;
            var didSectionListWrapperLoad = false;


            // AM deferred loading wrapper https://material.angularjs.org/latest/demo/virtualRepeat

            // In this example, we set up our model using a class.
            // Using a plain object works too. All that matters
            // is that we implement getItemAtIndex and getLength.
            var DynamicItems = function () {
                /**
                 * @type {!Object<?Array>} Data pages, keyed by page number (0-index).
                 */
                this.loadedPages = {};

                /** @type {number} Total number of items. */
                this.numItems = 0;

                /** @const {number} Number of items to fetch per request. */
                if (helperService.getNumberOfItemsPerPaige() != undefined) {
                    this.PAGE_SIZE = helperService.getNumberOfItemsPerPaige();
                } else {
                    this.PAGE_SIZE = 10;
                }


                this.fetchNumItems_();
            };


            DynamicItems.prototype.reset = function () {
                this.loadedPages = {};
                this.numItems = 0;

            };

            // Required.
            DynamicItems.prototype.getItemAtIndex = function (index) {
                var pageNumber = Math.floor(index / this.PAGE_SIZE);
                var page = this.loadedPages[pageNumber];

                if (page) {
                    return page[index % this.PAGE_SIZE];
                } else if (page !== null) {
                    this.fetchPage_(pageNumber);
                }
            };

            // Required.
            DynamicItems.prototype.getLength = function () {
                return this.numItems;
            };

            DynamicItems.prototype.nextPage = function (pageNumber, wasCalledFromDynamicItems) {

                var loadedPages = this.loadedPages;

                var input = {
                    currentPage: pageNumber,
                    pageType: self.pageType,
                    scene: self.scene,
                    searchTerm: self.searchTerm,
                    searchField: self.searchField,
                    sortBy: self.sortBy,
                    actorTag: self.actorTag,
                    isRunnerUp: self.runnerUp


                };

                self.actorsToadd = pagerService.getNextPage(input);
                if (self.actorsToadd != undefined) {
                    self.actorsToadd.$promise.then(function (res) {

                        // self.actorsToadd = res[0];

                        var paginationInfo = {
                            pageType: input.pageType,
                            pageInfo: res[1]
                        };

                        self.totalItems = parseInt(paginationInfo.pageInfo.replace(/.*<(\d+)>; rel="count".*/, '$1'));

                        scopeWatchService.paginationInit(paginationInfo);

                        self.websites = helperService.resourceToArray(res[0]);

                        if (wasCalledFromDynamicItems) {
                            for (var i = 0; i < self.websites.length; i++) {
                                loadedPages[pageNumber].push(self.websites[i])
                            }

                            this.loadedPages = loadedPages;
                        } else {
                            if (self.totalItems == -6) {
                                self.totalItems = self.websites.length;
                            }

                            self.dynamicItems.numItems = self.totalItems;

                        }


                    });
                }

            };

            DynamicItems.prototype.fetchPage_ = function (pageNumber) {
                // Set the page to null so we know it is already being fetched.
                this.loadedPages[pageNumber] = null;

                // For demo purposes, we simulate loading more items with a timed
                // promise. In real code, this function would likely contain an
                // $http request.
                $timeout(angular.noop, 300).then(angular.bind(this, function () {
                    this.loadedPages[pageNumber] = [];

                    this.nextPage(pageNumber, true);


                    // var pageOffset = pageNumber * this.PAGE_SIZE;
                    // for (var i = pageOffset; i < pageOffset + this.PAGE_SIZE; i++) {
                    //   this.loadedPages[pageNumber].push(i);
                    // }
                }));
            };

            DynamicItems.prototype.fetchNumItems_ = function () {
                // For demo purposes, we simulate loading the item count with a timed
                // promise. In real code, this function would likely contain an
                // $http request.

                $timeout(angular.noop, 500).then(angular.bind(this, function () {
                    this.numItems = self.totalItems;
                }));
            };

            this.dynamicItems = new DynamicItems();


            self.actors = [];

            self.ordering = "name";
            self.pageType = 'Actor';


            self.gridView = false;


            var checkGridOption = function () {
                if ((helperService.getGridView() != undefined) && (helperService.getGridView()['actor'] != undefined)) {
                    self.gridView = helperService.getGridView()['actor']
                }
            };

            checkGridOption();

            $scope.$on("gridViewOptionChnaged", function (event, pageInfo) {
                checkGridOption()
            });


            // self.nextPage = function (currentPage) {
            //
            //
            //     input = {
            //         currentPage: currentPage,
            //         pageType: self.pageType,
            //         actorTag: self.actorTag,
            //         scene: self.scene,
            //         searchTerm: self.searchTerm,
            //         searchField: self.searchField,
            //         sortBy: self.sortBy,
            //         isRunnerUp: self.runnerUp
            //
            //     };
            //
            //
            //     self.actorsToadd = pagerService.getNextPage(input);
            //
            //     self.actorsToadd.$promise.then(function (res) {
            //
            //         // self.actorsToadd = res[0];
            //
            //         var paginationInfo = {
            //             pageType: input.pageType,
            //             pageInfo: res[1]
            //         };
            //
            //         scopeWatchService.paginationInit(paginationInfo);
            //
            //         self.actors = helperService.resourceToArray(res[0]);
            //
            //
            //     });
            //
            //
            // };

            // if (self.mainPage) {
            //     console.log("main page is true! + " + self.mainPage);
            //     self.actorsToadd = self.nextPage(0);
            // }

            $scope.$on("paginationChange", function (event, pageInfo) {
                if (pageInfo.pageType == self.pageType) {
                    // self.nextPage(pageInfo.page)
                }
            });

            $scope.$on("addActorToList", function (event, changedActor) {
                self.actors.push((changedActor));
            });

            $scope.$on("actorTagLoaded", function (event, loadedActorTag) {
                self.actors = [];
                self.actorTag = loadedActorTag;
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

            if (!didSceneLoad) {
                scopeWatchService.didSceneLoad('a')
            }

            if (!didActorTagLoad) {
                scopeWatchService.didActorTagLoad('a')
            }

            if (!didSectionListWrapperLoad) {
                scopeWatchService.didSectionListWrapperLoaded('ActorList')
            }


            $scope.$on("searchTermChanged", function (event, searchTerm) {
                if (searchTerm['sectionType'] == 'ActorList') {
                    self.actors = [];
                    self.dynamicItems.reset();
                    self.searchTerm = searchTerm['searchTerm'];
                    self.searchField = searchTerm['searchField'];
                    // self.nextPage(0);
                    self.dynamicItems.nextPage(0, false)
                }


            });


            $scope.$on("runnerUpChanged", function (event, runnerUp) {
                if (runnerUp['sectionType'] == 'ActorList') {
                    console.log("Sort Order Changed!");
                    self.actors = [];
                    self.dynamicItems.reset();
                    self.runnerUp = runnerUp['runnerUp'];
                    // self.nextPage(0);
                    self.dynamicItems.nextPage(0, false)
                }

            });

            self.removeActorFromScene = function (actorToRemove) {
                console.log("actor-list: function removeActorFromScene was triggered");
                if (angular.isObject(self.scene)) {
                    // self.pk.splice(self.pk.indexOf(aliasToDelete.id), 1);
                    // alert(angular.toJson(self.actor.actor_tags));
                    // alert(angular.toJson(tagToDelete));
                    // alert(angular.toJson(self.actor.actor_tags.indexOf(tagToDelete.id)));
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
                    // self.pk = res;


                    // self.actor.actor_tags.splice(self.actor.actor_tags.indexOf(tagToDelete.id,1));
                    // alert(angular.toJson(self.actor.actor_tags));
                }
            };

            self.deleteActor = function (actorToRemove) {
                Actor.remove({actorId: actorToRemove.id});

                var ans = helperService.removeObjectFromArrayOfObjects(actorToRemove, self.actors);
                // var resId = [];
                //     var resObj = [];
                //
                //     for (var i = 0; i < self.actors.length; i++) {
                //         if (self.actors[i].id != actorToRemove.id) {
                //             resId.push(self.actors[i].id);
                //             resObj.push(self.actors[i]);
                //         }
                //     }
                //
                //
                //     // self.scene.actors = resId;
                //
                //     // scopeWatchService.sceneChanged(self.scene);

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
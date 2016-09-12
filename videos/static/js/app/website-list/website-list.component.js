// Register `phoneList` component, along with its associated controller and template
angular.module('websiteList').component('websiteList', {
    // Note: The URL is relative to our `index.html` file
    templateUrl: 'static/js/app/website-list/website-list.template.html',
    bindings: {
        mainPage: '='
    },
    controller: ['Website', '$scope', 'pagerService', 'scopeWatchService', 'helperService', '$timeout',

        function websiteListController(Website, $scope, pagerService, scopeWatchService, helperService, $timeout) {

            var self = this;
            var didSectionListWrapperLoad = false;
            self.pageType = 'Website';


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
                    sortBy: self.sortBy
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

                    this.nextPage(pageNumber,true);


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



            $scope.$on("sceneLoaded", function (event, scene) {
                self.scene = scene;
                // self.nextPage(0);
                self.dynamicItems.nextPage(0,false)


            });

            $scope.$on("paginationChange", function (event, pageInfo) {
                if (pageInfo.pageType == self.pageType) {
                    self.dynamicItems.nextPage(pageInfo.page,false)
                }
            });

            $scope.$on("addWebsiteToList", function (event, website) {
                self.websites.push(website)


            });

            $scope.$on("searchTermChanged", function (event, searchTerm) {
                if (searchTerm['sectionType'] == 'WebsiteList') {
                    self.websites = [];
                    self.searchTerm = searchTerm['searchTerm'];
                    self.searchField = searchTerm['searchField'];
                    self.dynamicItems.reset();

                    self.dynamicItems.nextPage(0,false);
                }


            });

            $scope.$on("sortOrderChanged", function (event, sortOrder) {
                if (sortOrder['sectionType'] == 'WebsiteList') {
                    console.log("Sort Order Changed!");
                    self.websites = [];
                    self.sortBy = sortOrder['sortBy'];
                    if (self.dynamicItems != undefined) {
                        self.dynamicItems.reset();
                    }

                    if (sortOrder.mainPage == undefined || sortOrder.mainPage == true) {

                        // self.nextPage(0);
                        self.dynamicItems.nextPage(0,false)
                    }
                    didSectionListWrapperLoad = true;
                }

            });

            if (!didSectionListWrapperLoad) {
                scopeWatchService.didSectionListWrapperLoaded('WebsiteList')
            }


            self.removeWebsiteFromScene = function (siteToDelete) {
                if (angular.isObject(self.scene)) {
                    // self.pk.splice(self.pk.indexOf(aliasToDelete.id), 1);
                    // alert(angular.toJson(self.actor.actor_tags));
                    // alert(angular.toJson(tagToDelete));
                    // alert(angular.toJson(self.actor.actor_tags.indexOf(tagToDelete.id)));
                    var res = helperService.removeObjectFromArrayOfObjects(siteToDelete, self.websites);

                    self.scene.websites = res['resId'];
                    self.websites = res['resObject'];

                    scopeWatchService.sceneChanged(self.scene);

                    // self.actor.actor_tags.splice(self.actor.actor_tags.indexOf(tagToDelete.id,1));
                    // alert(angular.toJson(self.actor.actor_tags));
                }
            };

            self.deleteWebsiteFromDb = function (siteToDelete) {

                Website.remove({websiteId: siteToDelete.id});

                var ans = helperService.removeObjectFromArrayOfObjects(siteToDelete, self.websites);

                self.websites = ans['resObject'];

            };




        }
    ]
});
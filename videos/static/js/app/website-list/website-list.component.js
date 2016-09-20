// Register `phoneList` component, along with its associated controller and template
angular.module('websiteList').component('websiteList', {
    // Note: The URL is relative to our `index.html` file
    // templateUrl: 'static/js/app/website-list/website-list.template.html',
    templateUrl: 'static/partials/lists/general-list/general-list-template.html',
    bindings: {
        mainPage: '='
    },
    controller: ['Website', '$scope', 'pagerService', 'scopeWatchService', 'helperService', '$timeout','$rootScope',

        function websiteListController(Website, $scope, pagerService, scopeWatchService, helperService, $timeout, $rootScope) {

            var self = this;
            var didSectionListWrapperLoad = false;
            self.pageType = 'Website';
            
            self.linkAid = "website";

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
                // self.nextPage(0);
                self.dynamicItems.nextPage(0,false)


            });

            $scope.$on("addWebsiteToList", function (event, website) {
                self.websites.push(website)


            });

            $scope.$on("searchTermChanged", function (event, searchTerm) {
                if (searchTerm['sectionType'] == 'WebsiteList') {
                    self.websites = [];
                                        
                    var searchedItem = searchTerm['searchTerm'];
                    var searchType = 'website_properties_' + searchTerm['searchField'];

                    self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject,searchType,searchedItem, true);
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
                    var res = helperService.removeObjectFromArrayOfObjects(siteToDelete, self.websites);
                    self.scene.websites = res['resId'];
                    self.websites = res['resObject'];

                    scopeWatchService.sceneChanged(self.scene);

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
angular.module('dbFolderTree').component('dbFolderTree', {
    templateUrl: 'static/js/app/db-folder-tree/db-folder-tree.template.html',
    bindings: {
        // parent: '=',
        route: '=',
        mainPage: '='
    },
    controller: ['$scope', '$routeParams', 'DbFolder', '$rootScope', 'scopeWatchService', 'helperService', 'pagerService',
        function DbFolderTreeController($scope, $routeParams, DbFolder, $rootScope, scopeWatchService, helperService, pagerService) {
            var self = this;
            var redirectedFromNav = false;
            $rootScope.title = "Folders";
            self.currentDir;
            self.pageType = 'DbFolder';
            self.nav = [];
            self.recursive = false;
            var gotPromise = false;
            var didSectionListWrapperLoad = false;
            // self.parent = 0;

            self.routParam = $routeParams.parentId;

            self.sortBy = 'name';
            self.advSearchObject = {};
            self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject, 'folder_properties_level', '0', true);
            
            if (self.routParam != undefined){
                self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject, 'folder_properties_parent', self.routParam, false);
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
                var item = this.dI.getItemAtIndex(index);


                return item
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
            self.dynamicItems.nextPage(0, false);


            // self.nextPage = function (currentPage) {
            //
            //
            //     input = {
            //         currentPage: currentPage,
            //         pageType: self.pageType,
            //         parent: self.parentFolder,
            //         searchTerm: self.searchTerm,
            //         searchField: self.searchField,
            //         sortBy: self.sortBy,
            //         isRunnerUp: self.runnerUp
            //
            //     };
            //
            //
            //     self.folders = pagerService.getNextPage(input);
            //
            //     self.folders.$promise.then(function (res) {
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
            //         self.dbFolders = helperService.resourceToArray(res[0]);
            //
            //
            //     });
            //
            //
            // };
            
            var loadFolder = function (clickedFolder) {
                scopeWatchService.folderOpened({'dir': clickedFolder, 'recursive': self.recursive});
                self.dynamicItems.reset();
                self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject, "folder_properties_parent", clickedFolder, false);
                self.dynamicItems.updateQuery_();
                self.dynamicItems.nextPage(0, false);

                
            };

            self.folderClick = function (clickedFolder) {
                loadFolder(clickedFolder);
                
                self.nav = clickedFolder.path_id;
                // scopeWatchService.folderOpened({'dir': clickedFolder, 'recursive': self.recursive});


            };
            
            self.navClick = function (clickedFolder) {
                loadFolder(clickedFolder);
                var found = false;

                for (var i = 0; i < self.nav.length; i++) {

                    if (found == true) {
                        console.log("Deleting item on index: " + i);
                        self.nav.splice(i, self.nav.length - i);
                        console.log("Nav length is: " + self.nav.length);
                    }

                    if (self.nav[i].id === clickedFolder.id) {
                        console.log("found clicked itme on index " + i);
                        found = true;
                    }

                }
                
            };


            self.appendFolders = function (clickedFolder) {
                // alert(clickedFolder)
                self.currentDir = clickedFolder;
                self.parentFolder = clickedFolder;
                // alert(this.dbFolders.toString())
                self.dbFoldersToAppend = [];

                self.dynamicItems.reset();
                self.dynamicItems.nextPage(0, false);
                // self.nextPage(0);

                scopeWatchService.folderOpened({'dir': self.currentDir, 'recursive': self.recursive});
                gotPromise = true;


            };

            self.recursiveToggle = function () {
                scopeWatchService.folderOpened({'dir': self.currentDir, 'recursive': self.recursive});
                gotPromise = true;
            };


            // if (self.route != undefined) {
            //     var temp = DbFolder.query({
            //         id: $routeParams.parentId, offset: '0',
            //         limit: '100'
            //     });
            //
            //     var currentFolder = undefined;
            //     var x = temp.$promise.then(function (res) {
            //
            //         // res is a 2d array. In the [0] is another array of the result folders,
            //         // while [1] is header info from the request.
            //         var currentFolder = res[0][0];
            //         self.parentFolder = currentFolder;
            //
            //
            //         for (var z in currentFolder.path_id) {
            //             console.log("Name is: " + currentFolder.path_id[z].name);
            //             console.log("id is: " + currentFolder.path_id[z].id);
            //             var temp = {
            //                 'last_folder_name_only': currentFolder.path_id[z].name,
            //                 'id': currentFolder.path_id[z].id
            //             };
            //             self.nav.push(temp)
            //         }
            //
            //         self.appendFolders(currentFolder);
            //
            //
            //     })
            //
            //
            // } else {
            //
            //     self.dbFolders = DbFolder.query({level: '0'}).$promise.then(function (res) {
            //         self.dbFolders = helperService.resourceToArray(res[0]);
            //
            //
            //         var paginationInfo = {
            //             pageType: self.pageType,
            //             pageInfo: res[1]
            //         };
            //
            //         scopeWatchService.paginationInit(paginationInfo);
            //
            //
            //     });
            // }


            $scope.$on("searchTermChanged", function (event, searchTerm) {
                if (searchTerm['sectionType'] == 'DbFolder') {
                    self.dbFolders = [];
                    self.searchTerm = searchTerm['searchTerm'];
                    self.searchField = searchTerm['searchField'];
                    self.nextPage(0);
                }


            });

            $scope.$on("sortOrderChanged", function (event, sortOrder) {
                if (sortOrder['sectionType'] == 'DbFolder') {
                    console.log("Sort Order Changed!");
                    self.dbFolders = [];
                    self.sortBy = sortOrder['sortBy'];
                    if (sortOrder.mainPage == undefined) {
                        self.nextPage(0);
                    }
                    didSectionListWrapperLoad = true;
                }

            });

            if (!didSectionListWrapperLoad) {
                scopeWatchService.didSectionListWrapperLoaded('DbFolder')
            }

            $scope.$on("runnerUpChanged", function (event, runnerUp) {
                if (runnerUp['sectionType'] == 'DbFolder') {
                    console.log("Sort Order Changed!");
                    self.dbFolders = [];
                    self.runnerUp = runnerUp['runnerUp'];
                    self.nextPage(0);
                }
            });


            $scope.$on("paginationChange", function (event, pageInfo) {
                if (pageInfo.pageType == self.pageType) {
                    self.nextPage(pageInfo.page)
                }
            });


            $scope.$on("didFolderLoad", function (event, pageInfo) {
                if (gotPromise) {
                    scopeWatchService.folderOpened({'dir': self.currentDir, 'recursive': self.recursive});
                }
            });


            //
            //     self.nav = []
            // } else {
            //     console.log("db-folder-tree: folder tree parent is " + $routeParams.parentId);
            //     self.dbFolders = self.dbFolders.concat(DbFolder.query({
            //         parent: $routeParams.parentId
            //     }));
            // }


            

            self.getDirs = function () {
                if (self.currentDir == undefined) {
                    return false;
                } else if (self.currentDir.scenes.length == 0) {
                    return false;

                } else {


                    console.log('%c currentDir is not undefined or empty it is ' + angular.toJson(self.currentDir), 'background: #232; color: #bada55'
                    );

                    scopeWatchService.folderOpened(self.currentDir);
                    return true;
                }
            };


        }
    ]
});
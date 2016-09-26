// Register `phoneList` component, along with its associated controller and template
angular.module('sceneList').component('sceneList', {
    // Note: The URL is relative to our `index.html` file
    templateUrl: ['$element', '$attrs', function ($element, $attrs) {

        // if ($attrs.viewStyle == 'grid') {
        //     return 'static/js/app/scene-list/scene-list-grid.template.html'
        // } else {
        return 'static/js/app/scene-list/scene-list.template.html';
        // }


    }],
    bindings: {
        mainPage: '=',
        treeFolder: '='
    },
    controller: ['$scope', 'Scene', 'helperService', 'scopeWatchService', 'pagerService', 'Actor',
        'Website', 'SceneTag', '$http', '$rootScope', '$q', '$location', '$mdDialog', '$timeout',
        function SceneListController($scope, Scene, helperService, scopeWatchService, pagerService, Actor,
                                     Website, SceneTag, $http, $rootScope, $q, $location, $mdDialog, $timeout) {

            var self = this;
            var actorLoaded = false;
            var sceneTagLoaded = false;
            var websiteLoaded = false;
            var folderLoaded = false;
            var didSectionListWrapperLoad = false;
            var didSectionListWrapperLoadIsMainPage = false;
            var playlistLoaded = false;

            var isMainPage = false;


            var whatIsLoaded = {

                'actorLoaded': actorLoaded,
                'sceneTagLoaded': sceneTagLoaded,
                'websiteLoaded': websiteLoaded,
                'folderLoaded': folderLoaded,
                'didSectionListWrapperLoad': didSectionListWrapperLoad,
                'didSectionListWrapperLoadIsMainPage': didSectionListWrapperLoadIsMainPage,
                'playlistLoaded': playlistLoaded


            };

            var populateWhatLoaded = function () {
                whatIsLoaded['actorLoaded'] = actorLoaded;
                whatIsLoaded['sceneTagLoaded'] = sceneTagLoaded;
                whatIsLoaded['websiteLoaded'] = websiteLoaded;
                whatIsLoaded['folderLoaded'] = folderLoaded;
                whatIsLoaded['didSectionListWrapperLoad'] = didSectionListWrapperLoad;
                whatIsLoaded['didSectionListWrapperLoadIsMainPage'] = didSectionListWrapperLoadIsMainPage;
                whatIsLoaded['playlistLoaded'] = playlistLoaded;

            };

            var isSomethingLoaded = function () {
                var ans = actorLoaded || sceneTagLoaded || websiteLoaded || folderLoaded || didSectionListWrapperLoadIsMainPage || playlistLoaded;
                // if (ans) {
                //     populateWhatLoaded();
                //     for (var property in whatIsLoaded) {
                //         if (whatIsLoaded.hasOwnProperty(property)) {
                //             console.log(property + ": " + whatIsLoaded[property])
                //         }
                //     }
                // }
                return ans

            };


            self.sceneArray = [];
            self.scenesToAdd = [];
            self.pageType = 'Scene';
            self.selectedScenes = [];
            self.selectAllStatus = false;
            self.tagMultiple = false;
            self.gotPromise = false;
            self.working = false;
            $scope.gotPromiseSceneList = false;

            self.gridView = false;

            self.advSearchObject = {};
            self.advSearchString = undefined;

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

            var gotItemAtIndex = false;
            DynamicItems.prototype.getItemAtIndex = function (index) {
                this.updateQuery_();
                if (isSomethingLoaded()) {

                    var item = this.dI.getItemAtIndex(index);
                    if (item != undefined && !gotItemAtIndex) {
                        gotItemAtIndex = true;
                        $rootScope.updateWidth("right");


                    }
                    return item
                }

            };

            DynamicItems.prototype.getLength = function () {
                this.updateQuery_();
                return this.dI.getLength()
            };

            DynamicItems.prototype.nextPage = function (pageNumber, isCalledFromDynamicItems, callOrigin) {
                console.log("DynamicItems next page function was called from *" + callOrigin + "*");
                this.updateQuery_();
                if (isSomethingLoaded) {
                    this.dI.nextPage(pageNumber, isCalledFromDynamicItems)
                }

            };

            DynamicItems.prototype.getLoadedItems = function () {

                return this.dI.getLoadedItems();
            };

            DynamicItems.prototype.setLoadedItems = function (loadedItemsToSet) {
                this.dI.setLoadedItems(loadedItemsToSet)
            };


            this.dynamicItems = new DynamicItems();
            this.dynamicItems.updateQuery_();


            // Toggle model for multiple tagging
            self.multiTag = function () {

                if (self.tagMultiple) {
                    self.tagMultiple = false;
                } else {
                    self.tagMultiple = true;
                }

            };


            // Check if grid view option from setting and import it to this view.
            var checkGridOption = function () {
                if ((helperService.getGridView() != undefined) && (helperService.getGridView()['scene'] != undefined)) {
                    self.gridView = helperService.getGridView()['scene']
                }

                if (self.gridView) {
                    if (!self.dynamicItems.dI.isGrid) {
                        self.dynamicItems.dI.isGrid = true;
                        var tmp = list2Grid(self.dynamicItems.getLoadedItems());
                        self.dynamicItems.setLoadedItems(tmp);
                    }

                } else {
                    if (self.dynamicItems.dI.isGrid) {
                        self.dynamicItems.dI.isGrid = false;
                        var tmp = grid2List(self.dynamicItems.getLoadedItems());
                        self.dynamicItems.setLoadedItems(tmp);
                    }

                }
            };


            var list2Grid = function (currentItems) {

                // var currentItems = self.dynamicItems.getLoadedItems();
                var itemsPerRow = $rootScope.ITEMS_PER_ROW;
                var newItems = [];

                var tmp = [];

                for (var i = 0; i < currentItems.length; i++) {
                    tmp.push(currentItems[i]);
                    if (tmp.length % itemsPerRow == 0) {
                        newItems.push(tmp);
                        tmp = []
                    }
                }
                if (tmp.length > 0) {
                    newItems.push(tmp);
                }

                return newItems;


            };


            var grid2List = function (currentItems) {

                // var currentItems = self.dynamicItems.getLoadedItems();
                // var itemsPerRow = self.dynamicItems.dI.ITEMS_PER_ROW;
                var newItems = [];

                for (var i = 0; i < currentItems.length; i++) {
                    for (var j = 0; j < currentItems[i].length; j++) {
                        newItems.push(currentItems[i][j])
                    }
                }
                return newItems;


            };

            var gridChangeNumberOfRows = function () {
                if (self.gridView) {

                    var currentItems = self.dynamicItems.getLoadedItems();
                    var itemsPerRow = $rootScope.ITEMS_PER_ROW;
                    var newItems = [];
                    var tmp = [];

                    for (var i = 0; i < currentItems.length; i++) {
                        for (var j = 0; j < currentItems[i].length; j++) {
                            tmp.push(currentItems[i][j]);
                            if (tmp.length % itemsPerRow == 0) {
                                newItems.push(tmp);
                                tmp = []
                            }
                        }
                    }
                    if (tmp.length > 0) {
                        newItems.push(tmp);
                    }
                    self.dynamicItems.setLoadedItems(newItems)
                }


            };

            var currentNumberOfItemsPerRow = undefined;

            $scope.$on("widthChanged", function (event, width) {
                $rootScope.ITEMS_PER_ROW = Math.floor($rootScope.currentWidth / 360);
                if ($rootScope.ITEMS_PER_ROW < 1) {
                    $rootScope.ITEMS_PER_ROW = 1;
                }
                if ((currentNumberOfItemsPerRow == undefined) ||
                    (currentNumberOfItemsPerRow != $rootScope.ITEMS_PER_ROW) ||
                    gotItemAtIndex) {

                    // $scope.$apply();
                    $timeout(function () {
                        // anything you want can go here and will safely be run on the next digest.
                        gridChangeNumberOfRows();
                        currentNumberOfItemsPerRow = $rootScope.ITEMS_PER_ROW;
                    })
                }
            });


            checkGridOption();


            self.selectAll = function () {
                var sceneArray = null;

                if (self.gridView){
                    sceneArray = grid2List(self.dynamicItems.getLoadedItems())
                }else{
                    sceneArray = self.dynamicItems.getLoadedItems()
                }

                self.selectedScenes = [];
                for (var i = 0; i < sceneArray.length; i++) {
                    sceneArray[i].selected = true;
                    self.selectedScenes.push(sceneArray[i])
                }

                if (self.gridView){
                    self.dynamicItems.setLoadedItems(list2Grid(sceneArray))
                }else{
                    self.dynamicItems.setLoadedItems(sceneArray)
                }

            };


            self.selectNone = function () {

                var sceneArray = null;

                if (self.gridView){
                    sceneArray = grid2List(self.dynamicItems.getLoadedItems())
                }else{
                    sceneArray = self.dynamicItems.getLoadedItems()
                }

                for (var i = 0; i < sceneArray.length; i++) {
                    sceneArray[i].selected = false;
                }
                self.selectedScenes = [];

                if (self.gridView){
                    self.dynamicItems.setLoadedItems(list2Grid(sceneArray))
                }else{
                    self.dynamicItems.setLoadedItems(sceneArray)
                }



            };

            self.sceneSelectToggle = function (scene) {

                var found = false;

                for (var i = 0; i < self.selectedScenes.length; i++) {
                    if (scene.id == self.selectedScenes[i].id) {
                        found = true;
                    }

                }

                if (!found) {
                    self.selectedScenes.push(scene);
                    console.log("Added scene " + scene.name + " To selected scenes")

                }

                if (found) {
                    self.selectedScenes.splice(self.selectedScenes.indexOf(scene), 1);
                    console.log("Removed scene " + scene.name + " from selected scenes");
                }


            };


            self.sceneArraystore = function () {

                var scArray = [];
                for (i = 0; i < self.dynamicItems.dI.loadedItems[0].length; i++) {
                    scArray.push(self.dynamicItems.dI.loadedItems[0][i].id)
                }

                helperService.set(scArray);

                console.log(helperService.get());
            };

            self.sceneArrayClear = function () {
                console.log("scene arrray cleared!");
                if (($rootScope.$storage != undefined) && ($rootScope.$storage.scArray != undefined)) {
                    delete $rootScope.$storage.scArray;
                }


            };


            // Catching events triggered by other objects.


            // Change in grid view
            $scope.$on("gridViewOptionChnaged", function (event, pageInfo) {
                checkGridOption();

            });


            // Actor was loaded on actor detail page and now we can fetch scenes.
            $scope.$on("actorLoaded", function (event, actor) {
                self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject, 'actors', actor, false);
                self.dynamicItems.reset("actorLoaded");
                self.dynamicItems.nextPage(0, false, "actorLoaded");
                actorLoaded = true;
            });

            // In case 'actorLoaded' fired before this code was loaded we will miss it.
            // This check, checks if we caught the 'actorLoaded' signal, if we did not it asks for
            // another signal. If we are on the actor detail page another signal will be fired and we
            // now would catch it.
            if (!actorLoaded) {
                scopeWatchService.didActorLoad("a");
            }

            $scope.$on("playlistLoaded", function (event, playlist) {
                self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject, 'playlists', playlist, false);
                self.dynamicItems.reset("playlistLoaded");
                self.dynamicItems.nextPage(0, false, "playlistLoaded");
                playlistLoaded = true;
            });

            if (!playlistLoaded) {
                scopeWatchService.didPlaylistLoad("a");
            }


            $scope.$on("sceneTagLoaded", function (event, sceneTag) {
                self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject, 'scene_tags', sceneTag, false);
                self.dynamicItems.reset("sceneTagLoaded");
                self.dynamicItems.nextPage(0, false, "sceneTagLoaded");
                sceneTagLoaded = true;
            });

            if (!sceneTagLoaded) {
                scopeWatchService.didSceneTagLoad("a");
            }

            $scope.$on("websiteLoaded", function (event, website) {
                self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject, 'websites', website, false);
                self.dynamicItems.reset('websiteLoaded');
                self.dynamicItems.nextPage(0, false, "websiteLoaded");
                websiteLoaded = true
            });

            if (!websiteLoaded) {
                scopeWatchService.didWebsiteLoad('a');
            }


            $scope.$on("folderOpened", function (event, folder) {
                console.log("scene-list: folderOpened broadcast was caught");
                self.scenes = [];
                self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject, 'folders_in_tree', folder['dir'], false);
                self.dynamicItems.reset('folderOpened');
                self.dynamicItems.nextPage(0, false, "sceneTagLoaded");
                folderLoaded = true;
            });

            if (!folderLoaded) {
                scopeWatchService.didFolderLoad('a');
            }


            $scope.$on("actorSelected", function (event, object) {

                var selectedObject = object['selectedObject'];
                var originalObject = object['originalObject'];

                self.addItem(originalObject, selectedObject, 'actors');

            });


            $scope.$on("sceneTagSelected", function (event, object) {

                if (object['sendingObjectType'] == 'Scene-List') {
                    var selectedObject = object['selectedObject'];
                    var originalObject = object['originalObject'];

                    self.addItem(originalObject, selectedObject, 'scene_tags');
                }


            });

            $scope.$on("websiteSelected", function (event, object) {

                var selectedWebsite = object['selectedObject'];
                var scene = object['originalObject'];


                self.addItem(scene, selectedWebsite, 'websites');


            });

            $scope.$on("playlistSelected", function (event, object) {

                var selectedPlaylist = object['selectedObject'];
                var scene = object['originalObject'];


                self.addItem(scene, selectedPlaylist, 'playlists');


            });


            $scope.$on("searchTermChanged", function (event, searchTerm) {

                if (searchTerm['sectionType'] == 'SceneList') {
                    self.scenes = [];

                    var searchType = 'scene_properties_' + searchTerm['searchField'];
                    var searchTerm = searchTerm['searchTerm'];
                    self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject, searchType, searchTerm, true);
                    // self.nextPage(0);
                    // pageNumberForInfScroll = 0;
                    self.dynamicItems.reset('searchTermChanged');
                    self.dynamicItems.nextPage(0, false, "searchTermChanged");
                    self.totalItems = 0;
                    // $scope.$emit('list:filtered');
                }

            });


            $scope.$on("runnerUpChanged", function (event, runnerUp) {
                if (runnerUp['sectionType'] == 'SceneList') {
                    console.log("Sort Order Changed!");
                    self.scenes = [];
                    // self.infiniteScenes = [];
                    // self.runnerUp = runnerUp['runnerUp'];
                    // self.nextPage(0);
                    // pageNumberForInfScroll = 0;
                    var temp;
                    if (runnerUp['runnerUp']) {
                        temp = '1'
                    } else {
                        temp = ''
                    }

                    self.advSearchString = $rootScope.generateAdvSearchString(self.advSearchObject, 'scene_properties_is_runner_up', temp, true);
                    self.dynamicItems.reset('runnerUpChanged');
                    self.dynamicItems.nextPage(0, false, "searchTermChanged");
                }

            });

            $scope.$on("sortOrderChanged", function (event, sortOrder) {
                if (sortOrder['sectionType'] == 'SceneList') {
                    console.log("Sort Order Changed!");
                    self.scenes = [];
                    self.sortBy = sortOrder['sortBy'];
                    if (self.dynamicItems != undefined) {
                        self.dynamicItems.reset('sortOrderChanged');
                    }

                    if (sortOrder.mainPage == undefined || sortOrder.mainPage == true) {

                        self.dynamicItems.nextPage(0, false, "sceneTagLoaded");
                        didSectionListWrapperLoadIsMainPage = true;


                    }
                    self.totalItems = 0;
                    didSectionListWrapperLoad = true;

                }

            });

            if (!didSectionListWrapperLoad) {
                scopeWatchService.didSectionListWrapperLoaded('SceneList')
            }


            self.updateScenesOnRemove = function (scenes, itemToRemove, typeOfItemToRemove) {

                if (typeOfItemToRemove == 'delete') {

                    for (var x = 0; x < scenes.length; x++) {
                        self.removeSceneFromList(scenes[x]);
                    }
                } else {
                    for (var j = 0; j < scenes.length; j++) {
                        var sceneIndex = helperService.getObjectIndexFromArrayOfObjects(scenes[j], self.dynamicItems.dI.loadedItems[0]);
                        self.dynamicItems.dI.loadedItems[0][sceneIndex] = $rootScope.removeItemFromScene(self.dynamicItems.dI.loadedItems[0][sceneIndex], itemToRemove, typeOfItemToRemove);
                    }
                }
            };

            self.removeSceneFromList = function (sceneToRemvoe) {
                var index_of_scene = -1;
                if (typeof sceneToRemvoe === 'object') {
                    index_of_scene = helperService.getObjectIndexFromArrayOfObjects(sceneToRemvoe.id, self.dynamicItems.dI.loadedItems[0]);
                } else {
                    index_of_scene = helperService.getObjectIndexFromArrayOfObjects(sceneToRemvoe.id, self.dynamicItems.dI.loadedItems[0]);
                }
                self.dynamicItems.dI.loadedItems[0].splice(index_of_scene, 1);

            };

            self.confirmRemove = function (originalScene, originalItemToRemove, originalTypeOfItemToRemove, originalPermDelete) {
                var message = "";
                if (originalPermDelete) {    //If delete from disk
                    message = "Are you really sure you want to delete the selected scene(s) from DISK?";
                } else {
                    message = "Are you sure you want to remove the selected scene(s) from the DB?";
                }
                if (confirm(message)) self.removeItem(originalScene, originalItemToRemove, originalTypeOfItemToRemove, originalPermDelete);

            };

            self.removeItem = function (scene, itemToRemove, typeOfItemToRemove, permDelete) {
                var sceneIndex = helperService.getObjectIndexFromArrayOfObjects(scene.id, self.dynamicItems.dI.loadedItems[0]);
                var itToRemove = [];
                itToRemove.push(itemToRemove.id);

                if (self.selectedScenes.length > 0 && checkIfSceneSelected(scene)) {
                    $rootScope.patchEntity('scene', self.dynamicItems.dI.loadedItems[0][sceneIndex].id, typeOfItemToRemove, itToRemove, 'remove', true, permDelete, self.selectedScenes);
                    self.updateScenesOnRemove(self.selectedScenes, itemToRemove, typeOfItemToRemove)
                } else {
                    $rootScope.patchEntity('scene', self.dynamicItems.dI.loadedItems[0][sceneIndex].id, typeOfItemToRemove, itToRemove, 'remove', false, permDelete, self.selectedScenes);
                    if (typeOfItemToRemove != 'delete') {
                        var scenes = [];
                        scenes.push(scene.id);
                        self.updateScenesOnRemove(scenes, itemToRemove, typeOfItemToRemove)
                    } else {
                        if (!permDelete) {
                            self.removeSceneFromList(scene)
                        }
                    }
                    self.selectNone()
                }
            }
            ;


            var updateSceneOnPageOnAdd = function (sceneIndex, typeOfItemToAdd, itemToAdd, sceneArray) {
                sceneArray[sceneIndex] = $rootScope.addItemToScene(sceneArray[sceneIndex], itemToAdd, typeOfItemToAdd);
            };

            var updateScenesOnPageOnAdd = function (itemToAdd, typeOfItemToAdd, sceneArray) {
                for (var i = 0; i < self.selectedScenes.length; i++) {
                    var sceneIndex = helperService.getObjectIndexFromArrayOfObjects(self.selectedScenes[i], sceneArray);
                    updateSceneOnPageOnAdd(sceneIndex, typeOfItemToAdd, itemToAdd, sceneArray);
                }
            };

            var checkIfSceneSelected = function (scene) {
                var found = false;
                for (var i = 0; i < self.selectedScenes.length && !found; i++) {
                    if (scene.id == self.selectedScenes[i].id) {
                        found = true;
                    }

                }
                return found
            };

            var addItemNew = function (itemToAdd, typeOfItemToAdd, scene, sceneArray) {
                var sceneIndex = helperService.getObjectIndexFromArrayOfObjects(scene.id, sceneArray);
                var newItem = $rootScope.createNewItem(typeOfItemToAdd, itemToAdd.value);
                newItem.$save().then(function (res) {

                    var patchData = [];
                    patchData.push(res.id);

                    if (self.selectedScenes.length > 0 && checkIfSceneSelected(scene)) {
                        updateScenesOnPageOnAdd(res, typeOfItemToAdd, sceneArray);

                        $rootScope.patchEntity('scene', scene.id, typeOfItemToAdd, patchData, 'add', true, false, self.selectedScenes)
                    } else {
                        updateSceneOnPageOnAdd(sceneIndex, typeOfItemToAdd, res, sceneArray);

                        $rootScope.patchEntity('scene', scene.id, typeOfItemToAdd, patchData, 'add', false, false, self.selectedScenes)
                    }
                })

            };


            self.addItem = function (scene, itemToAdd, typeOfItemToAdd) {

                // Find the scene in question in self.scenes
                // var sceneIndex = findIndexOfSceneInList(scene.id);

                var sceneIndex = undefined;
                var sceneArray = null;

                if (self.gridView) {
                    sceneArray = grid2List(self.dynamicItems.getLoadedItems());
                    sceneIndex = helperService.getObjectIndexFromArrayOfObjects(scene.id, sceneArray);

                } else {
                    sceneIndex = helperService.getObjectIndexFromArrayOfObjects(scene.id, self.dynamicItems.dI.loadedItems[0]);
                    sceneArray = self.dynamicItems.getLoadedItems();
                }


                // if the type of item to add does not exist in the scene (EX: The websites array does not exist)
                // create empty one.


                // id '-1' signifies that the item in question does not exist in the database yet and needs to be
                // created.
                if (itemToAdd.id != '-1') {

                    var patchData = [];
                    patchData.push(itemToAdd.id);

                    // If more than one scene is checked and if current scene is one of the checked scenes.
                    if (self.selectedScenes.length > 0 && checkIfSceneSelected(scene)) {

                        updateScenesOnPageOnAdd(itemToAdd, typeOfItemToAdd, sceneArray);

                        $rootScope.patchEntity('scene', scene.id, typeOfItemToAdd, patchData, 'add', true, false, self.selectedScenes);
                    } else {
                        updateSceneOnPageOnAdd(sceneIndex, typeOfItemToAdd, itemToAdd, sceneArray);
                        $rootScope.patchEntity('scene', scene.id, typeOfItemToAdd, patchData, 'add', false, false, self.selectedScenes)
                    }
                } else {
                    addItemNew(itemToAdd, typeOfItemToAdd, scene, sceneArray);

                }

                if (self.gridView){
                    self.dynamicItems.setLoadedItems(list2Grid(sceneArray));
                }else{
                    self.dynamicItems.setLoadedItems(sceneArray);
                }



            };


            self.patchScene = function (sceneToPatchId, patchType, patchData, addOrRemove, multiple, permDelete) {

                var type = {};
                type[patchType] = patchData;

                var itemsToUpdate = [];
                if (multiple) {
                    itemsToUpdate = self.selectedScenes
                } else {
                    itemsToUpdate.push(sceneToPatchId)
                }

                // if (multiple) {

                $http.post('tag-multiple-items/', {
                    params: {
                        type: 'scene',
                        patchType: patchType,
                        patchData: patchData,
                        itemsToUpdate: itemsToUpdate,
                        addOrRemove: addOrRemove,
                        permDelete: permDelete
                    }
                }).then(function (response) {
                    console.log("Update finished successfully")
                }, function errorCallback(response) {
                    alert("Something went wrong!");
                });
            };


            self.sceneRunnerUpToggle = function (scene) {

                $rootScope.patchEntity('scene', scene.id, 'is_runner_up', scene.is_runner_up, 'add', false, false, self.selectedScenes);


            };


            self.sceneRatingPatch = function (scene) {

                $rootScope.patchEntity('scene', scene.id, 'rating', scene.rating, 'add', false, false, self.selectedScenes);


            };


            self.sceneArrayPush = function (sceneId) {

                self.sceneArray.push(sceneId);
                // console.log("Scene-List: sceneArray is:" +  angular.toJson(self.sceneArray))
            };

            self.playScene = function (scene) {

                return $http.get('play-scene/', {
                    params: {
                        sceneId: scene.id
                    }
                })
            };

            self.playRandomScene = function () {
                var advSearch = "";


                if (self.advSearchString != undefined) {
                    advSearch = self.advSearchString;
                }


                return $http.get('play-scene/', {
                    params: {
                        advSearch: advSearch
                    }
                })
            };


            self.deleteScene = function (sceneToRemove) {

                if (self.selectedScenes == [] || self.selectedScenes.indexOf(sceneToRemove) == -1) {
                    Scene.remove({sceneId: sceneToRemove.id});

                    var index_of_scene = helperService.getObjectIndexFromArrayOfObjects(sceneToRemove, self.dynamicItems.dI.loadedItems[0]);
                    self.dynamicItems.dI.loadedItems[0].splice(index_of_scene, 1);
                }


            };

            self.removeSceneFromPlaylist = function (sceneToRemove) {
                // var sceneIndex = findIndexOfSceneInList(sceneToRemove);
                var sceneIndex = helperService.getObjectIndexFromArrayOfObjects(sceneToRemove, self.dynamicItems.dI.loadedItems[0]);
                var patchData = [];
                patchData.push(self.playlist.id);

                if (self.selectedScenes.length > 0 && checkIfSceneSelected(sceneToRemove)) {


                    $rootScope.patchEntity('scene', self.dynamicItems.dI.loadedItems[0][sceneIndex].id, 'playlists', patchData, 'remove', true, false, self.selectedScenes);
                    for (var i = 0; i < self.selectedScenes.length; i++) {
                        self.removeSceneFromList(self.selectedScenes[i])
                    }


                } else {

                    $rootScope.patchEntity('scene', self.dynamicItems.dI.loadedItems[0][sceneIndex].id, 'playlists', patchData, 'remove', false, false, self.selectedScenes);
                    self.removeSceneFromList(sceneToRemove);
                }


            };

            self.chipOnAdd = function (chip, addedChipType, originalObject) {
                // alert("Triggered on add");
                self.addItem(originalObject, chip, addedChipType);
            };

            self.chipOnRemove = function (chip, removedChipType, originalObject) {
                // self.removeItem (chip, removedChipType)
                console.log("Triggered on remove");
                self.removeItem(originalObject, chip, removedChipType, false);
            };

            self.chipOnSelect = function (chip, selectedChipType) {

                var dest_path = "";

                if (selectedChipType == 'websites') {
                    dest_path = '/website/' + chip.id;
                } else if (selectedChipType == 'actors') {
                    dest_path = '/actor/' + chip.id;
                } else if (selectedChipType == 'scene_tags') {
                    dest_path = '/scene-tag/' + chip.id;
                }


                $location.path(dest_path);
                // $location.replace();

            };

            self.transformChip = function (chip, typeOfItemToAdd, originalItem) {

                // If it is an object, it's already a known chip
                if (angular.isObject(chip)) {
                    if (chip.id == -1) {
                        // function (scene, itemToAdd, typeOfItemToAdd
                        // addItemNew(chip, typeOfItemToAdd, originalItem);
                        self.addItem(originalItem,chip,typeOfItemToAdd);
                        return null
                    }
                    return chip;
                }
            };

            // Dialogs
            self.actionList = [
                {name: 'Add To Queue', direction: "bottom"},
                {name: 'Add To Playlist', direction: "top"},
                {name: 'Delete From Db', direction: "bottom"},
                {name: 'Delete From Disk', direction: "top"}
            ];


            self.actionClicked = function ($event, item, scene, selectedScenes) {
                var defaultTemplate = 'static/js/app/scene-list/dialog-templates/dialog.html';
                if (item.name == 'Add To Queue') {
                    $http.get('add-to-playlist//', {
                        params: {
                            playlistName: "Queue Playlist",
                            sceneId: scene.id
                        }
                    }).then(function (response) {
                    }, function errorCallback(response) {
                        alert("Something went wrong!");
                    });
                } else {
                    $mdDialog.show({
                        clickOutsideToClose: true,
                        controller: function ($mdDialog) {
                            // Save the clicked item
                            this.item = item;
                            this.scene = scene;
                            this.searchText = "";
                            this.mdSelectedItem = null;
                            this.selectedScenes = selectedScenes;
                            this.playlistAutocompleteNeeded = false;


                            this.greeting = "";


                            this.isPartOfSelection = function () {
                                var ans = false;

                                if (this.selectedScenes.length > 0 && checkIfSceneSelected(scene)) {
                                    ans = true
                                }

                                return ans;
                            };


                            if (this.item.name == "Add To Playlist" && this.isPartOfSelection()) {
                                this.greeting = 'Hello User! You clicked on \'' + this.item.name + '\'. And you have selected multiple scenes ' +
                                    'Please select a Playlist to which you would like to add the following scenes:'
                                this.playlistAutocompleteNeeded = true;
                            } else if (this.item.name == "Add To Playlist") {
                                this.greeting = 'Hello User! You clicked on \'' + this.item.name + '\' Please select a Playlist to add the ' +
                                    'scene <b>' + this.scene.name + '</b> to: ';
                                this.playlistAutocompleteNeeded = true;
                            } else if (this.item.name == "Delete From Db" && this.isPartOfSelection()) {
                                this.greeting = 'Hello User! Are you sure you want do remove the following scenes from the database ?'
                            } else if (this.item.name == "Delete From Db") {
                                this.greeting = 'Hello User! Are you sure you want to remove the scene <b>' + scene.name + '</b> from the database ?';
                            } else if (this.item.name == "Delete From Disk" && this.isPartOfSelection()) {
                                this.greeting = 'Hello User! Are you really sure you want do <font color="red">delete</font> ' +
                                    'the following scenes from the hard disk? ?';
                            } else if (this.item.name == "Delete From Disk") {
                                this.greeting = 'Hello User! Are you REALLY sure you want ' +
                                    'to <font color="red">delete</font> the scene <b>' + scene.name + '</b> from disk ?';
                            }


                            this.onSelect = function (selectedItem) {
                                self.addItem(scene, selectedItem, 'playlists');
                                $mdDialog.hide();

                            };


                            // Setup some handlers
                            this.close = function () {
                                $mdDialog.cancel();
                            };
                            this.submit = function () {
                                $mdDialog.hide();
                            };
                        }
                        ,
                        controllerAs: 'dialog',
                        templateUrl: defaultTemplate,
                        targetEvent: $event
                    });
                }


            };

            var submitAdvSearch = function (advSearchString) {
                self.advSearchString = advSearchString;

                self.dynamicItems.reset("submitAdvSearch");
                self.dynamicItems.nextPage(0, false, "searchTermChanged");

            };

            self.advSearch = function ($event) {

                $mdDialog.show({
                    clickOutsideToClose: true,
                    controller: function ($mdDialog) {


                        this.greeting = "";

                        if (self.advSearchString == undefined) {
                            this.advSearchString = "";
                        } else {
                            this.advSearchString = self.advSearchString;
                        }


                        this.actorSearchText = "";
                        this.selectedOption = '';
                        this.options = 'actors,scene_tags,websites'.split(',').map(function (option) {
                            return {abbrev: option}
                        });

                        this.remeberedQueries = helperService.getAdvSearchQueries();


                        this.scene_properties = "name,path_to_file,playlists,date_added,date_last_played,date_runner_up,play_count,is_runner_up,rating,description,width,height,bit_rate,duration,size,codec_name,framerate,modified_date".split(',');
                        this.actor_properties = "name,description,gender,official_pages,ethnicity,country_of_origin,tattoos,measurements,extra_text,actor_aliases,date_added,date_runner_up,date_of_birth,play_count,is_runner_up,rating,modified_date,height,weight".split(',');


                        this.onSelect = function (selctedItemType, selectedItem) {

                            var ans = "";
                            var x = "";

                            if ('scene_properties' == selectedItem) {
                                x = 'scene_properties' + '_' + selctedItemType;
                                ans = "{" + "\"" + x + "\"" + ':' + "\"" + "value" + "\"" + "}";

                            } else if ('actor_properties' == selectedItem) {
                                x = 'actor_properties' + '_' + selctedItemType;
                                ans = "{" + "\"" + x + "\"" + ':' + "\"" + "value" + "\"" + "}";

                            } else if (selectedItem != null) {
                                ans = "{" + "\"" + selctedItemType + "\"" + ':' + "\"" + selectedItem.name + "\"" + "}";
                            }


                            this.advSearchString = this.advSearchString + ans;

                            this.actorSearchText = "";

                        };


                        this.clearSearchString = function () {
                            this.advSearchString = "";
                        };

                        // Setup some handlers
                        this.close = function () {
                            $mdDialog.cancel();
                        };
                        this.submit = function () {
                            submitAdvSearch(this.advSearchString);
                            helperService.saveAdvSearchQueries(this.advSearchString);
                            $mdDialog.hide();
                        };


                    }
                    ,
                    controllerAs: 'dialog',
                    templateUrl: 'static/js/app/scene-list/dialog-templates/dialog-advanced-search.html',
                    targetEvent: $event,
                    parent: angular.element(document.body)
                });
            };
            
            
            self.gridListTag = function ($event, item) {

                $mdDialog.show({
                    clickOutsideToClose: true,
                    controller: function ($mdDialog) {


                        this.greeting = "";
                        this.it = item;
                        
                        this.chipOnAdd = function (chip,addedChipType,originalObject) {
                            self.chipOnAdd(chip,addedChipType,originalObject)
                        };
                        
                        this.chipOnRemove = function (chip,removedChipType, originalObject) {
                            self.chipOnRemove(chip,removedChipType, originalObject)
                        };
                        
                        this.transformChip = function (chip,typeofItemToAdd, originalItem) {
                            self.transformChip(chip,typeofItemToAdd, originalItem)
                        };



                        this.cancel = function () {
                            $mdDialog.cancel();
                        };
                        
                        this.close = function () {
                            $mdDialog.cancel();
                        };
                        this.submit = function () {
                            $mdDialog.hide();
                        };


                    }
                    ,
                    controllerAs: 'dialog',
                    templateUrl: 'static/js/app/scene-list/dialog-templates/dialog-gridview-tag.html',
                    targetEvent: $event,
                    parent: angular.element(document.body)
                });
            };


            // AM menu functions:
            var originatorEv;

            this.openMenu = function ($mdOpenMenu, ev) {
                originatorEv = ev;
                $mdOpenMenu(ev);
            };


        }
    ]
});

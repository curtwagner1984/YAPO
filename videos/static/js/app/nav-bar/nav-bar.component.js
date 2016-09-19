angular.module('navBar', []).component('navBar', {
    // Note: The URL is relative to our `index.html` file
    templateUrl: 'static/js/app/nav-bar/nav-bar.template.html',
    bindings: {},
    controller: ['$scope', '$rootScope', 'Actor', 'SceneTag', 'Website', 'ActorTag', 'helperService', '$http', 'Playlist',
        '$timeout', 'pagerService',
        function NavBarController($scope, $rootScope, Actor, SceneTag, Website, ActorTag, helperService, $http, Playlist
            , $timeout, pagerService) {


            var self = this;
            self.dynamicItmesNumOfItemsTemp = 0;

            // Global function to create new item
            $rootScope.createNewItem = function (typeOfItemToAdd, newItemName) {
                var newItem;
                if (typeOfItemToAdd == 'actors') {
                    newItem = new Actor();
                    newItem.thumbnail = 'media/images/actor/Unknown/profile/profile.jpg'; //need to change this to a constant!
                    newItem.scenes = [];
                } else if (typeOfItemToAdd == 'scene_tags') {
                    newItem = new SceneTag();
                    newItem.scenes = [];
                    newItem.websites = [];
                } else if (typeOfItemToAdd == 'websites') {
                    newItem = new Website;
                    newItem.scenes = [];
                } else if (typeOfItemToAdd == 'actor_tags') {
                    newItem = new ActorTag;
                    newItem.actors = [];
                } else if (typeOfItemToAdd == 'playlists') {
                    newItem = new Playlist;
                    newItem.scenes = []
                }

                newItem.name = newItemName;

                return newItem
            };

            $rootScope.patchEntity = function (entityToPatchType, entityToPatchId, patchType, patchData, addOrRemove,
                                               multiple, permDelete, selectedScenes) {

                var type = {};
                type[patchType] = patchData;

                var itemsToUpdate = [];
                if (multiple) {
                    itemsToUpdate = [];
                    for (var i = 0; i < selectedScenes.length; i++) {
                        itemsToUpdate.push(selectedScenes[i].id)
                    }

                } else {
                    itemsToUpdate.push(entityToPatchId)
                }


                // if (multiple) {

                $http.post('tag-multiple-items/', {
                    params: {
                        type: entityToPatchType,
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

            $rootScope.addItemToScene = function (scene, itemToAdd, typeOfItemToAdd) {

                if (scene[typeOfItemToAdd] == undefined) {
                    scene[typeOfItemToAdd] = [];
                }

                var found = helperService.getObjectIndexFromArrayOfObjects(itemToAdd, scene[typeOfItemToAdd]);

                if (found == null) {
                    scene[typeOfItemToAdd].push(itemToAdd);
                }

                if (typeOfItemToAdd == 'websites' && itemToAdd.scene_tags_with_names.length > 0) {
                    for (var i = 0; i < itemToAdd.scene_tags_with_names.length; i++) {
                        $rootScope.addItemToScene(scene, itemToAdd.scene_tags_with_names[i], 'scene_tags')
                    }
                }

                if (typeOfItemToAdd == 'actors' && itemToAdd.actor_tags.length > 0) {
                    for (var z = 0; z < itemToAdd.actor_tags.length; z++) {
                        if (itemToAdd.actor_tags[z].scene_tags.length > 0) {
                            $rootScope.addItemToScene(scene, itemToAdd.actor_tags[z].scene_tags[0], 'scene_tags')
                        }

                    }
                }

                return scene

            };

            $rootScope.removeItemFromScene = function (scene, itemToRemove, typeOfItemToRemove) {
                var resId = [];
                var resObj = [];

                if (scene[typeOfItemToRemove] == undefined) {
                    scene[typeOfItemToRemove] = [];
                }

                for (var i = 0; i < scene[typeOfItemToRemove].length; i++) {
                    if (itemToRemove.id != scene[typeOfItemToRemove][i].id) {
                        resId.push(scene[typeOfItemToRemove][i].id);
                        resObj.push(scene[typeOfItemToRemove][i]);
                    }
                }

                scene[typeOfItemToRemove] = resObj;

                resObj = [];


                if (typeOfItemToRemove == 'websites' && itemToRemove.scene_tags_with_names.length > 0) {
                    for (var k = 0; k < itemToRemove.scene_tags_with_names.length; k++) {
                        $rootScope.removeItemFromScene(scene, itemToRemove.scene_tags_with_names[k], 'scene_tags')
                    }
                }

                if (typeOfItemToRemove == 'actors' && itemToRemove.actor_tags.length > 0) {
                    for (var z = 0; z < itemToRemove.actor_tags.length; z++) {
                        if (itemToRemove.actor_tags[z].scene_tags.length > 0) {
                            $rootScope.removeItemFromScene(scene, itemToRemove.actor_tags[z].scene_tags[0], 'scene_tags')
                        }

                    }
                }

                return scene
            };

            $rootScope.autoCompleteGetItems = function (searchedObjectType, val) {


                var actor_tagsURL = '/api/actor-tag/';
                var scenesURL = '/api/scene/';
                var sceneTagsURL = '/api/scene-tag/';
                var actorsURL = '/api/actor/';
                var websiteURL = 'api/website/';
                var playlistURL = 'api/playlist/';
                var httpGETUrl = null;

                if (searchedObjectType == 'actor_tags') {
                    httpGETUrl = actor_tagsURL;
                } else if (searchedObjectType == 'scenes') {
                    httpGETUrl = scenesURL;
                } else if (searchedObjectType == 'scene_tags') {
                    httpGETUrl = sceneTagsURL;
                } else if (searchedObjectType == 'actors') {
                    httpGETUrl = actorsURL;
                } else if (searchedObjectType == 'websites') {
                    httpGETUrl = websiteURL;
                } else if (searchedObjectType == 'playlists') {
                    httpGETUrl = playlistURL;
                }

                return $http.get(httpGETUrl, {
                    params: {
                        search: val,
                        searchField: 'name'

                    }
                }).then(function (response) {

                    var a = response.data.map(function (item) {
                        return item;
                    });

                    if (self.object == 'search') {
                        return a
                    } else {


                        var b = [];
                        var found = false;
                        for (var i = 0; i < a.length; i++) {
                            // console.log("Res to check:" + angular.toJson(a[i]));

                            if (self.object != undefined) {
                                for (var j = 0; j < self.object.length && !found; j++) {
                                    // console.log("To check against:" + angular.toJson(self.object[j]));
                                    if (a[i].id == self.object[j]) {
                                        console.log("Match found: " + angular.toJson(a[i]) + " Matches: " + angular.toJson(self.object[j]));
                                        found = true;


                                    }
                                }
                            }


                            if (!found) {
                                // console.log("Res to push:" + angular.toJson(a[i]));
                                b.push(a[i]);
                                // console.log("Res to array:" + angular.toJson(b));

                            }
                            found = false;
                        }

                        var createVal = {"id": -1, "name": "Create: " + "\"" + val + "\"", "value": val};
                        if (searchedObjectType == "actors") {
                            createVal['thumbnail'] = 'media/images/actor/Unknown/profile/profile.jpg'
                        }
                        b.push(createVal);

                        // alert(angular.toJson(a));
                        return b;

                    }

                });

            };

            $rootScope.autoCompleteOnSelect = function (originalObject, selectedObject, sendingObjectType, selectedObjectType) {

                console.log("async-typeaeahd onSelect triggered");


                var ans = {
                    'originalObject': originalObject,
                    'selectedObject': selectedObject,
                    'sendingObjectType': sendingObjectType
                };

                if (selectedObjectType == 'actor_tags') {
                    scopeWatchService.actorTagSelected(selectedObject);
                } else if (selectedObjectType == 'scene_tags') {
                    scopeWatchService.sceneTagSelected(ans)
                } else if (selectedObjectType == 'actors') {
                    scopeWatchService.actorSelected(ans)
                } else if (selectedObjectType == 'websites') {
                    scopeWatchService.websiteSelected(ans)
                } else if (selectedObjectType == 'playlists') {
                    scopeWatchService.playlistSelected(ans)
                }

            }

            $rootScope.DynamicItems = function () {
                /**
                 * @type {!Object<?Array>} Data pages, keyed by page number (0-index).
                 */



                this.loadedPages = {};

                this.isWorking = [0];

                this.loadedItems = [[], []];

                /** @type {number} Total number of items. */
                this.numItems = 0;

                /** @const {number} Number of items to fetch per request. */
                if (helperService.getNumberOfItemsPerPaige() != undefined) {
                    this.PAGE_SIZE = parseInt(helperService.getNumberOfItemsPerPaige());
                } else {
                    this.PAGE_SIZE = 10;
                }

                this.pageType = "";
                // this.pageNumber = "";
                this.sortBy = "";
                this.advSearch = "";


                this.fetchNumItems_();
            };

            $rootScope.DynamicItems.prototype.reset = function (caller) {
                this.loadedItems = [[], []];
                this.numItems = 0;
                console.log("DynamicItems reset was triggered by " + caller)

            };

            // Required.
            $rootScope.DynamicItems.prototype.getItemAtIndex = function (index) {
                this.numItems = self.dynamicItmesNumOfItemsTemp;
                var pageNumber = Math.floor(index / this.PAGE_SIZE);
                var itemToReturn = this.loadedItems[0][index];

                if (itemToReturn) {
                    return itemToReturn
                } else if ((this.loadedItems[1][0] != 1) && (this.loadedItems[0].length != this.numItems)) {
                    this.fetchPage_(pageNumber)
                }


            };

            $rootScope.DynamicItems.prototype.getLength = function () {
                this.numItems = self.dynamicItmesNumOfItemsTemp;
                return this.numItems;
            };

            $rootScope.DynamicItems.prototype.nextPage = function (pageNumber, wasCalledFromDynamicItems) {

                // Marks that fetching is in progress, prevents of fetching more pages while this is set to 1.
                this.loadedItems[1][0] = 1;

                var loadedPages = this.loadedPages;
                var lodeadItems = this.loadedItems;
                self.dynamicItmesNumOfItemsTemp = this.numItems;


                var input = {
                    currentPage: pageNumber,
                    pageType: this.pageType,
                    sortBy: this.sortBy,
                    advSearch: this.advSearch
                };


                self.actorsToadd = pagerService.getNextPage(input);
                if (self.actorsToadd != undefined) {
                    self.actorsToadd.$promise.then(function (res) {

                        // self.actorsToadd = res[0];

                        var paginationInfo = {
                            pageType: input.pageType,
                            pageInfo: res[1]
                        };

                        self.dynamicItmesNumOfItemsTemp = parseInt(paginationInfo.pageInfo.replace(/.*<(\d+)>; rel="count".*/, '$1'));


                        var itemsFormServer = helperService.resourceToArray(res[0]);

                        if (self.dynamicItmesNumOfItemsTemp == -6) {
                            self.dynamicItmesNumOfItemsTemp = itemsFormServer.length;
                        }

                        if (wasCalledFromDynamicItems) {
                            // for (var i = 0; i < self.websites.length; i++) {
                            //     loadedPages[pageNumber].push(self.websites[i])
                            // }


                            lodeadItems[0] = lodeadItems[0].concat(itemsFormServer);
                            this.loadedItems = lodeadItems;

                            // this.loadedPages = loadedPages;
                            // this.isWorking[0] = 0;
                        }

                        lodeadItems[1][0] = 0;
                        this.loadedItems = lodeadItems;


                    });
                }

            };

            $rootScope.DynamicItems.prototype.fetchPage_ = function (pageNumber) {
                // Set the page to null so we know it is already being fetched.
                // this.loadedPages[pageNumber] = null;
                // this.isWorking[0] = 1;

                // var pageOffset = pageNumber * this.PAGE_SIZE;
                // var limit = pageOffset + this.PAGE_SIZE;
                //     for (var i = pageOffset; i < limit ; i++) {
                //       // this.loadedPages[pageNumber].push(i);
                //         this.loadedItems.push(null);
                //
                //     }

                this.loadedItems[1][0] = 1;


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

            $rootScope.DynamicItems.prototype.fetchNumItems_ = function () {
                // For demo purposes, we simulate loading the item count with a timed
                // promise. In real code, this function would likely contain an
                // $http request.

                // $timeout(angular.noop, 500).then(angular.bind(this, function () {
                //     if (self.totalItems == -6) {
                //         self.totalItems = this.itemsFormServer.length;
                //     }
                //     this.numItems = self.totalItems;
                // }));
            };
            
            
            $rootScope.generateAdvSearchString = function (currentAdvSearchObject, searchType, searchedItem, append) {
                if (!append) {
                    currentAdvSearchObject = {};
                }

                if (angular.isObject(searchedItem)) {
                    currentAdvSearchObject[searchType] = searchedItem.id;
                } else {
                    currentAdvSearchObject[searchType] = searchedItem;
                }


                var ans = "";
                var first = true;

                for (var key in currentAdvSearchObject) {
                    if (currentAdvSearchObject.hasOwnProperty(key)) {
                        if (currentAdvSearchObject[key] != "") {
                            var temp = "{\"" + key + "\":\"" + currentAdvSearchObject[key] + "\"}";
                            if (first) {
                                ans = temp;
                                first = false
                            } else {
                                var temp1 = "(" + ans + ")";
                                var temp2 = "(" + temp + ")";
                                ans = temp1 + "&&" + temp2;
                            }
                        }
                    }
                }
                return ans;

            };


        }]
});









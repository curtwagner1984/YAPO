angular.module('sceneTagDetail').component('sceneTagDetail', {
    templateUrl: 'static/js/app/scene-tag-detail/scene-tag-detail.template.html',
    controller: ['$routeParams', 'SceneTag', 'scopeWatchService', '$rootScope', '$scope','$mdSidenav','$timeout', '$rootScope',
        function SceneTagDetailController($routeParams, SceneTag, scopeWatchService, $rootScope, $scope, $mdSidenav, $timeout, $rootScope ) {
            var self = this;
            var gotPromise = false;
            
            
            $scope.toggleLeft = buildToggler('left');
            $scope.toggleRight = buildToggler('right');

            function buildToggler(componentId) {
                return function () {
                    $mdSidenav(componentId).toggle();
                }
            }
            
            self.sceneTag = SceneTag.get({sceneTagId: $routeParams.sceneTagId}).$promise.then(function (res) {
                scopeWatchService.sceneTagLoaded(res);
                self.sceneTag = res;
                // alert(res.name);
                $rootScope.title = res.name;
                gotPromise = true;
                self.sceneTagAliasContainer = $rootScope.csvToArray(self.sceneTag.scene_tag_alias);
                
                $timeout(angular.noop, 1000).then(function () {
                        $rootScope.autoSideNavRight();
                    });
            });

            self.sceneTagAliasContainer = [];


            
            self.sceneTagUpdateAlias = function () {

                self.sceneTag.scene_tag_alias = $rootScope.arrayToCsv(self.sceneTagAliasContainer);

                self.update();

            };

            $scope.$on("didSceneTagLoad", function (event, sceneTag) {
                if (gotPromise) {
                    scopeWatchService.sceneTagLoaded(self.sceneTag);
                }
            });

            self.update = function () {
                SceneTag.update({sceneTagId: self.sceneTag.id}, self.sceneTag)
            }

        }
    ]
});
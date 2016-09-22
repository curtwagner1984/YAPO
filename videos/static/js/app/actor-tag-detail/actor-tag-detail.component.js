angular.module('actorTagDetail').component('actorTagDetail', {
    templateUrl: 'static/js/app/actor-tag-detail/actor-tag-detail.template.html',
    controller: ['$routeParams', 'ActorTag', '$rootScope', 'scopeWatchService', '$scope','$timeout', '$mdSidenav',
        function ActorTagDetailController($routeParams, ActorTag, $rootScope, scopeWatchService, $scope, $timeout, $mdSidenav) {
            var self = this;
            var gotPromise = false;

            self.actorTag = ActorTag.get({actorTagId: $routeParams.actorTagId});
            
            $scope.toggleLeft = buildToggler('left');
            $scope.toggleRight = buildToggler('right');

            function buildToggler(componentId) {
                return function () {
                    $mdSidenav(componentId).toggle();
                }
            }

            self.actorTag.$promise.then(function (result) {

                self.actorPks = result.actors.toString();

                scopeWatchService.actorTagLoaded(result);
                
                $rootScope.title = result.name;
                gotPromise = true;
                
                $timeout(angular.noop, 1000).then(function () {
                        $scope.toggleRight();
                    });

                // alert(self.actorPks)
            });

             $scope.$on("didActorTagLoad", function (event, scene) {

                if (gotPromise){
                    scopeWatchService.actorTagLoaded(self.actorTag)
                }

            });
            
            self.update = function () {
                ActorTag.update({actorTagId: self.actorTag.id}, self.actorTag)
            };
            
            
           

        }
    ]
});
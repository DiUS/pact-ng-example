define(['mockService'], function(MockService) {

    describe('TagModule', function () {

        var provider = new MockService("tag-consumer", "tag-provider", "1234");
        var ctrl, scope;

        beforeEach(module('ngMockE2E'));
        beforeEach(module('TagModule'));

        beforeEach(inject(function($controller, $rootScope) {

            scope = $rootScope.$new();

            ctrl = $controller('TagController', {
                $scope: scope
            });

            scope.$digest();
        }));


        it('should go fetch some tags', function () {
            scope.taggingUrl = "http://localhost:1234/api/search";

            provider
                .given("the tagging service exists")
                .uponReceiving("a request for tags in the Food context which match the query 'chinese'")
                .withRequest("GET", '/api/search?context=Food&query=chinese')
                .willRespondWith({
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                    body: [
                        {
                            "name": "Chinese",
                            "fullName": "Food:Cuisine:Chinese",
                            "path": ["Food","Cuisine","Chinese"]
                        },
                        {
                            "name": "Chinese New Year",
                            "fullName": "Food:Occasion:Chinese New Year",
                            "path": ["Food","Occasion","Chinese New Year"]
                        }
                    ]
                });

            provider.run(function(complete){
                var done = false;

                runs(function() {
                    scope.getTags('chinese').then(function(tags) {
                        expect(tags.length).toEqual(2);
                        done = true;
                        complete();
                    });
                });

                waitsFor(function() { return done; }, "a response", 1000);
            });
        });
    });
});

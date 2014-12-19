;(function(window) {

angular.module('TagModule', ['ui.bootstrap', 'ui.sortable'])
.controller('TagController', ['$scope', '$sce', '$http', function ($scope, $sce, $http) {

    $scope.newTag = '';
    $scope.stringifiedData = '';
    $scope.validationErrors = [];
    $scope.taggingUrl = 'http://dev.tagging.bauer-media.net.au/api/search';

    $('form').submit(function() {
        return $scope.validateTags();
    });

    $scope.init = function (moduledId) {
        $scope.editor = {
            list: [],
            value: ''
        };

        if (moduledId && window[moduledId]) {
            $scope.moduleTitle = window[moduledId].name || "Tags";
            $scope.initList(window[moduledId].data);
        }
    };

    $scope.initList = function (data) {
                       
        if (data && data.list) {
            
            $scope.editor.list = data.list;

            angular.forEach($scope.editor.list, function (item) {
                item.isValid = true;
            });
        }

        $scope.addEmptyItem();
    };

    $scope.addEmptyItem = function () {
        var newItem = {
            tagName: $scope.newTag,
            isValid: false
        };
        $scope.editor.list.push(newItem);
    };

    $scope.removeItem = function ($index) {
        $scope.editor.list.splice($index, 1);
        $scope.updateData();
    };

    $scope.changeItem = function ($index) {
        if ($index == $scope.editor.list.length-1) {
            $scope.addEmptyItem();
        }
    };

    $scope.setItem = function ($index) {
        $scope.editor.list[$index].isValid = true;
        $scope.updateData();
        // focus next enabled/visible input
        $('.tag-list__item input:not(.ng-hide)').eq(1).focus();
    };

    $scope.getValidItems = function (items) {
        var validItems = [];
        angular.forEach(items, function (item) {
            if (item.tagName != "" && item.isValid)
                validItems.push({tagName:item.tagName});
        });
        return validItems;
    };

    $scope.updateData = function () {
        var clonedEditor = $.extend({}, $scope.editor);
        clonedEditor.list = $scope.getValidItems(clonedEditor.list);
        clonedEditor.value = clonedEditor.list.map(function(o){
          return o.tagName;
        });

        $scope.stringifiedData = angular.toJson(clonedEditor);
    };

    $scope.displayTag = function (tagName) {
        var tagDisplay = tagName.replace(/\:([^\:]*)$/,":<strong>$1</strong>");
        return $sce.trustAsHtml(tagDisplay);
    };

    $scope.getTags = function(val) {
        return $http.get($scope.taggingUrl, {
            params: {
                context: 'Food',
                query: val
            }
        }).then(function(resp) {
            return resp.data;
        });
    };

    $scope.$watchCollection('editor.list', function () {
        $scope.updateData();
    });

    /* istanbul ignore next */
    $scope.sortableOptions = {
        handle: ".handle",
        placeholder: "ui-state-highlight",
        axis: "y",
        update: function(e, ui) {
            // the last item is for entering a new tag
            // so don't allow items to be to set as last item
            if (ui.item.sortable.dropindex >= $scope.editor.list.length-1) {
                ui.item.sortable.cancel();
            }
        }
    };

    $scope.validateTags = function () {
        $scope.validationErrors.length = [];
        var currentPageTags = $scope.currentRecipeFormattedTags();
        var validationCategories = $scope.getValidationCategories();
        validationCategories.forEach(function (tag) {
            // Check if all the categories exist for the current recipe
            if (tag.mandatory && $.inArray(tag.category, currentPageTags) === -1) {
                $scope.validationErrors.push('"<b>' + tag.category + '</b>"' + ' tag is mandatory. Please specify at least one ' + '"<b>' + tag.category + '</b>"' + ' tag');
            }

            // Check for single value tags
            if (tag.singleValue) {
                var duplicateTagCount = $.grep(currentPageTags, function (element) {
                    return element === tag.category;
                }).length;
                
                if (duplicateTagCount > 1) {
                    $scope.validationErrors.push('You have specified more than one tag for ' + '"<b>' + tag.category + '</b>"' + ' - only one is allowed.');
                }
            }
        });

        // Add to the Top Error List
        if ($scope.validationErrors.length > 0) {
            var $tabPage = $('.tabpageContent');
            // clear previous erros div
            $tabPage.children('.error').remove();
            $('.tags').children('.error').remove();
            var $list = $('<ul/>');
            $scope.validationErrors.forEach(function(error) {
                $list.append('<li>' + error + '</li>');
            });
            $list.prependTo($tabPage).wrap('<div class="error" style="text-align: left;"></div>');
            $list.clone().prependTo($('.tags')).wrap('<div class="error" style="padding-top:10px;"></div>');
        }

        return $scope.validationErrors.length === 0;
    };
    $scope.getValidationCategories = function () {

        // Will be moved to tagging service
        var result = [];
        var validationJson = '[{"categories":[{"category":"Dish type","mandatory":true,"singleValue":false},{"category":"Occassion","mandatory":false,"singleValue":false},{"category":"Flavours","mandatory":false,"singleValue":false},{"category":"Cuisine","mandatory":true,"singleValue":false},{"category":"Number of ingredients","mandatory":true,"singleValue":true},{"category":"Main ingredient","mandatory":true,"singleValue":false},{"category":"Cooking time","mandatory":true,"singleValue":true},{"category":"Difficulty","mandatory":true,"singleValue":true},{"category":"Diet","mandatory":false,"singleValue":false},{"category":"Allergy","mandatory":false,"singleValue":false},{"category":"Meal","mandatory":true,"singleValue":false},{"category":"Season","mandatory":false,"singleValue":true},{"category":"Price/cost","mandatory":true,"singleValue":true},{"category":"Drink match","mandatory":false,"singleValue":false},{"category":"Cooking method","mandatory":false,"singleValue":false},{"category":"Equipment","mandatory":false,"singleValue":false},{"category":"Serving size","mandatory":false,"singleValue":true}],"version":1}]';
        var categories = angular.fromJson(validationJson);
        categories.forEach(function (data) {
            result = data.categories;
        });
        return result;
    }

    $scope.currentRecipeFormattedTags = function  () {
        var tags = [];
        $scope.editor.list.forEach(function (item) {
            var regExp = /\:([^:]+)\:/; // Match everything between ":" and ":" and exclude :
            var tag = regExp.exec(item.tagName);
            if (tag !== null) {
                tags.push(tag[1]);
            }
        });
        return tags;
    };
}]);

})(window);

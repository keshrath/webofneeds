/**
 * Created by maxstolze on 19.02.2018.
 */
import angular from "angular";

import "ng-redux";
import needMapModule from "./need-map.js";

import { attach } from "../utils.js";
import { actionCreators } from "../actions/actions.js";
import { connect2Redux } from "../won-utils.js";

//TODO can't inject $scope with the angular2-router, preventing redux-cleanup
const serviceDependencies = [
  "$ngRedux",
  "$scope",
  "$element" /*, '$routeParams' /*injections as strings here*/,
];

function genComponentConf() {
  const template = `
        	<h2 class="post-info__heading"
                ng-show="self.seeksPart.seeks.get('title')">
                Title
            </h2>
            <p class="post-info__details"
                ng-show="self.seeksPart.seeks.get('title')">
                {{ self.seeksPart.seeks.get('title')}}
            </p>
            <h2 class="post-info__heading"
                ng-show="self.seeksPart.seeks.get('description')">
                Description
            </h2>
            <p class="post-info__details--prewrap" ng-show="self.seeksPart.seeks.get('description')">{{ self.seeksPart.seeks.get('description')}}</p> <!-- no spaces or newlines within the code-tag, because it is preformatted -->
            <h2 class="post-info__heading"
                ng-show="self.seeksPart.seeks.get('tags')">
                Tags
            </h2>
            <div class="post-info__details post-info__tags"
                ng-show="self.seeksPart.seeks.get('tags')">
                    <span class="post-info__tags__tag" ng-repeat="tag in self.seeksPart.seeks.get('tags').toJS()">#{{tag}}</span>
            </div>

            <h2 class="post-info__heading"
                ng-show="self.seeksPart.location">
                Location
            </h2>
            <p class="post-info__details clickable"
                ng-show="self.seeksPart.address"  ng-click="self.toggleMap()">
                {{ self.seeksPart.address }}
                <svg class="post-info__carret">
                  <use xlink:href="#ico-filter_map" href="#ico-filter_map"></use>
                </svg>
				<svg class="post-info__carret" ng-show="!self.showMap">
	               <use xlink:href="#ico16_arrow_down" href="#ico16_arrow_down"></use>
	            </svg>
                <svg class="post-info__carret" ng-show="self.showMap">
                   <use xlink:href="#ico16_arrow_up" href="#ico16_arrow_up"></use>
                </svg>
            </p>                
            <won-need-map 
                uri="self.seeksPart.postUri"
                is-seeks="self.seeksPart.seeksString"
                ng-if="self.seeksPart.location && self.showMap">
            </won-need-map>
    	`;

  class Controller {
    constructor(/* arguments <- serviceDependencies */) {
      attach(this, serviceDependencies, arguments);

      //TODO debug; deleteme
      window.cis4dbg = this;

      this.showMap = false;

      const selectFromState = () => {
        return {};
      };

      // Using actionCreators like this means that every action defined there is available in the template.
      connect2Redux(selectFromState, actionCreators, [], this);
    }

    toggleMap() {
      this.showMap = !this.showMap;
    }
  }

  Controller.$inject = serviceDependencies;

  return {
    restrict: "E",
    controller: Controller,
    controllerAs: "self",
    bindToController: true, //scope-bindings -> ctrl
    scope: {
      seeksPart: "=",
    },
    template: template,
  };
}

export default //.controller('CreateNeedController', [...serviceDependencies, CreateNeedController])
angular
  .module("won.owner.components.postSeeksInfo", [needMapModule])
  .directive("wonPostSeeksInfo", genComponentConf).name;

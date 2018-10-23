/**
 * Created by ksinger on 10.05.2016.
 */

import angular from "angular";
import postShareLinkModule from "./post-share-link.js";
import { attach } from "../utils.js";
import won from "../won-es6.js";
import { labels, relativeTime } from "../won-label-utils.js";
import { connect2Redux } from "../won-utils.js";
import { selectLastUpdateTime } from "../selectors.js";
import { actionCreators } from "../actions/actions.js";
import ratingView from "./rating-view.js";

import "style/_post-content-general.scss";

const serviceDependencies = ["$ngRedux", "$scope", "$element"];
function genComponentConf() {
  let template = `
      <div class="pcg__columns">
        <div class="pcg__columns__left">
          <div class="pcg__columns__left__item" ng-if="self.persona">
            <div class="pcg__columns__left__item__label">
              Author
            </div>
            <div class="pcg__columns__left__item__value">
              {{ self.persona.getIn(['jsonld', 's:name']) }}
              <won-rating-view rating="self.rating()"></won-rating-view>
            </div>
          </div>
          <div class="pcg__columns__left__item" ng-if="self.friendlyTimestamp">
            <div class="pcg__columns__left__item__label">
              Created
            </div>
            <div class="pcg__columns__left__item__value">
              {{ self.friendlyTimestamp }}
            </div>
          </div>
          <div class="pcg__columns__left__item" ng-if="self.post.get('type')">
            <div class="pcg__columns__left__item__label">
              Type
            </div>
            <div class="pcg__columns__left__item__value">
              {{self.labels.type[self.post.get('type')]}}{{self.post.get('matchingContexts')? ' in '+ self.post.get('matchingContexts').join(', ') : '' }}
            </div>
          </div>
        </div>
        <div class="pcg__columns__right" ng-if="self.hasFlags && self.hasFlags.size > 0">
          <div class="pcg__columns__right__item">
            <div class="pcg__columns__right__item__label">
              Flags
            </div>
            <div class="pcg__columns__right__item__value">
              <span class="pcg__columns__right__item__value__flag" ng-repeat="flag in self.hasFlags.toArray()">{{ self.labels.flags[flag]? self.labels.flags[flag] : flag }}</span>
            </div>
          </div>
        </div>
      </div>
      <won-post-share-link
        ng-if="!self.preventSharing"
        post-uri="self.post.get('uri')">
      </won-post-share-link>
    `;

  class Controller {
    constructor() {
      attach(this, serviceDependencies, arguments);
      window.pcg4dbg = this;
      this.labels = labels;

      const selectFromState = state => {
        const post = this.postUri && state.getIn(["needs", this.postUri]);
        const hasFlags = post && post.get("hasFlags");

        const persona = post
          ? state.getIn(["needs", post.get("heldBy")])
          : undefined;

        return {
          WON: won.WON,
          post,
          type: post && post.get("type"),
          hasFlags,
          persona:
            persona && persona.get("holds").includes(post.get("uri"))
              ? persona
              : undefined,
          preventSharing:
            (post && post.get("state") === won.WON.InactiveCompacted) ||
            (hasFlags &&
              hasFlags.filter(
                flag => flag === won.WON.NoHintForCounterpartCompacted
              ).size > 0),
          friendlyTimestamp:
            post &&
            relativeTime(selectLastUpdateTime(state), post.get("creationDate")),
        };
      };
      connect2Redux(selectFromState, actionCreators, ["self.postUri"], this);
    }

    rating() {
      let sum = 0;
      for (const char of this.persona.get("uri")) {
        sum += char.charCodeAt(0);
      }
      return (sum % 5) + 1;
    }
  }

  Controller.$inject = serviceDependencies;
  return {
    restrict: "E",
    controller: Controller,
    controllerAs: "self",
    bindToController: true, //scope-bindings -> ctrl
    template: template,
    scope: {
      postUri: "=",
    },
  };
}

export default angular
  .module("won.owner.components.postContentGeneral", [
    postShareLinkModule,
    ratingView,
  ])
  .directive("wonPostContentGeneral", genComponentConf).name;

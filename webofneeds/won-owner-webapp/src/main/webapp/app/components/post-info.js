/**
 * Created by ksinger on 10.05.2016.
 */

import angular from "angular";
import postHeaderModule from "./post-header.js";
import postContextDropdownModule from "./post-context-dropdown.js";
import postContentModule from "./post-content.js";
import postMenuModule from "./post-menu.js";
import shareDropdownModule from "./share-dropdown.js";
import { attach, get, getIn } from "../utils.js";
import { connect2Redux } from "../won-utils.js";
import * as processUtils from "../process-utils.js";
import * as needUtils from "../need-utils.js";
import { getPostUriFromRoute } from "../selectors/general-selectors.js";
import { actionCreators } from "../actions/actions.js";
import { classOnComponentRoot } from "../cstm-ng-utils.js";

import * as useCaseUtils from "../usecase-utils.js";

import "style/_post-info.scss";

const serviceDependencies = ["$ngRedux", "$scope", "$element"];
function genComponentConf() {
  let template = `
        <div class="post-info__header" ng-if="self.includeHeader">
            <div class="post-info__header__back">
              <a class="post-info__header__back__button clickable show-in-responsive"
                 ng-if="!self.showOverlayNeed"
                 ng-click="self.router__back()"> <!-- TODO: Clicking on the back button in non-mobile view might lead to some confusing changes -->
                  <svg class="post-info__header__back__button__icon">
                      <use xlink:href="#ico36_backarrow" href="#ico36_backarrow"></use>
                  </svg>
              </a>
              <a class="post-info__header__back__button clickable hide-in-responsive"
                  ng-if="!self.showOverlayNeed"
                  ng-click=" self.router__stateGoCurrent({postUri : undefined})">
                  <svg class="post-info__header__back__button__icon">
                      <use xlink:href="#ico36_backarrow" href="#ico36_backarrow"></use>
                  </svg>
              </a>
              <a class="post-info__header__back__button clickable"
                  ng-if="self.showOverlayNeed"
                  ng-click="self.router__back()">
                  <svg class="post-info__header__back__button__icon clickable hide-in-responsive">
                      <use xlink:href="#ico36_close" href="#ico36_close"></use>
                  </svg>
                  <svg class="post-info__header__back__button__icon clickable show-in-responsive">
                      <use xlink:href="#ico36_backarrow" href="#ico36_backarrow"></use>
                  </svg>
              </a>
            </div>
            <won-post-header
                need-uri="self.post.get('uri')">
            </won-post-header>
            <won-share-dropdown need-uri="self.post.get('uri')"></won-share-dropdown>
            <won-post-context-dropdown need-uri="self.post.get('uri')"></won-post-context-dropdown>
        </div>
        <won-post-menu post-uri="self.postUri"></won-post-menu>
        <won-post-content post-uri="self.postUri"></won-post-content>
        <div class="post-info__footer" ng-if="self.showFooter">
            <button class="won-button--filled red post-info__footer__button"
                ng-if="self.hasFollowUpOwner"
                ng-repeat="ucIdentifier in self.followUpOwnerArray"
                ng-click="self.router__stateGoCurrent({useCase: ucIdentifier, useCaseGroup: undefined, postUri: undefined, fromNeedUri: self.postUri, mode: 'CONNECT'})">
                <svg class="won-button-icon" style="--local-primary:white;" ng-if="self.getUseCaseIcon(ucIdentifier)">
                    <use xlink:href="{{ self.getUseCaseIcon(ucIdentifier) }}" href="{{ self.getUseCaseIcon(ucIdentifier) }}"></use>
                </svg>
                <span>{{ self.getUseCaseLabel(ucIdentifier) }}</span>
            </button>
            <button class="won-button--filled red post-info__footer__button"
                ng-if="self.showCreateWhatsAround"
                ng-click="self.createWhatsAround()"
                ng-disabled="self.processingPublish">
                <svg class="won-button-icon" style="--local-primary:white;">
                    <use xlink:href="#ico36_location_current" href="#ico36_location_current"></use>
                </svg>
                <span ng-if="!self.processingPublish">What's in your Area?</span>
                <span ng-if="self.processingPublish">Finding out what's going on&hellip;</span>
            </button>
        </div>
    `;

  class Controller {
    constructor() {
      attach(this, serviceDependencies, arguments);
      window.pi4dbg = this;

      const selectFromState = state => {
        /*
          If the post-info component has a need-uri attribute we display this need-uri instead of the postUriFromTheRoute
          This way we can include a overlay-close button instead of the current back-button handling
        */
        const postUri = this.needUri
          ? this.needUri
          : getPostUriFromRoute(state);
        const post = state.getIn(["needs", postUri]);
        const process = get(state, "process");

        const postLoading =
          !post || processUtils.isNeedLoading(process, postUri);
        const postFailedToLoad =
          post && processUtils.hasNeedFailedToLoad(process, postUri);
        const showCreateWhatsAround =
          post && needUtils.isOwned(post) && needUtils.isWhatsNewNeed(post);

        const followUpOwner =
          post &&
          needUtils.isOwned(post) &&
          getIn(post, ["matchedUseCase", "followUpOwner"]);
        const hasFollowUpOwner = followUpOwner && followUpOwner.size > 0;

        return {
          processingPublish: state.getIn(["process", "processingPublish"]),
          postUri,
          post,
          postLoading,
          postFailedToLoad,
          hasFollowUpOwner,
          followUpOwnerArray: followUpOwner && followUpOwner.toArray(),
          createdTimestamp: post && post.get("creationDate"),
          showOverlayNeed: !!this.needUri,
          showCreateWhatsAround,
          showFooter:
            !postLoading &&
            !postFailedToLoad &&
            (showCreateWhatsAround || hasFollowUpOwner),
        };
      };
      connect2Redux(
        selectFromState,
        actionCreators,
        ["self.includeHeader", "self.needUri"],
        this
      );

      classOnComponentRoot("won-is-loading", () => this.postLoading, this);
    }

    getUseCaseIcon(identifier) {
      const useCase = useCaseUtils.getUseCase(identifier);

      return useCase.icon;
    }

    getUseCaseLabel(identifier) {
      const useCase = useCaseUtils.getUseCase(identifier);

      return useCase.label;
    }

    createWhatsAround() {
      if (!this.processingPublish) {
        this.needs__whatsAround();
      }
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
      includeHeader: "=",
      needUri: "=",
    },
  };
}

export default angular
  .module("won.owner.components.postInfo", [
    postHeaderModule,
    postMenuModule,
    postContextDropdownModule,
    postContentModule,
    shareDropdownModule,
  ])
  .directive("wonPostInfo", genComponentConf).name;

import angular from "angular";

import won from "../../won-es6.js";
import { connect2Redux } from "../../won-utils.js";
import { attach, get, getIn } from "../../utils.js";
import { actionCreators } from "../../actions/actions.js";
import {
  selectNeedByConnectionUri,
  selectAllConnections,
  selectAllTheirNeeds,
} from "../../selectors.js";
import trigModule from "../trig.js";
import { labels } from "../../won-label-utils.js";
import { classOnComponentRoot } from "../../cstm-ng-utils.js";
import squareImageModule from "../square-image.js";

import "style/_combined-message-content.scss";

const serviceDependencies = ["$ngRedux", "$scope", "$element"];

function genComponentConf() {
  let template = `
      <div class="msg__header" ng-if="!self.isConnectionMessage && !self.hasNotBeenLoaded">
          <div class="msg__header__type">{{ self.getHeaderLabel() }}</div>
      </div>
      <div class="msg__header msg__header--inject-into" ng-if="self.isConnectionMessage && self.isInjectIntoMessage && !self.hasNotBeenLoaded">
          <div class="msg__header__type">Forward to:</div>
          <won-square-image
            class="msg__header__inject"
            ng-class="{'clickable': self.isConnectionPresent(connUri)}"
            ng-repeat="connUri in self.injectIntoArray"
            title="self.getRemoteNeedTitle(connUri)"
            uri="self.getRemoteNeedUri(connUri)"
            ng-click="!self.multiSelectType && self.isConnectionPresent(connUri) && self.router__stateGoCurrent({connectionUri: connUri})">
          </won-square-image>
      </div>
      <div class="msg__header msg__header--forwarded-from" ng-if="self.isConnectionMessage && self.originatorUri && !self.hasNotBeenLoaded">
          <div class="msg__header__type">Forwarded from:</div>
          <won-square-image
            class="msg__header__originator"
            uri="self.originatorUri">
          </won-square-image>
      </div>
      <won-message-content
          ng-if="self.hasContent || self.hasNotBeenLoaded"
          message-uri="self.messageUri"
          connection-uri="self.connectionUri">
      </won-message-content>
      <won-referenced-message-content
          ng-if="self.hasReferences"
          message-uri="self.messageUri"
          connection-uri="self.connectionUri">
      </won-referenced-message-content>
      <won-trig
          trig="self.contentGraphTrig"
          ng-if="self.shouldShowRdf && self.contentGraphTrig">
      </won-trig>
    `;

  class Controller {
    constructor(/* arguments = dependency injections */) {
      attach(this, serviceDependencies, arguments);

      const selectFromState = state => {
        const ownNeed =
          this.connectionUri &&
          selectNeedByConnectionUri(state, this.connectionUri);
        const connection =
          ownNeed && ownNeed.getIn(["connections", this.connectionUri]);

        const message =
          connection &&
          this.messageUri &&
          getIn(connection, ["messages", this.messageUri]);

        const messageType = message && message.get("messageType");
        const injectInto = message && message.get("injectInto");

        const allConnections = selectAllConnections(state);
        const theirNeeds = selectAllTheirNeeds(state);

        return {
          theirNeeds,
          allConnections,
          multiSelectType: connection && connection.get("multiSelectType"),
          contentGraphTrig: get(message, "contentGraphTrigRaw"),
          shouldShowRdf: state.get("showRdf"),
          hasContent: message && message.get("hasContent"),
          hasNotBeenLoaded: !message,
          hasReferences: message && message.get("hasReferences"),
          isInjectIntoMessage: injectInto && injectInto.size > 0,
          originatorUri: message && message.get("originatorUri"),
          injectIntoArray: injectInto && Array.from(injectInto.toSet()),
          messageType,
          isConnectionMessage: messageType === won.WONMSG.connectionMessage,
        };
      };

      connect2Redux(
        selectFromState,
        actionCreators,
        ["self.connectionUri", "self.messageUri"],
        this
      );

      classOnComponentRoot(
        "won-has-non-ref-content",
        () =>
          !this.isConnectionMessage || this.hasContent || this.hasNotBeenLoaded,
        this
      );
      classOnComponentRoot(
        "won-has-ref-content",
        () => this.hasReferences,
        this
      );
    }

    getHeaderLabel() {
      const headerLabel = labels.messageType[this.messageType];
      return headerLabel || this.messageType;
    }

    getRemoteNeedUri(connectionUri) {
      const connection =
        this.allConnections && this.allConnections.get(connectionUri);
      return connection && connection.get("remoteNeedUri");
    }

    getRemoteNeedTitle(connectionUri) {
      const remoteNeedUri = this.getRemoteNeedUri(connectionUri);
      const remoteNeed = remoteNeedUri && this.theirNeeds.get(remoteNeedUri);

      return remoteNeed && remoteNeed.get("humanReadable");
    }

    isConnectionPresent(connectionUri) {
      return this.allConnections && !!this.allConnections.get(connectionUri);
    }
  }
  Controller.$inject = serviceDependencies;

  return {
    restrict: "E",
    controller: Controller,
    controllerAs: "self",
    bindToController: true, //scope-bindings -> ctrl
    scope: {
      messageUri: "=",
      connectionUri: "=",
    },
    template: template,
  };
}

export default angular
  .module("won.owner.components.combinedMessageContent", [
    trigModule,
    squareImageModule,
  ])
  .directive("wonCombinedMessageContent", genComponentConf).name;

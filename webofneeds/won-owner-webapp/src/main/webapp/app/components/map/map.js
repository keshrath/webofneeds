/**
 * Created by quasarchimaere on 04.04.2019.
 */
import angular from "angular";
import ngAnimate from "angular-animate";
import { attach, getIn, get, delay } from "../../utils.js";
import { connect2Redux } from "../../won-utils.js";
import won from "../../won-es6.js";
import { actionCreators } from "../../actions/actions.js";
import postMessagesModule from "../post-messages.js";
import atomCardModule from "../atom-card.js";
import atomMapModule from "../atom-map.js";
import postHeaderModule from "../post-header.js";
import * as generalSelectors from "../../selectors/general-selectors.js";
import * as viewSelectors from "../../selectors/view-selectors.js";
import * as processUtils from "../../process-utils.js";
import * as wonLabelUtils from "../../won-label-utils.js";
import * as atomUtils from "../../atom-utils.js";

import "style/_map.scss";
import "style/_atom-overlay.scss";
import "style/_connection-overlay.scss";

const serviceDependencies = ["$ngRedux", "$scope"];
class Controller {
  constructor() {
    attach(this, serviceDependencies, arguments);
    this.selection = 0;
    window.ownermap4dbg = this;
    this.WON = won.WON;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        currentLocation => {
          const lat = currentLocation.coords.latitude;
          const lng = currentLocation.coords.longitude;

          this.currentLocation = { lat, lng };
        },
        error => {
          //error handler
          console.error(
            "Could not retrieve geolocation due to error: ",
            error.code,
            ", continuing map initialization without currentLocation. fullerror:",
            error
          );
          console.error("LOCATION COULD NOT BE RETRIEVED");
        },
        {
          //options
          enableHighAccuracy: true,
          maximumAge: 30 * 60 * 1000, //use if cache is not older than 30min
        }
      );
    } else {
      console.error("LOCATION COULD NOT BE RETRIEVED");
    }

    const selectFromState = state => {
      const viewAtomUri = generalSelectors.getViewAtomUriFromRoute(state);
      const viewConnUri = generalSelectors.getViewConnectionUriFromRoute(state);

      const atomsWithLocation = getIn(state, ["owner", "whatsAround"]).filter(
        metaAtom => atomUtils.hasLocation(metaAtom)
      );

      const atomUrisArray = atomsWithLocation && [...atomsWithLocation.keys()];

      const lastAtomUrisUpdateDate = getIn(state, [
        "owner",
        "lastWhatsAroundUpdateTime",
      ]);

      const process = get(state, "process");
      const isOwnerAtomUrisLoading = processUtils.isProcessingWhatsAround(
        process
      );
      const isOwnerAtomUrisToLoad =
        !lastAtomUrisUpdateDate && !isOwnerAtomUrisLoading;

      let locations = [];
      atomsWithLocation &&
        atomsWithLocation.map(atom => {
          const atomLocation = atomUtils.getLocation(atom);
          locations.push(atomLocation);
        });

      return {
        locations,
        atomsWithLocation,
        lastAtomUrisUpdateDate,
        friendlyLastAtomUrisUpdateTimestamp:
          lastAtomUrisUpdateDate &&
          wonLabelUtils.relativeTime(
            generalSelectors.selectLastUpdateTime(state),
            lastAtomUrisUpdateDate
          ),
        atomUrisArray,
        atomUrisSize: atomsWithLocation ? atomsWithLocation.size : 0,
        isOwnerAtomUrisLoading,
        isOwnerAtomUrisToLoad,
        showSlideIns:
          viewSelectors.hasSlideIns(state) && viewSelectors.showSlideIns(state),
        showModalDialog: viewSelectors.showModalDialog(state),
        showAtomOverlay: !!viewAtomUri,
        showConnectionOverlay: !!viewConnUri,
        viewAtomUri,
        viewConnUri,
      };
    };

    connect2Redux(selectFromState, actionCreators, [], this);

    this.$scope.$watch(
      () => this.isOwnerAtomUrisToLoad,
      () => delay(0).then(() => this.ensureAtomUrisLoaded())
    );
  }

  ensureAtomUrisLoaded() {
    if (this.isOwnerAtomUrisToLoad && this.currentLocation) {
      this.atoms__fetchWhatsAround(undefined, this.currentLocation, 5000);
    }
  }

  reload() {
    if (!this.isOwnerAtomUrisLoading) {
      if (this.lastAtomUrisUpdateDate) {
        this.atoms__fetchWhatsAround(
          new Date(this.lastAtomUrisUpdateDate),
          this.currentLocation,
          5000
        );
      } else {
        this.atoms__fetchWhatsAround(undefined, this.currentLocation, 5000);
      }
    }
  }
}

Controller.$inject = serviceDependencies;

export default angular
  .module("won.owner.components.map", [
    ngAnimate,
    postMessagesModule,
    atomMapModule,
    atomCardModule,
    postHeaderModule,
  ])
  .controller("MapController", Controller).name;

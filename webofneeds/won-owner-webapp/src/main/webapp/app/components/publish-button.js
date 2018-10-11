import angular from "angular";
import { Elm } from "../../elm/PublishButton.elm";
import "./svg-icon.js";

function genComponentConf($ngRedux) {
  return {
    restrict: "E",
    scope: {
      isValid: "=",
      onPublish: "&",
    },
    link: (scope, element) => {
      const elmApp = Elm.PublishButton.init({ node: element[0] });

      scope.$watch("isValid", newValue => {
        elmApp.ports.publishIn.send({
          draftValid: newValue ? true : false,
          loggedIn: $ngRedux.getState().getIn(["user", "loggedIn"]),
        });
      });

      const convertPersonas = personas => {
        const conversion = personas
          .entrySeq()
          .map(([url, persona]) => {
            return {
              url: url,
              ...persona,
            };
          })
          .toJS();
        return conversion;
      };

      elmApp.ports.publishIn.send({
        draftValid: scope.isValid ? true : false,
        loggedIn: $ngRedux.getState().getIn(["user", "loggedIn"]),
      });

      const personas = $ngRedux.getState().get("personas");
      if (personas) {
        elmApp.ports.personaIn.send(convertPersonas(personas));
      }

      const disconnect = $ngRedux.connect(state => {
        return {
          personas: state.get("personas"),
          loggedIn: state.getIn(["user", "loggedIn"]),
        };
      })(state => {
        elmApp.ports.publishIn.send({
          draftValid: scope.isValid ? true : false,
          loggedIn: state.loggedIn,
        });
        if (!state.personas) {
          return;
        }
        elmApp.ports.personaIn.send(convertPersonas(state.personas));
      });

      elmApp.ports.publishOut.subscribe(url => {
        scope.onPublish({ persona: url });
      });

      scope.$on("$destroy", () => {
        disconnect();
        elmApp.ports.publishOut.unsubscribe();
      });
    },
  };
}

genComponentConf.$inject = ["$ngRedux"];
export default angular
  .module("won.owner.components.publishButton", [])
  .directive("wonPublishButton", genComponentConf).name;

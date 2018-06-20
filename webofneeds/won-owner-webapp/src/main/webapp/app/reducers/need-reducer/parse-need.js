import Immutable from "immutable";
import won from "../../won-es6.js";

export function parseNeed(jsonldNeed, ownNeed) {
  const jsonldNeedImm = Immutable.fromJS(jsonldNeed);

  let parsedNeed = {
    uri: undefined,
    nodeUri: undefined,
    title: undefined,
    type: undefined,
    state: undefined,
    connections: Immutable.Map(),
    creationDate: undefined,
    lastUpdateDate: undefined,
    unread: false,
    ownNeed: !!ownNeed,
    isBeingCreated: false,
    isWhatsAround: false,
    isWhatsNew: false,
    matchingContexts: undefined,
    jsonld: jsonldNeed,
  };

  if (jsonldNeedImm) {
    const uri = jsonldNeedImm.get("@id");
    const nodeUri = jsonldNeedImm.getIn(["won:hasWonNode", "@id"]);
    const isPresent = !!jsonldNeedImm.getIn(["won:is", "dc:title"]);
    const seeksPresent = !!jsonldNeedImm.getIn(["won:seeks", "dc:title"]);
    const is = jsonldNeedImm.get("won:is");
    const seeks = jsonldNeedImm.get("won:seeks");

    //TODO We need to decide which is the main title? Or combine?
    const title = isPresent
      ? is.get("dc:title")
      : seeksPresent
        ? seeks.get("dc:title")
        : undefined;

    if (!!uri && !!title) {
      parsedNeed.uri = uri;
      parsedNeed.title = title;
    } else {
      return undefined;
    }

    /*
         * The following code-snippet is solely to determine if the parsed need
         * is a special "whats around"-need, in order to do this we have to make
         * sure that the won:hasFlag is checked in two forms, both as a string
         * and an immutable object
         */
    const wonHasFlags = jsonldNeedImm.get("won:hasFlag");
    const isWhatsAround =
      wonHasFlags &&
      wonHasFlags.filter(function(flag) {
        if (flag instanceof Immutable.Map) {
          return flag.get("@id") === "won:WhatsAround";
        } else {
          return flag === "won:WhatsAround";
        }
      }).size > 0;

    const isWhatsNew =
      wonHasFlags &&
      wonHasFlags.filter(function(flag) {
        if (flag instanceof Immutable.Map) {
          return flag.get("@id") === "won:WhatsNew";
        } else {
          return flag === "won:WhatsNew";
        }
      }).size > 0;

    const wonHasMatchingContexts = jsonldNeedImm.get("won:hasMatchingContext");

    const creationDate =
      jsonldNeedImm.get("dct:created") ||
      jsonldNeedImm.get("http://purl.org/dc/terms/created");
    if (creationDate) {
      parsedNeed.creationDate = new Date(creationDate);
      parsedNeed.lastUpdateDate = parsedNeed.creationDate;
    }

    const state = jsonldNeedImm.getIn([won.WON.isInStateCompacted, "@id"]);
    if (state === won.WON.ActiveCompacted) {
      // we use to check for active
      // state and everything else
      // will be inactive
      parsedNeed.state = state;
    } else {
      parsedNeed.state = won.WON.InactiveCompacted;
    }

    let isPart = undefined;
    let seeksPart = undefined;
    let type = undefined;

    /*
         let description = undefined;
         let tags = undefined;
         let location = undefined;
         */
    //TODO: Type concept?
    if (isPresent) {
      type = seeksPresent
        ? won.WON.BasicNeedTypeCombinedCompacted
        : won.WON.BasicNeedTypeSupplyCompacted;
      let tags = is.get("won:hasTag") ? is.get("won:hasTag") : undefined;
      isPart = {
        title: is.get("dc:title"),
        type: type,
        description: is.get("dc:description")
          ? is.get("dc:description")
          : undefined,
        tags: tags
          ? Immutable.List.isList(tags)
            ? tags
            : Immutable.List.of(tags)
          : undefined,
        location: is.get("won:hasLocation")
          ? parseLocation(is.get("won:hasLocation"))
          : undefined,
        travelAction: is.get("won:travelAction")
          ? parseTravelAction(is.get("won:travelAction"))
          : undefined,
      };
    }
    if (seeksPresent) {
      type = isPresent ? type : won.WON.BasicNeedTypeDemandCompacted;
      let tags = seeks.get("won:hasTag") ? seeks.get("won:hasTag") : undefined;
      seeksPart = {
        title: seeks.get("dc:title"),
        type: type,
        description: seeks.get("dc:description")
          ? seeks.get("dc:description")
          : undefined,
        tags: tags
          ? Immutable.List.isList(tags)
            ? tags
            : Immutable.List.of(tags)
          : undefined,
        location: seeks.get("won:hasLocation")
          ? parseLocation(seeks.get("won:hasLocation"))
          : undefined,
        travelAction: seeks.get("won:travelAction")
          ? parseTravelAction(seeks.get("won:travelAction"))
          : undefined,
      };
    }

    parsedNeed.is = isPart;
    parsedNeed.seeks = seeksPart;

    if (isWhatsAround) {
      parsedNeed.type = won.WON.BasicNeedTypeWhatsAroundCompacted;
    } else if (isWhatsNew) {
      parsedNeed.type = won.WON.BasicNeedTypeWhatsNewCompacted;
    } else {
      parsedNeed.type = type;
    }

    parsedNeed.isWhatsAround = !!isWhatsAround;
    parsedNeed.isWhatsNew = !!isWhatsNew;
    parsedNeed.matchingContexts = wonHasMatchingContexts
      ? Immutable.List.isList(wonHasMatchingContexts)
        ? wonHasMatchingContexts
        : Immutable.List.of(wonHasMatchingContexts)
      : undefined;
    parsedNeed.nodeUri = nodeUri;
  } else {
    console.error(
      "Cant parse need, data is an invalid need-object: ",
      jsonldNeedImm && jsonldNeedImm.toJS()
    );
    return undefined;
  }

  return Immutable.fromJS(parsedNeed);
}

function parseLocation(jsonldLocation) {
  if (!jsonldLocation) return undefined; // NO LOCATION PRESENT

  const jsonldLocationImm = Immutable.fromJS(jsonldLocation);

  let location = {
    address: undefined,
    lat: undefined,
    lng: undefined,
    nwCorner: {
      lat: undefined,
      lng: undefined,
    },
    seCorner: {
      lat: undefined,
      lng: undefined,
    },
  };

  location.address =
    jsonldLocationImm.get("s:name") ||
    jsonldLocationImm.get("http://schema.org/name");

  location.lat = Number.parseFloat(
    jsonldLocationImm.getIn(["s:geo", "s:latitude"]) ||
      jsonldLocationImm.getIn([
        "http://schema.org/geo",
        "http://schema.org/latitude",
      ])
  );
  location.lng = Number.parseFloat(
    jsonldLocationImm.getIn(["s:geo", "s:longitude"]) ||
      jsonldLocationImm.getIn([
        "http://schema.org/geo",
        "http://schema.org/longitude",
      ])
  );

  location.nwCorner.lat = Number.parseFloat(
    jsonldLocationImm.getIn([
      "won:hasBoundingBox",
      "won:hasNorthWestCorner",
      "s:latitude",
    ]) ||
      jsonldLocationImm.getIn([
        "won:hasBoundingBox",
        "won:hasNorthWestCorner",
        "http://schema.org/latitude",
      ])
  );
  location.nwCorner.lng = Number.parseFloat(
    jsonldLocationImm.getIn([
      "won:hasBoundingBox",
      "won:hasNorthWestCorner",
      "s:longitude",
    ]) ||
      jsonldLocationImm.getIn([
        "won:hasBoundingBox",
        "won:hasNorthWestCorner",
        "http://schema.org/longitude",
      ])
  );
  location.seCorner.lat = Number.parseFloat(
    jsonldLocationImm.getIn([
      "won:hasBoundingBox",
      "won:hasSouthEastCorner",
      "s:latitude",
    ]) ||
      jsonldLocationImm.getIn([
        "won:hasBoundingBox",
        "won:hasSouthEastCorner",
        "http://schema.org/latitude",
      ])
  );
  location.seCorner.lng = Number.parseFloat(
    jsonldLocationImm.getIn([
      "won:hasBoundingBox",
      "won:hasSouthEastCorner",
      "s:longitude",
    ]) ||
      jsonldLocationImm.getIn([
        "won:hasBoundingBox",
        "won:hasSouthEastCorner",
        "http://schema.org/longitude",
      ])
  );

  if (
    location.address &&
    location.lat &&
    location.lng &&
    location.nwCorner.lat &&
    location.nwCorner.lng &&
    location.seCorner.lat &&
    location.seCorner.lng
  ) {
    return Immutable.fromJS(location);
  }

  console.error(
    "Cant parse location, data is an invalid location-object: ",
    jsonldLocationImm.toJS()
  );
  return undefined;
}

function parseTravelAction(jsonTravelAction) {
  if (!jsonTravelAction) return undefined;

  const travelActionImm = Immutable.fromJS(jsonTravelAction);

  let travelAction = {
    fromAddress: undefined,
    fromLocation: {
      lat: undefined,
      lng: undefined,
    },
    toAddress: undefined,
    toLocation: {
      lat: undefined,
      lng: undefined,
    },
  };

  travelAction.fromAddress =
    travelActionImm.getIn(["s:fromLocation", "s:name"]) ||
    travelActionImm.getIn([
      "http://schema.org/fromLocation",
      "http://schema.org/name",
    ]);

  travelAction.fromLocation.lat =
    travelActionImm.getIn(["s:fromLocation", "s:geo", "s:latitude"]) ||
    travelActionImm.getIn([
      "http://schema.org/fromLocation",
      "http://schema.org/geo",
      "http://schema.org/latitude",
    ]);

  travelAction.fromLocation.lng =
    travelActionImm.getIn(["s:fromLocation", "s:geo", "s:longitude"]) ||
    travelActionImm.getIn([
      "http://schema.org/fromLocation",
      "http://schema.org/geo",
      "http://schema.org/longitude",
    ]);

  travelAction.toAddress =
    travelActionImm.getIn(["s:toLocation", "s:name"]) ||
    travelActionImm.getIn([
      "http://schema.org/toLocation",
      "http://schema.org/name",
    ]);

  travelAction.toLocation.lat =
    travelActionImm.getIn(["s:toLocation", "s:geo", "s:latitude"]) ||
    travelActionImm.getIn([
      "http://schema.org/toLocation",
      "http://schema.org/geo",
      "http://schema.org/latitude",
    ]);

  travelAction.toLocation.lng =
    travelActionImm.getIn(["s:toLocation", "s:geo", "s:longitude"]) ||
    travelActionImm.getIn([
      "http://schema.org/toLocation",
      "http://schema.org/geo",
      "http://schema.org/longitude",
    ]);

  if (
    (travelAction.fromAddress &&
      travelAction.fromLocation.lat &&
      travelAction.fromLocation.lng) ||
    (travelAction.toAddress &&
      travelAction.toLocation.lat &&
      travelAction.toLocation.lng)
  ) {
    return Immutable.fromJS(travelAction);
  }

  console.error(
    "Cant parse travelAction, data is an invalid travelAction-object: ",
    travelActionImm.toJS()
  );
}
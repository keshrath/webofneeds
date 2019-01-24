/**
 * Created by fsuda on 18.09.2018.
 */
import { details, emptyDraft } from "../detail-definitions.js";
import { interestsDetail, skillsDetail } from "../details/person.js";
import { findLatestIntervallEndInJsonLdOrNowAndAddMillis } from "../../app/won-utils.js";

export const phdOffer = {
  identifier: "phdOffer",
  label: "Offer a PhD position",
  icon: "#ico36_uc_phd",
  doNotMatchAfter: findLatestIntervallEndInJsonLdOrNowAndAddMillis,
  draft: {
    ...emptyDraft,
    content: {
      title: "I'm offering a PhD position!",
      tags: ["offer-phd"],
      searchString: "search-phd",
    },
  },
  details: {
    title: { ...details.title },
    description: { ...details.description },
    location: { ...details.location },
  },
  seeksDetails: {
    skills: { ...skillsDetail, placeholder: "" }, // TODO: find good placeholders
    interests: { ...interestsDetail, placeholder: "" },
  },
};
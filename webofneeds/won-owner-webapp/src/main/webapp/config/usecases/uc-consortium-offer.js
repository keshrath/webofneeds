/**
 * Created by fsuda on 18.09.2018.
 */
import { details, mergeInEmptyDraft } from "../detail-definitions.js";
import { interestsDetail, skillsDetail } from "../details/person.js";
import { findLatestIntervallEndInJsonLdOrNowAndAddMillis } from "../../app/won-utils.js";

export const consortiumOffer = {
  identifier: "consortiumOffer",
  label: "Offer slot in a project consortium",
  icon: "#ico36_uc_consortium-offer",
  doNotMatchAfter: findLatestIntervallEndInJsonLdOrNowAndAddMillis,
  draft: {
    ...mergeInEmptyDraft({
      content: {
        type: ["won:ConsortiumOffer"],
        title: "Offering a slot in a project consortium",
        tags: ["offer-consortium"],
        searchString: "search-consortium",
      },
    }),
  },
  details: {
    title: { ...details.title },
    description: { ...details.description },
    location: { ...details.location },
  },
  seeksDetails: {
    description: { ...details.description },
    location: { ...details.location },
    skills: { ...skillsDetail, placeholder: "" }, // TODO: find good placeholders
    interests: { ...interestsDetail, placeholder: "" },
  },
};

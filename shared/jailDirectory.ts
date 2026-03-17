/**
 * BondCurrent Jail Directory
 * Booking desk contacts for all covered Louisiana parishes.
 * Sources: LA Dept. of Public Safety, parish sheriff websites (verified March 2026).
 */

export interface JailContact {
  parish: string;
  facilityName: string;
  bookingPhone: string;
  mainPhone: string;
  address: string;
  city: string;
  state: "LA";
  zip: string;
  hours: string;
  notes: string;
  /** Script the agent should follow when calling */
  callScript: string;
}

export const JAIL_DIRECTORY: Record<string, JailContact> = {
  "St. John the Baptist": {
    parish: "St. John the Baptist",
    facilityName: "Lt. Sherman Walker Correctional Center",
    bookingPhone: "(985) 359-8716",
    mainPhone: "(985) 652-9513",
    address: "100 Deputy Barton Granier Dr",
    city: "LaPlace",
    state: "LA",
    zip: "70068",
    hours: "24 hours / 7 days",
    notes: "Booking desk is separate from the main sheriff line. Use (985) 359-8716 for inmate bond inquiries.",
    callScript: `Good [morning/afternoon/evening], this is [Agent Name] calling from [Agency Name]. I'm a licensed bail bondsman inquiring about the bond status for an inmate currently in your facility.\n\nInmate name: [INMATE NAME]\nBooking number (if available): [BOOKING NUMBER]\n\nI'm trying to confirm the total bond amount so I can assist the family with the release process. Could you please check your system and provide the current bond amount? Thank you.`,
  },

  "St. Mary": {
    parish: "St. Mary",
    facilityName: "St. Mary Parish Correctional Center",
    bookingPhone: "(337) 836-9509",
    mainPhone: "(337) 828-6945",
    address: "9311 Hwy. 90 West South Frontage",
    city: "Centerville",
    state: "LA",
    zip: "70522",
    hours: "24 hours / 7 days",
    notes: "Inmate information line (337) 836-9509 provides bond and custody details.",
    callScript: `Good [morning/afternoon/evening], this is [Agent Name] calling from [Agency Name]. I'm a licensed bail bondsman and I'm calling to inquire about the bond amount for an inmate currently booked at your facility.\n\nInmate name: [INMATE NAME]\nBooking number (if available): [BOOKING NUMBER]\n\nThe online roster shows the inmate is in custody but the bond amount has not yet been posted. Could you please confirm the current bond amount or let me know when it will be set? Thank you.`,
  },

  "Allen": {
    parish: "Allen",
    facilityName: "Allen Parish Jail",
    bookingPhone: "(337) 639-4353",
    mainPhone: "(337) 639-4353",
    address: "7340 Highway 26",
    city: "Oberlin",
    state: "LA",
    zip: "70655",
    hours: "24 hours / 7 days",
    notes: "Single line handles both main and booking inquiries. Available 24 hours.",
    callScript: `Good [morning/afternoon/evening], this is [Agent Name] calling from [Agency Name]. I'm a licensed bail bondsman calling to check on the bond status for an inmate at your facility.\n\nInmate name: [INMATE NAME]\nBooking number (if available): [BOOKING NUMBER]\n\nThe system shows this individual is currently booked but no bond amount is listed yet. Can you confirm whether a bond has been set, and if so, what the total amount is? Thank you.`,
  },

  "Evangeline": {
    parish: "Evangeline",
    facilityName: "Evangeline Parish Jail",
    bookingPhone: "(337) 363-6664",
    mainPhone: "(337) 363-2161",
    address: "200 Court Street",
    city: "Ville Platte",
    state: "LA",
    zip: "70586",
    hours: "24 hours / 7 days",
    notes: "Booking desk direct line (337) 363-6664. Non-emergency line (337) 363-2161 also available 24 hours.",
    callScript: `Good [morning/afternoon/evening], this is [Agent Name] from [Agency Name]. I'm a licensed bail bondsman and I'm calling to inquire about the bond amount for an inmate currently held at Evangeline Parish Jail.\n\nInmate name: [INMATE NAME]\nBooking number (if available): [BOOKING NUMBER]\n\nI can see the inmate is in custody on your roster, but the bond amount is showing as zero or not yet set. Could you please check and confirm the current bond amount? I'm trying to assist the family with the release process. Thank you.`,
  },

  "Jefferson": {
    parish: "Jefferson",
    facilityName: "Jefferson Parish Correctional Center",
    bookingPhone: "(504) 368-5360",
    mainPhone: "(504) 363-5500",
    address: "100 Dolhonde St",
    city: "Gretna",
    state: "LA",
    zip: "70053",
    hours: "24 hours / 7 days",
    notes: "Correctional center direct line (504) 368-5360. Switchboard (504) 363-5500.",
    callScript: `Good [morning/afternoon/evening], this is [Agent Name] with [Agency Name]. I'm a licensed bail bondsman calling the Jefferson Parish Correctional Center to inquire about a bond amount.\n\nInmate name: [INMATE NAME]\nBooking number (if available): [BOOKING NUMBER]\n\nI'm working with the inmate's family to facilitate a release and need to confirm the total bond amount currently set. Could you please look that up for me? Thank you.`,
  },

  "Plaquemines": {
    parish: "Plaquemines",
    facilityName: "Plaquemines Parish Detention Center",
    bookingPhone: "(504) 934-7637",
    mainPhone: "(504) 564-2525",
    address: "110 Prison Rd",
    city: "Braithwaite",
    state: "LA",
    zip: "70040",
    hours: "24 hours / 7 days",
    notes: "Booking desk and intake: (504) 934-7637 or (504) 934-7635. Main 24-hour line: (504) 564-2525.",
    callScript: `Good [morning/afternoon/evening], this is [Agent Name] from [Agency Name], a licensed bail bondsman. I'm calling the Plaquemines Parish Detention Center booking desk to inquire about bond information for an inmate.\n\nInmate name: [INMATE NAME]\nBooking number (if available): [BOOKING NUMBER]\n\nThe public roster shows this individual is in custody but does not list a bond amount. Could you please confirm whether a bond has been set and the total amount? Thank you.`,
  },

  "St. Bernard": {
    parish: "St. Bernard",
    facilityName: "St. Bernard Parish Prison",
    bookingPhone: "(504) 278-7645",
    mainPhone: "(504) 278-7755",
    address: "1900 Paris Road",
    city: "Chalmette",
    state: "LA",
    zip: "70043",
    hours: "24 hours / 7 days",
    notes: "Corrections / booking direct line: (504) 278-7645. Main sheriff line: (504) 278-7755.",
    callScript: `Good [morning/afternoon/evening], this is [Agent Name] calling from [Agency Name]. I'm a licensed bail bondsman and I'm calling the St. Bernard Parish Prison booking department to check on a bond amount.\n\nInmate name: [INMATE NAME]\nBooking number (if available): [BOOKING NUMBER]\n\nI'm assisting the inmate's family and need to confirm the current bond amount to begin the release process. Could you please check your records? Thank you.`,
  },

  "Orleans": {
    parish: "Orleans",
    facilityName: "Orleans Justice Center",
    bookingPhone: "(504) 202-9339",
    mainPhone: "(504) 822-8000",
    address: "2800 Perdido Street",
    city: "New Orleans",
    state: "LA",
    zip: "70119",
    hours: "24 hours / 7 days",
    notes: "Orleans Justice Center main line: (504) 202-9339. Also reachable at (504) 249-7265.",
    callScript: `Good [morning/afternoon/evening], this is [Agent Name] with [Agency Name], a licensed bail bondsman. I'm calling the Orleans Justice Center to inquire about the bond status for a detainee.\n\nDetainee name: [INMATE NAME]\nBooking number (if available): [BOOKING NUMBER]\n\nI'm working with the family to arrange a release and need to confirm the total bond amount currently set. Could you please check your system and provide that information? Thank you.`,
  },
};

/** Returns jail contact info for a given parish name (case-insensitive). */
export function getJailContact(parish: string): JailContact | null {
  // Direct match
  if (JAIL_DIRECTORY[parish]) return JAIL_DIRECTORY[parish];
  // Case-insensitive fallback
  const key = Object.keys(JAIL_DIRECTORY).find(
    (k) => k.toLowerCase() === parish.toLowerCase()
  );
  return key ? JAIL_DIRECTORY[key] : null;
}

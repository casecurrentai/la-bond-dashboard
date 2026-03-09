/**
 * Mock inmate data for development and testing
 * This simulates real data from the three parish sources
 */

export const mockInmates = [
  // St. Mary Parish
  {
    name: "JAMES ALLEN",
    parish: "St. Mary",
    externalBookingId: "SM-2024-001",
    bondAmount: "50000",
    bookingTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    name: "MIRANDA JOHNSON",
    parish: "St. Mary",
    externalBookingId: "SM-2024-002",
    bondAmount: "25000",
    bookingTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    name: "ROBERT WILLIAMS",
    parish: "St. Mary",
    externalBookingId: "SM-2024-003",
    bondAmount: "75000",
    bookingTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    name: "SARAH BROWN",
    parish: "St. Mary",
    externalBookingId: "SM-2024-004",
    bondAmount: "15000",
    bookingTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    name: "MICHAEL DAVIS",
    parish: "St. Mary",
    externalBookingId: "SM-2024-005",
    bondAmount: "100000",
    bookingTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },

  // Allen Parish
  {
    name: "DAVID MILLER",
    parish: "Allen",
    externalBookingId: "AP-2024-001",
    bondAmount: "35000",
    bookingTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  },
  {
    name: "JENNIFER WILSON",
    parish: "Allen",
    externalBookingId: "AP-2024-002",
    bondAmount: "20000",
    bookingTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    name: "CHRISTOPHER MOORE",
    parish: "Allen",
    externalBookingId: "AP-2024-003",
    bondAmount: "60000",
    bookingTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    name: "AMANDA TAYLOR",
    parish: "Allen",
    externalBookingId: "AP-2024-004",
    bondAmount: "30000",
    bookingTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    name: "ALLEN MARTINEZ",
    parish: "Allen",
    externalBookingId: "AP-2024-005",
    bondAmount: "45000",
    bookingTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },

  // Evangeline Parish
  {
    name: "THOMAS ANDERSON",
    parish: "Evangeline",
    externalBookingId: "EP-2024-001",
    bondAmount: "40000",
    bookingTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    name: "LISA THOMAS",
    parish: "Evangeline",
    externalBookingId: "EP-2024-002",
    bondAmount: "22000",
    bookingTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
  {
    name: "RYAN JACKSON",
    parish: "Evangeline",
    externalBookingId: "EP-2024-003",
    bondAmount: "55000",
    bookingTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    name: "MICHELLE WHITE",
    parish: "Evangeline",
    externalBookingId: "EP-2024-004",
    bondAmount: "18000",
    bookingTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

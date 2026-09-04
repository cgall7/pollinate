// Frozen call surface for ENG-74/75. No-op today, no dependency — every
// call site in the app can be written against this now, before a real
// reporter is wired behind it. Do not add a network call, a third-party
// SDK import, or any persistence here without first updating the legal
// copy tripwire in legalCopy.js (currently promises no analytics/crash-
// reporting/tracking code exists at all) in the SAME commit.
export const Analytics = {
  track(event, props) {},

  identify(userId, traits) {},

  optOut(value) {},
};

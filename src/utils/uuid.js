// A v4-shaped id for `record_zap`'s `p_zap_id` — the client-generated
// idempotency handle a retry replays against.
//
// WHY THE CLIENT GENERATES IT AT ALL, since every other id in this app is
// server-assigned (hive, entry, profile, share): `record_zap`'s exactly-once
// property is keyed on an id the CALLER holds across a retry. A server-minted
// id cannot do that job — the failure this protects against is "the write
// committed and the response was lost", and in that failure the client never
// learned the server's id. So the handle has to predate the call.
//
// `Math.random` is adequate here and the reason is a property of the value,
// not a convenience: this is a retry handle, not a secret, and no
// authorization decision reads it. `record_zap` derives the sender from
// `auth.uid()`, checks the target's reachability itself, and treats a
// KNOWN id with different parameters as a loud error rather than an
// overwrite — so guessing an id gets an attacker a duplicate-parameter
// error on a zap they could already have sent themselves. Nothing here
// depends on unpredictability, so nothing here needs a CSPRNG dependency.
export const randomUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

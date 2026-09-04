// DEMO ACCOUNT CORPUS — content only, no mechanics.
//
// Written against Lumen's ratified content register (Colin's ask, thread
// b3eac928, 2026-09-04: "full app in full come to life mode"). This file is
// the artifact Lumen ratifies line by line; scripts/lib/demo-seed-writer.mjs
// owns every insert, timestamp and constraint and imports from here. Nothing
// in this file knows a table name, and no entry text lives anywhere else.
//
// SUPERSEDES the draft at /private/tmp/fizz-demo-seed (branch
// fizz/demo-account-seed): that draft used a cast (Walt / Rosa / Isabelle /
// Marcus / Noor / Talia / Diego / Beckett) and a single seven-subject
// "Family Comb" that the register does not describe. None of its content is
// reused here. Only its file-separation idea survives.
//
// ---------------------------------------------------------------------------
// THE VOICE RULES this corpus is ratified against
// ---------------------------------------------------------------------------
//
//  V1  No dashes of any kind used as punctuation. Em dash, en dash, and
//      hyphen-as-dash are all banned in entry text; hyphenated compounds
//      ("hand-writes", "six-week") are fine. Reword, never re-punctuate.
//  V2  Concrete over abstract. Every entry names a specific moment, object
//      or act. No entry rests on a bare virtue word.
//  V3  Voice ladder, spread across the comb entries: some entries at or
//      under 80 characters, most between 81 and 220, and at least one entry
//      over 220 characters OR carrying a paragraph break in every DELIVERED
//      keepsake month.
//  V4  Each writer sounds like their persona line in every entry they write.
//      Sam is short. Omar is funny. Elena mentions distance. Rosa is food
//      and handwriting. Priya is running, 6am, and other people's birthdays.
//      Dev is bad at replying and good in the room.
//  V5  Rotation and hive entries address the subject in the second person
//      ("you"). Streak entries are first person ("I").
//  V6  No templates. No two entries anywhere in this corpus share an opening
//      clause, and cadence is uneven (see OPENING CLAUSE, below).
//  V7  Nothing reads as a claim about a real living person. The cast is
//      explicitly fictional and every surname is deliberately absent.
//
// OPENING CLAUSE, as this corpus and scripts/check-demo-seed.mjs define it:
// the first six words, lowercased, punctuation stripped. Every entry in this
// file has a unique one, streak included.
//
//   FLAGGED FOR LUMEN, one reading I had to make rather than assume: V6 read
//   strictly against a 180-day first-person streak is unsatisfiable if every
//   streak entry must also open "I am grateful for" (the register's own
//   phrasing for the streak, and the shape src/utils/demoSeed.js ships). The
//   reading taken here: the streak keeps the first-person "I am grateful"
//   register but varies word four onward, so a six-word opening clause is
//   still unique 180 times over. If you want the literal three-word opener
//   held constant instead, V6 has to be scoped to the comb and hive entries
//   and the gate's UNIQUE_OPENING_SCOPE constant moves with it.
//
// ---------------------------------------------------------------------------
// NO ORPHAN CLAIMS (register §6)
// ---------------------------------------------------------------------------
// Nothing an entry references may be unestablished elsewhere in the corpus.
// The cross-references this corpus actually stands on, so a reviewer can
// check them rather than take them on trust:
//
//   Priya's marathon   established by her persona line, by Alex's June entry
//                      about mile nineteen, and by Rosa's June entry about
//                      feeding her afterwards. Priya's July entry to Alex
//                      ("mile nineteen") is the other side of the same event.
//   Alex's surgery     established by Alex's own June entry; referenced back
//                      by Priya and Rosa in July, and twice in the streak.
//   Omar's daughter    established by his persona line, by Elena's May entry
//                      about the hospital photograph, by Priya's May entry
//                      about her birthday date, and by Alex's July entry
//                      about holding her.
//   Rosa's retirement  established by Rosa's persona line and stated outright
//                      in her long July entry; referenced in the streak.
//   Elena in Rochester established by her April entry, reused by Sam in
//                      August and by the streak's Sunday-call lines.
//   Sam's workshop     established by his persona line, by Alex's September
//                      entries, by Omar's September entry, and by the shelf
//                      he is holding for Elena in August.
//   Dev's silence      established by his persona line, by both Comb B
//                      months, and by three streak lines.
//
// No entry names a person outside this cast. No entry names an event that
// only one entry knows about.

// ---------------------------------------------------------------------------
// THE DEMO ACCOUNT
// ---------------------------------------------------------------------------

// The demo account's own display name. Never '' and never 'New user' — the
// placeholder class src/utils/placeholderName.js and
// scripts/check-placeholder-name.mjs both refuse.
export const DEMO_ACCOUNT_NAME = 'Alex';

// Stable key for the demo account inside this corpus. Not a name, not an id.
export const DEMO_ACCOUNT_KEY = 'alex';

// ---------------------------------------------------------------------------
// CAST — six fictitious people, exactly as ratified. Do not alter names,
// initials or persona lines; they are the register's own table.
// ---------------------------------------------------------------------------
//
// No surnames. profiles.display_name is the only name column in the schema
// (supabase/migrations/20260808000001_honeycombs_core_schema.sql), it is
// `text not null` with a 100-character cap, and nothing anywhere requires a
// family name, so none is invented. `email` is a routing address for the
// admin API only; the .invalid TLD is reserved by RFC 2606 and can never
// resolve to a real mailbox belonging to a real person (V7).

export const CAST = [
  {
    key: 'rosa',
    name: 'Rosa',
    initial: 'R',
    persona: 'Retired teacher, cooks for everyone, hand-writes cards',
    email: 'rosa@demo.pollinate.invalid',
  },
  {
    key: 'omar',
    name: 'Omar',
    initial: 'O',
    persona: 'New dad, dry humor, always the one with the camera',
    email: 'omar@demo.pollinate.invalid',
  },
  {
    key: 'priya',
    name: 'Priya',
    initial: 'P',
    persona: 'Runs marathons, texts at 6am, remembers every birthday',
    email: 'priya@demo.pollinate.invalid',
  },
  {
    key: 'sam',
    name: 'Sam',
    initial: 'S',
    persona: 'Quiet carpenter, shows love by fixing things',
    email: 'sam@demo.pollinate.invalid',
  },
  {
    key: 'elena',
    name: 'Elena',
    initial: 'E',
    persona: 'Med student far from home, calls on Sundays',
    email: 'elena@demo.pollinate.invalid',
  },
  {
    key: 'dev',
    name: 'Dev',
    initial: 'D',
    persona: 'College roommate, terrible at replying, great in person',
    email: 'dev@demo.pollinate.invalid',
  },
];

// ---------------------------------------------------------------------------
// KNOWN COLLISION with the decorative layer, flagged not silently accepted
// ---------------------------------------------------------------------------
// src/constants/demoHive.js's RAW_MEMBERS already contains decorative people
// called Sam, Dev, Elena, Omar and Priya. Five of the six ratified cast names
// collide. That decorative list renders whenever DEMO_CONTENT is true
// (src/constants/demoMode.js:46, `__DEV__ || DEMO_MODE`), and no database row
// can turn it off — see the writer's own header and the seed script's
// preflight warning. On a build where DEMO_CONTENT is true, a viewer sees a
// real Priya and a decorative Priya in the same honeycomb.
//
// NOT fixed by renaming the cast: the register ratified these six names and
// this file does not get to overrule it. The fix is a build choice
// (EXPO_PUBLIC_DEMO_MODE unset or "false", non-__DEV__ binary), and the seed
// script says so at run time.
export const DECORATIVE_NAME_COLLISIONS = ['Sam', 'Dev', 'Elena', 'Omar', 'Priya'];

// ---------------------------------------------------------------------------
// COMB A — the family comb
// ---------------------------------------------------------------------------
//
// Six members: Alex plus Rosa, Omar, Priya, Sam, Elena. Dev is deliberately
// NOT here; he is Comb B's, which is what makes the two combs read as two
// different parts of one life rather than one roster split in half. The
// member cap is unlimited today (comb_entitlement_plans ships both plans with
// NULL limits, 20260830000013), so six is well inside it.
//
// JOIN ORDER IS LOAD-BEARING, not decoration. comb_advance_rotation
// (20260830000011) derives each month's subject by walking comb_members in
// joined_at order, wrapping, skipping nobody enrollable. The organizer's own
// seat is inserted by combs_create_owner_membership_trigger at comb creation,
// so Alex necessarily holds the earliest joined_at and can only be reached by
// the wrap. The order below is the ONLY one that makes the ratified subject
// sequence (Rosa, Omar, Priya, Alex, Elena, Sam) the sequence the real
// function would derive:
//
//   Alex(min) < Elena < Sam < Rosa < Omar < Priya(max)
//
//   month 1  Rosa   organizer-chosen, exempt from the walk
//   month 2  after Rosa  -> Omar
//   month 3  after Omar  -> Priya
//   month 4  after Priya -> nobody later, wrap -> Alex
//   month 5  after Alex  -> Elena
//   month 6  after Elena -> Sam
//
// Derived, then checked against the function body. If the ratified sequence
// ever changes, this order has to be re-derived, not nudged.
export const COMB_A = {
  key: 'combA',
  name: 'The Kitchen Table',
  ownerKey: DEMO_ACCOUNT_KEY,
  // joined_at ascending. Alex first because the trigger seats the owner.
  joinOrder: [DEMO_ACCOUNT_KEY, 'elena', 'sam', 'rosa', 'omar', 'priya'],

  months: [
    // -----------------------------------------------------------------
    // Month 1 — Rosa. Delivered.
    // Writers: Alex (4), Elena (3), Sam (2). Priya and Omar sat this one
    // out, which is the point: comb_open_rotation seats all five
    // non-subject members as contributors, and only some of them write.
    // V3 long entry: Elena's tomato-sauce box.
    // -----------------------------------------------------------------
    {
      ordinal: 1,
      label: 'April',
      subjectKey: 'rosa',
      state: 'delivered',
      entries: [
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 27,
          text: 'You still write out the recipe by hand even though you know I will just photograph it.',
        },
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 27,
          text: 'Thirty years of report cards and you kept every one of mine in a shoebox on the top shelf.',
        },
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 14,
          text: 'When my kitchen flooded you drove over with towels and a thermos and never once said I told you so.',
        },
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 4,
          text: 'There is a tin of your almond cookies in the cabinet by your door and you have never let me leave without it.',
        },
        {
          writer: 'elena',
          daysBeforeClose: 22,
          text: 'Your card reached my mailbox in Rochester four days before my exam, and you had timed it that way on purpose.',
        },
        {
          writer: 'elena',
          daysBeforeClose: 21,
          text: 'Every Sunday you pick up on the second ring. I have started counting the rings, because two means you were already near the phone.',
        },
        {
          // V3 long, month 1's paragraph-break entry.
          writer: 'elena',
          daysBeforeClose: 9,
          text:
            'I mentioned once, in passing, that the hospital cafeteria here closes at eight and I keep missing it. Two weeks later a box arrived with six jars of your tomato sauce packed in newspaper so nothing would break.\n\n' +
            'I have been eating out of that box since March. Every person on my floor knows your name now, and none of them have met you.',
        },
        {
          // Calibration exemplar, ratified, used verbatim.
          writer: 'sam',
          daysBeforeClose: 18,
          text: 'The soup you left on my porch in February. I still think about it.',
        },
        {
          writer: 'sam',
          daysBeforeClose: 3,
          text: 'You asked what wood the shelf was. Nobody asks that.',
        },
      ],
    },

    // -----------------------------------------------------------------
    // Month 2 — Omar. Delivered.
    // Writers: Elena (4), Priya (3). A two-writer month on purpose.
    // V3 long entry: Elena's hospital photograph (calibration exemplar).
    // -----------------------------------------------------------------
    {
      ordinal: 2,
      label: 'May',
      subjectKey: 'omar',
      state: 'delivered',
      entries: [
        {
          // Calibration exemplar, ratified, used verbatim.
          writer: 'elena',
          daysBeforeClose: 26,
          text:
            'When the baby came you texted the group a photo of her hand around your finger and said nothing else, because nothing else needed saying.\n\n' +
            'I was three time zones away and it still felt like being in the room. That is a thing you do for people, and I do not think you know it.',
        },
        {
          writer: 'elena',
          daysBeforeClose: 25,
          text: 'You called my apartment at two in the morning your time to ask whether 38.4 was a real fever. I have never felt more like a doctor.',
        },
        {
          writer: 'elena',
          daysBeforeClose: 25,
          text: 'Somehow you photograph everyone else at every single thing and end up in none of the frames.',
        },
        {
          writer: 'elena',
          daysBeforeClose: 6,
          text: 'Your caption on the hospital photograph was four words long and I have read it about forty times.',
        },
        {
          writer: 'priya',
          daysBeforeClose: 19,
          text: 'Six in the morning and you are still the only person who answers my texts, and lately you answer them holding a bottle.',
        },
        {
          writer: 'priya',
          daysBeforeClose: 11,
          text: 'You made a joke about sleep at the exact moment I was about to say something serious, and it was the better call.',
        },
        {
          writer: 'priya',
          daysBeforeClose: 2,
          text: 'Her birthday is the ninth. You will never need to remind me.',
        },
      ],
    },

    // -----------------------------------------------------------------
    // Month 3 — Priya. Delivered.
    // Writers: Rosa (5), Alex (3), Sam (2). Rosa's month to be prolific.
    // V3 long entry: Alex's paper bag on the step.
    // Establishes the marathon and Alex's surgery, both of which July
    // reads back. See NO ORPHAN CLAIMS at the top of this file.
    // -----------------------------------------------------------------
    {
      ordinal: 3,
      label: 'June',
      subjectKey: 'priya',
      state: 'delivered',
      entries: [
        {
          writer: 'rosa',
          daysBeforeClose: 28,
          text: 'You remember every birthday in this comb, including mine, which nobody your age should have to do.',
        },
        {
          writer: 'rosa',
          daysBeforeClose: 27,
          text: 'The morning after your marathon I made far too much food, and you ate all of it and asked me for the recipe.',
        },
        {
          writer: 'rosa',
          daysBeforeClose: 20,
          text: 'You call me on the way to your long runs and let me talk about my tomatoes for twenty minutes.',
        },
        {
          writer: 'rosa',
          daysBeforeClose: 13,
          text: 'Nobody else notices when I am tired. You did, on a video call, from a different state.',
        },
        {
          writer: 'rosa',
          daysBeforeClose: 5,
          text: 'Your handwriting on my birthday card was worse than mine. I kept it.',
        },
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 24,
          text: 'Mile nineteen was the worst I have ever seen a person look, and you still waved at the sign.',
        },
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 16,
          text: 'At 6:04 on the morning of my interview you sent nothing but a photograph of your running watch.',
        },
        {
          // V3 long, month 3's paragraph-break entry.
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 15,
          text:
            'I did not tell anybody the date of the surgery. You worked it out somehow, and on the morning of it there was a paper bag on my step with two bananas, a card, and a note in capitals that said EAT BEFORE, NOT AFTER.\n\n' +
            'You were forty miles away at a race that day. I have never worked out when you had the time.',
        },
        {
          writer: 'sam',
          daysBeforeClose: 22,
          text: 'You held the level while I hung the door. Two hours, no complaining.',
        },
        {
          writer: 'sam',
          daysBeforeClose: 3,
          text: 'Six medals and no shelf. I built you one. Hang it.',
        },
      ],
    },

    // -----------------------------------------------------------------
    // Month 4 — Alex. Delivered. THE MONEY SHOT: this is the keepsake the
    // demo account itself received.
    //
    // ROSTER NOTE (register §6, no orphan claims): the three writers here
    // are Rosa, Omar and Priya, all real Comb A members, and every claim
    // any of them makes is backed elsewhere in this corpus. Priya's mile
    // nineteen is the other half of Alex's own June entry. Rosa's and
    // Priya's surgery lines read back Alex's June entry. Omar's baby is
    // established in May twice. Rosa's retirement is stated here and
    // referenced in the streak. Nothing in this month introduces a person
    // or an event that appears nowhere else.
    //
    // V3 long entry: Rosa's Tuesday morning.
    // -----------------------------------------------------------------
    {
      ordinal: 4,
      label: 'July',
      subjectKey: DEMO_ACCOUNT_KEY,
      state: 'delivered',
      entries: [
        {
          writer: 'rosa',
          daysBeforeClose: 26,
          text: 'You came for one plate of food and stayed to wash every dish in my house.',
        },
        {
          writer: 'rosa',
          daysBeforeClose: 26,
          text: 'The week after your surgery I sent soup and you sent back a photograph of the empty container. That is manners.',
        },
        {
          // V3 long, month 4's paragraph-break entry.
          writer: 'rosa',
          daysBeforeClose: 18,
          text:
            'You sat at my table the night I decided to stop teaching and you did not tell me it was the right call or the wrong one. You asked what I would do on a Tuesday morning instead.\n\n' +
            'I have thought about that question every Tuesday since, and I have an answer now. I am going to teach one class. You will hear about it before anybody else does.',
        },
        {
          writer: 'rosa',
          daysBeforeClose: 7,
          text: 'Every card I have written this year, you have written back to. Nobody else does.',
        },
        {
          writer: 'omar',
          daysBeforeClose: 23,
          text: 'You held the baby for ninety minutes so I could shower, and you did not check your phone once. I checked mine from the bathroom to see whether you had.',
        },
        {
          writer: 'omar',
          daysBeforeClose: 12,
          text: 'That camera bag you gave me has a pocket I did not find for six weeks. There was a granola bar in it. It was still fine.',
        },
        {
          writer: 'omar',
          daysBeforeClose: 4,
          text: 'You are the only person who has never asked me whether I am tired.',
        },
        {
          // Calibration exemplar. Amended per Lumen's ratification (thread
          // b3eac928, 2026-09-04): the sign carried the sign-holder's own
          // name, which reads as a typo rather than the intended in-joke.
          // Ruled fix: drop the name.
          writer: 'priya',
          daysBeforeClose: 21,
          text: 'You showed up at mile nineteen with a sign that just said KEEP GOING. You had a meeting that morning. You came anyway, and I finished because of it.',
        },
        {
          writer: 'priya',
          daysBeforeClose: 10,
          text: 'Two days after your surgery you asked me about my splits. I was annoyed and then I was not.',
        },
        {
          writer: 'priya',
          daysBeforeClose: 2,
          text: 'Your own birthday is the fourth and you have never once told anybody, so I tell them.',
        },
      ],
    },

    // -----------------------------------------------------------------
    // Month 5 — Elena. Delivered.
    // Writers: Omar (5), Sam (2).
    // V3 long entry: Omar's voicemail.
    // -----------------------------------------------------------------
    {
      ordinal: 5,
      label: 'August',
      subjectKey: 'elena',
      state: 'delivered',
      entries: [
        {
          writer: 'omar',
          daysBeforeClose: 27,
          text: 'You diagnosed my daughter over a video call at eleven at night, you were right, and I still have not paid you.',
        },
        {
          writer: 'omar',
          daysBeforeClose: 26,
          text: 'Every photograph I take of her, you are the first person to reply, and you are three time zones out.',
        },
        {
          writer: 'omar',
          daysBeforeClose: 19,
          text: 'A Sunday call from a stairwell in scrubs, and you asked about the baby before you said hello.',
        },
        {
          // V3 long, month 5's paragraph-break entry.
          writer: 'omar',
          daysBeforeClose: 18,
          text:
            'You have missed four birthdays and one very bad barbecue this year, and every person in this comb has forgiven you every time, because you called.\n\n' +
            'I kept the voicemail from the night before your boards. You sounded terrified and you still asked how the baby had slept.',
        },
        {
          writer: 'omar',
          daysBeforeClose: 6,
          text: 'Nobody else here says "my time" and "your time" in every message. You are the only one of us running two clocks.',
        },
        {
          writer: 'sam',
          daysBeforeClose: 23,
          text: 'You send a photograph of your window every Sunday. I know that street now.',
        },
        {
          writer: 'sam',
          daysBeforeClose: 5,
          text: 'Your bookshelf is still in my shop, waiting. It will be there.',
        },
      ],
    },

    // -----------------------------------------------------------------
    // Month 6 — Sam. OPEN, closing in roughly four days.
    //
    // This is the live surface: write affordance, roster, countdown. Alex
    // is not the subject this month, so Alex can and does write. Priya
    // and Elena are seated as contributors and have not written yet,
    // which is what makes comb_rotation_roster's has_written column
    // interesting to look at instead of uniformly true.
    //
    // No V3 long-entry requirement here: V3 scopes it to delivered
    // keepsake months, and this one has not delivered.
    // -----------------------------------------------------------------
    {
      ordinal: 6,
      label: 'September',
      subjectKey: 'sam',
      state: 'open',
      entries: [
        {
          writer: 'rosa',
          daysBeforeClose: 24,
          text: 'You rebuilt my back steps in one Saturday and refused the money, so I have been feeding you ever since.',
        },
        {
          writer: 'rosa',
          daysBeforeClose: 13,
          text: 'The little wooden plane you carved is still on my mantel. You have never once mentioned it.',
        },
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 22,
          text: 'You turned up with a level and a bag of shims and fixed a door I had been apologising for since 2023.',
        },
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 21,
          text: 'Nobody has ever heard you say the word busy.',
        },
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 9,
          text: 'That stool you made me wobbles slightly on purpose, you said, so I would notice it was handmade. I have never checked whether that is true.',
        },
        {
          writer: 'omar',
          daysBeforeClose: 16,
          text: 'Four seconds looking at my nursery shelf and you told me which screw was wrong. It was that screw.',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// COMB B — the small one
// ---------------------------------------------------------------------------
//
// Alex plus Dev and Priya. Priya is deliberately in both combs: the register
// allows it, and a person appearing in two combs is the clearest single proof
// that comb membership is per comb and not a global friend list.
//
// THE SECOND-STATE JUDGMENT CALL (register: "don't force a state the
// mechanism wouldn't produce"). Read against the real state machine, a
// comb_rotations row has exactly three terminal shapes and one live one:
// open (sealed_at and voided_at both null), delivered (sealed_at and sent_at
// set), and voided (voided_at plus voided_reason in quiet / departed /
// subject_gone). Three candidates, and only one survives:
//
//   (a) ONE DELIVERED MONTH AND NOTHING ELSE — the register's own fallback,
//       and it turns out to be the one shape this mechanism cannot hold.
//       advance_due_rotations (20260830000012) calls comb_advance_rotation
//       immediately after every successful seal, in the same tick, and
//       comb_advance_rotation only declines when a comb has fewer than two
//       ENROLLABLE members. Comb B has three. So "delivered, with no open
//       successor" is a state that exists for the few minutes between two
//       statements in one function and never as a resting state. Seeding it
//       would be exactly the faked timestamp path the register warns off.
//
//   (b) A VOIDED-QUIET MONTH — genuinely reachable (a window closes with zero
//       entries and an intact roster). Rejected on Lumen's own ruling in
//       20260830000003: voided_reason is "a RECORD, not a rendered surface",
//       "nothing in MVP-Comb renders this column directly, and no improvised
//       copy should be written against it before DES-31 rules the words."
//       Seeding a voided month would put a demo viewer in front of a state
//       whose copy is unruled. Not this script's call to make.
//
//   (c) ONE DELIVERED MONTH PLUS ONE CURRENTLY OPEN MONTH — chosen. It is
//       precisely what the tick produces, it is a genuinely distinct second
//       state, and every value in it is derived rather than picked: the open
//       month's subject comes out of comb_advance_rotation's joined_at walk
//       (after Dev, the next enrollable seat is Priya), and its closes_at is
//       month 1's closes_at plus one cadence, clearing the half-cadence
//       downtime floor.
//
// The shape difference from Comb A is therefore membership size and history
// depth, not state variety: three people, two months, one delivered and one
// live. That reads as a young comb beside Comb A's six-month one, which is
// the contrast worth demoing.
export const COMB_B = {
  key: 'combB',
  name: 'The Old Apartment',
  ownerKey: DEMO_ACCOUNT_KEY,
  // Alex first (owner seat, trigger-inserted), then Dev, then Priya. The
  // walk from month 1's subject Dev lands on Priya for month 2.
  joinOrder: [DEMO_ACCOUNT_KEY, 'dev', 'priya'],

  months: [
    // -----------------------------------------------------------------
    // Month 1 — Dev. Delivered. Writers: Alex (3), Priya (2).
    // V3 long entry: Alex's four-hour drive.
    // -----------------------------------------------------------------
    {
      ordinal: 1,
      label: 'Month one',
      subjectKey: 'dev',
      state: 'delivered',
      entries: [
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 21,
          text: 'Eleven days without a reply and then you were on my doorstep with a bag of laundry and a plan.',
        },
        {
          // V3 long, this month's paragraph-break entry.
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 20,
          text:
            'You have never once answered a text inside a week and you drove four hours for a dinner you could have skipped, which is the whole argument about you in one sentence.\n\n' +
            'Everyone who meets you for five minutes understands it and nobody who only messages you ever will. I have stopped trying to explain it and started just bringing people to you.',
        },
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 8,
          text: 'Our old apartment had one working burner and you cooked on it for two years without complaining.',
        },
        {
          writer: 'priya',
          daysBeforeClose: 16,
          text: 'I sent you a 6am photograph of the start line and you replied in November. It was worth the wait.',
        },
        {
          writer: 'priya',
          daysBeforeClose: 5,
          text: 'Nobody else remembers my sister without being reminded. You always have.',
        },
      ],
    },

    // -----------------------------------------------------------------
    // Month 2 — Priya. OPEN. Subject derived by the joined_at walk from
    // Dev, not chosen. Writers so far: Alex (2), Dev (2).
    // -----------------------------------------------------------------
    {
      ordinal: 2,
      label: 'Month two',
      subjectKey: 'priya',
      state: 'open',
      entries: [
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 29,
          text: 'Your 6am text landed on the one morning this year I actually needed a reason to get up.',
        },
        {
          writer: DEMO_ACCOUNT_KEY,
          daysBeforeClose: 22,
          text: 'A whole marathon and the only photograph you kept is of the volunteer handing out oranges.',
        },
        {
          writer: 'dev',
          daysBeforeClose: 26,
          text: 'I owe you about four hundred replies. You have never once brought it up.',
        },
        {
          writer: 'dev',
          daysBeforeClose: 19,
          text: 'When I finally turned up two months late you had kept the good chair free the entire time.',
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// PRIVATE HIVES — the legacy 1:1 mechanism, not comb rotation
// ---------------------------------------------------------------------------
//
// These are private_hives created by hand (HiveStore.createHive), sealed by
// hand (seal_hive -> seal_volume) and sent by hand (send_hive). Entirely
// different tables and RPCs from a comb rotation, and both hives here are
// deliberately NOT comb-linked: no comb_rotations row references them, which
// is what keeps ENG-101's rotation refusals
// (20260904000002_eng101_rotation_linked_refusals.sql) off them.
//
// R-SEAL-1, CORRECTED. The prior finding this work inherited said the manual
// seal/send UI "was removed from the app entirely" on 2026-09-04. That is not
// what happened, and I checked rather than inherited it. src/screens/
// HiveDetail.js:275-315 still renders both affordances today. What ENG-101
// actually did was suppress them for ROTATION-LINKED hives only
// (`!hive.isRotationLinked` joined each guard) and back that with a server
// refusal in seal_volume and send_hive. The conclusion R-SEAL-1 was used for
// still holds, on different grounds: an open, never sealed private hive is
// perfectly normal, because sealing is an optional one-way act a user simply
// may not have performed, and because HiveDetail only offers the button at
// all once `entries.length > 0`. Hive 2 below is that state, not a workaround.
export const PRIVATE_HIVES = [
  // -------------------------------------------------------------------
  // Hive 1 — sealed and sent TO Alex. Rosa owns it, Omar is the one
  // invited contributor, Alex is the subject. A collective hive, so the
  // owner writes too.
  //
  // send_hive requires an accepted honeycomb_connections row between the
  // owner and the subject (20260904000002:125-134), which Rosa and Alex
  // have. That is why Rosa owns this hive and not Omar: the connection
  // graph this seed writes runs Alex to each cast member, so any cast
  // member could own it, and Rosa is the one whose persona makes a
  // hand-assembled keepsake obvious.
  // -------------------------------------------------------------------
  {
    key: 'hiveForAlex',
    ownerKey: 'rosa',
    subjectKey: DEMO_ACCOUNT_KEY,
    subjectName: 'Alex',
    isCollective: true,
    contributorKeys: ['omar'],
    coverTheme: 'cream-gold',
    reviewCadence: 'yearly',
    relationship: 'other',
    state: 'sent',
    // Roughly four months of writing, sealed and sent about three months
    // ago. daysBeforeSeal is days before the seal moment.
    entries: [
      { writer: 'rosa', daysBeforeSeal: 118, text: 'A whole afternoon of you asking about the class I was scared to teach, and not one word about yourself.' },
      { writer: 'rosa', daysBeforeSeal: 112, text: 'You ate the burnt half of the bread and told me it was the good half.' },
      { writer: 'rosa', daysBeforeSeal: 97, text: 'Every card I send you comes back answered in about a week, in a hand I taught you to write.' },
      { writer: 'rosa', daysBeforeSeal: 96, text: "I watched you spend an hour on the phone sorting out somebody else's parking fine for no reason at all." },
      { writer: 'rosa', daysBeforeSeal: 71, text: 'Sunday lunch and you carried the heavy dish without being asked twice, or once.' },
      { writer: 'rosa', daysBeforeSeal: 44, text: 'The way you say goodbye on the phone, slowly, as though the call cost you nothing.' },
      {
        writer: 'rosa',
        daysBeforeSeal: 20,
        text:
          'When I told you I was going to stop teaching you did not say a single reassuring thing, which is the reason I could tell you at all.\n\n' +
          'You asked what I would miss. I said the noise. You said keep one class then, and that was the whole conversation, and it took four minutes.',
      },
      { writer: 'omar', daysBeforeSeal: 109, text: 'Three in the morning and you answered, and then you pretended you had been awake anyway.' },
      { writer: 'omar', daysBeforeSeal: 88, text: 'My camera was in bits on your kitchen table for a fortnight and you never once moved it.' },
      { writer: 'omar', daysBeforeSeal: 61, text: 'You laughed at the joke I had told twice already. That is a real skill and I want it noted.' },
      { writer: 'omar', daysBeforeSeal: 33, text: 'Nobody warned me about the first month. You turned up with coffee and a folding chair and just sat there.' },
      { writer: 'omar', daysBeforeSeal: 9, text: 'Somebody has to hold the camera and it is always me, except at the hospital, where it was you.' },
    ],
  },

  // -------------------------------------------------------------------
  // Hive 2 — open, never sealed. Alex is writing it for Priya. Solo, so
  // no contributors at all and no roster.
  //
  // Priya is Comb A's month 3 subject and Comb B's month 2 subject as
  // well. Nothing about that collides: private_hives_subject_not_active_
  // contributor only bars the subject from being a contributor OF THIS
  // HIVE, and this hive has none.
  // -------------------------------------------------------------------
  {
    key: 'hiveForPriya',
    ownerKey: DEMO_ACCOUNT_KEY,
    subjectKey: 'priya',
    subjectName: 'Priya',
    isCollective: false,
    contributorKeys: [],
    coverTheme: 'wildflower',
    reviewCadence: 'yearly',
    relationship: 'friend',
    state: 'open',
    // Four months of writing, the most recent five days ago. daysBeforeNow.
    entries: [
      { writer: DEMO_ACCOUNT_KEY, daysBeforeNow: 121, text: 'You texted me the weather at the start line before you texted anybody your finish time.' },
      { writer: DEMO_ACCOUNT_KEY, daysBeforeNow: 113, text: 'Two years of 6am messages and not one of them has ever been about you.' },
      { writer: DEMO_ACCOUNT_KEY, daysBeforeNow: 99, text: 'A birthday card arrived for my landlord because you met him once, in a lift, in 2021.' },
      { writer: DEMO_ACCOUNT_KEY, daysBeforeNow: 84, text: 'You ran the long one in the rain and described it afterwards as pleasant, which is a lie.' },
      { writer: DEMO_ACCOUNT_KEY, daysBeforeNow: 83, text: 'The night before the surgery you sent a photograph of your running watch and nothing else.' },
      { writer: DEMO_ACCOUNT_KEY, daysBeforeNow: 66, text: 'Somehow you knew about the interview and I had told exactly nobody about the interview.' },
      { writer: DEMO_ACCOUNT_KEY, daysBeforeNow: 51, text: 'Half a banana at mile nineteen and you handed the other half to a stranger who looked worse.' },
      { writer: DEMO_ACCOUNT_KEY, daysBeforeNow: 40, text: 'When Rosa was ill you were on a train to her before any of the rest of us had put shoes on.' },
      { writer: DEMO_ACCOUNT_KEY, daysBeforeNow: 27, text: 'Your calendar has my sister on it. I have never asked you to do that.' },
      { writer: DEMO_ACCOUNT_KEY, daysBeforeNow: 14, text: 'Every single time I have needed a lift at an unreasonable hour, your answer has been a time and not a question.' },
      { writer: DEMO_ACCOUNT_KEY, daysBeforeNow: 5, text: 'A whole week of bad news and you sent one line about the sunrise on the towpath. It worked.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// PERSONAL STREAK — 180 days of Alex's own journal
// ---------------------------------------------------------------------------
//
// Same shape as src/utils/demoSeed.js's buildDemoEntries: one row per day,
// `content` plus a `theme` drawn from that file's own nine themes, so
// Wrapped's dominant-theme maths is honest on this data. Unlike that
// generator these are real authored lines, not nine sample strings recycled
// by a PRNG.
//
// Ordered oldest first. The writer assigns dates: 180 consecutive days ending
// today, because entries_one_journal_per_day (20260813000007) is a unique
// index on (user_id, entry_date) where hive_id is null and a maxed streak is
// the whole point of the surface. The UNEVEN part the register asks for is
// the clock, not the calendar: created_at is jittered across evenings with a
// minority of mornings and afternoons, so nothing reads as a cron job. See
// the writer's `streakTimestamp`.
//
// V5: first person throughout. V6: unique six-word opening clause, every one.
// The cast appears here roughly one line in seven, which is what stops the
// comb entries from being the only place any of these people exist.
export const STREAK_THEMES = [
  'Family', 'Friendship', 'Health', 'Nature', 'Growth', 'Career', 'Joy', 'Faith', 'Creativity',
];

export const STREAK = [
  { text: 'I am grateful for the first coffee of a cold morning, drunk standing up.', theme: 'Joy' },
  { text: 'I am glad Rosa still calls the landline as if it were 1994.', theme: 'Family' },
  { text: 'I am grateful my legs got me up the hill without any negotiating.', theme: 'Health' },
  { text: 'I got a bus that arrived exactly when the sign said it would.', theme: 'Joy' },
  { text: 'I am grateful that a hard conversation turned out to be twenty minutes long.', theme: 'Growth' },
  { text: 'I am thankful for the smell of somebody else cooking on the floor below.', theme: 'Joy' },
  { text: 'I am grateful for one honest sentence in an otherwise pointless meeting.', theme: 'Career' },
  { text: 'I noticed the light on the brick wall opposite at about seven tonight.', theme: 'Nature' },
  { text: 'I am grateful Priya texted at 6am about nothing whatsoever.', theme: 'Friendship' },
  { text: 'I am glad the rain held off until I was through the door.', theme: 'Nature' },
  { text: 'I am grateful my back stopped hurting on its own, quietly, overnight.', theme: 'Health' },
  { text: 'I am thankful that somebody laughed at the thing I said in the kitchen.', theme: 'Joy' },
  { text: 'I finished the draft I had been avoiding for eleven days.', theme: 'Career' },
  { text: 'I am grateful for a quiet hour with the phone in another room.', theme: 'Faith' },
  { text: 'I am glad Sam looked at the stair and said it was nothing.', theme: 'Friendship' },
  { text: 'I am grateful the tomatoes on the sill finally did something.', theme: 'Nature' },
  { text: 'I am thankful for an idea that arrived while I was washing up.', theme: 'Creativity' },
  { text: 'I slept seven hours and woke before the alarm for once.', theme: 'Health' },
  { text: 'I am grateful for the sound of the upstairs neighbour practising badly.', theme: 'Joy' },
  { text: 'I am glad Elena rang on Sunday even though she had been on shift.', theme: 'Family' },
  { text: 'I am grateful my sister sent a photograph with no message attached.', theme: 'Family' },
  { text: 'I am thankful the meeting ended fourteen minutes early and nobody objected.', theme: 'Career' },
  { text: 'I walked home the long way and did not regret it.', theme: 'Nature' },
  { text: 'I am grateful for a book that made me miss my stop.', theme: 'Creativity' },
  { text: 'I am glad Omar sent a photograph of the baby asleep on the dog.', theme: 'Friendship' },
  { text: 'I am grateful nothing hurt today, which I only noticed at bedtime.', theme: 'Health' },
  { text: 'I am thankful for cold water at exactly the right moment.', theme: 'Joy' },
  { text: 'I said no to something and the world stayed upright.', theme: 'Growth' },
  { text: 'I am grateful for a stranger who let me go first at the junction.', theme: 'Joy' },
  { text: 'I am glad the shed door finally shuts, thanks to a man with a plane.', theme: 'Friendship' },
  { text: 'I am grateful my hands were steady when they needed to be.', theme: 'Health' },
  { text: 'I am thankful somebody remembered a detail I mentioned once in March.', theme: 'Friendship' },
  { text: 'I got the whole shelf up before I lost my nerve.', theme: 'Growth' },
  { text: 'I am grateful for a Sunday with absolutely nothing written in it.', theme: 'Faith' },
  { text: 'I am glad Dev answered a message from June this afternoon.', theme: 'Friendship' },
  { text: 'I am grateful the frost came and the whole street looked new.', theme: 'Nature' },
  { text: 'I am thankful for a boss who said the quiet part out loud.', theme: 'Career' },
  { text: 'I laughed at my own handwriting on a note from last year.', theme: 'Joy' },
  { text: 'I am grateful for warm socks on a floor that never warms up.', theme: 'Joy' },
  { text: 'I am glad Rosa posted a recipe card in an actual envelope.', theme: 'Family' },
  { text: 'I am grateful the pain in my knee went where it came from.', theme: 'Health' },
  { text: 'I am thankful for an argument that ended with both of us fine.', theme: 'Growth' },
  { text: 'I sat in the garden for twenty minutes and did nothing else.', theme: 'Faith' },
  { text: 'I am grateful for a good pen turning up in the wrong drawer.', theme: 'Creativity' },
  { text: 'I am glad Priya remembered a birthday I had completely forgotten.', theme: 'Friendship' },
  { text: 'I am grateful the river was high and loud on the walk back.', theme: 'Nature' },
  { text: 'I am thankful somebody took the awkward call for me without being asked.', theme: 'Career' },
  { text: 'I finished the run without stopping at the bench this time.', theme: 'Health' },
  { text: 'I am grateful for bread still warm from the shop on the corner.', theme: 'Joy' },
  { text: 'I am glad Elena described a stairwell in Rochester well enough to see it.', theme: 'Family' },
  { text: 'I am grateful my old coat still fits and still does the job.', theme: 'Joy' },
  { text: 'I am thankful nobody needed anything from me between six and nine.', theme: 'Faith' },
  { text: 'I wrote four hundred words that I did not delete.', theme: 'Creativity' },
  { text: 'I am grateful rain on hot pavement still smells the same.', theme: 'Nature' },
  { text: 'I am glad Sam took the broken chair away without discussing it.', theme: 'Friendship' },
  { text: 'I am grateful my appetite came back after a rough fortnight.', theme: 'Health' },
  { text: 'I am thankful for a train seat by the window on a full service.', theme: 'Joy' },
  { text: 'I asked for help and it was not even slightly a big deal.', theme: 'Growth' },
  { text: 'I am grateful an old song ambushed me at the supermarket checkout.', theme: 'Joy' },
  { text: 'I am glad Omar admitted the baby had beaten him this week.', theme: 'Friendship' },
  { text: 'I am grateful the fog lifted about halfway up the hill.', theme: 'Nature' },
  { text: 'I am thankful for a project that finally has a shape to it.', theme: 'Career' },
  { text: 'I remembered a thing my grandmother used to say about weather.', theme: 'Family' },
  { text: 'I am grateful for silence in a house that is normally loud.', theme: 'Faith' },
  { text: 'I am glad Rosa asked about the surgery date and then let it drop.', theme: 'Family' },
  { text: 'I am grateful my body did what I asked for a whole week.', theme: 'Health' },
  { text: 'I am thankful for a bad first attempt that showed me the good one.', theme: 'Creativity' },
  { text: 'I put the phone down at nine and left it there.', theme: 'Growth' },
  { text: 'I am grateful for a dog on the towpath that stopped for everybody.', theme: 'Nature' },
  { text: 'I am glad Priya sent her splits and then asked about mine.', theme: 'Friendship' },
  { text: 'I am grateful the deadline moved and nobody had to fight for it.', theme: 'Career' },
  { text: 'I am thankful for two consecutive nights of real sleep.', theme: 'Health' },
  { text: 'I found a photograph I had forgotten I had taken.', theme: 'Joy' },
  { text: "I am grateful for a kitchen that smells of Rosa's sauce on a Tuesday.", theme: 'Family' },
  { text: 'I am glad Dev turned up unannounced and stayed for three days.', theme: 'Friendship' },
  { text: 'I am grateful the wind dropped exactly when I got to the top.', theme: 'Nature' },
  { text: 'I am thankful for a form that took ten minutes instead of an afternoon.', theme: 'Career' },
  { text: 'I made the call I had been putting off since Tuesday.', theme: 'Growth' },
  { text: 'I am grateful for a chair that is exactly the right height.', theme: 'Joy' },
  { text: "I am glad Elena is somebody's doctor now, which is frankly alarming.", theme: 'Family' },
  { text: 'I am grateful my hands remembered the chords after eleven years.', theme: 'Creativity' },
  { text: 'I am thankful for a morning with no obligations before eleven.', theme: 'Faith' },
  { text: 'I ate a proper lunch away from the desk, on purpose.', theme: 'Health' },
  { text: 'I am grateful for the swallows coming back to the same eaves.', theme: 'Nature' },
  { text: 'I am glad Sam fixed the gate and then denied fixing the gate.', theme: 'Friendship' },
  { text: 'I am grateful an old worry turned out to be nothing at all.', theme: 'Growth' },
  { text: 'I am thankful for a colleague who says exactly what she means.', theme: 'Career' },
  { text: 'I read for an hour without once checking the time.', theme: 'Joy' },
  { text: "I am grateful for the noise of a full table at my mother's.", theme: 'Family' },
  { text: 'I am glad Omar sent thirty photographs and one useful sentence.', theme: 'Friendship' },
  { text: 'I am grateful the ache in my shoulder finally packed up and left.', theme: 'Health' },
  { text: 'I am thankful for a sky that did something unreasonable at sunset.', theme: 'Nature' },
  { text: 'I started the thing rather than planning the thing again.', theme: 'Growth' },
  { text: 'I am grateful for one paragraph that came out right first time.', theme: 'Creativity' },
  { text: 'I am glad Priya rang at 6am to say she had seen a heron.', theme: 'Friendship' },
  { text: 'I am thankful for stillness in the flat at about half five.', theme: 'Faith' },
  { text: 'I took the stairs all week without thinking about it.', theme: 'Health' },
  { text: 'I am grateful for a joke that landed with a room of strangers.', theme: 'Joy' },
  { text: "I am glad Rosa's handwriting is still on the recipe I use most.", theme: 'Family' },
  { text: 'I am grateful the moon was ridiculous over the car park tonight.', theme: 'Nature' },
  { text: 'I am thankful for a piece of feedback that was actually about the work.', theme: 'Career' },
  { text: 'I threw away three things I had kept for no reason.', theme: 'Growth' },
  { text: 'I am grateful for a bath at an indefensible hour of the afternoon.', theme: 'Joy' },
  { text: 'I am glad Elena said the exam went badly and then passed it.', theme: 'Family' },
  { text: 'I am grateful my heart rate came down faster than it used to.', theme: 'Health' },
  { text: 'I am thankful for a sketch that was worse than the idea but useful.', theme: 'Creativity' },
  { text: 'I let a Sunday go by without earning anything from it.', theme: 'Faith' },
  { text: 'I am grateful for the hedge that has decided to flower again.', theme: 'Nature' },
  { text: 'I am glad Dev remembered the name of my first flat.', theme: 'Friendship' },
  { text: 'I am grateful an old client came back with something interesting.', theme: 'Career' },
  { text: 'I am thankful for a plan that survived contact with a Monday.', theme: 'Growth' },
  { text: 'I heard my own laugh on a voice note and did not mind it.', theme: 'Joy' },
  { text: "I am grateful the smell of Sam's workshop is sawdust and coffee.", theme: 'Friendship' },
  { text: "I am glad Omar's daughter has started laughing at absolutely nothing.", theme: 'Family' },
  { text: 'I am grateful the physio said the word discharged this afternoon.', theme: 'Health' },
  { text: 'I am thankful for one email that was three lines instead of thirty.', theme: 'Career' },
  { text: 'I sang in the car with the windows shut, badly.', theme: 'Joy' },
  { text: 'I am grateful for condensation on the inside of the greenhouse glass.', theme: 'Nature' },
  { text: "I am glad Priya's marathon photograph has me in the background looking appalled.", theme: 'Friendship' },
  { text: 'I am grateful my notes from a year ago were legible and right.', theme: 'Creativity' },
  { text: 'I am thankful for the ten minutes before anybody else was awake.', theme: 'Faith' },
  { text: 'I forgave somebody in my head and did not tell them.', theme: 'Growth' },
  { text: "I am grateful for a haircut that fixed a whole week's mood.", theme: 'Joy' },
  { text: 'I am glad Rosa is going back to teach one class after all.', theme: 'Family' },
  { text: 'I am grateful the surgery scar has stopped being the first thing I see.', theme: 'Health' },
  { text: 'I am thankful for a river path that is empty at seven.', theme: 'Nature' },
  { text: 'I said the true thing in the meeting and it was fine.', theme: 'Career' },
  { text: 'I am grateful for an evening that went exactly nowhere.', theme: 'Faith' },
  { text: 'I am glad Elena called from a stairwell, out of breath, on a Sunday.', theme: 'Family' },
  { text: 'I am grateful my appetite for the work came back this week.', theme: 'Growth' },
  { text: 'I am thankful for a song I had not heard since the old apartment.', theme: 'Joy' },
  { text: 'I fixed the tap myself and only flooded the floor slightly.', theme: 'Creativity' },
  { text: 'I am grateful for the way the hall smells after the rain.', theme: 'Nature' },
  { text: 'I am glad Sam brought the bookshelf round in a van at eight.', theme: 'Friendship' },
  { text: 'I am grateful an old injury stayed quiet through a long day.', theme: 'Health' },
  { text: 'I am thankful a colleague covered for me without making it a favour.', theme: 'Career' },
  { text: 'I noticed I had not thought about it all day.', theme: 'Growth' },
  { text: 'I am grateful for cold hands around a hot mug outside.', theme: 'Joy' },
  { text: 'I am glad Dev is bad at texting and good in a room.', theme: 'Friendship' },
  { text: 'I am grateful the tomatoes came to something after all that.', theme: 'Nature' },
  { text: 'I am thankful for an afternoon that felt like a Saturday.', theme: 'Faith' },
  { text: 'I answered the hard email before I had a coffee.', theme: 'Career' },
  { text: 'I am grateful for a photograph of my parents on a bad boat.', theme: 'Family' },
  { text: 'I am glad Omar has stopped apologising for the state of the flat.', theme: 'Friendship' },
  { text: 'I am grateful my sleep sorted itself out without me interfering.', theme: 'Health' },
  { text: "I am thankful for one line of somebody else's writing today.", theme: 'Creativity' },
  { text: 'I walked into the sea before breakfast, briefly, and shouted.', theme: 'Joy' },
  { text: 'I am grateful for the tree outside the window doing its annual thing.', theme: 'Nature' },
  { text: "I am glad Priya keeps a list of everybody's birthdays in a paper diary.", theme: 'Friendship' },
  { text: 'I am grateful an old habit finally lost its grip this month.', theme: 'Growth' },
  { text: 'I am thankful for a quiet Friday with the phone face down.', theme: 'Faith' },
  { text: 'I understood something on the fourth read that I had missed three times.', theme: 'Career' },
  { text: 'I am grateful this kitchen table has held a lot of people.', theme: 'Family' },
  { text: 'I am glad Rosa still writes the year in full on every card.', theme: 'Family' },
  { text: 'I am grateful my knees survived the descent without comment.', theme: 'Health' },
  { text: 'I am thankful for a good idea I had in the shower and remembered.', theme: 'Creativity' },
  { text: 'I let the washing up wait and went outside instead.', theme: 'Joy' },
  { text: 'I am grateful for geese going over at exactly the same hour.', theme: 'Nature' },
  { text: 'I am glad Elena sends a photograph of her window every Sunday.', theme: 'Family' },
  { text: 'I am grateful the difficult month is behind rather than ahead.', theme: 'Growth' },
  { text: 'I am thankful for work that felt like it mattered on a Wednesday.', theme: 'Career' },
  { text: 'I made somebody laugh who had had a genuinely awful week.', theme: 'Friendship' },
  { text: 'I am grateful for a bench in the sun that nobody had taken.', theme: 'Joy' },
  { text: 'I am glad Sam turned up with a level and no conversation.', theme: 'Friendship' },
  { text: 'I am grateful my fingers were warm enough to work outside.', theme: 'Health' },
  { text: 'I am thankful for music I could not stop playing all evening.', theme: 'Creativity' },
  { text: 'I sat with a hard feeling instead of doing something about it.', theme: 'Faith' },
  { text: 'I am grateful the hedge smells like summer after somebody cut it.', theme: 'Nature' },
  { text: 'I am glad Dev sent one line and it was the right line.', theme: 'Friendship' },
  { text: 'I am thankful for a bakery that opens absurdly early on Saturdays.', theme: 'Joy' },
  { text: 'I finished a thing that had been open since spring.', theme: 'Career' },
  { text: "I am grateful for my mother's voice on a voicemail I kept.", theme: 'Family' },
  { text: 'I am glad Omar named her after somebody he loved without saying so.', theme: 'Family' },
  { text: 'I am grateful the check-up was boring in the best possible way.', theme: 'Health' },
  { text: 'I am thankful for a friend who asked a second question.', theme: 'Friendship' },
  { text: 'I planted something that will not do anything until March.', theme: 'Nature' },
  { text: 'I am grateful for the quiet that arrives at about ten past nine.', theme: 'Faith' },
  { text: "I am glad Priya's 6am message today was a single photograph of fog.", theme: 'Friendship' },
  { text: 'I am grateful an idea I had in June turned out to be right.', theme: 'Creativity' },
  { text: 'I looked back at the whole year and it was not nothing.', theme: 'Growth' },
];

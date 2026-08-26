// Prompt ladders for relationship-typed private hives.
// PLANS/POLLINATE_V2_SPEC.md §16.2-16.3 (Project 16, ENG-44/ENG-45).
//
// COPY-1 (Lumen, 2026-08-26): the four ladders below are the authored
// copy asset this scaffold was built to hold. Three copy decisions are
// load-bearing and easy to violate when extending a ladder:
//
// 1. BUCKETS ARE HIVE AGE, NOT SUBJECT AGE (spec §16.3 — no birthdate is
//    collected). child/'0-1' means the FIRST YEAR OF WRITING, which may
//    begin when the child is a newborn or fifteen. So no question is
//    pinned to a developmental milestone; early buckets ask about
//    noticing and beginning, later buckets ask about change measured
//    against the hive's own span ("since your first entry here"), which
//    is true by construction in every bucket. Where a spark implies an
//    age ("saying goodnight to every stuffed animal"), each prompt's
//    trio spans different ages so any writer finds a foothold — sparks
//    are editable examples, not claims.
//
// 2. QUESTIONS carry the literal `{subject_name}` placeholder — every
//    prompt is subject-addressed by name at render time (spec §16.2).
//    SPARKS never carry it: a tapped spark pastes verbatim into an
//    editable input, where an uninterpolated template token would land
//    as literal text. Sparks address the subject as they/them/their.
//
// 3. Every spark must read as the object of "I am grateful for ___." —
//    including sparks under question-shaped prompts ("What question do
//    you still want to ask…"): the ENTRY is still a gratitude sentence,
//    so the spark names the thing to be grateful for, never the answer
//    to the question in some other grammar.
//
// It inherits prompts.js's spark composition contract VERBATIM (lowercase
// noun phrase, no leading preposition, no duplicate spark string) — hive
// sparks compose into a sentence the same way (spec §16.2).

// private_hives.relationship allows 7 values (spec §16.1); only 4 have
// their own prompt register (spec §16.2 table). sibling/mentor/other fall
// back to `friend`. Exported raw (not just the accessor) so a gate can
// enumerate it without re-deriving the mapping.
export const RELATIONSHIP_TO_REGISTER = {
  child: 'child',
  partner: 'partner',
  parent: 'parent',
  friend: 'friend',
  sibling: 'friend',
  mentor: 'friend',
  other: 'friend',
};

export const registerForRelationship = (relationship) =>
  RELATIONSHIP_TO_REGISTER[relationship] ?? 'friend';

// Age buckets are keyed on HIVE age (days since private_hives.created_at),
// not the subject's age — v1 collects no birthdate (spec §16.3). Boundaries
// are exact-year day counts; a hive is in a bucket through day (years*365 - 1)
// and rolls into the next bucket on day (years*365).
const AGE_BUCKET_THRESHOLDS = {
  child: [
    ['0-1', 365],
    ['1-3', 3 * 365],
    ['3-7', 7 * 365],
    ['7-12', 12 * 365],
    ['12-18', 18 * 365],
    ['18+', Infinity],
  ],
  partner: [
    ['0-1y', 365],
    ['1-3y', 3 * 365],
    ['3-10y', 10 * 365],
    ['10y+', Infinity],
  ],
  // "others" per spec §16.3 — parent and friend share the same 2-year split.
  parent: [
    ['new', 2 * 365],
    ['established', Infinity],
  ],
  friend: [
    ['new', 2 * 365],
    ['established', Infinity],
  ],
};

export const bucketForHiveAge = (register, hiveAgeDays) => {
  const thresholds = AGE_BUCKET_THRESHOLDS[register] ?? AGE_BUCKET_THRESHOLDS.friend;
  const age = Number.isFinite(hiveAgeDays) && hiveAgeDays >= 0 ? hiveAgeDays : 0;
  const found = thresholds.find(([, maxDays]) => age < maxDays);
  return (found ?? thresholds[thresholds.length - 1])[0];
};

// Each register's ladder, keyed by bucket — `{ question, sparks }`, the
// same shape as prompts.js's DAILY_PROMPTS, since ComposeHiveEntry
// composes a tapped spark into a sentence the identical way (spec §16.2,
// §16.4). Ladders are append-safe: adding a rung re-maps which prompt a
// given day selects (index mod length moves), but selection stays
// deterministic and day-stable, so deepening a bucket later costs one
// prompt-change at the next cadence boundary and nothing else.
export const HIVE_PROMPT_LADDERS = {
  child: {
    '0-1': [
      {
        question: "What's a first you got to watch {subject_name} have this month?",
        sparks: ["the first wobbly ride without training wheels", "their first try at something they'd been scared of", "the first word they read all by themselves"],
      },
      {
        question: "What did {subject_name} do today that you never want to forget?",
        sparks: ["the wave goodbye at the gate", "their victory dance over finished homework", "falling asleep mid-sentence"],
      },
      {
        question: "What made {subject_name} laugh this week?",
        sparks: ["the dog chasing absolutely nothing", "their own joke landing at dinner", "a tickle war they started and lost"],
      },
      {
        question: "What's something small about {subject_name} right now that's already changing?",
        sparks: ["the way they say spaghetti", "a voice that's changing by the month", "the gap where their front tooth was"],
      },
      {
        question: "When did {subject_name} surprise you lately?",
        sparks: ["sharing the last cookie without being asked", "a question about the moon I couldn't answer", "standing up for their little cousin"],
      },
      {
        question: "What do you hope {subject_name} never grows out of?",
        sparks: ["belly laughs at their own knock-knock jokes", "saying goodnight to every stuffed animal", "asking why about everything"],
      },
    ],
    '1-3': [
      {
        question: "What has {subject_name} taught you without meaning to?",
        sparks: ["how to be amazed by an ordinary bug", "slow afternoons that weren't wasted after all", "the right way to celebrate small wins"],
      },
      {
        question: "How does {subject_name} greet you these days?",
        sparks: ["a full-speed hallway hug", "the shouted play-by-play of their day", "one cool nod that means everything"],
      },
      {
        question: "What's a habit {subject_name} has right now that you know won't last?",
        sparks: ["mismatched socks on purpose", "narrating their own games under their breath", "the goodnight handshake with eleven steps"],
      },
      {
        question: "What did {subject_name} figure out on their own this month?",
        sparks: ["the big-kid swing, no push needed", "a breakfast they made all by themselves", "a shortcut home I didn't know about"],
      },
      {
        question: "Which little thing does {subject_name} do exactly like you?",
        sparks: ["the eyebrow raise at bad ideas", "humming while they concentrate", "stacking their toast in a tower"],
      },
      {
        question: "What's hard for {subject_name} right now, and how do they keep at it?",
        sparks: ["the monkey bars, blister by blister", "sounding out the long words anyway", "trying again after the tower fell"],
      },
    ],
    '3-7': [
      {
        question: "What does {subject_name} love right now with their whole heart?",
        sparks: ["everything about dinosaurs", "the neighbor's elderly cat", "a song they play twelve times a day"],
      },
      {
        question: "What question did {subject_name} ask that stopped you in your tracks?",
        sparks: ["their question about whether the ocean gets tired", "being asked why grown-ups don't play more", "the mystery of where songs go when they end"],
      },
      {
        question: "Looking back over your entries, what's different about {subject_name} since you started writing here?",
        sparks: ["whole sentences where single words used to be", "new bravery at the pool this summer", "jokes that are now actually funny"],
      },
      {
        question: "What's {subject_name}'s latest masterpiece?",
        sparks: ["a crayon portrait of the whole family", "the couch-cushion fortress with a guest room", "a song about our car"],
      },
      {
        question: "How did {subject_name} take care of someone this week?",
        sparks: ["a get-well card for their teacher", "teaching their little brother the hard level", "saving the last strawberry for me"],
      },
      {
        question: "What did {subject_name} say this week that belongs in a book?",
        sparks: ["their definition of love", "the dramatic retelling of lunch", "a brand-new word they invented"],
      },
    ],
    '7-12': [
      {
        question: "What can {subject_name} do now that felt impossible when this hive was new?",
        sparks: ["reading chapter books under the covers", "ordering for themselves at the counter", "riding to school without me"],
      },
      {
        question: "What does {subject_name} come to you for these days?",
        sparks: ["the hard goodnight questions", "help untangling a friendship", "one more chapter, every single night"],
      },
      {
        question: "Where did {subject_name} show courage nobody else noticed?",
        sparks: ["raising their hand even though they were unsure", "trying out again after last year's cut", "telling me the truth about the window"],
      },
      {
        question: "What opinion does {subject_name} hold that they definitely didn't get from you?",
        sparks: ["their loyalty to the worst pizza topping", "strong feelings about the right way to load a backpack", "a whole ranking system for cloud shapes"],
      },
      {
        question: "How did {subject_name} make someone's day recently?",
        sparks: ["inviting the new kid to sit with them", "a surprise card in my work bag", "cheering loudest for the slowest runner"],
      },
      {
        question: "Which part of {subject_name} today do you recognize from your earliest entries here?",
        sparks: ["that same stubborn focus", "the laugh that hasn't changed a bit", "their soft spot for small animals"],
      },
    ],
    '12-18': [
      {
        question: "What did {subject_name} trust you with recently?",
        sparks: ["the real story behind the bad week", "their playlist, finally", "a fear they'd been carrying alone"],
      },
      {
        question: "What does {subject_name} believe in fiercely right now?",
        sparks: ["fairness, even when it costs them", "their team against all evidence", "a future only they can see clearly"],
      },
      {
        question: "When did {subject_name} choose the harder right thing?",
        sparks: ["owning the mistake before anyone asked", "sitting with the friend everyone dropped", "giving back what they could have kept"],
      },
      {
        question: "What makes {subject_name} laugh these days, and who with?",
        sparks: ["inside jokes I'm not allowed to know", "old videos of themselves as a toddler", "their best friend's terrible impressions"],
      },
      {
        question: "What are you learning from watching {subject_name} become themselves?",
        sparks: ["my new job as the net, not the wire", "seeing how much courage a Tuesday takes", "the person they secretly always were"],
      },
      {
        question: "What would surprise {subject_name} to hear you noticed?",
        sparks: ["their kindness when nobody's watching", "the hours behind their easy-looking wins", "the weight their friends trust them with"],
      },
    ],
    '18+': [
      {
        question: "What do you admire about the person {subject_name} turned out to be?",
        sparks: ["the way they show up for their people", "a work ethic I never had to teach", "the gentle way they correct me now"],
      },
      {
        question: "What's a recent conversation with {subject_name} you keep replaying?",
        sparks: ["the phone call that went two hours past bedtime", "their advice, which was better than mine", "hearing them talk about their own kid"],
      },
      {
        question: "How did {subject_name} show up for you when they didn't have to?",
        sparks: ["driving home just to sit with me", "remembering the anniversary nobody else did", "taking over without being asked"],
      },
      {
        question: "What part of {subject_name} has been there since your very first entry?",
        sparks: ["the exact same mischief in their eyes", "that huge heart for underdogs", "their refusal to quit a puzzle"],
      },
      {
        question: "What has {subject_name} taught you about letting go?",
        sparks: ["learning distance isn't absence", "the difference between helping and hovering", "pride and missing them sharing one room"],
      },
      {
        question: "What do you hope {subject_name} feels when they someday read all of this?",
        sparks: ["every ordinary Tuesday I bothered to write down", "eighteen years of small moments, kept", "the chance to say well done in ink"],
      },
    ],
  },
  partner: {
    '0-1y': [
      {
        question: "What ordinary moment with {subject_name} this week would you keep forever?",
        sparks: ["coffee handed over before I asked", "their grocery-store humming beside me", "their head on my shoulder during the credits"],
      },
      {
        question: "What did {subject_name} do lately that reminded you why you chose them?",
        sparks: ["the way they treated the lost tourist", "staying calm while I absolutely was not", "the third attempt at my grandmother's recipe"],
      },
      {
        question: "What does {subject_name} carry for you that nobody else sees?",
        sparks: ["the mental calendar of everyone we love", "my worry, translated into plans", "all the passwords and the plants"],
      },
      {
        question: "What tiny thing about {subject_name} would you be sad to forget?",
        sparks: ["the sleepy wave from under the blanket", "their off-key harmony in the car", "the specific knock before coming in"],
      },
      {
        question: "How did {subject_name} make an ordinary day better?",
        sparks: ["a text at exactly the right minute", "leftovers arranged like a restaurant plate", "taking the long way home so the song could finish"],
      },
      {
        question: "What did you notice about {subject_name} this week that you've never told them?",
        sparks: ["the way their voice softens with their mother", "the little bow after fixing anything", "always getting the window seat"],
      },
    ],
    '1-3y': [
      {
        question: "What does {subject_name} do every day that you'd miss within an hour?",
        sparks: ["the weather report I never asked for", "their keys landing in the bowl at six", "the last look back before leaving"],
      },
      {
        question: "When did {subject_name} read your mind this month?",
        sparks: ["dinner already ordered from the right place", "the quiet exit from the loud party", "a blanket appearing mid-movie"],
      },
      {
        question: "What did {subject_name} handle lately that you never even saw?",
        sparks: ["the entire insurance saga, handled", "my mother's birthday logistics", "the sink, mysteriously fixed"],
      },
      {
        question: "What's a small kindness {subject_name} thinks you didn't notice?",
        sparks: ["my side of the bed pre-warmed", "the last dumpling, quietly surrendered", "a gas tank that's always somehow full"],
      },
      {
        question: "Which of {subject_name}'s laughs is your favorite, and what set it off last?",
        sparks: ["the silent shaking laugh over my parking", "the snort they deny exists", "the slow build that ends in tears"],
      },
      {
        question: "What are you still learning about {subject_name}?",
        sparks: ["the childhood stories still arriving", "finally reading their quiet", "loyalty deeper than I knew"],
      },
    ],
    '3-10y': [
      {
        question: "What has loving {subject_name} taught you about yourself?",
        sparks: ["patience I didn't know I had", "meeting the source of my stubbornness", "being known, which beats being impressive"],
      },
      {
        question: "What's a hard season {subject_name} walked you through?",
        sparks: ["the year of the hospital parking lot", "the job that ended badly, survived together", "those months the money got thin"],
      },
      {
        question: "How does {subject_name} still surprise you after all this time?",
        sparks: ["a brand-new opinion out of nowhere", "the hidden talent at the arcade", "flowers on a day that wasn't anything"],
      },
      {
        question: "What ordinary thing do you and {subject_name} do together that's secretly your favorite?",
        sparks: ["the Sunday pancake assembly line", "narrating the neighbors' renovations", "our slow lap around the block after dinner"],
      },
      {
        question: "When were you proudest of {subject_name} this year?",
        sparks: ["the speech they were terrified to give", "the grace they showed with the hard news", "watching them mentor the new hire"],
      },
      {
        question: "What would you want {subject_name} to know you never took for granted?",
        sparks: ["every school run in the rain", "the career they downshifted for us", "ten thousand unremarkable dinners together"],
      },
    ],
    '10y+': [
      {
        question: "What about {subject_name} is exactly the same as the day you met?",
        sparks: ["that laugh across a crowded room", "their instant siding with the underdog", "the terrible puns, still arriving daily"],
      },
      {
        question: "What do you and {subject_name} no longer need words for?",
        sparks: ["the glance that means time to leave", "splitting the newspaper the right way", "our unspoken seating chart for everything"],
      },
      {
        question: "What did {subject_name} carry this year that deserved more thanks?",
        sparks: ["the quiet math of our future", "both sets of aging parents, carried", "my moods through the hard stretch"],
      },
      {
        question: "Which everyday sound of {subject_name} would you miss the most?",
        sparks: ["the kettle going on before my alarm", "their end of a phone call in the next room", "the hum while they water the garden"],
      },
      {
        question: "What's a choice {subject_name} made years ago that you're still grateful for?",
        sparks: ["saying yes to the tiny first apartment", "insisting we take the trip anyway", "betting on my half-formed dream"],
      },
      {
        question: "If {subject_name} read this hive tomorrow, which entry do you hope they'd linger on?",
        sparks: ["the one about the airport reunion", "any of the ordinary Tuesdays", "the entry I almost didn't write"],
      },
    ],
  },
  parent: {
    new: [
      {
        question: "What do you understand about {subject_name} now that you didn't as a kid?",
        sparks: ["a new respect for how tired they were", "finally seeing the love inside the rules", "understanding what the long silences held"],
      },
      {
        question: "What did {subject_name} do for you that you only recognized years later?",
        sparks: ["the shifts traded to make my games", "college math done at the kitchen table", "all the nothing-is-wrong performances"],
      },
      {
        question: "Which of {subject_name}'s habits did you inherit and secretly love?",
        sparks: ["talking to the tomatoes", "reading the ending first", "the exact same overpacked pantry"],
      },
      {
        question: "What's something you've never said to {subject_name} out loud?",
        sparks: ["their voice, my calm-down trick", "all the times I quote them at work", "the lunchbox notes I secretly kept"],
      },
      {
        question: "What did {subject_name} teach you without ever calling it a lesson?",
        sparks: ["how to show up at hard doors", "a made bed fixing the whole morning", "how to argue and still set the table together"],
      },
      {
        question: "What sacrifice of {subject_name}'s do you see differently now?",
        sparks: ["the dreams filed under someday", "the years of the second job", "hand-me-downs so I could have new"],
      },
      {
        question: "What's a story {subject_name} tells that you hope never stops being told?",
        sparks: ["the wedding-day flat tire", "the forty-dollars-across-the-country story", "the fish that genuinely was that big"],
      },
      {
        question: "When did you catch yourself sounding exactly like {subject_name}?",
        sparks: ["the sigh before lifting anything heavy", "warning my kids about wet hair", "haggling politely at the market"],
      },
      {
        question: "What's your earliest memory of feeling safe with {subject_name}?",
        sparks: ["the drive home in the dark, half asleep", "their hand checking my forehead", "thunder losing to their calm voice"],
      },
      {
        question: "What would the young you be surprised to learn about {subject_name}?",
        sparks: ["learning they were scared too", "the whole life they lived before me", "discovering how funny they actually are"],
      },
    ],
    established: [
      {
        question: "What did {subject_name} say recently that you want to keep?",
        sparks: ["their toast at the anniversary dinner", "the advice about my own kids", "one perfect line about grief"],
      },
      {
        question: "How has your picture of {subject_name} changed since you started writing here?",
        sparks: ["smaller worries, bigger gratitude", "more person, less parent", "the humor I finally have ears for"],
      },
      {
        question: "What do you and {subject_name} talk about now that you never used to?",
        sparks: ["the family history under the family history", "money talk, finally, without flinching", "hearing what they actually wanted back then"],
      },
      {
        question: "What question do you still want to ask {subject_name}?",
        sparks: ["the chance to still ask them anything", "the story of the lost year, someday", "questions I'm saving for the porch"],
      },
      {
        question: "What part of your daily life carries {subject_name}'s fingerprints?",
        sparks: ["the garden that outgrew its teacher", "their recipe in my handwriting", "checking the locks the exact same way"],
      },
      {
        question: "What did {subject_name} get right that you once argued about?",
        sparks: ["saving before spending", "proof that friendship needs tending", "the value of showing up early"],
      },
      {
        question: "Which of {subject_name}'s phrases lives rent-free in your head?",
        sparks: ["measure twice, cry once", "their name for lazy Sundays", "the warning about peaking too early"],
      },
      {
        question: "What does {subject_name} still do for you, even now?",
        sparks: ["the birthday call at the exact minute", "clippings saved from the paper", "worrying enough for both of us"],
      },
      {
        question: "What do you hope you've made {subject_name} feel?",
        sparks: ["every sacrifice landing somewhere", "being seen for more than the chores", "a door that swings both ways now"],
      },
      {
        question: "What about {subject_name} do you understand better every year?",
        sparks: ["the courage inside the caution", "the reason they held on to everything", "their fierce quiet love"],
      },
    ],
  },
  friend: {
    new: [
      {
        question: "When did {subject_name} show up for you without being asked?",
        sparks: ["moving day, with gloves and a truck", "the back row of the hardest day", "soup on the doorstep during the bad flu"],
      },
      {
        question: "What did {subject_name} say that made you laugh until it hurt?",
        sparks: ["the voicemail left entirely as a medieval knight", "their unsparing review of my cooking", "one perfectly timed text in a silent meeting"],
      },
      {
        question: "What's the thing only {subject_name} does?",
        sparks: ["remembering what I said months ago", "the dramatic reading of bad menus", "applauding tiny victories like championships"],
      },
      {
        question: "What version of yourself does {subject_name} bring out?",
        sparks: ["the me who says yes to things", "my braver, louder self", "someone who dances at weddings now"],
      },
      {
        question: "How did you first know {subject_name} was going to matter?",
        sparks: ["the four-hour conversation that felt like ten minutes", "laughing at the same wrong moment", "silence that was already easy"],
      },
      {
        question: "What did {subject_name} notice about you that nobody else did?",
        sparks: ["the day they saw through my fine", "the hobby I'd quietly given up, noticed", "being told what I'm actually good at"],
      },
      {
        question: "What small tradition have you and {subject_name} already started?",
        sparks: ["the monthly terrible-movie summit", "the ceremonial splitting of the last fry", "new-menu reconnaissance at lunch"],
      },
      {
        question: "When did {subject_name} tell you a truth you needed?",
        sparks: ["their honesty about the shrinking job", "the haircut intervention", "permission to actually rest"],
      },
      {
        question: "What can you say to {subject_name} that you can't say to anyone else?",
        sparks: ["the unpolished first drafts of my plans", "the petty stuff, judgment-free", "the three a.m. worries, answered"],
      },
      {
        question: "What did {subject_name} make easier this month just by being around?",
        sparks: ["the waiting room hours", "a party full of strangers, survivable", "the week the news was bad"],
      },
    ],
    established: [
      {
        question: "What's a joke between you and {subject_name} that no one else will ever get?",
        sparks: ["the seagull incident of the beach trip", "one word that ruins us both", "the fake band we still book gigs for"],
      },
      {
        question: "When did {subject_name} drop everything for you?",
        sparks: ["the midnight airport run", "flying in for the hardest week", "answering on the first ring, years running"],
      },
      {
        question: "How has {subject_name} changed since your first entry here, and what hasn't?",
        sparks: ["softer edges, same spine", "new city, same three-hour calls", "gray hair, identical mischief"],
      },
      {
        question: "What do you never have to explain to {subject_name}?",
        sparks: ["never explaining the corner seat", "my complicated family math", "the silences that aren't anger"],
      },
      {
        question: "Which chapter of your life did {subject_name} carry you through?",
        sparks: ["the divorce year", "the startup that ate two years", "new parenthood at its most feral"],
      },
      {
        question: "What's the {subject_name} story you always end up telling?",
        sparks: ["the wrong-wedding entrance", "the ticket they talked us out of", "the camping trip that went fully sideways"],
      },
      {
        question: "What has {subject_name} taught you about friendship itself?",
        sparks: ["maintenance as the actual romance", "showing up, over saying the right thing", "distance as logistics, never a verdict"],
      },
      {
        question: "When did {subject_name} last make you cry laughing?",
        sparks: ["the retelling of their DMV day", "a photo caption I still think about", "their impression of my phone voice"],
      },
      {
        question: "What would your life be missing if {subject_name} had never shown up?",
        sparks: ["half my best stories", "the person who calls my bluff", "an entire vocabulary of nonsense"],
      },
      {
        question: "What do you hope {subject_name} knows without being told?",
        sparks: ["family, paperwork or not", "a standing invitation with no expiry", "my constant bragging about them"],
      },
    ],
  },
};

// Days since a hive's creation, floored to whole days. `now` is injectable
// so callers (and tests) don't have to fight a hidden `new Date()`.
export const daysSinceHiveCreated = (createdAt, now = new Date()) => {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
};

// Same djb2-ish string hash as Avatar.js's `hashName`, kept identical on
// purpose — one mental model for "turn an id into a stable small int" in
// this codebase.
const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 2147483647;
  }
  return hash;
};

// Deterministic selection, spec §16.3:
//   index = hash(hive_id) + floor(days_since_hive_created / cadence_days)
//   prompt = ladder[bucket][index mod ladder[bucket].length]
// No AsyncStorage, no server round-trip — stable across a re-render and
// across a single day, never jumps.
//
// `cadenceDays` has NO default here on purpose. The spec pins the formula
// but not a value, and baking in a guessed number would silently ship an
// unratified product decision. Callers must pass it explicitly until that
// value gets a ruling.
export const selectHivePrompt = ({ hiveId, relationship, hiveAgeDays, cadenceDays }) => {
  if (!hiveId || !Number.isFinite(cadenceDays) || cadenceDays <= 0) return null;
  const register = registerForRelationship(relationship);
  const bucket = bucketForHiveAge(register, hiveAgeDays);
  const ladder = HIVE_PROMPT_LADDERS[register]?.[bucket] ?? [];
  if (ladder.length === 0) return null;
  const age = Number.isFinite(hiveAgeDays) && hiveAgeDays >= 0 ? hiveAgeDays : 0;
  const index = hashString(String(hiveId)) + Math.floor(age / cadenceDays);
  return ladder[index % ladder.length];
};

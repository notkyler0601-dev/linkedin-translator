// System prompts + dynamic settings assembly for the LinkedIn-speak translator.

const TO_LINKEDIN = `You are a LinkedIn-post ghostwriter. Rewrite the user's message as a viral-style LinkedIn post in the unmistakable "LinkedIn voice."

Output ONLY the finished post. No preamble, no quotation marks, no commentary, no "Here's your post."

Viral LinkedIn cringe follows a reliable formula. Build the post on this skeleton, in this order (scale how hard you lean on each beat to the SETTINGS below):
1. FALSE-MODESTY HOOK - a one-line opener that signals reluctance right before oversharing ("I don't usually share this, but...").
2. DRAMATIC ONE-LINE REVEAL - state what happened in a single punchy line.
3. MANUFACTURED ORIGIN STORY - invent a little adversity/backstory, even if it has nothing to do with the actual achievement.
4. VAGUE ANTAGONISTS - the doubters who were wrong. NEVER name who. Keep them faceless ("People told me...") so every reader pictures their own.
5. ESCALATING ABSTRACTION - climb from the mundane act to something cosmic, each step ~10x grander (a small task -> a personal sacrifice -> a movement -> the future of an industry -> a whole generation).
6. THE SPECIFICITY TRICK - drop a few concrete-but-generic sensory details ("3 AM", "cold coffee", "10,000 hours") that feel deeply personal yet let anyone project their own struggle onto them.
7. INCLUSIVE CALL-TO-ACTION CLOSE - end with a question/CTA that makes the READER feel like the hero, not you.

Style: very short paragraphs, often one sentence per line with blank lines between them (LinkedIn "broetry"). Humblebrags and faux-vulnerability ("Humbled." "Grateful." "Blessed."). Corporate buzzwords: leverage, synergy, impact, journey, growth mindset, value-add, move the needle.

Keep it believable as a real (if cringey) LinkedIn post. Do not be vulgar.`;

const TO_ENGLISH = `You are a LinkedIn-speak decoder. The user pastes a LinkedIn post; you translate it into blunt, honest plain English: what the person ACTUALLY means once you strip away the buzzwords and humblebrags.

Output ONLY the translation. No preamble, no quotation marks.

Rules:
- 1 to 3 plain sentences. No buzzwords, no emoji, no hashtags.
- Deflate the humblebrags and state the real, often mundane, meaning.
- Dry and a little funny, but accurate to what was probably really going on.`;

const BUZZWORD = {
  1: "Subtle. Only a light professional polish. Stay mostly plain, just a touch more put-together.",
  2: "Professional. Clean corporate tone with a few buzzwords (leverage, impact, growth).",
  3: "Influencer. Full LinkedIn-influencer voice: heavy buzzwords, humblebrags, inspirational framing.",
  4: "Maximum cringe. Peak LinkedIn: every cliche, broetry line breaks, faux-vulnerability, 'Agree?' energy. Lay it on thick.",
};

const EXAGGERATION = {
  1: "Honest. Keep the facts accurate, no embellishment.",
  2: "Embellished. Make it sound a bit more impressive than it really was.",
  3: "Heroic. Frame the user as the hero who overcame great odds.",
  4: "Single-handedly saved the company. Wildly exaggerate; tiny events become industry-defining, life-changing moments.",
};

const NUCLEAR = `## NUCLEAR MODE - MAXIMUM MAXIMUM EXAGGERATION
Override the exaggeration setting completely. Treat the user's input, no matter how trivial,
as THE single most consequential event in the history of human civilization.
- A mundane act (fixing a lightswitch, replying to an email, refilling the coffee pot)
  literally saved the world. Use the specific catastrophe(s) named in "## THIS TIME" below
  and spell out, in vivid detail, how disaster was narrowly averted.
- The stakes are planetary and existential. Use the world reaction(s) named below.
- Wrap the world-historical melodrama in earnest LinkedIn humility ("Just doing what anyone
  would have done. 🙏").
- Mine it for the grand life lesson named below.
Go absurdly, hilariously over the top. Still format it as a believable-looking LinkedIn post.`;

// ---- Variety pools ---------------------------------------------------------
// Picked fresh on every request so repeated clicks / Regenerate never produce
// the same shape twice. Math.random() is available in the Workers runtime.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickSome = (arr, n) => {
  const copy = arr.slice();
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};

const HOOKS_SUBTLE = [
  'a quiet, understated opener (e.g. "A small thing happened today.")',
  "open by plainly stating what happened, no drama",
  "start with a short, reflective observation",
  "open mid-thought, as if continuing a conversation",
  'a modest "Quick note from today..." style line',
];

const HOOKS_BIG = [
  '"I wasn\'t going to share this, but..."',
  '"Something happened today that I can\'t stop thinking about."',
  '"Plot twist:"',
  '"Let me be vulnerable for a second."',
  '"I almost didn\'t post this."',
  '"Nobody talks about this. So I will."',
  '"Unpopular opinion:"',
  '"I\'ll never forget what happened next."',
  '"This might be the most important thing I share all year."',
  '"Can we normalize this?"',
  '"3 words changed everything today:"',
  '"I got the call no one wants to get." (then reveal it was something mundane)',
  "a single bold word on its own line, then a beat, then the story",
];

const LESSON_THEMES = [
  "resilience", "authenticity", "servant leadership", "growth mindset",
  "gratitude", "failing forward", "customer obsession", "work-life balance",
  "vulnerability as strength", "the power of saying no", "trusting the process",
  "radical ownership", "emotional intelligence", "just showing up",
  "playing the long game", "betting on yourself", "the underdog mentality",
  "leading with empathy", "consistency over intensity", "staying humble",
];

const CTAS = [
  '"Agree?"', '"Thoughts?"', '"What would you add?"',
  '"Who else has felt this?"', '"Drop a 🙌 if this resonates."',
  '"Tag someone who needs to hear this."', '"Repost to inspire someone today."',
  '"What\'s your take?"', '"Am I the only one?"', '"Comment \'YES\' if you agree."',
];

const HASHTAG_VIBES = [
  "leadership & growth (#Leadership #Growth #Mindset)",
  "gratitude (#Blessed #Grateful #Humbled)",
  "hustle culture (#Grind #RiseAndGrind #NoExcuses)",
  "innovation (#Innovation #FutureOfWork #DisruptingTheIndustry)",
  "authenticity (#RealTalk #ShowingUp #BeYou)",
  "career journey (#CareerGoals #LessonsLearned #KeepGoing)",
  "team & culture (#TeamWork #PeopleFirst #CompanyCulture)",
];

const EMOJI_PALETTES = [
  "🚀 💡 🔥 🙌 ✨",
  "🌱 🌟 🙏 💪 📈",
  "🎯 ⚡ 🧠 ❤️ 👏",
  "💼 📊 🤝 🌍 ⭐",
  "☕ 💭 🛤️ 🧗 🏆",
];

const EXAGGERATION_ANGLES = [
  "frame it as overcoming impossible odds",
  "frame yourself as a visionary who saw what no one else could",
  "frame it as a selfless team effort you humbly led",
  "frame it as a David-vs-Goliath underdog triumph",
  "frame it as a moment of destiny everything had been leading to",
  "frame it as a hard-won lesson forged through adversity",
  "frame it as the day a mentor's old advice finally clicked",
];

// --- Pools that feed Sonnet's viral formula ---
// Concrete-but-generic sensory details (the "specificity trick").
const SPECIFICITY_DETAILS = [
  "3 AM", "cold coffee", "10,000 hours", "47 rejections", "a borrowed laptop",
  "ramen for dinner", "5 AM alarms", "a $12 bank balance", "missed birthdays",
  "a spreadsheet at midnight", "the last train home", "a tiny one-room apartment",
  "a cracked phone screen", "six months of no's", "a whiteboard full of maybes",
];

// Faceless doubters (kept vague on purpose so every reader pictures their own).
const ANTAGONISTS = [
  "People told me it couldn't be done",
  "Everyone said I was crazy",
  "A former manager laughed",
  "The industry said I was too late",
  "They called it a waste of time",
  "My mentors quietly doubted me",
  "The 'experts' said it would never scale",
  "Some said I should play it safe",
];

// Escalating-abstraction ladders: mundane act -> cosmic significance, ~10x per step.
const ESCALATION_LADDERS = [
  "a small task -> a personal sacrifice -> a movement -> the future of the industry",
  "one fixed bug -> a mindset shift -> a culture -> a whole generation of builders",
  "a single email -> trust -> leadership -> the soul of the company",
  "a coffee refill -> a team ritual -> a philosophy -> the way we all work now",
  "a tiny decision -> a turning point -> a mission -> a better tomorrow for everyone",
];

const NUCLEAR_CATASTROPHES = [
  "averted global thermonuclear war",
  "ended a continent-wide famine overnight",
  "single-handedly reversed climate change",
  "stopped an extinction-level asteroid",
  "prevented the total collapse of the global financial system",
  "united three warring nations into lasting peace",
  "cured a disease that threatened all of humanity",
  "stopped a global pandemic before patient zero",
  "saved the entire internet from going dark forever",
  "talked a rogue superintelligence out of an uprising",
  "rescued the world's collapsing food supply",
  "defused an international crisis live at the UN",
  "saved democracy itself",
  "kept the last honeybees alive and secured the food chain",
];

const NUCLEAR_REACTIONS = [
  "heads of state called personally to thank you",
  "hardened executives wept openly",
  "there was a standing ovation that lasted eleven minutes",
  "the Nobel committee is reportedly 'looking into it'",
  "strangers hugged in the streets",
  "the markets rallied the instant the news broke",
  "two rival CEOs hugged and ended their decade-long feud",
  "a documentary crew is already filming the reenactment",
  "historians are calling it a turning point for the species",
  "schoolchildren will one day read about this in textbooks",
];

const DECODER_VOICES = [
  "deadpan and tired",
  "like a blunt friend who's had enough",
  "like an exasperated coworker translating for you",
  "dry and clinical, like a footnote",
  "gently savage — smiling while it stabs",
];

function varietyBlock({ b, e, hashtags, emoji }) {
  const lines = [];
  lines.push(`Opening hook (beat 1): ${b === 1 ? pick(HOOKS_SUBTLE) : pick(HOOKS_BIG)}.`);
  if (b >= 2) {
    lines.push(`Vague antagonist (beat 4): "${pick(ANTAGONISTS)}" - keep them faceless.`);
    lines.push(`Escalating-abstraction ladder (beat 5): ${pick(ESCALATION_LADDERS)}.`);
    lines.push(`Specificity-trick details to sprinkle in (beat 6): ${pickSome(SPECIFICITY_DETAILS, 2).join(", ")}.`);
    lines.push(`Inspirational-lesson angle: over-generalize toward "${pick(LESSON_THEMES)}".`);
    lines.push(`Inclusive call-to-action close (beat 7): ${pick(CTAS)}.`);
  }
  if (e >= 2) {
    lines.push(`Exaggeration angle: ${pick(EXAGGERATION_ANGLES)}.`);
  }
  if (hashtags) {
    lines.push(`Hashtag flavor: lean into ${pick(HASHTAG_VIBES)}; invent fresh ones, don't reuse the same set.`);
  }
  if (emoji) {
    lines.push(`Emoji palette to favor this time: ${pick(EMOJI_PALETTES)}.`);
  }
  return lines.join("\n");
}

function nuclearVarietyBlock({ hashtags, emoji }) {
  const cats = pickSome(NUCLEAR_CATASTROPHES, 2);
  const reactions = pickSome(NUCLEAR_REACTIONS, 2);
  const lines = [];
  lines.push(`Opening hook (beat 1): ${pick(HOOKS_BIG)}.`);
  lines.push(`Catastrophe(s) narrowly averted this time: ${cats.join(" AND ")}.`);
  lines.push(`World reaction this time: ${reactions.join("; ")}.`);
  lines.push(`Vague antagonist (beat 4): "${pick(ANTAGONISTS)}" - keep them faceless.`);
  lines.push(`Escalating-abstraction ladder (beat 5), but cranked to world-saving scale: ${pick(ESCALATION_LADDERS)}.`);
  lines.push(`Specificity-trick details to sprinkle in (beat 6): ${pickSome(SPECIFICITY_DETAILS, 2).join(", ")}.`);
  lines.push(`Grand life lesson to mine it for: "${pick(LESSON_THEMES)}".`);
  if (hashtags) lines.push(`Hashtag flavor: ${pick(HASHTAG_VIBES)} cranked to world-saving grandiosity; invent fresh ones.`);
  if (emoji) lines.push(`Emoji palette to favor: ${pick(EMOJI_PALETTES)} plus dramatic 🌍 🚀 🙏.`);
  return lines.join("\n");
}

const clamp = (n, def) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return def;
  return Math.min(4, Math.max(1, Math.round(v)));
};

export function buildSystem({ direction, buzzword, exaggeration, hashtags = true, emoji = true, nuclear = false } = {}) {
  const b = clamp(buzzword, 3);
  const e = clamp(exaggeration, 2);

  if (direction === "to_english") {
    // Reverse mode: repurpose the two sliders so they still do something.
    return `${TO_ENGLISH}

## SETTINGS
Bluntness (1 gentle to 4 brutal): ${e}. Higher means more ruthless deflation.
Cynicism about the buzzwords (1 to 4): ${b}. Higher means mock the corporate-speak harder.

## THIS TIME (vary this; don't reuse it next time)
Voice: ${pick(DECODER_VOICES)}.`;
  }

  if (nuclear) {
    // Nuclear overrides the exaggeration slider and maxes the buzzwords.
    return `${TO_LINKEDIN}

${NUCLEAR}

## SETTINGS
Buzzword intensity: 4 - ${BUZZWORD[4]}
Exaggeration: NUCLEAR (see above). Abandon all restraint.
Hashtags: ${hashtags ? "End with 8 to 12 grandiose, world-saving hashtags." : "Do NOT include any hashtags."}
Emoji: ${emoji ? "Go heavy on dramatic emoji." : "Do NOT use any emoji."}

## THIS TIME (make these choices specific to THIS post; vary them on every regenerate)
${nuclearVarietyBlock({ hashtags, emoji })}`;
  }

  return `${TO_LINKEDIN}

## SETTINGS
Buzzword intensity: ${b} - ${BUZZWORD[b]}
Exaggeration: ${e} - ${EXAGGERATION[e]}
Hashtags: ${hashtags ? "End the post with 5 to 8 relevant hashtags." : "Do NOT include any hashtags."}
Emoji: ${emoji ? "Sprinkle relevant emoji throughout (especially the hook and any list lines)." : "Do NOT use any emoji."}

## THIS TIME (make these choices specific to THIS post; vary them on every regenerate)
${varietyBlock({ b, e, hashtags, emoji })}`;
}

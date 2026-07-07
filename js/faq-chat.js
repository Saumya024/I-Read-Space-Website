// FAQ Chat Widget
// Accordion/Dropdown-based navigation system

// This widget is loaded on ~180 pages across the site, most of which don't
// load booking-shared.js. It prefers window.IRSBooking's pricing table when
// present (single source of truth), but falls back to this compact copy so
// regional pricing still works standalone. Keep these numbers in sync with
// REGION_PRICING in js/booking-shared.js if prices ever change.
const FAQ_REGION_PRICING_FALLBACK = {
  in: { individual: { 30: { audioPrice: '₹1,200', videoPrice: '₹1,500' }, 60: { audioPrice: '₹2,400', videoPrice: '₹3,000' }, 90: { audioPrice: '₹3,600', videoPrice: '₹4,500' } }, packages: { 30: { audioSavings: 'Save ₹300' }, 90: { audioSavings: 'Save ₹900' } } },
  intl: { individual: { 30: { audioPrice: '$27', videoPrice: '$33' }, 60: { audioPrice: '$54', videoPrice: '$73' }, 90: { audioPrice: '$81', videoPrice: '$114' } }, packages: { 30: { audioSavings: 'Save $9' }, 90: { audioSavings: 'Save $27' } } },
  ca: { individual: { 30: { audioPrice: 'C$34', videoPrice: 'C$41' }, 60: { audioPrice: 'C$67', videoPrice: 'C$91' }, 90: { audioPrice: 'C$101', videoPrice: 'C$142' } }, packages: { 30: { audioSavings: 'Save C$12' }, 90: { audioSavings: 'Save C$33' } } },
  au: { individual: { 30: { audioPrice: 'A$39', videoPrice: 'A$48' }, 60: { audioPrice: 'A$78', videoPrice: 'A$105' }, 90: { audioPrice: 'A$117', videoPrice: 'A$164' } }, packages: { 30: { audioSavings: 'Save A$13' }, 90: { audioSavings: 'Save A$40' } } },
  ae: { individual: { 30: { audioPrice: 'AED 84', videoPrice: 'AED 103' }, 60: { audioPrice: 'AED 169', videoPrice: 'AED 228' }, 90: { audioPrice: 'AED 253', videoPrice: 'AED 356' } }, packages: { 30: { audioSavings: 'Save AED 27' }, 90: { audioSavings: 'Save AED 85' } } },
  eu: { individual: { 30: { audioPrice: '€24', videoPrice: '€29' }, 60: { audioPrice: '€47', videoPrice: '€64' }, 90: { audioPrice: '€71', videoPrice: '€100' } }, packages: { 30: { audioSavings: 'Save €9' }, 90: { audioSavings: 'Save €24' } } },
  gb: { individual: { 30: { audioPrice: '£20', videoPrice: '£25' }, 60: { audioPrice: '£40', videoPrice: '£55' }, 90: { audioPrice: '£61', videoPrice: '£86' } }, packages: { 30: { audioSavings: 'Save £6' }, 90: { audioSavings: 'Save £21' } } },
  sg: { individual: { 30: { audioPrice: 'S$35', videoPrice: 'S$43' }, 60: { audioPrice: 'S$70', videoPrice: 'S$94' }, 90: { audioPrice: 'S$104', videoPrice: 'S$147' } }, packages: { 30: { audioSavings: 'Save S$12' }, 90: { audioSavings: 'Save S$33' } } },
  nz: { individual: { 30: { audioPrice: 'NZ$48', videoPrice: 'NZ$58' }, 60: { audioPrice: 'NZ$95', videoPrice: 'NZ$128' }, 90: { audioPrice: 'NZ$143', videoPrice: 'NZ$201' } }, packages: { 30: { audioSavings: 'Save NZ$17' }, 90: { audioSavings: 'Save NZ$49' } } },
  jp: { individual: { 30: { audioPrice: '¥3,100', videoPrice: '¥3,700' }, 60: { audioPrice: '¥6,100', videoPrice: '¥8,300' }, 90: { audioPrice: '¥9,200', videoPrice: '¥12,900' } }, packages: { 30: { audioSavings: 'Save ¥1,100' }, 90: { audioSavings: 'Save ¥3,100' } } },
  kr: { individual: { 30: { audioPrice: '₩31,000', videoPrice: '₩38,000' }, 60: { audioPrice: '₩62,000', videoPrice: '₩83,000' }, 90: { audioPrice: '₩93,000', videoPrice: '₩130,000' } }, packages: { 30: { audioSavings: 'Save ₩11,000' }, 90: { audioSavings: 'Save ₩32,000' } } },
  il: { individual: { 30: { audioPrice: '₪81', videoPrice: '₪99' }, 60: { audioPrice: '₪162', videoPrice: '₪219' }, 90: { audioPrice: '₪243', videoPrice: '₪342' } }, packages: { 30: { audioSavings: 'Save ₪27' }, 90: { audioSavings: 'Save ₪81' } } },
  pl: { individual: { 30: { audioPrice: '61 zł', videoPrice: '74 zł' }, 60: { audioPrice: '122 zł', videoPrice: '164 zł' }, 90: { audioPrice: '182 zł', videoPrice: '256 zł' } }, packages: { 30: { audioSavings: 'Save 21 zł' }, 90: { audioSavings: 'Save 60 zł' } } }
};

function getFaqRegionTable(region) {
  if (window.IRSBooking && window.IRSBooking.getRegionPricingTable) {
    return window.IRSBooking.getRegionPricingTable(region);
  }
  return FAQ_REGION_PRICING_FALLBACK[region] || FAQ_REGION_PRICING_FALLBACK.intl;
}

// Mirrors booking-shared.js's detectRegion, self-contained so this widget
// still localizes pricing on pages that don't load booking-shared.js.
const FAQ_COUNTRY_CODE_TO_REGION = {
  IN: 'in', CA: 'ca', AU: 'au', AE: 'ae', GB: 'gb', SG: 'sg', NZ: 'nz', JP: 'jp', KR: 'kr', IL: 'il', PL: 'pl',
  AT: 'eu', BE: 'eu', CY: 'eu', EE: 'eu', FI: 'eu', FR: 'eu', DE: 'eu', GR: 'eu', IE: 'eu', IT: 'eu',
  LV: 'eu', LT: 'eu', LU: 'eu', MT: 'eu', NL: 'eu', PT: 'eu', SK: 'eu', SI: 'eu', ES: 'eu', HR: 'eu'
};
const FAQ_VALID_REGIONS = Object.keys(FAQ_REGION_PRICING_FALLBACK);

// Mirrors booking-shared.js's TIMEZONE_TO_REGION / LOCALE_SUFFIX_TO_REGION.
const FAQ_TIMEZONE_TO_REGION = {
  'Asia/Kolkata': 'in', 'Asia/Calcutta': 'in', 'Asia/Dubai': 'ae', 'Asia/Singapore': 'sg', 'Asia/Tokyo': 'jp',
  'Asia/Seoul': 'kr', 'Asia/Jerusalem': 'il', 'Europe/Warsaw': 'pl', 'Europe/London': 'gb',
  'Pacific/Auckland': 'nz',
  'Europe/Berlin': 'eu', 'Europe/Paris': 'eu', 'Europe/Madrid': 'eu', 'Europe/Rome': 'eu',
  'Europe/Amsterdam': 'eu', 'Europe/Brussels': 'eu', 'Europe/Vienna': 'eu', 'Europe/Lisbon': 'eu',
  'Europe/Helsinki': 'eu',
  'America/Toronto': 'ca', 'America/Vancouver': 'ca', 'America/Edmonton': 'ca',
  'America/Winnipeg': 'ca', 'America/Halifax': 'ca',
  'Australia/Sydney': 'au', 'Australia/Melbourne': 'au', 'Australia/Brisbane': 'au',
  'Australia/Perth': 'au', 'Australia/Adelaide': 'au'
};
const FAQ_LOCALE_SUFFIX_TO_REGION = {
  IN: 'in', CA: 'ca', AU: 'au', AE: 'ae', GB: 'gb', SG: 'sg',
  NZ: 'nz', JP: 'jp', KR: 'kr', IL: 'il', PL: 'pl',
  DE: 'eu', FR: 'eu', ES: 'eu', IT: 'eu', NL: 'eu', IE: 'eu'
};

async function detectFaqRegionFallback(regionOverride) {
  if (FAQ_VALID_REGIONS.indexOf(regionOverride) !== -1) return regionOverride;

  // Device timezone/locale are checked before any IP lookup: they reflect
  // the device's actual settings, whereas IP-based geolocation is
  // frequently wrong for mobile carriers, VPNs, and corporate networks.
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (FAQ_TIMEZONE_TO_REGION[timezone]) return FAQ_TIMEZONE_TO_REGION[timezone];

  const locale = navigator.language || navigator.userLanguage || '';
  const localeSuffix = locale.split('-')[1];
  if (localeSuffix && FAQ_LOCALE_SUFFIX_TO_REGION[localeSuffix.toUpperCase()]) {
    return FAQ_LOCALE_SUFFIX_TO_REGION[localeSuffix.toUpperCase()];
  }

  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    if (data.country_code) return FAQ_COUNTRY_CODE_TO_REGION[data.country_code] || 'intl';
  } catch (error) { /* all detection methods failed */ }

  return 'in';
}

// Builds the "how to book" / "how much does it cost" FAQ answers for a given
// region, so every supported region (not just India/international) sees its
// own local-currency copy.
function buildRegionPricingCopy(region) {
  const table = getFaqRegionTable(region);
  const ind = table.individual;
  const pkg = table.packages;
  const lowSavings = pkg[30].audioSavings.replace('Save ', '');
  const highSavings = pkg[90].audioSavings.replace('Save ', '');

  const book = `You can book a Vedic astrology consultation online by selecting a session type, sharing your birth details, and choosing an available slot.<br><br><strong>1. Choose your session type:</strong><ul><li>30-minute session (Quick Clarity) — ${ind[30].audioPrice} (Audio) / ${ind[30].videoPrice} (Video)</li><li>60-minute session (Deep Insight) — ${ind[60].audioPrice} (Audio) / ${ind[60].videoPrice} (Video)</li><li>90-minute session (Holistic Guidance) — ${ind[90].audioPrice} (Audio) / ${ind[90].videoPrice} (Video)</li></ul><strong>2. Prepare your birth details:</strong><ul><li>Exact date of birth</li><li>Exact time of birth, if you know it (from hospital records, birth certificate, or trusted family records; if not, answer <strong>No</strong> on the form)</li><li>Place of birth (city and state/country)</li></ul><strong>3. Book online:</strong><br>Visit the <a href='schedule.html?region=${region}'>booking page</a>, select your preferred session, choose an available slot, share your birth details, and complete payment. Payment is required in advance to confirm the appointment.<br><br>Consultations are conducted online. Rescheduling is possible with 24 hours' notice. Sessions are confidential.`;

  const cost = `Vedic astrology consultations at I Read Space range from ${ind[30].audioPrice} to ${ind[90].videoPrice}, depending on session length and format (audio or video).<br><br><ul><li><strong>30-minute session (Quick Clarity)</strong> — ${ind[30].audioPrice} (Audio) / ${ind[30].videoPrice} (Video). One primary concern using one chart.</li><li><strong>60-minute session (Deep Insight)</strong> — ${ind[60].audioPrice} (Audio) / ${ind[60].videoPrice} (Video). Up to three related themes using two charts.</li><li><strong>90-minute session (Holistic Guidance)</strong> — ${ind[90].audioPrice} (Audio) / ${ind[90].videoPrice} (Video). Multiple life areas and charts.</li></ul><strong>Session packages</strong><br>Three-session packages are available with savings of ${lowSavings}–${highSavings}. Sessions do not expire.<br><br>Payment is required in advance. Rescheduling possible with 24 hours' notice.`;

  return { book, cost };
}

const FAQ_DATA = [
  {
    question: "What is I Read Space?",
    answer: "I Read Space is Vedic astrology practice built around ongoing, structured birth chart consultations, not fortune-telling, but a continuing conversation that goes deeper each time, until the patterns are clear, the decisions feel easier, and the changes in your life are ones you can actually see. Founded by Saumyaa S Singh, an LSR alumna with a background in product leadership in top fintech companies and a decade of Vipassana practice, she brings both the rigour of a systems thinker and the stillness of a long-time meditator to every session.",
    category: "about"
  },
  {
    question: "Who is Saumyaa S Singh?",
    answer: "Saumyaa is a Vedic astrologer, writer, and researcher, and the founder of I Read Space. An alumna of Lady Shri Ram College, she spent years leading fintech products before turning to full-time practice, building systems used by millions gave her a structural, analytical lens that now shapes how she reads charts. She brings classical Jyotish together with psychology and a decade of Vipassana practice, so you're met by someone who understands ambition, burnout, and the messiness of real decisions, from the inside out, and knows how to read them in a chart.",
    category: "about"
  },
  {
    question: "How do I book a Vedic astrology consultation?",
    answer: "You can book a Vedic astrology consultation online by selecting a session type, sharing your birth details, and choosing an available slot.<br><br><strong>1. Choose your session type:</strong><ul><li>30-minute session (Quick Clarity) — ₹1,200 (Audio) / ₹1,500 (Video)</li><li>60-minute session (Deep Insight) — ₹2,400 (Audio) / ₹3,000 (Video)</li><li>90-minute session (Holistic Guidance) — ₹3,600 (Audio) / ₹4,500 (Video)</li></ul><strong>2. Prepare your birth details:</strong><ul><li>Exact date of birth</li><li>Exact time of birth, if you know it (from hospital records, birth certificate, or trusted family records; if not, answer <strong>No</strong> on the form)</li><li>Place of birth (city and state/country)</li></ul><strong>3. Book online:</strong><br>Visit the <a href='intake.html' target='_blank'>booking page</a>, select your preferred session, share your birth details, choose an available slot, and complete payment. Payment is required in advance to confirm the appointment.<br><br>Consultations are conducted online. Rescheduling is possible with 24 hours' notice. Sessions are confidential.",
    category: "getting-started"
  },
  {
    question: "Which Vedic astrology session should I choose?",
    answer: "Choose your session based on the life area you need clarity on and how many concerns you want to cover.<br><br><strong>Areas of Guidance:</strong><ul><li><strong>Career & Professional Direction</strong> — Work decisions, career transitions, stagnation or burnout</li><li><strong>Relationships & Marriage</strong> — Emotional patterns, compatibility, long-term relationship choices</li><li><strong>Health & Wellbeing</strong> — Mental stress patterns, emotional balance, phases calling for rest</li><li><strong>Finances & Stability</strong> — Financial decision-making, risk periods, long-term planning</li><li><strong>Family & Children</strong> — Family dynamics, parenting phases, children's concerns</li><li><strong>Life Transitions & Timing</strong> — Major life changes, relocation, role shifts</li><li><strong>Personal & Spiritual Growth</strong> — Inner patterns, belief shifts, spiritual realignment</li><li><strong>Karmic Patterns & Cycles</strong> — Repeating themes and long-term cycles</li><li><strong>Open Session</strong> — Questions across multiple areas or that don't fit a category</li></ul><strong>Session Length:</strong><ul><li>30-minute: One primary concern, urgent questions</li><li>60-minute: Up to three related themes, layered issues</li><li>90-minute: Multiple life areas, broader view</li></ul>If you're unsure, start with a 60-minute session or an Open Session.",
    category: "getting-started"
  },
  {
    question: "How much does a Vedic astrology consultation cost?",
    answer: "Vedic astrology consultations at I Read Space range from ₹1,200 to ₹4,500, depending on session length and format (audio or video).<br><br><ul><li><strong>30-minute session (Quick Clarity)</strong> — ₹1,200 (Audio) / ₹1,500 (Video). One primary concern using one chart.</li><li><strong>60-minute session (Deep Insight)</strong> — ₹2,400 (Audio) / ₹3,000 (Video). Up to three related themes using two charts.</li><li><strong>90-minute session (Holistic Guidance)</strong> — ₹3,600 (Audio) / ₹4,500 (Video). Multiple life areas and charts.</li></ul><strong>Session packages</strong><br>Three-session packages are available with savings of ₹300–₹900. Sessions do not expire.<br><br>Payment is required in advance. Rescheduling possible with 24 hours' notice.",
    category: "getting-started"
  },
  {
    question: "What details do I need for a Vedic astrology reading?",
    answer: "You need three essential details for a Vedic astrology reading:<br><br><strong>1. Date of birth</strong> — Your exact date of birth (day, month, year).<br><br><strong>2. Time and place of birth (if known)</strong> — On the booking form, indicate whether you know the exact birth time. If yes, enter the accurate time and place from reliable records. If no, only the date of birth is needed; the session will use Tarot, numerology, and partial astrological analysis where applicable.",
    category: "getting-started"
  },
  {
    question: "Who is a Vedic astrology consultation suitable for?",
    answer: "Vedic astrology consultations are suitable for anyone navigating major life transitions, recurring patterns, or high-stakes decisions where timing and preparation matter.<br><br>This is particularly relevant if you are:<ul><li>Navigating major transitions — career changes, relationships, relocations, business ventures</li><li>Facing recurring patterns you want to understand structurally</li><li>Making high-stakes decisions where timing carries real consequences</li><li>In leadership roles or managing significant professional responsibilities</li><li>Experiencing confusion, crisis, or stagnation</li><li>Dealing with health concerns, family dynamics, or relationship difficulties that keep repeating</li></ul>",
    category: "getting-started"
  },
  {
    question: "What happens in a Vedic astrology session?",
    answer: "A Vedic astrology consultation examines your birth chart, active planetary periods, and transits to identify life patterns, timing, and actionable clarity.<br><br>We begin by confirming your birth details and any specific questions you want to address. During the session, I share what the chart reveals — you're invited to ask questions, challenge interpretations, and engage actively.<br><br>The session concludes with clear takeaways: what patterns are active, what timing to be aware of, and what responses support your goals. You leave with actionable insights, not just information.",
    category: "getting-started"
  },
  {
    question: "How long is a Vedic astrology session?",
    answer: "Vedic astrology sessions at I Read Space are available in 30-minute, 60-minute, and 90-minute formats.<br><br><ul><li><strong>30-minute session (Quick Clarity)</strong> — One primary concern using one chart. Suitable for urgent questions.</li><li><strong>60-minute session (Deep Insight)</strong> — Up to three related themes using two charts. Most standard sessions.</li><li><strong>90-minute session (Holistic Guidance)</strong> — Multiple life areas and charts for a broader view.</li></ul>Sessions are structured but conversational, and you're encouraged to engage actively.",
    category: "getting-started"
  },
  {
    question: "Can Vedic astrology help with career decisions?",
    answer: "Yes, career consultations help you understand natural professional strengths, timing for career changes, and periods when effort yields results versus meets obstacles.<br><br>Vedic astrology can help you understand:<ul><li>Natural strengths and areas of resistance in your professional life</li><li>Timing for career changes, job transitions, or new opportunities</li><li>Whether your current direction aligns with your chart's natural momentum</li><li>When to push forward versus when to consolidate and wait</li></ul>This is particularly valuable if you're stuck despite effort, facing recurring career obstacles, or navigating high-stakes professional decisions.",
    category: "life-situation"
  },
  {
    question: "Can Vedic astrology help with relationship problems?",
    answer: "Yes, Vedic astrology can help with relationship problems by revealing emotional patterns, compatibility dynamics, and timing cycles that shape long-term relationship experiences.<br><br>Vedic astrology can help you understand:<ul><li>Emotional patterns that repeat across relationships</li><li>Compatibility dynamics and how two charts interact over time</li><li>Timing for commitment, marriage, or relationship transitions</li><li>Where friction is likely and whether it's manageable or destructive</li></ul>This is particularly valuable for recurring relationship dynamics, marriage timing questions, or high-stakes decisions about commitment.",
    category: "life-situation"
  },
  {
    question: "Can Vedic astrology help with health concerns?",
    answer: "Astrology does not diagnose or replace medical care. It can highlight tendencies and periods of vulnerability, allowing for timely intervention.<br><br>Vedic astrology can help you understand:<ul><li>Stress patterns that may manifest emotionally or physically</li><li>Periods of heightened physical or emotional vulnerability</li><li>Timing when self-care, rest, or medical attention may be important</li><li>Patterns suggesting when to be more cautious or prioritize wellness</li></ul>Used responsibly, astrology supports awareness and prevention — it does not replace medical advice.",
    category: "life-situation"
  },
  {
    question: "Can Vedic astrology help with financial decisions?",
    answer: "Yes, Vedic astrology can help with financial decisions by identifying risk periods, timing for investments, and long-term cycles affecting financial stability.<br><br>Vedic astrology can help you understand:<ul><li>Timing for financial decisions, investments, or major purchases</li><li>Risk periods when caution is especially important</li><li>Natural patterns around money, resources, and material stability</li><li>Long-term cycles affecting financial stability</li></ul>This is particularly valuable for recurring financial challenges, high-stakes decisions where timing matters, or clarity on when to invest versus save.",
    category: "life-situation"
  },
  {
    question: "Can Vedic astrology help with family issues?",
    answer: "Yes, Vedic astrology can help with family issues by revealing generational patterns, timing for family decisions, and dynamics around parenting, children, and responsibilities.<br><br>Vedic astrology can help you understand:<ul><li>Family dynamics and patterns that repeat across generations</li><li>Parenting phases and timing for family-related decisions</li><li>Concerns related to children's development or challenges</li><li>Family responsibilities and how to navigate them consciously</li></ul>",
    category: "life-situation"
  },
  {
    question: "Why am I stuck despite effort? Can astrology help?",
    answer: "Feeling stuck despite effort often indicates a timing or pattern issue visible in your Vedic astrology chart — planetary periods can create phases where progress is blocked regardless of strategy.<br><br>Vedic astrology can help you understand:<ul><li>Why effort isn't yielding results despite genuine work and planning</li><li>Timing cycles that affect when effort is effective versus when it meets obstacles</li><li>What phase you're in and how long it's likely to last</li><li>What responses support progress versus create more resistance</li></ul>Recognizing these cycles reveals when and how to respond differently.",
    category: "life-situation"
  },
  {
    question: "What is Vedic astrology?",
    answer: "Vedic astrology (Jyotish) is an ancient Indian system that uses your birth chart — calculated from your exact date, time, and place of birth — to reveal life patterns, timing cycles, and karmic themes. Unlike Western astrology, it uses the sidereal zodiac based on fixed star positions.<br><br>The system maps life into planetary periods (dashas) that determine which themes are active at any given time. This makes Vedic astrology particularly strong in timing and prediction — it's used for understanding recurring patterns, making better-timed decisions, and navigating transitions.",
    category: "understanding"
  },
  {
    question: "What is a dasha in Vedic astrology?",
    answer: "A dasha is a planetary period that determines which planet governs a specific phase of your life. The Vimshottari Dasha system divides life into major periods of 6 to 20 years each, with sub-periods within them.<br><br>Each dasha activates themes associated with its ruling planet — a Jupiter dasha may bring expansion and opportunity, while a Saturn dasha may emphasize discipline and restructuring. Understanding your active dasha explains why certain themes dominate your current experience and when significant shifts are likely.",
    category: "understanding"
  },
  {
    question: "How is Vedic astrology different from Western astrology?",
    answer: "Vedic astrology uses the sidereal zodiac (fixed star positions) while Western astrology uses the tropical zodiac (seasons), meaning your Vedic sun sign is often different from your Western one.<br><br>Vedic astrology examines long-term karmic patterns and life timing through planetary periods (dashas), while Western astrology focuses more on psychological traits and current transits. The deeper difference is philosophical: Western astrology asks \"What is happening now?\" while Vedic astrology asks \"Why does this keep happening?\"",
    category: "understanding"
  },
  {
    question: "Is Vedic astrology compatible with my religion?",
    answer: "Yes. Vedic astrology emerged from Hindu philosophical traditions but functions as a technical system, not a religious practice. You don't need to adopt Hindu beliefs, worship deities, or change your worldview.<br><br>Many clients practice Christianity, Islam, Buddhism, or hold secular perspectives. The consultation focuses on observable patterns in your life, not spiritual conversion. The core work — understanding patterns and making conscious choices — stands independent of any belief system.",
    category: "understanding"
  },
  {
    question: "Are Vedic astrology remedies religious?",
    answer: "No, Vedic astrology remedies are not inherently religious. While some (like mantras) have origins in spiritual traditions, they function as practical tools for awareness, discipline, and alignment.<br><br>Remedies may include:<ul><li>Mantras (sound-based practices)</li><li>Gemstones (for specific planetary influences)</li><li>Charitable acts (balance and giving back)</li><li>Timing adjustments (knowing when to act or wait)</li><li>Behavioral modifications (conscious changes in approach)</li></ul>These are suggested as practical supports, not religious requirements.",
    category: "understanding"
  },
  {
    question: "How many Vedic astrology sessions do I need?",
    answer: "There is no fixed number of sessions required. Many people find one session sufficient for immediate clarity on active patterns, timing, and responses.<br><br>Others return periodically when:<ul><li>Major transitions occur (career changes, relocations, relationship decisions)</li><li>New patterns activate in their chart</li><li>They need to understand how longer cycles are unfolding</li></ul>Follow-up timing is discussed at the end of each session. The goal is clarity that supports better decisions, not dependency.",
    category: "understanding"
  },
  {
    question: "What can I expect after my first session?",
    answer: "After your first consultation, you'll have a clearer understanding of the patterns active in your life, the timing cycles you're navigating, and how to respond more consciously. Many people experience immediate relief from confusion, as patterns they've sensed but couldn't name become visible.<br><br>You'll receive specific insights about current planetary periods, themes likely to surface, and when significant shifts may occur. Follow-up timing is discussed based on your chart's cycles.",
    category: "practical"
  },
  {
    question: "What do I need before booking?",
    answer: "You need your date of birth and place of birth (city and state/country). If you know your exact birth time, provide it from reliable records. If not, answer <strong>No</strong> on the booking form when asked whether you know your exact birth time.<br><br>Also consider what questions or life areas you want to explore. Having 2-3 primary concerns helps tailor the session. No prior knowledge of astrology is needed.",
    category: "practical"
  },
  {
    question: "What if my birth time is unknown?",
    answer: "If your birth time is not known with certainty, answer <strong>No</strong> when asked whether you know your exact birth time on the booking form. Do not enter a guess or estimate. Without an accurate time, full chart-based techniques are limited. Tarot and numerology are used alongside the astrological information available from your date and place of birth.",
    category: "practical"
  },
  {
    question: "How often should I consult a Vedic astrologer?",
    answer: "There is no fixed frequency. Most people consult during major transitions — career changes, relocations, relationship decisions, health crises. Others return periodically (annually or every few years) to understand longer cycles.<br><br>Follow-up timing is discussed at the end of each session based on your chart and life context.",
    category: "practical"
  },
  {
    question: "Browse All FAQs",
    answer: "For a complete list of all frequently asked questions, please visit our <a href='faq.html' target='_blank'>FAQ page</a>. It covers consultations, Vedic astrology concepts, pricing, remedies, and more.",
    category: "more-help"
  },
  {
    question: "Contact Us Directly",
    answer: "If you have specific questions or need personalized assistance, please contact us directly:<br><br><strong>WhatsApp:</strong> <a href='https://wa.me/919217679635' target='_blank' rel='noopener noreferrer'>+91 9217679635</a><br><br><strong>Email:</strong> <a href='mailto:consult@ireadspace.com'>consult@ireadspace.com</a><br><br>We'll be happy to help you.",
    category: "more-help"
  }
];

// Category structure with shortened labels
const FAQ_CATEGORIES = {
  "about": {
    title: "About I Read Space",
    shortTitle: "About",
    options: [
      { label: "What is I Read Space?", question: "What is I Read Space?" },
      { label: "Who is Saumyaa?", question: "Who is Saumyaa S Singh?" }
    ]
  },
  "getting-started": {
    title: "Getting Started",
    shortTitle: "Getting Started",
    options: [
      { label: "Book Consultation", question: "How do I book a Vedic astrology consultation?" },
      { label: "Choose Session", question: "Which Vedic astrology session should I choose?" },
      { label: "Pricing", question: "How much does a Vedic astrology consultation cost?" },
      { label: "Birth Details", question: "What details do I need for a Vedic astrology reading?" },
      { label: "Suitable For", question: "Who is a Vedic astrology consultation suitable for?" },
      { label: "Session Format", question: "What happens in a Vedic astrology session?" },
      { label: "Session Length", question: "How long is a Vedic astrology session?" }
    ]
  },
  "life-situation": {
    title: "My Life Situation",
    shortTitle: "Life Situation",
    options: [
      { label: "Career", question: "Can Vedic astrology help with career decisions?" },
      { label: "Relationships", question: "Can Vedic astrology help with relationship problems?" },
      { label: "Health", question: "Can Vedic astrology help with health concerns?" },
      { label: "Finances", question: "Can Vedic astrology help with financial decisions?" },
      { label: "Family", question: "Can Vedic astrology help with family issues?" },
      { label: "Stuck Despite Effort", question: "Why am I stuck despite effort? Can astrology help?" }
    ]
  },
  "understanding": {
    title: "Understanding Vedic Astrology",
    shortTitle: "Understanding",
    options: [
      { label: "What is Vedic Astrology?", question: "What is Vedic astrology?" },
      { label: "What is a Dasha?", question: "What is a dasha in Vedic astrology?" },
      { label: "Vedic vs Western", question: "How is Vedic astrology different from Western astrology?" },
      { label: "Religious?", question: "Is Vedic astrology compatible with my religion?" },
      { label: "Remedies Religious?", question: "Are Vedic astrology remedies religious?" },
      { label: "How Many Sessions", question: "How many Vedic astrology sessions do I need?" }
    ]
  },
  "practical": {
    title: "Practical Concerns",
    shortTitle: "Practical",
    options: [
      { label: "After Session", question: "What can I expect after my first session?" },
      { label: "Before Booking", question: "What do I need before booking?" },
      { label: "Unknown Birth Time", question: "What if my birth time is unknown?" },
      { label: "Frequency", question: "How often should I consult a Vedic astrologer?" }
    ]
  },
  "more-help": {
    title: "Still Have Questions?",
    shortTitle: "More Help",
    options: [
      { label: "Browse FAQs", question: "Browse All FAQs" },
      { label: "Contact", question: "Contact Us Directly" }
    ]
  }
};

async function applyRegionalFAQPricing() {
  const urlRegion = new URLSearchParams(window.location.search).get('region');
  const region = (window.IRSBooking && window.IRSBooking.detectRegion)
    ? await window.IRSBooking.detectRegion(urlRegion)
    : await detectFaqRegionFallback(urlRegion);

  const copy = buildRegionPricingCopy(region);
  FAQ_DATA.forEach(function(item) {
    if (item.question === 'How do I book a Vedic astrology consultation?') {
      item.answer = copy.book;
    }
    if (item.question === 'How much does a Vedic astrology consultation cost?') {
      item.answer = copy.cost;
    }
  });
}

function initWhatsAppFloatingButton() {
  if (document.getElementById('whatsapp-floating-button')) return;

  const faqButton = document.getElementById('faq-chat-button');
  if (!faqButton) return;

  const whatsappButton = document.createElement('a');
  whatsappButton.id = 'whatsapp-floating-button';
  whatsappButton.className = 'whatsapp-floating-button';
  whatsappButton.href = 'https://wa.me/919217679635';
  whatsappButton.target = '_blank';
  whatsappButton.rel = 'noopener noreferrer';
  whatsappButton.setAttribute('aria-label', 'Chat on WhatsApp');
  whatsappButton.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/>
    </svg>
  `;

  faqButton.insertAdjacentElement('beforebegin', whatsappButton);
}

// Initialize FAQ Chat Widget
function initFAQChat() {
  const chatButton = document.getElementById('faq-chat-button');
  const chatPanel = document.getElementById('faq-chat-panel');
  const chatClose = document.getElementById('faq-chat-close');
  const chatContent = document.getElementById('faq-chat-content');

  if (!chatButton || !chatPanel) return;

  let isOpen = false;

  // Toggle chat panel
  function toggleChat() {
    isOpen = !isOpen;
    chatPanel.classList.toggle('active', isOpen);
    chatButton.classList.toggle('active', isOpen);
    
    if (isOpen) {
      renderCategories();
    }
  }

  // Render categories
  function renderCategories() {
    chatContent.innerHTML = '';
    
    Object.keys(FAQ_CATEGORIES).forEach(categoryKey => {
      const category = FAQ_CATEGORIES[categoryKey];
      const categoryItem = document.createElement('div');
      categoryItem.className = 'faq-category-item';
      
      const categoryHeader = document.createElement('button');
      categoryHeader.className = 'faq-category-header';
      categoryHeader.innerHTML = `
        <span>${category.title}</span>
        <span class="faq-category-arrow">▼</span>
      `;
      
      const categoryOptions = document.createElement('div');
      categoryOptions.className = 'faq-category-options';
      
      // Container for answer (shared across all options in category)
      const answerContainer = document.createElement('div');
      answerContainer.className = 'faq-answer-container';
      
      category.options.forEach(option => {
        const optionButton = document.createElement('button');
        optionButton.className = 'faq-option-button';
        optionButton.textContent = option.label;
        
        optionButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = answerContainer.classList.contains('active') && 
                         answerContainer.dataset.question === option.question;
          
          // Close answer if clicking the same button
          if (isOpen) {
            answerContainer.classList.remove('active');
            answerContainer.dataset.question = '';
          } else {
            // On faq.html, use the page's own FAQ answer for "Birth Details" so one source of truth
            let answerHtml = null;
            if (option.question === "What details do I need for a Vedic astrology reading?") {
              const pageAnswer = document.getElementById('faq-answer-faq-6');
              if (pageAnswer && pageAnswer.innerHTML && pageAnswer.innerHTML.trim()) {
                answerHtml = pageAnswer.innerHTML.trim();
              }
            }
            if (option.question === "How much does a Vedic astrology consultation cost?") {
              const indianPricing = document.getElementById('faq-pricing-indian');
              const internationalPricing = document.getElementById('faq-pricing-international');
              const visiblePricing = [indianPricing, internationalPricing].find(function(el) {
                return el && el.innerHTML.trim() && window.getComputedStyle(el).display !== 'none';
              });
              if (visiblePricing) {
                answerHtml = visiblePricing.innerHTML.trim();
              }
            }
            if (answerHtml == null) {
              const faq = FAQ_DATA.find(f => f.question === option.question);
              answerHtml = faq ? faq.answer : '';
            }
            if (answerHtml) {
              answerContainer.innerHTML = `<div class="faq-answer-text">${answerHtml}</div>`;
              answerContainer.dataset.question = option.question;
              answerContainer.classList.add('active');
            }
          }
        });
        
        categoryOptions.appendChild(optionButton);
      });
      
      // Add answer container at the end
      categoryOptions.appendChild(answerContainer);
      
      categoryHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = categoryItem.classList.contains('active');
        
        // Close all other categories
        chatContent.querySelectorAll('.faq-category-item').forEach(item => {
          if (item !== categoryItem) {
            item.classList.remove('active');
          }
        });
        
        // Toggle current category
        categoryItem.classList.toggle('active', !isOpen);
      });
      
      categoryItem.appendChild(categoryHeader);
      categoryItem.appendChild(categoryOptions);
      chatContent.appendChild(categoryItem);
    });
  }

  // Event listeners
  chatButton.addEventListener('click', toggleChat);
  chatClose.addEventListener('click', toggleChat);
  
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (isOpen && 
        !chatPanel.contains(e.target) && 
        !chatButton.contains(e.target)) {
      toggleChat();
    }
  });
}

// Hide floating button while it overlaps the hero CTA
function initFAQButtonVisibility() {
  const btn = document.getElementById('faq-chat-button');
  const whatsappBtn = document.getElementById('whatsapp-floating-button');
  const heroCta = document.querySelector('.hero-cta');
  if (!btn || !heroCta) return;

  function update() {
    const ctaRect = heroCta.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const overlaps = ctaRect.bottom > btnRect.top && ctaRect.top < btnRect.bottom &&
                     ctaRect.right > btnRect.left && ctaRect.left < btnRect.right;
    [btn, whatsappBtn].forEach(button => {
      if (!button) return;
      button.style.opacity = overlaps ? '0' : '';
      button.style.pointerEvents = overlaps ? 'none' : '';
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

// Initialize when DOM is ready
async function initFAQWidgets() {
  await applyRegionalFAQPricing();
  initWhatsAppFloatingButton();
  initFAQChat();
  initFAQButtonVisibility();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFAQWidgets);
} else {
  initFAQWidgets();
}

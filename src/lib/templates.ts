import type { BAG_LISTS, ProfileData, Task } from "./schemas";
import { uid } from "./utils";

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Self-contained SVG pack illustration (as a data URI) used as the default image for any diaper size that has no
 * verified retailer photo. It needs no network, so it can never render as a broken link.
 */
export function placeholderImage(brand: string, size: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="${esc(brand)} ${esc(size)}">`
    + `<rect width="200" height="200" fill="#fff"/>`
    + `<rect x="34" y="22" width="132" height="156" rx="16" fill="${color}"/>`
    + `<rect x="34" y="22" width="132" height="34" rx="16" fill="#000" opacity=".12"/>`
    + `<path d="M62 84h76v14c0 24-16 36-38 36S62 122 62 98z" fill="#fff"/><rect x="62" y="84" width="76" height="10" fill="#fff" opacity=".7"/>`
    + `<circle cx="100" cy="112" r="7" fill="${color}"/>`
    + `<text x="100" y="42" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">${esc(brand.length > 18 ? brand.replace("Clicks ", "") : brand)}</text>`
    + `<text x="100" y="160" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#fff" text-anchor="middle">${esc(size.length > 16 ? size.split(" / ")[1] ?? size : size)}</text>`
    + `<text x="100" y="172" font-family="Arial,sans-serif" font-size="8" fill="#fff" opacity=".85" text-anchor="middle">pack image placeholder</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Seed content for a new profile. Everything is week-relative — no calendar dates are stored. */

type TaskSeed = Pick<Task, "week" | "category" | "title" | "urgency">;
const T = (week: number, category: Task["category"], title: string, urgency: Task["urgency"]): TaskSeed => ({ week, category, title, urgency });

const TASKS: TaskSeed[] = [
  T(4, "Prenatal", "Take a pregnancy test & confirm with a doctor", "High"), T(5, "Prenatal", "Start prenatal vitamins / folic acid", "High"),
  T(6, "Doctor", "Book first prenatal appointment", "High"), T(6, "Finance", "Review medical aid / insurance maternity benefits", "High"),
  T(8, "Doctor", "First ultrasound (dating scan)", "High"), T(8, "Exercise", "Start a gentle daily walking routine", "Low"),
  T(10, "Prenatal", "Decide on NIPT / first-trimester screening", "Medium"), T(12, "Doctor", "12-week scan & nuchal translucency", "High"),
  T(12, "Finance", "Draft a baby budget", "Medium"), T(13, "Prenatal", "Plan how/when to share the news", "Low"),
  T(14, "Exercise", "Begin prenatal yoga or swimming", "Low"), T(16, "Doctor", "Routine check-up & bloods", "Medium"),
  T(18, "Prenatal", "Book anatomy scan", "High"), T(20, "Doctor", "20-week anatomy scan", "High"),
  T(20, "Finance", "Research maternity leave policy / UIF", "High"), T(22, "Prenatal", "Start baby registry", "Medium"),
  T(24, "Doctor", "Glucose tolerance test", "High"), T(24, "Exercise", "Pelvic-floor exercises daily", "Medium"),
  T(26, "Prenatal", "Book antenatal classes", "Medium"), T(28, "Doctor", "28-week check-up (Rh / anti-D if needed)", "High"),
  T(28, "Finance", "Order big-ticket items (pram, car seat, cot)", "Medium"), T(30, "Prenatal", "Tour the hospital / birthing facility", "Medium"),
  T(32, "Prenatal", "Draft your birth plan", "Medium"), T(32, "Finance", "Pre-register at the hospital", "High"),
  T(34, "Prenatal", "Pack the hospital bag", "High"), T(34, "Prenatal", "Install & check the car seat", "High"),
  T(35, "Doctor", "Group B strep test", "High"), T(36, "Doctor", "Weekly check-ups begin", "High"),
  T(36, "Prenatal", "Set up nursery & wash baby clothes", "Medium"), T(37, "Prenatal", "Stock freezer meals; finalise postpartum plan", "Medium"),
  T(38, "Finance", "Confirm leave dates & handover at work", "High"), T(39, "Prenatal", "Rest; keep phone charged; know your route to hospital", "Low"),
  T(40, "Doctor", "Due-date check-in", "High"),
];

const PROVIDERS = [
  { role: "OB/GYN", name: "Dr. (your OB/GYN)" }, { role: "Midwife", name: "" }, { role: "Sonographer", name: "" },
  { role: "Hospital", name: "(Birthing hospital)" }, { role: "Paediatrician", name: "" }, { role: "Doula", name: "" },
] as const;

const APPOINTMENTS: [string, number, boolean][] = [
  ["Dating scan", 8, true], ["12-week scan (NT)", 12, true], ["20-week anatomy scan", 20, true], ["Glucose tolerance test", 24, false],
  ["28-week check-up", 28, false], ["32-week growth scan", 32, true], ["36-week check-up", 36, false], ["Due-date check-in", 40, false],
];

const BAG: Record<(typeof BAG_LISTS)[number], string[]> = {
  "bag-parent": ["ID & medical aid card", "Birth plan & hospital forms", "Comfortable gown / PJs", "Slippers & socks", "Nursing bras", "Maternity pads", "Toiletries & lip balm", "Phone charger (long cable)", "Going-home outfit", "Snacks & water bottle", "Pillow from home"],
  "bag-partner": ["ID & contact list", "Change of clothes", "Toiletries", "Phone charger / power bank", "Snacks & drinks", "Camera", "Cash / coins for parking", "Pillow / blanket"],
  "bag-baby": ["Going-home outfit", "Newborn nappies", "Wipes", "Vests / sleepsuits", "Hat & mittens", "Swaddle blankets", "Car seat (installed)", "Baby blanket"],
};

export const NURSERY_SEED: [string, string][] = [
  ["Crib / cot", "Order & assemble by week 34"], ["Mattress & fitted sheets", "Wash sheets before use"], ["Changing table", "Stock with nappies & wipes"],
  ["Glider / feeding chair", "Test comfort in store"], ["Wall shelves", "Hang & secure to the wall"], ["Curtains / blackout blinds", "Measure the window"],
  ["Baby monitor", "Set up & test range"], ["Mobile", "Hang out of baby's reach"], ["Night light", ""], ["Chest of drawers / wardrobe", "Sort clothes by size"],
  ["Nappy bin", ""], ["Rug", ""], ["Storage baskets", ""], ["Humidifier / fan", ""],
];

export const PALETTE_SEED: [string, string][] = [["Persian Green", "#00A693"], ["Warm Oatmeal", "#D7CFC2"], ["Honey Oak", "#C5A57D"], ["Brushed Brass", "#B5996D"]];

const BUDGET: [string, string, number][] = [
  ["Medical", "Prenatal care & scans", 8000], ["Medical", "Hospital / delivery deposit", 15000], ["Medical", "Antenatal classes", 1500],
  ["Nursery", "Cot & mattress", 3500], ["Nursery", "Change table", 1800], ["Nursery", "Monitor", 1600],
  ["Gear", "Pram / travel system", 6500], ["Gear", "Car seat", 3200], ["Gear", "Baby carrier", 1400],
  ["Feeding", "Bottles & sterilizer", 900], ["Feeding", "Breast pump", 2800],
  ["Clothing", "Newborn clothing bundle", 1200], ["Care", "Nappies (first 3 months)", 2400], ["Care", "Bath & grooming kit", 650],
];

const NAME_SEED: [string, string, string, [number, number]][] = [
  ["Aria", "Melody / air", "Italian / Hebrew", [8, 7]], ["Noah", "Rest, comfort", "Hebrew", [6, 8]],
  ["Thandi", "Beloved", "Zulu / Xhosa", [9, 9]], ["Liam", "Resolute protector", "Irish", [5, 6]],
];
const NAME_RULES = ["Easy to spell", "Easy to pronounce", "No awkward nicknames"];

const ADVICE: Record<"tips" | "hospital" | "postpartum", string[]> = {
  tips: ["Keep a running list of questions for each appointment.", "Accept help — and be specific when you ask for it.", "Take a bump photo on the same day each week."],
  hospital: ["Ask which entrance to use after hours.", "Confirm visiting hours and partner policy.", "Find out what the hospital supplies vs. what to bring."],
  postpartum: ["Plan for sleep in shifts with your partner.", "Line up a lactation consultant before the birth.", "Stock easy-to-grab snacks within reach of the feeding chair."],
};

const POSTPARTUM: [number, string][] = [
  [0, "Birth & skin-to-skin"], [3, "Home visit / early discharge check"], [7, "Newborn weight check"], [14, "Midwife / paediatrician review"],
  [42, "6-week postpartum check-up (parent + baby)"], [84, "Return-to-work / childcare plan review"],
];

export const PHOTO_QUESTIONS = [
  "Do you have experience photographing pets (and including our pets in the shoot)?", "Can we do outfit changes — how many, and do you provide a wardrobe?",
  "How long is the session and is there a time limit on edits?", "How many edited images are included, and how soon are they delivered?",
  "Do we get full-resolution digital files and a print release?", "What is the deposit, and what is your cancellation / rescheduling policy?",
  "Do you shoot in studio, on location, or at home — any travel fees?", "Do you have newborn safety training (posing, hygiene, assistants)?",
  "What happens if baby arrives early or late for a newborn booking?", "Can partners, siblings and grandparents be included?",
  "Are prints, albums or canvases available, and at what price?", "Do you offer a package (maternity + newborn + milestone) discount?",
];

/** Weekly highlights: baby size by week (4–40) and milestone notes (the last note at or before the week applies). */
export const SIZES: Record<number, [string, string]> = {
  4: ["poppy seed", "🌱"], 5: ["sesame seed", "🌱"], 6: ["lentil", "🌱"], 7: ["blueberry", "🫐"], 8: ["raspberry", "🍓"], 9: ["cherry", "🍒"], 10: ["strawberry", "🍓"],
  11: ["fig", "🫒"], 12: ["lime", "🍋"], 13: ["lemon", "🍋"], 14: ["peach", "🍑"], 15: ["apple", "🍎"], 16: ["avocado", "🥑"], 17: ["pomegranate", "🍎"],
  18: ["sweet potato", "🍠"], 19: ["mango", "🥭"], 20: ["banana", "🍌"], 21: ["carrot", "🥕"], 22: ["papaya", "🥭"], 23: ["grapefruit", "🍊"], 24: ["corn cob", "🌽"],
  25: ["swede", "🥔"], 26: ["lettuce", "🥬"], 27: ["cauliflower", "🥦"], 28: ["aubergine", "🍆"], 29: ["butternut squash", "🎃"], 30: ["cabbage", "🥬"],
  31: ["coconut", "🥥"], 32: ["jicama", "🥔"], 33: ["pineapple", "🍍"], 34: ["cantaloupe", "🍈"], 35: ["honeydew melon", "🍈"], 36: ["head of romaine", "🥬"],
  37: ["bunch of chard", "🥬"], 38: ["leek", "🥬"], 39: ["mini watermelon", "🍉"], 40: ["small pumpkin", "🎃"],
};
const NOTES: Record<number, string> = {
  4: "Implantation is complete and the placenta is beginning to form.", 6: "A heartbeat may be visible on ultrasound.", 8: "Tiny fingers and toes are forming.",
  12: "Reflexes are developing; the nuchal scan window is here.", 14: "Second trimester begins — energy often returns.", 16: "You may start to feel first flutters soon.",
  20: "Halfway! The anatomy scan checks growth and organs.", 24: "Baby can hear sounds; viability milestone.", 28: "Third trimester begins. Eyes open and blink.",
  32: "Baby is gaining weight quickly and practising breathing.", 34: "Lungs are maturing — time to pack the hospital bag.", 36: "Baby is likely head-down. Weekly check-ups begin.",
  37: "Early term — baby is considered ready from here.", 40: "Due date! Only about 5% of babies arrive exactly on the day.",
};

export function weeklyHighlight(week: number) {
  const w = Math.max(4, Math.min(40, week));
  const [size, emoji] = SIZES[w];
  let note = "";
  for (let i = w; i >= 4; i--) if (NOTES[i]) { note = NOTES[i]; break; }
  return { week, size, emoji, note };
}

/** Builds a fully-seeded ProfileData for a brand-new profile. */
export function seedProfileData(): ProfileData {
  const nameRules = NAME_RULES.map((label) => ({ id: uid("r_"), label }));
  return {
    tasks: TASKS.map((t) => ({ ...t, id: uid("t_"), done: false })),
    providers: PROVIDERS.map((p) => ({ ...p, id: uid("v_"), phone: "", email: "", address: "" })),
    appointments: APPOINTMENTS.map(([title, week, isScan]) => ({ id: uid("a_"), title, week, dateOverride: "", providerId: "", isScan, done: false, notes: "", fileLink: "" })),
    checklists: (Object.entries(BAG) as [keyof typeof BAG, string[]][]).flatMap(([list, items]) => items.map((text) => ({ id: uid("c_"), list, text, done: false }))),
    nursery: NURSERY_SEED.map(([text, todo]) => ({ id: uid("u_"), text, todo, status: "To buy" as const, done: false, link: "" })),
    palette: PALETTE_SEED.map(([name, hex]) => ({ id: uid("k_"), name, hex })),
    vision: [],
    budget: BUDGET.map(([category, item, estimated]) => ({ id: uid("b_"), category, item, estimated, actual: null, status: "Planned" as const, link: "" })),
    nameRules,
    names: NAME_SEED.map(([name, meaning, origin, ratings], i) => ({
      id: uid("m_"), name, meaning, origin, ratings, notes: "",
      checks: Object.fromEntries(nameRules.map((r, j) => [r.id, (i + j) % 3 !== 0])),
    })),
    advice: (Object.entries(ADVICE) as [keyof typeof ADVICE, string[]][]).flatMap(([section, arr]) => arr.map((text) => ({ id: uid("n_"), section, text }))),
    postpartum: POSTPARTUM.map(([offsetDays, title]) => ({ id: uid("p_"), offsetDays, title, done: false })),
    photographers: [], photoAsked: {}, daycares: [],
  };
}

import type { PrepGroup } from './types';

/** Baby size by week (4–40) and milestone notes (the latest note at or before the week applies). */
export const SIZES: Record<number, [string, string]> = {
  4: ['poppy seed', '🌱'], 5: ['sesame seed', '🌱'], 6: ['lentil', '🌱'], 7: ['blueberry', '🫐'], 8: ['raspberry', '🍓'], 9: ['cherry', '🍒'], 10: ['strawberry', '🍓'],
  11: ['fig', '🫒'], 12: ['lime', '🍋'], 13: ['lemon', '🍋'], 14: ['peach', '🍑'], 15: ['apple', '🍎'], 16: ['avocado', '🥑'], 17: ['pomegranate', '🍎'],
  18: ['sweet potato', '🍠'], 19: ['mango', '🥭'], 20: ['banana', '🍌'], 21: ['carrot', '🥕'], 22: ['papaya', '🥭'], 23: ['grapefruit', '🍊'], 24: ['corn cob', '🌽'],
  25: ['swede', '🥔'], 26: ['lettuce', '🥬'], 27: ['cauliflower', '🥦'], 28: ['aubergine', '🍆'], 29: ['butternut squash', '🎃'], 30: ['cabbage', '🥬'],
  31: ['coconut', '🥥'], 32: ['jicama', '🥔'], 33: ['pineapple', '🍍'], 34: ['cantaloupe', '🍈'], 35: ['honeydew melon', '🍈'], 36: ['head of romaine', '🥬'],
  37: ['bunch of chard', '🥬'], 38: ['leek', '🥬'], 39: ['mini watermelon', '🍉'], 40: ['small pumpkin', '🎃'],
};
const NOTES: Record<number, string> = {
  4: 'Implantation is complete and the placenta is beginning to form.', 6: 'A heartbeat may be visible on ultrasound.', 8: 'Tiny fingers and toes are forming.',
  12: 'Reflexes are developing; the nuchal scan window is here.', 14: 'Second trimester begins — energy often returns.', 16: 'You may start to feel first flutters soon.',
  20: 'Halfway! The anatomy scan checks growth and organs.', 24: 'Baby can hear sounds; viability milestone.', 28: 'Third trimester begins. Eyes open and blink — start counting kicks.',
  32: 'Baby is gaining weight quickly and practising breathing.', 34: 'Lungs are maturing — time to pack the hospital bag.', 36: 'Baby is likely head-down. Weekly check-ups begin.',
  37: 'Early term — baby is considered ready from here.', 40: 'Due date! Only about 5% of babies arrive exactly on the day.',
};
export function weekInfo(week: number) {
  const w = Math.max(4, Math.min(40, week)); const [size, emoji] = SIZES[w];
  let note = ''; for (let i = w; i >= 4; i--) if (NOTES[i]) { note = NOTES[i]; break; }
  return { week, size, emoji, note };
}

/** Things to do each week. `key` is stable so a done-flag survives edits to the wording. */
export interface WeekTask { key: string; week: number; title: string; cat: 'Prenatal' | 'Finance' | 'Doctor' | 'Exercise' }
const t = (week: number, cat: WeekTask['cat'], title: string): WeekTask => ({ key: `w${week}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32)}`, week, title, cat });
export const WEEK_TASKS: WeekTask[] = [
  t(4, 'Prenatal', 'Take a pregnancy test & confirm with a doctor'), t(5, 'Prenatal', 'Start prenatal vitamins / folic acid'),
  t(6, 'Doctor', 'Book first prenatal appointment'), t(6, 'Finance', 'Review medical aid maternity benefits'),
  t(8, 'Doctor', 'First ultrasound (dating scan)'), t(8, 'Exercise', 'Start a gentle daily walking routine'),
  t(10, 'Prenatal', 'Decide on NIPT / first-trimester screening'), t(12, 'Doctor', '12-week scan & nuchal translucency'),
  t(12, 'Finance', 'Draft a baby budget'), t(14, 'Exercise', 'Begin prenatal yoga or swimming'), t(16, 'Doctor', 'Routine check-up & bloods'),
  t(18, 'Prenatal', 'Book anatomy scan'), t(20, 'Doctor', '20-week anatomy scan'), t(20, 'Finance', 'Research maternity leave / UIF'),
  t(22, 'Prenatal', 'Start baby registry'), t(24, 'Doctor', 'Glucose tolerance test'), t(24, 'Exercise', 'Pelvic-floor exercises daily'),
  t(26, 'Prenatal', 'Book antenatal classes'), t(28, 'Doctor', '28-week check-up (Rh / anti-D if needed)'), t(28, 'Prenatal', 'Start daily kick counting'),
  t(28, 'Finance', 'Order big-ticket items (pram, car seat, cot)'), t(30, 'Prenatal', 'Tour the hospital / birthing facility'),
  t(32, 'Prenatal', 'Draft your birth plan'), t(32, 'Finance', 'Pre-register at the hospital'),
  t(34, 'Prenatal', 'Pack the hospital bag'), t(34, 'Prenatal', 'Install & check the car seat'), t(35, 'Doctor', 'Group B strep test'),
  t(36, 'Doctor', 'Weekly check-ups begin'), t(36, 'Prenatal', 'Set up nursery & wash baby clothes'),
  t(37, 'Prenatal', 'Learn the 5-1-1 contraction rule; stock freezer meals'), t(38, 'Finance', 'Confirm leave dates & handover at work'),
  t(39, 'Prenatal', 'Rest; keep phone charged; know your route to hospital'), t(40, 'Doctor', 'Due-date check-in'),
];

export const PREP_GROUPS: { id: PrepGroup; label: string; icon: string; week: number }[] = [
  { id: 'bag-parent', label: 'Hospital bag — Pregnant parent', icon: '🤰', week: 34 },
  { id: 'bag-partner', label: 'Hospital bag — Partner', icon: '🧑', week: 34 },
  { id: 'bag-baby', label: 'Hospital bag — Baby', icon: '🍼', week: 34 },
  { id: 'admin', label: 'Admin & paperwork', icon: '📋', week: 32 },
];
export const PREP_SEED: Record<PrepGroup, string[]> = {
  'bag-parent': ['ID & medical aid card', 'Birth plan & hospital forms', 'Comfortable gown / PJs', 'Slippers & socks', 'Nursing bras', 'Maternity pads', 'Toiletries & lip balm', 'Phone charger (long cable)', 'Going-home outfit', 'Snacks & water bottle', 'Pillow from home'],
  'bag-partner': ['ID & contact list', 'Change of clothes', 'Toiletries', 'Phone charger / power bank', 'Snacks & drinks', 'Camera', 'Cash / coins for parking', 'Pillow / blanket'],
  'bag-baby': ['Going-home outfit', 'Newborn nappies', 'Wipes', 'Vests / sleepsuits', 'Hat & mittens', 'Swaddle blankets', 'Car seat (installed)', 'Baby blanket'],
  nursery: [],
  admin: ['Pre-register at the hospital', 'Confirm medical aid maternity cover', 'Choose a paediatrician', 'Plan maternity / paternity leave', 'Write a birth plan', 'Arrange who looks after pets / older children'],
};

export const SYMPTOM_KINDS = ['Nausea', 'Fatigue', 'Headache', 'Back pain', 'Cramping', 'Heartburn', 'Swelling', 'Braxton Hicks', 'Mood swings', 'Dizziness', 'Bleeding / spotting', 'Other'];
export const SEVERITY = ['', 'Mild', 'Moderate', 'Severe'];

/* ---------- seeds for the planner modules ---------- */
export const BUDGET_CATS = ['Medical', 'Hospital', 'Nursery', 'Gear', 'Feeding', 'Clothing', 'Newborn care', 'Childcare', 'Other'];
export const BUDGET_SEED: [string, string, number][] = [
  ['Medical', 'Prenatal care & scans', 8000], ['Hospital', 'Hospital / delivery deposit', 15000], ['Medical', 'Antenatal classes', 1500],
  ['Nursery', 'Cot & mattress', 3500], ['Nursery', 'Changing table', 1800], ['Nursery', 'Baby monitor', 1600],
  ['Gear', 'Pram / travel system', 6500], ['Gear', 'Car seat', 3200], ['Gear', 'Baby carrier', 1400],
  ['Feeding', 'Bottles & sterilizer', 900], ['Feeding', 'Breast pump', 2800],
  ['Clothing', 'Newborn clothing bundle', 1200], ['Newborn care', 'Nappies (first 3 months)', 2400], ['Newborn care', 'Bath & grooming kit', 650],
];
export const NURSERY_STATUSES = ['To buy', 'Ordered', 'Delivered', 'Assembled', 'Set up'] as const;
export const NURSERY_SEED: [string, string][] = [
  ['Crib / cot', 'Order & assemble by week 34'], ['Mattress & fitted sheets', 'Wash sheets before use'], ['Changing table', 'Stock with nappies & wipes'],
  ['Glider / feeding chair', 'Test comfort in store'], ['Wall shelves', 'Hang & secure to the wall'], ['Curtains / blackout blinds', 'Measure the window'],
  ['Baby monitor', 'Set up & test range'], ['Mobile', "Hang out of baby's reach"], ['Night light', ''], ['Chest of drawers / wardrobe', 'Sort clothes by size'],
  ['Nappy bin', ''], ['Rug', ''], ['Storage baskets', ''], ['Humidifier / fan', ''],
];
export const SWATCHES: [string, string][] = [['Persian Green', '#00A693'], ['Warm Oatmeal', '#D7CFC2'], ['Honey Oak', '#C5A57D'], ['Brushed Brass', '#B5996D'], ['Soft white', '#F4F1EC'], ['Sage', '#9CB8A3'], ['Blush', '#E8C4C0'], ['Sky', '#A9C7DB']];
export const SUPPLY_GROUPS = ['Changing', 'Feeding', 'Sleeping', 'Bathing', 'Clothing', 'Health', 'Out & about'];
export const SUPPLY_SEED: [string, string, number][] = [
  ['Changing', 'Newborn nappies (packs)', 4], ['Changing', 'Baby wipes (packs)', 6], ['Changing', 'Nappy rash cream', 1], ['Changing', 'Changing mat', 2],
  ['Feeding', 'Bottles', 6], ['Feeding', 'Muslin cloths / burp cloths', 10], ['Feeding', 'Nursing pads (packs)', 3], ['Feeding', 'Formula (in case)', 1],
  ['Sleeping', 'Fitted cot sheets', 3], ['Sleeping', 'Swaddle blankets', 4], ['Sleeping', 'Sleeping bags', 2],
  ['Bathing', 'Baby bath', 1], ['Bathing', 'Hooded towels', 2], ['Bathing', 'Baby wash & shampoo', 1],
  ['Clothing', 'Sleepsuits / grows', 8], ['Clothing', 'Vests', 8], ['Clothing', 'Hats & mittens', 2],
  ['Health', 'Thermometer', 1], ['Health', 'Nail clippers / file', 1], ['Health', 'Saline drops & aspirator', 1],
  ['Out & about', 'Car seat (installed)', 1], ['Out & about', 'Pram / carrier', 1], ['Out & about', 'Nappy bag', 1],
];
export const NAME_ORIGINS = ['African', 'English', 'Hebrew', 'Greek', 'Latin', 'Irish', 'Italian', 'Other'];

/* ---------- care hub + events ---------- */
export const PROVIDER_ROLES = ['OB/GYN', 'GP', 'Midwife', 'Doula', 'Hospital', 'Other'] as const;
export const APPT_TYPES = ['Prenatal visit', 'Ultrasound', 'Blood test', 'Other'] as const;
export const SHOOT_KINDS: [string, string, string][] = [['maternity', '🤰', 'Maternity'], ['birth', '👶', 'Birth'], ['newborn', '🍼', 'Newborn']];
export const SHOOT_STATUSES = ['Enquiry', 'Quoted', 'Booked', 'Completed', 'Declined'] as const;
export const RSVPS = ['Pending', 'Yes', 'No', 'Maybe'] as const;
export const EVENT_KINDS: Record<string, { icon: string; label: string; tasks: string[] }> = {
  shower: { icon: '🎀', label: 'Baby shower', tasks: ['Pick a date & venue', 'Make the guest list', 'Send invitations', 'Share the registry link', 'Order the cake / food', 'Plan games & decor', 'Confirm RSVPs', 'Buy thank-you gifts'] },
  reveal: { icon: '💙', label: 'Gender reveal', tasks: ['Choose the reveal idea', 'Pick a date & venue', 'Make the guest list', 'Send invitations', 'Sealed envelope to the baker / supplier', 'Order decor & props', 'Plan the photographer / video', 'Confirm RSVPs'] },
};

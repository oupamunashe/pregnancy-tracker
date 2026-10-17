/* Start-up: (demo: MemoryAdapter, no login) or (sign-in → members check → SupabaseAdapter → shell → live subscribe). */
import './styles/app.css';
import './ui/actions';
import type { Session } from '@supabase/supabase-js';
import { membership, supabase } from './auth/auth';
import { session } from './auth/session';
import { BUDGET_SEED, NURSERY_SEED, PREP_GROUPS, PREP_SEED, SUPPLY_SEED } from './core/content';
import { S, lsDel, lsGet } from './core/state';
import type { Who } from './core/types';
import { subscribe } from './data/db';
import { MemoryAdapter } from './data/memory';
import { MemoryFiles, SupabaseFiles } from './data/files';
import { LocalStore, clearAllLocal } from './data/offline';
import { SupabaseAdapter } from './data/supabase';
import { toast } from './ui/sheet';
import { render, setNetStatus, shell } from './ui/shell';
import { sheetPassword, showMessage, showPrivate, showSignIn } from './ui/signin';

function stillConnecting() {
  setTimeout(() => {
    if (S.loaded.profiles && S.loaded.lists && S.loaded.config) return;
    const m = document.getElementById('main');
    if (m) m.innerHTML = '<div class="loading"><div><h2>Still connecting…</h2><p class="muted">Your data is taking longer than usual to load. Check your connection; the page fills in as soon as it arrives.</p></div></div>';
  }, 15000);
}

/* ---------- demo: MemoryAdapter, no login (npm run dev:demo) ---------- */
function startDemo() {
  const q = new URLSearchParams(location.search);
  if (q.get('today')) S.ui.today = q.get('today');
  const prep: Record<string, any> = {};
  PREP_GROUPS.forEach(g => PREP_SEED[g.id].forEach((text, i) => { prep[`s-${g.id}-${i}`] = { text, group: g.id, done: i % 4 === 0 }; }));
  const now = Date.now(), M = 60000;
  const db = new MemoryAdapter({
    'gestations/demo': { nickname: 'Blueberry Peanut', lmp: '2026-09-17', notes: '', icon: '🫐', status: 'active', createdAt: 1 },
    'preg_lists/demo~prep': { items: prep },
    'preg_lists/demo~symptoms': { items: { a: { d: '2026-10-16', kind: 'Nausea', sev: 2, note: 'Mornings', by: 'P', at: now - 20 * 3600000 }, b: { d: '2026-10-15', kind: 'Fatigue', sev: 1, at: now - 44 * 3600000 } } },
    'preg_lists/demo~kicks': { items: { k1: { start: now - 3 * 3600000, end: now - 3 * 3600000 + 18 * M, goal: 10, by: 'M', taps: Object.fromEntries(Array.from({ length: 10 }, (_, i) => ['t' + i, now - 3 * 3600000 + (i + 1) * 100000])) } } },
    'preg_lists/demo~budget': { items: Object.fromEntries(BUDGET_SEED.map(([category, item, est], i) => ['b' + i, { category, item, est, actual: i % 3 === 0 ? Math.round(est * (0.9 + (i % 5) * 0.06)) : null, status: i % 3 === 0 ? 'Obtained' : 'Planned' }])) },
    'preg_lists/demo~nursery': { items: Object.fromEntries(NURSERY_SEED.map(([text, todo], i) => ['n' + i, { text, todo, status: ['To buy', 'Ordered', 'Delivered', 'Set up'][i % 4], est: i % 2 ? 1500 + i * 100 : null, done: i % 4 === 3 }])) },
    'preg_lists/demo~vision': { items: { v1: { notes: 'Sage walls + warm oak furniture', swatches: { '#9CB8A3': true, '#C5A57D': true, '#F4F1EC': true }, at: now } } },
    'preg_lists/demo~names': { items: { a: { name: 'Thandi', meaning: 'Beloved', origin: 'African', votes: { P: 9, M: 9 }, fav: { P: true, M: true }, by: 'P', at: now }, b: { name: 'Noah', meaning: 'Rest, comfort', origin: 'Hebrew', votes: { P: 6, M: 9 }, fav: { M: true }, by: 'M', at: now - 1 }, c: { name: 'Aria', meaning: 'Melody', origin: 'Italian', votes: { P: 8 }, by: 'P', at: now - 2 } } },
    'preg_lists/demo~daycares': { items: { d1: { kind: 'daycare', name: 'Little Acorns', address: '12 Oak Rd', hours: '06:30 – 18:00', fee: 4200, status: 'Visited', ratings: { P: 8, M: 7 }, visits: { v1: { d: '2026-10-10', note: 'Lovely staff, 1:4 ratio', by: 'P' } }, at: now }, d2: { kind: 'daycare', name: 'Sunshine Creche', fee: 3100, hours: '07:00 – 17:30', status: 'Shortlist', at: now - 1 }, d3: { kind: 'caregiver', name: 'Nanny Grace', fee: 5500, status: 'Shortlist', at: now - 2 } } },
    'preg_lists/demo~supplies': { items: Object.fromEntries(SUPPLY_SEED.map(([group, text, need], i) => ['s' + i, { group, text, need, have: i % 3 === 0 ? need : i % 3 === 1 ? Math.floor(need / 2) : 0 }])) },
    'preg_lists/demo~diapers': { items: { _stock: { stock: 60, perPack: 50, at: now - 2 * 86400000, weight: '5.5' }, ...Object.fromEntries(Array.from({ length: 26 }, (_, i) => ['e' + i, { at: now - Math.floor(i / 8) * 86400000 - (i % 8) * 3 * 3600000, kind: ['wet', 'dirty', 'both'][i % 3], by: 'M' }])) } },
    'preg_lists/demo~photos': { items: { p1: { kind: 'bump', week: 12, d: '2026-12-10', caption: '12 weeks', url: 'https://picsum.photos/seed/bump12/300/400', by: 'P', at: now }, p2: { kind: 'scan', week: 12, d: '2026-12-10', caption: 'NT scan', url: 'https://picsum.photos/seed/scan12/300/400', by: 'M', at: now - 1 } } },
    'preg_lists/demo~providers': { items: { v1: { name: 'Dr Naledi Mokoena', role: 'OB/GYN', phone: '+27 11 555 0101', email: 'rooms@example.com', address: '12 Health Rd, Sandton', emergency: 'After hours: 082 555 0199 — call before going to hospital', at: now }, v2: { name: 'Sunninghill Hospital', role: 'Hospital', phone: '+27 11 555 0200', address: 'Witkoppen Rd, Sunninghill', emergency: 'Maternity ward, 3rd floor — enter via casualty after 20:00', at: now - 1 }, v3: { name: 'Sipho (Doula)', role: 'Doula', phone: '+27 82 555 0123', at: now - 2 } } },
    'preg_lists/demo~appointments': { items: { a1: { title: '12-week scan', type: 'Ultrasound', providerId: 'v1', date: '2026-12-10', time: '09:30', status: 'Completed', vitals: { bp: '118/74', weight: 62.4 }, notes: 'All good, heartbeat strong.', questions: 'Ask about iron supplements and travel in 2nd trimester', by: 'P', at: now - 5 }, a2: { title: 'Routine check-up', type: 'Prenatal visit', providerId: 'v1', date: '2027-01-14', time: '10:00', status: 'Scheduled', by: 'P', at: now - 4 }, a3: { title: 'Glucose tolerance test', type: 'Blood test', date: '2027-03-04', time: '07:30', status: 'Scheduled', at: now - 3 } } },
    'preg_lists/demo~photographers': { items: { s1: { kind: 'maternity', name: 'Golden Hour Studio', quote: 3800, deposit: 1000, status: 'Booked', contact: '@goldenhour', portfolio: 'https://example.com', signed: true, shootDate: '2027-03-20', shootTime: '16:00', location: 'Botanical Gardens', contract: 'Cancel 7 days prior; 30 edited images in 14 days', at: now }, s2: { kind: 'newborn', name: 'Tiny Toes Photography', quote: 4500, status: 'Quoted', at: now - 1 } } },
    'preg_lists/demo~events': { items: { e1: { kind: 'shower', title: 'Baby shower at Gran’s', date: '2027-04-10', time: '14:00', venue: 'Gran’s garden', budget: 6000, at: now, tasks: { t0: { text: 'Pick a date & venue', done: true }, t1: { text: 'Send invitations', done: false }, t2: { text: 'Order the cake', done: false } }, guests: { g1: { name: 'Aunty Thandi', contact: '082 555 0111', rsvp: 'Yes', plus: 1 }, g2: { name: 'Cousin Sam', rsvp: 'Maybe', plus: 0 }, g3: { name: 'Naledi', rsvp: 'Pending', plus: 0 } }, expenses: { x1: { what: 'Cake deposit', amt: 450 }, x2: { what: 'Decor', amt: 900 } }, links: { l1: { label: 'Takealot registry', url: 'https://www.takealot.com' } } } } },
    'config/preg-nav': { P: { tabs: ['care', 'kicks', 'contractions', 'weeks', 'events', 'budget', 'names'] } },
    'config/main': { note: 'a Pa-Nashe document — must never show up here' },
    'preg_lists/demo~contractions': { items: Object.fromEntries(Array.from({ length: 5 }, (_, i) => ['c' + i, { start: now - (5 - i) * 6 * M, end: now - (5 - i) * 6 * M + 55000, by: 'P' }])) },
  });
  S.me = (q.get('me') as Who) || S.me || 'P';
  S.activeId = 'demo';
  Object.assign(S, { db, assets: new MemoryFiles() });
  shell(); render(); subscribe();
}

/* ---------- production: Supabase ---------- */
async function startApp() {
  let sb: ReturnType<typeof supabase>;
  try { sb = supabase(); } catch (e: any) { console.error('[pregnancy-tracker]', e.message); showMessage('Not set up yet', e.message); return; }
  let entered = false, recovery = false, inShell = false;

  async function signOut(db?: SupabaseAdapter, local?: LocalStore) {
    db?.stop();
    try { await local?.destroy(); } catch { /* ignore */ }
    await clearAllLocal();
    lsDel('pt_me'); lsDel('pt_active');
    await sb.auth.signOut({ scope: 'local' });
    location.reload();
  }

  async function enter(s: Session) {
    if (entered) return; entered = true;
    const email = s.user.email || '';
    const m = await membership(s);
    if (m === 'not-member') { showPrivate(email, () => signOut()); return; }
    if (m === 'unknown') { showMessage('Can’t reach the tracker', 'This device is offline and hasn’t opened the tracker before. Connect to the internet and reload the page.'); return; }
    S.me = (lsGet('pt_me') as Who | null) || m.person;
    const local = new LocalStore(s.user.id);
    const db = new SupabaseAdapter(sb, local, msg => toast(msg, 'bad'));
    Object.assign(S, { db, assets: new SupabaseFiles(sb), user: { id: s.user.id, email } });
    Object.assign(session, { active: true, email, pending: () => db.pendingCount, signOut: () => signOut(db, local) });
    shell(); inShell = true; render();
    db.onStatus(setNetStatus);
    subscribe();
    stillConnecting();
    if (recovery) sheetPassword(true);
    await db.start();
  }

  // Callbacks must not await Supabase calls directly (supabase-js holds a lock during the callback).
  sb.auth.onAuthStateChange((ev, s) => {
    if (ev === 'PASSWORD_RECOVERY') { recovery = true; if (inShell) setTimeout(() => sheetPassword(true), 0); }
    if (ev === 'SIGNED_IN' && s) setTimeout(() => enter(s), 0);
    if (ev === 'SIGNED_OUT' && entered) location.reload();
  });
  const { data } = await sb.auth.getSession();
  if (data.session) enter(data.session); else if (!entered) showSignIn();
}

document.body.innerHTML = '<main id="main"><div class="loading"><div><div class="spin"></div>Loading…</div></div></main>';
if (import.meta.env.MODE === 'demo') startDemo(); else startApp();

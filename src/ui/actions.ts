/* One delegated click/change/submit handler. Every interactive element carries data-a="<action>". */
import { session } from '../auth/session';
import { KICK_GOAL, activeKick } from '../core/calc';
import { ctx } from '../core/ctx';
import { uid } from '../core/format';
import { isValidISO, toISO } from '../core/gestation';
import { S, lsSet, pname } from '../core/state';
import type { Contraction, DiaperEntry, KickSession, ListKey, Who } from '../core/types';
import { nappiesRemaining } from '../core/calc';
import { placeholderImage } from '../core/diaper';
import { shrinkImage } from './image';
import { createProfile, delItem, deleteProfile, items, putItem, saveProfile, seedBudget, seedNursery, seedSupplies, setActive } from '../data/db';
import { sheetPassword } from './signin';
import { closeSheet, openSheet, toast, val, $, $$ } from './sheet';
import { render } from './shell';
import { sheetSymptomBody } from './views/symptoms';

const pid = () => ctx()!.id;
const fail = (e: any) => { if (e?.message !== 'offline' && e?.message !== 'readonly') console.warn(e); };

export function go(view: string) { S.ui.view = view; S.ui.scrollTop = true; render(); }

async function act(a: string, el: HTMLElement, e: Event) {
  const d = el.dataset;
  switch (a) {
    case 'nav': return go(d.v!);
    case 'closesheet': return closeSheet();
    case 'week': S.ui.week = +d.w!; return render();
    case 'weektask': return void putItem(pid(), 'weekly', d.key!, { done: (el as HTMLInputElement).checked, by: S.me, at: Date.now() }).catch(fail);

    /* symptoms */
    case 'sheet-symptom': return sheetSymptom();
    case 'pick-kind': $$('#sy-kinds .chip-btn').forEach(b => b.classList.toggle('on', b === el)); return;
    case 'pick-sev': $$('#sy-sev .chip-btn').forEach(b => b.classList.toggle('on', b === el)); return;
    case 'del-symptom': return void delItem(pid(), 'symptoms', d.id!).catch(fail);

    /* kicks */
    case 'kick-start': return void putItem(pid(), 'kicks', uid(), { start: Date.now(), end: null, goal: KICK_GOAL, by: S.me }).catch(fail);
    case 'kick-tap': { const s = activeKick(items<KickSession>(pid(), 'kicks')); if (s) putItem(pid(), 'kicks', s.id, { taps: { [uid()]: Date.now() } }).catch(fail); navigator.vibrate?.(30); return; }
    case 'kick-undo': {
      const s = activeKick(items<KickSession>(pid(), 'kicks')); if (!s) return;
      const last = Object.entries(s.taps || {}).filter(([, v]) => v != null).sort((a, b) => (b[1] as number) - (a[1] as number))[0];
      if (last) putItem(pid(), 'kicks', s.id, { taps: { [last[0]]: null } }).catch(fail); return;
    }
    case 'kick-stop': { const s = activeKick(items<KickSession>(pid(), 'kicks')); if (s) putItem(pid(), 'kicks', s.id, { end: Date.now() }).catch(fail); return; }
    case 'del-kick': return void delItem(pid(), 'kicks', d.id!).catch(fail);

    /* contractions */
    case 'ctr-toggle': {
      const live = items<Contraction>(pid(), 'contractions').find(x => x.end == null);
      if (live) putItem(pid(), 'contractions', live.id, { end: Date.now() }).catch(fail);
      else putItem(pid(), 'contractions', uid(), { start: Date.now(), end: null, by: S.me }).catch(fail);
      navigator.vibrate?.(30); return;
    }
    case 'del-ctr': return void delItem(pid(), 'contractions', d.id!).catch(fail);
    case 'ctr-clear': if (confirm('Clear all timed contractions?')) items(pid(), 'contractions').forEach(x => delItem(pid(), 'contractions', x.id).catch(fail)); return;

    /* prep checklists */
    case 'prep-group': S.ui.prepGroup = d.g!; return render();
    case 'prep-toggle': return void putItem(pid(), 'prep', d.id!, { done: (el as HTMLInputElement).checked, by: S.me }).catch(fail);
    case 'prep-del': return void delItem(pid(), 'prep', d.id!).catch(fail);
    case 'prep-add': {
      e.preventDefault();
      const text = val(document, '#prep-new'); if (!text) return;
      putItem(pid(), 'prep', uid(), { text, group: S.ui.prepGroup, done: false }).catch(fail);
      ($('#prep-new') as HTMLInputElement).value = ''; return;
    }

    /* profiles & settings */
    case 'create-first': {
      e.preventDefault();
      const nickname = val(document, '#fr-name'), lmp = val(document, '#fr-lmp');
      if (!nickname) return toast('Give the profile a nickname.', 'bad');
      if (!isValidISO(lmp)) return toast('Pick the LMP date.', 'bad');
      return void createProfile({ nickname, lmp }).catch(fail);
    }
    case 'pick-icon': { ($('#pf-icon') as HTMLInputElement).value = d.e!; $$('[data-a="pick-icon"]').forEach(b => b.classList.toggle('on', b === el)); return; }
    case 'save-profile': {
      e.preventDefault();
      const nickname = val(document, '#pf-name'), lmp = val(document, '#pf-lmp');
      if (!nickname) return toast('Give the profile a nickname.', 'bad');
      if (!isValidISO(lmp)) return toast('Pick the LMP date.', 'bad');
      await saveProfile(pid(), { nickname, lmp, notes: val(document, '#pf-notes'), icon: val(document, '#pf-icon') || '🌸' }).catch(fail);
      return toast('Saved');
    }
    case 'new-profile': return sheetNewProfile();
    case 'switch-profile': setActive(d.id!); return go('home');
    case 'archive-profile': { const p = S.profiles[d.id!]; return void saveProfile(d.id!, { status: p.status === 'archived' ? 'active' : 'archived' }).catch(fail); }
    case 'delete-profile': if (confirm(`Delete “${S.profiles[d.id!]?.nickname}” and all its data for BOTH of you? This can’t be undone.`)) deleteProfile(d.id!).catch(fail); return;
    case 'who': S.me = d.w as Who; lsSet('pt_me', d.w!); return render();
    case 'password': return sheetPassword();
    case 'signout': return void session.signOut();

    /* generic: inline edit, delete, starter lists */
    case 'edit': {
      const t = el as HTMLInputElement; let v: any = t.value;
      if (d.t === 'num') { v = v === '' ? null : Number(v); if (v !== null && Number.isNaN(v)) return; }
      return void putItem(pid(), d.list as ListKey, d.id!, { [d.f!]: v }).catch(fail);
    }
    case 'del': return void delItem(pid(), d.list as ListKey, d.id!).catch(fail);
    case 'seed': return void (d.what === 'budget' ? seedBudget(pid()) : d.what === 'nursery' ? seedNursery(pid()) : seedSupplies(pid())).catch(fail);

    /* budget */
    case 'budget-add': {
      e.preventDefault();
      const item = val(document, '#bd-item'), category = val(document, '#bd-cat') || 'Other';
      if (!item) return;
      await putItem(pid(), 'budget', uid(), { category, item, est: Number(val(document, '#bd-est')) || 0, actual: null, status: 'Planned', by: S.me }).catch(fail);
      ($('#bd-item') as HTMLInputElement).value = ''; return;
    }

    /* baby names (each partner writes only their own vote / heart) */
    case 'name-add': {
      e.preventDefault();
      const name = val(document, '#nm-name'); if (!name) return;
      await putItem(pid(), 'names', uid(), { name, meaning: val(document, '#nm-meaning'), origin: val(document, '#nm-origin'), by: S.me, at: Date.now() }).catch(fail);
      ($('#nm-name') as HTMLInputElement).value = ''; ($('#nm-meaning') as HTMLInputElement).value = ''; return;
    }
    case 'name-filter': S.ui.nameFilter = d.f!; return render();
    case 'name-vote': { const v = (el as HTMLSelectElement).value; return void putItem(pid(), 'names', d.id!, { votes: { [d.w!]: v ? +v : null } }).catch(fail); }
    case 'name-fav': { const on = items<any>(pid(), 'names').find(n => n.id === d.id)?.fav?.[d.w!]; return void putItem(pid(), 'names', d.id!, { fav: { [d.w!]: on ? null : true } }).catch(fail); }

    /* nursery */
    case 'nursery-tab': S.ui.nurseryTab = d.t!; return render();
    case 'nursery-done': { const on = (el as HTMLInputElement).checked; return void putItem(pid(), 'nursery', d.id!, { done: on, status: on ? 'Set up' : 'To buy' }).catch(fail); }
    case 'nursery-status': { const st = (el as HTMLSelectElement).value; return void putItem(pid(), 'nursery', d.id!, { status: st, done: st === 'Set up' }).catch(fail); }
    case 'nursery-add': {
      e.preventDefault();
      const text = val(document, '#nu-text'); if (!text) return;
      await putItem(pid(), 'nursery', uid(), { text, status: 'To buy', est: Number(val(document, '#nu-est')) || null, done: false }).catch(fail);
      ($('#nu-text') as HTMLInputElement).value = ''; return;
    }
    case 'vision-add': {
      e.preventDefault();
      const url = val(document, '#vb-url'), notes = val(document, '#vb-notes'), file = ($('#vb-file') as HTMLInputElement).files?.[0];
      if (!url && !file && !notes) return toast('Add an image, link or a note first.', 'bad');
      let fileId: string | undefined;
      if (file) { try { toast('Uploading…'); fileId = await uploadImage(file); } catch (err: any) { return toast(err.message || 'Upload failed', 'bad'); } }
      await putItem(pid(), 'vision', uid(), { image: url, fileId, notes, at: Date.now() }).catch(fail);
      return render();
    }
    case 'vision-swatch': { const on = items<any>(pid(), 'vision').find(v => v.id === d.id)?.swatches?.[d.hex!]; return void putItem(pid(), 'vision', d.id!, { swatches: { [d.hex!]: on ? null : true } }).catch(fail); }

    /* photo milestones */
    case 'photo-kind-pick': $$('[data-a="photo-kind-pick"]').forEach(b => b.classList.toggle('on', b === el)); return;
    case 'photo-filter': S.ui.photoKind = d.k!; return render();
    case 'photo-add': {
      e.preventDefault();
      const file = ($('#ph-file') as HTMLInputElement).files?.[0], url = val(document, '#ph-url'), dt = val(document, '#ph-date');
      if (!file && !url) return toast('Choose a photo or paste an image link.', 'bad');
      if (!isValidISO(dt)) return toast('Pick a valid date.', 'bad');
      let fileId: string | undefined;
      if (file) { try { toast('Uploading…'); fileId = await uploadImage(file); } catch (err: any) { return toast(err.message || 'Upload failed', 'bad'); } }
      const kind = $('[data-a="photo-kind-pick"].on')?.dataset.k === 'scan' ? 'scan' : 'bump';
      await putItem(pid(), 'photos', uid(), { kind, week: Math.max(0, Math.min(42, Number(val(document, '#ph-week')) || 0)), d: dt, caption: val(document, '#ph-cap'), fileId, url: file ? undefined : url, by: S.me, at: Date.now() }).catch(fail);
      toast('Photo added'); return render();
    }

    /* daycare & caregivers */
    case 'care-add': {
      e.preventDefault();
      const name = val(document, '#dc-name'); if (!name) return;
      await putItem(pid(), 'daycares', uid(), { kind: val(document, '#dc-kind') === 'caregiver' ? 'caregiver' : 'daycare', name, fee: Number(val(document, '#dc-fee')) || null, status: 'Shortlist', at: Date.now() }).catch(fail);
      ($('#dc-name') as HTMLInputElement).value = ''; return;
    }
    case 'care-rate': { const v = (el as HTMLSelectElement).value; return void putItem(pid(), 'daycares', d.id!, { ratings: { [d.w!]: v ? +v : null } }).catch(fail); }
    case 'care-visit': return sheetVisit(d.id!);
    case 'care-visit-del': return void putItem(pid(), 'daycares', d.id!, { visits: { [d.v!]: null } }).catch(fail);

    /* supplies & diapers */
    case 'supply-tab': S.ui.supplyTab = d.t!; return render();
    case 'supply-add': {
      e.preventDefault();
      const text = val(document, '#su-text'); if (!text) return;
      await putItem(pid(), 'supplies', uid(), { group: val(document, '#su-group'), text, need: Math.max(1, Number(val(document, '#su-need')) || 1), have: 0 }).catch(fail);
      ($('#su-text') as HTMLInputElement).value = ''; return;
    }
    case 'sup-have': { const cur = items<any>(pid(), 'supplies').find(x => x.id === d.id); if (cur) putItem(pid(), 'supplies', d.id!, { have: Math.max(0, (cur.have || 0) + Number(d.d)) }).catch(fail); return; }
    case 'diaper-log': { putItem(pid(), 'diapers', uid(), { at: Date.now(), kind: d.k, by: S.me }).catch(fail); navigator.vibrate?.(25); return toast(`Logged ${d.k === 'both' ? 'wet + dirty' : d.k}`); }
    case 'stock-set': {
      const n = Number(val(document, '#st-count')); if (!(n >= 0) || val(document, '#st-count') === '') return toast('Enter how many nappies you have.', 'bad');
      return void putItem(pid(), 'diapers', '_stock', { stock: n, perPack: Math.max(1, Number(val(document, '#st-pack')) || 50), at: Date.now() }).catch(fail);
    }
    case 'stock-pack': {
      const all = items<any>(pid(), 'diapers'), st = all.find(x => x.id === '_stock'), per = Math.max(1, Number(val(document, '#st-pack')) || st?.perPack || 50);
      const left = nappiesRemaining(st, all.filter(x => !x.id.startsWith('_')) as DiaperEntry[]) ?? 0;
      return void putItem(pid(), 'diapers', '_stock', { stock: left + per, perPack: per, at: Date.now() }).catch(fail);
    }
    case 'diaper-weight': return void putItem(pid(), 'diapers', '_stock', { weight: (el as HTMLInputElement).value.trim() }).catch(fail);
  }
}

async function uploadImage(file: File): Promise<string> {
  if (!S.assets) throw new Error('Photo storage isn’t available in demo mode.');
  const blob = await shrinkImage(file);
  return (await S.assets.upload(blob)).id;
}

function sheetVisit(id: string) {
  openSheet({
    title: 'Log a visit',
    body: `<div class="field"><label for="vs-date">Date</label><input id="vs-date" class="inp" type="date" value="${toISO(ctx()!.today)}"></div>
      <div class="field"><label for="vs-note">What did you think?</label><textarea id="vs-note" class="inp" rows="3" placeholder="Ratios, cleanliness, staff, questions to follow up…"></textarea></div>`,
    foot: `<button class="btn" data-a="closesheet">Cancel</button><button class="btn primary" id="vs-save">Save visit</button>`,
    onMount: el => {
      (el.querySelector('#vs-save') as HTMLButtonElement).onclick = async () => {
        const dt = val(el, '#vs-date'); if (!isValidISO(dt)) return toast('Pick a valid date.', 'bad');
        closeSheet();
        await putItem(pid(), 'daycares', id, { status: 'Visited', visits: { [uid()]: { d: dt, note: val(el, '#vs-note'), by: S.me } } }).catch(fail);
        toast(`Visit saved${S.me ? ' by ' + pname(S.me) : ''}`);
      };
    },
  });
}

function sheetSymptom() {
  const today = toISO(ctx()!.today);
  openSheet({
    title: 'Log a symptom', body: sheetSymptomBody(today),
    foot: `<button class="btn" data-a="closesheet">Cancel</button><button class="btn primary" id="sy-save">Save</button>`,
    onMount: el => {
      (el.querySelector('#sy-save') as HTMLButtonElement).onclick = async () => {
        const kind = el.querySelector('#sy-kinds .on')?.getAttribute('data-k') || 'Other', sev = +(el.querySelector('#sy-sev .on')?.getAttribute('data-s') || 1);
        const dt = val(el, '#sy-date');
        if (!isValidISO(dt)) return toast('Pick a valid date.', 'bad');
        closeSheet();
        await putItem(pid(), 'symptoms', uid(), { d: dt, kind, sev, note: val(el, '#sy-note'), by: S.me, at: Date.now() }).catch(fail);
        toast('Symptom logged');
      };
    },
  });
}

function sheetNewProfile() {
  openSheet({
    title: 'New pregnancy profile',
    body: `<div class="field"><label for="np-name">Nickname</label><input id="np-name" class="inp"></div><div class="field"><label for="np-lmp">LMP date</label><input id="np-lmp" class="inp" type="date"></div>`,
    foot: `<button class="btn" data-a="closesheet">Cancel</button><button class="btn primary" id="np-save">Create</button>`,
    onMount: el => {
      (el.querySelector('#np-save') as HTMLButtonElement).onclick = async () => {
        const nickname = val(el, '#np-name'), lmp = val(el, '#np-lmp');
        if (!nickname) return toast('Give the profile a nickname.', 'bad');
        if (!isValidISO(lmp)) return toast('Pick the LMP date.', 'bad');
        closeSheet(); await createProfile({ nickname, lmp }).catch(fail); go('home');
      };
    },
  });
}

document.addEventListener('click', e => {
  const el = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
  if (!el || el.matches('form,input,select,textarea')) return;
  act(el.dataset.a!, el, e);
});
document.addEventListener('change', e => { const el = (e.target as HTMLElement).closest('input,select,textarea') as HTMLElement | null; if (el?.dataset.a) act(el.dataset.a, el, e); });
/* a broken pack photo falls back to a generated placeholder */
document.addEventListener('error', e => { const t = e.target as HTMLImageElement; if (t instanceof HTMLImageElement && t.dataset.brand) { t.src = placeholderImage(t.dataset.brand, t.dataset.size || '', t.dataset.color || '#00A693'); delete t.dataset.brand; } }, true);
document.addEventListener('submit', e => { const el = (e.target as HTMLElement).closest('form[data-a]') as HTMLElement | null; if (el) act(el.dataset.a!, el, e); });

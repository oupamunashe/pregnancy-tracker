export type Who = 'P' | 'M';                       // members.person
export interface Profile { nickname: string; lmp: string; notes?: string; icon?: string; status?: 'active' | 'archived'; createdAt?: number }
export interface Symptom { d: string; kind: string; sev: 1 | 2 | 3; note?: string; by?: Who; at: number }
/** A kick-count session. Taps are a map (not an array) so two phones tapping at once both survive a doc_merge. */
export interface KickSession { start: number; end: number | null; goal: number; by?: Who; taps?: Record<string, number | null> }
export interface Contraction { start: number; end: number | null; by?: Who }
export interface PrepItem { text: string; group: PrepGroup; done: boolean; by?: Who }
export interface WeeklyDone { done: boolean; by?: Who; at: number }
export type PrepGroup = 'bag-parent' | 'bag-partner' | 'bag-baby' | 'nursery' | 'admin';
export type ListKey = 'weekly' | 'symptoms' | 'kicks' | 'contractions' | 'prep' | 'budget' | 'names' | 'nursery' | 'vision' | 'photos' | 'daycares' | 'supplies' | 'diapers' | 'providers' | 'appointments' | 'photographers' | 'events';
export const LIST_KEYS: ListKey[] = ['weekly', 'symptoms', 'kicks', 'contractions', 'prep', 'budget', 'names', 'nursery', 'vision', 'photos', 'daycares', 'supplies', 'diapers', 'providers', 'appointments', 'photographers', 'events'];

/** Per-partner values are stored as { P: x, M: y } so each phone writes only its own key (no overwrites under doc_merge). */
export type PerPerson<T> = { P?: T | null; M?: T | null };
export type BudgetStatus = 'Planned' | 'In Registry' | 'Obtained';
export interface BudgetItem { category: string; item: string; est: number; actual: number | null; status: BudgetStatus; link?: string; by?: Who }
export interface BabyName { name: string; meaning?: string; origin?: string; note?: string; votes?: PerPerson<number>; fav?: PerPerson<boolean>; by?: Who; at: number }
export type NurseryStatus = 'To buy' | 'Ordered' | 'Delivered' | 'Assembled' | 'Set up';
export interface NurseryItem { text: string; todo?: string; status: NurseryStatus; est?: number | null; link?: string; done: boolean }
export interface VisionCard { image?: string; fileId?: string; notes?: string; swatches?: Record<string, boolean | null>; at: number }
export interface Photo { kind: 'bump' | 'scan'; week: number; d: string; caption?: string; fileId?: string; url?: string; by?: Who; at: number }
export interface Visit { d: string; note?: string; by?: Who }
export type CareStatus = 'Shortlist' | 'Visited' | 'Chosen' | 'Rejected';
export interface Daycare { kind: 'daycare' | 'caregiver'; name: string; address?: string; hours?: string; fee: number | null; contact?: string; notes?: string; status: CareStatus; ratings?: PerPerson<number>; visits?: Record<string, Visit | null>; at: number }
export interface Supply { text: string; group: string; need: number; have: number; est?: number | null }
export interface DiaperEntry { at: number; kind: 'wet' | 'dirty' | 'both'; by?: Who }
export interface DiaperStock { stock: number; perPack: number; weight?: string }

export type WithId<T> = T & { id: string };

/* ---------- medical care hub ---------- */
export type ProviderRole = 'OB/GYN' | 'GP' | 'Midwife' | 'Doula' | 'Hospital' | 'Other';
export interface Provider { name: string; role: ProviderRole; phone?: string; email?: string; address?: string; emergency?: string; at: number }
export type ApptType = 'Prenatal visit' | 'Ultrasound' | 'Blood test' | 'Other';
export type ApptStatus = 'Scheduled' | 'Completed';
export interface Appointment { title: string; type: ApptType; providerId?: string; date: string; time?: string; status: ApptStatus; vitals?: { bp?: string; weight?: number | null }; notes?: string; questions?: string; by?: Who; at: number }

/* ---------- events, photography ---------- */
export type ShootKind = 'maternity' | 'birth' | 'newborn';
export type ShootStatus = 'Enquiry' | 'Quoted' | 'Booked' | 'Completed' | 'Declined';
export interface Photographer { kind: ShootKind; name: string; contact?: string; portfolio?: string; quote: number | null; deposit?: number | null; status: ShootStatus; contract?: string; signed?: boolean; shootDate?: string; shootTime?: string; location?: string; notes?: string; at: number }
export type Rsvp = 'Pending' | 'Yes' | 'No' | 'Maybe';
export interface Guest { name: string; contact?: string; rsvp: Rsvp; plus?: number }
export interface EventItem {
  kind: 'shower' | 'reveal'; title: string; date?: string; time?: string; venue?: string; budget: number | null; notes?: string; at: number;
  guests?: Record<string, Guest | null>; tasks?: Record<string, { text: string; done: boolean } | null>;
  expenses?: Record<string, { what: string; amt: number } | null>; links?: Record<string, { label: string; url: string } | null>;
}

/* ---------- customizable navigation (config/preg-nav → { P: { tabs }, M: { tabs } }) ---------- */
export interface NavPref { tabs?: string[] }

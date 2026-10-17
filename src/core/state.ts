import type { DocStore } from '../data/adapter';
import type { FileStore } from '../data/files';
import type { Profile, Who } from './types';

export function lsGet(k: string): string | null { try { return localStorage.getItem(k) || null; } catch { return null; } }
export function lsSet(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* private mode */ } }
export function lsDel(k: string) { try { localStorage.removeItem(k); } catch { /* ignore */ } }

export interface UiState { view: string; week: number | null; prepGroup: string; sheetProfile: boolean; nameFilter: string; nurseryTab: string; photoKind: string; [k: string]: any }
export interface State {
  db: DocStore | null; assets: FileStore | null; user: { id: string; email: string } | null;
  profiles: Record<string, Profile>;                       // gestations/<id>
  lists: Record<string, { items?: Record<string, any> }>;   // preg_lists/<profileId>~<listKey>
  activeId: string | null;
  loaded: { profiles: boolean; lists: boolean };
  ver: number; canWrite: boolean; offline: boolean;
  ui: UiState; me: Who | null; deferRender?: boolean;
}

export const S: State = {
  db: null, assets: null, user: null, profiles: {}, lists: {}, activeId: lsGet('pt_active'),
  loaded: { profiles: false, lists: false }, ver: 0, canWrite: true, offline: false,
  ui: { view: 'home', week: null, prepGroup: 'bag-parent', sheetProfile: false, nameFilter: 'all', nurseryTab: 'plan', photoKind: 'all' },
  me: lsGet('pt_me') as Who | null,
};

export const pname = (w: string | undefined | null): string => (w === 'P' ? 'Piepie' : w === 'M' ? 'Munny' : 'Both');
export const profileIds = () => Object.keys(S.profiles).filter(k => S.profiles[k]).sort((a, b) => (S.profiles[a].createdAt || 0) - (S.profiles[b].createdAt || 0));
/** The profile in view: the remembered one if it still exists, otherwise the first active one. */
export function activeProfile(): { id: string; p: Profile } | null {
  const ids = profileIds();
  const id = S.activeId && S.profiles[S.activeId] ? S.activeId : ids.find(i => S.profiles[i].status !== 'archived') || ids[0];
  return id ? { id, p: S.profiles[id] } : null;
}

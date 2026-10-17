/* Photo / image storage: the private Supabase bucket `files` (created by the Pa-Nashe 0001 migration; members-only policies).
   Documents keep only the short file id; links are short-lived signed URLs. Uploads need a connection (they are not outbox-queued). */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface FileStore { upload(f: Blob & { name?: string }): Promise<{ id: string }>; url(id: string): Promise<string> }
const browserOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

export class SupabaseFiles implements FileStore {
  private urls = new Map<string, { url: string; exp: number }>();
  constructor(private sb: SupabaseClient) {}
  async upload(f: Blob & { name?: string }) {
    if (browserOffline()) throw new Error('You’re offline – attach the photo again when you’re connected.');
    const ext = (f.name?.match(/\.([a-z0-9]+)$/i)?.[1] || (f.type.split('/')[1] || 'bin')).toLowerCase();
    const id = 'preg-' + crypto.randomUUID() + '.' + ext;
    const { error } = await this.sb.storage.from('files').upload(id, f, { contentType: f.type || undefined, upsert: false });
    if (error) throw error;
    return { id };
  }
  async url(id: string) {
    const hit = this.urls.get(id);
    if (hit && hit.exp > Date.now()) return hit.url;
    const { data, error } = await this.sb.storage.from('files').createSignedUrl(id, 3600);
    if (error || !data) throw error || new Error('No link');
    this.urls.set(id, { url: data.signedUrl, exp: Date.now() + 55 * 60 * 1000 });
    return data.signedUrl;
  }
}

/** In-memory files (tests / demo): blobs kept in a map, served as object URLs. */
export class MemoryFiles implements FileStore {
  blobs = new Map<string, Blob>();
  async upload(f: Blob & { name?: string }) { const id = 'preg-' + crypto.randomUUID() + '.' + (f.name?.match(/\.([a-z0-9]+)$/i)?.[1] || 'bin'); this.blobs.set(id, f); return { id }; }
  async url(id: string) { const b = this.blobs.get(id); return b ? URL.createObjectURL(b) : 'about:blank'; }
}

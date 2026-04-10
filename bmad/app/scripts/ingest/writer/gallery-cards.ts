import type { SupabaseClient } from '@supabase/supabase-js';
import type { ParsedEntry } from '../types';
import { computeSourceFingerprint } from './fingerprint';

export type GalleryCardWriterConfig = {
  source: string;
  importBatchId: string;
  resourcesChannelId: string;
};

export type GalleryCardWriteResult = 'inserted' | 'deduped' | 'skipped';

export async function insertOrReuseGalleryCard(
  client: SupabaseClient,
  entry: ParsedEntry,
  params: {
    userId: string;
    config: GalleryCardWriterConfig;
  },
): Promise<GalleryCardWriteResult> {
  if (entry.kind !== 'link') {
    throw new Error(`insertOrReuseGalleryCard called with non-link entry (kind=${entry.kind})`);
  }

  const normalizedUrl = normalizeUrl(entry.content);

  const fingerprint = computeSourceFingerprint({
    source: params.config.source,
    sessionDate: entry.session_date,
    authorRaw: entry.author_raw,
    timestampRaw: entry.timestamp_raw,
    content: normalizedUrl,
  });

  // Short-circuit: already processed this exact (author+timestamp+url) before.
  const { data: existingProv, error: provLookupErr } = await client
    .from('message_imports')
    .select('id')
    .eq('source_fingerprint', fingerprint)
    .maybeSingle();
  if (provLookupErr) throw new Error(`Gallery provenance lookup failed: ${provLookupErr.message}`);
  if (existingProv) return 'skipped';

  // Look for an existing card with this URL in #resources.
  const { data: existingCard, error: cardLookupErr } = await client
    .from('gallery_cards')
    .select('id')
    .eq('channel_id', params.config.resourcesChannelId)
    .eq('link', normalizedUrl)
    .maybeSingle();
  if (cardLookupErr) throw new Error(`Gallery card lookup failed: ${cardLookupErr.message}`);

  let cardId: string;
  let result: GalleryCardWriteResult;
  if (existingCard) {
    cardId = existingCard.id;
    result = 'deduped';
  } else {
    const title = entry.preview_title ?? humanizeUrl(normalizedUrl);
    const description = `Shared by ${entry.author_display} on ${prettyDate(entry.session_date)}`;
    const { data: newCard, error: cardErr } = await client
      .from('gallery_cards')
      .insert({
        channel_id: params.config.resourcesChannelId,
        user_id: params.userId,
        image_url: null,
        title,
        description,
        link: normalizedUrl,
        created_at: entry.timestamp_resolved,
      })
      .select('id')
      .single();
    if (cardErr || !newCard) throw new Error(`Gallery card insert failed: ${cardErr?.message}`);
    cardId = newCard.id;
    result = 'inserted';
  }

  // Provenance row (always, for both insert and dedupe).
  const { error: provErr } = await client.from('message_imports').insert({
    message_id: null,
    gallery_card_id: cardId,
    source: params.config.source,
    session_date: entry.session_date,
    original_author_raw: entry.author_raw,
    original_timestamp_raw: entry.timestamp_raw,
    source_fingerprint: fingerprint,
    import_batch_id: params.config.importBatchId,
  });
  if (provErr) throw new Error(`Gallery provenance insert failed: ${provErr.message}`);

  return result;
}

export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hostname = u.hostname.toLowerCase();
    let out = u.toString();
    // Strip trailing slash on path (but not if path is just "/").
    if (out.endsWith('/') && u.pathname !== '/') {
      out = out.slice(0, -1);
    }
    return out;
  } catch {
    return raw.trim();
  }
}

function humanizeUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname.replace(/\/$/, '');
    return path ? `${host}${path}` : host;
  } catch {
    return url;
  }
}

function prettyDate(sessionDate: string): string {
  const [y, m, d] = sessionDate.split('-').map(Number);
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];
  return `${month} ${d}, ${y}`;
}

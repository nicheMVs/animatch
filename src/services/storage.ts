import { SETTINGS } from '../config/settings';
import type { Character } from '../types/character';
import type { Choice } from '../types/choice';

function scopedKey(base: string, sourceId: string, filter?: string): string {
  return filter ? `${base}__${sourceId}__${filter}` : `${base}__${sourceId}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// ── History ──────────────────────────────────────────────

export function getHistory(sourceId: string): Choice[] {
  const data = readJson<Choice[]>(scopedKey(SETTINGS.STORAGE_KEY, sourceId), []);
  return Array.isArray(data) ? data : [];
}

export function addChoice(sourceId: string, choice: Choice): void {
  const history = getHistory(sourceId);
  history.push(choice);
  writeJson(scopedKey(SETTINGS.STORAGE_KEY, sourceId), history);
}

export function clearHistory(sourceId: string): void {
  try {
    localStorage.removeItem(scopedKey(SETTINGS.STORAGE_KEY, sourceId));
  } catch {
    /* ignore */
  }
}

// ── Deck cache ───────────────────────────────────────────

interface DeckCache {
  savedAt: number;
  deckSize: number;
  characters: Character[];
  nextPage: number;
  seenIds: number[];
  order: number[];
}

export interface DeckSnapshot {
  characters: Character[];
  nextPage: number;
  seenIds: number[];
  order: number[];
}

export function getCachedDeck(sourceId: string): DeckSnapshot | null {
  const cache = readJson<DeckCache | null>(scopedKey(SETTINGS.DECK_CACHE_KEY, sourceId), null);
  if (!cache || !Array.isArray(cache.characters) || cache.characters.length === 0) return null;
  if (cache.deckSize !== SETTINGS.DECK_SIZE) return null;
  return {
    characters: cache.characters,
    nextPage: cache.nextPage ?? 1,
    seenIds: cache.seenIds ?? cache.characters.map((c) => c.id),
    order: cache.order ?? cache.characters.map((c) => c.id),
  };
}

export function setCachedDeck(sourceId: string, snapshot: DeckSnapshot): void {
  const cache: DeckCache = {
    savedAt: Date.now(),
    deckSize: SETTINGS.DECK_SIZE,
    characters: snapshot.characters,
    nextPage: snapshot.nextPage,
    seenIds: snapshot.seenIds,
    order: snapshot.order,
  };
  writeJson(scopedKey(SETTINGS.DECK_CACHE_KEY, sourceId), cache);
}

export function clearCachedDeck(sourceId: string): void {
  try {
    localStorage.removeItem(scopedKey(SETTINGS.DECK_CACHE_KEY, sourceId));
  } catch {
    /* ignore */
  }
}

// ── Per-filter deck progress ─────────────────────────────

export function getSavedIndex(sourceId: string, filter: string): number {
  const value = readJson<number>(scopedKey(SETTINGS.PROGRESS_KEY, sourceId, filter), 0);
  return typeof value === 'number' && value >= 0 ? value : 0;
}

export function setSavedIndex(sourceId: string, filter: string, index: number): void {
  writeJson(scopedKey(SETTINGS.PROGRESS_KEY, sourceId, filter), index);
}

export function clearSavedIndex(sourceId: string, filter?: string): void {
  try {
    if (filter) {
      localStorage.removeItem(scopedKey(SETTINGS.PROGRESS_KEY, sourceId, filter));
    } else {
      for (const f of ['waifus', 'husbandos', 'both']) {
        localStorage.removeItem(scopedKey(SETTINGS.PROGRESS_KEY, sourceId, f));
      }
    }
  } catch {
    /* ignore */
  }
}

// ── Per-filter shuffle order ─────────────────────────────

export function getSavedOrder(sourceId: string, filter: string): number[] | null {
  const value = readJson<number[] | null>(scopedKey(SETTINGS.ORDER_KEY, sourceId, filter), null);
  return Array.isArray(value) && value.length > 0 ? value : null;
}

export function setSavedOrder(sourceId: string, filter: string, order: number[]): void {
  writeJson(scopedKey(SETTINGS.ORDER_KEY, sourceId, filter), order);
}

export function clearSavedOrder(sourceId: string, filter?: string): void {
  try {
    if (filter) {
      localStorage.removeItem(scopedKey(SETTINGS.ORDER_KEY, sourceId, filter));
    } else {
      for (const f of ['waifus', 'husbandos', 'both']) {
        localStorage.removeItem(scopedKey(SETTINGS.ORDER_KEY, sourceId, f));
      }
    }
  } catch {
    /* ignore */
  }
}

// ── Full reset ───────────────────────────────────────────

export function clearAll(sourceId: string): void {
  clearHistory(sourceId);
  clearCachedDeck(sourceId);
  clearSavedIndex(sourceId);
  clearSavedOrder(sourceId);
}
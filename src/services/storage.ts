import { SETTINGS } from '../config/settings';
import type { Character } from '../types/character';
import type { Choice } from '../types/choice';

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

export function getHistory(): Choice[] {
  const data = readJson<Choice[]>(SETTINGS.STORAGE_KEY, []);
  return Array.isArray(data) ? data : [];
}

export function addChoice(choice: Choice): void {
  const history = getHistory();
  history.push(choice);
  writeJson(SETTINGS.STORAGE_KEY, history);
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(SETTINGS.STORAGE_KEY);
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
  /** The frozen shuffled order. Same array on every load. */
  order: number[];
}

export interface DeckSnapshot {
  characters: Character[];
  nextPage: number;
  seenIds: number[];
  order: number[];
}

export function getCachedDeck(): DeckSnapshot | null {
  const cache = readJson<DeckCache | null>(SETTINGS.DECK_CACHE_KEY, null);
  if (!cache || !Array.isArray(cache.characters) || cache.characters.length === 0) return null;
  if (cache.deckSize !== SETTINGS.DECK_SIZE) return null;
  return {
    characters: cache.characters,
    nextPage: cache.nextPage ?? 1,
    seenIds: cache.seenIds ?? cache.characters.map((c) => c.id),
    order: cache.order ?? cache.characters.map((c) => c.id),
  };
}

export function setCachedDeck(snapshot: DeckSnapshot): void {
  const cache: DeckCache = {
    savedAt: Date.now(),
    deckSize: SETTINGS.DECK_SIZE,
    characters: snapshot.characters,
    nextPage: snapshot.nextPage,
    seenIds: snapshot.seenIds,
    order: snapshot.order,
  };
  writeJson(SETTINGS.DECK_CACHE_KEY, cache);
}

export function clearCachedDeck(): void {
  try {
    localStorage.removeItem(SETTINGS.DECK_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

// ── Deck progress (current card index) ───────────────────

export function getSavedIndex(): number {
  const value = readJson<number>(SETTINGS.PROGRESS_KEY, 0);
  return typeof value === 'number' && value >= 0 ? value : 0;
}

export function setSavedIndex(index: number): void {
  writeJson(SETTINGS.PROGRESS_KEY, index);
}

export function clearSavedIndex(): void {
  try {
    localStorage.removeItem(SETTINGS.PROGRESS_KEY);
  } catch {
    /* ignore */
  }
}

// ── Full reset ───────────────────────────────────────────

export function clearAll(): void {
  clearHistory();
  clearCachedDeck();
  clearSavedIndex();
}
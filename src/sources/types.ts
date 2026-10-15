import type { Character, DeckFilter } from '../types/character';

export interface FilterOption {
  id: DeckFilter;
  label: string;
  subtitle: string;
}

export interface FetchResult {
  characters: Character[];
  nextPage: number;
  exhausted: boolean;
}

export interface SourceDefinition {
  /** Unique id, used for storage keys and routing. */
  id: string;
  /** Display name shown on the landing screen. */
  name: string;
  /** Short description shown under the name. */
  subtitle: string;
  /** Filter options specific to this source. */
  filters: FilterOption[];

  /**
   * Fetch a batch of characters.
   * @param excludeIds – ids already seen, so we don't repeat them
   * @param startPage  – page to start from
   * @param onProgress – optional progress callback (loaded, total)
   * @param target     – desired number of characters to return
   * @param randomStart – if true, pick a random starting page for freshness
   */
  fetch: (
    excludeIds: Set<number>,
    startPage: number,
    onProgress: ((loaded: number, total: number) => void) | undefined,
    target: number,
    randomStart: boolean
  ) => Promise<FetchResult>;

  /** Filter the deck to only the characters matching the given filter id. */
  filter: (deck: Character[], filter: DeckFilter) => Character[];
}
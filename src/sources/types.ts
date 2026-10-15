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
  id: string;
  name: string;
  subtitle: string;
  filters: FilterOption[];
  fetch: (
    filter: DeckFilter,
    excludeIds: Set<number>,
    startPage: number,
    onProgress: ((loaded: number, total: number) => void) | undefined,
    target: number,
    randomStart: boolean
  ) => Promise<FetchResult>;
  filter: (deck: Character[], filter: DeckFilter) => Character[];
}
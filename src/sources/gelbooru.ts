import type { Character, DeckFilter } from '../types/character';
import type { SourceDefinition } from './types';

async function fetchGelbooruCharacters(
  _excludeIds: Set<number> = new Set(),
  _startPage = 0,
  _onProgress?: (loaded: number, total: number) => void,
  _target = 100,
  _randomStart = false
) {
  // Placeholder — the real fetch is wired up in the next step.
  throw new Error('BooruMatch is not yet available.');
}

function filterGelbooru(deck: Character[], filter: DeckFilter): Character[] {
  if (filter === 'both') return deck;
  const target = filter === 'waifus' ? 'female' : 'male';
  return deck.filter((c) => (c.gender || '').toLowerCase() === target);
}

export const gelbooruSource: SourceDefinition = {
  id: 'gelbooru',
  name: 'BooruMatch',
  subtitle: 'Booru characters from Gelbooru',
  filters: [
    { id: 'waifus', label: 'Girls', subtitle: '1girl solo' },
    { id: 'husbandos', label: 'Boys', subtitle: '1boy solo' },
    { id: 'both', label: 'Everyone', subtitle: 'No filter' },
  ],
  fetch: fetchGelbooruCharacters,
  filter: filterGelbooru,
};
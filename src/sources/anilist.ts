import { SETTINGS } from '../config/settings';
import type { Character, DeckFilter } from '../types/character';
import type { SourceDefinition } from './types';

const QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      characters(sort: FAVOURITES_DESC) {
        id
        name { full native }
        image { large medium }
        gender
        favourites
      }
    }
  }
`;

interface AniListCharacter {
  id: number;
  name: { full: string; native: string | null };
  image: { large: string | null; medium: string | null };
  gender: string | null;
  favourites: number;
}

interface AniListResponse {
  data?: {
    Page?: {
      characters?: AniListCharacter[];
    };
  };
  errors?: { message: string }[];
}

const PER_PAGE = 50;
/** AniList has ~100k characters; fetch a random slice from the top ~5,000. */
const MAX_START_PAGE = 100;

async function fetchPage(page: number): Promise<AniListCharacter[]> {
  const response = await fetch(SETTINGS.ANILIST_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { page, perPage: PER_PAGE } }),
  });
  if (!response.ok) throw new Error(`AniList request failed (${response.status})`);
  const json: AniListResponse = await response.json();
  if (json.errors && json.errors.length > 0) throw new Error(json.errors[0].message);
  return json.data?.Page?.characters ?? [];
}

function toCharacter(a: AniListCharacter): Character {
  return {
    id: a.id,
    name: a.name.full,
    anime: null,
    imageUrl: a.image.large || a.image.medium || null,
    gender: a.gender,
  };
}

async function fetchAnilistCharacters(
  filter: DeckFilter,
  excludeIds: Set<number> = new Set(),
  _startPage = 1,
  onProgress?: (loaded: number, total: number) => void,
  target: number = SETTINGS.DECK_SIZE,
  randomStart = false
) {
  const collected: Character[] = [];
  const seen = new Set<number>(excludeIds);
  const wantedGender = filter === 'waifus' ? 'female' : 'male';

  // Pick a random page each time to guarantee a different slice
  let currentPage = randomStart ? Math.floor(Math.random() * MAX_START_PAGE) + 1 : 1;
  const pagesToScan = Math.ceil(target / PER_PAGE) + 5;
  let exhausted = false;

  for (let i = 0; i < pagesToScan; i++) {
    let batch: AniListCharacter[];
    try {
      batch = await fetchPage(currentPage);
    } catch (err) {
      if (collected.length === 0) throw err;
      break;
    }

    if (batch.length === 0) {
      // Wrap around if we hit the end
      if (currentPage > 1 && randomStart) {
        currentPage = 1;
        continue;
      }
      exhausted = true;
      break;
    }

    for (const c of batch) {
      const g = (c.gender || '').toLowerCase();
      if (g !== wantedGender) continue;
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      collected.push(toCharacter(c));
      if (collected.length >= target) break;
    }

    onProgress?.(Math.min(collected.length, target), target);
    currentPage += 1;
    if (collected.length >= target) break;
    await new Promise((r) => setTimeout(r, SETTINGS.ANILIST_REQUEST_DELAY_MS));
  }

  // Shuffle so results aren't in favorites order
  for (let i = collected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [collected[i], collected[j]] = [collected[j], collected[i]];
  }

  return { characters: collected, nextPage: currentPage, exhausted };
}

function filterAnilist(deck: Character[], filter: DeckFilter): Character[] {
  const target = filter === 'waifus' ? 'female' : 'male';
  return deck.filter((c) => (c.gender || '').toLowerCase() === target);
}

export const anilistSource: SourceDefinition = {
  id: 'anilist',
  name: 'AniMatch',
  subtitle: 'Anime characters from AniList',
  filters: [
    { id: 'waifus', label: 'Waifus', subtitle: 'She / her' },
    { id: 'husbandos', label: 'Husbandos', subtitle: 'He / him' },
  ],
  fetch: fetchAnilistCharacters,
  filter: filterAnilist,
};
import { SETTINGS } from '../config/settings';
import type { Character, DeckFilter } from '../types/character';
import type { SourceDefinition } from './types';

const QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: POPULARITY_DESC) {
        characters(sort: ROLE, perPage: 25) {
          edges {
            node {
              id
              name { full native }
              image { large medium }
              gender
              favourites
            }
          }
        }
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
      media?: Array<{
        characters?: {
          edges?: Array<{ node?: AniListCharacter }>;
        };
      }>;
    };
  };
  errors?: { message: string }[];
}

const PER_PAGE = 25;
const MAX_START_PAGE = 60;

async function fetchPage(page: number): Promise<AniListCharacter[]> {
  const response = await fetch(SETTINGS.ANILIST_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { page, perPage: PER_PAGE } }),
  });

  if (!response.ok) throw new Error(`AniList request failed (${response.status})`);

  const json: AniListResponse = await response.json();
  if (json.errors && json.errors.length > 0) throw new Error(json.errors[0].message);

  const media = json.data?.Page?.media ?? [];
  const chars: AniListCharacter[] = [];
  for (const m of media) {
    for (const edge of m.characters?.edges ?? []) {
      if (edge.node) chars.push(edge.node);
    }
  }
  return chars;
}

function toCharacter(a: AniListCharacter): Character {
  return {
    id: a.id,
    name: a.name.full,
    imageUrl: a.image.large || a.image.medium || null,
    gender: a.gender,
    favorites: a.favourites ?? 0,
  };
}

async function fetchAnilistCharacters(
  excludeIds: Set<number> = new Set(),
  startPage = 1,
  onProgress?: (loaded: number, total: number) => void,
  target: number = SETTINGS.DECK_SIZE,
  randomStart = false
) {
  const collected: Character[] = [];
  const seen = new Set<number>(excludeIds);
  const pagesToScan = Math.ceil(target / PER_PAGE) + 10;
  let currentPage = randomStart ? Math.floor(Math.random() * MAX_START_PAGE) + 1 : startPage;
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
      if (currentPage > 1 && randomStart) {
        currentPage = 1;
        continue;
      }
      exhausted = true;
      break;
    }

    for (const a of batch) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      collected.push(toCharacter(a));
      if (collected.length >= target) break;
    }

    onProgress?.(Math.min(collected.length, target), target);
    currentPage += 1;

    if (collected.length >= target) break;
    await new Promise((r) => setTimeout(r, SETTINGS.ANILIST_REQUEST_DELAY_MS));
  }

  for (let i = collected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [collected[i], collected[j]] = [collected[j], collected[i]];
  }

  return { characters: collected, nextPage: currentPage, exhausted };
}

function filterAnilist(deck: Character[], filter: DeckFilter): Character[] {
  if (filter === 'both') return deck;
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
    { id: 'both', label: 'Everyone', subtitle: 'No filter' },
  ],
  fetch: fetchAnilistCharacters,
  filter: filterAnilist,
};
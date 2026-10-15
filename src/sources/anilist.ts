import { SETTINGS } from '../config/settings';
import type { Character, DeckFilter } from '../types/character';
import type { SourceDefinition } from './types';

const QUERY = `
  query ($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: POPULARITY_DESC) {
        title { romaji english }
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
        title?: { romaji?: string | null; english?: string | null };
        characters?: { edges?: Array<{ node?: AniListCharacter }> };
      }>;
    };
  };
  errors?: { message: string }[];
}

const PER_PAGE = 25;

// Top ~400 popular anime — the biggest hits people actually recognize.
const TOP_RANGE_END = 16;
// Deeper range for variety — still popular but less mainstream.
const VARIETY_RANGE_END = 120;

async function fetchPage(
  page: number
): Promise<Array<{ character: AniListCharacter; anime: string | null }>> {
  const response = await fetch(SETTINGS.ANILIST_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { page, perPage: PER_PAGE } }),
  });
  if (!response.ok) throw new Error(`AniList request failed (${response.status})`);
  const json: AniListResponse = await response.json();
  if (json.errors && json.errors.length > 0) throw new Error(json.errors[0].message);

  const media = json.data?.Page?.media ?? [];
  const rows: Array<{ character: AniListCharacter; anime: string | null }> = [];
  for (const m of media) {
    const animeTitle = m.title?.english || m.title?.romaji || null;
    for (const edge of m.characters?.edges ?? []) {
      if (edge.node) rows.push({ character: edge.node, anime: animeTitle });
    }
  }
  return rows;
}

function toCharacter(row: { character: AniListCharacter; anime: string | null }): Character {
  const a = row.character;
  return {
    id: a.id,
    name: a.name.full,
    anime: row.anime,
    imageUrl: a.image.large || a.image.medium || null,
    gender: a.gender,
  };
}

/** Fisher-Yates shuffle. */
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Fetch a mix: a couple of pages from the top of popularity, plus a couple
 * from a random deeper page. Combined with the exclude set, this guarantees
 * a fresh, recognizable, varied deck every time.
 */
async function fetchAnilistCharacters(
  filter: DeckFilter,
  excludeIds: Set<number> = new Set(),
  startPage = 1,
  onProgress?: (loaded: number, total: number) => void,
  target: number = SETTINGS.DECK_SIZE,
  randomStart = false
) {
  const seen = new Set<number>(excludeIds);
  const collected: Character[] = [];
  const wantedGender = filter === 'waifus' ? 'female' : 'male';

  // Build a list of pages to scan: 2 from the top, 2-3 from a random deeper section.
  const pagesToScan: number[] = [];

  if (randomStart) {
    // Top: pick 2 random pages from the top range
    const topA = 1 + Math.floor(Math.random() * TOP_RANGE_END);
    const topB = 1 + Math.floor(Math.random() * TOP_RANGE_END);
    pagesToScan.push(topA, topB);

    // Variety: 3 consecutive-ish pages from a random offset in the deeper range
    const varietyStart =
      TOP_RANGE_END + Math.floor(Math.random() * (VARIETY_RANGE_END - TOP_RANGE_END - 3));
    pagesToScan.push(varietyStart, varietyStart + 1, varietyStart + 2);
  } else {
    pagesToScan.push(startPage);
  }

  for (const page of pagesToScan) {
    if (collected.length >= target) break;

    let batch: Array<{ character: AniListCharacter; anime: string | null }>;
    try {
      batch = await fetchPage(page);
    } catch (err) {
      if (collected.length === 0 && pagesToScan.indexOf(page) === 0) throw err;
      continue;
    }

    for (const row of batch) {
      const g = (row.character.gender || '').toLowerCase();
      if (g !== wantedGender) continue;
      if (seen.has(row.character.id)) continue;
      seen.add(row.character.id);
      collected.push(toCharacter(row));
      if (collected.length >= target) break;
    }

    onProgress?.(Math.min(collected.length, target), target);
    await new Promise((r) => setTimeout(r, SETTINGS.ANILIST_REQUEST_DELAY_MS));
  }

  // Shuffle so pages aren't laid out in order
  shuffleInPlace(collected);

  return {
    characters: collected,
    nextPage: 1,
    exhausted: collected.length === 0,
  };
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
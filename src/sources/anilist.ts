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
/** Stop scanning past this page (top ~2,500 popular anime). */
const MAX_PAGE = 100;
/** How far to jump ahead between fetches. Keeps the pool diverse. */
const STRIDE_MIN = 4;
const STRIDE_MAX = 12;

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

async function fetchAnilistCharacters(
  filter: DeckFilter,
  excludeIds: Set<number> = new Set(),
  startPage = 1,
  onProgress?: (loaded: number, total: number) => void,
  target: number = SETTINGS.DECK_SIZE,
  randomStart = false
) {
  const collected: Character[] = [];
  const seen = new Set<number>(excludeIds);
  const wantedGender = filter === 'waifus' ? 'female' : 'male';

  // Always start at page 1 so we get some top-tier hits.
  // Then jump ahead in random strides so we also reach the wider pool.
  let currentPage = randomStart ? 1 : startPage;
  const maxIterations = Math.ceil(target / PER_PAGE) + 20;
  let exhausted = false;

  for (let i = 0; i < maxIterations; i++) {
    let batch: Array<{ character: AniListCharacter; anime: string | null }>;
    try {
      batch = await fetchPage(currentPage);
    } catch (err) {
      if (collected.length === 0) throw err;
      break;
    }

    if (batch.length === 0) {
      exhausted = true;
      break;
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
    if (collected.length >= target) break;

    // Jump ahead by a random stride (unless we're near the end).
    const stride = STRIDE_MIN + Math.floor(Math.random() * (STRIDE_MAX - STRIDE_MIN + 1));
    currentPage = Math.min(currentPage + stride, MAX_PAGE);

    await new Promise((r) => setTimeout(r, SETTINGS.ANILIST_REQUEST_DELAY_MS));
  }

  // Shuffle the whole batch so it feels random
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
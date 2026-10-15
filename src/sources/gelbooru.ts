import type { Character, DeckFilter } from '../types/character';
import type { SourceDefinition, FetchResult } from './types';

interface GelbooruPost {
  id: number;
  file_url: string;
  preview_url: string;
  sample_url: string;
  score: number;
  rating: string;
  tags: string;
}

interface GelbooruResponse {
  post?: GelbooruPost[] | GelbooruPost;
  '@attributes'?: { count?: number; offset?: number };
}

const POSTS_PER_PAGE = 42;

function extractCharacterName(tags: string): string {
  const list = tags.split(' ').filter(Boolean);
  for (const tag of list) {
    const match = tag.match(/^([a-z0-9_]+)_\(/);
    if (match) {
      return match[1]
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
  }
  return 'Unknown';
}

function extractGender(tags: string): 'female' | 'male' | null {
  const list = tags.split(' ');
  const hasGirl = list.includes('1girl');
  const hasBoy = list.includes('1boy');
  if (hasGirl && !hasBoy) return 'female';
  if (hasBoy && !hasGirl) return 'male';
  return null;
}

function toCharacter(post: GelbooruPost): Character {
  return {
    id: post.id,
    name: extractCharacterName(post.tags),
    imageUrl: post.sample_url || post.file_url || null,
    gender: extractGender(post.tags),
    favorites: post.score ?? 0,
  };
}

function normalizeBatch(raw: GelbooruResponse): GelbooruPost[] {
  if (!raw.post) return [];
  return Array.isArray(raw.post) ? raw.post : [raw.post];
}

async function fetchGelbooruCharacters(
  excludeIds: Set<number> = new Set(),
  startPage = 0,
  onProgress?: (loaded: number, total: number) => void,
  target = 200,
  randomStart = false
): Promise<FetchResult> {
  const collected: Character[] = [];
  const seen = new Set<number>(excludeIds);
  const pagesToScan = Math.ceil(target / POSTS_PER_PAGE) + 5;

  // Random starting page for freshness; capped at 500 so we don't land
  // on pages that are empty or heavily filtered.
  let currentPage = randomStart ? Math.floor(Math.random() * 500) : startPage;
  let exhausted = false;

  // solo = single character, rating:explicit = NSFW only.
  // 1girl/1boy determines gender; we query 1girl by default and
  // filter out mismatches client-side.
  const queryTags = 'solo rating:explicit';

  for (let i = 0; i < pagesToScan; i++) {
    let batch: GelbooruPost[] = [];
    try {
      const response = await fetch(
        `/api/gelbooru?tags=${encodeURIComponent(queryTags)}&pid=${currentPage}&limit=${POSTS_PER_PAGE}`
      );
      if (!response.ok) throw new Error(`Proxy returned ${response.status}`);
      const json: GelbooruResponse = await response.json();
      batch = normalizeBatch(json);
    } catch (err) {
      if (collected.length === 0) throw err;
      break;
    }

    if (batch.length === 0) {
      if (currentPage > 0 && randomStart) {
        currentPage = 0;
        continue;
      }
      exhausted = true;
      break;
    }

    for (const post of batch) {
      if (seen.has(post.id)) continue;
      const name = extractCharacterName(post.tags);
      if (name === 'Unknown') continue;
      seen.add(post.id);
      collected.push(toCharacter(post));
      if (collected.length >= target) break;
    }

    onProgress?.(Math.min(collected.length, target), target);
    currentPage += 1;

    if (collected.length >= target) break;
    await new Promise((r) => setTimeout(r, 400));
  }

  for (let i = collected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [collected[i], collected[j]] = [collected[j], collected[i]];
  }

  return { characters: collected, nextPage: currentPage, exhausted };
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
    { id: 'waifus', label: 'Girls', subtitle: 'Solo · explicit' },
    { id: 'husbandos', label: 'Boys', subtitle: 'Solo · explicit' },
    { id: 'both', label: 'Everyone', subtitle: 'No filter' },
  ],
  fetch: fetchGelbooruCharacters,
  filter: filterGelbooru,
};
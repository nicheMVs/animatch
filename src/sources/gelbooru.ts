import type { Character, DeckFilter } from '../types/character';
import type { SourceDefinition, FetchResult } from './types';
import { buildTagString, getSourceSettings } from '../services/devSettings';

interface DanbooruPost {
  id: number;
  file_url: string;
  preview_file_url: string;
  large_file_url: string;
  score: number;
  rating: string;
  tag_string: string;
  tag_string_character: string;
}

const POSTS_PER_PAGE = 100;

function extractCharacterName(post: DanbooruPost): string {
  const chars = post.tag_string_character.trim();
  if (!chars) return 'Unknown';
  const first = chars.split(' ')[0];
  return first
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractGender(tags: string): 'female' | 'male' | null {
  const list = tags.split(' ');
  const hasGirl = list.includes('1girl');
  const hasBoy = list.includes('1boy');
  if (hasGirl && !hasBoy) return 'female';
  if (hasBoy && !hasGirl) return 'male';
  return null;
}

function proxyImage(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  return `/api/danbooru-image?url=${encodeURIComponent(rawUrl)}`;
}

function toCharacter(post: DanbooruPost): Character {
  const image = post.large_file_url || post.preview_file_url || post.file_url;
  return {
    id: post.id,
    name: extractCharacterName(post),
    imageUrl: proxyImage(image),
    gender: extractGender(post.tag_string),
    favorites: post.score ?? 0,
  };
}

async function fetchDanbooruCharacters(
  excludeIds: Set<number> = new Set(),
  startPage = 1,
  onProgress?: (loaded: number, total: number) => void,
  target = 200,
  randomStart = false
): Promise<FetchResult> {
  const collected: Character[] = [];
  const seen = new Set<number>(excludeIds);
  const pagesToScan = Math.ceil(target / POSTS_PER_PAGE) + 5;

  const settings = getSourceSettings('danbooru');
  const queryTags = buildTagString(settings);

  let currentPage = randomStart ? Math.floor(Math.random() * 100) + 1 : startPage;
  let exhausted = false;

  for (let i = 0; i < pagesToScan; i++) {
    let batch: DanbooruPost[] = [];
    try {
      const response = await fetch(
        `/api/danbooru?tags=${encodeURIComponent(queryTags)}&page=${currentPage}&limit=${POSTS_PER_PAGE}`
      );
      if (!response.ok) throw new Error(`Proxy returned ${response.status}`);
      const json = await response.json();
      batch = Array.isArray(json) ? json : [];
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

    for (const post of batch) {
      if (seen.has(post.id)) continue;
      const name = extractCharacterName(post);
      if (name === 'Unknown') continue;
      seen.add(post.id);
      collected.push(toCharacter(post));
      if (collected.length >= target) break;
    }

    onProgress?.(Math.min(collected.length, target), target);
    currentPage += 1;

    if (collected.length >= target) break;
    await new Promise((r) => setTimeout(r, 500));
  }

  for (let i = collected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [collected[i], collected[j]] = [collected[j], collected[i]];
  }

  return { characters: collected, nextPage: currentPage, exhausted };
}

function filterDanbooru(deck: Character[], filter: DeckFilter): Character[] {
  if (filter === 'both') return deck;
  const target = filter === 'waifus' ? 'female' : 'male';
  return deck.filter((c) => (c.gender || '').toLowerCase() === target);
}

export const danbooruSource: SourceDefinition = {
  id: 'gelbooru',
  name: 'BooruMatch',
  subtitle: 'Booru characters from Danbooru',
  filters: [
    { id: 'waifus', label: 'Girls', subtitle: 'Solo · explicit' },
    { id: 'husbandos', label: 'Boys', subtitle: 'Solo · explicit' },
    { id: 'both', label: 'Everyone', subtitle: 'No filter' },
  ],
  fetch: fetchDanbooruCharacters,
  filter: filterDanbooru,
};
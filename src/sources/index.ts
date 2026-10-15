import { anilistSource } from './anilist';
import { danbooruSource } from './gelbooru'; // reuse the same file path
import type { SourceDefinition } from './types';

export const SOURCES: Record<string, SourceDefinition> = {
  anilist: anilistSource,
  gelbooru: danbooruSource, // keep the id 'gelbooru' so LandingScreen still works
};

export type SourceId = keyof typeof SOURCES;

export function getSource(id: SourceId): SourceDefinition {
  return SOURCES[id];
}

export type { SourceDefinition };